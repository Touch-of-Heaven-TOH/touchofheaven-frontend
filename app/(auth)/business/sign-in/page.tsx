import type { Metadata } from "next";
import { BarChart3, CalendarCheck, UserRound } from "lucide-react";
import { BusinessAuthShell } from "@/features/auth/components/business/BusinessAuthShell";
import { BusinessSignInForm } from "@/features/auth/components/business/BusinessSignInForm";

export const metadata: Metadata = {
  title: "Studio sign in",
  description: "Sign in to your Touch of Heaven studio.",
};

export default function BusinessSignInPage() {
  return (
    <BusinessAuthShell
      headline="Run your beauty business with ease, empower your clients to glow."
      highlights={[
        {
          icon: <CalendarCheck aria-hidden="true" size={20} />,
          title: "Streamline appointments, staff, and services.",
        },
        {
          icon: <BarChart3 aria-hidden="true" size={20} />,
          title: "Track performance and grow revenue.",
        },
        {
          icon: <UserRound aria-hidden="true" size={20} />,
          title: "Deliver unforgettable client experiences.",
        },
      ]}
    >
      <BusinessSignInForm />
    </BusinessAuthShell>
  );
}
