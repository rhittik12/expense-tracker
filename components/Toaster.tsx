"use client";
import React, { createContext, useCallback, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Toast = { id: string; title: string; description?: string; variant?: 'default'|'success'|'error' };
interface ToastCtx { push: (t: Omit<Toast,'id'>) => void; }
const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast,'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, ...t }]);
    setTimeout(()=> setToasts(ts => ts.filter(x=>x.id!==id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed z-50 top-4 right-4 w-72 space-y-3">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{opacity:0, y:-8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} className={`glass rounded-lg p-3 border-l-4 text-sm ${t.variant==='success'?'border-primary':t.variant==='error'?'border-destructive':'border-accent'}`}>
              <div className="font-semibold mb-0.5">{t.title}</div>
              {t.description && <p className="text-xs opacity-80 leading-snug">{t.description}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}
