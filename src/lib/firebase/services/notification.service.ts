/**
 * Firebase Cloud Messaging (FCM) Notification Service
 * Handles push notifications for web clients
 */

import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';
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
  limit,
  deleteDoc,
} from 'firebase/firestore';
import { db, app } from '@/lib/firebase/firebase';
import { getCurrentFirebaseConfig } from '@/lib/firebase/config/environments';
import {
  NotificationType,
  NotificationPayload,
  StoredNotification,
  FCMTokenRecord,
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_TEMPLATES,
} from '@/lib/types/notification.types';

const FCM_TOKENS_COLLECTION = 'fcmTokens';
const NOTIFICATIONS_COLLECTION = 'notifications';
const PREFERENCES_COLLECTION = 'notificationPreferences';

class NotificationServiceClass {
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private messageUnsubscribe: (() => void) | null = null;
  private isInitialized = false;

  /**
   * Check if browser supports push notifications
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Initialize Firebase Messaging
   */
  private async initializeMessaging(): Promise<Messaging | null> {
    if (this.messaging) return this.messaging;
    
    if (!this.isSupported()) {
      console.warn('Push notifications not supported in this browser');
      return null;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration.scope);

      // Get messaging instance
      this.messaging = getMessaging(app);
      this.isInitialized = true;
      return this.messaging;
    } catch (error) {
      console.error('Failed to initialize messaging:', error);
      return null;
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(
    userId: string,
    userType: 'student' | 'driver' | 'admin'
  ): Promise<string | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return null;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Initialize messaging
      const messaging = await this.initializeMessaging();
      if (!messaging) return null;

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get FCM token
      const config = getCurrentFirebaseConfig();
      const token = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log('FCM token obtained');
        this.currentToken = token;
        
        // Save token to Firestore
        await this.saveToken(token, userId, userType);
        
        // Set up foreground message handler
        this.setupForegroundHandler();
        
        return token;
      } else {
        console.log('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   */
  private async saveToken(
    token: string,
    userId: string,
    userType: 'student' | 'driver' | 'admin'
  ): Promise<void> {
    try {
      const tokenRef = doc(db, FCM_TOKENS_COLLECTION, token);
      
      const tokenRecord: FCMTokenRecord = {
        token,
        userId,
        userType,
        deviceType: 'web',
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true,
      };

      await setDoc(tokenRef, {
        ...tokenRecord,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
      });
      
      console.log('FCM token saved to Firestore');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Remove FCM token (on logout)
   */
  async removeToken(): Promise<void> {
    if (!this.currentToken) return;
    
    try {
      const tokenRef = doc(db, FCM_TOKENS_COLLECTION, this.currentToken);
      await updateDoc(tokenRef, { isActive: false });
      this.currentToken = null;
      
      if (this.messageUnsubscribe) {
        this.messageUnsubscribe();
        this.messageUnsubscribe = null;
      }
      
      console.log('FCM token deactivated');
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  /**
   * Set up foreground message handler
   */
  private setupForegroundHandler(): void {
    if (!this.messaging || this.messageUnsubscribe) return;
    
    this.messageUnsubscribe = onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification manually in foreground
      if (payload.notification) {
        this.showLocalNotification({
          type: (payload.data?.type as NotificationType) || NotificationType.SYSTEM_MESSAGE,
          title: payload.notification.title || 'Rik-Ride',
          body: payload.notification.body || '',
          data: payload.data as Record<string, string>,
          icon: payload.notification.icon,
        });
      }
    });
  }

  /**
   * Show local notification (for foreground messages)
   */
  showLocalNotification(payload: NotificationPayload): void {
    if (Notification.permission !== 'granted') return;

    const notificationOptions: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.svg',
      badge: '/icon-192x192.svg',
      data: payload.data,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
    };

    const notification = new Notification(payload.title, notificationOptions);

    notification.onclick = () => {
      window.focus();
      if (payload.clickAction) {
        window.location.href = payload.clickAction;
      }
      notification.close();
    };
  }

  /**
   * Get user's FCM tokens
   */
  async getUserTokens(userId: string): Promise<string[]> {
    try {
      const tokensQuery = query(
        collection(db, FCM_TOKENS_COLLECTION),
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(tokensQuery);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting user tokens:', error);
      return [];
    }
  }

  /**
   * Store notification in Firestore (for notification history)
   */
  async storeNotification(
    userId: string,
    notification: Omit<StoredNotification, 'id' | 'createdAt'>
  ): Promise<string | null> {
    try {
      const notifRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...notification,
        createdAt: serverTimestamp(),
      });
      return notifRef.id;
    } catch (error) {
      console.error('Error storing notification:', error);
      return null;
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    limitCount: number = 50
  ): Promise<StoredNotification[]> {
    try {
      const notifsQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(notifsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as StoredNotification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifsQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(notifsQuery);
      const updatePromises = snapshot.docs.map(doc =>
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifsQuery = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(notifsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get/Create notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const prefRef = doc(db, PREFERENCES_COLLECTION, userId);
      const prefSnap = await getDoc(prefRef);
      
      if (prefSnap.exists()) {
        return { userId, ...prefSnap.data() } as NotificationPreferences;
      }
      
      // Create default preferences
      const defaultPrefs: NotificationPreferences = {
        userId,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      };
      
      await setDoc(prefRef, defaultPrefs);
      return defaultPrefs;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return { userId, ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const prefRef = doc(db, PREFERENCES_COLLECTION, userId);
      await setDoc(prefRef, { userId, ...updates }, { merge: true });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  /**
   * Send notification to a user (stores in Firestore and shows local notification)
   * Note: For actual cross-device push, Cloud Functions would be needed
   */
  async sendToUser(
    userId: string,
    type: NotificationType,
    variables: Record<string, string> = {}
  ): Promise<void> {
    try {
      // Get template
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        console.error('Unknown notification type:', type);
        return;
      }

      // Replace variables in template
      let title = template.title;
      let body = template.body;
      
      Object.entries(variables).forEach(([key, value]) => {
        title = title.replace(`{${key}}`, value);
        body = body.replace(`{${key}}`, value);
      });

      // Store notification in Firestore
      await this.storeNotification(userId, {
        userId,
        type,
        title,
        body,
        data: variables,
        read: false,
      });

      // Show local notification immediately if permission granted
      if (Notification.permission === 'granted') {
        this.showLocalNotification({
          type,
          title,
          body,
          data: variables,
          icon: '/icon-192x192.svg',
          tag: variables.bookingId ? `booking-${variables.bookingId}` : undefined,
          requireInteraction: type === NotificationType.NEW_BOOKING_REQUEST || 
                              type === NotificationType.SOS_ALERT,
        });
      }

      console.log(`Notification sent to user ${userId}:`, { type, title });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Build notification payload from type and variables
   */
  buildPayload(
    type: NotificationType,
    variables: Record<string, string> = {},
    options: Partial<NotificationPayload> = {}
  ): NotificationPayload {
    const template = NOTIFICATION_TEMPLATES[type];
    
    let title = template?.title || 'Rik-Ride';
    let body = template?.body || '';
    
    Object.entries(variables).forEach(([key, value]) => {
      title = title.replace(`{${key}}`, value);
      body = body.replace(`{${key}}`, value);
    });

    return {
      type,
      title,
      body,
      icon: '/icon-192x192.svg',
      ...options,
    };
  }
}

// Export singleton instance
export const NotificationService = new NotificationServiceClass();

// Export for direct imports
export default NotificationService;
