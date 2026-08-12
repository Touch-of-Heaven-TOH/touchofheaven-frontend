import type { Metadata } from "next";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a Touch of Heaven password reset email.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthActionForm
      title="Reset Password"
      description="Enter your email and we’ll send password reset instructions when the account is eligible."
      endpoint="/api/v1/auth/forgot-password"
      submitLabel="Send Reset Link"
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
