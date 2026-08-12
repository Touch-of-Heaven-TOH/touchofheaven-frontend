import type { Metadata } from "next";
import { AuthActionForm } from "@/features/auth/components/AuthActionForm";

export const metadata: Metadata = {
  title: "MFA challenge",
  description: "Complete multi-factor authentication for Touch of Heaven.",
};

export default function MfaPage() {
  return (
    <AuthActionForm
      title="Enter Verification Code"
      description="Use your authenticator or backup code to finish signing in."
      endpoint="/api/v1/auth/mfa/challenge"
      submitLabel="Verify Code"
      mode="mfa"
      fields={[
        {
          name: "code",
          label: "Authentication code",
          type: "text",
          autoComplete: "one-time-code",
        },
      ]}
    />
  );
}
