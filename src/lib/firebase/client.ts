import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "mock-measurement-id",
};

const hasAnalyticsConfig = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
);

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics lazily only when real public Firebase keys are present.
let analytics: Analytics | null = null;
if (typeof window !== "undefined" && hasAnalyticsConfig) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    analytics = null;
  });
}

/**
 * Log a custom event to Firebase Analytics
 */
export function logAppEvent(eventName: string, eventParams?: AnalyticsParams) {
  const analyticsInstance = analytics;
  if (typeof window !== "undefined" && analyticsInstance) {
    import("firebase/analytics").then(({ logEvent }) => {
      logEvent(analyticsInstance, eventName, eventParams);
    }).catch(() => {
      console.debug(`[Analytics Mock] ${eventName}`, eventParams);
    });
  } else {
    // Development fallback or SSR fallback
    console.debug(`[Analytics Mock] ${eventName}`, eventParams);
  }
}

export { app, db, analytics };
