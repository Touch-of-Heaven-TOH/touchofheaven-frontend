"use client";

import { useSyncExternalStore } from "react";

export type Lang = "en" | "fr";

const KEY = "toh-lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "fr") return saved;
    return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
  } catch {
    return "en";
  }
}

/** English or French, remembered on this device. Cameroon reads both. */
export function useLang() {
  const lang = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    read,
    () => "en" as Lang,
  );
  const setLang = (next: Lang) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    listeners.forEach((listener) => listener());
  };
  const t = (en: string, fr: string) => (lang === "fr" ? fr : en);
  return { lang, setLang, t };
}
