import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

let app: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("Notification" in window))
    return false;
  return isSupported();
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  const supported = await isPushSupported();
  if (!supported) return null;
  const fbApp = await getFirebaseApp();
  messagingInstance = getMessaging(fbApp);
  return messagingInstance;
}

export type PushSetupResult =
  | { status: "granted"; token: string }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; error: unknown };

/**
 * Requests notification permission (if not already decided) and returns
 * an FCM registration token on success. Safe to call multiple times.
 */
export async function requestPushToken(): Promise<PushSetupResult> {
  const messaging = await getMessagingInstance();
  if (!messaging) return { status: "unsupported" };

  try {
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return { status: "denied" };

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token)
      return { status: "error", error: new Error("No token returned") };
    return { status: "granted", token };
  } catch (error) {
    return { status: "error", error };
  }
}

/** Returns current permission without prompting. */
export function getCurrentPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.permission;
}

/** Foreground message listener — call once, e.g. from a top-level provider. */
export async function onForegroundMessage(
  callback: (payload: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }) => void,
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title ?? payload.data?.title,
      body: payload.notification?.body ?? payload.data?.body,
      data: payload.data,
    });
  });

  return unsubscribe;
}
