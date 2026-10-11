import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductScreen } from "@/features/app/market/ProductScreen";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  return (
    <Suspense>
      <ProductScreen id={productId} />
    </Suspense>
  );
}
