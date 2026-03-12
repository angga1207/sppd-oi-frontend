/* eslint-disable no-restricted-globals */
// Firebase Messaging Service Worker for background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCQpVhFsNqiAVHWHrH2PF0-gANh7kMp_04",
  authDomain: "e-spd-1f255.firebaseapp.com",
  projectId: "e-spd-1f255",
  storageBucket: "e-spd-1f255.firebasestorage.app",
  messagingSenderId: "716915912814",
  appId: "1:716915912814:web:f0a90523c5b6899fc1b67f",
  measurementId: "G-JQ4RWPMG9E"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'e-SPD Notifikasi';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo-oi.png',
    badge: '/logo-oi.png',
    data: payload.data,
    tag: 'espd-notification',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click - navigate to the URL from data
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
