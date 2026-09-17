import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DevHub } from "@/features/dev/DevHub";
import { pageCatalog } from "@/lib/dev/page-catalog";
import { isPreviewAccessEnabled } from "@/lib/dev/preview-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Page hub (development)",
  robots: { index: false, follow: false },
};

/** Development-only index of every page and how far it is built. */
export default async function DevHubPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const host = (await headers()).get("host");
  return <DevHub sections={pageCatalog} previewAccess={isPreviewAccessEnabled(host)} />;
}
