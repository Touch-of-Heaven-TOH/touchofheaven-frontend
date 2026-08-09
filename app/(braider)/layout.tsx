import type { Metadata } from "next";
import { studioNavigation } from "@/config/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("BRAIDER", "/account");

  return (
    <DashboardShell
      eyebrow="Professional workspace"
      navigation={studioNavigation}
      title="Studio"
      tone="studio"
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
