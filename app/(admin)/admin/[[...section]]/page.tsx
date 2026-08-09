import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { adminContent } from "@/config/page-content";

type AdminPageProps = {
  params: Promise<{ section?: string[] }>;
};

function contentKey(segments: string[] | undefined): keyof typeof adminContent {
  if (!segments?.length) return "overview";

  const key = segments[0];
  if (
    key === "applications" ||
    key === "braiders" ||
    key === "appointments" ||
    key === "payments" ||
    key === "support" ||
    key === "policies" ||
    key === "audit" ||
    key === "system"
  ) {
    return key;
  }

  return "overview";
}

export async function generateMetadata({
  params,
}: AdminPageProps): Promise<Metadata> {
  const content = adminContent[contentKey((await params).section)];
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({ params }: AdminPageProps) {
  const content = adminContent[contentKey((await params).section)];

  if (!content) notFound();

  return <RouteStatusPage content={content} href="/admin/applications" />;
}
