import type { Metadata } from "next";
import { headers } from "next/headers";
import { adminNavigation } from "@/config/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole("ADMIN", "/account");
  const currentPath = (await headers()).get("x-toh-pathname") ?? "/admin";

  return (
    <DashboardShell
      currentPath={currentPath}
      eyebrow="Admin workspace"
      navigation={adminNavigation}
      title="Admin"
      tone="admin"
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
