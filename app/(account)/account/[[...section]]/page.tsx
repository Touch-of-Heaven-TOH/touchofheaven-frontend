import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { accountContent } from "@/config/page-content";

type AccountPageProps = {
  params: Promise<{ section?: string[] }>;
};

function contentKey(segments: string[] | undefined): keyof typeof accountContent {
  if (!segments?.length) return "overview";
  if (segments[0] === "appointments") return "appointments";
  if (segments[0] === "settings" && segments[1]) {
    const key = segments[1];
    if (
      key === "profile" ||
      key === "security" ||
      key === "privacy" ||
      key === "danger"
    ) {
      return key;
    }
  }

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
