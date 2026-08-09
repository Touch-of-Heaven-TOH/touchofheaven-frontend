import type { Metadata } from "next";
import { adminContent } from "@/config/page-content";

const content = adminContent.audit;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

/**
 * Deliberately not the shared RouteStatusPage pattern: every other admin
 * placeholder has a primaryAction button, and this page must not - the
 * audit log is append-only, and even a disabled-looking action button
 * invites someone to eventually wire up an edit/delete handler behind it.
 * There is no button here at all, only a link back.
 */
export default function AdminAuditPage() {
  return (
    <section className="grid gap-6">
      <div className="surface-panel p-6">
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">
          {content.eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[var(--color-text-primary)]">
          {content.title}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          {content.description}
        </p>
        <p className="mt-4 inline-block rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          Append-only audit log — no modifications permitted.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {content.statusItems.map((item) => (
          <div className="surface-panel p-4" key={item}>
            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              {item}
            </p>
          </div>
        ))}
      </div>

      {content.endpoint ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          Backend contract: <code>{content.endpoint}</code>
        </p>
      ) : null}
    </section>
  );
}
