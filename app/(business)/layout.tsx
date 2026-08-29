import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up your business",
  robots: { index: false, follow: false },
};

// No DashboardShell here on purpose - the wizard owns its own full-bleed
// sidebar/top-bar chrome (BusinessWizardShell), unlike the customer
// account area. This layout's only job is the auth gate; proxy.ts already
// redirects a signed-out visitor to /business/sign-in before this ever
// renders (see businessProtectedRoutePrefixes in config/route-access.ts) -
// requireUser() here is the same defense-in-depth every other protected
// layout in this codebase has, not the primary enforcement point.
export default async function BusinessLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser();
  return <>{children}</>;
}
