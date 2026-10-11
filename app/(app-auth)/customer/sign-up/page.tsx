import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpFlow } from "@/features/app/auth/AuthScreens";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Touch of Heaven account to book, shop and save looks.",
};

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpFlow />
    </Suspense>
  );
}
