import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

type AccountPageProps = {
  params: Promise<{ section?: string[] }>;
};

// Every /account/settings/* path now has its own page.tsx (see
// app/(account)/account/settings/*/page.tsx), which Next.js always
// resolves before this catch-all - so this function only ever sees the
// segments those literal routes don't own: no segments (overview),
// /appointments, or a genuinely unrecognized path, which falls back to
// overview rather than a hard 404.
function contentKey(segments: string[] | undefined): keyof typeof accountContent {
  if (!segments?.length) return "overview";
  if (segments[0] === "appointments") return "appointments";

  return "overview";
}

export async function generateMetadata({
  params,
}: AccountPageProps): Promise<Metadata> {
  const content = accountContent[contentKey((await params).section)];
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({ params }: AccountPageProps) {
  const content = accountContent[contentKey((await params).section)];

  if (!content) notFound();

  return <RouteStatusPage content={content} href="/book" />;
}
