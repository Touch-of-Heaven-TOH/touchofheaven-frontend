"use client";

import type { CSSProperties } from "react";

const phrases = ["Your Beauty", "Your Culture", "All in One Place"] as const;

export function AnimatedHeroHeadline() {
  return (
    <h1 className="mt-4 max-w-[650px] font-serif text-5xl font-semibold leading-[0.94] text-[var(--color-brand-strong)] md:text-6xl lg:text-7xl">
      <span className="sr-only">Your Beauty. Your Culture. All in One Place.</span>
      <span aria-hidden="true" className="hero-wave-headline">
        {phrases.map((phrase, phraseIndex) => (
          <span
            className="hero-wave-phrase"
            key={phrase}
            style={{ "--phrase-index": phraseIndex } as CSSProperties}
          >
            {phrase.split("").map((letter, letterIndex) => (
              <span
                className="hero-wave-letter"
                key={`${phrase}-${letterIndex}`}
                style={{ "--letter-index": letterIndex } as CSSProperties}
              >
                {letter === " " ? "\u00a0" : letter}
              </span>
            ))}
          </span>
        ))}
      </span>
    </h1>
  );
}
