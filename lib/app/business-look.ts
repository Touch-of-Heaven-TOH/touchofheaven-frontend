import type { LookName, VenueKind } from "@/components/app/art";
import { hashString } from "@/components/app/art";

/** The business kinds the wizard records (BusinessCategory in the backend). */
export type BusinessCategory = "HAIR_BRAIDING" | "NAILS" | "BARBERING" | "SPA_WELLNESS" | "MULTI_SERVICE";

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> = {
  HAIR_BRAIDING: "Hair & braids",
  NAILS: "Nails",
  BARBERING: "Barber",
  SPA_WELLNESS: "Spa & massage",
  MULTI_SERVICE: "Salon",
};

/** The browse chips, shared by Home and the business search. */
export const BUSINESS_FILTERS: { key: string; label: string; businessCategory?: BusinessCategory; category?: string }[] = [
  { key: "all", label: "Near me" },
  { key: "braids", label: "Braids", category: "braids" },
  { key: "locs", label: "Locs", category: "locs" },
  { key: "barber", label: "Barber", businessCategory: "BARBERING" },
  { key: "nails", label: "Nails", businessCategory: "NAILS" },
  { key: "spa", label: "Spa", businessCategory: "SPA_WELLNESS" },
  { key: "silk", label: "Silk press", category: "silk-press-styling" },
];

/** Which illustrated scene stands in for a business without a cover photo. */
export function venueKindFor(category: BusinessCategory | null | undefined): VenueKind {
  if (category === "BARBERING") return "barber";
  if (category === "NAILS") return "nails";
  if (category === "SPA_WELLNESS") return "spa";
  return "salon";
}

const LOOKS_BY_CATEGORY: Record<BusinessCategory, LookName[]> = {
  HAIR_BRAIDING: ["braids", "box", "twists", "locs"],
  NAILS: ["bun", "glam"],
  BARBERING: ["fade", "shape"],
  SPA_WELLNESS: ["bun", "silk"],
  MULTI_SERVICE: ["silk", "braids", "bob", "afro"],
};

/** The portrait for a business avatar, stable per business. */
export function lookForBusiness(id: string, category: BusinessCategory | null | undefined): LookName {
  const looks = LOOKS_BY_CATEGORY[category ?? "MULTI_SERVICE"];
  return looks[hashString(id) % looks.length]!;
}

/** The portrait for a service, guessed from its name. */
export function lookForService(name: string): LookName {
  const text = name.toLowerCase();
  if (/fade|barber|beard|line|kids cut|shape-up|design/.test(text)) return /shape|afro/.test(text) ? "shape" : "fade";
  if (/loc/.test(text)) return "locs";
  if (/twist/.test(text)) return "twists";
  if (/box/.test(text)) return "box";
  if (/braid|cornrow/.test(text)) return "braids";
  if (/silk|press|blow|colour|color|cut/.test(text)) return "silk";
  if (/wig|frontal|weave/.test(text)) return "bob";
  if (/makeup|glam|lash|brow/.test(text)) return "glam";
  return "bun";
}
