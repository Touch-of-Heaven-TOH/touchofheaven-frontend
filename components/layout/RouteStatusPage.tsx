import Link from "next/link";
import type { RouteContent } from "@/types/content";

export type RouteStatusPageProps = {
  content: RouteContent;
  href?: string;
};

export function RouteStatusPage({ content, href }: RouteStatusPageProps) {
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
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-primary" href={href ?? "/"}>
            {content.primaryAction}
          </Link>
          {content.secondaryAction ? (
            <Link className="btn-secondary" href="/contact">
              {content.secondaryAction}
            </Link>
          ) : null}
        </div>
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
