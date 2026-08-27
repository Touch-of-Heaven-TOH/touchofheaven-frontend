"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { brandAssets, siteConfig } from "@/config/site";
import { homeMediaAssets } from "@/features/home/config/hero-media";

export type BusinessAuthHighlight = {
  icon: ReactNode;
  title: string;
  description?: string;
};

export type BusinessAuthShellProps = {
  headline: string;
  highlights: BusinessAuthHighlight[];
  children: ReactNode;
};

// The design calls for a video background instead of the pictured still
// photo. This is the only braiding-relevant video already stored in the
// project (its source filename is unrelated - a stock download mislabeled
// upstream - but the actual footage is a braided-hair close-up, confirmed
// by inspecting a frame, so it's the right fit here).
const REGISTRATION_VIDEO_SRC =
  "/images/home/videos/From Klickpin.com- Beginner-friendly family dinner ideas for your next inspiration board with thoughtful touches that make everything feel complet.mp4";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useReducedMotionPreference() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function BackgroundVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotionPreference();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
    } else {
      // Autoplay can be blocked until this fires even with the autoPlay
      // attribute set; muted playback is allowed everywhere that matters
      // here, so this call is expected to resolve.
      void video.play().catch(() => undefined);
    }
  }, [prefersReducedMotion]);

  return (
    <div className={`absolute inset-0 -z-20 overflow-hidden ${className ?? ""}`}>
      {prefersReducedMotion ? (
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src={homeMediaAssets.braidingDetail.src}
        />
      ) : (
        <video
          aria-hidden="true"
          autoPlay
          className="size-full object-cover"
          loop
          muted
          playsInline
          poster={homeMediaAssets.braidingDetail.src}
          ref={videoRef}
        >
          <source src={REGISTRATION_VIDEO_SRC} type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(58,23,45,0.94)_0%,rgba(58,23,45,0.88)_55%,rgba(29,10,23,0.95)_100%)]" />
    </div>
  );
}

function BrandMark({ variant }: { variant: "desktop" | "mobile" }) {
  const isDesktop = variant === "desktop";

  return (
    <Link
      aria-label={`${siteConfig.name} home`}
      className={
        isDesktop
          ? "flex items-center gap-3"
          : "flex items-center justify-center gap-2.5"
      }
      href="/"
    >
      <span
        className={`relative block shrink-0 ${isDesktop ? "size-12" : "size-9"}`}
      >
        <Image
          alt=""
          className="object-contain"
          fill
          priority
          sizes="48px"
          src={brandAssets.logoMark}
        />
      </span>
      <span
        className={`font-serif tracking-[0.14em] text-[var(--color-gold-light)] ${
          isDesktop ? "text-2xl" : "text-lg"
        }`}
      >
        {siteConfig.shortName}
      </span>
    </Link>
  );
}

export function BusinessAuthShell({
  headline,
  highlights,
  children,
}: BusinessAuthShellProps) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:grid-rows-1">
      <section className="relative isolate flex flex-col overflow-hidden px-6 py-8 text-white sm:px-10 lg:min-h-dvh lg:px-14 lg:py-12">
        <BackgroundVideo />

        <div className="lg:hidden">
          <BrandMark variant="mobile" />
        </div>
        <div className="hidden lg:block">
          <BrandMark variant="desktop" />
        </div>

        <div className="mt-6 hidden lg:mt-auto lg:block">
          <h2 className="max-w-md font-serif text-4xl font-semibold leading-tight text-white">
            {headline}
          </h2>
          <div className="mt-4 h-px w-24 bg-[var(--color-gold)]" />
          <ul className="mt-6 grid gap-4">
            {highlights.map((highlight) => (
              <li className="flex items-start gap-3" key={highlight.title}>
                <span className="mt-0.5 text-[var(--color-gold)]">
                  {highlight.icon}
                </span>
                <span>
                  <span className="block text-base font-semibold text-white">
                    {highlight.title}
                  </span>
                  {highlight.description ? (
                    <span className="block text-sm leading-6 text-white/72">
                      {highlight.description}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-start justify-center bg-[var(--color-page)] px-4 py-8 sm:px-8 sm:py-10 lg:items-center lg:px-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
