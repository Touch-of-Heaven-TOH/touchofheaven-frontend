"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useId, useState } from "react";

type PasswordFieldProps = {
  label: string;
  name: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function PasswordField({
  label,
  name,
  autoComplete,
  value,
  onChange,
  required = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]" htmlFor={inputId}>
      {label}
      <span className="relative flex items-center">
        <Lock
          aria-hidden="true"
          className="pointer-events-none absolute left-3 text-[var(--color-text-muted)]"
          size={17}
        />
        <input
          autoComplete={autoComplete}
          className="min-h-12 w-full rounded-md border border-[var(--color-border)] bg-white pl-10 pr-11 text-base outline-none transition focus:border-[var(--color-brand)]"
          id={inputId}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          type={visible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-3 grid size-6 place-items-center text-[var(--color-text-muted)] transition hover:text-[var(--color-brand)]"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </span>
    </label>
  );
}
