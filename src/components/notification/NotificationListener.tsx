'use client';

/**
 * Notification Listener Component
 * Polls Firestore for new notifications and shows them as browser notifications
 */

import { useEffect, useRef, useCallback } from 'react';
import { NotificationService } from '@/lib/firebase/services/notification.service';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface NotificationListenerProps {
  userType: 'student' | 'driver';
}

export function NotificationListener({ userType }: NotificationListenerProps) {
  const { user } = useAuth();
  const lastNotificationTime = useRef<Date>(new Date());
  const hasPermission = useRef(false);

  // Check and request notification permission
  useEffect(() => {
    const checkPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          hasPermission.current = true;
        } else if (Notification.permission !== 'denied') {
          const result = await Notification.requestPermission();
          hasPermission.current = result === 'granted';
        }
      }
    };
    checkPermission();
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, body: string, tag?: string) => {
    if (!hasPermission.current) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg',
        tag: tag || `notif-${Date.now()}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, []);

  // Listen for new notifications in Firestore
  useEffect(() => {
    if (!user?.uid) return;

    console.log(`[NotificationListener] Starting listener for ${userType}:`, user.uid);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const createdAt = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt);

          // Only show notifications created after component mounted
          if (createdAt > lastNotificationTime.current) {
            console.log('[NotificationListener] New notification:', data.title);
            showNotification(
              data.title || 'Rik-Ride',
              data.body || 'You have a new notification',
              data.data?.bookingId ? `booking-${data.data.bookingId}` : undefined
            );
          }
        }
      });
    }, (error) => {
      console.error('[NotificationListener] Error:', error);
    });

    // Update last notification time after initial load
    setTimeout(() => {
      lastNotificationTime.current = new Date();
    }, 2000);

    return () => {
      console.log('[NotificationListener] Stopping listener');
      unsubscribe();
    };
  }, [user?.uid, userType, showNotification]);

  // This component doesn't render anything
  return null;
}

export default NotificationListener;
