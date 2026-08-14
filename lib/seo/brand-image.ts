import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { brandAssets } from "@/config/site";

export async function getBrandMarkDataUrl() {
  const assetPath = join(process.cwd(), "public", brandAssets.logoMark);
  const image = await readFile(assetPath);

  return `data:image/png;base64,${image.toString("base64")}`;
}
