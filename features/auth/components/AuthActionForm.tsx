"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { safeReturnUrl } from "@/lib/security/safe-return-url";

type AuthField = {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
};

type AuthActionFormProps = {
  title: string;
  description: string;
  endpoint: string;
  submitLabel: string;
  fields: AuthField[];
  mode:
    | "sign-in"
    | "sign-up"
    | "forgot-password"
    | "reset-password"
    | "verify-email"
    | "mfa";
  terms?: boolean;
  footer?: React.ReactNode;
};

type AuthResponse = {
  message?: string;
  mfaRequired?: boolean;
};

function payloadFromForm(form: HTMLFormElement): Record<string, string | boolean> {
  const formData = new FormData(form);
  const payload: Record<string, string | boolean> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
    }
  }

  if (formData.has("acceptTerms")) {
    payload.acceptTerms = true;
  }

  return payload;
}

export function AuthActionForm({
  title,
  description,
  endpoint,
  submitLabel,
  fields,
  mode,
  terms,
  footer,
}: AuthActionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage(null);

    try {
      const data = await browserApiFetch<AuthResponse>(endpoint, {
        method: "POST",
        body: payloadFromForm(event.currentTarget),
      });

      if (mode === "sign-in" && data.mfaRequired) {
        const callbackUrl = safeReturnUrl(searchParams.get("callbackUrl"));
        router.push(`/mfa?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      if (mode === "sign-in" || mode === "mfa") {
        router.push(safeReturnUrl(searchParams.get("callbackUrl")));
        router.refresh();
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Request completed.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof ApiClientError
          ? error.message
          : "We could not complete that request. Try again.",
      );
    }
  }

  return (
    <section className="surface-panel w-full max-w-md bg-white/92 p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]"
            key={field.name}
          >
            {field.label}
            <input
              autoComplete={field.autoComplete}
              className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none transition focus:border-[var(--color-brand)]"
              name={field.name}
              placeholder={field.placeholder}
              required={field.required ?? true}
              type={field.type}
            />
          </label>
        ))}

        {terms ? (
          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-muted)]">
            <input
              className="mt-1 size-4"
              name="acceptTerms"
              required
              type="checkbox"
              value="true"
            />
            I accept the current Touch of Heaven terms and privacy policy.
          </label>
        ) : null}

        {message ? (
          <p
            className={`rounded-md p-3 text-sm ${
              status === "error"
                ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                : "bg-[var(--color-success-soft)] text-[var(--color-success)]"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}

        <button
          className="btn-primary"
          disabled={status === "submitting"}
          type="submit"
        >
          {status === "submitting" ? "Working..." : submitLabel}
        </button>
      </form>

      {footer ? (
        <div className="mt-5 border-t border-[var(--color-border)] pt-5 text-sm text-[var(--color-text-muted)]">
          {footer}
        </div>
      ) : (
        <Link className="btn-ghost mt-5" href="/">
          Return home
        </Link>
      )}
    </section>
  );
}
