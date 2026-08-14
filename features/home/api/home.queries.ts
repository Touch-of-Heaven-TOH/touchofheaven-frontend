import {
  createUnavailableHomePageData,
  fetchPublicHomePageData,
} from "@/features/home/api/home.api";
import type { HomePageData } from "@/features/home/types/home.types";

export async function getHomePageData(): Promise<HomePageData> {
  if (process.env.DISABLE_HOME_BACKEND === "true") {
    return createUnavailableHomePageData();
  }

  return fetchPublicHomePageData();
}
