import { useId, type InputHTMLAttributes } from "react";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  helperText?: string;
  error?: string;
  id?: string;
  containerClassName?: string;
};

export function Input({
  label,
  helperText,
  error,
  id,
  className,
  containerClassName,
  required,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={["grid gap-1.5", containerClassName].filter(Boolean).join(" ")}>
      <label
        htmlFor={inputId}
        className="text-sm font-semibold text-[var(--color-text-primary)]"
      >
        {label}
        {required ? <span className="text-[var(--color-danger)]"> *</span> : null}
      </label>
      <input
        {...rest}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
        className={[
          "min-h-11 rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] transition-colors duration-150 ease-out placeholder:text-[var(--color-text-muted)] focus-ring",
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-sm text-[var(--color-danger)]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.515-2.63L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-sm text-[var(--color-text-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
