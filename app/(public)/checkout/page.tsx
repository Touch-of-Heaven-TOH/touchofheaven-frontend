import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutScreen } from "@/features/app/market/CheckoutScreen";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutScreen />
    </Suspense>
  );
}
