import type { Metadata } from "next";
import { CalendarCheck, CreditCard, Lock } from "lucide-react";
import { BusinessAuthShell } from "@/features/auth/components/business/BusinessAuthShell";
import { BusinessResetPasswordForm } from "@/features/auth/components/business/BusinessResetPasswordForm";

export const metadata: Metadata = {
  title: "Create a new password",
  description: "Set a new Touch of Heaven business password.",
};

export default function BraiderResetPasswordPage() {
  return (
    <BusinessAuthShell
      headline="Secure your account. Protect your business."
      highlights={[
        {
          icon: <Lock aria-hidden="true" size={20} />,
          title: "Keep your client information private and secure.",
        },
        {
          icon: <CalendarCheck aria-hidden="true" size={20} />,
          title: "Protect your bookings and appointments.",
        },
        {
          icon: <CreditCard aria-hidden="true" size={20} />,
          title: "Secure your payments and transactions.",
        },
      ]}
    >
      <BusinessResetPasswordForm />
    </BusinessAuthShell>
  );
}
