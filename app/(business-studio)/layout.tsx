import type { Metadata } from "next";
import { headers } from "next/headers";
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
  const currentPath = (await headers()).get("x-toh-pathname") ?? "/studio";

  return (
    <DashboardShell
      currentPath={currentPath}
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
