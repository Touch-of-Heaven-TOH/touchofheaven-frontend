import type { Metadata } from "next";
import { CustomerForgotPasswordForm } from "@/features/auth/components/CustomerForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a Touch of Heaven password reset email.",
};

export default function CustomerForgotPasswordPage() {
  return <CustomerForgotPasswordForm />;
}
