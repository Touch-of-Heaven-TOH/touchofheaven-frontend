import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderScreen } from "@/features/app/market/OrderScreen";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return (
    <Suspense>
      <OrderScreen id={orderId} />
    </Suspense>
  );
}
