"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastFn = {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<{ toast: ToastFn } | null>(null);

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950/80",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-900 dark:text-emerald-100",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/80",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    text: "text-red-900 dark:text-red-100",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/80",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-900 dark:text-amber-100",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/80",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-900 dark:text-blue-100",
  },
};

function ToastCard({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remove = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(item.id), 350);
  }, [item.id, onRemove]);

  useEffect(() => {
    timerRef.current = setTimeout(remove, item.duration ?? 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.duration, remove]);

  const Icon = ICONS[item.type];
  const styles = STYLES[item.type];

  return (
    <div
      className={`
        flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-in-out
        ${styles.bg} ${styles.border}
        ${exiting ? "translate-x-full opacity-0 scale-95" : "translate-x-0 opacity-100 scale-100"}
      `}
      role="alert"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} />
      <p className={`flex-1 text-sm font-medium leading-snug ${styles.text}`}>{item.message}</p>
      <button
        onClick={remove}
        className={`shrink-0 rounded-md p-0.5 transition-opacity hover:opacity-60 ${styles.icon}`}
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Global singleton (for use outside React components) ──────────────────────
let _globalToast: ToastFn | null = null;

function GlobalSync({ t }: { t: ToastFn }) {
  useEffect(() => {
    _globalToast = t;
    return () => { _globalToast = null; };
  }, [t]);
  return null;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const t: ToastFn = {
    success: (msg) => add(msg, "success"),
    error:   (msg) => add(msg, "error"),
    warning: (msg) => add(msg, "warning"),
    info:    (msg) => add(msg, "info"),
  };

  return (
    <ToastContext.Provider value={{ toast: t }}>
      <GlobalSync t={t} />
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-5 left-5 z-[9999] flex flex-col gap-2"
          role="region"
          aria-label="الإشعارات"
        >
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} onRemove={remove} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

// ── Global singleton (same API as sonner) ────────────────────────────────────
export const toast = {
  success: (message: string) => _globalToast?.success(message),
  error:   (message: string) => _globalToast?.error(message),
  warning: (message: string) => _globalToast?.warning(message),
  info:    (message: string) => _globalToast?.info(message),
};
