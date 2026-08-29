"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { AppleSignInButton } from "@/features/auth/components/AppleSignInButton";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { PasswordField } from "@/features/auth/components/business/PasswordField";
import { PasswordStrengthMeter } from "@/features/auth/components/business/PasswordStrengthMeter";

function splitFullName(fullName: string) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const spaceIndex = trimmed.indexOf(" ");

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: trimmed };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1),
  };
}

export function BusinessSignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    const { firstName, lastName } = splitFullName(fullName);

    try {
      await browserApiFetch("/api/v1/auth/signup", {
        method: "POST",
        body: {
          firstName,
          lastName,
          email,
          password,
          confirmPassword: password,
          acceptTerms: true,
          audience: "business",
        },
      });

      const params = new URLSearchParams({ email });
      if (callbackUrl) params.set("callbackUrl", callbackUrl);
      router.push(`/business/verify-email?${params.toString()}`);
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not create your account. Try again.",
      );
    }
  }

  return (
    <section className="surface-panel w-full bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <h1 className="font-serif text-[1.7rem] font-semibold leading-tight text-[var(--color-text-primary)] sm:text-4xl">
        Create your business account
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Manage your services, bookings, and growth in one place.
      </p>

      <div className="mt-6 grid gap-4">
        <GoogleSignInButton />
        <AppleSignInButton />
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
          Full name
          <input
            autoComplete="name"
            className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none transition focus:border-[var(--color-brand)]"
            name="fullName"
            onChange={(event) => setFullName(event.target.value)}
            required
            type="text"
            value={fullName}
          />
        </label>

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

        <div className="grid gap-2">
          <PasswordField
            autoComplete="new-password"
            label="Create password"
            name="password"
            onChange={setPassword}
            value={password}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-muted)]">
          <input
            checked={acceptTerms}
            className="mt-1 size-4 shrink-0"
            name="acceptTerms"
            onChange={(event) => setAcceptTerms(event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            I agree to the{" "}
            <Link className="font-semibold text-[var(--color-brand)]" href="/legal/terms-of-service">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="font-semibold text-[var(--color-brand)]" href="/legal/privacy-policy">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p
            className="rounded-md bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          className="btn-primary"
          disabled={status === "submitting" || !acceptTerms}
          type="submit"
        >
          {status === "submitting" ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-sm text-[var(--color-text-muted)]">
        Already have a business account?{" "}
        <Link className="font-semibold text-[var(--color-brand)]" href="/business/sign-in">
          Sign in
        </Link>
      </p>
    </section>
  );
}
