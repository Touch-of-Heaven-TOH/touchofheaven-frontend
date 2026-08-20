import type {
  AiStudioCategory,
  AiStudioColor,
  AiStudioStyle,
} from "@/features/ai-studio/types";

export const aiStudioCategories = [
  "All",
  "Knotless Braids",
  "Boho Braids",
  "Passion Twists",
  "Faux Locs",
  "French Curl",
] as const;

export const aiStudioColors: AiStudioColor[] = [
  {
    id: "1",
    code: "1",
    name: "Jet Black",
    group: "Black",
    swatchColors: ["#090808"],
  },
  {
    id: "1B",
    code: "1B",
    name: "Natural Black",
    group: "Black",
    swatchColors: ["#171210"],
  },
  {
    id: "2",
    code: "2",
    name: "Dark Brown",
    group: "Brown",
    swatchColors: ["#2A1C17"],
  },
  {
    id: "4",
    code: "4",
    name: "Chocolate Brown",
    group: "Brown",
    swatchColors: ["#4B2E24"],
  },
  {
    id: "6",
    code: "6",
    name: "Chestnut Brown",
    group: "Brown",
    swatchColors: ["#6B3D2A"],
  },
  {
    id: "30",
    code: "30",
    name: "Warm Brown",
    group: "Brown",
    swatchColors: ["#A65A32"],
  },
  {
    id: "33",
    code: "33",
    name: "Dark Chestnut",
    group: "Brown",
    swatchColors: ["#6E3027"],
  },
  {
    id: "27",
    code: "27",
    name: "Honey Blonde",
    group: "Blonde",
    swatchColors: ["#C98A3D"],
  },
  {
    id: "613",
    code: "613",
    name: "Bleach Blonde",
    group: "Blonde",
    swatchColors: ["#E8D49B"],
  },
  {
    id: "613/27",
    code: "613/27",
    name: "Honey + Platinum",
    group: "Blends",
    swatchColors: ["#E8D49B", "#C98A3D"],
  },
  {
    id: "1B/4",
    code: "1B/4",
    name: "Black + Brown",
    group: "Blends",
    swatchColors: ["#171210", "#4B2E24"],
  },
  {
    id: "AB",
    code: "AB",
    name: "Ash Brulee",
    group: "Blends",
    swatchColors: ["#82756F", "#C7B39C"],
  },
];

const allColorIds = aiStudioColors.map((color) => color.id);

function imagePath(styleId: string, angle: "front" | "side" | "back") {
  const extension = styleId === "boho-wavy-waist" ? "png" : "jpg";
  return `/images/ai-studio/catalog/${styleId}-${angle}.${extension}`;
}

function style(input: {
  id: string;
  category: AiStudioCategory;
  density: string;
  length: string;
  parting: string;
  texture?: string;
  angles: Array<"front" | "side" | "back">;
}): AiStudioStyle {
  const name = input.category;
  const images = input.angles.map((angle) => ({
    angle,
    url: imagePath(input.id, angle),
    alt: `${name} ${angle} reference`,
  }));

  return {
    id: input.id,
    slug: input.id,
    name,
    category: input.category,
    density: input.density,
    length: input.length,
    parting: `${input.parting} part`,
    texture: input.texture,
    thumbnailUrl: imagePath(input.id, "front"),
    images,
    availableColors: allColorIds,
    availableSizes: [input.density],
    availableLengths: [input.length],
  };
}

export const fallbackAiStudioStyles: AiStudioStyle[] = [
  style({
    id: "knotless-small-midback",
    category: "Knotless Braids",
    density: "Small",
    length: "Mid-back",
    parting: "Center",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "knotless-small-waist",
    category: "Knotless Braids",
    density: "Small",
    length: "Waist",
    parting: "Center",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "boho-medium-shoulder",
    category: "Boho Braids",
    density: "Medium",
    length: "Shoulder-length",
    parting: "Center",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "boho-medium-midback",
    category: "Boho Braids",
    density: "Medium",
    length: "Mid-back",
    parting: "Center",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "boho-medium-waist",
    category: "Boho Braids",
    density: "Medium",
    length: "Waist",
    parting: "Center",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "boho-wavy-waist",
    category: "Boho Braids",
    density: "Medium",
    length: "Waist",
    parting: "Center",
    texture: "Wavy",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "passion-large-shoulder",
    category: "Passion Twists",
    density: "Large",
    length: "Shoulder-length",
    parting: "Center",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "passion-large-midback",
    category: "Passion Twists",
    density: "Large",
    length: "Mid-back",
    parting: "Center",
    angles: ["front", "back"],
  }),
  style({
    id: "passion-large-waist",
    category: "Passion Twists",
    density: "Large",
    length: "Waist",
    parting: "Center",
    angles: ["front", "back"],
  }),
  style({
    id: "faux-medium-shoulder",
    category: "Faux Locs",
    density: "Medium",
    length: "Shoulder-length",
    parting: "Center",
    angles: ["front", "back"],
  }),
  style({
    id: "faux-medium-midback",
    category: "Faux Locs",
    density: "Medium",
    length: "Mid-back",
    parting: "Center",
    angles: ["front", "back"],
  }),
  style({
    id: "faux-medium-waist",
    category: "Faux Locs",
    density: "Medium",
    length: "Waist",
    parting: "Center",
    angles: ["front", "side", "back"],
  }),
  style({
    id: "french-small-shoulder",
    category: "French Curl",
    density: "Small",
    length: "Shoulder-length",
    parting: "Side",
    angles: ["front", "back"],
  }),
  style({
    id: "french-small-midback",
    category: "French Curl",
    density: "Small",
    length: "Mid-back",
    parting: "Center",
    angles: ["front", "back"],
  }),
  style({
    id: "french-small-waist",
    category: "French Curl",
    density: "Small",
    length: "Waist",
    parting: "Center",
    angles: ["front", "back"],
  }),
];

