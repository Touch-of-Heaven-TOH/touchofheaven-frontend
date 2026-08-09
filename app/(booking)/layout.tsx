import type { Metadata } from "next";
import { bookingNavigation } from "@/config/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking",
  robots: { index: false, follow: false },
};

export default async function BookingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <DashboardShell
      eyebrow="Secure booking"
      navigation={bookingNavigation}
      title="Booking"
      tone="booking"
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
