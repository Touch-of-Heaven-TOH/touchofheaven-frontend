import type { Metadata } from "next";
import { HomeScreen } from "@/features/app/home/HomeScreen";

export const metadata: Metadata = {
  title: "Beauty, booking and marketplace",
  description:
    "Try looks in AI Studio, book verified salons, barbers, nail techs and spas in Douala and Yaoundé, and shop beauty products from verified sellers.",
};

export default function HomePage() {
  return <HomeScreen />;
}
