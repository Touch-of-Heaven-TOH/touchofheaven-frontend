import type { Metadata } from "next";
import { Suspense } from "react";
import { CartScreen } from "@/features/app/market/CartScreen";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <Suspense>
      <CartScreen />
    </Suspense>
  );
}
