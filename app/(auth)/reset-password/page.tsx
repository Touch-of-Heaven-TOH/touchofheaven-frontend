import type { Metadata } from "next";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new Touch of Heaven account password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthActionForm
      title="Set New Password"
      description="Enter your reset token and choose a new password."
      endpoint="/api/v1/auth/reset-password"
      submitLabel="Update Password"
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
