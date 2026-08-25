import type { Metadata } from "next";
import { BraiderSignInMethods } from "@/features/auth/components/BraiderSignInMethods";

export const metadata: Metadata = {
  title: "Studio sign in",
  description: "Sign in to your Touch of Heaven studio.",
};

export default function BraiderSignInPage() {
  return <BraiderSignInMethods />;
}
