import type { Metadata } from "next";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { adminContent } from "@/config/page-content";

// Every segment this used to branch on now has its own page.tsx (see
// app/(admin)/admin/*/page.tsx), which Next.js always resolves ahead of
// this catch-all. This only ever renders for the exact root "/admin"
// (the Owner Overview - it has no literal sibling page.tsx, unlike
// /studio's Today view, since the overview has no special structural
// requirement the generic RouteStatusPage pattern doesn't already
// satisfy) or a genuinely unrecognized path, which falls back to the
// overview rather than a hard 404.
const content = adminContent.overview;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function AdminOverviewPage() {
  return <RouteStatusPage content={content} href="/admin/applications" />;
}
