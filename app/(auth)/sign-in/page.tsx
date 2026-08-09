import type { Metadata } from "next";
import Link from "next/link";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Touch of Heaven.",
};

export default function SignInPage() {
  return (
    <AuthActionForm
      title="Sign in"
      description="Use your verified email and password. MFA-enabled accounts continue to the challenge screen."
      endpoint="/api/v1/auth/login"
      submitLabel="Sign in"
      mode="sign-in"
      fields={[
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
          autoComplete: "current-password",
        },
      ]}
      footer={
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
      }
    />
  );
}
