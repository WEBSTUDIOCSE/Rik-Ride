/**
 * Pool Ride Types for Rik-Ride
 * Defines all pooling-related types and enums
 */

import { GeoLocation, BookingStatus } from './user.types';

/**
 * Pool ride status
 */
export enum PoolStatus {
  WAITING = 'waiting',          // Waiting for more passengers
  READY = 'ready',              // Enough passengers, searching for driver
  DRIVER_ASSIGNED = 'driver_assigned', // Driver accepted pool ride
  PICKUP_IN_PROGRESS = 'pickup_in_progress', // Picking up passengers
  IN_PROGRESS = 'in_progress',  // All picked up, ride ongoing
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',          // No match found before timeout
}

/**
 * Ride type - solo or pool
 */
export enum RideType {
  SOLO = 'solo',
  POOL = 'pool',
}

/**
 * Pool participant status
 */
export enum ParticipantStatus {
  JOINED = 'joined',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked_up',
  DROPPED_OFF = 'dropped_off',
  CANCELLED = 'cancelled',
}

/**
 * Pool participant interface
 */
export interface PoolParticipant {
  studentId: string;
  studentName: string;
  studentPhone: string;
  pickupLocation: GeoLocation;
  dropLocation: GeoLocation;
  seatsNeeded: number;
  farePerSeat: number;
  totalFare: number;
  status: ParticipantStatus;
  joinedAt: string;
  pickedUpAt: string | null;
  droppedOffAt: string | null;
  pickupOrder: number;    // Sequence in which to pick up
  dropoffOrder: number;   // Sequence in which to drop off
}

/**
 * Pool Ride interface
 */
export interface PoolRide {
  id: string;
  createdBy: string;            // Student ID who initiated
  route: {
    generalPickupArea: GeoLocation;   // Central/average pickup area
    generalDropArea: GeoLocation;     // Central/average drop area
    routeDirection: string;           // E.g., "Hostel → College"
  };
  departureTime: string;        // Scheduled departure time (ISO string)
  isImmediate: boolean;         // true = ride now, false = scheduled
  maxSeats: number;             // Max 3 for auto rickshaw
  availableSeats: number;
  occupiedSeats: number;
  baseFare: number;             // Full solo fare for this route
  farePerSeat: number;          // Discounted per-seat fare
  poolDiscount: number;         // Discount percentage (e.g., 0.35 = 35%)
  status: PoolStatus;
  participants: PoolParticipant[];
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNumber: string | null;
  bookingId: string | null;     // Linked booking ID when driver assigned
  matchRadius: number;          // Match radius in km (default 1km)
  expiresAt: string;            // Auto-expire if not filled
  createdAt: string;
  updatedAt: string;
}

/**
 * Pool search/request from a student
 */
export interface PoolSearchRequest {
  studentId: string;
  studentName: string;
  studentPhone: string;
  pickupLocation: GeoLocation;
  dropLocation: GeoLocation;
  departureTime: string;
  isImmediate: boolean;
  seatsNeeded: number;
  distance: number;
  maxFarePerSeat: number;
}

/**
 * Pool match result
 */
export interface PoolMatch {
  poolId: string;
  pool: PoolRide;
  matchScore: number;           // 0-100 match quality
  pickupDeviation: number;      // km deviation for pickup
  dropDeviation: number;        // km deviation for drop
  estimatedFare: number;        // Fare for this student
  estimatedSavings: number;     // vs solo ride
}

/**
 * Pool fare calculation result
 */
export interface PoolFareResult {
  baseFare: number;             // Full solo fare
  farePerSeat: number;          // Discounted per-seat price
  totalPoolFare: number;        // Total collected from all seats
  driverEarning: number;        // What driver gets (80% of base)
  savingsPerPerson: number;     // How much each person saves
  discountPercent: number;      // Discount percentage
}

/**
 * Create pool data
 */
export interface CreatePoolData {
  studentId: string;
  studentName: string;
  studentPhone: string;
  pickupLocation: GeoLocation;
  dropLocation: GeoLocation;
  departureTime: string;
  isImmediate: boolean;
  seatsNeeded: number;
  distance: number;
  baseFare: number;
}

/**
 * Pool config constants
 */
export const POOL_CONFIG = {
  maxSeats: 3,                  // Max passengers in auto rickshaw
  matchRadiusKm: 1.0,          // Default match radius (1km)
  maxMatchRadiusKm: 2.0,       // Maximum search radius
  poolDiscount: 0.35,          // 35% discount per person when pooling
  driverPoolBonus: 0.1,        // 10% bonus for driver on pool rides
  expiryMinutes: 15,           // Pool expires if not filled in 15 mins
  minParticipants: 2,          // Min participants to start pool
  maxParticipants: 3,          // Max different students
  confirmTimeoutSeconds: 120,  // 2 minutes to confirm
} as const;
