'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id?: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed top-20 sm:top-24 right-3 sm:right-6 left-3 sm:left-auto z-[99999] max-w-sm w-auto animate-slideIn">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all ${
        isSuccess 
          ? 'bg-white/95 border-emerald-300 text-slate-900 shadow-emerald-500/10' 
          : isError 
            ? 'bg-white/95 border-red-300 text-slate-900 shadow-red-500/10' 
            : 'bg-white/95 border-blue-300 text-slate-900 shadow-blue-500/10'
      }`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isSuccess 
            ? 'bg-emerald-100 text-emerald-600' 
            : isError 
              ? 'bg-red-100 text-red-600' 
              : 'bg-blue-100 text-blue-600'
        }`}>
          {isSuccess && <CheckCircle2 className="w-5 h-5" />}
          {isError && <AlertTriangle className="w-5 h-5" />}
          {!isSuccess && !isError && <Info className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && (
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-0.5">
              {toast.title}
            </h5>
          )}
          <p className="text-xs font-semibold text-slate-700 leading-snug">
            {toast.message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
