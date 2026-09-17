"use client";

import { EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar, StatusPill } from "@/features/studio/components/ui/primitives";
import { useStudio } from "@/features/studio/lib/context";
import { formatDuration, formatMoney, formatTime } from "@/features/studio/lib/format";
import type { AppointmentSummary } from "@/features/studio/lib/types";

/** "$64 paid · $191 due", straight from the server's balance fields. */
export function PaymentInline({ appointment }: { appointment: AppointmentSummary }) {
  if (appointment.paymentState === "PAID") {
    return (
      <span className="inline-flex rounded-md bg-[var(--color-success-soft)] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[var(--color-success)]">
        {formatMoney(appointment.priceCents + appointment.tipCents)} paid
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {appointment.depositPaidCents > 0 ? (
        <span className="inline-flex rounded-md bg-[var(--color-info-soft,#e6eff9)] px-2 py-0.5 text-xs font-medium whitespace-nowrap text-[var(--color-info,#2f5e9a)]">
          {formatMoney(appointment.depositPaidCents)} paid
        </span>
      ) : null}
      <span className="text-xs font-medium whitespace-nowrap text-[var(--color-danger)]">
        {formatMoney(appointment.balanceDueCents)} due
      </span>
    </span>
  );
}

/** What can be done next with a booking, by its status. Every link lands on
 * a page that re-checks the action server-side, so a stale list row can
 * never do something the booking no longer allows. */
export function bookingMenuItems(appointment: AppointmentSummary, now = Date.now()) {
  const base = `/studio/appointments/${appointment.id}`;
  const items: Array<{ label: string; href: string; danger?: boolean }> = [{ label: "View booking", href: base }];
  const request = appointment.pendingChangeRequest;
  if (request) {
    items.push({
      label: request.type === "RESCHEDULE" ? "Review reschedule request" : "Review cancellation request",
      href: request.type === "RESCHEDULE" ? `${base}/reschedule` : `${base}/cancel`,
    });
  }
  switch (appointment.status) {
    case "CONFIRMED":
      items.push({ label: "Check in client", href: `${base}/check-in` });
      if (!request) items.push({ label: "Reschedule", href: `${base}/reschedule` });
      if (new Date(appointment.startAt).getTime() < now) items.push({ label: "Mark as no-show", href: `${base}/no-show` });
      if (!request) items.push({ label: "Cancel booking", href: `${base}/cancel`, danger: true });
      break;
    case "PENDING_PAYMENT":
      if (!request) items.push({ label: "Reschedule", href: `${base}/reschedule` });
      items.push({ label: "Cancel booking", href: `${base}/cancel`, danger: true });
      break;
    case "ARRIVED":
      items.push({ label: "Start service", href: `${base}/check-in` });
      items.push({ label: "Cancel booking", href: `${base}/cancel`, danger: true });
      break;
    case "IN_PROGRESS":
      items.push({ label: "Complete appointment", href: `${base}/complete` });
      break;
    case "COMPLETED":
      items.push({ label: "View receipt", href: `${base}/complete` });
      if (appointment.refundedCents > 0) items.push({ label: "View refund", href: `${base}/refund` });
      break;
    default:
      if (appointment.refundedCents > 0 || appointment.depositPaidCents > 0) {
        items.push({ label: appointment.refundedCents > 0 ? "View refund" : "Refunds", href: `${base}/refund` });
      }
  }
  return items;
}

export function BookingActionsMenu({
  appointment,
  label,
}: {
  appointment: AppointmentSummary;
  label?: string;
}) {
  const [position, setPosition] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = position !== null;
  const items = open ? bookingMenuItems(appointment) : [];

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setPosition(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPosition(null);
        buttonRef.current?.focus();
      }
    };
    const dismiss = () => setPosition(null);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 224;
    const estimatedHeight = bookingMenuItems(appointment).length * 44 + 12;
    const up = rect.bottom + estimatedHeight + 8 > window.innerHeight && rect.top > estimatedHeight + 8;
    setPosition({
      top: up ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      up,
    });
  };

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const links = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const index = links.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (index + 1) % links.length : (index - 1 + links.length) % links.length;
    links[next]?.focus();
  };

  return (
    <div className="relative z-10 shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label ?? `Actions for ${appointment.customer.name}'s booking`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={toggle}
        className="grid size-10 place-items-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)]"
      >
        <EllipsisVertical aria-hidden="true" className="size-5" />
      </button>
      {position
        ? createPortal(
            <div className="studio-theme contents">
              <div
                ref={menuRef}
                role="menu"
                onKeyDown={onMenuKeyDown}
                style={{ top: position.top, left: position.left }}
                className="fixed z-[55] w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-soft)]"
              >
                {items.map((item) => (
                  <Link
                    key={item.label}
                    role="menuitem"
                    href={item.href}
                    onClick={() => setPosition(null)}
                    className={`flex min-h-11 items-center rounded-lg px-3 text-sm outline-none hover:bg-[var(--color-brand-soft)] focus-visible:bg-[var(--color-brand-soft)] ${
                      item.danger ? "text-[var(--color-danger)]" : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** The phone layout of a booking: time on the left, client and service in
 * the middle, status and actions on the right. */
export function BookingCard({
  appointment,
  highlighted = false,
}: {
  appointment: AppointmentSummary;
  highlighted?: boolean;
}) {
  const { timezone } = useStudio();
  return (
    <article
      className={`relative flex gap-3 rounded-[var(--radius-panel)] border bg-[var(--color-surface)] p-3 shadow-[var(--shadow-subtle)] sm:p-4 ${
        highlighted ? "border-[var(--color-brand)]" : "border-[var(--color-border)]"
      }`}
    >
      <div className="w-[4.25rem] shrink-0">
        <p className="text-sm font-medium whitespace-nowrap text-[var(--color-brand)]">
          {formatTime(appointment.startAt, timezone)}
        </p>
        <p className="text-xs whitespace-nowrap text-[var(--color-text-muted)]">
          {formatDuration(appointment.durationMins)}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/studio/appointments/${appointment.id}`}
          className="flex min-w-0 items-center gap-2.5 after:absolute after:inset-0 after:content-['']"
        >
          <Avatar name={appointment.customer.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-display text-base text-[var(--color-text-primary)]">
              {appointment.customer.name}
            </span>
            <span className="block truncate text-sm text-[var(--color-text-muted)]">{appointment.serviceName}</span>
          </span>
        </Link>
        <div className="relative z-10 mt-2 flex flex-wrap items-center gap-2 pl-[2.875rem]">
          <PaymentInline appointment={appointment} />
        </div>
      </div>
      <div className="relative z-10 flex shrink-0 flex-col items-end gap-1">
        <StatusPill status={appointment.status} />
        <BookingActionsMenu appointment={appointment} />
      </div>
    </article>
  );
}
