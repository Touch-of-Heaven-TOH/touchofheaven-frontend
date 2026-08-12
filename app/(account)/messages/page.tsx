import type { Metadata } from "next";
import { MessagesView } from "@/features/messaging/components/MessagesView";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message braiders you've booked or reached out to.",
  robots: { index: false, follow: false },
};

export default async function AccountMessagesPage() {
  const user = await requireUser();
  return <MessagesView currentUserId={user.id} />;
}
