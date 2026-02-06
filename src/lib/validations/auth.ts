import { z } from 'zod';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { UNIVERSITY_EMAIL_DOMAIN } from '@/lib/types/user.types';
import { AUTH_ERROR_MESSAGES, getPasswordMismatchError } from './error-messages';

// Password validation based on auth config
const passwordValidation = z
  .string()
  .min(1, AUTH_ERROR_MESSAGES.password.required)
  .min(AUTH_CONFIG.passwordRequirements.minLength, AUTH_ERROR_MESSAGES.password.tooShort);

// Phone number validation
const phoneValidation = z
  .string()
  .min(10, AUTH_ERROR_MESSAGES.phone.tooShort)
  .max(15, AUTH_ERROR_MESSAGES.phone.tooLong)
  .regex(/^[0-9+\-\s]+$/, AUTH_ERROR_MESSAGES.phone.invalid);

// Optional phone number validation
const optionalPhoneValidation = z
  .string()
  .optional()
  .refine((val) => !val || (val.length >= 10 && val.length <= 15 && /^[0-9+\-\s]+$/.test(val)), {
    message: AUTH_ERROR_MESSAGES.phone.invalid,
  });

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.email.required)
    .email(AUTH_ERROR_MESSAGES.email.invalid),
  password: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.password.required),
});

// Signup form validation schema (generic)
export const signupSchema = z.object({
  displayName: z
    .string()
    .optional(),
  email: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.email.required)
    .email(AUTH_ERROR_MESSAGES.email.invalid),
  password: passwordValidation,
  confirmPassword: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.confirmPassword.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: getPasswordMismatchError(),
  path: ["confirmPassword"],
});

// Student signup form validation schema
export const studentSignupSchema = z.object({
  displayName: z
    .string()
    .min(2, AUTH_ERROR_MESSAGES.name.tooShort)
    .max(50, AUTH_ERROR_MESSAGES.name.tooLong),
  email: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.email.required)
    .email(AUTH_ERROR_MESSAGES.email.invalid),
  universityEmail: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.universityEmail.required)
    .email(AUTH_ERROR_MESSAGES.universityEmail.invalid)
    .refine(
      (email) => email.toLowerCase().endsWith(UNIVERSITY_EMAIL_DOMAIN.toLowerCase()),
      AUTH_ERROR_MESSAGES.universityEmail.wrongDomain
    ),
  studentId: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.studentId.required)
    .max(20, AUTH_ERROR_MESSAGES.studentId.invalid),
  department: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.department.required),
  year: z
    .number()
    .min(1, AUTH_ERROR_MESSAGES.year.invalid)
    .max(4, AUTH_ERROR_MESSAGES.year.invalid),
  phone: phoneValidation,
  parentPhone: optionalPhoneValidation,
  password: passwordValidation,
  confirmPassword: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.confirmPassword.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: getPasswordMismatchError(),
  path: ["confirmPassword"],
});

// Driver signup form validation schema
// Note: licenseNumber and aadharNumber removed - only uploads required now
export const driverSignupSchema = z.object({
  displayName: z
    .string()
    .min(2, AUTH_ERROR_MESSAGES.name.tooShort)
    .max(50, AUTH_ERROR_MESSAGES.name.tooLong),
  email: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.email.required)
    .email(AUTH_ERROR_MESSAGES.email.driverInvalid),
  phone: phoneValidation,
  licenseExpiry: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.license.expired),
  vehicleRegistrationNumber: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.vehicle.registrationRequired)
    .max(15, AUTH_ERROR_MESSAGES.vehicle.registrationRequired),
  vehicleType: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.vehicle.typeRequired),
  vehicleModel: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.vehicle.modelRequired),
  seatingCapacity: z
    .number()
    .min(1, AUTH_ERROR_MESSAGES.vehicle.capacityInvalid)
    .max(10, AUTH_ERROR_MESSAGES.vehicle.capacityTooHigh), // Max 10 for larger vehicles
  password: passwordValidation,
  confirmPassword: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.confirmPassword.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: getPasswordMismatchError(),
  path: ["confirmPassword"],
}).refine((data) => {
  // Auto-rickshaw max 4 passengers, others can have up to 10
  const isAutoRickshaw = data.vehicleType.toLowerCase().includes('auto') || 
                          data.vehicleType.toLowerCase().includes('rickshaw');
  if (isAutoRickshaw && data.seatingCapacity > 4) {
    return false;
  }
  return true;
}, {
  message: 'Auto-rickshaw can have maximum 4 passengers',
  path: ["seatingCapacity"],
});

// Admin login form validation schema
export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.email.required)
    .email(AUTH_ERROR_MESSAGES.email.invalid),
  password: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.password.required),
});

// Password reset form validation schema
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.email.required)
    .email(AUTH_ERROR_MESSAGES.email.invalid),
});

// Change password form validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.password.required),
  newPassword: passwordValidation,
  confirmNewPassword: z
    .string()
    .min(1, AUTH_ERROR_MESSAGES.confirmPassword.required),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: getPasswordMismatchError(),
  path: ["confirmNewPassword"],
});

// Delete account form validation schema
export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required to delete your account'),
  confirmText: z
    .string()
    .min(1, 'Please type "DELETE" to confirm')
    .refine((val) => val === 'DELETE', {
      message: 'Please type "DELETE" exactly to confirm account deletion',
    }),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type StudentSignupFormData = z.infer<typeof studentSignupSchema>;
export type DriverSignupFormData = z.infer<typeof driverSignupSchema>;
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
