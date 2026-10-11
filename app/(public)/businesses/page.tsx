import type { Metadata } from "next";
import { Suspense } from "react";
import { BusinessSearch } from "@/features/app/businesses/BusinessSearch";

export const metadata: Metadata = {
  title: "Book beauty and wellness near you",
  description:
    "Find verified braiders, barbers, nail techs and spas in Douala and Yaoundé, compare services and book online.",
};

export default function BusinessesPage() {
  return (
    <Suspense>
      <BusinessSearch />
    </Suspense>
  );
}
