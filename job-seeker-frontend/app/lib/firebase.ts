import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDV_sTRvzW2niB-pFH7SQSGFQK32OgVVzk",
  authDomain: "interview-platform-6c2d5.firebaseapp.com",
  projectId: "interview-platform-6c2d5",
  storageBucket: "interview-platform-6c2d5.firebasestorage.app",
  messagingSenderId: "481624099070",
  appId: "1:481624099070:web:aa692fb59e47551d2f7daf"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    // 1. Register the Service Worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    // 2. WAIT for the Service Worker to be active
    // This resolves the 'no active Service Worker' race condition
    if (registration.active) {
      // Worker is already active
    } else {
      await new Promise<void>((resolve) => {
        const checkActive = () => {
          if (registration.active) {
            resolve();
          } else {
            registration.addEventListener('activate', resolve, { once: true });
          }
        };
        checkActive();
      });
    }

    // 3. Now that we are certain the SW is active, get the token
    const currentToken = await getToken(messaging, {
      vapidKey: "BA3Ue91cqFkFrfPUJ_QlVp653Dj8k5JgJrqwysusX3eEhSIR4xK2OMWsPdBxxO8SpW8F3r25v2op19DGp2vp4u8",
      serviceWorkerRegistration: registration,
    });
    
    return currentToken;
  } catch (error) {
    console.error("FCM Token generation error:", error);
    return null;
  }
};


