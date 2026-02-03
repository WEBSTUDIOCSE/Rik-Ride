'use client';

/**
 * Notification Listener Component
 * Listens to Firestore for new notifications and shows them with sound
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  limit,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface NotificationListenerProps {
  userType: 'student' | 'driver';
}

export function NotificationListener({ userType }: NotificationListenerProps) {
  const { user } = useAuth();
  const mountTime = useRef<number>(Date.now());
  const shownNotificationIds = useRef<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);

  // Play notification sound using Web Audio API
  const playSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant notification beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Two-tone notification sound
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // C#6
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('[NotificationListener] 🔊 Sound played');
    } catch (error) {
      console.log('[NotificationListener] Sound error (user interaction may be needed):', error);
    }
  }, []);

  // Show browser notification with sound - works on both iOS and Android
  const showNotification = useCallback(async (title: string, body: string, notifId: string) => {
    // Prevent duplicate notifications
    if (shownNotificationIds.current.has(notifId)) {
      console.log('[NotificationListener] Skipping duplicate:', notifId);
      return;
    }
    shownNotificationIds.current.add(notifId);

    console.log('[NotificationListener] 🔔 Attempting to show notification:', { title, body, notifId });

    // Play sound first (works on both platforms)
    playSound();

    // Check if notifications are supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('[NotificationListener] Notifications not supported');
      return;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.log('[NotificationListener] Permission not granted:', Notification.permission);
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        console.log('[NotificationListener] Permission denied');
        return;
      }
    }

    try {
      // Try using Service Worker first (required for Android)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: notifId,
          requireInteraction: true,
          vibrate: [200, 100, 200], // Vibration pattern for Android
          data: { notifId },
        } as NotificationOptions);
        console.log('[NotificationListener] ✅ Service Worker notification shown (Android compatible)');
      } else {
        // Fallback to regular Notification API (iOS Safari, Desktop)
        const notification = new Notification(title, {
          body,
          icon: '/icon-192x192.svg',
          badge: '/icon-192x192.svg',
          tag: notifId,
          requireInteraction: true,
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);
        console.log('[NotificationListener] ✅ Regular notification shown (iOS/Desktop)');
      }
    } catch (error) {
      console.error('[NotificationListener] ❌ Failed to show notification:', error);
      
      // Last resort: try regular Notification anyway
      try {
        new Notification(title, { body, icon: '/icon-192x192.svg' });
        console.log('[NotificationListener] ✅ Fallback notification shown');
      } catch (e) {
        console.error('[NotificationListener] ❌ All notification methods failed:', e);
      }
    }
  }, [playSound]);

  // Listen for new notifications in Firestore
  useEffect(() => {
    if (!user?.uid) {
      console.log('[NotificationListener] No user logged in');
      return;
    }

    console.log(`[NotificationListener] 🎧 Starting listener for ${userType}: ${user.uid}`);
    setIsListening(true);

    // Simple query - just filter by userId (no compound index needed)
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`[NotificationListener] 📨 Received ${snapshot.docs.length} docs, ${snapshot.docChanges().length} changes`);

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const docId = change.doc.id;

            // Parse createdAt timestamp
            let createdAtMs: number;
            if (data.createdAt instanceof Timestamp) {
              createdAtMs = data.createdAt.toMillis();
            } else if (data.createdAt?.seconds) {
              createdAtMs = data.createdAt.seconds * 1000;
            } else {
              createdAtMs = Date.now();
            }

            const timeSinceMount = createdAtMs - mountTime.current;
            const isNew = timeSinceMount > 0;
            const isUnread = data.read === false;

            console.log('[NotificationListener] Doc:', {
              id: docId,
              title: data.title,
              userId: data.userId,
              read: data.read,
              createdAt: new Date(createdAtMs).toISOString(),
              mountTime: new Date(mountTime.current).toISOString(),
              timeSinceMount,
              isNew,
              isUnread,
            });

            // Show notification if it's new (created after mount) and unread
            if (isNew && isUnread) {
              showNotification(
                data.title || 'Rik-Ride',
                data.body || 'You have a new notification',
                docId
              );

              // Mark as read after showing (optional - uncomment if you want auto-read)
              // updateDoc(doc(db, 'notifications', docId), { read: true });
            }
          }
        });
      },
      (error) => {
        console.error('[NotificationListener] ❌ Firestore error:', error);
        setIsListening(false);
      }
    );

    return () => {
      console.log('[NotificationListener] 🛑 Stopping listener');
      setIsListening(false);
      unsubscribe();
    };
  }, [user?.uid, userType, showNotification]);

  // Debug: show listening status in console
  useEffect(() => {
    if (isListening && user?.uid) {
      console.log(`[NotificationListener] ✅ Active for ${userType} (${user.uid})`);
    }
  }, [isListening, user?.uid, userType]);

  // This component doesn't render anything visible
  return null;
}

export default NotificationListener;
