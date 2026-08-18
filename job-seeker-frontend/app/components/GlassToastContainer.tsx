"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, Check, AlertCircle, Info, Bell, Sparkles, Rocket } from "lucide-react";

export type ToastType = "success" | "danger" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: ToastType;
  timestamp: string;
}

interface ToastContextType {
  showToast: (title: string, body: string, type: ToastType) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, body: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = "now";
    setToasts((prev) => [...prev, { id, title, body, type, timestamp }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearAll = () => setToasts([]);

  const getIconConfig = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          icon: Check,
          badgeBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
          iconColor: "text-emerald-400",
          glowColor: "rgba(16, 185, 129, 0.25)",
        };
      case "danger":
        return {
          icon: AlertCircle,
          badgeBg: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
          iconColor: "text-rose-400",
          glowColor: "rgba(244, 63, 94, 0.25)",
        };
      case "info":
      default:
        return {
          icon: Info,
          badgeBg: "bg-blue-500/20 text-[#0071e3] border border-blue-500/30",
          iconColor: "text-[#0071e3]",
          glowColor: "rgba(0, 113, 227, 0.25)",
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, clearAll }}>
      {children}

      {/* ── macOS Genie Notification Centre Viewport (Bottom Right) ── */}
      <div 
        className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end gap-3 w-full max-w-[340px] pointer-events-none select-none font-sans"
        aria-live="polite"
      >
        {/* Clear All Floating Capsule */}
        {toasts.length > 1 && (
          <button
            onClick={clearAll}
            className="pointer-events-auto text-[10px] font-bold tracking-wider uppercase bg-black/60 hover:bg-black/80 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-300 dark:text-zinc-200 px-3 py-1 rounded-full backdrop-blur-xl border border-white/15 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            Clear All ({toasts.length})
          </button>
        )}

        {/* Notification Cards Stack with macOS Genie Spring Animation */}
        {toasts.map((toast) => {
          const config = getIconConfig(toast.type);
          const IconComponent = config.icon;

          return (
            <div
              key={toast.id}
              style={{
                boxShadow: `0 20px 45px -10px rgba(0,0,0,0.5), 0 0 25px -5px ${config.glowColor}`,
                animation: "macGenieSpring 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              }}
              className="pointer-events-auto relative w-full bg-white/75 dark:bg-[#121214]/85 backdrop-blur-2xl backdrop-saturate-200 text-zinc-900 dark:text-white p-3.5 rounded-3xl border border-black/10 dark:border-white/15 transition-all duration-300 flex items-start gap-3 overflow-hidden group hover:border-black/20 dark:hover:border-white/25"
            >
              {/* Left: macOS App Squircle Icon Badge */}
              <div className={`w-9 h-9 rounded-2xl ${config.badgeBg} flex items-center justify-center shrink-0 shadow-inner mt-0.5`}>
                <IconComponent className={`w-4 h-4 ${config.iconColor} stroke-[2.5]`} />
              </div>

              {/* Center: Content Area */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold tracking-tight text-zinc-900 dark:text-white leading-tight truncate">
                    {toast.title}
                  </h4>
                  <span className="text-[9px] font-semibold text-zinc-400 dark:text-[#86868b] shrink-0">
                    {toast.timestamp}
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed mt-0.5 break-words">
                  {toast.body}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="w-5 h-5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-white flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer -mr-0.5 mt-0.5"
                title="Dismiss notification"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>

              {/* Subtle ambient bottom light gradient */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70"
                style={{
                  background: `linear-gradient(90deg, transparent, ${config.glowColor}, transparent)`
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Global CSS Animation for macOS Genie Spring */}
      <style jsx global>{`
        @keyframes macGenieSpring {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(30px) rotateX(12deg);
            filter: blur(10px);
          }
          70% {
            opacity: 1;
            transform: scale(1.03) translateY(-4px) rotateX(0deg);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useGlassToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useGlassToast must be used within a ToastProvider");
  }
  return context;
};