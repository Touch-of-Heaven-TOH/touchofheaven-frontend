"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";

// TODO: replace with your real filenames
const LEFT_IMAGES = [
  "/images/home/mobile_view/leftside/fam1.png",
  "/images/home/mobile_view/leftside/fam2.png",
  "/images/home/mobile_view/leftside/fam3.png",
];

const RIGHT_IMAGES = [
  "/images/home/mobile_view/RightSide/book.png",
  "/images/home/mobile_view/RightSide/cale.png",
  
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

function SlideColumn({
  images,
  direction,
  alt,
}: {
  images: string[];
  direction: "up" | "down";
  alt: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const track = [...images, ...images]; // duplicated for seamless loop

  return (
    <div ref={ref} className="relative h-[420px] overflow-hidden md:h-[520px]">
      <div
        className={direction === "up" ? "flex flex-col gap-5 animate-slide-up" : "flex flex-col gap-5 animate-slide-down"}
        style={{ animationPlayState: inView ? "running" : "paused" }}
      >
        {track.map((src, i) => (
          <div key={`${src}-${i}`} className="relative mx-auto w-full max-w-[320px]">
            <Image
              src={src}
              alt={alt}
              width={600}
              height={1200}
              className="h-auto w-full object-contain drop-shadow-xl"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MobileAppSection() {
  return (
    <section className="bg-white py-8 md:py-12">
      <div className="page-container overflow-hidden rounded-xl border border-[var(--color-border)] bg-[linear-gradient(110deg,#fffaf5_0%,#ffffff_44%,#fff6ea_100%)] shadow-[var(--shadow-media)]">
        <div className="grid grid-cols-2 gap-5 p-5 md:gap-8 md:p-8 lg:p-10">
          <SlideColumn images={LEFT_IMAGES} direction="up" alt="Touch of Heaven mobile app preview" />
          <SlideColumn images={RIGHT_IMAGES} direction="down" alt="Touch of Heaven mobile app preview" />
        </div>
      </div>
      <p className="sr-only">{siteConfig.domain}</p>
    </section>
  );
}