import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { bookingContent } from "@/config/page-content";

type BookingPageProps = {
  params: Promise<{ step?: string[] }>;
};

function contentKey(segments: string[] | undefined): keyof typeof bookingContent {
  if (!segments?.length) return "service";
  if (segments[0] === "confirmation") return "confirmation";

  const last = segments.at(-1);
  if (
    last === "consultation" ||
    last === "review" ||
    last === "payment"
  ) {
    return last;
  }

  return "time";
}

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const content = bookingContent[contentKey((await params).step)];
  return {
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false },
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const key = contentKey((await params).step);
  const content = bookingContent[key];

  if (!content) notFound();

  return <RouteStatusPage content={content} href="/braiders" />;
}
