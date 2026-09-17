import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioTeam } from "@/features/studio/components/team/StudioTeam";
import { SkeletonRows } from "@/features/studio/components/ui/primitives";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export default function StudioTeamPage() {
  return (
    <Suspense fallback={<SkeletonRows label="Loading team" rows={3} />}>
      <StudioTeam />
    </Suspense>
  );
}
