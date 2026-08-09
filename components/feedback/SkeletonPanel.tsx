export type SkeletonPanelProps = {
  label: string;
};

export function SkeletonPanel({ label }: SkeletonPanelProps) {
  return (
    <div
      aria-label={label}
      role="status"
      className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col gap-4 px-6 py-16"
    >
      <div className="h-4 w-44 rounded-full bg-[var(--color-skeleton)]" />
      <div className="h-10 w-full max-w-2xl rounded-md bg-[var(--color-skeleton)]" />
      <div className="h-4 w-full max-w-3xl rounded-full bg-[var(--color-skeleton)]" />
      <div className="grid gap-4 pt-6 md:grid-cols-3">
        <div className="h-36 rounded-md bg-[var(--color-skeleton)]" />
        <div className="h-36 rounded-md bg-[var(--color-skeleton)]" />
        <div className="h-36 rounded-md bg-[var(--color-skeleton)]" />
      </div>
    </div>
  );
}
