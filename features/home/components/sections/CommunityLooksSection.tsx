import { communityIntro, communityLooks } from "@/features/home/config/home-content";
import { MediaCard } from "@/features/home/components/sections/MediaCard";
import { SectionHeading } from "@/features/home/components/sections/SectionHeading";

export function CommunityLooksSection() {
  return (
    <section className="bg-[var(--color-page)] py-10 md:py-14">
      <div className="page-container">
        <SectionHeading intro={communityIntro} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {communityLooks.map((look) => (
            <MediaCard card={look} key={look.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
