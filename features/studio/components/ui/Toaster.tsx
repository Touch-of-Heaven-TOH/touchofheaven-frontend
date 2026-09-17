"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { STUDIO_DIALOG_OPEN_EVENT } from "@/features/studio/components/ui/StudioDialog";

type Toast = { id: number; tone: "success" | "error"; title: string; description?: string };

type ToastInput = Omit<Toast, "id">;

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/**
 * Confirmation that an action actually went through. Pinned to the top on
 * phones - the bottom of the screen belongs to the Studio navigation - and
 * to the bottom-right corner on desktop.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.tone === "error" ? 7000 : 4500);
    },
    [dismiss],
  );

  useEffect(() => {
    const clear = () => setToasts([]);
    window.addEventListener(STUDIO_DIALOG_OPEN_EVENT, clear);
    return () => window.removeEventListener(STUDIO_DIALOG_OPEN_EVENT, clear);
  }, []);

  const value = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(4.25rem+env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:top-auto lg:right-6 lg:bottom-6 lg:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-soft)]"
          >
            {toast.tone === "success" ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--color-success)]" />
            ) : (
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--color-danger)]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)]"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error("useToast must be used inside ToastProvider.");
  return notify;
}
