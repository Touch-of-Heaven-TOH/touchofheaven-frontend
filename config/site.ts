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
  logoMark: "/images/brand/touch-of-heaven-mark.png",
  logoLockup: "/images/brand/touch-of-heaven-logo-lockup.png",
  appQrCode: "/images/brand/touch-of-heaven-app-qr.png",
  favicon: "/images/brand/touch-of-heaven-favicon.png",
  heroImage: "/images/home/braiding-appointment-hero.png",
  ogImage: "/opengraph-image",
} as const;
