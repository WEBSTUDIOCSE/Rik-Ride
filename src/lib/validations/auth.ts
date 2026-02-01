import { z } from 'zod';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { UNIVERSITY_EMAIL_DOMAIN } from '@/lib/types/user.types';

// Password validation based on auth config
const passwordValidation = z
  .string()
  .min(1, 'Password is required')
  .min(AUTH_CONFIG.passwordRequirements.minLength, `Password must be at least ${AUTH_CONFIG.passwordRequirements.minLength} characters`);

// Phone number validation
const phoneValidation = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[0-9+\-\s]+$/, 'Invalid phone number format');

// Login form validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Signup form validation schema (generic)
export const signupSchema = z.object({
  displayName: z
    .string()
    .optional(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: passwordValidation,
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Student signup form validation schema
export const studentSignupSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  universityEmail: z
    .string()
    .min(1, 'University email is required')
    .email('Invalid email address')
    .refine(
      (email) => email.toLowerCase().endsWith(UNIVERSITY_EMAIL_DOMAIN.toLowerCase()),
      `University email must end with ${UNIVERSITY_EMAIL_DOMAIN}`
    ),
  studentId: z
    .string()
    .min(1, 'Student ID is required')
    .max(20, 'Student ID must not exceed 20 characters'),
  department: z
    .string()
    .min(1, 'Department is required'),
  year: z
    .number()
    .min(1, 'Year must be between 1 and 4')
    .max(4, 'Year must be between 1 and 4'),
  phone: phoneValidation,
  password: passwordValidation,
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Driver signup form validation schema
export const driverSignupSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: phoneValidation,
  licenseNumber: z
    .string()
    .min(1, 'License number is required')
    .max(20, 'License number must not exceed 20 characters'),
  licenseExpiry: z
    .string()
    .min(1, 'License expiry date is required'),
  aadharNumber: z
    .string()
    .min(12, 'Aadhar number must be 12 digits')
    .max(12, 'Aadhar number must be 12 digits')
    .regex(/^[0-9]+$/, 'Aadhar number must contain only digits'),
  vehicleRegistrationNumber: z
    .string()
    .min(1, 'Vehicle registration number is required')
    .max(15, 'Vehicle registration number must not exceed 15 characters'),
  vehicleType: z
    .string()
    .min(1, 'Vehicle type is required'),
  vehicleModel: z
    .string()
    .min(1, 'Vehicle model is required'),
  seatingCapacity: z
    .number()
    .min(1, 'Seating capacity must be at least 1')
    .max(10, 'Seating capacity must not exceed 10'),
  password: passwordValidation,
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Admin login form validation schema
export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// Password reset form validation schema
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

// Change password form validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: passwordValidation,
  confirmNewPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
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
