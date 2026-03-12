import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCQpVhFsNqiAVHWHrH2PF0-gANh7kMp_04",
  authDomain: "e-spd-1f255.firebaseapp.com",
  projectId: "e-spd-1f255",
  storageBucket: "e-spd-1f255.firebasestorage.app",
  messagingSenderId: "716915912814",
  appId: "1:716915912814:web:f0a90523c5b6899fc1b67f",
  measurementId: "G-JQ4RWPMG9E"
};

// VAPID key for push notifications
const VAPID_KEY = 'BFVWywf66aXXIy5M25j1i_LCMgNsB-mYjIdYW7nT1kenCBEbwi9dtVwUG4EqNhaf2kX0K6E_fTZte1upQKGgZ_M';

// Initialize Firebase app (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: Messaging | null = null;

/**
 * Get Firebase Messaging instance (browser only)
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser.');
    return null;
  }

  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

/**
 * Request permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const messagingInstance = await getMessagingInstance();
    if (!messagingInstance) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied.');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    const token = await getToken(messagingInstance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: { title: string; body: string; data?: Record<string, string> }) => void) {
  getMessagingInstance().then((messagingInstance) => {
    if (!messagingInstance) return;

    onMessage(messagingInstance, (payload) => {
      const title = payload.notification?.title || 'Notifikasi Baru';
      const body = payload.notification?.body || '';
      const data = payload.data as Record<string, string> | undefined;
      callback({ title, body, data });
    });
  });
}

export { app };
