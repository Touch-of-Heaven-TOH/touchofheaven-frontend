"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { MarketplaceSlides } from "@/features/home/config/showcase-slide";

const CYCLE_MS = 3500;
const TRANSITION_MS = 500;
const CARDS = MarketplaceSlides;

// Replace with real photos per category


const marketplaceSignals = [
  " "
] as const;

// Stack position for each depth: 0 = front, 1 = next, 2 = back
const STACK_STYLES = [
  { x: 0, y: 0, rotate: 0, scale: 1, z: 30, opacity: 1 },
  { x: 18, y: 16, rotate: -4, scale: 0.95, z: 20, opacity: 0.9 },
  { x: 34, y: 30, rotate: -8, scale: 0.9, z: 10, opacity: 0.7 },
];

export function MarketplaceShowcaseSection() {
  const [order, setOrder] = useState(CARDS.map((_, i) => i));

  useEffect(() => {
    const cycle = setInterval(() => {
      setOrder((current) => {
        const [front, ...rest] = current;
        return [...rest, front];
      });
    }, CYCLE_MS);
    return () => clearInterval(cycle);
  }, []);

  return (
    <section className="overflow-x-clip bg-white py-10 md:py-14">
      <div className="page-container">
        <div className="relative grid items-center gap-10  rounded-md bg-[var(--color-brand-strong)] pb-6 pt-4 shadow-[var(--shadow-media)] md:grid-cols-2 md:pb-10 md:pt-6 lg:pb-12 lg:pt-8 px-6 md:px-10 lg:px-12">
          {/* Left: informational text */}
          <div className="grid gap-4">
            <h2 className="font-serif text-3xl font-semibold leading-tight text-white md:text-4xl">
              All in one place.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-white/75 md:text-base">
              Whether you&apos;re a customer restocking hair products or a business
              
            </p>
            <ul className="mt-2 grid gap-2">
              {marketplaceSignals.map((signal) => (
                <li
                  key={signal}
                  className="flex it ems-center gap-2 text-sm font-semibold text-white/85"
                >
                  {signal}
                </li>
              ))}
            </ul>
            <Link
              href="/marketplace"
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-brand-soft)] px-5 py-2.5 text-sm font-bold text-[var(--color-brand-strong)] transition hover:opacity-90"
            >
              Explore marketplace
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>

          {/* Right: stacked card deck */}
          <div className="relative -mt-16 flex min-w-0 justify-center md:-mt-20">
            {/* background accent shapes, behind the deck */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-0 h-[280px] w-full max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-[var(--color-brand-soft)]/30 blur-2xl"
            />

            <div className="relative h-[480px] w-full max-w-[380px]">
              {order.map((cardIndex, depth) => {
                const card = CARDS[cardIndex];
                const pos = STACK_STYLES[depth] ?? STACK_STYLES[STACK_STYLES.length - 1];

                return (
                  <div
                    key={card.id}
                    className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.35)] transition-all ease-out"
                    style={{
                      transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotate}deg) scale(${pos.scale})`,
                      zIndex: pos.z,
                      opacity: pos.opacity,
                      transitionDuration: `${TRANSITION_MS}ms`,
                    }}
                  >
                    <Image
                      src={card.image}
                      alt={card.alt}
                      fill
                      sizes="280px"
                      className="object-cover"
                    />
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      {card.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
