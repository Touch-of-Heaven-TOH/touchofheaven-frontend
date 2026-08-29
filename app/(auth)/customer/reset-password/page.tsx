import type { Metadata } from "next";
import { CustomerResetPasswordForm } from "@/features/auth/components/CustomerResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new Touch of Heaven account password.",
};

export default function CustomerResetPasswordPage() {
  return <CustomerResetPasswordForm />;
}
