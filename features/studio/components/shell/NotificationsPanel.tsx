"use client";

import { BellRing, CheckCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStudio } from "@/features/studio/lib/context";
import { formatDateTime } from "@/features/studio/lib/format";
import type { NotificationsResponse } from "@/features/studio/lib/types";

/**
 * The bell's panel. Items are derived on the server from records that need
 * attention (see business-inbox.service.ts), so there is nothing to "mark as
 * read": an item disappears once the underlying request, check-in or refund
 * has been dealt with.
 */
export function NotificationsPanel({
  inbox,
  children,
}: {
  inbox: NotificationsResponse | null;
  children: (open: boolean, toggle: () => void) => ReactNode;
}) {
  const { timezone } = useStudio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items = inbox?.notifications ?? [];

  return (
    <div ref={ref} className="sm:relative">
      {children(open, () => setOpen((value) => !value))}
      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-[calc(4.25rem+env(safe-area-inset-top))] z-50 max-h-[70dvh] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] sm:absolute sm:inset-x-auto sm:top-14 sm:right-0 sm:w-[380px]"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="font-display text-lg">Notifications</h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              {items.length} need{items.length === 1 ? "s" : ""} attention
            </span>
          </div>
          {items.length === 0 ? (
            <div className="grid justify-items-center gap-2 px-6 py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)]">
                <CheckCheck aria-hidden="true" className="size-5" />
              </span>
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Client requests, late arrivals and payment issues will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[calc(70dvh-3.5rem)] overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 hover:bg-[var(--color-brand-soft)]"
                  >
                    <span
                      className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${
                        item.urgent
                          ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                          : "bg-[var(--color-gold-light)] text-[var(--color-gold)]"
                      }`}
                    >
                      <BellRing aria-hidden="true" strokeWidth={1.6} className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[var(--color-text-primary)]">{item.title}</span>
                      <span className="line-clamp-2 block text-xs text-[var(--color-text-muted)]">{item.body}</span>
                      <span className="mt-1 block text-[11px] text-[var(--color-text-muted)]">
                        {formatDateTime(item.at, timezone)}
                      </span>
                    </span>
                    <ChevronRight aria-hidden="true" className="mt-2 size-4 shrink-0 text-[var(--color-text-muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
