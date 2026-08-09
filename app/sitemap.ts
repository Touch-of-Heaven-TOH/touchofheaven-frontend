import type { MetadataRoute } from "next";
import { legalPolicies } from "@/config/legal";
import { siteConfig } from "@/config/site";

const publicRoutes = [
  "",
  "/about",
  "/how-it-works",
  "/braiders",
  "/beauty",
  "/legal",
  "/map",
  "/contact",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const legalRoutes = legalPolicies.map((policy) => `/legal/${policy.slug}`);

  return [...publicRoutes, ...legalRoutes].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
