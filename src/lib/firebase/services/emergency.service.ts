/**
 * Emergency Service
 * Handles emergency contacts, SOS alerts, and ride sharing
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { firebaseHandler, type ApiResponse } from '../handler';
import { COLLECTIONS } from '../collections';
import type { EmergencyContact, Booking } from '@/lib/types/user.types';

/**
 * SOS Alert status
 */
export enum SOSStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
}

/**
 * SOS Alert interface
 */
export interface SOSAlert {
  id: string;
  bookingId: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: SOSStatus;
  emergencyContactsNotified: string[];
  notes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

/**
 * Shared Ride Details interface
 */
export interface SharedRideDetails {
  id: string;
  bookingId: string;
  sharedWith: string; // phone number or email
  sharedBy: string; // student ID
  studentName: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  pickupLocation: string;
  dropLocation: string;
  shareLink: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Emergency Service
 */
export const EmergencyService = {
  /**
   * Add emergency contact for a student (supports multiple contacts)
   */
  addEmergencyContact: async (
    studentId: string,
    contact: EmergencyContact
  ): Promise<ApiResponse<EmergencyContact & { id: string }>> => {
    return firebaseHandler(async () => {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (!studentSnap.exists()) {
        throw new Error('Student not found');
      }

      const studentData = studentSnap.data();
      const existingContacts = studentData.emergencyContacts || [];
      
      // Generate unique ID for the contact
      const contactId = crypto.randomUUID();
      const newContact = { ...contact, id: contactId };
      
      // Add to emergency contacts array
      await updateDoc(studentRef, {
        emergencyContacts: [...existingContacts, newContact],
        updatedAt: serverTimestamp(),
      });

      return newContact;
    }, 'emergency/add-contact');
  },

  /**
   * Update emergency contact for a student
   */
  updateEmergencyContact: async (
    studentId: string,
    contact: EmergencyContact
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      
      await updateDoc(studentRef, {
        emergencyContact: contact,
        updatedAt: serverTimestamp(),
      });

      return true;
    }, 'emergency/update-contact');
  },

  /**
   * Update parent phone for a student
   */
  updateParentPhone: async (
    studentId: string,
    parentPhone: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      
      await updateDoc(studentRef, {
        parentPhone,
        updatedAt: serverTimestamp(),
      });

      return true;
    }, 'emergency/update-parent-phone');
  },

  /**
   * Get emergency contact for a student
   */
  getEmergencyContact: async (
    studentId: string
  ): Promise<ApiResponse<EmergencyContact | null>> => {
    return firebaseHandler(async () => {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const data = studentSnap.data();
        return data.emergencyContact || null;
      }

      return null;
    }, 'emergency/get-contact');
  },

  /**
   * Get all emergency contacts for a student
   */
  getEmergencyContacts: async (
    studentId: string
  ): Promise<ApiResponse<Array<EmergencyContact & { id: string }>>> => {
    return firebaseHandler(async () => {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const data = studentSnap.data();
        return data.emergencyContacts || [];
      }

      return [];
    }, 'emergency/get-contacts');
  },

  /**
   * Delete emergency contact for a student
   */
  deleteEmergencyContact: async (
    studentId: string,
    contactId: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (!studentSnap.exists()) {
        throw new Error('Student not found');
      }

      const studentData = studentSnap.data();
      const existingContacts = studentData.emergencyContacts || [];
      
      // Filter out the contact to delete
      const updatedContacts = existingContacts.filter(
        (c: EmergencyContact & { id: string }) => c.id !== contactId
      );
      
      await updateDoc(studentRef, {
        emergencyContacts: updatedContacts,
        updatedAt: serverTimestamp(),
      });

      return true;
    }, 'emergency/delete-contact');
  },

  /**
   * Trigger SOS Alert
   */
  triggerSOS: async (
    bookingId: string,
    studentId: string,
    currentLocation: { lat: number; lng: number; address?: string }
  ): Promise<ApiResponse<SOSAlert>> => {
    return firebaseHandler(async () => {
      // Get booking details
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      // Get student's emergency contact
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      const studentSnap = await getDoc(studentRef);
      const studentData = studentSnap.data();
      
      const emergencyContacts: string[] = [];
      
      if (studentData?.emergencyContact?.phone) {
        emergencyContacts.push(studentData.emergencyContact.phone);
      }
      if (studentData?.parentPhone) {
        emergencyContacts.push(studentData.parentPhone);
      }

      const now = new Date().toISOString();
      const alertId = crypto.randomUUID();

      const sosAlert: SOSAlert = {
        id: alertId,
        bookingId,
        studentId,
        studentName: booking.studentName,
        studentPhone: booking.studentPhone,
        driverId: booking.driverId,
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        location: currentLocation,
        status: SOSStatus.ACTIVE,
        emergencyContactsNotified: emergencyContacts,
        notes: null,
        createdAt: now,
        resolvedAt: null,
        resolvedBy: null,
      };

      // Save SOS alert
      await setDoc(doc(db, 'sosAlerts', alertId), {
        ...sosAlert,
        createdAt: serverTimestamp(),
      });

      // Update booking with SOS status
      await updateDoc(bookingRef, {
        hasSOS: true,
        sosAlertId: alertId,
        updatedAt: serverTimestamp(),
      });

      // TODO: Send SMS/notification to emergency contacts
      // This would integrate with a service like Twilio
      return sosAlert;
    }, 'emergency/trigger-sos');
  },

  /**
   * Resolve SOS Alert
   */
  resolveSOS: async (
    alertId: string,
    resolvedBy: string,
    status: SOSStatus = SOSStatus.RESOLVED,
    notes?: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const alertRef = doc(db, 'sosAlerts', alertId);
      
      await updateDoc(alertRef, {
        status,
        notes: notes || null,
        resolvedAt: new Date().toISOString(),
        resolvedBy,
      });

      // Update booking
      const alertSnap = await getDoc(alertRef);
      if (alertSnap.exists()) {
        const alert = alertSnap.data() as SOSAlert;
        await updateDoc(doc(db, COLLECTIONS.BOOKINGS, alert.bookingId), {
          hasSOS: false,
          updatedAt: serverTimestamp(),
        });
      }

      return true;
    }, 'emergency/resolve-sos');
  },

  /**
   * Get active SOS alerts (for admin)
   */
  getActiveSOSAlerts: async (): Promise<ApiResponse<SOSAlert[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, 'sosAlerts'),
        where('status', '==', SOSStatus.ACTIVE),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as SOSAlert);
    }, 'emergency/get-active-sos');
  },

  /**
   * Share ride details with emergency contact
   */
  shareRideDetails: async (
    bookingId: string,
    studentId: string,
    shareWith: string // phone or email
  ): Promise<ApiResponse<SharedRideDetails>> => {
    return firebaseHandler(async () => {
      // Get booking details
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        throw new Error('Booking not found');
      }

      const booking = bookingSnap.data() as Booking;

      if (booking.studentId !== studentId) {
        throw new Error('Unauthorized to share this ride');
      }

      const shareId = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Link expires in 24 hours

      // Generate share link (would be a public tracking page)
      const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rik-ride.vercel.app'}/track/${shareId}`;

      const sharedDetails: SharedRideDetails = {
        id: shareId,
        bookingId,
        sharedWith: shareWith,
        sharedBy: studentId,
        studentName: booking.studentName,
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        vehicleNumber: booking.vehicleNumber,
        pickupLocation: booking.pickupLocation?.address || 'Pickup',
        dropLocation: booking.dropLocation?.address || 'Drop',
        shareLink,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save shared ride details
      await setDoc(doc(db, 'sharedRides', shareId), {
        ...sharedDetails,
        createdAt: serverTimestamp(),
      });

      // TODO: Send SMS/email with share link
      return sharedDetails;
    }, 'emergency/share-ride');
  },

  /**
   * Get shared ride details (public access)
   */
  getSharedRide: async (
    shareId: string
  ): Promise<ApiResponse<SharedRideDetails | null>> => {
    return firebaseHandler(async () => {
      const shareRef = doc(db, 'sharedRides', shareId);
      const shareSnap = await getDoc(shareRef);

      if (!shareSnap.exists()) {
        return null;
      }

      const data = shareSnap.data() as SharedRideDetails;
      
      // Check if expired
      if (new Date(data.expiresAt) < new Date()) {
        return null;
      }

      return data;
    }, 'emergency/get-shared-ride');
  },
};

export default EmergencyService;
