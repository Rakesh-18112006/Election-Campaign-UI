import { useState, useCallback } from 'react';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'destructive';
}

let toastListeners: Array<(toast: ToastItem) => void> = [];

export function toast(item: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach((fn) => fn({ ...item, id }));
}

export function useToastState() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: ToastItem) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  useState(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast);
    };
  });

  return toasts;
}
