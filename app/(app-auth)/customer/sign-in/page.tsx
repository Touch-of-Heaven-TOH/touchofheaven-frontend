import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "@/features/app/auth/AuthScreens";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Touch of Heaven.",
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignInFlow />
    </Suspense>
  );
}
