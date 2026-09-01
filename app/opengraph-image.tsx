/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { getBrandMarkDataUrl } from "@/lib/seo/brand-image";

export const alt = "Touch of Heaven beauty and marketplace appointments";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const brandMark = await getBrandMarkDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fffaf5",
          color: "#2b1724",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ color: "#9b6b1f", fontSize: 30, fontWeight: 700 }}>
            Verified Beauty Businesses
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, maxWidth: 760 }}>
            {siteConfig.name}
          </div>
          <div style={{ color: "#6f5365", fontSize: 32, maxWidth: 790 }}>
            Discover professionals, book securely, and manage every appointment.
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "#ffffff",
            border: "2px solid #e8dacb",
            borderRadius: "999px",
            display: "flex",
            height: 220,
            justifyContent: "center",
            overflow: "hidden",
            width: 220,
          }}
        >
          <img
            alt=""
            height={190}
            src={brandMark}
            style={{ objectFit: "contain" }}
            width={190}
          />
        </div>
      </div>
    ),
    size,
  );
}
