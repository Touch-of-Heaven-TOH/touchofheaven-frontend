import type { Metadata } from "next";
import { ApplicationsQueue } from "@/features/admin/applications/ApplicationsQueue";

export const metadata: Metadata = {
  title: "Provider applications",
  description: "Review people asking to work on Touch of Heaven.",
  robots: { index: false, follow: false },
};

export default function AdminApplicationsPage() {
  return <ApplicationsQueue />;
}
