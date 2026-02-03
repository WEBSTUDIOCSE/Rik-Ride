'use client';

/**
 * Notification Listener Component
 * Listens to Firestore for new notifications and shows them as browser notifications
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface NotificationListenerProps {
  userType: 'student' | 'driver';
}

export function NotificationListener({ userType }: NotificationListenerProps) {
  const { user } = useAuth();
  const lastNotificationTime = useRef<Date>(new Date());
  const hasPermission = useRef(false);
  const shownNotifications = useRef<Set<string>>(new Set());

  // Check and request notification permission
  useEffect(() => {
    const checkPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          hasPermission.current = true;
          console.log('[NotificationListener] Permission granted');
        } else if (Notification.permission !== 'denied') {
          const result = await Notification.requestPermission();
          hasPermission.current = result === 'granted';
          console.log('[NotificationListener] Permission result:', result);
        }
      }
    };
    checkPermission();
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string, notifId: string) => {
    // Prevent duplicate notifications
    if (shownNotifications.current.has(notifId)) {
      return;
    }
    shownNotifications.current.add(notifId);

    console.log('[NotificationListener] Showing notification:', title, body);

    if (!hasPermission.current) {
      console.log('[NotificationListener] No permission, skipping');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: notifId,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 8 seconds
      setTimeout(() => notification.close(), 8000);
    } catch (error) {
      console.error('[NotificationListener] Failed to show notification:', error);
    }
  }, []);

  // Listen for new notifications in Firestore
  useEffect(() => {
    if (!user?.uid) {
      console.log('[NotificationListener] No user, skipping');
      return;
    }

    console.log(`[NotificationListener] Starting listener for ${userType}:`, user.uid);

    // Simple query - just filter by userId (no compound index needed)
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[NotificationListener] Snapshot received, ${snapshot.docChanges().length} changes`);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const docId = change.doc.id;
          
          // Parse createdAt
          let createdAt: Date;
          if (data.createdAt instanceof Timestamp) {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt) {
            createdAt = new Date(data.createdAt);
          } else {
            createdAt = new Date();
          }

          console.log('[NotificationListener] New doc:', {
            id: docId,
            title: data.title,
            createdAt: createdAt.toISOString(),
            lastNotificationTime: lastNotificationTime.current.toISOString(),
          });

          // Only show notifications created after component mounted
          if (createdAt > lastNotificationTime.current && !data.read) {
            showNotification(
              data.title || 'Rik-Ride',
              data.body || 'You have a new notification',
              docId
            );
          }
        }
      });
    }, (error) => {
      console.error('[NotificationListener] Firestore error:', error);
    });

    // Set the initial time after a short delay to avoid showing old notifications
    const timer = setTimeout(() => {
      lastNotificationTime.current = new Date();
      console.log('[NotificationListener] Initial time set:', lastNotificationTime.current.toISOString());
    }, 3000);

    return () => {
      console.log('[NotificationListener] Stopping listener');
      clearTimeout(timer);
      unsubscribe();
    };
  }, [user?.uid, userType, showNotification]);

  // This component doesn't render anything
  return null;
}

export default NotificationListener;
