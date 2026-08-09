import { heroMediaItems } from "@/features/home/config/hero-media";
import { HeroContent } from "@/features/home/components/hero/HeroContent";
import { HeroMediaCarousel } from "@/features/home/components/hero/HeroMediaCarousel";
import { trustFeatures } from "@/features/home/config/home-content";
import { FeatureIcon } from "@/features/home/components/sections/FeatureIcon";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-page)]">
      <HeroMediaCarousel items={heroMediaItems} />
      <div className="page-container relative grid min-h-[620px] items-center md:grid-cols-[0.92fr_1.08fr]">
        <HeroContent />
        <div aria-hidden="true" className="min-h-[320px] md:min-h-[560px]" />
      </div>
      <div className="relative z-10 border-t border-[var(--color-border)] bg-white/86 backdrop-blur">
        <div className="page-container grid grid-cols-2 gap-3 py-4 md:grid-cols-4">
          {trustFeatures.map((feature) => (
            <div className="flex items-center gap-3" key={feature.title}>
              <FeatureIcon icon={feature.icon} />
              <div>
                <p className="text-sm font-bold text-[var(--color-brand-strong)]">
                  {feature.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {feature.description.split(".")[0]}.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
