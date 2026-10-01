import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack's persistent dev cache has crashed the dev server twice on
    // this machine ("Restore of All for task ... failed", then Aborting),
    // taking the whole site down mid-session. Without it each cold compile
    // is slower, but the server stays up. Production builds are unaffected.
    turbopackFileSystemCacheForDev: false,
  },
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
  async redirects() {
    return [
      // /for-clients was a second client home page. Its content is now the
      // closing section of /, so the old URL keeps working for bookmarks
      // and anything already linking to it.
      { source: "/for-clients", destination: "/", permanent: true },

      // Discovery used to be six routes rendering two components, with two
      // byte-identical pairs among them. It is one page now: /explore, where
      // browse is the no-query state and the map is ?view=map. These keep
      // every old link, bookmark and indexed URL working.
      { source: "/businesses", destination: "/explore", permanent: true },
      { source: "/explore/search", destination: "/explore", permanent: true },
      {
        source: "/explore/filters",
        destination: "/explore?filters=open",
        permanent: true,
      },
      { source: "/explore/map", destination: "/explore?view=map", permanent: true },
      { source: "/map", destination: "/explore?view=map", permanent: true },

      // The business profile's tabs were five routes rendering one component
      // with a different section prop. They are tabs on one page now, named
      // by ?tab=, so these keep every old profile link working.
      {
        source: "/businesses/:businessId/services",
        destination: "/businesses/:businessId?tab=services",
        permanent: true,
      },
      {
        source: "/businesses/:businessId/portfolio",
        destination: "/businesses/:businessId?tab=portfolio",
        permanent: true,
      },
      {
        source: "/businesses/:businessId/reviews",
        destination: "/businesses/:businessId?tab=reviews",
        permanent: true,
      },
      {
        source: "/businesses/:businessId/credentials",
        destination: "/businesses/:businessId?tab=credentials",
        permanent: true,
      },
    ];
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
