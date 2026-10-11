"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/app/Icon";
import { BusinessCover, Empty, Rating, businessKind, businessName } from "@/components/app/ui";
import { useCity } from "@/lib/app/city";
import { CITIES, useNearby, useServices } from "@/lib/app/data";
import { BUSINESS_FILTERS } from "@/lib/app/business-look";
import { formatDayTime, formatDistanceKm, formatDuration, formatFcfa } from "@/lib/app/format";
import type { AppNearbyBusiness } from "@/lib/app/types";
import type { MapFocusRequest } from "@/components/map/BusinessMap";

const Map = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => <div className="toh-skeleton" style={{ height: "100%", borderRadius: 0 }} />,
});

const TYPES = [
  { key: "", label: "Any place" },
  { key: "PUBLIC_SALON", label: "Salon" },
  { key: "PRIVATE_STUDIO", label: "Private studio" },
  { key: "MOBILE", label: "Comes to you" },
] as const;

type Sort = "rec" | "near" | "top";

function score(business: AppNearbyBusiness) {
  return (business.rating.average ?? 0) * Math.log(business.rating.count + 1);
}

export function BusinessSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [city, setCity] = useCity();
  const filterKey = params.get("filter") ?? "all";
  const categoryParam = params.get("category");
  const filter = BUSINESS_FILTERS.find((item) => item.key === filterKey) ?? BUSINESS_FILTERS[0]!;
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState<string>("");
  const [sort, setSort] = useState<Sort>("rec");
  const [selected, setSelected] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [focus, setFocus] = useState<MapFocusRequest | null>(() => ({ coordinates: { lat: city.lat, lng: city.lng }, zoom: 11.5 }));

  const { businesses, isLoading, error } = useNearby(city, {
    category: categoryParam ?? filter.category ?? null,
    businessCategory: filter.businessCategory ?? null,
    locationType: type || null,
  });

  const list = useMemo(() => {
    const words = query.trim().toLowerCase();
    const matched = businesses.filter((business) => {
      if (!words) return true;
      const haystack = [businessName(business), business.professionalName, business.bio ?? "", ...business.specialties]
        .join(" ")
        .toLowerCase();
      return haystack.includes(words);
    });
    const sorters: Record<Sort, (a: AppNearbyBusiness, b: AppNearbyBusiness) => number> = {
      rec: (a, b) => score(b) - score(a),
      near: (a, b) => a.distanceKm - b.distanceKm,
      top: (a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0),
    };
    return [...matched].sort(sorters[sort]);
  }, [businesses, query, sort]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "filter") next.delete("category");
    router.replace(`/businesses${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  const switchCity = (key: (typeof CITIES)[number]["key"]) => {
    const next = CITIES.find((item) => item.key === key)!;
    setCity(key);
    setFocus({ coordinates: { lat: next.lat, lng: next.lng }, zoom: 11.5 });
    setSelected(null);
  };

  const title = categoryParam
    ? categoryParam.replace(/-/g, " ")
    : filter.key === "all"
      ? "Venues"
      : filter.label;

  return (
    <div className="toh-bsearch-page">
      <header className="toh-bh">
        <form
          className="toh-bsearch"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setParam("q", query.trim() || null);
          }}
        >
          <label className="toh-bsearch__sg">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="All treatments and venues"
              aria-label="Treatment or venue"
            />
          </label>
          <label className="toh-bsearch__sg">
            <Icon name="pin" size={18} />
            <select value={city.key} onChange={(event) => switchCity(event.target.value as "douala" | "yaounde")} aria-label="City">
              {CITIES.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button className="toh-bsearch__go">Search</button>
        </form>
        <Link href="/business/sign-up?callbackUrl=%2Fprofessional-application" className="toh-btn toh-btn--line toh-btn--pill toh-btn--sm toh-only-desk">
          For business
        </Link>
      </header>

      <div className={`toh-bres${mapOpen ? " is-mapon" : ""}`}>
        <section className="toh-blist">
          <div className="toh-chips" style={{ marginBottom: 10 }}>
            {BUSINESS_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`toh-chip${filter.key === item.key && !categoryParam ? " is-on" : ""}`}
                onClick={() => setParam("filter", item.key === "all" ? null : item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="toh-bfil">
            <select className="toh-sel" value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label="Sort">
              <option value="rec">Recommended</option>
              <option value="near">Nearest</option>
              <option value="top">Top rated</option>
            </select>
            {TYPES.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`toh-chip toh-chip--sm${type === item.key ? " is-on" : ""}`}
                onClick={() => setType(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {categoryParam ? (
            <div className="toh-notice toh-notice--info" style={{ marginBottom: 12, alignItems: "center" }}>
              <Icon name="spark" size={18} />
              <span style={{ flex: 1 }}>
                Pros who do <b style={{ textTransform: "capitalize" }}>{title}</b>, sorted for you
              </span>
              <button type="button" className="toh-icon-btn" style={{ width: 30, height: 30 }} aria-label="Clear style filter" onClick={() => setParam("category", null)}>
                <Icon name="x" size={16} />
              </button>
            </div>
          ) : null}
          <div className="toh-bcount">
            <h1>
              {isLoading ? "Searching…" : `${list.length} ${list.length === 1 ? "venue" : "venues"}`}
              {title !== "Venues" ? <span style={{ textTransform: "capitalize" }}> · {title}</span> : null} in {city.label}
            </h1>
            <button type="button" className="toh-btn toh-btn--line toh-btn--sm toh-btn--pill toh-bmap-toggle" onClick={() => setMapOpen(true)}>
              <Icon name="map" size={16} /> Map
            </button>
          </div>

          {error ? (
            <div className="toh-notice toh-notice--error">We couldn&apos;t load businesses right now. Check your connection and try again.</div>
          ) : isLoading && !list.length ? (
            <div className="toh-vlist">
              {[0, 1, 2].map((key) => (
                <div key={key} className="toh-skeleton" style={{ height: 220 }} />
              ))}
            </div>
          ) : list.length ? (
            <div className="toh-vlist">
              {list.map((business) => (
                <VenueRow
                  key={business.id}
                  business={business}
                  highlighted={business.id === selected}
                  onHover={() => setSelected(business.id)}
                />
              ))}
            </div>
          ) : (
            <Empty icon="search" title="No venues match">
              <span>Try another treatment, remove a filter or switch city.</span>
              <button type="button" className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill" onClick={() => router.replace("/businesses")}>
                Clear filters
              </button>
            </Empty>
          )}
        </section>

        <section className="toh-bmap" aria-label="Map of results">
          <button type="button" className="toh-icon-btn toh-bmap__close" aria-label="Close map" onClick={() => setMapOpen(false)}>
            <Icon name="x" />
          </button>
          <Map
            braiders={list}
            selectedBraiderId={selected}
            onBraiderSelect={setSelected}
            focusRequest={focus}
            onPopupClose={() => setSelected(null)}
            renderPopup={(braider) => {
              const business = braider as AppNearbyBusiness;
              return (
                <Link href={`/businesses/${business.braiderId}`} className="toh toh-mapcard">
                  <BusinessCover id={business.braiderId} category={business.businessCategory} photoUrl={business.coverPhotoUrl} name={businessName(business)} className="toh-mapcard__art" />
                  <span className="toh-mapcard__t">
                    <b>{businessName(business)}</b>
                    <Rating average={business.rating.average} count={business.rating.count} size={12} />
                    <span className="toh-muted" style={{ fontSize: 12 }}>
                      {formatDistanceKm(business.distanceKm)} · {businessKind(business)}
                    </span>
                    <span className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill">View and book</span>
                  </span>
                </Link>
              );
            }}
          />
        </section>
      </div>
    </div>
  );
}

function VenueRow({
  business,
  highlighted,
  onHover,
}: {
  business: AppNearbyBusiness;
  highlighted: boolean;
  onHover: () => void;
}) {
  const { services } = useServices(business.braiderId);
  const name = businessName(business);
  const top = [...services].sort((a, b) => a.basePriceCents - b.basePriceCents).slice(0, 3);
  return (
    <article className={`toh-vrow${highlighted ? " is-hl" : ""}`} onMouseEnter={onHover}>
      <Link href={`/businesses/${business.braiderId}`} className="toh-vrow__top">
        <BusinessCover id={business.braiderId} category={business.businessCategory} photoUrl={business.coverPhotoUrl ?? business.photo?.url} name={name} className="toh-vrow__art" />
        <div style={{ minWidth: 0 }}>
          <h3>{name}</h3>
          <div className="toh-vrow__m">
            <Rating average={business.rating.average} count={business.rating.count} />
          </div>
          <div className="toh-vrow__m">
            <Icon name="pin" size={14} />
            {business.locationLabel ?? business.address ?? "Location on booking"} · {formatDistanceKm(business.distanceKm)}
          </div>
          <div className="toh-vrow__kind">
            <span className="toh-pill">{businessKind(business)}</span>
            {business.acceptsNewClients ? null : <span className="toh-pill toh-pill--warn">Waitlist only</span>}
          </div>
          {business.nextAvailableSlotAt ? (
            <p className="toh-vrow__m" style={{ marginTop: 8 }}>
              <Icon name="clock" size={14} /> Next available:{" "}
              <b style={{ color: "var(--color-success)" }}>{formatDayTime(business.nextAvailableSlotAt)}</b>
            </p>
          ) : null}
        </div>
      </Link>
      {top.length ? (
        <div className="toh-vrow__svcs">
          {top.map((service) => (
            <div key={service.id} className="toh-srow">
              <span className="toh-srow__t">
                <b>{service.name}</b>
                <span>{formatDuration(service.baseDurationMins)}</span>
              </span>
              <span className="toh-price" style={{ fontWeight: 700 }}>
                from {formatFcfa(service.basePriceCents)}
              </span>
              <Link href={`/businesses/${business.braiderId}/book?service=${service.id}`} className="toh-btn toh-btn--line toh-btn--sm toh-btn--pill">
                Book
              </Link>
            </div>
          ))}
        </div>
      ) : null}
      <Link href={`/businesses/${business.braiderId}`} className="toh-vrow__more">
        See all {services.length || ""} services
      </Link>
    </article>
  );
}
