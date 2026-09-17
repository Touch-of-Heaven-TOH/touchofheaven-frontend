import type { Metadata } from "next";
import { Inter, Libre_Caslon_Text } from "next/font/google";
import { brandAssets, siteConfig } from "@/config/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// The display serif for Business Studio headings and figures (see
// styles/studio.css). Only exposed as a variable here, so it is not applied
// anywhere unless a component opts in with `font-display`.
const displaySerif = Libre_Caslon_Text({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    <html lang="en" className={`${inter.variable} ${displaySerif.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--color-page)] text-[var(--color-text-primary)]">
        {children}
      </body>
    </html>
  );
}
