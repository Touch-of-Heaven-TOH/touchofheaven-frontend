"use client";

import type { CSSProperties } from "react";

const phrases = ["Your Beauty", "Your Culture", "All in One Place"] as const;

export function AnimatedHeroHeadline() {
  return (
    <h1 className="mt-4 max-w-[650px] font-serif text-[clamp(2.85rem,12vw,4.25rem)] font-semibold leading-[0.94] text-[var(--color-brand-strong)] md:text-[clamp(3.25rem,7.4vw,4.85rem)] lg:text-7xl">
      <span className="sr-only">Your Beauty. Your Culture. All in One Place.</span>
      <span aria-hidden="true" className="hero-wave-headline">
        {phrases.map((phrase, phraseIndex) => {
          const words = phrase.split(" ");

          return (
            <span
              className="hero-wave-phrase"
              key={phrase}
              style={{ "--phrase-index": phraseIndex } as CSSProperties}
            >
              {words.map((word, wordIndex) => {
                const letterOffset =
                  words.slice(0, wordIndex).join("").length + wordIndex;

                return (
                  <span
                    className="hero-wave-word"
                    key={`${phrase}-${word}-${wordIndex}`}
                  >
                    {word.split("").map((letter, letterIndex) => (
                      <span
                        className="hero-wave-letter"
                        key={`${phrase}-${wordIndex}-${letterIndex}`}
                        style={
                          {
                            "--letter-index": letterOffset + letterIndex,
                          } as CSSProperties
                        }
                      >
                        {letter}
                      </span>
                    ))}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </h1>
  );
}
