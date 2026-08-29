import type { Metadata } from "next";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { BusinessAuthShell } from "@/features/auth/components/business/BusinessAuthShell";
import { BusinessVerifyEmailForm } from "@/features/auth/components/business/BusinessVerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify your business email",
  description: "Confirm your Touch of Heaven business email.",
};

export default function BusinessVerifyEmailPage() {
  return (
    <BusinessAuthShell
      headline="One final step to secure your account."
      highlights={[
        {
          icon: <Mail aria-hidden="true" size={20} />,
          title: "Verified communication",
          description: "Ensure important updates and notifications reach you.",
        },
        {
          icon: <Lock aria-hidden="true" size={20} />,
          title: "Account recovery",
          description: "Easily recover your account if you ever need to.",
        },
        {
          icon: <ShieldCheck aria-hidden="true" size={20} />,
          title: "Peace of mind",
          description: "We keep your business and data safe and secure.",
        },
      ]}
    >
      <BusinessVerifyEmailForm />
    </BusinessAuthShell>
  );
}
