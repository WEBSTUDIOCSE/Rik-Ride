/**
 * Firebase Services APIBook
 * Central export point for Firebase services
 */

// Import services
export { AuthService } from './auth.service';
export { PaymentService } from './payment.service';
export { StudentService } from './student.service';
export { DriverService } from './driver.service';
export { AdminService } from './admin.service';
export { BookingService, calculateFare } from './booking.service';
export { driverLocationService, DriverLocationService } from './driver-location.service';
export { EmergencyService } from './emergency.service';
export { RatingService } from './rating.service';

// Import types from auth service
export type { AppUser } from './auth.service';
export type { AdminLog, DashboardStats } from './admin.service';
export type { CreateBookingData, NearbyDriver } from './booking.service';
export type { DriverLocation, NearbyDriver as NearbyDriverLocation } from './driver-location.service';
export type { ApiResponse } from '../handler';

// Re-export user types
export {
  UserRole,
  VerificationStatus,
  DriverStatus,
  BookingStatus,
  DocumentType,
  ADMIN_CREDENTIALS,
  isAdminEmail,
  isValidUniversityEmail,
  UNIVERSITY_EMAIL_DOMAIN,
} from '@/lib/types/user.types';

// Re-export rating types
export {
  RatingType,
  ReportStatus,
  ReportCategory,
  DRIVER_RATING_TAGS,
  STUDENT_RATING_TAGS,
  RATING_THRESHOLDS,
  getRatingLabel,
  getRatingColor,
  formatReportCategory,
  formatReportStatus,
} from '@/lib/types/rating.types';

export type {
  Rating,
  Report,
  RatingSummary,
  PendingRating,
  CreateRatingData,
  CreateReportData,
  RatingTag,
  UserWarning,
} from '@/lib/types/rating.types';

export type {
  BaseUser,
  StudentProfile,
  DriverProfile,
  AdminProfile,
  DriverDocument,
  SavedAddress,
  GeoLocation,
  Booking,
  CreateStudentData,
  CreateDriverData,
} from '@/lib/types/user.types';

// Re-export for convenience
import { AuthService } from './auth.service';
import { PaymentService } from './payment.service';
import { StudentService } from './student.service';
import { DriverService } from './driver.service';
import { AdminService } from './admin.service';
import { BookingService } from './booking.service';
import { RatingService } from './rating.service';

/**
 * Centralized APIBook for Firebase services
 * 
 * Usage:
 * import { APIBook } from '@/lib/firebase/services';
 * const result = await APIBook.auth.loginWithEmail(email, password);
 * const payment = await APIBook.payment.createPayment(paymentData);
 * const student = await APIBook.student.getStudent(uid);
 * const driver = await APIBook.driver.getOnlineDrivers();
 * const stats = await APIBook.admin.getDashboardStats();
 * const booking = await APIBook.booking.createBooking(data);
 * const rating = await APIBook.rating.submitRating(data);
 */
export const APIBook = {
  auth: AuthService,
  payment: PaymentService,
  student: StudentService,
  driver: DriverService,
  admin: AdminService,
  booking: BookingService,
  rating: RatingService,
};

/**
 * Default export for direct service access
 */
export default APIBook;
