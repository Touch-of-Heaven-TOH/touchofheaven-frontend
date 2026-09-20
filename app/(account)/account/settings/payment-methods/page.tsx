import type { Metadata } from "next";
import { PaymentMethodsSettings } from "@/features/account/settings/PaymentMethodsSettings";

export const metadata: Metadata = {
  title: "Payment methods",
  description: "Cards saved for deposits.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PaymentMethodsSettings />;
}
