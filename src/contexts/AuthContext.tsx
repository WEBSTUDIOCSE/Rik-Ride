/**
 * Authentication Context Provider
 * Manages global authentication state using Firebase Auth
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { UserRole } from '@/lib/types/user.types';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps app to provide real-time auth state
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Set cookie for middleware to access
      if (user) {
        try {
          // Get Firebase ID token
          const token = await user.getIdToken();
          
          // Fetch user role from Firestore
          let role: UserRole | undefined;
          let verificationStatus: string | undefined;
          
          // Check each collection for the user's role
          const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, user.uid));
          if (studentDoc.exists()) {
            role = UserRole.STUDENT;
          } else {
            const driverDoc = await getDoc(doc(db, COLLECTIONS.DRIVERS, user.uid));
            if (driverDoc.exists()) {
              role = UserRole.DRIVER;
              verificationStatus = driverDoc.data()?.verificationStatus;
            } else {
              const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
              if (adminDoc.exists()) {
                role = UserRole.ADMIN;
              }
            }
          }
          
          // Set auth cookie via API route with user data including role
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              token,
              user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                role,
                verificationStatus,
              }
            }),
          });
        } catch (error) {
          console.error('[AuthContext] Error setting session:', error);
        }
      } else {
        // Clear auth cookie
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
