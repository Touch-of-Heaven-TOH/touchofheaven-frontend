import type { Metadata } from "next";
import { ServiceEditor } from "@/features/studio/components/services/ServiceEditor";

export const metadata: Metadata = {
  title: "New service",
  robots: { index: false, follow: false },
};

export default function StudioNewServicePage() {
  return <ServiceEditor serviceId={null} />;
}
