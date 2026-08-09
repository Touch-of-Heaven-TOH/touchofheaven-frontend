import type { Metadata } from "next";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a Touch of Heaven password reset email.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthActionForm
      title="Reset your password"
      description="If the account is eligible, the backend sends a reset link without revealing whether an email exists."
      endpoint="/api/v1/auth/forgot-password"
      submitLabel="Send reset link"
      mode="forgot-password"
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
        },
      ]}
    />
  );
}
