'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; duration?: number; }
interface ToastContextValue { showToast: (message: string, type?: Toast['type'], duration?: number) => void; }

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });
export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);
  const removeToast = useCallback((id: string) => { setToasts((prev) => prev.filter((t) => t.id !== id)); }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => { const timer = setTimeout(onDismiss, toast.duration || 3000); return () => clearTimeout(timer); }, [toast.duration, onDismiss]);

  const styles: Record<string, string> = {
    success: 'border-success/20 shadow-[0_0_15px_rgba(34,197,94,0.08)]',
    error: 'border-error/20 shadow-[0_0_15px_rgba(239,68,68,0.08)]',
    info: 'border-accent-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.08)]',
  };
  const iconColors: Record<string, string> = { success: 'text-success', error: 'text-error', info: 'text-accent-blue' };
  const icons: Record<string, string> = { success: '✓', error: '✗', info: 'ℹ' };

  return (
    <div className={cn(
      'pointer-events-auto glass-strong rounded-xl px-4 py-3 min-w-[260px] max-w-sm animate-slide-in-up flex items-center gap-2.5',
      styles[toast.type]
    )}>
      <span className={cn('text-sm', iconColors[toast.type])}>{icons[toast.type]}</span>
      <span className="text-xs text-text-primary flex-1 font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="text-text-tertiary hover:text-text-secondary text-xs ml-1 shrink-0 transition-colors" aria-label="Dismiss">✕</button>
    </div>
  );
}
