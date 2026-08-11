import type { Metadata } from "next";
import { MessagesView } from "@/features/messaging/components/MessagesView";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message clients who have booked or reached out to you.",
  robots: { index: false, follow: false },
};

export default async function StudioMessagesPage() {
  const user = await requireUser();
  return <MessagesView currentUserId={user.id} />;
}
