import type { Metadata } from "next";
import Link from "next/link";
import { AppleSignInButton } from "@/features/auth/components/AppleSignInButton";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create one Touch of Heaven account for bookings and shopping.",
};

export default function SignUpPage() {
  return (
    <AuthActionForm
      title="Create Account"
      description="Create one account for booking services, shopping products, and managing your Touch of Heaven profile."
      endpoint="/api/v1/auth/signup"
      submitLabel="Create Account"
      mode="sign-up"
      terms
      fields={[
        {
          name: "firstName",
          label: "First name",
          type: "text",
          autoComplete: "given-name",
        },
        {
          name: "lastName",
          label: "Last name",
          type: "text",
          autoComplete: "family-name",
        },
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
        },
        {
          name: "confirmPassword",
          label: "Confirm password",
          type: "password",
          autoComplete: "new-password",
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
          <AppleSignInButton />
          <p>
            Already have an account?{" "}
            <Link className="font-semibold text-[var(--color-brand)]" href="/sign-in">
              Sign In
            </Link>
          </p>
        </div>
      }
    />
  );
}
