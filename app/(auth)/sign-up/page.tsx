import type { Metadata } from "next";
import Link from "next/link";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Touch of Heaven customer account.",
};

export default function SignUpPage() {
  return (
    <AuthActionForm
      title="Create Account"
      description="Join Touch of Heaven to book styles, save favorites, and shop with one account."
      endpoint="/api/v1/auth/signup"
      submitLabel="Create Account"
      mode="sign-up"
      terms
      fields={[
        { name: "firstName", label: "First name", type: "text" },
        { name: "lastName", label: "Last name", type: "text" },
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
        <Link className="font-semibold text-[var(--color-brand)]" href="/sign-in">
          Already have an account? Sign In
        </Link>
      }
    />
  );
}
