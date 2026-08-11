import type { Metadata } from "next";
import { RegistrationWizard } from "@/features/auth/components/RegistrationWizard";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Touch of Heaven customer account.",
};

export default function SignUpPage() {
  return <RegistrationWizard />;
}
