import type { Metadata } from "next";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new Touch of Heaven account password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthActionForm
      title="Choose a new password"
      description="Paste the reset token from your email if it was not already included in the link."
      endpoint="/api/v1/auth/reset-password"
      submitLabel="Update password"
      mode="reset-password"
      fields={[
        { name: "token", label: "Reset token", type: "text" },
        {
          name: "password",
          label: "New password",
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
    />
  );
}
