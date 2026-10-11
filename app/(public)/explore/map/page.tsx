import { redirect } from "next/navigation";

// Explore was folded into Businesses: the app has five tabs and no Explore.
export default async function ExploreRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries((await searchParams) ?? {})) {
    if (typeof value === "string") params.set(key, value);
  }
  const query = params.toString();
  redirect(query ? `/businesses?${query}` : "/businesses");
}
