"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "danger" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, body: string, type: ToastType) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, body: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, body, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 6000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearAll = () => setToasts([]);

  // ⚡ ഇവിടെയാണ് കളർ മാറ്റി ബാക്ക്ഗ്രൗണ്ട് ഫുൾ തീം കളർ ആക്കുന്നത് (ഗ്ലാസ്സ് മോർഫിസം ഒപ്പാസിറ്റിയോടെ)
  const getTypeStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-emerald-950/40 border-emerald-500/40 shadow-emerald-950/50 text-emerald-50";
      case "danger":
        return "bg-rose-950/40 border-rose-500/40 shadow-rose-950/50 text-rose-50";
      case "info":
      default:
        return "bg-indigo-950/40 border-indigo-500/40 shadow-indigo-950/50 text-indigo-50";
    }
  };

  const getDotColor = (type: ToastType) => {
    switch (type) {
      case "success": return "bg-emerald-400 shadow-emerald-400/80";
      case "danger": return "bg-rose-400 shadow-rose-400/80";
      case "info": return "bg-indigo-400 shadow-indigo-400/80";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, clearAll }}>
      {children}

      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        
        {toasts.length > 1 && (
          <button
            onClick={clearAll}
            className="self-end pointer-events-auto text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md transition-all duration-200 shadow-lg"
          >
            Clear All ({toasts.length})
          </button>
        )}

        {/* TOAST CARDS */}
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full border backdrop-blur-xl rounded-xl p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-right-5 ${getTypeStyles(
              toast.type
            )}`}
          >
            {/* Status Indicator Dot */}
            <div className="flex-shrink-0 pt-1">
              <span className={`flex h-2 w-2 rounded-full shadow-[0_0_12px_3px] ${getDotColor(toast.type)}`} />
            </div>

            {/* Content Area */}
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-white tracking-wide">{toast.title}</p>
              <p className="mt-1 text-xs text-zinc-200/90 leading-relaxed font-medium">{toast.body}</p>
            </div>

            {/* Individual Close Button */}
            <div className="ml-4 flex flex-shrink-0">
              <button
                onClick={() => removeToast(toast.id)}
                className="inline-flex rounded-md text-zinc-400 hover:text-white transition-colors focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
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