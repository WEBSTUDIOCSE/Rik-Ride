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

// Import types from auth service
export type { AppUser } from './auth.service';
export type { PaymentRecord } from './payment.service';
export type { AdminLog, DashboardStats } from './admin.service';
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
 */
export const APIBook = {
  auth: AuthService,
  payment: PaymentService,
  student: StudentService,
  driver: DriverService,
  admin: AdminService,
};

/**
 * Default export for direct service access
 */
export default APIBook;
