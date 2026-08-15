"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  LocateFixed,
  MapPin,
  PackageSearch,
  Scissors,
  Search,
  Store,
  UserRound,
  X,
} from "lucide-react";

type SearchSegment = "what" | "where" | "when";

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

const locationOptions = [
  { label: "Atlanta, GA", hint: "Popular city" },
  { label: "Kathleen, GA", hint: "Near Touch of Heaven" },
  { label: "Warner Robins, GA", hint: "Available braiders nearby" },
  { label: "Macon, GA", hint: "Same-week openings" },
];

const dateOptions = [
  { label: "Any date", hint: "Show all availability" },
  { label: "Today", hint: "Open appointments today" },
  { label: "Tomorrow", hint: "Next-day openings" },
  { label: "This weekend", hint: "Friday through Sunday" },
  { label: "Next week", hint: "Plan ahead" },
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

function SearchField({
  active,
  icon,
  label,
  placeholder,
  value,
  onChange,
  onFocus,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
}) {
  return (
    <label
      className={`flex min-h-14 items-center gap-3 rounded-full px-4 transition md:rounded-none md:border-r md:border-[var(--color-border)] ${
        active ? "bg-[var(--color-brand-soft)]" : "bg-white"
      }`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-page)] text-[var(--color-brand)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase leading-none text-[var(--color-brand-strong)]">
          {label}
        </span>
        <input
          aria-label={`${label} search`}
          className="mt-1 min-h-6 w-full bg-transparent text-sm font-semibold text-[var(--color-brand-strong)] outline-none placeholder:text-[var(--color-text-muted)]"
          placeholder={placeholder}
          type={label === "When" ? "text" : "search"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
        />
      </span>
    </label>
  );
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

export function SmartHeroSearch() {
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState<SearchSegment | null>(null);
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("Atlanta, GA");
  const [when, setWhen] = useState("");
  const [searchRoute, setSearchRoute] = useState<"braiders" | "marketplace">("braiders");
  const [recentSearches, setRecentSearches] = useState<string[]>(readRecentSearches);

  const activeLabel = useMemo(() => {
    if (activeSegment === "what") return "What are you looking for?";
    if (activeSegment === "where") return "Where should we search?";
    if (activeSegment === "when") return "When do you want to book?";
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
      params.set(searchRoute === "marketplace" ? "q" : "style", cleanWhat);
      rememberSearch(cleanWhat);
    }
    if (cleanWhere) params.set("location", cleanWhere);
    if (cleanWhen) params.set("date", cleanWhen);

    router.push(`/${searchRoute}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setWhere("Location unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setWhere("Current location"),
      () => setWhere("Atlanta, GA"),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 },
    );
  };

  return (
    <div className="relative mt-6 w-full max-w-4xl">
      <form
        className="grid gap-2 rounded-[1.5rem] border border-[var(--color-border)] bg-white/96 p-2 shadow-[0_20px_70px_rgba(45,27,78,0.18)] backdrop-blur md:grid-cols-[1.25fr_1fr_0.9fr_auto] md:items-center md:gap-0 md:rounded-full"
        role="search"
        onSubmit={submitSearch}
      >
        <SearchField
          active={activeSegment === "what"}
          icon={<Search aria-hidden="true" size={17} />}
          label="What"
          placeholder="Hair style, service, product..."
          value={what}
          onChange={(value) => {
            setWhat(value);
            setSearchRoute("braiders");
          }}
          onFocus={() => setActiveSegment("what")}
        />
        <SearchField
          active={activeSegment === "where"}
          icon={<MapPin aria-hidden="true" size={17} />}
          label="Where"
          placeholder="Atlanta, GA"
          value={where}
          onChange={setWhere}
          onFocus={() => setActiveSegment("where")}
        />
        <SearchField
          active={activeSegment === "when"}
          icon={<CalendarDays aria-hidden="true" size={17} />}
          label="When"
          placeholder="Select date"
          value={when}
          onChange={setWhen}
          onFocus={() => setActiveSegment("when")}
        />

        <button
          aria-label="Search Touch of Heaven"
          className="grid min-h-14 place-items-center rounded-full bg-[var(--color-brand)] px-6 text-white transition hover:bg-[var(--color-brand-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] md:size-14 md:px-0"
          type="submit"
        >
          <Search aria-hidden="true" size={21} />
        </button>
      </form>

      {activeSegment ? (
        <div
          aria-label={activeLabel}
          className="fixed inset-x-3 bottom-3 z-[var(--z-modal)] max-h-[82dvh] overflow-y-auto rounded-md border border-[var(--color-border)] bg-white p-4 shadow-[0_28px_80px_rgba(45,27,78,0.28)] md:absolute md:inset-x-0 md:bottom-auto md:top-[calc(100%+0.75rem)] md:max-h-none md:p-5"
          role="dialog"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--color-copper)]">
                Search Touch of Heaven
              </p>
              <h2 className="font-serif text-xl font-semibold text-[var(--color-brand-strong)]">
                {activeLabel}
              </h2>
            </div>
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
            <div className="grid gap-3 md:grid-cols-2">
              {whatOptions.map((item) => (
                <OptionButton
                  hint={item.hint}
                  icon={item.icon}
                  key={item.label}
                  onClick={() => {
                    setWhat(item.label);
                    setSearchRoute(item.route ?? "braiders");
                    setActiveSegment(item.route === "marketplace" ? null : "where");
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
          ) : null}

          {activeSegment === "where" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <OptionButton
                hint="Use the browser location prompt"
                icon={<LocateFixed aria-hidden="true" size={17} />}
                onClick={useCurrentLocation}
              >
                Use my current location
              </OptionButton>
              {locationOptions.map((item) => (
                <OptionButton
                  hint={item.hint}
                  icon={<MapPin aria-hidden="true" size={17} />}
                  key={item.label}
                  onClick={() => {
                    setWhere(item.label);
                    setActiveSegment("when");
                  }}
                >
                  {item.label}
                </OptionButton>
              ))}
            </div>
          ) : null}

          {activeSegment === "when" ? (
            <div className="grid gap-3 md:grid-cols-5">
              {dateOptions.map((item) => (
                <OptionButton
                  hint={item.hint}
                  icon={<Clock3 aria-hidden="true" size={17} />}
                  key={item.label}
                  onClick={() => {
                    setWhen(item.label);
                    setActiveSegment(null);
                  }}
                >
                  {item.label}
                </OptionButton>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
