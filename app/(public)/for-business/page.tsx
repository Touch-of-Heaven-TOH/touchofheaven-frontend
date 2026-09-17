import type { Metadata } from "next";
import { BusinessHomePage } from "@/features/business-home/BusinessHomePage";
import { getPlatformStats } from "@/features/business-home/api";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For business owners",
  description:
    "Take bookings, collect deposits and run your day with Touch of Heaven's Business Studio: calendar, clients, payments, team and earnings.",
};

export default async function ForBusinessPage() {
  const [stats, user] = await Promise.all([getPlatformStats(), getCurrentUser()]);
  return <BusinessHomePage stats={stats} isSignedIn={Boolean(user)} />;
}
