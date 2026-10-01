import type { Metadata } from "next";
import { MyLooks } from "@/features/ai-studio/components/MyLooks";

export const metadata: Metadata = {
  title: "My looks",
  description: "The AI Studio previews you have created.",
  // Someone's own previews are not something to put in a search index.
  robots: { index: false, follow: false },
};

export default function MyLooksPage() {
  return <MyLooks />;
}
