/**
 * The service categories the Explore page offers as tiles, and how the
 * results page decides which providers fit one.
 *
 * The backend's own category filter only knows hair styles (braids,
 * twists, locs...), so a category here is matched against the service
 * names each provider publishes (NearbyBraider.specialties) instead.
 */

export type DiscoveryCategory = {
  id: string;
  label: string;
  href: string;
  /** Lower-case fragments of service names that belong to the category. */
  keywords: string[];
  image: { src: string; alt: string; position?: string };
};

const imageBase = "/images/home/images";
const studioBase = "/images/ai-studio/catalog";

export const discoveryCategories: DiscoveryCategory[] = [
  {
    id: "braids-hair",
    label: "Braids & Hair",
    href: "/businesses?category=braids-hair",
    keywords: ["braid", "cornrow", "loc", "twist", "silk press", "hair", "weave", "wig", "natural"],
    image: {
      src: `${studioBase}/knotless-small-midback-front.jpg`,
      alt: "A polished braided hairstyle in a warm salon.",
      position: "center 34%",
    },
  },
  {
    id: "nails",
    label: "Nails",
    href: "/businesses?category=nails",
    keywords: ["nail", "manicure", "pedicure", "gel", "acrylic"],
    image: {
      src: `${imageBase}/pic1.png`,
      alt: "A clean manicure detail in a beauty studio.",
      position: "center 45%",
    },
  },
  {
    id: "barbering",
    label: "Barbering",
    href: "/businesses?category=barbering",
    keywords: ["barber", "fade", "beard", "shave", "haircut"],
    image: {
      src: `${imageBase}/pic2.png`,
      alt: "A barber grooming a client in a modern studio.",
      position: "center 38%",
    },
  },
  {
    id: "spa-wellness",
    label: "Spa & Wellness",
    href: "/businesses?category=spa-wellness",
    keywords: ["spa", "massage", "facial", "wax", "lash", "brow", "wellness"],
    image: {
      src: `${imageBase}/hero2.jpg`,
      alt: "A relaxing wellness appointment in a calm treatment room.",
      position: "center 42%",
    },
  },
];

export function discoveryCategory(id: string | undefined): DiscoveryCategory | null {
  return discoveryCategories.find((category) => category.id === id) ?? null;
}
