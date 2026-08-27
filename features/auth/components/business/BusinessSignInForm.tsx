"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { safeReturnUrl } from "@/lib/security/safe-return-url";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { PasswordField } from "@/features/auth/components/business/PasswordField";

const REMEMBERED_EMAIL_KEY = "toh_business_remembered_email";

function readRememberedEmail() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

type LoginResponse = {
  message?: string;
  mfaRequired?: boolean;
  postLoginRoute?: string;
};

export function BusinessSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registerHref = `/business/sign-up?callbackUrl=${encodeURIComponent(
    callbackUrl ?? "/professional-application",
  )}`;

  const [email, setEmail] = useState(readRememberedEmail);
  const [password, setPassword] = useState("");
  // A real, working feature (unlike a raw "remember me" flag, which the
  // login endpoint has no field for): just prefills the email next time,
  // stored client-side only.
  const [rememberEmail, setRememberEmail] = useState(true);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      if (rememberEmail) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Remembering the email is a convenience only.
    }

    try {
      const data = await browserApiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      });

      if (data.mfaRequired) {
        const target = safeReturnUrl(callbackUrl);
        router.push(`/mfa?callbackUrl=${encodeURIComponent(target)}`);
        return;
      }

      router.push(safeReturnUrl(callbackUrl, data.postLoginRoute ?? "/studio/today"));
      router.refresh();
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not sign you in. Try again.",
      );
    }
  }

  return (
    <section className="surface-panel w-full bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h1 className="font-serif text-3xl font-semibold leading-tight text-[var(--color-text-primary)] sm:text-4xl">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Sign in to manage your Touch of Heaven business.
      </p>

      <div className="mt-6 grid gap-4">
        <GoogleSignInButton />
        <div
          aria-hidden="true"
          className="flex items-center gap-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]"
        >
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          or continue with email
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Business email
          <input
            autoComplete="email"
            className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none transition focus:border-[var(--color-brand)]"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <PasswordField
          autoComplete="current-password"
          label="Password"
          name="password"
          onChange={setPassword}
          value={password}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            <input
              checked={rememberEmail}
              className="size-4"
              name="rememberEmail"
              onChange={(event) => setRememberEmail(event.target.checked)}
              type="checkbox"
            />
            Remember me
          </label>
          <Link className="text-sm font-semibold text-[var(--color-brand)]" href="/business/forgot-password">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <p
            className="rounded-md bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button className="btn-primary" disabled={status === "submitting"} type="submit">
          {status === "submitting" ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-sm text-[var(--color-text-muted)]">
        New to Touch of Heaven?{" "}
        <Link className="font-semibold text-[var(--color-brand)]" href={registerHref}>
          Create your business account
        </Link>
      </p>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        Looking to book a hairstyle?{" "}
        <Link className="font-semibold text-[var(--color-brand)]" href="/customer/sign-in">
          Sign in as a client →
        </Link>
      </p>
    </section>
  );
}
