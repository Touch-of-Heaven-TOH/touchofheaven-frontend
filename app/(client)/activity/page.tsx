import type { Metadata } from "next";
import { ClientActivity } from "@/features/client-home/ClientActivity";

export const metadata: Metadata = {
  title: "Your activity",
  robots: { index: false, follow: false },
};

const TABS = ["upcoming", "completed", "cancelled"] as const;
type Tab = (typeof TABS)[number];

function tabFrom(value: string | undefined): Tab {
  return TABS.includes(value as Tab) ? (value as Tab) : "upcoming";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // The filter lives in the URL, so a tab is shareable and survives a
  // reload rather than resetting to the first one.
  const { status } = await searchParams;
  return <ClientActivity initialTab={tabFrom(status)} />;
}
