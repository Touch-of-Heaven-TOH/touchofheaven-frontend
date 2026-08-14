"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { MagicCodeSignIn } from "@/features/auth/components/MagicCodeSignIn";

export function SignInMethods() {
  const [usePassword, setUsePassword] = useState(false);

  if (usePassword) {
    return (
      <AuthActionForm
        title="Sign In"
        description="Enter your email and password. If MFA is enabled, we will ask for your code next."
        endpoint="/api/v1/auth/login"
        submitLabel="Sign In"
        mode="sign-in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        footer={
          <div className="grid gap-3">
            <button
              type="button"
              className="btn-ghost justify-start !px-0"
              onClick={() => setUsePassword(false)}
            >
              ← Use email code or Google instead
            </button>
            <div className="flex flex-wrap gap-3">
              <Link className="font-semibold text-[var(--color-brand)]" href="/sign-up">
                Create Account
              </Link>
              <Link
                className="font-semibold text-[var(--color-brand)]"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <section className="surface-panel w-full max-w-md bg-white/92 p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)]">
        Sign In
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Continue with Google, use an email code, or sign in with your password.
      </p>

      <div className="mt-6 grid gap-4">
        <GoogleSignInButton />
        <div
          aria-hidden="true"
          className="flex items-center gap-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]"
        >
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          or
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
        <MagicCodeSignIn />
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <button
          type="button"
          className="btn-secondary justify-center"
          onClick={() => setUsePassword(true)}
        >
          Sign In With Password
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className="font-semibold text-[var(--color-brand)]" href="/sign-up">
            Create Account
          </Link>
          <Link
            className="font-semibold text-[var(--color-brand)]"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </section>
  );
}
