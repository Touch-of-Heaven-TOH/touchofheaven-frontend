import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-[var(--shadow-subtle)] hover:bg-[var(--color-brand-strong)] active:bg-[var(--color-brand-strong)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] active:bg-[var(--color-brand-soft)]",
  ghost:
    "text-[var(--color-text-muted)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] active:bg-[var(--color-brand-soft)]",
  danger:
    "bg-[var(--color-danger)] text-[var(--color-text-inverse)] hover:brightness-110 active:brightness-95",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-sm font-bold leading-none transition-colors duration-150 ease-out focus-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-[initial] aria-disabled:shadow-none";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

/**
 * Renders aria-disabled + a no-op click guard instead of the native
 * `disabled` attribute: a truly disabled button drops out of the tab order
 * and screen readers skip it entirely, so a user can never learn *why* the
 * primary action is unavailable (e.g. "select a date and time first").
 */
export function Button({
  variant = "primary",
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  onClick,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      type={type}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={[base, variantClassName[variant], className].filter(Boolean).join(" ")}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading ? trailingIcon : null}
    </button>
  );
}
