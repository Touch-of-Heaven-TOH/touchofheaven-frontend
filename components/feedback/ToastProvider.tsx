"use client";

import { CircleAlert, CircleCheck, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * Short confirmations for actions the user just took ("Profile saved"),
 * announced to screen readers and dismissible by hand. A toast is never
 * the only place an outcome appears: a failed save also leaves the form
 * in its error state, so nothing is lost when one disappears.
 */

export type ToastTone = "success" | "error" | "warning";

type Toast = { id: number; tone: ToastTone; message: string };

const DISMISS_AFTER_MS = 4_000;
// Two at once: enough to see a result while another lands, few enough that
// they never cover the thing being edited.
const MAX_VISIBLE = 2;

const ToastContext = createContext<((tone: ToastTone, message: string) => void) | null>(null);

const toneStyles: Record<ToastTone, { className: string; Icon: typeof CircleCheck; label: string }> = {
  success: {
    className: "border-[var(--color-success)] bg-white text-[var(--color-text-primary)]",
    Icon: CircleCheck,
    label: "Success",
  },
  error: {
    className: "border-[var(--color-danger)] bg-white text-[var(--color-text-primary)]",
    Icon: CircleAlert,
    label: "Error",
  },
  warning: {
    className: "border-[var(--color-warning)] bg-white text-[var(--color-text-primary)]",
    Icon: TriangleAlert,
    label: "Warning",
  },
};

const iconColor: Record<ToastTone, string> = {
  success: "text-[var(--color-success)]",
  error: "text-[var(--color-danger)]",
  warning: "text-[var(--color-warning)]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, tone, message }].slice(-MAX_VISIBLE));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { className, Icon, label } = toneStyles[toast.tone];

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, DISMISS_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-control)] border-l-4 px-4 py-3 shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-border)] ${className}`}
    >
      <Icon aria-hidden="true" className={`mt-0.5 shrink-0 ${iconColor[toast.tone]}`} size={20} />
      <p className="min-w-0 flex-1 text-sm font-medium">
        {/* The tone is spoken as well as shown, so colour is never the only signal. */}
        <span className="sr-only">{label}: </span>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-[var(--color-text-muted)] transition hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Returns a function that shows a toast. Safe to call from a component
 * that might render outside the provider (nothing happens then), so a
 * shared form component doesn't have to care where it is mounted.
 */
export function useToast() {
  const show = useContext(ToastContext);
  return useMemo(
    () => ({
      success: (message: string) => show?.("success", message),
      error: (message: string) => show?.("error", message),
      warning: (message: string) => show?.("warning", message),
    }),
    [show],
  );
}
