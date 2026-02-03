/**
 * Chat Service
 * Handles real-time chat between student and driver during booking
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
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../collections';
import { firebaseHandler, type ApiResponse } from '../handler';
import type { ChatMessage, ChatRoom, MessageSender } from '@/lib/types/chat.types';
import { MessageStatus } from '@/lib/types/chat.types';

// Collection names
const CHAT_ROOMS = 'chatRooms';
const CHAT_MESSAGES = 'chatMessages';

/**
 * Chat Service
 */
export const ChatService = {
  /**
   * Create a chat room for a booking
   */
  createChatRoom: async (
    bookingId: string,
    studentId: string,
    studentName: string,
    driverId: string,
    driverName: string
  ): Promise<ApiResponse<ChatRoom>> => {
    return firebaseHandler(async () => {
      const now = new Date().toISOString();

      const chatRoom: ChatRoom = {
        id: bookingId,
        bookingId,
        studentId,
        studentName,
        driverId,
        driverName,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        lastMessage: null,
        lastMessageTime: null,
      };

      await setDoc(doc(db, CHAT_ROOMS, bookingId), {
        ...chatRoom,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return chatRoom;
    }, 'chat/create-room');
  },

  /**
   * Get chat room by booking ID
   */
  getChatRoom: async (bookingId: string): Promise<ApiResponse<ChatRoom | null>> => {
    return firebaseHandler(async () => {
      const docRef = doc(db, CHAT_ROOMS, bookingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as ChatRoom;
      }
      return null;
    }, 'chat/get-room');
  },

  /**
   * Send a chat message
   */
  sendMessage: async (
    bookingId: string,
    senderId: string,
    senderType: MessageSender,
    senderName: string,
    message: string
  ): Promise<ApiResponse<ChatMessage>> => {
    return firebaseHandler(async () => {
      // Check if chat room is active
      const roomRef = doc(db, CHAT_ROOMS, bookingId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Chat room not found');
      }

      const room = roomSnap.data() as ChatRoom;

      if (!room.isActive) {
        throw new Error('Chat is disabled after ride starts');
      }

      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      const chatMessage: ChatMessage = {
        id: messageId,
        bookingId,
        senderId,
        senderType,
        senderName,
        message,
        timestamp: now,
        status: MessageStatus.SENT,
      };

      // Save message
      await setDoc(doc(db, CHAT_MESSAGES, messageId), {
        ...chatMessage,
        timestamp: serverTimestamp(),
      });

      // Update chat room with last message
      await updateDoc(roomRef, {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return chatMessage;
    }, 'chat/send-message');
  },

  /**
   * Get all messages for a booking
   */
  getMessages: async (bookingId: string): Promise<ApiResponse<ChatMessage[]>> => {
    return firebaseHandler(async () => {
      const messagesQuery = query(
        collection(db, CHAT_MESSAGES),
        where('bookingId', '==', bookingId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate().toISOString() 
            : data.timestamp,
        } as ChatMessage;
      });
    }, 'chat/get-messages');
  },

  /**
   * Subscribe to chat messages (real-time)
   */
  subscribeToMessages: (
    bookingId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe => {
    const messagesQuery = query(
      collection(db, CHAT_MESSAGES),
      where('bookingId', '==', bookingId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate().toISOString() 
            : data.timestamp,
        } as ChatMessage;
      });
      callback(messages);
    });
  },

  /**
   * Disable chat (called when ride starts)
   */
  disableChat: async (bookingId: string): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const roomRef = doc(db, CHAT_ROOMS, bookingId);
      await updateDoc(roomRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
      return true;
    }, 'chat/disable');
  },

  /**
   * Mark messages as read
   */
  markMessagesAsRead: async (
    bookingId: string,
    readerId: string
  ): Promise<ApiResponse<boolean>> => {
    return firebaseHandler(async () => {
      const messagesQuery = query(
        collection(db, CHAT_MESSAGES),
        where('bookingId', '==', bookingId),
        where('senderId', '!=', readerId),
        where('status', '!=', MessageStatus.READ)
      );

      const snapshot = await getDocs(messagesQuery);
      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { status: MessageStatus.READ })
      );

      await Promise.all(updatePromises);
      return true;
    }, 'chat/mark-read');
  },

  /**
   * Check if chat is active for a booking
   */
  isChatActive: async (bookingId: string): Promise<boolean> => {
    try {
      const docRef = doc(db, CHAT_ROOMS, bookingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const room = docSnap.data() as ChatRoom;
        return room.isActive;
      }
      return false;
    } catch (error) {
      console.error('Error checking chat status:', error);
      return false;
    }
  },
};

export default ChatService;
