import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/features/studio/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Policies",
  robots: { index: false, follow: false },
};

export default function StudioPolicySettingsPage() {
  return (
    <ComingSoon
      title="Policies"
      icon={ShieldCheck}
      description="Your cancellation, deposit and no-show rules."
      plannedItems={[
        "Write your own cancellation and no-show policy text.",
        "Keep a version history so each booking shows the policy the client accepted.",
      ]}
      alternatives={[
        { label: "Set a cancellation policy per service", href: "/studio/services" },
        { label: "Platform cancellation policy", href: "/legal/cancellation" },
      ]}
    />
  );
}
