import Link from "next/link";
import { ArrowRight, DatabaseZap } from "lucide-react";

type DynamicStatusPanelProps = {
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
};

export function DynamicStatusPanel({
  title,
  message,
  actionLabel,
  actionHref,
}: DynamicStatusPanelProps) {
  return (
    <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-sage-soft)] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white text-[var(--color-sage)]">
          <DatabaseZap aria-hidden="true" size={21} />
        </span>
        <div>
          <h3 className="text-base font-bold text-[var(--color-brand-strong)]">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
            {message}
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]"
            href={actionHref}
          >
            {actionLabel}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
