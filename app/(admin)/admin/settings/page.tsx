import type { Metadata } from "next";
import { AdminSettingsDashboard } from "@/features/admin/settings/AdminSettingsDashboard";

export const metadata: Metadata = {
  title: "Admin settings",
  description: "How the platform runs, and what is waiting on you.",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return <AdminSettingsDashboard />;
}
