/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getBrandMarkDataUrl } from "@/lib/seo/brand-image";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default async function Icon() {
  const brandMark = await getBrandMarkDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fffaf5",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <img
          alt=""
          height={420}
          src={brandMark}
          style={{ objectFit: "contain" }}
          width={420}
        />
      </div>
    ),
    size,
  );
}
