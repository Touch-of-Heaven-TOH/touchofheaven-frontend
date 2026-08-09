import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeImageCard } from "@/features/home/types/home.types";

type MediaCardProps = {
  card: HomeImageCard;
  ratio?: "portrait" | "landscape" | "square";
};

const ratioClass = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/10]",
  square: "aspect-square",
} as const;

export function MediaCard({ card, ratio = "portrait" }: MediaCardProps) {
  return (
    <article className="group overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-[var(--shadow-subtle)]">
      <Link className="block" href={card.href}>
        <div className={`relative ${ratioClass[ratio]} overflow-hidden bg-[var(--color-brand-soft)]`}>
          <Image
            alt={card.image.alt}
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            fill
            sizes="(max-width: 768px) 76vw, 280px"
            src={card.image.src}
            style={{ objectPosition: card.image.focalPoint }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-base font-bold text-[var(--color-brand-strong)]">
            {card.title}
          </h3>
          <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)]">
            {card.description}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--color-brand)]">
            Explore
            <ArrowRight aria-hidden="true" size={16} />
          </span>
        </div>
      </Link>
    </article>
  );
}
