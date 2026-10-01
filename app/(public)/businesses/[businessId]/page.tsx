import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BusinessProfilePage,
  type ProfileSection,
} from "@/features/discovery/BusinessProfile";
import { loadPublicBusiness } from "@/features/discovery/business-data";

type Params = {
  params: Promise<{ businessId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const SECTIONS: ProfileSection[] = [
  "overview",
  "services",
  "portfolio",
  "reviews",
  "credentials",
];

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const business = await loadPublicBusiness((await params).businessId);
  if (!business) notFound();
  const name = business.profile.professionalName;
  return {
    title: `${name} | Touch of Heaven`,
    description: business.profile.bio ?? `Book with ${name} on Touch of Heaven.`,
  };
}

/*
 * The whole business profile on one page.
 *
 * Overview, services, portfolio, reviews and credentials used to be five
 * routes rendering the same component with a different section prop, so
 * moving between them cost a page load and lost your place. They are tabs
 * on this page now; ?tab= still names the open one so it can be shared and
 * survives a reload.
 */
export default async function BusinessProfileRoute({ params, searchParams }: Params) {
  const business = await loadPublicBusiness((await params).businessId);
  if (!business) notFound();

  const raw = (await searchParams)?.tab;
  const tab = Array.isArray(raw) ? raw[0] : raw;
  const section = SECTIONS.includes(tab as ProfileSection)
    ? (tab as ProfileSection)
    : "overview";

  return <BusinessProfilePage business={business} section={section} />;
}
