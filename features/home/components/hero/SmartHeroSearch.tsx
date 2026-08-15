"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  LocateFixed,
  MapPin,
  Scissors,
  Search,
  UserRound,
  X,
} from "lucide-react";

type SearchSegment = "what" | "where" | "when";

const styleSuggestions = [
  "Knotless Braids",
  "Boho Braids",
  "Goddess Braids",
  "Cornrows",
  "Loc Maintenance",
  "Box Braids",
] as const;

const braiderSuggestions = [
  "Touched by Tee",
  "Hair by Milly",
  "Royalty Hair Co.",
  "Braids by Nia",
] as const;

const serviceSuggestions = [
  "Protective styles",
  "Natural hair prep",
  "Kids braids",
  "Aftercare bundle",
] as const;

const locationSuggestions = [
  "Kathleen, GA",
  "Macon, GA",
  "Warner Robins, GA",
  "Atlanta, GA",
] as const;

const dateOptions = [
  "Any date",
  "Today",
  "This week",
  "This weekend",
  "Next week",
] as const;

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

function SuggestionButton({
  children,
  icon,
  onClick,
}: {
  children: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-[var(--color-brand-strong)] transition hover:bg-[var(--color-brand-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
      type="button"
      onClick={onClick}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-page)] text-[var(--color-brand)]">
        {icon}
      </span>
      {children}
    </button>
  );
}

export function SmartHeroSearch() {
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState<SearchSegment | null>(null);
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecentSearches);

  const activeLabel = useMemo(() => {
    if (activeSegment === "what") return "Choose a service, style, or braider";
    if (activeSegment === "where") return "Choose your city or area";
    if (activeSegment === "when") return "Choose appointment timing";
    return "";
  }, [activeSegment]);

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
    const cleanWhere = sanitizeSearchValue(where);
    const cleanWhen = sanitizeSearchValue(when);

    if (cleanWhat) {
      params.set("q", cleanWhat);
      rememberSearch(cleanWhat);
    }
    if (cleanWhere) params.set("location", cleanWhere);
    if (cleanWhen) params.set("date", cleanWhen);

    router.push(`/braiders${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setWhere("Location unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setWhere("Current location"),
      () => setWhere("Kathleen, GA"),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 },
    );
  };

  return (
    <div className="relative mt-6 max-w-3xl">
      <form
        className="grid gap-2 rounded-md border border-[var(--color-border)] bg-white/95 p-2 shadow-[var(--shadow-soft)] backdrop-blur md:grid-cols-[1fr_1fr_0.8fr_auto] md:items-center md:gap-0"
        role="search"
        onSubmit={submitSearch}
      >
        <label className="grid gap-1 rounded-md px-3 py-2 transition focus-within:bg-[var(--color-page)] md:border-r md:border-[var(--color-border)]">
          <span className="text-[11px] font-bold uppercase text-[var(--color-brand)]">
            What
          </span>
          <input
            aria-label="Search for a braider, style, or service"
            className="min-h-9 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-text-muted)]"
            placeholder="Braider, style, or service..."
            type="search"
            value={what}
            onChange={(event) => setWhat(event.target.value)}
            onFocus={() => setActiveSegment("what")}
          />
        </label>

        <label className="grid gap-1 rounded-md px-3 py-2 transition focus-within:bg-[var(--color-page)] md:border-r md:border-[var(--color-border)]">
          <span className="text-[11px] font-bold uppercase text-[var(--color-brand)]">
            Where
          </span>
          <input
            aria-label="Search by city or location"
            className="min-h-9 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-text-muted)]"
            placeholder="Kathleen, GA or your city..."
            type="search"
            value={where}
            onChange={(event) => setWhere(event.target.value)}
            onFocus={() => setActiveSegment("where")}
          />
        </label>

        <label className="grid gap-1 rounded-md px-3 py-2 transition focus-within:bg-[var(--color-page)]">
          <span className="text-[11px] font-bold uppercase text-[var(--color-brand)]">
            When
          </span>
          <input
            aria-label="Search by appointment date"
            className="min-h-9 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--color-text-muted)]"
            placeholder="Any date..."
            type="search"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            onFocus={() => setActiveSegment("when")}
          />
        </label>

        <button
          aria-label="Search Touch of Heaven"
          className="grid min-h-12 place-items-center rounded-md bg-[var(--color-brand)] px-5 text-white transition hover:bg-[var(--color-brand-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)]"
          type="submit"
        >
          <Search aria-hidden="true" size={20} />
        </button>
      </form>

      {activeSegment ? (
        <div
          aria-label={activeLabel}
          className="fixed inset-x-3 bottom-3 z-[var(--z-modal)] max-h-[82dvh] overflow-y-auto rounded-md border border-[var(--color-border)] bg-white p-4 shadow-[0_28px_80px_rgba(45,27,78,0.28)] md:absolute md:inset-x-0 md:bottom-auto md:top-[calc(100%+0.75rem)] md:max-h-none"
          role="dialog"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-[var(--color-brand-strong)]">
              {activeLabel}
            </h2>
            <button
              aria-label="Close search options"
              className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-brand)]"
              type="button"
              onClick={() => setActiveSegment(null)}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>

          {activeSegment === "what" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-[var(--color-brand)]">
                  Trending styles
                </p>
                {styleSuggestions.map((item) => (
                  <SuggestionButton
                    icon={<Scissors aria-hidden="true" size={15} />}
                    key={item}
                    onClick={() => {
                      setWhat(item);
                      setActiveSegment("where");
                    }}
                  >
                    {item}
                  </SuggestionButton>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-[var(--color-brand)]">
                  Braiders
                </p>
                {braiderSuggestions.map((item) => (
                  <SuggestionButton
                    icon={<UserRound aria-hidden="true" size={15} />}
                    key={item}
                    onClick={() => {
                      setWhat(item);
                      setActiveSegment("where");
                    }}
                  >
                    {item}
                  </SuggestionButton>
                ))}
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-[var(--color-brand)]">
                  Services
                </p>
                {recentSearches.length > 0 ? (
                  <div className="mb-3">
                    {recentSearches.map((item) => (
                      <SuggestionButton
                        icon={<Clock3 aria-hidden="true" size={15} />}
                        key={item}
                        onClick={() => setWhat(item)}
                      >
                        {item}
                      </SuggestionButton>
                    ))}
                  </div>
                ) : null}
                {serviceSuggestions.map((item) => (
                  <SuggestionButton
                    icon={<Search aria-hidden="true" size={15} />}
                    key={item}
                    onClick={() => {
                      setWhat(item);
                      setActiveSegment("where");
                    }}
                  >
                    {item}
                  </SuggestionButton>
                ))}
              </div>
            </div>
          ) : null}

          {activeSegment === "where" ? (
            <div className="grid gap-2">
              <SuggestionButton
                icon={<LocateFixed aria-hidden="true" size={15} />}
                onClick={useCurrentLocation}
              >
                Use my current location
              </SuggestionButton>
              {locationSuggestions.map((item) => (
                <SuggestionButton
                  icon={<MapPin aria-hidden="true" size={15} />}
                  key={item}
                  onClick={() => {
                    setWhere(item);
                    setActiveSegment("when");
                  }}
                >
                  {item}
                </SuggestionButton>
              ))}
            </div>
          ) : null}

          {activeSegment === "when" ? (
            <div className="grid gap-2 md:grid-cols-5">
              {dateOptions.map((item) => (
                <SuggestionButton
                  icon={<CalendarDays aria-hidden="true" size={15} />}
                  key={item}
                  onClick={() => {
                    setWhen(item);
                    setActiveSegment(null);
                  }}
                >
                  {item}
                </SuggestionButton>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
