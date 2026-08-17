"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch, Scissors, Search, Store, UserRound } from "lucide-react";

type SearchOption = {
  label: string;
  hint: string;
  icon: ReactNode;
  route?: "braiders" | "marketplace";
};

const whatOptions: SearchOption[] = [
  {
    label: "Knotless Braids",
    hint: "Popular protective style",
    icon: <Scissors aria-hidden="true" size={17} />,
  },
  {
    label: "Boho Braids",
    hint: "Soft curls and movement",
    icon: <Scissors aria-hidden="true" size={17} />,
  },
  {
    label: "Cornrows",
    hint: "Clean parts and low maintenance",
    icon: <Scissors aria-hidden="true" size={17} />,
  },
  {
    label: "Touched by Tee",
    hint: "Verified braider profile",
    icon: <UserRound aria-hidden="true" size={17} />,
  },
  {
    label: "Chebe Hair Growth Oil",
    hint: "Marketplace product",
    icon: <PackageSearch aria-hidden="true" size={17} />,
    route: "marketplace",
  },
  {
    label: "Raw Shea Butter",
    hint: "Aftercare essential",
    icon: <Store aria-hidden="true" size={17} />,
    route: "marketplace",
  },
];

function sanitizeSearchValue(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

function readRecentSearches() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem("toh_recent_searches");
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed) ? parsed.slice(0, 4).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function OptionButton({
  children,
  hint,
  icon,
  onClick,
}: {
  children: string;
  hint: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition hover:bg-[var(--color-brand-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
      type="button"
      onClick={onClick}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-page)] text-[var(--color-brand)]">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-bold text-[var(--color-brand-strong)]">
          {children}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
          {hint}
        </span>
      </span>
    </button>
  );
}

const AUTO_HIDE_MS = 10000;

export function SmartHeroSearch() {
  const router = useRouter();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [what, setWhat] = useState("");
  const [searchRoute, setSearchRoute] = useState<"braiders" | "marketplace">("braiders");
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecentSearches);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHideTimer = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleHideTimer = () => {
    cancelHideTimer();
    hideTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, AUTO_HIDE_MS);
  };

  useEffect(() => cancelHideTimer, []);

  const rememberSearch = (value: string) => {
    const clean = sanitizeSearchValue(value);
    if (!clean) return;

    const next = [clean, ...recentSearches.filter((item) => item !== clean)].slice(0, 4);
    setRecentSearches(next);
    try {
      window.localStorage.setItem("toh_recent_searches", JSON.stringify(next));
    } catch {
      // Recent searches are a convenience only.
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const cleanWhat = sanitizeSearchValue(what);

    if (cleanWhat) {
      params.set(searchRoute === "marketplace" ? "q" : "style", cleanWhat);
      rememberSearch(cleanWhat);
    }

    setShowSuggestions(false);
    router.push(`/${searchRoute}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div
      className="relative mx-auto mt-6 w-full max-w-xl"
      onMouseEnter={cancelHideTimer}
      onMouseLeave={scheduleHideTimer}
    >
      <form
        className="flex min-h-14 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/96 p-2 pl-4 shadow-[0_20px_70px_rgba(45,27,78,0.18)] backdrop-blur"
        role="search"
        onSubmit={submitSearch}
      >
        <Search aria-hidden="true" className="shrink-0 text-[var(--color-brand)]" size={18} />
        <input
          aria-label="Search Touch of Heaven"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--color-brand-strong)] outline-none placeholder:font-normal placeholder:text-[var(--color-text-muted)]"
          placeholder="Hair style, braider, or product..."
          type="search"
          value={what}
          onChange={(event) => {
            setWhat(event.target.value);
            setSearchRoute("braiders");
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        <button
          aria-label="Search Touch of Heaven"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-white transition hover:bg-[var(--color-brand-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
          type="submit"
        >
          <Search aria-hidden="true" size={17} />
        </button>
      </form>

      {showSuggestions ? (
        <div
          aria-label="What are you looking for?"
          className="fixed inset-x-3 bottom-3 z-[var(--z-overlay)] max-h-[82dvh] overflow-y-auto rounded-md border border-[var(--color-border)] bg-white p-4 shadow-[0_28px_80px_rgba(45,27,78,0.28)] md:absolute md:inset-x-0 md:bottom-auto md:top-[calc(100%+0.75rem)] md:max-h-none md:p-5"
          role="dialog"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--color-copper)]">
                Search Touch of Heaven
              </p>
            </div>
            <button
              aria-label="Close search suggestions"
              className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-brand)]"
              type="button"
              onClick={() => setShowSuggestions(false)}
            >
              ×
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {whatOptions.map((item) => (
              <OptionButton
                hint={item.hint}
                icon={item.icon}
                key={item.label}
                onClick={() => {
                  setWhat(item.label);
                  setSearchRoute(item.route ?? "braiders");
                  setShowSuggestions(false);
                }}
              >
                {item.label}
              </OptionButton>
            ))}
            {recentSearches.length > 0 ? (
              <div className="rounded-md bg-[var(--color-page)] p-3 md:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase text-[var(--color-brand)]">
                  Recent searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <button
                      className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-brand-strong)]"
                      key={item}
                      type="button"
                      onClick={() => setWhat(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
