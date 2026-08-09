import type { ReactNode } from "react";

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
