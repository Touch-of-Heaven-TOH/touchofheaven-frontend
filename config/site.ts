export const siteConfig = {
  name: "Touch of Heaven",
  shortName: "TOH",
  domain: "touchofheavenafricanhairbraiding.com",
  url:
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://touchofheavenafricanhairbraiding.com",
  description:
    "Discover verified African hair braiders, compare services, book securely, and manage every appointment from one trusted platform.",
  supportEmail: "support@touchofheavenafricanhairbraiding.com",
  locale: "en-US",
} as const;

export const brandAssets = {
  heroImage: "/images/home/images/braiding-appointment-hero.png",
  ogImage: "/opengraph-image",
} as const;
