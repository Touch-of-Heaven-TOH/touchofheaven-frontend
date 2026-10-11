import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { brandAssets, siteConfig } from "@/config/site";
import "./globals.css";

// The interface face. latin-ext covers the French names and accents
// (Élégance, Aïcha) the Cameroon market writes every day.
const uiSans = Plus_Jakarta_Sans({
  variable: "--font-ui",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// The display serif: greetings, hero lines, Studio figures. Only exposed as
// a variable, so it is not applied unless a component opts in with
// `font-display`.
const displaySerif = Cormorant_Garamond({
  variable: "--font-display-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: brandAssets.favicon,
    apple: brandAssets.favicon,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [brandAssets.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [brandAssets.ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${uiSans.variable} ${displaySerif.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--color-page)] text-[var(--color-text-primary)]">
        {/* Above everything, on every page, because that is what an admin
            switching maintenance mode on is asking for. */}
        <MaintenanceBanner />
        {children}
      </body>
    </html>
  );
}
