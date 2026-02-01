/**
 * Admin Service
 * Handles all admin-related Firestore operations
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
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../collections';
import { firebaseHandler, type ApiResponse } from '../handler';
import {
  type AdminProfile,
  type DriverProfile,
  type StudentProfile,
  UserRole,
  VerificationStatus,
  ADMIN_CREDENTIALS,
  isAdminEmail,
} from '@/lib/types/user.types';

/**
 * Admin action log interface
 */
export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'driver' | 'student' | 'booking' | 'system';
  targetId: string;
  details: string;
  timestamp: string;
}

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  totalStudents: number;
  totalDrivers: number;
  pendingVerifications: number;
  approvedDrivers: number;
  rejectedDrivers: number;
  onlineDrivers: number;
  totalBookings: number;
  activeBookings: number;
}

/**
 * Admin Service for Firestore operations
 */
export const AdminService = {
  /**
   * Validate admin credentials
   */
  validateAdminLogin: async (
    email: string,
    password: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      // Check if email matches admin email
      if (!isAdminEmail(email)) {
        throw new Error('Invalid admin credentials');
      }

      // For MVP, check hardcoded password
      // In production, this should use Firebase Auth
      if (password !== 'Saurabh@123') {
        throw new Error('Invalid admin credentials');
      }

      return true;
    }, 'admin/validate-login');
  },

  /**
   * Create or update admin profile
   */
  createAdmin: async (
    uid: string,
    email: string,
    displayName: string
  ): Promise<ApiResponse<AdminProfile>> => {
    return firebaseHandler(async () => {
      if (!isAdminEmail(email)) {
        throw new Error('Not authorized as admin');
      }

      const now = new Date().toISOString();
      
      const adminData: AdminProfile = {
        uid,
        email,
        displayName,
        photoURL: null,
        phone: null,
        role: UserRole.ADMIN,
        emailVerified: true,
        isSuperAdmin: true,
        permissions: ['all'],
        lastActive: now,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, COLLECTIONS.ADMINS, uid), {
        ...adminData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Also update the main users collection with role
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        uid,
        email,
        displayName,
        role: UserRole.ADMIN,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return adminData;
    }, 'admin/create');
  },

  /**
   * Get admin profile
   */
  getAdmin: async (uid: string): Promise<ApiResponse<AdminProfile | null>> => {
    return firebaseHandler(async () => {
      const docRef = doc(db, COLLECTIONS.ADMINS, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as AdminProfile;
      }
      return null;
    }, 'admin/get');
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return firebaseHandler(async () => {
      // Get student count
      const studentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      const totalStudents = studentsSnapshot.size;

      // Get driver counts by status
      const driversSnapshot = await getDocs(collection(db, COLLECTIONS.DRIVERS));
      const drivers = driversSnapshot.docs.map(doc => doc.data() as DriverProfile);
      
      const totalDrivers = drivers.length;
      const pendingVerifications = drivers.filter(d => d.verificationStatus === VerificationStatus.PENDING).length;
      const approvedDrivers = drivers.filter(d => d.verificationStatus === VerificationStatus.APPROVED).length;
      const rejectedDrivers = drivers.filter(d => d.verificationStatus === VerificationStatus.REJECTED).length;
      const onlineDrivers = drivers.filter(d => d.onlineStatus === 'online').length;

      // Get booking counts (placeholder - implement when bookings are added)
      const totalBookings = 0;
      const activeBookings = 0;

      return {
        totalStudents,
        totalDrivers,
        pendingVerifications,
        approvedDrivers,
        rejectedDrivers,
        onlineDrivers,
        totalBookings,
        activeBookings,
      };
    }, 'admin/dashboard-stats');
  },

  /**
   * Get pending driver verifications
   */
  getPendingVerifications: async (): Promise<ApiResponse<DriverProfile[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.DRIVERS),
        where('verificationStatus', '==', VerificationStatus.PENDING),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DriverProfile);
    }, 'admin/pending-verifications');
  },

  /**
   * Approve driver
   */
  approveDriver: async (
    driverId: string,
    adminId: string,
    notes?: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const now = new Date().toISOString();
      
      // Update driver status
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
        verificationStatus: VerificationStatus.APPROVED,
        verificationNotes: notes || 'Verification approved',
        verifiedAt: now,
        verifiedBy: adminId,
        updatedAt: serverTimestamp(),
      });

      // Update user collection
      await updateDoc(doc(db, COLLECTIONS.USERS, driverId), {
        verificationStatus: VerificationStatus.APPROVED,
        updatedAt: serverTimestamp(),
      });

      // Log admin action
      await AdminService.logAction(
        adminId,
        'APPROVE_DRIVER',
        'driver',
        driverId,
        `Driver approved. Notes: ${notes || 'None'}`
      );

      return true;
    }, 'admin/approve-driver');
  },

  /**
   * Reject driver
   */
  rejectDriver: async (
    driverId: string,
    adminId: string,
    reason: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const now = new Date().toISOString();
      
      // Update driver status
      await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
        verificationStatus: VerificationStatus.REJECTED,
        verificationNotes: reason,
        verifiedAt: now,
        verifiedBy: adminId,
        updatedAt: serverTimestamp(),
      });

      // Update user collection
      await updateDoc(doc(db, COLLECTIONS.USERS, driverId), {
        verificationStatus: VerificationStatus.REJECTED,
        updatedAt: serverTimestamp(),
      });

      // Log admin action
      await AdminService.logAction(
        adminId,
        'REJECT_DRIVER',
        'driver',
        driverId,
        `Driver rejected. Reason: ${reason}`
      );

      return true;
    }, 'admin/reject-driver');
  },

  /**
   * Block/Unblock user
   */
  toggleUserBlock: async (
    userId: string,
    userType: 'student' | 'driver',
    block: boolean,
    adminId: string,
    reason?: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const collectionName = userType === 'student' ? COLLECTIONS.STUDENTS : COLLECTIONS.DRIVERS;
      
      await updateDoc(doc(db, collectionName, userId), {
        isBlocked: block,
        blockReason: block ? reason : null,
        blockedAt: block ? serverTimestamp() : null,
        blockedBy: block ? adminId : null,
        updatedAt: serverTimestamp(),
      });

      // Log admin action
      await AdminService.logAction(
        adminId,
        block ? 'BLOCK_USER' : 'UNBLOCK_USER',
        userType,
        userId,
        `User ${block ? 'blocked' : 'unblocked'}. Reason: ${reason || 'None'}`
      );

      return true;
    }, 'admin/toggle-block');
  },

  /**
   * Log admin action
   */
  logAction: async (
    adminId: string,
    action: string,
    targetType: 'driver' | 'student' | 'booking' | 'system',
    targetId: string,
    details: string
  ): Promise<void> => {
    try {
      // Get admin email
      const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, adminId));
      const adminEmail = adminDoc.exists() ? (adminDoc.data() as AdminProfile).email : 'unknown';

      await addDoc(collection(db, COLLECTIONS.ADMIN_LOGS), {
        adminId,
        adminEmail,
        action,
        targetType,
        targetId,
        details,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  },

  /**
   * Get admin logs
   */
  getAdminLogs: async (
    limitCount: number = 100
  ): Promise<ApiResponse<AdminLog[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.ADMIN_LOGS),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AdminLog[];
    }, 'admin/get-logs');
  },

  /**
   * Get all students for admin view
   */
  getAllStudents: async (): Promise<ApiResponse<StudentProfile[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.STUDENTS),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as StudentProfile);
    }, 'admin/get-all-students');
  },

  /**
   * Get all drivers for admin view
   */
  getAllDrivers: async (): Promise<ApiResponse<DriverProfile[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.DRIVERS),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DriverProfile);
    }, 'admin/get-all-drivers');
  },
};
