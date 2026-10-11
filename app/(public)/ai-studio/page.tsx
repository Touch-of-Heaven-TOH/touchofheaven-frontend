import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioScreen } from "@/features/app/studio/StudioScreen";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Try a hairstyle, makeup look or nail design, then book a pro who does it.",
};

export default function AiStudioPage() {
  return (
    <Suspense>
      <StudioScreen />
    </Suspense>
  );
}
