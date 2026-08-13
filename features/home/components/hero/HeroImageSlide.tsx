import Image from "next/image";
import type { HeroMediaItem } from "@/features/home/types/home.types";

type HeroImageSlideProps = {
  item: HeroMediaItem;
  isActive: boolean;
};

export function HeroImageSlide({ item, isActive }: HeroImageSlideProps) {
  return (
    <Image
      alt={item.alternativeText}
      className={`object-cover contrast-[1.04] saturate-[1.08] transition-opacity duration-700 ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
      fill
      priority={item.priority}
      sizes="(max-width: 768px) 100vw, 70vw"
      src={item.mobileSource ?? item.source}
      style={{ objectPosition: item.focalPoint }}
    />
  );
}
