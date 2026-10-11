import type { Metadata } from "next";
import { Suspense } from "react";
import { BookFlow } from "@/features/app/businesses/BookFlow";

export const metadata: Metadata = { title: "Book", robots: { index: false } };

type Params = { params: Promise<{ businessId: string }> };

export default async function BookPage({ params }: Params) {
  const { businessId } = await params;
  return (
    <Suspense>
      <BookFlow id={businessId} />
    </Suspense>
  );
}
