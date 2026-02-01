/**
 * Firestore Collection Names
 * Centralized collection references for the database
 */

export const COLLECTIONS = {
  // User collections
  USERS: 'users',
  STUDENTS: 'students',
  DRIVERS: 'drivers',
  ADMINS: 'admins',
  
  // Booking and ride collections
  BOOKINGS: 'bookings',
  RIDE_HISTORY: 'ride_history',
  
  // Payment collections
  PAYMENTS: 'payments',
  WALLET_TRANSACTIONS: 'wallet_transactions',
  
  // Verification collections
  VERIFICATION_REQUESTS: 'verification_requests',
  DRIVER_DOCUMENTS: 'driver_documents',
  
  // Rating and review collections
  RATINGS: 'ratings',
  REVIEWS: 'reviews',
  
  // System collections
  SETTINGS: 'settings',
  ADMIN_LOGS: 'admin_logs',
} as const;

/**
 * Subcollection names
 */
export const SUBCOLLECTIONS = {
  DOCUMENTS: 'documents',
  RIDES: 'rides',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
export type SubcollectionName = typeof SUBCOLLECTIONS[keyof typeof SUBCOLLECTIONS];
