import type { Metadata } from "next";
import { ClientPortfolio } from "@/features/account/portfolio/ClientPortfolio";

export const metadata: Metadata = {
  title: "My portfolio",
  description: "The looks you've saved, and who can see each one.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ClientPortfolio />;
}
