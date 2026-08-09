import {
  Headphones,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { HomeFeature } from "@/features/home/types/home.types";

type FeatureIconProps = {
  icon: HomeFeature["icon"];
  tone?: "light" | "dark";
};

const iconByName = {
  verified: ShieldCheck,
  lock: LockKeyhole,
  sparkles: Sparkles,
  delivery: Truck,
  map: MapPinned,
  support: Headphones,
} satisfies Record<HomeFeature["icon"], LucideIcon>;

export function FeatureIcon({ icon, tone = "light" }: FeatureIconProps) {
  const Icon = iconByName[icon];
  const className =
    tone === "dark"
      ? "bg-white/10 text-[var(--color-gold-light)]"
      : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]";

  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-md ${className}`}>
      <Icon aria-hidden="true" size={21} strokeWidth={1.9} />
    </span>
  );
}
