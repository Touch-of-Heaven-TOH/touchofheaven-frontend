import type { Metadata } from "next";
import { SystemConfiguration } from "@/features/admin/platform/SystemConfiguration";

export const metadata: Metadata = {
  title: "System configuration",
  description: "Maintenance mode and platform feature switches.",
  robots: { index: false, follow: false },
};

export default function AdminSystemPage() {
  return <SystemConfiguration />;
}
