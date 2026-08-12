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
        title="Sign in"
        description="Use your verified email and password. MFA-enabled accounts continue to the challenge screen."
        endpoint="/api/v1/auth/login"
        submitLabel="Sign in"
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
                Create account
              </Link>
              <Link
                className="font-semibold text-[var(--color-brand)]"
                href="/forgot-password"
              >
                Forgot password
              </Link>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <section className="surface-panel w-full max-w-md p-6">
      <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
        Account security
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text-primary)]">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Continue with Google for one-click access, or we&apos;ll email you a one-time
        code - no password needed.
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
          className="btn-ghost justify-start !px-0 text-[var(--color-text-muted)]"
          onClick={() => setUsePassword(true)}
        >
          Use password instead
        </button>
        <Link className="font-semibold text-[var(--color-brand)]" href="/sign-up">
          Create account
        </Link>
      </div>
    </section>
  );
}
