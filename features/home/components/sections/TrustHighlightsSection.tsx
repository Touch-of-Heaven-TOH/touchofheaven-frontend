import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homePrimaryActions, trustFeatures } from "@/features/home/config/home-content";
import { FeatureIcon } from "@/features/home/components/sections/FeatureIcon";

export function TrustHighlightsSection() {
  return (
    <section className="bg-[var(--color-brand-strong)] text-white">
      <div className="page-container grid gap-5 py-6 md:grid-cols-[240px_1fr_auto] md:items-center">
        <h2 className="font-serif text-2xl font-semibold">
          Why choose Touch of Heaven?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustFeatures.map((feature) => (
            <div className="flex items-start gap-3" key={feature.title}>
              <FeatureIcon icon={feature.icon} tone="dark" />
              <div>
                <h3 className="text-sm font-bold">{feature.title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/68">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link className="btn-secondary whitespace-nowrap" href={homePrimaryActions.book.href}>
          Book Your Appointment
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </div>
    </section>
  );
}
