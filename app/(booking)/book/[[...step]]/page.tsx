import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { bookingContent } from "@/config/page-content";
import { BookingFlow } from "@/features/booking/components/BookingFlow";

type BookingPageProps = {
  params: Promise<{ step?: string[] }>;
};

// A single segment that isn't the literal "confirmation" is a braiderId -
// the real, connected booking flow. Every other shape (bare /book,
// /book/confirmation, and the deeper .../consultation, .../review,
// .../payment sub-steps) stays the RouteStatusPage placeholder below;
// those are separate, larger pieces of work not built yet.
function braiderIdFromSegments(segments: string[] | undefined): string | null {
  if (segments?.length === 1 && segments[0] !== "confirmation") {
    return segments[0]!;
  }
  return null;
}

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
  const segments = (await params).step;
  const braiderId = braiderIdFromSegments(segments);

  if (braiderId) {
    return (
      // BookingFlow reads useSearchParams() for an optional ?serviceId= -
      // Next.js requires that behind a Suspense boundary.
      <Suspense>
        <BookingFlow braiderId={braiderId} />
      </Suspense>
    );
  }

  const key = contentKey(segments);
  const content = bookingContent[key];

  if (!content) notFound();

  return <RouteStatusPage content={content} href="/braiders" />;
}
