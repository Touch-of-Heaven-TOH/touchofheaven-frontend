"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";

// Professionals always sign in with email + password - no magic-code
// option here, unlike SignInMethods (the client flow). Same
// POST /api/v1/auth/login endpoint as the client form; postLoginRoute in
// the response (see AuthActionForm) is what actually sends an approved
// braider to /studio/today rather than /account.
export function BraiderSignInMethods() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const registerHref = callbackUrl
    ? `/braider/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/braider/register";

  return (
    <AuthActionForm
      title="Welcome Back, Professional"
      description="Sign in to manage your studio and clients."
      endpoint="/api/v1/auth/login"
      submitLabel="Continue to Studio"
      mode="sign-in"
      fields={[
        {
          name: "email",
          label: "Business email",
          type: "email",
          autoComplete: "email",
          placeholder: "Your business email",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "current-password",
        },
      ]}
      footer={
        <div className="grid gap-4">
          <div
            aria-hidden="true"
            className="flex items-center gap-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]"
          >
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            or
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <GoogleSignInButton />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link className="font-semibold text-[var(--color-brand)]" href={registerHref}>
              New braider? Apply to join →
            </Link>
            <Link
              className="font-semibold text-[var(--color-brand)]"
              href="/forgot-password"
            >
              Forgot Password?
            </Link>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Looking to book a hairstyle?{" "}
            <Link className="font-semibold text-[var(--color-brand)]" href="/sign-in">
              Sign in as a client →
            </Link>
          </p>
        </div>
      }
    />
  );
}
