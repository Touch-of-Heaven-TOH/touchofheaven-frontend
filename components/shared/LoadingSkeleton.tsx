export type LoadingSkeletonProps = {
  label: string;
  lines?: number;
  className?: string;
};

/**
 * A generic inline skeleton for a single async region (a card, a list row,
 * a panel). For a full-page loading state use
 * components/feedback/SkeletonPanel.tsx instead.
 */
export function LoadingSkeleton({ label, lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={["grid gap-2", className].filter(Boolean).join(" ")}
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-4 animate-pulse rounded-full bg-[var(--color-skeleton)]"
          style={{ width: index === lines - 1 ? "60%" : "100%" }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
