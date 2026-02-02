/**
 * Driver Service
 * Handles all driver-related Firestore operations
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
  limit,
  arrayUnion,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { COLLECTIONS } from '../collections';
import { firebaseHandler, type ApiResponse } from '../handler';
import {
  type DriverProfile,
  type CreateDriverData,
  type DriverDocument,
  UserRole,
  VerificationStatus,
  DriverStatus,
  DocumentType,
} from '@/lib/types/user.types';

/**
 * Driver Service for Firestore operations
 */
export const DriverService = {
  /**
   * Create a new driver profile
   */
  createDriver: async (
    uid: string,
    data: CreateDriverData
  ): Promise<ApiResponse<DriverProfile>> => {
    return firebaseHandler(async () => {
      const now = new Date().toISOString();
      
      const driverData: DriverProfile = {
        uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.profilePhotoUrl || null,
        phone: data.phone,
        role: UserRole.DRIVER,
        emailVerified: false,
        licenseNumber: data.licenseNumber,
        licenseExpiry: data.licenseExpiry,
        aadharNumber: data.aadharNumber,
        vehicleRegistrationNumber: data.vehicleRegistrationNumber,
        vehicleType: data.vehicleType,
        vehicleModel: data.vehicleModel,
        seatingCapacity: data.seatingCapacity,
        documents: [],
        verificationStatus: VerificationStatus.PENDING,
        verificationNotes: null,
        verifiedAt: null,
        verifiedBy: null,
        profileUpdatePending: false,
        pendingUpdates: null,
        onlineStatus: DriverStatus.OFFLINE,
        currentLocation: null,
        rating: 0,
        totalRatings: 0,
        totalRides: 0,
        totalEarnings: 0,
        bankAccountNumber: null,
        bankIfscCode: null,
        bankAccountName: null,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, COLLECTIONS.DRIVERS, uid), {
        ...driverData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Also update the main users collection with role
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: UserRole.DRIVER,
        verificationStatus: VerificationStatus.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return driverData;
    }, 'driver/create');
  },

  /**
   * Get driver profile by UID
   */
  getDriver: async (uid: string): Promise<ApiResponse<DriverProfile | null>> => {
    return firebaseHandler(async () => {
      const docRef = doc(db, COLLECTIONS.DRIVERS, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as DriverProfile;
      }
      return null;
    }, 'driver/get');
  },

  /**
   * Update driver profile
   */
  updateDriver: async (
    uid: string,
    data: Partial<DriverProfile>
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const docRef = doc(db, COLLECTIONS.DRIVERS, uid);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    }, 'driver/update');
  },

  /**
   * Toggle driver online/offline status
   */
  toggleOnlineStatus: async (
    uid: string,
    status: DriverStatus,
    location?: { lat: number; lng: number }
  ): Promise<ApiResponse<DriverStatus>> => {
    return firebaseHandler(async () => {
      const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, uid));
      if (!driverDoc.exists()) {
        throw new Error('Driver not found');
      }

      const driver = driverDoc.data() as DriverProfile;
      
      // Only verified drivers can go online
      if (status === DriverStatus.ONLINE && driver.verificationStatus !== VerificationStatus.APPROVED) {
        throw new Error('Driver must be verified to go online');
      }

      await updateDoc(doc(db, COLLECTIONS.DRIVERS, uid), {
        onlineStatus: status,
        currentLocation: status === DriverStatus.ONLINE ? location : null,
        updatedAt: serverTimestamp(),
      });

      return status;
    }, 'driver/toggle-status');
  },

  /**
   * Update driver location
   */
  updateLocation: async (
    uid: string,
    location: { lat: number; lng: number; address?: string }
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, uid), {
        currentLocation: location,
        updatedAt: serverTimestamp(),
      });
      return true;
    }, 'driver/update-location');
  },

  /**
   * Add document for verification
   */
  addDocument: async (
    uid: string,
    document: Omit<DriverDocument, 'id' | 'uploadedAt' | 'verifiedAt' | 'verifiedBy'>
  ): Promise<ApiResponse<DriverDocument>> => {
    return firebaseHandler(async () => {
      const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, uid));
      if (!driverDoc.exists()) {
        throw new Error('Driver not found');
      }

      const driver = driverDoc.data() as DriverProfile;
      const newDocument: DriverDocument = {
        ...document,
        id: crypto.randomUUID(),
        uploadedAt: new Date().toISOString(),
        verifiedAt: null,
        verifiedBy: null,
      };

      const updatedDocuments = [...driver.documents, newDocument];

      await updateDoc(doc(db, COLLECTIONS.DRIVERS, uid), {
        documents: updatedDocuments,
        // Reset verification status when new documents are added
        verificationStatus: VerificationStatus.PENDING,
        updatedAt: serverTimestamp(),
      });

      return newDocument;
    }, 'driver/add-document');
  },

  /**
   * Get all online drivers (for students to book)
   */
  getOnlineDrivers: async (): Promise<ApiResponse<DriverProfile[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.DRIVERS),
        where('onlineStatus', '==', DriverStatus.ONLINE),
        where('verificationStatus', '==', VerificationStatus.APPROVED)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DriverProfile);
    }, 'driver/get-online');
  },

  /**
   * Get drivers by verification status (for admin)
   */
  getDriversByStatus: async (
    status: VerificationStatus,
    limitCount: number = 50
  ): Promise<ApiResponse<DriverProfile[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.DRIVERS),
        where('verificationStatus', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DriverProfile);
    }, 'driver/get-by-status');
  },

  /**
   * Get all drivers (for admin)
   */
  getAllDrivers: async (
    limitCount: number = 50
  ): Promise<ApiResponse<DriverProfile[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.DRIVERS),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DriverProfile);
    }, 'driver/get-all');
  },

  /**
   * Verify driver (admin action)
   */
  verifyDriver: async (
    driverId: string,
    adminId: string,
    status: VerificationStatus.APPROVED | VerificationStatus.REJECTED,
    notes?: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const now = new Date().toISOString();
      
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
        verificationStatus: status,
        verificationNotes: notes || null,
        verifiedAt: now,
        verifiedBy: adminId,
        updatedAt: serverTimestamp(),
      });

      // Update user collection as well
      await updateDoc(doc(db, COLLECTIONS.USERS, driverId), {
        verificationStatus: status,
        updatedAt: serverTimestamp(),
      });

      return true;
    }, 'driver/verify');
  },

  /**
   * Update driver rating
   */
  updateRating: async (
    uid: string,
    newRating: number
  ): Promise<ApiResponse<number>> => {
    return firebaseHandler(async () => {
      const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, uid));
      if (!driverDoc.exists()) {
        throw new Error('Driver not found');
      }

      const driver = driverDoc.data() as DriverProfile;
      const totalRatings = driver.totalRatings + 1;
      const currentTotal = driver.rating * driver.totalRatings;
      const newAverage = (currentTotal + newRating) / totalRatings;

      await updateDoc(doc(db, COLLECTIONS.DRIVERS, uid), {
        rating: Math.round(newAverage * 10) / 10, // Round to 1 decimal
        totalRatings,
        updatedAt: serverTimestamp(),
      });

      return newAverage;
    }, 'driver/update-rating');
  },

  /**
   * Update driver earnings
   */
  addEarning: async (
    uid: string,
    amount: number
  ): Promise<ApiResponse<number>> => {
    return firebaseHandler(async () => {
      const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, uid));
      if (!driverDoc.exists()) {
        throw new Error('Driver not found');
      }

      const driver = driverDoc.data() as DriverProfile;
      const newTotal = driver.totalEarnings + amount;

      await updateDoc(doc(db, COLLECTIONS.DRIVERS, uid), {
        totalEarnings: newTotal,
        totalRides: driver.totalRides + 1,
        updatedAt: serverTimestamp(),
      });

      return newTotal;
    }, 'driver/add-earning');
  },

  /**
   * Upload driver document to Firebase Storage
   */
  uploadDocument: async (
    driverId: string,
    file: File,
    documentType: DocumentType
  ): Promise<ApiResponse<DriverDocument>> => {
    return firebaseHandler(async () => {
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `${documentType}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `drivers/${driverId}/documents/${fileName}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Create document record
      const document: DriverDocument = {
        id: `${driverId}_${documentType}_${timestamp}`,
        type: documentType,
        url: downloadURL,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        verifiedAt: null,
        verifiedBy: null,
      };

      // Add document to driver's documents array
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
        documents: arrayUnion(document),
        updatedAt: serverTimestamp(),
      });

      return document;
    }, 'driver/upload-document');
  },

  /**
   * Delete driver document from Firebase Storage
   */
  deleteDocument: async (
    driverId: string,
    documentId: string,
    documentUrl: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      // Delete from storage
      const storageRef = ref(storage, documentUrl);
      await deleteObject(storageRef);

      // Get current driver data
      const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, driverId));
      if (!driverDoc.exists()) {
        throw new Error('Driver not found');
      }

      const driver = driverDoc.data() as DriverProfile;
      const updatedDocuments = driver.documents.filter(doc => doc.id !== documentId);

      // Update driver's documents array
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
        documents: updatedDocuments,
        updatedAt: serverTimestamp(),
      });

      return true;
    }, 'driver/delete-document');
  },
};
