"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
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
  // Optional: redirect somewhere after a successful submit instead of
  // showing the generic inline success message. Only used for modes other
  // than sign-in/mfa (those already redirect via postLoginRoute above).
  // A plain string template (not a function - this component is rendered
  // from Server Component pages, which can't pass closures across the
  // RSC boundary). {fieldName} tokens are replaced with the matching
  // submitted-payload value, URL-encoded. e.g.
  // "/customer/verify-email?email={email}".
  successRedirectPath?: string;
  // Fixed key/value pairs merged into every submit, alongside whatever the
  // rendered fields collect - e.g. { audience: "client" } for signup.
  extraPayload?: Record<string, string | boolean>;
};

function resolveRedirectPath(
  template: string,
  payload: Record<string, string | boolean>,
) {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) =>
    encodeURIComponent(String(payload[key] ?? "")),
  );
}

type AuthResponse = {
  message?: string;
  mfaRequired?: boolean;
  postLoginRoute?: string;
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
  successRedirectPath,
  extraPayload,
}: AuthActionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const autoSubmitted = useRef(false);

  async function submit(payload: Record<string, string | boolean>) {
    setStatus("submitting");
    setMessage(null);

    try {
      const data = await browserApiFetch<AuthResponse>(endpoint, {
        method: "POST",
        body: payload,
      });

      if (mode === "sign-in" && data.mfaRequired) {
        const callbackUrl = safeReturnUrl(searchParams.get("callbackUrl"));
        router.push(`/mfa?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      if (mode === "sign-in" || mode === "mfa") {
        // An explicit callbackUrl (e.g. "/professional-application" after
        // being redirected to sign in) always wins over the generic
        // role-based default - it's a more specific destination than
        // "wherever this role normally lands."
        router.push(
          safeReturnUrl(searchParams.get("callbackUrl"), data.postLoginRoute),
        );
        router.refresh();
        return;
      }

      if (successRedirectPath) {
        router.push(resolveRedirectPath(successRedirectPath, payload));
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit({ ...payloadFromForm(event.currentTarget), ...extraPayload });
  }

  // Clicking the emailed verification link lands here with ?token=... -
  // making someone copy that token into the field by hand (it's already
  // right there in the URL) is friction with no security purpose, so this
  // submits automatically the moment the token is present. Guarded by a
  // ref, not state, so React's dev-mode double-invoke of effects can't
  // spend the (single-use) token twice.
  useEffect(() => {
    if (mode !== "verify-email" || autoSubmitted.current) return;
    const token = searchParams.get("token");
    if (!token) return;
    autoSubmitted.current = true;
    // The email-link path intentionally starts the request without a second click.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void submit({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searchParams]);

  // Skips the manual "paste your token" form entirely for the common case
  // (clicking the emailed link) - it's already being submitted by the
  // effect above, so showing a form asking for what's already in flight
  // would just be confusing.
  const isAutoVerifying = mode === "verify-email" && Boolean(searchParams.get("token"));

  return (
    <section className="surface-panel w-full max-w-md bg-white/92 p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        {description}
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {isAutoVerifying && status !== "success" && status !== "error" ? (
          <p className="text-sm text-[var(--color-text-muted)]">Verifying your email...</p>
        ) : null}
        {(!isAutoVerifying || status === "error") && fields.map((field) => (
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]"
            key={field.name}
          >
            {field.label}
            <input
              autoComplete={field.autoComplete}
              className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none transition focus:border-[var(--color-brand)]"
              defaultValue={searchParams.get(field.name) ?? undefined}
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

        {(!isAutoVerifying || status === "error") ? (
          <button
            className="btn-primary"
            disabled={status === "submitting"}
            type="submit"
          >
            {status === "submitting" ? "Working..." : submitLabel}
          </button>
        ) : null}

        {mode === "verify-email" && status === "success" ? (
          <Link className="btn-secondary justify-center" href="/customer/sign-in">
            Continue to Sign In
          </Link>
        ) : null}
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
