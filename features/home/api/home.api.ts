import { serverApiFetch } from "@/lib/api/server";
import { parsePublicHomePagePayload } from "@/features/home/schemas/home.schema";
import type {
  DynamicSection,
  HomePageData,
  PublicHomeActivity,
  PublicHomeBraider,
  PublicHomeProduct,
} from "@/features/home/types/home.types";

export const PUBLIC_HOME_ENDPOINT = "/api/v1/public/homepage";

function sectionFromItems<TItem>(
  endpoint: string,
  items: TItem[],
  emptyMessage: string,
): DynamicSection<TItem> {
  return {
    endpoint,
    items,
    status: items.length > 0 ? "ready" : "empty",
    message: items.length > 0 ? "" : emptyMessage,
  };
}

function unavailableSection<TItem>(
  endpoint: string,
  message: string,
): DynamicSection<TItem> {
  return {
    endpoint,
    items: [],
    status: "unavailable",
    message,
  };
}

export function createUnavailableHomePageData(): HomePageData {
  return {
    source: "pending-contract",
    activity: unavailableSection<PublicHomeActivity>(
      PUBLIC_HOME_ENDPOINT,
      "Live activity will appear after the public homepage feed is enabled.",
    ),
    featuredBraiders: unavailableSection<PublicHomeBraider>(
      PUBLIC_HOME_ENDPOINT,
      "Verified braider highlights load from the public homepage feed.",
    ),
    marketplaceProducts: unavailableSection<PublicHomeProduct>(
      PUBLIC_HOME_ENDPOINT,
      "Marketplace products will display after the public catalog feed is approved.",
    ),
  };
}

export async function fetchPublicHomePageData(): Promise<HomePageData> {
  try {
    const payload = parsePublicHomePagePayload(
      await serverApiFetch<unknown>(PUBLIC_HOME_ENDPOINT, {
        cache: "no-store",
      }),
    );

    return {
      source: "backend",
      activity: sectionFromItems(
        PUBLIC_HOME_ENDPOINT,
        payload.activity,
        "No public activity is available right now.",
      ),
      featuredBraiders: sectionFromItems(
        PUBLIC_HOME_ENDPOINT,
        payload.featuredBraiders,
        "No verified braider highlights are published yet.",
      ),
      marketplaceProducts: sectionFromItems(
        PUBLIC_HOME_ENDPOINT,
        payload.marketplaceProducts,
        "No marketplace products are published yet.",
      ),
    };
  } catch {
    return createUnavailableHomePageData();
  }
}
