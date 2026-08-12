import type { Metadata } from "next";
import { SignInMethods } from "@/features/auth/components/SignInMethods";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Touch of Heaven.",
};

export default function SignInPage() {
  return <SignInMethods />;
}
