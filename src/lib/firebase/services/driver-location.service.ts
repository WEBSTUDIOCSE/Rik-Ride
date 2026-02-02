/**
 * Driver Location Service
 * Manages driver location updates and real-time tracking in Firestore
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { throttler, LocationUpdateBatcher } from '../../services/rate-limiter';

// Types
export interface DriverLocation {
  driverId: string;
  location: {
    lat: number;
    lng: number;
  };
  geoPoint: GeoPoint;
  heading?: number;
  speed?: number;
  accuracy?: number;
  isOnline: boolean;
  isAvailable: boolean;
  currentBookingId?: string;
  lastUpdated: Timestamp;
}

export interface NearbyDriver {
  driverId: string;
  name: string;
  phone?: string;
  vehicleNumber?: string;
  distance: number; // in meters
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
}

// Collection name
const DRIVER_LOCATIONS_COLLECTION = 'driverLocations';

/**
 * Driver Location Service
 */
class DriverLocationService {
  private static instance: DriverLocationService | null = null;
  private locationBatcher: LocationUpdateBatcher | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DriverLocationService {
    if (!DriverLocationService.instance) {
      DriverLocationService.instance = new DriverLocationService();
    }
    return DriverLocationService.instance;
  }

  /**
   * Initialize location service for a driver
   */
  async initialize(driverId: string): Promise<void> {
    if (this.isInitialized) return;

    // Create or update driver location document
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Initialize with default values
      await setDoc(docRef, {
        driverId,
        isOnline: false,
        isAvailable: false,
        lastUpdated: serverTimestamp(),
      });
    }

    // Initialize batcher
    this.locationBatcher = new LocationUpdateBatcher(5000);
    this.locationBatcher.start(async (updates) => {
      for (const [id, location] of updates) {
        await this.updateLocationInFirestore(id, location.lat, location.lng);
      }
    });

    this.isInitialized = true;
  }

  /**
   * Update driver location in Firestore
   */
  private async updateLocationInFirestore(
    driverId: string,
    lat: number,
    lng: number,
    additionalData?: Partial<DriverLocation>
  ): Promise<void> {
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);

    await updateDoc(docRef, {
      location: { lat, lng },
      geoPoint: new GeoPoint(lat, lng),
      lastUpdated: serverTimestamp(),
      ...additionalData,
    });
  }

  /**
   * Update driver location (throttled and batched)
   */
  updateLocation(
    driverId: string,
    lat: number,
    lng: number,
    options?: {
      heading?: number;
      speed?: number;
      accuracy?: number;
    }
  ): void {
    // Throttle updates to every 3 seconds
    if (!throttler.shouldExecute(`location:${driverId}`, 3000)) {
      return;
    }

    this.locationBatcher?.addUpdate(driverId, lat, lng);
  }

  /**
   * Set driver online status
   */
  async setOnlineStatus(driverId: string, isOnline: boolean): Promise<void> {
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);

    await updateDoc(docRef, {
      isOnline,
      lastUpdated: serverTimestamp(),
    });
  }

  /**
   * Set driver availability status
   */
  async setAvailability(driverId: string, isAvailable: boolean): Promise<void> {
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);

    await updateDoc(docRef, {
      isAvailable,
      lastUpdated: serverTimestamp(),
    });
  }

  /**
   * Set current booking for driver
   */
  async setCurrentBooking(driverId: string, bookingId: string | null): Promise<void> {
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);

    await updateDoc(docRef, {
      currentBookingId: bookingId || null,
      isAvailable: bookingId ? false : true,
      lastUpdated: serverTimestamp(),
    });
  }

  /**
   * Get driver's current location
   */
  async getDriverLocation(driverId: string): Promise<DriverLocation | null> {
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as DriverLocation;
    }

    return null;
  }

  /**
   * Subscribe to driver location updates
   */
  subscribeToDriverLocation(
    driverId: string,
    callback: (location: DriverLocation | null) => void
  ): () => void {
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as DriverLocation);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to driver location:', error);
        callback(null);
      }
    );
  }

  /**
   * Find nearby available drivers
   * Note: For production, consider using GeoFirestore or Firebase GeoQueries extension
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<NearbyDriver[]> {
    // Get all online and available drivers
    const q = query(
      collection(db, DRIVER_LOCATIONS_COLLECTION),
      where('isOnline', '==', true),
      where('isAvailable', '==', true)
    );

    const snapshot = await getDocs(q);
    const nearbyDrivers: NearbyDriver[] = [];

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as DriverLocation;

      if (!data.location) continue;

      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(
        lat,
        lng,
        data.location.lat,
        data.location.lng
      );

      // Convert radius to meters
      const radiusMeters = radiusKm * 1000;

      if (distance <= radiusMeters) {
        // Get driver details
        const driverDocRef = doc(db, 'users', data.driverId);
        const driverDocSnap = await getDoc(driverDocRef);
        const driverData = driverDocSnap.data() as Record<string, unknown> | undefined;

        nearbyDrivers.push({
          driverId: data.driverId,
          name: (driverData?.displayName as string) || 'Driver',
          phone: driverData?.phone as string | undefined,
          vehicleNumber: driverData?.vehicleNumber as string | undefined,
          distance: Math.round(distance),
          location: data.location,
          rating: driverData?.rating as number | undefined,
        });
      }
    }

    // Sort by distance
    return nearbyDrivers.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Clean up offline drivers (for admin/cron)
   * Marks drivers as offline if they haven't updated in the specified time
   */
  async cleanupOfflineDrivers(maxInactiveMinutes: number = 10): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - maxInactiveMinutes);

    const q = query(
      collection(db, DRIVER_LOCATIONS_COLLECTION),
      where('isOnline', '==', true),
      where('lastUpdated', '<', Timestamp.fromDate(cutoffTime))
    );

    const snapshot = await getDocs(q);
    let cleanedCount = 0;

    for (const docSnapshot of snapshot.docs) {
      await updateDoc(docSnapshot.ref, {
        isOnline: false,
        isAvailable: false,
        lastUpdated: serverTimestamp(),
      });
      cleanedCount++;
    }

    return cleanedCount;
  }

  /**
   * Delete driver location document (for account deletion)
   */
  async deleteDriverLocation(driverId: string): Promise<void> {
    const docRef = doc(db, DRIVER_LOCATIONS_COLLECTION, driverId);
    await deleteDoc(docRef);
  }

  /**
   * Cleanup on service shutdown
   */
  cleanup(): void {
    this.locationBatcher?.stop();
    this.locationBatcher = null;
    this.isInitialized = false;
  }
}

// Export singleton
export const driverLocationService = DriverLocationService.getInstance();

// Export the class for testing
export { DriverLocationService };
