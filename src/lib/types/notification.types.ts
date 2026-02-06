/**
 * Notification Types for Push & In-App Notifications
 */

export enum NotificationType {
  // Booking notifications
  NEW_BOOKING_REQUEST = 'NEW_BOOKING_REQUEST',       // Driver: New booking request
  BOOKING_ACCEPTED = 'BOOKING_ACCEPTED',             // Student: Driver accepted
  BOOKING_REJECTED = 'BOOKING_REJECTED',             // Student: Driver rejected
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',                 // Student: Driver at pickup
  RIDE_STARTED = 'RIDE_STARTED',                     // Both: Ride in progress
  RIDE_COMPLETED = 'RIDE_COMPLETED',                 // Both: Ride finished
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',           // Both: Booking cancelled
  
  // Rating notifications
  NEW_RATING = 'NEW_RATING',                         // Both: Received a rating
  LOW_RATING_WARNING = 'LOW_RATING_WARNING',         // Both: Rating below threshold
  
  // Payment notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',             // Driver: Payment confirmed
  
  // Emergency notifications
  SOS_ALERT = 'SOS_ALERT',                           // Emergency contacts: SOS triggered
  
  // Admin notifications
  DRIVER_VERIFICATION = 'DRIVER_VERIFICATION',       // Driver: Account verified/rejected
  ACCOUNT_WARNING = 'ACCOUNT_WARNING',               // Both: Account warning
  
  // General
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE',                 // Both: System announcements
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: Record<string, string>;
  clickAction?: string;          // URL to open when clicked
  requireInteraction?: boolean;  // Keep notification visible
  tag?: string;                  // Group similar notifications
  renotify?: boolean;            // Vibrate for grouped notifications
}

export interface StoredNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface FCMTokenRecord {
  token: string;
  userId: string;
  userType: 'student' | 'driver' | 'admin';
  deviceType: 'web' | 'android' | 'ios';
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface NotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  
  // Granular controls
  bookingNotifications: boolean;
  ratingNotifications: boolean;
  paymentNotifications: boolean;
  emergencyNotifications: boolean;  // Should always be true
  systemNotifications: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string;  // "22:00"
  quietHoursEnd?: string;    // "07:00"
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userId'> = {
  pushEnabled: true,
  emailEnabled: true,
  bookingNotifications: true,
  ratingNotifications: true,
  paymentNotifications: true,
  emergencyNotifications: true,
  systemNotifications: true,
  quietHoursEnabled: false,
};

// Notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, { title: string; body: string }> = {
  [NotificationType.NEW_BOOKING_REQUEST]: {
    title: '🚗 New Ride Request!',
    body: '{studentName} wants a ride from {pickup} to {drop}',
  },
  [NotificationType.BOOKING_ACCEPTED]: {
    title: '✅ Ride Accepted!',
    body: '{driverName} accepted your ride. They\'re on their way!',
  },
  [NotificationType.BOOKING_REJECTED]: {
    title: '❌ Ride Not Available',
    body: 'The driver is not available. Please try another driver.',
  },
  [NotificationType.DRIVER_ARRIVED]: {
    title: '📍 Driver Arrived!',
    body: '{driverName} has arrived at your pickup location',
  },
  [NotificationType.RIDE_STARTED]: {
    title: '🚀 Ride Started',
    body: 'Your ride to {drop} has begun',
  },
  [NotificationType.RIDE_COMPLETED]: {
    title: '🎉 Ride Completed!',
    body: 'You\'ve arrived at {drop}. Please rate your experience.',
  },
  [NotificationType.BOOKING_CANCELLED]: {
    title: '🚫 Ride Cancelled',
    body: 'The ride has been cancelled',
  },
  [NotificationType.NEW_RATING]: {
    title: '⭐ New Rating Received',
    body: 'You received a {rating}-star rating',
  },
  [NotificationType.LOW_RATING_WARNING]: {
    title: '⚠️ Rating Warning',
    body: 'Your average rating has dropped to {rating}. Please improve your service.',
  },
  [NotificationType.PAYMENT_RECEIVED]: {
    title: '💰 Payment Received',
    body: '₹{amount} has been credited to your account',
  },
  [NotificationType.SOS_ALERT]: {
    title: '🆘 EMERGENCY ALERT',
    body: '{userName} triggered an SOS alert! Location: {location}',
  },
  [NotificationType.DRIVER_VERIFICATION]: {
    title: '📋 Account Update',
    body: 'Your driver account has been {status}',
  },
  [NotificationType.ACCOUNT_WARNING]: {
    title: '⚠️ Account Warning',
    body: 'Your account has received a warning. Please contact support.',
  },
  [NotificationType.SYSTEM_MESSAGE]: {
    title: '📢 Rik-Ride Update',
    body: '{message}',
  },
};
