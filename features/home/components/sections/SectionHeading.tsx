import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeSectionIntro } from "@/features/home/types/home.types";

type SectionHeadingProps = {
  intro: HomeSectionIntro;
  align?: "start" | "center";
};

export function SectionHeading({ intro, align = "start" }: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${
        align === "center" ? "text-center md:text-left" : ""
      }`}
    >
      <div>
        {intro.eyebrow ? (
          <p className="text-sm font-bold uppercase text-[var(--color-copper)]">
            {intro.eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-brand-strong)] md:text-4xl">
          {intro.title}
        </h2>
        {intro.description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
            {intro.description}
          </p>
        ) : null}
      </div>
      {intro.action ? (
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)] hover:text-[var(--color-brand-strong)]"
          href={intro.action.href}
        >
          {intro.action.label}
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      ) : null}
    </div>
  );
}
