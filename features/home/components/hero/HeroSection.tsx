import { heroMediaItems } from "@/features/home/config/hero-media";
import { HeroContent } from "@/features/home/components/hero/HeroContent";
import { HeroMediaCarousel } from "@/features/home/components/hero/HeroMediaCarousel";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-page)]">
      <HeroMediaCarousel items={heroMediaItems} />
      <div className="page-container relative grid min-h-[455px] items-center md:min-h-[500px] md:grid-cols-[1.12fr_0.88fr] lg:min-h-[535px]">
        <HeroContent />
        <div aria-hidden="true" className="min-h-[210px] md:min-h-[440px]" />
      </div>
    </section>
  );
}
