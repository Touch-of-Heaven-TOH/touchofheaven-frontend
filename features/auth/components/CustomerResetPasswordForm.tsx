"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { PasswordField } from "@/features/auth/components/business/PasswordField";
import { PasswordStrengthMeter } from "@/features/auth/components/business/PasswordStrengthMeter";

export function CustomerResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setStatus("error");
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      await browserApiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        body: { token, password, confirmPassword },
      });
      router.push("/customer/sign-in");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "That reset link is invalid or has expired.",
      );
    }
  }

  if (!token) {
    return (
      <section className="surface-panel w-full max-w-md bg-white/92 p-6 text-center shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
          Reset link required
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Open the password reset link from your email to continue.
        </p>
        <Link className="btn-primary mt-6 w-full" href="/customer/forgot-password">
          Request a new link
        </Link>
      </section>
    );
  }

  return (
    <section className="surface-panel w-full max-w-md bg-white/92 p-6 text-center shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <span className="mx-auto grid size-16 place-items-center rounded-full text-[var(--color-copper)]">
        <ShieldCheck aria-hidden="true" size={32} strokeWidth={1.5} />
      </span>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
        Create a new password
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Choose a strong password you haven&apos;t used before.
      </p>

      <form className="mt-6 grid gap-4 text-left" onSubmit={handleSubmit}>
        <PasswordField
          autoComplete="new-password"
          label="New password"
          name="password"
          onChange={setPassword}
          value={password}
        />
        <PasswordField
          autoComplete="new-password"
          label="Confirm new password"
          name="confirmPassword"
          onChange={setConfirmPassword}
          value={confirmPassword}
        />
        <PasswordStrengthMeter password={password} />

        {error ? (
          <p
            className="rounded-md bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button className="btn-primary" disabled={status === "submitting"} type="submit">
          {status === "submitting" ? "Updating..." : "Update password"}
        </button>
      </form>

      <Link className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand)]" href="/customer/sign-in">
        ← Back to sign in
      </Link>

      <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
        Updating your password will sign out your other active sessions.
      </p>
    </section>
  );
}
