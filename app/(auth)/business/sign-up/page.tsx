import type { Metadata } from "next";
import { CalendarClock, Clock3, UserRound } from "lucide-react";
import { BusinessAuthShell } from "@/features/auth/components/business/BusinessAuthShell";
import { BusinessSignUpForm } from "@/features/auth/components/business/BusinessSignUpForm";

export const metadata: Metadata = {
  title: "Create your business account",
  description: "Create your Touch of Heaven business account.",
};

export default function BraiderSignUpPage() {
  return (
    <BusinessAuthShell
      headline="Build a business clients can trust."
      highlights={[
        {
          icon: <UserRound aria-hidden="true" size={20} />,
          title: "Professional online presence",
        },
        {
          icon: <CalendarClock aria-hidden="true" size={20} />,
          title: "Secure booking tools",
        },
        {
          icon: <Clock3 aria-hidden="true" size={20} />,
          title: "More time for your clients",
        },
      ]}
    >
      <BusinessSignUpForm />
    </BusinessAuthShell>
  );
}
