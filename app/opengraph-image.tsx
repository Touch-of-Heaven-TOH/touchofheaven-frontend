import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = "Touch of Heaven braiding appointments";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
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
            Verified African Hair Braiding
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, maxWidth: 760 }}>
            {siteConfig.name}
          </div>
          <div style={{ color: "#6f5365", fontSize: 32, maxWidth: 790 }}>
            Discover braiders, book securely, and manage every appointment.
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            background: "#5c2747",
            borderRadius: "999px",
            color: "#f7d47c",
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            height: 220,
            justifyContent: "center",
            width: 220,
          }}
        >
          TOH
        </div>
      </div>
    ),
    size,
  );
}
