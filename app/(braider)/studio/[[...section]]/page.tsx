import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { studioContent } from "@/config/page-content";

type StudioPageProps = {
  params: Promise<{ section?: string[] }>;
};

function contentKey(segments: string[] | undefined): keyof typeof studioContent {
  if (!segments?.length) return "today";

  const key = segments[0];
  if (
    key === "calendar" ||
    key === "appointments" ||
    key === "services" ||
    key === "portfolio" ||
    key === "earnings" ||
    key === "settings"
  ) {
    return key;
  }

  return "today";
}

export async function generateMetadata({
  params,
}: StudioPageProps): Promise<Metadata> {
  const content = studioContent[contentKey((await params).section)];
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false },
  };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const content = studioContent[contentKey((await params).section)];

  if (!content) notFound();

  return <RouteStatusPage content={content} href="/studio/calendar" />;
}
