'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'danger' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (title: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4">
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'text-[#0071e3]';
          let borderAccent = 'border-[#0071e3]/30';
          let bgGlow = 'bg-[#0071e3]/10';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'text-emerald-500';
            borderAccent = 'border-emerald-500/30';
            bgGlow = 'bg-emerald-500/10';
          } else if (toast.type === 'danger') {
            Icon = AlertCircle;
            iconColor = 'text-rose-500';
            borderAccent = 'border-rose-500/30';
            bgGlow = 'bg-rose-500/10';
          } else if (toast.type === 'warning') {
            Icon = AlertCircle;
            iconColor = 'text-amber-500';
            borderAccent = 'border-amber-500/30';
            bgGlow = 'bg-amber-500/10';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border ${borderAccent} shadow-xl shadow-black/10 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in`}
            >
              <div className={`p-2 rounded-xl ${bgGlow} ${iconColor} shrink-0 mt-0.5`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                  {toast.title}
                </h4>
                {toast.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useGlassToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useGlassToast must be used within a ToastProvider');
  }
  return context;
}
