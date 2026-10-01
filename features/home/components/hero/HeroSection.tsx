import { heroMediaItems } from "@/features/home/config/hero-media";
import { HeroContent } from "@/features/home/components/hero/HeroContent";
import { HeroMediaCarousel } from "@/features/home/components/hero/HeroMediaCarousel";
import { PlatformSearch } from "@/components/search/PlatformSearch";

export function HeroSection() {
  // No overflow-hidden or isolate on the section: the calendar popover hangs
  // below the search bar and both of those cut it off. HeroMediaCarousel does
  // its own clipping and every layer inside it is inset-0, so the section
  // never needed to clip anything itself.
  return (
    <section className="relative border-b border-[var(--color-border)] bg-[var(--color-page)]">
      <HeroMediaCarousel items={heroMediaItems} />
      <div className="page-container relative grid min-h-[455px] items-center md:min-h-[500px] md:grid-cols-[1.12fr_0.88fr] lg:min-h-[535px]">
        <HeroContent />
        <div aria-hidden="true" className="min-h-[210px] md:min-h-[440px]" />
        {/* The bar spans both columns so it can be wider than the headline
            column that used to hold it. 95.2% of the container is 1.7x that
            column, which was 1.12fr of 2fr - so the ratio holds at every
            width rather than only where a pixel value happens to land. */}
        <div className="relative z-10 pb-9 md:col-span-2 md:max-w-[95.2%] md:pb-12 lg:pb-14">
          <PlatformSearch showRecent />
        </div>
      </div>
    </section>
  );
}
