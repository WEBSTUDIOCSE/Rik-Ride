/**
 * Firebase Messaging Service Worker
 * Handles background push notifications
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config (UAT - will be overridden in production)
const firebaseConfig = {
  apiKey: "AIzaSyDr2GEwj5O4AMQF6JCAu0nhNhlezsgxHS8",
  authDomain: "env-uat-cd3c5.firebaseapp.com",
  projectId: "env-uat-cd3c5",
  storageBucket: "env-uat-cd3c5.firebasestorage.app",
  messagingSenderId: "614576728087",
  appId: "1:614576728087:web:6337d07f43cb3674001452",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Rik Ride';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    actions: getNotificationActions(payload.data?.type),
    requireInteraction: isHighPriority(payload.data?.type),
    vibrate: getVibrationPattern(payload.data?.type),
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Determine target URL based on notification type
  switch (data.type) {
    case 'NEW_BOOKING_REQUEST':
      targetUrl = '/driver/dashboard';
      break;
    case 'BOOKING_ACCEPTED':
    case 'DRIVER_ARRIVED':
    case 'RIDE_STARTED':
    case 'RIDE_COMPLETED':
      targetUrl = '/student/dashboard';
      break;
    case 'NEW_RATING':
    case 'LOW_RATING_WARNING':
      targetUrl = data.userType === 'driver' ? '/driver/dashboard' : '/student/dashboard';
      break;
    case 'PAYMENT_RECEIVED':
      targetUrl = '/driver/dashboard';
      break;
    case 'SOS_ALERT':
      targetUrl = data.locationUrl || '/';
      break;
    case 'DRIVER_VERIFICATION':
      targetUrl = '/driver/dashboard';
      break;
    default:
      targetUrl = '/';
  }

  // Handle action button clicks
  if (event.action === 'accept') {
    targetUrl = '/driver/dashboard?action=accept&bookingId=' + (data.bookingId || '');
  } else if (event.action === 'reject') {
    targetUrl = '/driver/dashboard?action=reject&bookingId=' + (data.bookingId || '');
  } else if (event.action === 'view') {
    // Keep default targetUrl
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open new window if app not open
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'NEW_BOOKING_REQUEST':
      return [
        { action: 'accept', title: '✅ Accept' },
        { action: 'reject', title: '❌ Reject' },
      ];
    case 'RIDE_COMPLETED':
      return [
        { action: 'view', title: '⭐ Rate Now' },
      ];
    case 'SOS_ALERT':
      return [
        { action: 'view', title: '📍 View Location' },
      ];
    default:
      return [];
  }
}

// Check if notification is high priority
function isHighPriority(type) {
  const highPriorityTypes = [
    'NEW_BOOKING_REQUEST',
    'SOS_ALERT',
    'DRIVER_ARRIVED',
    'LOW_RATING_WARNING',
  ];
  return highPriorityTypes.includes(type);
}

// Get vibration pattern based on notification type
function getVibrationPattern(type) {
  switch (type) {
    case 'SOS_ALERT':
      return [200, 100, 200, 100, 200, 100, 400]; // Urgent pattern
    case 'NEW_BOOKING_REQUEST':
      return [200, 100, 200]; // Double vibrate
    case 'DRIVER_ARRIVED':
      return [300, 100, 300]; // Strong double
    default:
      return [200]; // Single short vibrate
  }
}

// Log service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim());
});
