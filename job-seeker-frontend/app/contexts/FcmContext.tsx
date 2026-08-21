"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { messaging, requestNotificationPermission } from "../lib/firebase"; 
import { onMessage } from "firebase/messaging";
import api from "../lib/axios";
import { useGlassToast } from "../components/GlassToastContainer";

const FcmContext = createContext<{
  fcmToken: string | null;
  permissionStatus: NotificationPermission | null;
}>({
  fcmToken: null,
  permissionStatus: null,
});

export const FcmProvider = ({ children }: { children: React.ReactNode }) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const { showToast } = useGlassToast(); // ⚡ Access your native workspace toast pipeline

  useEffect(() => {
    const initializeFcm = async () => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      
      const currentPermission = Notification.permission;
      setPermissionStatus(currentPermission);

      // Only request permission if not yet decided (never auto-request on denied/granted)
      if (currentPermission !== 'default') {
        if (currentPermission === 'granted') {
          // Already granted — just get token silently
          const token = await requestNotificationPermission();
          if (token) {
            setFcmToken(token);
            try { await api.post("/jobseeker/notification/token", { token }); } catch {}
          }
        }
        return; // Don't auto-prompt — let user trigger it
      }

      // Don't auto-request — permission request must come from user interaction
      // We expose a function that UI can call on a button click
    };

    // Delay to avoid triggering during SSR hydration / initial mount
    const timer = setTimeout(initializeFcm, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Live Push Message Received in Frontend! 📩", payload);
      
      const notificationTitle = payload.notification?.title || payload.data?.title || "Application Alert";
      const notificationBody = payload.notification?.body || payload.data?.body || "New update received.";

      // ⚡ Fire off your consistent design system toast
      showToast(notificationTitle, notificationBody, "info");
    });

    return () => unsubscribe();
  }, [fcmToken, showToast]);

  return (
    <FcmContext.Provider value={{ fcmToken, permissionStatus }}>
      {children}
    </FcmContext.Provider>
  );
};

export const useFcm = () => useContext(FcmContext);