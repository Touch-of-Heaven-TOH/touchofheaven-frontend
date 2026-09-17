import type { Metadata } from "next";
import { TeamInvitations } from "@/features/studio/components/team/TeamInvitations";

export const metadata: Metadata = {
  title: "Team invitations",
  robots: { index: false, follow: false },
};

export default function TeamInvitationsPage() {
  return <TeamInvitations />;
}
