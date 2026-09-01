import type { MetadataRoute } from "next";
import { brandAssets, siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf5",
    theme_color: "#5c2747",
    icons: [
      {
        src: brandAssets.favicon,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
