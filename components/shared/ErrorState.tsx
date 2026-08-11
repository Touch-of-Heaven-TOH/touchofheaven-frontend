import { Button } from "@/components/shared/Button";

export type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="surface-panel grid gap-3 p-6 text-center"
    >
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>
      {onRetry ? (
        <div className="mt-2 flex justify-center">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
