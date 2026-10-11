import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesScreen } from "@/features/app/messages/MessagesScreen";

export const metadata: Metadata = {
  title: "Messages",
  description: "Message the businesses you book with.",
  robots: { index: false, follow: false },
};

export default function AccountMessagesPage() {
  return (
    <Suspense>
      <MessagesScreen />
    </Suspense>
  );
}
