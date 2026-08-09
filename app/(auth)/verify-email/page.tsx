import type { Metadata } from "next";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your Touch of Heaven account email.",
};

export default function VerifyEmailPage() {
  return (
    <AuthActionForm
      title="Verify email"
      description="Submit the verification token from your email to activate your account."
      endpoint="/api/v1/auth/verify-email"
      submitLabel="Verify email"
      mode="verify-email"
      fields={[{ name: "token", label: "Verification token", type: "text" }]}
    />
  );
}
