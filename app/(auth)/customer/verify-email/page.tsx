import type { Metadata } from "next";
import { CustomerVerifyEmailForm } from "@/features/auth/components/CustomerVerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Confirm your Touch of Heaven email.",
};

export default function CustomerVerifyEmailPage() {
  return <CustomerVerifyEmailForm />;
}
