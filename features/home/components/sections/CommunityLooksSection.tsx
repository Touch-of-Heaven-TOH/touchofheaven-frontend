import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { communityIntro, communityLooks } from "@/features/home/config/home-content";
import { SectionHeading } from "@/features/home/components/sections/SectionHeading";

export function CommunityLooksSection() {
  return (
    <section className="bg-[var(--color-page)] py-10 md:py-16">
      <div className="page-container">
        <SectionHeading intro={communityIntro} />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr_0.85fr]">
          {communityLooks.map((look, index) => (
            <article
              className={`group relative overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)] ${
                index === 0
                  ? "min-h-[360px] md:min-h-[440px] md:row-span-2"
                  : "min-h-[245px] md:min-h-[260px]"
              }`}
              key={look.title}
            >
              <Image
                alt={look.image.alt}
                className="object-cover transition duration-500 group-hover:scale-[1.04]"
                fill
                sizes={index === 0 ? "(max-width: 1024px) 100vw, 430px" : "(max-width: 1024px) 50vw, 300px"}
                src={look.image.src}
                style={{ objectPosition: look.image.focalPoint }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-brand-strong)]/90 via-[var(--color-brand-strong)]/26 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase text-[var(--color-gold-light)] backdrop-blur">
                  Community look
                </p>
                <h3 className="mt-2 font-serif text-2xl font-semibold">
                  {look.title}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/78">
                  {look.description}
                </p>
                <Link
                  aria-label={`View ${look.title} style direction`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white"
                  href={look.href}
                >
                  View style direction
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
