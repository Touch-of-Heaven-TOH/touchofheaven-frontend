import type { Metadata } from "next";
import { StudioAppointments } from "@/features/studio/components/StudioAppointments";
import { studioContent } from "@/config/page-content";

const content = studioContent.appointments;

export const metadata: Metadata = {
  title: content.title,
  description: content.description,
  robots: { index: false, follow: false },
};

export default function StudioAppointmentsPage() {
  return <StudioAppointments />;
}
