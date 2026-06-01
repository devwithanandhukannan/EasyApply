"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { messaging } from "../lib/firebase"; // നിങ്ങളുടെ ഫയർബേസ് ക്ലയന്റ് പാത്ത്
import { onMessage } from "firebase/messaging";
import { toast, Toaster } from "react-hot-toast";

const FcmContext = createContext<any>(null);

export const FcmProvider = ({ children }: { children: React.ReactNode }) => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!messaging) return;

    // ⚡ ഫ്രണ്ട് എൻഡ് ആപ്പ് ഓപ്പൺ ആയിരിക്കുമ്പോൾ (Foreground) മെസ്സേജ് വരുന്നത് ലിസൺ ചെയ്യുന്നു
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Live Push Message Received in Frontend! 📩", payload);

      // ബാക്കെൻഡ് അയക്കുന്ന ടൈറ്റിലും ബോഡിയും വെച്ച് സ്ക്രീനിൽ പോപ്പ് അപ്പ് കാണിക്കുന്നു
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-in fade-in" : "animate-out fade-out"
          } max-w-md w-full bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl rounded-2xl pointer-events-auto flex p-4 transition-all duration-300`}
        >
          <div className="flex-1 w-0">
            <p className="text-sm font-bold text-indigo-400">
              {payload.notification?.title || "Application Alert"}
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {payload.notification?.body}
            </p>
          </div>
          <div className="flex border-l border-slate-800 pl-3 ml-3 items-center">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      ), { duration: 6000, position: "top-right" });
    });

    return () => unsubscribe();
  }, []);

  return (
    <FcmContext.Provider value={{ fcmToken, setFcmToken }}>
      <Toaster /> {/* ടോസ്റ്റുകൾ കാണിക്കാൻ ഇത് ഇവിടെ ഉണ്ടായിരിക്കണം */}
      {children}
    </FcmContext.Provider>
  );
};

export const useFcm = () => useContext(FcmContext);