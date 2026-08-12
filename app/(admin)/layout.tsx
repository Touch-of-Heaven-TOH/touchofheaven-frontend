import type { Metadata } from "next";
import { AdminShell } from "@/features/admin";
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

  return <AdminShell user={user}>{children}</AdminShell>;
}
