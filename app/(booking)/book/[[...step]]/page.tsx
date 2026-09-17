import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RouteStatusPage } from "@/components/layout/RouteStatusPage";
import { bookingContent } from "@/config/page-content";
import { BookingFlow, type BookingStep } from "@/features/booking/components/BookingFlow";

type BookingPageProps = {
  params: Promise<{ step?: string[] }>;
};

const stepBySegment: Partial<Record<string, BookingStep>> = {
  extras: "extras",
  consultation: "consultation",
  location: "location",
  time: "time",
  review: "review",
  payment: "payment",
  processing: "processing",
  confirmation: "confirmation",
};

function flowFromSegments(
  segments: string[] | undefined,
): { businessId: string; initialStep: BookingStep } | null {
  if (!segments?.length) return null;

  // Backward-compatible shortcut for older confirmation links.
  if (segments.length === 1 && segments[0] === "confirmation") {
    return { businessId: "amara-braids-beauty", initialStep: "confirmation" };
  }

  const businessId = segments[0];
  if (!businessId) return null;
  if (segments.length === 1) return { businessId, initialStep: "configure" };
  if (segments.length === 2) {
    const initialStep = stepBySegment[segments[1]!];
    return initialStep ? { businessId, initialStep } : null;
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
  const segments = (await params).step;
  const flow = flowFromSegments(segments);
  const content = flow ? bookingContent[contentKey([flow.initialStep])] : bookingContent[contentKey(segments)];
  return {
    title: flow ? "Book appointment" : content.title,
    description: content.description,
    robots: { index: false, follow: false },
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const segments = (await params).step;
  const flow = flowFromSegments(segments);

  if (flow) {
    return (
      // BookingFlow reads useSearchParams() for an optional ?serviceId= -
      // Next.js requires that behind a Suspense boundary.
      <Suspense>
        <BookingFlow braiderId={flow.businessId} initialStep={flow.initialStep} />
      </Suspense>
    );
  }

  const key = contentKey(segments);
  const content = bookingContent[key];

  if (!content) notFound();

  return <RouteStatusPage content={content} href="/businesses" />;
}
