import Image from "next/image";
import Link from "next/link";
import type { HomeImageCard } from "@/features/home/types/home.types";

type MediaCardProps = {
  card: HomeImageCard;
  ratio?: "landscape" | "portrait" | "square";
};

const ratioClass: Record<NonNullable<MediaCardProps["ratio"]>, string> = {
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
};

export function MediaCard({ card, ratio = "landscape" }: MediaCardProps) {
  return (
    <Link
      className="block overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-page)] shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
      href={card.href}
    >
      <div
        className={`relative overflow-hidden bg-[var(--color-brand-soft)] ${ratioClass[ratio]}`}
      >
        <Image
          alt={card.image.alt}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 74vw, 280px"
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
      </div>
    </Link>
  );
}
