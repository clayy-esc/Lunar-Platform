// A simple toast manager since we don't have external libs.
import React, { useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { ToastAction, ToastContext, ToastData, ToastType } from './ToastContext';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', action?: ToastAction) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, action }]);
    setTimeout(() => removeToast(id), action ? 8000 : 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-2xl shadow-xl border min-w-75 backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${
              toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-emerald-500/10' :
              toast.type === 'error' ? 'bg-rose-50/95 border-rose-200 text-rose-900 shadow-rose-500/10' :
              'bg-indigo-50/95 border-indigo-200 text-indigo-900 shadow-indigo-500/10'
            }`}
          >
            <div className="mr-3 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-sm font-medium pr-3">{toast.message}</div>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }}
                className="mr-2 inline-flex items-center rounded-lg bg-white/80 px-2.5 py-1 text-xs font-bold shadow-xs hover:bg-white text-slate-900 border border-slate-300"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md opacity-70 hover:bg-black/5 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
