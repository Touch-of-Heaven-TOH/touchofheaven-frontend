"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { showcaseSlides } from "@/features/home/config/showcase-slide";

const HOLD_MS = 5000;
const FADE_MS = 1200;
const SLIDES = showcaseSlides;

export function BookingProductsInfoSection() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout>;

    const cycle = setInterval(() => {
      setFading(true);
      fadeTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % SLIDES.length);
        setFading(false);
      }, FADE_MS);
    }, HOLD_MS);

    return () => {
      clearInterval(cycle);
      clearTimeout(fadeTimeout);
    };
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="page-container">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="flex justify-center">
            <div className="relative w-full max-w-xs">
              {/* left accent panel, tucked behind the image's left edge */}
              <div
                aria-hidden="true"
                className="absolute left-1 top-1/2 z-0 h-[320px] w-14 -translate-y-1/2 rounded-[2rem] bg-[var(--color-brand-soft)] md:h-[500px] md:w-50"
              />
              {/* right accent panel, tucked behind the image's right edge */}
              <div
                aria-hidden="true"
                className="absolute right-[-20] top-1/2 z-0 h-[420px] w-30 -translate-y-1/2 rounded-[2rem] bg-gradient-to-b from-[var(--color-copper)] to-white md:h-[500px] md:w-30"
              />

              {/* image sits above both panels */}
              <div
                className="relative z-10 w-full transition-opacity"
                style={{
                  aspectRatio: "10 / 20",
                  opacity: fading ? 0 : 1,
                  transitionDuration: `${FADE_MS}ms`,
                  maskImage:
                    "radial-gradient(ellipse closest-side at center, black 40%, transparent 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse closest-side at center, black 40%, transparent 100%)",
                }}
              >  
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1068px) 890px, 220vw"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div
              className="grid gap-4 transition-opacity"
              style={{
                opacity: fading ? 0 : 1,
                transitionDuration: `${FADE_MS}ms`,
              }}
            >
              <h2 className="font-serif text-3xl font-semibold leading-tight text-[var(--color-brand-strong)] md:text-4xl">
                {slide.heading}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
                {slide.description}
              </p>
            </div>
            <Link href="/sign-up" className="btn-primary w-fit">
              Try for Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
