import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow, type BookingStep } from "@/features/booking/components/BookingFlow";

type PreviewBookingPageProps = {
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

export const metadata: Metadata = {
  title: "Booking preview",
  robots: { index: false, follow: false },
};

export default async function PreviewBookingPage({
  params,
}: PreviewBookingPageProps) {
  const segments = (await params).step;
  const initialStep = stepBySegment[segments?.[0] ?? ""] ?? "configure";

  return (
    <Suspense>
      <BookingFlow braiderId="amara-braids-beauty" initialStep={initialStep} />
    </Suspense>
  );
}
