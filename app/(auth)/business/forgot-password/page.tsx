import type { Metadata } from "next";
import { Clock3, Lock, ShieldCheck } from "lucide-react";
import { BusinessAuthShell } from "@/features/auth/components/business/BusinessAuthShell";
import { BusinessForgotPasswordForm } from "@/features/auth/components/business/BusinessForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot your password",
  description: "Reset your Touch of Heaven business password.",
};

export default function BusinessForgotPasswordPage() {
  return (
    <BusinessAuthShell
      headline="We'll help you get back to business."
      highlights={[
        {
          icon: <ShieldCheck aria-hidden="true" size={20} />,
          title: "Secure recovery",
          description: "We protect your account and keep your data safe.",
        },
        {
          icon: <Lock aria-hidden="true" size={20} />,
          title: "Protected sessions",
          description: "Your active sessions and clients stay secure.",
        },
        {
          icon: <Clock3 aria-hidden="true" size={20} />,
          title: "Quick return to your workspace",
          description: "Get back to appointments, team, and tools fast.",
        },
      ]}
    >
      <BusinessForgotPasswordForm />
    </BusinessAuthShell>
  );
}
