import type { Metadata } from "next";
import { StudioCalendar } from "@/features/studio/components/calendar/StudioCalendar";

export const metadata: Metadata = {
  title: "Calendar",
  robots: { index: false, follow: false },
};

export default function StudioCalendarPage() {
  return <StudioCalendar />;
}
