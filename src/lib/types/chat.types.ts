/**
 * Chat Types for Rik-Ride
 * Defines chat-related types for student-driver communication
 */

/**
 * Chat message sender type
 */
export type MessageSender = 'student' | 'driver';

/**
 * Message status
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

/**
 * Individual chat message
 */
export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: MessageSender;
  senderName: string;
  message: string;
  timestamp: string;
  status: MessageStatus;
}

/**
 * Chat room/conversation
 */
export interface ChatRoom {
  id: string; // Same as bookingId
  bookingId: string;
  studentId: string;
  studentName: string;
  driverId: string;
  driverName: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // Becomes false when ride starts
  lastMessage: string | null;
  lastMessageTime: string | null;
}

/**
 * Quick reply templates
 */
export const QUICK_REPLIES = {
  student: [
    "I'm at the pickup location",
    "Running a few minutes late",
    "Can you wait 2 minutes?",
    "I'm wearing a red jacket",
    "Is this the correct vehicle?",
  ],
  driver: [
    "I've arrived at the pickup",
    "Please come to the vehicle",
    "Traffic delay, reaching in 5 mins",
    "I'm in the red auto",
    "Please share exact location",
  ],
} as const;
