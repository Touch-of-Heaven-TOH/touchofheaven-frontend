import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-tools badge sits over the Studio sidebar and mobile
  // navigation during local testing; it never ships to production anyway.
  devIndicators: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.cloudflare.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.ggpht.com" },
      { protocol: "https", hostname: "*.mapbox.com" },
      { protocol: "https", hostname: "*.stripe.com" },
      { protocol: "https", hostname: "api.qrserver.com" },
      // Temporary: the 4 AI Studio styles currently in the local dev DB
      // still have their raw scraped Pinterest source URL as thumbnailUrl
      // because R2 was never configured when scripts/scrape-styles.ts ran
      // (the R2 upload step failed and left the placeholder in place - see
      // that script's `thumbnailUrl: existing?.thumbnailUrl ?? style.imageUrl`
      // fallback). Without this, next/image throws and crashes the whole
      // /ai-studio page for any style still in that state. Remove once R2
      // is configured and the catalog is re-scraped so every thumbnailUrl
      // is actually R2-hosted - hotlinking Pinterest's CDN isn't something
      // to rely on long-term.
      { protocol: "https", hostname: "i.pinimg.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
