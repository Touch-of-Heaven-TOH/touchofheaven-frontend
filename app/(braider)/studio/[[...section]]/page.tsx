import type { Metadata } from "next";
import Link from "next/link";
import { studioContent } from "@/config/page-content";

// Every segment this catch-all used to branch on now has its own
// page.tsx (see app/(braider)/studio/*/page.tsx), which Next.js always
// resolves ahead of a catch-all match for the same path - except the
// exact root "/studio" itself: Next.js rejects a literal sibling
// page.tsx at the same specificity as an optional catch-all's own
// zero-segment match ("You cannot define a route with the same
// specificity as an optional catch-all route"), so the Today view has
// to live here, in the catch-all, rather than in its own file. This
// still renders for a genuinely unrecognized path under /studio too,
// falling back to Today rather than a hard 404.
const content = studioContent.today;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

/**
 * The most operationally important screen in the Studio - a braider
 * checks this between clients, often one-handed on a phone. Even as a
 * placeholder it keeps the real structure: current client at the top,
 * upcoming clients below it. The earnings summary lives in
 * DashboardShell's own sidebar card (tone="studio"), not duplicated here.
 */
export default function StudioTodayPage() {
  return (
    <section className="grid gap-6">
      <div className="surface-panel p-6">
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
          Current client
        </p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              No client checked in
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              When an appointment is in progress, the client&apos;s name,
              service, and consultation notes will show here.
            </p>
          </div>
          <Link
            className="btn-primary whitespace-nowrap"
            href="/studio/appointments"
          >
            View appointments
          </Link>
        </div>
      </div>

      <div className="surface-panel p-6">
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
          Upcoming today
        </p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {content.description}
        </p>
        <div className="mt-4 grid gap-3">
          {["9:00 AM", "11:30 AM", "2:00 PM"].map((time) => (
            <div
              className="flex items-center justify-between rounded-md border border-[var(--color-border)] px-4 py-3"
              key={time}
            >
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {time}
              </span>
              <span className="text-sm text-[var(--color-text-muted)]">
                Real appointment data connects here
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        Backend contract: <code>{content.endpoint}</code>
      </p>
    </section>
  );
}
