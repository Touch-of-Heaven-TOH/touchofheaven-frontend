import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { ClientShellFrame } from "@/features/client-home/ClientShellFrame";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

/**
 * There is no notification inbox yet.
 *
 * NotificationEvent records the mail and texts we sent - it has no read
 * state and nothing a client ever opens - so rather than a page listing
 * an invented feed, this says plainly what exists today and points at the
 * two places that really do carry news for a client.
 */
export default function NotificationsPage() {
  return (
    <ClientShellFrame>
      <div className="mx-auto w-full max-w-[720px] px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Notifications</h1>
        <div className="mt-6 grid justify-items-start gap-3 rounded-[var(--radius-panel,16px)] border border-dashed border-[var(--color-border)] p-6">
          <BellOff aria-hidden="true" className="size-7 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-muted)]">
            There is no notification centre yet. We email and text you about
            appointments, and those settings are yours to control.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Link className="btn-primary min-h-11" href="/account/settings/notifications">
              Notification settings
            </Link>
            <Link className="btn-secondary min-h-11" href="/messages">
              Your messages
            </Link>
          </div>
        </div>
      </div>
    </ClientShellFrame>
  );
}
