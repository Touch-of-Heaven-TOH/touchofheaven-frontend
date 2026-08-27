import { AnimatedHeroHeadline } from "@/features/home/components/hero/AnimatedHeroHeadline";
import { SmartHeroSearch } from "@/features/home/components/hero/SmartHeroSearch";

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-4xl py-9 md:py-12 lg:py-14">
      <AnimatedHeroHeadline />

      <SmartHeroSearch />
    </div>
  );
}
