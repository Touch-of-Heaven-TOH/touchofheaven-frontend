"use client";

import { useEffect, useRef } from "react";
import type { HeroMediaItem } from "@/features/home/types/home.types";

type HeroVideoSlideProps = {
  item: HeroMediaItem;
  isActive: boolean;
  isReducedMotion: boolean;
  onEnded: () => void;
};

export function HeroVideoSlide({
  item,
  isActive,
  isReducedMotion,
  onEnded,
}: HeroVideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive || isReducedMotion || !item.autoplay) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    video.muted = true;
    void video.play().catch(() => {
      video.pause();
      onEnded();
    });
  }, [isActive, isReducedMotion, item.autoplay, onEnded]);

  return (
    <video
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full object-cover brightness-[1.05] contrast-[1.08] saturate-[1.08] transition-opacity duration-700 ${
        isActive && !isReducedMotion ? "opacity-100" : "opacity-0"
      }`}
      loop={item.loop}
      muted
      onEnded={onEnded}
      onError={onEnded}
      playsInline
      poster={item.poster}
      preload={item.priority ? "auto" : "metadata"}
      ref={videoRef}
      src={item.source}
      style={{ objectPosition: item.focalPoint }}
    />
  );
}
