import { heroMediaItems } from "@/features/home/config/hero-media";
import { HeroContent } from "@/features/home/components/hero/HeroContent";
import { HeroMediaCarousel } from "@/features/home/components/hero/HeroMediaCarousel";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-page)]">
      <HeroMediaCarousel items={heroMediaItems} />
      <div className="page-container relative grid min-h-[500px] items-center md:min-h-[540px] md:grid-cols-[0.9fr_1.1fr] lg:min-h-[570px]">
        <HeroContent />
        <div aria-hidden="true" className="min-h-[240px] md:min-h-[480px]" />
      </div>
    </section>
  );
}
