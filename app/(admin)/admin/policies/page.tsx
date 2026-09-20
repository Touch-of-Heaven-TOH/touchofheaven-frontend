import type { Metadata } from "next";
import { PlatformPolicies } from "@/features/admin/platform/PlatformPolicies";

export const metadata: Metadata = {
  title: "Platform policies",
  description: "Fees, booking rules and legal documents.",
  robots: { index: false, follow: false },
};

export default function AdminPoliciesPage() {
  return <PlatformPolicies />;
}
