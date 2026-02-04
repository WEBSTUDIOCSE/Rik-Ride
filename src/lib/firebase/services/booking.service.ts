/**
 * Booking Service
 * Handles all booking-related Firestore operations
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../collections';
import { firebaseHandler, type ApiResponse } from '../handler';
import {
  type Booking,
  type DriverProfile,
  type GeoLocation,
  BookingStatus,
  DriverStatus,
  VerificationStatus,
} from '@/lib/types/user.types';
import { BookingNotifications } from './notification-helpers';
import { ChatService } from './chat.service';

/**
 * Fare calculation constants
 */
const FARE_CONFIG = {
  baseFare: 20, // Base fare in INR
  perKmRate: 10, // Rate per km in INR
  waitingChargePerMin: 2, // Waiting charge per minute
  minimumFare: 30, // Minimum fare
  peakHourMultiplier: 1.5, // Peak hour fare multiplier (7-10 AM, 5-8 PM)
};

/**
 * Create booking data interface
 */
export interface CreateBookingData {
  studentId: string;
  studentName: string;
  studentPhone: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  pickupLocation: GeoLocation;
  dropLocation: GeoLocation;
  distance: number;
  fare: number;
}

/**
 * Nearby driver interface
 */
export interface NearbyDriver extends DriverProfile {
  distance: number; // Distance in km from pickup point
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if current time is peak hour
 */
function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
}

/**
 * Calculate fare based on distance
 */
export function calculateFare(distanceKm: number): number {
  let fare = FARE_CONFIG.baseFare + distanceKm * FARE_CONFIG.perKmRate;
  
  if (isPeakHour()) {
    fare *= FARE_CONFIG.peakHourMultiplier;
  }
  
  return Math.max(Math.round(fare), FARE_CONFIG.minimumFare);
}

/**
 * Booking Service for Firestore operations
 */
export const BookingService = {
  /**
   * Get online drivers near a location
   */
  getNearbyDrivers: async (
    pickupLocation: GeoLocation,
    radiusKm: number = 5
  ): Promise<ApiResponse<NearbyDriver[]>> => {
    return firebaseHandler(async () => {
      // Get all online, verified drivers
      const q = query(
        collection(db, COLLECTIONS.DRIVERS),
        where('onlineStatus', '==', DriverStatus.ONLINE),
        where('verificationStatus', '==', VerificationStatus.APPROVED)
      );

      const snapshot = await getDocs(q);
      const drivers = snapshot.docs.map((doc) => doc.data() as DriverProfile);

      // Filter by distance and add distance property
      const nearbyDrivers: NearbyDriver[] = drivers
        .filter((driver) => driver.currentLocation !== null)
        .map((driver) => ({
          ...driver,
          distance: calculateDistance(pickupLocation, driver.currentLocation!),
        }))
        .filter((driver) => driver.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      return nearbyDrivers;
    }, 'booking/get-nearby-drivers');
  },

  /**
   * Create a new booking request
   */
  createBooking: async (
    data: CreateBookingData
  ): Promise<ApiResponse<Booking>> => {
    return firebaseHandler(async () => {
      const bookingId = crypto.randomUUID();
      const now = new Date().toISOString();

      const booking: Booking = {
        id: bookingId,
        studentId: data.studentId,
        studentName: data.studentName,
        studentPhone: data.studentPhone,
        driverId: data.driverId,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        vehicleNumber: data.vehicleNumber,
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        distance: data.distance,
        fare: data.fare,
        status: BookingStatus.PENDING,
        bookingTime: now,
        acceptedAt: null,
        rideStartTime: null,
        rideEndTime: null,
        paymentStatus: 'pending',
        paymentMethod: null,
        studentRating: null,
        studentReview: null,
        driverRating: null,
        driverReview: null,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
        ...booking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create chat room for this booking
      try {
        await ChatService.createChatRoom(
          bookingId,
          data.studentId,
          data.studentName,
          data.driverId,
          data.driverName
        );
      } catch (chatError) {
        console.error('Failed to create chat room:', chatError);
      }

      // Send notification to driver about new booking request
      try {
        await BookingNotifications.newBookingRequest(booking);
      } catch (notifError) {
        console.error('Failed to send booking notification:', notifError);
      }

      return booking;
    }, 'booking/create');
  },

  /**
   * Get booking by ID
   */
  getBooking: async (bookingId: string): Promise<ApiResponse<Booking | null>> => {
    return firebaseHandler(async () => {
      const docRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as Booking;
      }
      return null;
    }, 'booking/get');
  },

  /**
   * Accept booking (Driver)
   */
  acceptBooking: async (
    bookingId: string,
    driverId: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      if (booking.driverId !== driverId) {
        throw new Error('Unauthorized to accept this booking');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new Error('Booking is no longer available');
      }

      await updateDoc(bookingRef, {
        status: BookingStatus.ACCEPTED,
        acceptedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });

      // Send notification to student that driver accepted
      try {
        await BookingNotifications.bookingAccepted(booking);
      } catch (notifError) {
        console.error('Failed to send acceptance notification:', notifError);
      }

      return true;
    }, 'booking/accept');
  },

  /**
   * Reject booking (Driver)
   */
  rejectBooking: async (
    bookingId: string,
    driverId: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      if (booking.driverId !== driverId) {
        throw new Error('Unauthorized to reject this booking');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new Error('Booking is no longer pending');
      }

      await updateDoc(bookingRef, {
        status: BookingStatus.CANCELLED,
        updatedAt: serverTimestamp(),
      });

      return true;
    }, 'booking/reject');
  },

  /**
   * Start ride (Driver)
   */
  startRide: async (
    bookingId: string,
    driverId: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      if (booking.driverId !== driverId) {
        throw new Error('Unauthorized to start this ride');
      }

      if (booking.status !== BookingStatus.ACCEPTED) {
        throw new Error('Booking must be accepted to start ride');
      }

      await updateDoc(bookingRef, {
        status: BookingStatus.IN_PROGRESS,
        rideStartTime: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });

      // Disable chat when ride starts
      try {
        await ChatService.disableChat(bookingId);
      } catch (chatError) {
        console.error('Failed to disable chat:', chatError);
      }

      // Send notification to student that ride has started
      try {
        await BookingNotifications.rideStarted(booking);
      } catch (notifError) {
        console.error('Failed to send ride started notification:', notifError);
      }

      return true;
    }, 'booking/start-ride');
  },

  /**
   * Complete ride (Driver)
   */
  completeRide: async (
    bookingId: string,
    driverId: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      if (booking.driverId !== driverId) {
        throw new Error('Unauthorized to complete this ride');
      }

      if (booking.status !== BookingStatus.IN_PROGRESS) {
        throw new Error('Ride must be in progress to complete');
      }

      await updateDoc(bookingRef, {
        status: BookingStatus.COMPLETED,
        rideEndTime: new Date().toISOString(),
        paymentStatus: 'completed',
        updatedAt: serverTimestamp(),
      });

      // Update driver stats
      const driverRef = doc(db, COLLECTIONS.DRIVERS, driverId);
      const driverSnap = await getDoc(driverRef);
      
      if (driverSnap.exists()) {
        const driver = driverSnap.data() as DriverProfile;
        await updateDoc(driverRef, {
          totalRides: driver.totalRides + 1,
          totalEarnings: driver.totalEarnings + booking.fare,
          updatedAt: serverTimestamp(),
        });
      }

      // Update student stats
      const studentRef = doc(db, COLLECTIONS.STUDENTS, booking.studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const student = studentSnap.data();
        await updateDoc(studentRef, {
          totalRides: (student.totalRides || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      }

      // Send notification about ride completion
      try {
        await BookingNotifications.rideCompleted(booking);
      } catch (notifError) {
        console.error('Failed to send ride completed notification:', notifError);
      }

      return true;
    }, 'booking/complete-ride');
  },

  /**
   * Cancel booking (Student)
   * Can only cancel if booking is still PENDING (before driver accepts)
   */
  cancelBooking: async (
    bookingId: string,
    studentId: string,
    reason?: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      if (booking.studentId !== studentId) {
        throw new Error('Unauthorized to cancel this booking');
      }

      if (booking.status === BookingStatus.COMPLETED) {
        throw new Error('Cannot cancel a completed ride');
      }

      if (booking.status === BookingStatus.IN_PROGRESS) {
        throw new Error('Cannot cancel a ride in progress');
      }

      // Block cancellation after driver accepts
      if (booking.status === BookingStatus.ACCEPTED) {
        throw new Error('Cannot cancel after driver has accepted. Please contact the driver directly.');
      }

      await updateDoc(bookingRef, {
        status: BookingStatus.CANCELLED,
        updatedAt: serverTimestamp(),
      });

      return true;
    }, 'booking/cancel');
  },

  /**
   * Get pending bookings for driver
   */
  getDriverPendingBookings: async (
    driverId: string
  ): Promise<ApiResponse<Booking[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('driverId', '==', driverId),
        where('status', '==', BookingStatus.PENDING)
      );

      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map((doc) => doc.data() as Booking);
      
      return bookings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }, 'booking/driver-pending');
  },

  /**
   * Get active booking for driver (accepted or in progress)
   */
  getDriverActiveBooking: async (
    driverId: string
  ): Promise<ApiResponse<Booking | null>> => {
    return firebaseHandler(async () => {
      // Check for in-progress booking first
      let q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('driverId', '==', driverId),
        where('status', '==', BookingStatus.IN_PROGRESS)
      );

      let snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Booking;
      }

      // Check for accepted booking
      q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('driverId', '==', driverId),
        where('status', '==', BookingStatus.ACCEPTED)
      );

      snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Booking;
      }

      return null;
    }, 'booking/driver-active');
  },

  /**
   * Get active booking for student
   */
  getStudentActiveBooking: async (
    studentId: string
  ): Promise<ApiResponse<Booking | null>> => {
    return firebaseHandler(async () => {
      // Check for in-progress booking first
      let q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('studentId', '==', studentId),
        where('status', '==', BookingStatus.IN_PROGRESS)
      );

      let snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Booking;
      }

      // Check for accepted booking
      q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('studentId', '==', studentId),
        where('status', '==', BookingStatus.ACCEPTED)
      );

      snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Booking;
      }

      // Check for pending booking
      q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('studentId', '==', studentId),
        where('status', '==', BookingStatus.PENDING)
      );

      snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Booking;
      }

      return null;
    }, 'booking/student-active');
  },

  /**
   * Get booking history for driver
   */
  getDriverBookingHistory: async (
    driverId: string,
    limitCount: number = 50
  ): Promise<ApiResponse<Booking[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('driverId', '==', driverId),
        where('status', 'in', [BookingStatus.COMPLETED, BookingStatus.CANCELLED])
      );

      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map((doc) => doc.data() as Booking);
      
      return bookings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limitCount);
    }, 'booking/driver-history');
  },

  /**
   * Get booking history for student
   */
  getStudentBookingHistory: async (
    studentId: string,
    limitCount: number = 50
  ): Promise<ApiResponse<Booking[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.BOOKINGS),
        where('studentId', '==', studentId),
        where('status', 'in', [BookingStatus.COMPLETED, BookingStatus.CANCELLED])
      );

      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map((doc) => doc.data() as Booking);
      
      return bookings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limitCount);
    }, 'booking/student-history');
  },

  /**
   * Rate ride (Student rates driver)
   */
  rateDriver: async (
    bookingId: string,
    studentId: string,
    rating: number,
    review?: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      if (booking.studentId !== studentId) {
        throw new Error('Unauthorized to rate this booking');
      }

      if (booking.status !== BookingStatus.COMPLETED) {
        throw new Error('Can only rate completed rides');
      }

      if (booking.driverRating !== null) {
        throw new Error('Ride already rated');
      }

      // Update booking with rating
      await updateDoc(bookingRef, {
        driverRating: rating,
        driverReview: review || null,
        updatedAt: serverTimestamp(),
      });

      // Update driver's average rating
      const driverRef = doc(db, COLLECTIONS.DRIVERS, booking.driverId);
      const driverSnap = await getDoc(driverRef);
      
      if (driverSnap.exists()) {
        const driver = driverSnap.data() as DriverProfile;
        const newTotalRatings = driver.totalRatings + 1;
        const newRating = ((driver.rating * driver.totalRatings) + rating) / newTotalRatings;
        
        await updateDoc(driverRef, {
          rating: Math.round(newRating * 10) / 10,
          totalRatings: newTotalRatings,
          updatedAt: serverTimestamp(),
        });
      }

      return true;
    }, 'booking/rate-driver');
  },

  /**
   * Subscribe to booking updates (real-time)
   */
  subscribeToBooking: (
    bookingId: string,
    callback: (booking: Booking | null) => void
  ): Unsubscribe => {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    
    return onSnapshot(bookingRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Booking);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Subscribe to driver's pending bookings (real-time)
   */
  subscribeToDriverPendingBookings: (
    driverId: string,
    callback: (bookings: Booking[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('driverId', '==', driverId),
      where('status', '==', BookingStatus.PENDING)
    );

    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map((doc) => doc.data() as Booking);
      callback(bookings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    });
  },

  /**
   * Subscribe to student's active booking (real-time)
   */
  subscribeToStudentActiveBooking: (
    studentId: string,
    callback: (booking: Booking | null) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('studentId', '==', studentId),
      where('status', 'in', [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS])
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Return the first active booking
        callback(snapshot.docs[0].data() as Booking);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Get estimated arrival time in minutes
   */
  getEstimatedArrival: (distanceKm: number, isPickup: boolean = true): number => {
    // Assume average speed of 25 km/h in city traffic
    const averageSpeedKmH = isPickup ? 25 : 30;
    const timeHours = distanceKm / averageSpeedKmH;
    const timeMinutes = Math.ceil(timeHours * 60);
    return Math.max(timeMinutes, 2); // Minimum 2 minutes
  },
};
