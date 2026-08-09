import type { Metadata } from "next";
import { accountNavigation } from "@/config/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <DashboardShell
      eyebrow="Customer workspace"
      navigation={accountNavigation}
      title="Account"
      tone="account"
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
