/**
 * User Roles and Types for Rik-Ride
 * Defines all user-related types and enums
 */

/**
 * User roles in the application
 */
export enum UserRole {
  STUDENT = 'student',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

/**
 * Driver verification status
 */
export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Driver online status
 */
export enum DriverStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

/**
 * Booking status
 */
export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Document types for driver verification
 */
export enum DocumentType {
  DRIVING_LICENSE = 'driving_license',
  VEHICLE_RC = 'vehicle_rc',
  INSURANCE = 'insurance',
  ID_PROOF = 'id_proof',
  VEHICLE_PHOTO = 'vehicle_photo',
}

/**
 * Base user interface
 */
export interface BaseUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  phone: string | null;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Student profile interface
 */
export interface StudentProfile extends BaseUser {
  role: UserRole.STUDENT;
  universityEmail: string;
  studentId: string;
  department: string;
  year: number;
  emergencyContact: EmergencyContact | null;
  emergencyContacts: EmergencyContact[];
  parentPhone: string | null;
  savedAddresses: SavedAddress[];
  walletBalance: number;
  totalRides: number;
}

/**
 * Emergency Contact interface
 */
export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

/**
 * Driver profile interface
 */
export interface DriverProfile extends BaseUser {
  role: UserRole.DRIVER;
  licenseNumber: string;
  licenseExpiry: string;
  aadharNumber: string;
  vehicleRegistrationNumber: string;
  vehicleType: string;
  vehicleModel: string;
  seatingCapacity: number;
  documents: DriverDocument[];
  verificationStatus: VerificationStatus;
  verificationNotes: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  profileUpdatePending: boolean; // New: true when driver updates profile and awaiting approval
  pendingUpdates: Partial<DriverProfile> | null; // New: stores pending updates
  onlineStatus: DriverStatus;
  currentLocation: GeoLocation | null;
  rating: number;
  totalRatings: number;
  totalRides: number;
  totalEarnings: number;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankAccountName: string | null;
}

/**
 * Admin profile interface
 */
export interface AdminProfile extends BaseUser {
  role: UserRole.ADMIN;
  isSuperAdmin: boolean;
  permissions: string[];
  lastActive: string;
}

/**
 * Driver document interface
 */
export interface DriverDocument {
  id: string;
  type: DocumentType;
  url: string;
  fileName: string;
  uploadedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

/**
 * Saved address interface
 */
export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  location: GeoLocation;
  isDefault: boolean;
}

/**
 * Geo location interface
 */
export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Booking interface
 */
export interface Booking {
  id: string;
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
  status: BookingStatus;
  bookingTime: string;
  acceptedAt: string | null;
  rideStartTime: string | null;
  rideEndTime: string | null;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: string | null;
  studentRating: number | null;
  studentReview: string | null;
  driverRating: number | null;
  driverReview: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type for creating a new student
 */
export interface CreateStudentData {
  email: string;
  displayName: string;
  password: string;
  universityEmail: string;
  studentId: string;
  department: string;
  year: number;
  phone: string;
  parentPhone?: string;
  emergencyContact?: EmergencyContact;
}

/**
 * Type for creating a new driver
 * Note: licenseNumber and aadharNumber removed - will be extracted from uploaded documents
 */
export interface CreateDriverData {
  email: string;
  displayName: string;
  password: string;
  phone: string;
  profilePhotoUrl?: string;
  licenseExpiry: string;
  vehicleRegistrationNumber: string;
  vehicleType: string;
  vehicleModel: string;
  seatingCapacity: number;
}

/**
 * Admin credentials (hardcoded for MVP)
 */
export const ADMIN_CREDENTIALS = {
  email: 'Saurabh@gmail.com',
  // Note: Password is checked during login, not stored here
} as const;

/**
 * Check if email is admin email
 */
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();
}

/**
 * University email domain for validation
 */
export const UNIVERSITY_EMAIL_DOMAIN = '@git-india.edu.in';

/**
 * Check if email is a valid university email
 */
export function isValidUniversityEmail(email: string): boolean {
  return email.toLowerCase().endsWith(UNIVERSITY_EMAIL_DOMAIN.toLowerCase());
}
