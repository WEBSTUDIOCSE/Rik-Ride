/**
 * Notification Helpers
 * Convenience functions to trigger notifications for common events
 */

import { NotificationService } from '@/lib/firebase/services/notification.service';
import { NotificationType } from '@/lib/types/notification.types';
import type { Booking } from '@/lib/firebase/services';

/**
 * Booking Notification Helpers
 */
export const BookingNotifications = {
  /**
   * Notify driver of new booking request
   */
  async newBookingRequest(booking: Booking): Promise<void> {
    const pickupShort = booking.pickupLocation.address?.split(',')[0] || 'Pickup';
    const dropShort = booking.dropLocation.address?.split(',')[0] || 'Destination';
    
    console.log('[Notification] Sending NEW_BOOKING_REQUEST to driver:', booking.driverId);
    
    await NotificationService.sendToUser(booking.driverId, NotificationType.NEW_BOOKING_REQUEST, {
      bookingId: booking.id,
      studentName: booking.studentName,
      pickup: pickupShort,
      drop: dropShort,
      fare: `₹${booking.fare}`,
    });
  },

  /**
   * Notify student that driver accepted
   */
  async bookingAccepted(booking: Booking): Promise<void> {
    console.log('[Notification] Sending BOOKING_ACCEPTED to student:', booking.studentId);
    
    await NotificationService.sendToUser(booking.studentId, NotificationType.BOOKING_ACCEPTED, {
      bookingId: booking.id,
      driverName: booking.driverName,
    });
  },

  /**
   * Notify student that driver rejected
   */
  async bookingRejected(booking: Booking): Promise<void> {
    await NotificationService.sendToUser(booking.studentId, NotificationType.BOOKING_REJECTED, {
      bookingId: booking.id,
    });
  },

  /**
   * Notify student that driver arrived at pickup
   */
  async driverArrived(booking: Booking): Promise<void> {
    await NotificationService.sendToUser(booking.studentId, NotificationType.DRIVER_ARRIVED, {
      bookingId: booking.id,
      driverName: booking.driverName,
    });
  },

  /**
   * Notify both parties that ride started
   */
  async rideStarted(booking: Booking): Promise<void> {
    const dropShort = booking.dropLocation.address?.split(',')[0] || 'Destination';
    
    // Notify student
    await NotificationService.sendToUser(booking.studentId, NotificationType.RIDE_STARTED, {
      bookingId: booking.id,
      drop: dropShort,
    });
  },

  /**
   * Notify both parties that ride completed
   */
  async rideCompleted(booking: Booking): Promise<void> {
    const dropShort = booking.dropLocation.address?.split(',')[0] || 'Destination';
    
    // Notify student
    await NotificationService.sendToUser(booking.studentId, NotificationType.RIDE_COMPLETED, {
      bookingId: booking.id,
      drop: dropShort,
    });

    // Notify driver
    await NotificationService.sendToUser(booking.driverId, NotificationType.RIDE_COMPLETED, {
      bookingId: booking.id,
      drop: dropShort,
    });
  },

  /**
   * Notify other party of cancellation
   */
  async bookingCancelled(
    booking: Booking, 
    cancelledBy: 'student' | 'driver'
  ): Promise<void> {
    const recipientId = cancelledBy === 'student' ? booking.driverId : booking.studentId;
    
    await NotificationService.sendToUser(recipientId, NotificationType.BOOKING_CANCELLED, {
      bookingId: booking.id,
    });
  },
};

/**
 * Rating Notification Helpers
 */
export const RatingNotifications = {
  /**
   * Notify user of new rating received
   */
  async newRating(
    userId: string, 
    rating: number, 
    userType: 'student' | 'driver'
  ): Promise<void> {
    await NotificationService.sendToUser(userId, NotificationType.NEW_RATING, {
      rating: rating.toString(),
      userType,
    });
  },

  /**
   * Warn user of low rating
   */
  async lowRatingWarning(userId: string, averageRating: number): Promise<void> {
    await NotificationService.sendToUser(userId, NotificationType.LOW_RATING_WARNING, {
      rating: averageRating.toFixed(1),
    });
  },
};

/**
 * Payment Notification Helpers
 */
export const PaymentNotifications = {
  /**
   * Notify driver of payment received
   */
  async paymentReceived(driverId: string, amount: number): Promise<void> {
    await NotificationService.sendToUser(driverId, NotificationType.PAYMENT_RECEIVED, {
      amount: amount.toString(),
    });
  },

  /**
   * Warn student of low wallet balance
   */
  async lowWalletBalance(studentId: string, balance: number): Promise<void> {
    await NotificationService.sendToUser(studentId, NotificationType.LOW_WALLET_BALANCE, {
      balance: balance.toString(),
    });
  },
};

/**
 * Emergency Notification Helpers
 */
export const EmergencyNotifications = {
  /**
   * Send SOS alert (should also trigger email/SMS via Cloud Functions)
   */
  async sosAlert(
    userId: string,
    userName: string,
    location: string,
    locationUrl?: string
  ): Promise<void> {
    // This primarily stores the alert - actual SMS/email should be via Cloud Functions
    await NotificationService.storeNotification(userId, {
      userId,
      type: NotificationType.SOS_ALERT,
      title: '🆘 EMERGENCY ALERT',
      body: `${userName} triggered an SOS alert! Location: ${location}`,
      data: { userName, location, locationUrl: locationUrl || '' },
      read: false,
    });
  },
};

/**
 * Admin Notification Helpers  
 */
export const AdminNotifications = {
  /**
   * Notify driver of verification status
   */
  async driverVerification(
    driverId: string, 
    status: 'approved' | 'rejected'
  ): Promise<void> {
    await NotificationService.sendToUser(driverId, NotificationType.DRIVER_VERIFICATION, {
      status,
    });
  },

  /**
   * Warn user about account issue
   */
  async accountWarning(userId: string): Promise<void> {
    await NotificationService.sendToUser(userId, NotificationType.ACCOUNT_WARNING, {});
  },
};

/**
 * System Notification Helpers
 */
export const SystemNotifications = {
  /**
   * Send system message to user
   */
  async sendMessage(userId: string, message: string): Promise<void> {
    await NotificationService.sendToUser(userId, NotificationType.SYSTEM_MESSAGE, {
      message,
    });
  },

  /**
   * Broadcast to all users (requires Cloud Function for efficiency)
   */
  async broadcast(message: string): Promise<void> {
    // This should be handled by Cloud Function for scalability
    console.log('Broadcast requested:', message);
    // For now, just log - implement via Cloud Function
  },
};

// Combined export
export const NotificationHelpers = {
  booking: BookingNotifications,
  rating: RatingNotifications,
  payment: PaymentNotifications,
  emergency: EmergencyNotifications,
  admin: AdminNotifications,
  system: SystemNotifications,
};

export default NotificationHelpers;
