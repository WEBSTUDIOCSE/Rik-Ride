/**
 * Server-Side Authentication Utilities
 * For use in Server Components and Server Actions
 */

import { cookies } from 'next/headers';
import { cache } from 'react';
import { UserRole, VerificationStatus, isAdminEmail } from '@/lib/types/user.types';

export interface ServerUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role?: UserRole;
  verificationStatus?: VerificationStatus;
}

/**
 * Get current user on server-side
 * Uses React cache to avoid multiple reads per request
 */
export const getCurrentUser = cache(async (): Promise<ServerUser | null> => {
  try {
    const cookieStore = await cookies();
    
    // Check for Firebase auth cookie
    const authToken = cookieStore.get('firebaseAuthToken')?.value;
    const userData = cookieStore.get('userData')?.value;

    if (!authToken) {
      return null;
    }

    if (!userData) {
      return null;
    }

    const user = JSON.parse(userData) as ServerUser;
    return user;
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    return null;
  }
});

/**
 * Require authentication - throws redirect if not authenticated
 */
export async function requireAuth(): Promise<ServerUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.email) return false;
  return isAdminEmail(user.email) || user.role === UserRole.ADMIN;
}

/**
 * Check if current user is a student
 */
export async function isStudent(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.STUDENT;
}

/**
 * Check if current user is a driver
 */
export async function isDriver(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.DRIVER;
}

/**
 * Check if driver is verified
 */
export async function isVerifiedDriver(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === UserRole.DRIVER && user?.verificationStatus === VerificationStatus.APPROVED;
}

/**
 * Require specific role
 */
export async function requireRole(role: UserRole): Promise<ServerUser> {
  const user = await requireAuth();
  
  if (user.role !== role) {
    throw new Error(`Unauthorized: Requires ${role} role`);
  }
  
  return user;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<ServerUser> {
  const user = await requireAuth();
  
  if (!user.email || !isAdminEmail(user.email)) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return user;
}
