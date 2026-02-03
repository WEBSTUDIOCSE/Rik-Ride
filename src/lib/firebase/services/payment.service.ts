// Payment Service - Simple cash/UPI payment system for drivers

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';
import {
  DriverPaymentInfo,
  PaymentMethod,
  PaymentStatus,
  RidePayment,
} from '@/lib/types/payment.types';

const COLLECTION_NAME = 'driverPaymentInfo';
const PAYMENTS_COLLECTION = 'ridePayments';

export class PaymentService {
  /**
   * Get driver's payment info (UPI ID, QR code)
   */
  static async getDriverPaymentInfo(driverId: string): Promise<DriverPaymentInfo | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, driverId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        driverId: docSnap.id,
        paymentMethod: data.paymentMethod || PaymentMethod.CASH_ONLY,
        upiId: data.upiId,
        qrCodeUrl: data.qrCodeUrl,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: data.isActive ?? true,
      };
    } catch (error) {
      console.error('Error getting driver payment info:', error);
      return null;
    }
  }

  /**
   * Update driver's UPI ID
   */
  static async updateUpiId(driverId: string, upiId: string): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTION_NAME, driverId);
      const existingDoc = await getDoc(docRef);
      
      const updateData = {
        driverId,
        upiId: upiId.trim(),
        paymentMethod: upiId.trim() 
          ? PaymentMethod.CASH_AND_UPI 
          : PaymentMethod.CASH_ONLY,
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      if (existingDoc.exists()) {
        await updateDoc(docRef, updateData);
      } else {
        await setDoc(docRef, updateData);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating UPI ID:', error);
      return false;
    }
  }

  /**
   * Upload QR code image for driver
   */
  static async uploadQrCode(driverId: string, file: File): Promise<string | null> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        throw new Error('File size must be less than 2MB');
      }

      // Delete existing QR code if any
      await this.deleteQrCode(driverId);

      // Upload new QR code
      const fileName = `payment-qr/${driverId}/qr-code.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update driver payment info
      const docRef = doc(db, COLLECTION_NAME, driverId);
      const existingDoc = await getDoc(docRef);
      
      const updateData = {
        driverId,
        qrCodeUrl: downloadUrl,
        paymentMethod: PaymentMethod.CASH_AND_UPI,
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      if (existingDoc.exists()) {
        await updateDoc(docRef, updateData);
      } else {
        await setDoc(docRef, {
          ...updateData,
          upiId: '',
        });
      }

      return downloadUrl;
    } catch (error) {
      console.error('Error uploading QR code:', error);
      return null;
    }
  }

  /**
   * Delete driver's QR code
   */
  static async deleteQrCode(driverId: string): Promise<boolean> {
    try {
      // Get existing payment info
      const paymentInfo = await this.getDriverPaymentInfo(driverId);
      
      if (paymentInfo?.qrCodeUrl) {
        // Extract path from URL and delete from storage
        try {
          const url = new URL(paymentInfo.qrCodeUrl);
          const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
          if (path) {
            const storageRef = ref(storage, path);
            await deleteObject(storageRef);
          }
        } catch {
          // Ignore if file doesn't exist
        }
      }

      // Update document to remove QR code URL
      const docRef = doc(db, COLLECTION_NAME, driverId);
      await updateDoc(docRef, {
        qrCodeUrl: null,
        paymentMethod: paymentInfo?.upiId 
          ? PaymentMethod.UPI 
          : PaymentMethod.CASH_ONLY,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error deleting QR code:', error);
      return false;
    }
  }

  /**
   * Set payment method for driver
   */
  static async setPaymentMethod(
    driverId: string, 
    method: PaymentMethod
  ): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTION_NAME, driverId);
      const existingDoc = await getDoc(docRef);
      
      const updateData = {
        driverId,
        paymentMethod: method,
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      if (existingDoc.exists()) {
        await updateDoc(docRef, updateData);
      } else {
        await setDoc(docRef, {
          ...updateData,
          upiId: '',
          qrCodeUrl: null,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting payment method:', error);
      return false;
    }
  }

  /**
   * Record a ride payment
   */
  static async recordPayment(
    bookingId: string,
    studentId: string,
    driverId: string,
    fare: number,
    paymentMethod: PaymentMethod,
    status: PaymentStatus = PaymentStatus.PENDING
  ): Promise<boolean> {
    try {
      const docRef = doc(db, PAYMENTS_COLLECTION, bookingId);
      
      await setDoc(docRef, {
        bookingId,
        studentId,
        driverId,
        fare,
        paymentMethod,
        paymentStatus: status,
        createdAt: serverTimestamp(),
        paidAt: status === PaymentStatus.PAID || status === PaymentStatus.CASH_COLLECTED 
          ? serverTimestamp() 
          : null,
      });
      
      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      return false;
    }
  }

  /**
   * Mark payment as collected (cash or UPI confirmed)
   */
  static async markPaymentCollected(
    bookingId: string,
    method: 'CASH' | 'UPI'
  ): Promise<boolean> {
    try {
      const docRef = doc(db, PAYMENTS_COLLECTION, bookingId);
      
      // Check if document exists
      const docSnap = await getDoc(docRef);
      
      const paymentData = {
        paymentStatus: method === 'CASH' 
          ? PaymentStatus.CASH_COLLECTED 
          : PaymentStatus.PAID,
        paidAt: serverTimestamp(),
      };
      
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, paymentData);
      } else {
        // Create new document with minimal info
        // Note: Full payment record should be created earlier via recordPayment
        await setDoc(docRef, {
          bookingId,
          ...paymentData,
          createdAt: serverTimestamp(),
        });
        console.warn(`Payment record created on confirmation for booking: ${bookingId}. Consider calling recordPayment earlier.`);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking payment collected:', error);
      return false;
    }
  }

  /**
   * Get payment record for a booking
   */
  static async getPaymentRecord(bookingId: string): Promise<RidePayment | null> {
    try {
      const docRef = doc(db, PAYMENTS_COLLECTION, bookingId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        bookingId: docSnap.id,
        studentId: data.studentId,
        driverId: data.driverId,
        fare: data.fare,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        paidAt: data.paidAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting payment record:', error);
      return null;
    }
  }
}
