/**
 * Pool Ride Service
 * Handles all pooling-related Firestore operations:
 * - Create/join/leave pools
 * - Smart matching algorithm
 * - Pool fare calculation
 * - Real-time pool subscriptions
 * - Driver assignment for pools
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
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../collections';
import { firebaseHandler, type ApiResponse } from '../handler';
import {
  type GeoLocation,
  BookingStatus,
} from '@/lib/types/user.types';
import {
  type PoolRide,
  type PoolParticipant,
  type PoolMatch,
  type PoolFareResult,
  type CreatePoolData,
  type PoolSearchRequest,
  PoolStatus,
  ParticipantStatus,
  POOL_CONFIG,
} from '@/lib/types/pool.types';
import { BookingService, calculateFare } from './booking.service';

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
  const R = 6371;
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
 * Calculate pool fare breakdown
 */
export function calculatePoolFare(baseFare: number, totalSeats: number): PoolFareResult {
  const discount = POOL_CONFIG.poolDiscount;
  const farePerSeat = Math.round(baseFare * (1 - discount));
  const totalPoolFare = farePerSeat * totalSeats;
  const driverEarning = Math.round(baseFare * (1 + POOL_CONFIG.driverPoolBonus));

  return {
    baseFare,
    farePerSeat,
    totalPoolFare,
    driverEarning,
    savingsPerPerson: baseFare - farePerSeat,
    discountPercent: Math.round(discount * 100),
  };
}

/**
 * Pool Service - All pool ride operations
 */
export const PoolService = {
  /**
   * Create a new pool ride
   */
  async createPool(data: CreatePoolData): Promise<ApiResponse<PoolRide>> {
    return firebaseHandler(async () => {
      const poolId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const poolFare = calculatePoolFare(data.baseFare, POOL_CONFIG.maxSeats);

      const expiresAt = new Date(Date.now() + POOL_CONFIG.expiryMinutes * 60 * 1000).toISOString();

      const participant: PoolParticipant = {
        studentId: data.studentId,
        studentName: data.studentName,
        studentPhone: data.studentPhone,
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        seatsNeeded: data.seatsNeeded,
        farePerSeat: poolFare.farePerSeat,
        totalFare: poolFare.farePerSeat * data.seatsNeeded,
        status: ParticipantStatus.JOINED,
        joinedAt: new Date().toISOString(),
        pickedUpAt: null,
        droppedOffAt: null,
        pickupOrder: 1,
        dropoffOrder: 1,
      };

      const poolRide: PoolRide = {
        id: poolId,
        createdBy: data.studentId,
        route: {
          generalPickupArea: data.pickupLocation,
          generalDropArea: data.dropLocation,
          routeDirection: `${data.pickupLocation.address || 'Pickup'} → ${data.dropLocation.address || 'Drop'}`,
        },
        departureTime: data.departureTime,
        isImmediate: data.isImmediate,
        maxSeats: POOL_CONFIG.maxSeats,
        availableSeats: POOL_CONFIG.maxSeats - data.seatsNeeded,
        occupiedSeats: data.seatsNeeded,
        baseFare: data.baseFare,
        farePerSeat: poolFare.farePerSeat,
        poolDiscount: POOL_CONFIG.poolDiscount,
        status: PoolStatus.WAITING,
        participants: [participant],
        driverId: null,
        driverName: null,
        driverPhone: null,
        vehicleNumber: null,
        bookingId: null,
        matchRadius: POOL_CONFIG.matchRadiusKm,
        expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, COLLECTIONS.POOL_RIDES, poolId), {
        ...poolRide,
        serverCreatedAt: serverTimestamp(),
      });

      return poolRide;
    });
  },

  /**
   * Find matching pools for a student's route
   */
  async findMatchingPools(request: PoolSearchRequest): Promise<ApiResponse<PoolMatch[]>> {
    return firebaseHandler(async () => {
      // Query pools that are waiting for passengers
      const poolsQuery = query(
        collection(db, COLLECTIONS.POOL_RIDES),
        where('status', '==', PoolStatus.WAITING),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(poolsQuery);
      const matches: PoolMatch[] = [];

      snapshot.forEach((docSnap) => {
        const pool = docSnap.data() as PoolRide;

        // Skip if pool is expired
        if (new Date(pool.expiresAt) < new Date()) return;

        // Skip if no available seats
        if (pool.availableSeats < request.seatsNeeded) return;

        // Skip if student is already in this pool
        if (pool.participants.some(p => p.studentId === request.studentId)) return;

        // Calculate pickup proximity
        const pickupDeviation = calculateDistance(
          request.pickupLocation,
          pool.route.generalPickupArea
        );

        // Calculate drop proximity
        const dropDeviation = calculateDistance(
          request.dropLocation,
          pool.route.generalDropArea
        );

        // Check if within match radius
        if (pickupDeviation > POOL_CONFIG.maxMatchRadiusKm) return;
        if (dropDeviation > POOL_CONFIG.maxMatchRadiusKm) return;

        // Calculate match score (0-100)
        let matchScore = 0;

        // Proximity scores (max 50 points each)
        const pickupScore = Math.max(0, 50 - (pickupDeviation / POOL_CONFIG.matchRadiusKm) * 50);
        const dropScore = Math.max(0, 50 - (dropDeviation / POOL_CONFIG.matchRadiusKm) * 50);
        matchScore += pickupScore + dropScore;

        const estimatedFare = pool.farePerSeat * request.seatsNeeded;
        const soloFare = calculateFare(request.distance);
        const estimatedSavings = soloFare - estimatedFare;

        matches.push({
          poolId: pool.id,
          pool,
          matchScore: Math.round(matchScore),
          pickupDeviation: Math.round(pickupDeviation * 100) / 100,
          dropDeviation: Math.round(dropDeviation * 100) / 100,
          estimatedFare,
          estimatedSavings,
        });
      });

      // Sort by match score (highest first)
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return matches;
    });
  },

  /**
   * Join an existing pool
   */
  async joinPool(
    poolId: string,
    studentId: string,
    studentName: string,
    studentPhone: string,
    pickupLocation: GeoLocation,
    dropLocation: GeoLocation,
    seatsNeeded: number
  ): Promise<ApiResponse<PoolRide>> {
    return firebaseHandler(async () => {
      const poolRef = doc(db, COLLECTIONS.POOL_RIDES, poolId);
      const poolSnap = await getDoc(poolRef);

      if (!poolSnap.exists()) {
        throw new Error('Pool ride not found');
      }

      const pool = poolSnap.data() as PoolRide;

      if (pool.status !== PoolStatus.WAITING) {
        throw new Error('This pool is no longer accepting passengers');
      }

      if (pool.availableSeats < seatsNeeded) {
        throw new Error(`Only ${pool.availableSeats} seat(s) available`);
      }

      if (pool.participants.some(p => p.studentId === studentId)) {
        throw new Error('You are already in this pool');
      }

      const newParticipant: PoolParticipant = {
        studentId,
        studentName,
        studentPhone,
        pickupLocation,
        dropLocation,
        seatsNeeded,
        farePerSeat: pool.farePerSeat,
        totalFare: pool.farePerSeat * seatsNeeded,
        status: ParticipantStatus.JOINED,
        joinedAt: new Date().toISOString(),
        pickedUpAt: null,
        droppedOffAt: null,
        pickupOrder: pool.participants.length + 1,
        dropoffOrder: pool.participants.length + 1,
      };

      const updatedParticipants = [...pool.participants, newParticipant];
      const newOccupiedSeats = pool.occupiedSeats + seatsNeeded;
      const newAvailableSeats = pool.maxSeats - newOccupiedSeats;

      // If pool has 2+ participants or is full, mark as ready
      const activeParticipants = updatedParticipants.filter(p => p.status !== ParticipantStatus.CANCELLED);
      const newStatus = (activeParticipants.length >= POOL_CONFIG.minParticipants || newAvailableSeats <= 0) 
        ? PoolStatus.READY 
        : PoolStatus.WAITING;

      await updateDoc(poolRef, {
        participants: updatedParticipants,
        occupiedSeats: newOccupiedSeats,
        availableSeats: newAvailableSeats,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      return {
        ...pool,
        participants: updatedParticipants,
        occupiedSeats: newOccupiedSeats,
        availableSeats: newAvailableSeats,
        status: newStatus,
      };
    });
  },

  /**
   * Leave a pool before it starts
   */
  async leavePool(poolId: string, studentId: string): Promise<ApiResponse<void>> {
    return firebaseHandler(async () => {
      const poolRef = doc(db, COLLECTIONS.POOL_RIDES, poolId);
      const poolSnap = await getDoc(poolRef);

      if (!poolSnap.exists()) {
        throw new Error('Pool ride not found');
      }

      const pool = poolSnap.data() as PoolRide;

      if (pool.status !== PoolStatus.WAITING && pool.status !== PoolStatus.READY) {
        throw new Error('Cannot leave pool after ride has started');
      }

      const participant = pool.participants.find(p => p.studentId === studentId);
      if (!participant) {
        throw new Error('You are not in this pool');
      }

      const updatedParticipants = pool.participants.map(p =>
        p.studentId === studentId
          ? { ...p, status: ParticipantStatus.CANCELLED }
          : p
      );

      const activeParticipants = updatedParticipants.filter(
        p => p.status !== ParticipantStatus.CANCELLED
      );

      // If no active participants left, cancel the pool
      if (activeParticipants.length === 0) {
        await updateDoc(poolRef, {
          participants: updatedParticipants,
          status: PoolStatus.CANCELLED,
          availableSeats: pool.maxSeats,
          occupiedSeats: 0,
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      const newOccupiedSeats = activeParticipants.reduce((sum, p) => sum + p.seatsNeeded, 0);

      await updateDoc(poolRef, {
        participants: updatedParticipants,
        occupiedSeats: newOccupiedSeats,
        availableSeats: pool.maxSeats - newOccupiedSeats,
        status: PoolStatus.WAITING,
        updatedAt: new Date().toISOString(),
      });
    });
  },

  /**
   * Pool creator manually marks pool as READY (to start searching for driver)
   * Requires at least minParticipants (2) active participants
   */
  async markPoolReady(poolId: string, studentId: string): Promise<ApiResponse<void>> {
    return firebaseHandler(async () => {
      const poolRef = doc(db, COLLECTIONS.POOL_RIDES, poolId);
      const poolSnap = await getDoc(poolRef);

      if (!poolSnap.exists()) throw new Error('Pool ride not found');

      const pool = poolSnap.data() as PoolRide;

      if (pool.createdBy !== studentId) {
        throw new Error('Only the pool creator can start the pool');
      }

      if (pool.status !== PoolStatus.WAITING) {
        throw new Error('Pool is already started or no longer available');
      }

      const activeParticipants = pool.participants.filter(
        p => p.status !== ParticipantStatus.CANCELLED
      );

      if (activeParticipants.length < POOL_CONFIG.minParticipants) {
        throw new Error(`Need at least ${POOL_CONFIG.minParticipants} riders to start the pool`);
      }

      await updateDoc(poolRef, {
        status: PoolStatus.READY,
        updatedAt: new Date().toISOString(),
      });
    });
  },

  /**
   * Get a pool by ID
   */
  async getPool(poolId: string): Promise<ApiResponse<PoolRide | null>> {
    return firebaseHandler(async () => {
      const poolSnap = await getDoc(doc(db, COLLECTIONS.POOL_RIDES, poolId));
      return poolSnap.exists() ? (poolSnap.data() as PoolRide) : null;
    });
  },

  /**
   * Get student's active pools
   */
  async getStudentActivePools(studentId: string): Promise<ApiResponse<PoolRide[]>> {
    return firebaseHandler(async () => {
      const activeStatuses = [
        PoolStatus.WAITING,
        PoolStatus.READY,
        PoolStatus.DRIVER_ASSIGNED,
        PoolStatus.PICKUP_IN_PROGRESS,
        PoolStatus.IN_PROGRESS,
      ];

      const poolsQuery = query(
        collection(db, COLLECTIONS.POOL_RIDES),
        where('status', 'in', activeStatuses),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(poolsQuery);
      const pools: PoolRide[] = [];

      snapshot.forEach((docSnap) => {
        const pool = docSnap.data() as PoolRide;
        const isParticipant = pool.participants.some(
          p => p.studentId === studentId && p.status !== ParticipantStatus.CANCELLED
        );
        if (isParticipant) {
          pools.push(pool);
        }
      });

      return pools;
    });
  },

  /**
   * Get available pool rides for driver
   */
  async getDriverPoolRequests(): Promise<ApiResponse<PoolRide[]>> {
    return firebaseHandler(async () => {
      const poolsQuery = query(
        collection(db, COLLECTIONS.POOL_RIDES),
        where('status', 'in', [PoolStatus.WAITING, PoolStatus.READY]),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(poolsQuery);
      const pools: PoolRide[] = [];

      snapshot.forEach((docSnap) => {
        const pool = docSnap.data() as PoolRide;
        // Only show non-expired pools
        if (new Date(pool.expiresAt) > new Date()) {
          pools.push(pool);
        }
      });

      return pools;
    });
  },

  /**
   * Get driver's active pool ride (assigned to this driver)
   */
  async getDriverActivePool(driverId: string): Promise<ApiResponse<PoolRide | null>> {
    return firebaseHandler(async () => {
      const poolsQuery = query(
        collection(db, COLLECTIONS.POOL_RIDES),
        where('driverId', '==', driverId),
        where('status', 'in', [PoolStatus.DRIVER_ASSIGNED, PoolStatus.PICKUP_IN_PROGRESS, PoolStatus.IN_PROGRESS])
      );
      const snapshot = await getDocs(poolsQuery);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as PoolRide;
    });
  },

  /**
   * Driver accepts a pool ride
   */
  async acceptPoolRide(
    poolId: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
    vehicleNumber: string
  ): Promise<ApiResponse<PoolRide>> {
    return firebaseHandler(async () => {
      const poolRef = doc(db, COLLECTIONS.POOL_RIDES, poolId);
      const poolSnap = await getDoc(poolRef);

      if (!poolSnap.exists()) {
        throw new Error('Pool ride not found');
      }

      const pool = poolSnap.data() as PoolRide;

      if (pool.status !== PoolStatus.WAITING && pool.status !== PoolStatus.READY) {
        throw new Error('This pool ride is no longer available');
      }

      // Update all active participants to confirmed
      const updatedParticipants = pool.participants.map(p =>
        p.status === ParticipantStatus.JOINED
          ? { ...p, status: ParticipantStatus.CONFIRMED }
          : p
      );

      await updateDoc(poolRef, {
        driverId,
        driverName,
        driverPhone,
        vehicleNumber,
        status: PoolStatus.DRIVER_ASSIGNED,
        participants: updatedParticipants,
        updatedAt: new Date().toISOString(),
      });

      return {
        ...pool,
        driverId,
        driverName,
        driverPhone,
        vehicleNumber,
        status: PoolStatus.DRIVER_ASSIGNED,
        participants: updatedParticipants,
      };
    });
  },

  /**
   * Driver picks up a participant
   */
  async pickupParticipant(poolId: string, studentId: string): Promise<ApiResponse<void>> {
    return firebaseHandler(async () => {
      const poolRef = doc(db, COLLECTIONS.POOL_RIDES, poolId);
      const poolSnap = await getDoc(poolRef);

      if (!poolSnap.exists()) throw new Error('Pool ride not found');

      const pool = poolSnap.data() as PoolRide;

      const updatedParticipants = pool.participants.map(p =>
        p.studentId === studentId
          ? { ...p, status: ParticipantStatus.PICKED_UP, pickedUpAt: new Date().toISOString() }
          : p
      );

      // Check if all active participants are picked up
      const allPickedUp = updatedParticipants
        .filter(p => p.status !== ParticipantStatus.CANCELLED)
        .every(p => p.status === ParticipantStatus.PICKED_UP || p.status === ParticipantStatus.DROPPED_OFF);

      await updateDoc(poolRef, {
        participants: updatedParticipants,
        status: allPickedUp ? PoolStatus.IN_PROGRESS : PoolStatus.PICKUP_IN_PROGRESS,
        updatedAt: new Date().toISOString(),
      });
    });
  },

  /**
   * Driver drops off a participant
   */
  async dropoffParticipant(poolId: string, studentId: string): Promise<ApiResponse<void>> {
    return firebaseHandler(async () => {
      const poolRef = doc(db, COLLECTIONS.POOL_RIDES, poolId);
      const poolSnap = await getDoc(poolRef);

      if (!poolSnap.exists()) throw new Error('Pool ride not found');

      const pool = poolSnap.data() as PoolRide;

      const updatedParticipants = pool.participants.map(p =>
        p.studentId === studentId
          ? { ...p, status: ParticipantStatus.DROPPED_OFF, droppedOffAt: new Date().toISOString() }
          : p
      );

      // Check if all active participants are dropped off
      const allDroppedOff = updatedParticipants
        .filter(p => p.status !== ParticipantStatus.CANCELLED)
        .every(p => p.status === ParticipantStatus.DROPPED_OFF);

      await updateDoc(poolRef, {
        participants: updatedParticipants,
        status: allDroppedOff ? PoolStatus.COMPLETED : pool.status,
        updatedAt: new Date().toISOString(),
      });
    });
  },

  /**
   * Subscribe to pool updates (real-time)
   */
  subscribeToPool(poolId: string, callback: (pool: PoolRide | null) => void): Unsubscribe {
    return onSnapshot(doc(db, COLLECTIONS.POOL_RIDES, poolId), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as PoolRide);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Subscribe to available pool rides for drivers
   */
  subscribeToAvailablePools(callback: (pools: PoolRide[]) => void): Unsubscribe {
    const poolsQuery = query(
      collection(db, COLLECTIONS.POOL_RIDES),
      where('status', 'in', [PoolStatus.WAITING, PoolStatus.READY]),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(poolsQuery, (snapshot) => {
      const pools: PoolRide[] = [];
      snapshot.forEach((docSnap) => {
        const pool = docSnap.data() as PoolRide;
        if (new Date(pool.expiresAt) > new Date()) {
          pools.push(pool);
        }
      });
      callback(pools);
    });
  },

  /**
   * Subscribe to student's active pool rides
   */
  subscribeToStudentPools(studentId: string, callback: (pools: PoolRide[]) => void): Unsubscribe {
    const activeStatuses = [
      PoolStatus.WAITING,
      PoolStatus.READY,
      PoolStatus.DRIVER_ASSIGNED,
      PoolStatus.PICKUP_IN_PROGRESS,
      PoolStatus.IN_PROGRESS,
    ];

    const poolsQuery = query(
      collection(db, COLLECTIONS.POOL_RIDES),
      where('status', 'in', activeStatuses),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(poolsQuery, (snapshot) => {
      const pools: PoolRide[] = [];
      snapshot.forEach((docSnap) => {
        const pool = docSnap.data() as PoolRide;
        const isParticipant = pool.participants.some(
          p => p.studentId === studentId && p.status !== ParticipantStatus.CANCELLED
        );
        if (isParticipant) {
          pools.push(pool);
        }
      });
      callback(pools);
    });
  },

  /**
   * Get pool ride history for student
   */
  async getStudentPoolHistory(studentId: string): Promise<ApiResponse<PoolRide[]>> {
    return firebaseHandler(async () => {
      const poolsQuery = query(
        collection(db, COLLECTIONS.POOL_RIDES),
        where('status', 'in', [PoolStatus.COMPLETED, PoolStatus.CANCELLED, PoolStatus.EXPIRED]),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(poolsQuery);
      const pools: PoolRide[] = [];

      snapshot.forEach((docSnap) => {
        const pool = docSnap.data() as PoolRide;
        const wasParticipant = pool.participants.some(p => p.studentId === studentId);
        if (wasParticipant) {
          pools.push(pool);
        }
      });

      return pools;
    });
  },

};
