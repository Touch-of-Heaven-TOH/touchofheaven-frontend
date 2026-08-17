import { Sparkles } from "lucide-react";
import { AnimatedHeroHeadline } from "@/features/home/components/hero/AnimatedHeroHeadline";
import { SmartHeroSearch } from "@/features/home/components/hero/SmartHeroSearch";

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-4xl py-9 md:py-12 lg:py-14">
      <p className="inline-flex items-center gap-2 text-sm font-bold uppercase text-[var(--color-copper)]">
      </p>
      <AnimatedHeroHeadline />

      <SmartHeroSearch />
    </div>
  );
}
