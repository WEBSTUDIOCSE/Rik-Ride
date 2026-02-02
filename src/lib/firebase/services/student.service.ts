/**
 * Student Service
 * Handles all student-related Firestore operations
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
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../collections';
import { firebaseHandler, type ApiResponse } from '../handler';
import {
  type StudentProfile,
  type CreateStudentData,
  type SavedAddress,
  UserRole,
} from '@/lib/types/user.types';

/**
 * Student Service for Firestore operations
 */
export const StudentService = {
  /**
   * Create a new student profile
   */
  createStudent: async (
    uid: string,
    data: CreateStudentData
  ): Promise<ApiResponse<StudentProfile>> => {
    return firebaseHandler(async () => {
      const now = new Date().toISOString();
      
      const studentData: StudentProfile = {
        uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: null,
        phone: data.phone || null,
        parentPhone: data.parentPhone || null,
        role: UserRole.STUDENT,
        emailVerified: false,
        universityEmail: data.universityEmail,
        studentId: data.studentId,
        department: data.department,
        year: data.year,
        emergencyContact: null,
        emergencyContacts: [],
        savedAddresses: [],
        walletBalance: 0,
        totalRides: 0,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, COLLECTIONS.STUDENTS, uid), {
        ...studentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Also update the main users collection with role
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: UserRole.STUDENT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      return studentData;
    }, 'student/create');
  },

  /**
   * Get student profile by UID
   */
  getStudent: async (uid: string): Promise<ApiResponse<StudentProfile | null>> => {
    return firebaseHandler(async () => {
      const docRef = doc(db, COLLECTIONS.STUDENTS, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as StudentProfile;
      }
      return null;
    }, 'student/get');
  },

  /**
   * Update student profile
   */
  updateStudent: async (
    uid: string,
    data: Partial<StudentProfile>
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const docRef = doc(db, COLLECTIONS.STUDENTS, uid);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return true;
    }, 'student/update');
  },

  /**
   * Add saved address
   */
  addSavedAddress: async (
    uid: string,
    address: Omit<SavedAddress, 'id'>
  ): Promise<ApiResponse<SavedAddress>> => {
    return firebaseHandler(async () => {
      const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const student = studentDoc.data() as StudentProfile;
      const newAddress: SavedAddress = {
        ...address,
        id: crypto.randomUUID(),
      };

      // If this is set as default, unset other defaults
      let updatedAddresses = student.savedAddresses || [];
      if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({
          ...addr,
          isDefault: false,
        }));
      }
      updatedAddresses.push(newAddress);

      await updateDoc(doc(db, COLLECTIONS.STUDENTS, uid), {
        savedAddresses: updatedAddresses,
        updatedAt: serverTimestamp(),
      });

      return newAddress;
    }, 'student/add-address');
  },

  /**
   * Update wallet balance
   */
  updateWalletBalance: async (
    uid: string,
    amount: number
  ): Promise<ApiResponse<number>> => {
    return firebaseHandler(async () => {
      const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const student = studentDoc.data() as StudentProfile;
      const newBalance = student.walletBalance + amount;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      await updateDoc(doc(db, COLLECTIONS.STUDENTS, uid), {
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });

      return newBalance;
    }, 'student/update-wallet');
  },

  /**
   * Get all students (for admin)
   */
  getAllStudents: async (
    limitCount: number = 50
  ): Promise<ApiResponse<StudentProfile[]>> => {
    return firebaseHandler(async () => {
      const q = query(
        collection(db, COLLECTIONS.STUDENTS),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as StudentProfile);
    }, 'student/get-all');
  },

  /**
   * Search students by email or name
   */
  searchStudents: async (
    searchTerm: string
  ): Promise<ApiResponse<StudentProfile[]>> => {
    return firebaseHandler(async () => {
      // Search by email
      const emailQuery = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff'),
        limit(20)
      );
      
      const snapshot = await getDocs(emailQuery);
      return snapshot.docs.map(doc => doc.data() as StudentProfile);
    }, 'student/search');
  },
};
