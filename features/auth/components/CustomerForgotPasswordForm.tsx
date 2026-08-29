"use client";

import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";

export function CustomerForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      await browserApiFetch("/api/v1/auth/forgot-password", {
        method: "POST",
        body: { email, audience: "client" },
      });
      setStatus("sent");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : "We could not process that request. Try again.",
      );
    }
  }

  return (
    <section className="surface-panel w-full max-w-md bg-white/92 p-6 text-center shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <span className="mx-auto grid size-16 place-items-center rounded-full text-[var(--color-copper)]">
        <KeyRound aria-hidden="true" size={32} strokeWidth={1.5} />
      </span>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
        Forgot your password?
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Enter your email and we&apos;ll send you a secure reset link.
      </p>

      <form className="mt-6 grid gap-4 text-left" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Email
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

        {error ? (
          <p
            className="rounded-md bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button className="btn-primary" disabled={status === "submitting"} type="submit">
          {status === "submitting" ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <Link className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand)]" href="/customer/sign-in">
        Back to sign in
      </Link>

      <p className="mt-5 flex items-start gap-2 border-t border-[var(--color-border)] pt-5 text-left text-xs text-[var(--color-text-muted)]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
        For privacy, we show the same confirmation whether or not an account exists.
      </p>

      {status === "sent" ? (
        <div className="mt-4 flex items-start gap-3 rounded-md bg-[var(--color-success-soft)] p-4 text-left text-sm text-[var(--color-success)]">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          <span>
            <span className="block font-bold">Check your inbox</span>
            If an account matches that email, reset instructions are on the way.
          </span>
        </div>
      ) : null}
    </section>
  );
}
