"use client";

import dynamic from "next/dynamic";
import {
  Car,
  Crosshair,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Modal } from "@/components/shared/Modal";
import { SettingsFrame } from "@/features/studio/components/settings/SettingsFrame";
import { useToast } from "@/features/studio/components/ui/Toaster";
import {
  FormError,
  SelectField,
  SkeletonRows,
  TextAreaField,
  Toggle,
} from "@/features/studio/components/ui/primitives";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { getDeviceLocation, DeviceLocationError } from "@/lib/maps/device-location";
import { searchPlaces, type GeocodeResult } from "@/lib/maps/geocode";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/config";
import type { Coordinates } from "@/lib/maps/types";

/**
 * Where the business works from, and how far it travels.
 *
 * A place on the map and a travel area are different things: a salon or
 * studio is one address clients come to, a travel area is a shape a mobile
 * provider covers. Both are edited here, and both are what discovery
 * searches against.
 */

const StudioMap = dynamic(() => import("@/components/map/BusinessMap"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="grid h-full min-h-[220px] place-items-center rounded-[var(--radius-control)] bg-[var(--color-brand-soft)]"
    >
      <Loader2 className="animate-spin text-[var(--color-brand)]" size={22} />
    </div>
  ),
});

type LocationType = "PUBLIC_SALON" | "PRIVATE_STUDIO" | "MOBILE_ORIGIN";

type BraiderLocation = {
  id: string;
  locationType: LocationType;
  label: string;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
};

type ServiceAreaType = "RADIUS" | "ZIP_LIST" | "CITY_LIST" | "POLYGON";

/** Values a JSON body may carry, matching the API client's own type. */
type AreaDefinition = Record<string, string | number | string[] | number[]>;

type ServiceArea = {
  id: string;
  areaType: ServiceAreaType;
  definition: AreaDefinition;
};

const LOCATION_LABELS: Record<LocationType, { label: string; icon: typeof Store; note?: string }> = {
  PUBLIC_SALON: { label: "Public salon", icon: Store },
  PRIVATE_STUDIO: {
    label: "Private studio",
    icon: Home,
    note: "Clients see an approximate area until 24 hours before their appointment.",
  },
  MOBILE_ORIGIN: {
    label: "Mobile base",
    icon: Car,
    note: "Where you travel from. Shown only as an approximate area.",
  },
};

function coordinatesOf(location: BraiderLocation): Coordinates | null {
  if (location.latitude === null || location.longitude === null) return null;
  const lat = Number(location.latitude);
  const lng = Number(location.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function describeArea(area: ServiceArea): string {
  const definition = area.definition;
  switch (area.areaType) {
    case "RADIUS":
      return `${definition.radiusMiles ?? "?"} miles around ${Number(definition.originLatitude ?? 0).toFixed(3)}, ${Number(definition.originLongitude ?? 0).toFixed(3)}`;
    case "ZIP_LIST":
      return `${(definition.zipCodes as string[] | undefined)?.length ?? 0} postal codes`;
    case "CITY_LIST":
      return ((definition.cities as string[] | undefined) ?? []).join(", ") || "No cities yet";
    case "POLYGON":
      return `Drawn area with ${((definition.coordinates as unknown[] | undefined) ?? []).length} points`;
    default:
      return "Area";
  }
}

const AREA_TYPE_LABELS: Record<ServiceAreaType, string> = {
  RADIUS: "By radius",
  ZIP_LIST: "By postal codes",
  CITY_LIST: "By cities",
  POLYGON: "Drawn area",
};

export function LocationSettings() {
  const toast = useToast();
  const locations = useSWR<{ locations: BraiderLocation[] }>(
    "/api/v1/braiders/locations",
    studioFetcher,
  );
  const areas = useSWR<{ serviceAreas: ServiceArea[] }>(
    "/api/v1/braiders/service-areas",
    studioFetcher,
  );

  const [locationForm, setLocationForm] = useState<{ open: boolean; editing: BraiderLocation | null }>({
    open: false,
    editing: null,
  });
  const [areaForm, setAreaForm] = useState<{ open: boolean; editing: ServiceArea | null }>({
    open: false,
    editing: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<
    { kind: "location" | "area"; id: string; name: string } | null
  >(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const path =
        confirmDelete.kind === "location"
          ? `/api/v1/braiders/locations/${confirmDelete.id}`
          : `/api/v1/braiders/service-areas/${confirmDelete.id}`;
      await studioRequest(path, "DELETE");
      await (confirmDelete.kind === "location" ? locations.mutate() : areas.mutate());
      toast({ tone: "success", title: `${confirmDelete.name} removed.` });
      setConfirmDelete(null);
    } catch (error) {
      toast({ tone: "error", title: errorMessage(error, "We couldn't remove that.") });
    } finally {
      setBusy(false);
    }
  }

  const loading = locations.isLoading || areas.isLoading;

  return (
    <SettingsFrame
      current="location"
      title="Location & travel zones"
      description="Where clients come to you, and where you go to them. Both are what your page is found by."
    >
      {loading ? (
        <SkeletonRows rows={5} label="Loading your places" />
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[var(--color-text-primary)]">Places you work from</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  A salon, a studio at home, or the base you travel from.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setLocationForm({ open: true, editing: null })}
                leadingIcon={<Plus size={16} aria-hidden="true" />}
              >
                Add a place
              </Button>
            </div>

            {locations.error ? (
              <p role="alert" className="text-sm font-semibold text-[var(--color-danger)]">
                We couldn&apos;t load your places.{" "}
                <button type="button" className="underline" onClick={() => void locations.mutate()}>
                  Try again
                </button>
              </p>
            ) : (locations.data?.locations.length ?? 0) === 0 ? (
              <p className="rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
                No places yet. Add one so clients can find you on the map.
              </p>
            ) : (
              <ul role="list" className="grid gap-3 md:grid-cols-2">
                {(locations.data?.locations ?? []).map((location) => {
                  const meta = LOCATION_LABELS[location.locationType] ?? LOCATION_LABELS.PUBLIC_SALON;
                  const Icon = meta.icon;
                  const point = coordinatesOf(location);
                  return (
                    <li
                      key={location.id}
                      className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                          <Icon aria-hidden="true" size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--color-text-primary)]">{location.label}</p>
                          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
                            {meta.label}
                          </p>
                          {/* This list is owner-only, so a missing address is
                              genuinely missing - not withheld for privacy. */}
                          <p
                            className={`mt-1 text-sm ${
                              location.address
                                ? "text-[var(--color-text-muted)]"
                                : "font-semibold text-[var(--color-warning)]"
                            }`}
                          >
                            {location.address ?? "No street address saved yet — add one so clients can find you."}
                          </p>
                        </div>
                      </div>
                      {meta.note ? (
                        <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
                          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={14} />
                          {meta.note}
                        </p>
                      ) : null}
                      {point ? (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Pin at {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setLocationForm({ open: true, editing: location })}
                          leadingIcon={<Pencil size={15} aria-hidden="true" />}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setConfirmDelete({ kind: "location", id: location.id, name: location.label })
                          }
                          leadingIcon={<Trash2 size={15} aria-hidden="true" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[var(--color-text-primary)]">Areas you travel to</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Clients inside one of these can book you to come to them.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setAreaForm({ open: true, editing: null })}
                leadingIcon={<Plus size={16} aria-hidden="true" />}
              >
                Add a travel area
              </Button>
            </div>

            {(areas.data?.serviceAreas.length ?? 0) === 0 ? (
              <p className="rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
                No travel areas. Add one if you go to clients.
              </p>
            ) : (
              <ul role="list" className="grid gap-3 md:grid-cols-2">
                {(areas.data?.serviceAreas ?? []).map((area) => (
                  <li
                    key={area.id}
                    className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
                        {AREA_TYPE_LABELS[area.areaType]}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-primary)]">{describeArea(area)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setAreaForm({ open: true, editing: area })}
                        leadingIcon={<Pencil size={15} aria-hidden="true" />}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setConfirmDelete({
                            kind: "area",
                            id: area.id,
                            name: AREA_TYPE_LABELS[area.areaType],
                          })
                        }
                        leadingIcon={<Trash2 size={15} aria-hidden="true" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <TravelFeeSection />
        </div>
      )}

      {locationForm.open ? (
        <LocationForm
          location={locationForm.editing}
          onClose={() => setLocationForm({ open: false, editing: null })}
          onSaved={async () => {
            setLocationForm({ open: false, editing: null });
            await locations.mutate();
          }}
        />
      ) : null}

      {areaForm.open ? (
        <ServiceAreaForm
          area={areaForm.editing}
          onClose={() => setAreaForm({ open: false, editing: null })}
          onSaved={async () => {
            setAreaForm({ open: false, editing: null });
            await areas.mutate();
          }}
        />
      ) : null}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={`Remove ${confirmDelete?.name ?? ""}?`}
      >
        <div className="grid gap-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Clients will no longer find you here. Appointments already booked keep their own details, so
            nothing in your calendar changes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void remove()} loading={busy}>
              Remove
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)} disabled={busy}>
              Keep it
            </Button>
          </div>
        </div>
      </Modal>
    </SettingsFrame>
  );
}

function LocationForm({
  location,
  onClose,
  onSaved,
}: {
  location: BraiderLocation | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [type, setType] = useState<LocationType>(location?.locationType ?? "PUBLIC_SALON");
  const [label, setLabel] = useState(location?.label ?? "");
  const [address, setAddress] = useState(location?.address ?? "");
  const [point, setPoint] = useState<Coordinates | null>(coordinatesOf(location ?? ({} as BraiderLocation)));
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function findAddress() {
    if (address.trim().length < 3) return;
    setSearching(true);
    try {
      setResults(await searchPlaces(address));
    } catch {
      setError("Place search isn't reachable right now. You can still type an address and drop a pin.");
    } finally {
      setSearching(false);
    }
  }

  async function fillFromDeviceLocation() {
    setLocating(true);
    try {
      const coordinates = await getDeviceLocation({ timeoutMs: 5000, maximumAgeMs: 0 });
      setPoint(coordinates);
      setError(null);
    } catch (locationError) {
      const reason = locationError instanceof DeviceLocationError ? locationError.reason : "unavailable";
      setError(
        reason === "denied"
          ? "Location is blocked for this site. Allow it in your browser, or search for the address."
          : "We couldn't get your location. Search for the address instead.",
      );
    } finally {
      setLocating(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim()) return setError("Give this place a name, like “Akwa salon”.");
    if (!address.trim()) return setError("An address is needed, even for a private studio.");
    if (!point) return setError("Find the address or use your location so the pin is on the map.");
    setError(null);
    setSaving(true);
    try {
      const body = {
        locationType: type,
        label: label.trim(),
        address: address.trim(),
        latitude: point.lat,
        longitude: point.lng,
      };
      if (location) {
        await studioRequest(`/api/v1/braiders/locations/${location.id}`, "PATCH", body);
      } else {
        await studioRequest("/api/v1/braiders/locations", "POST", body);
      }
      toast({ tone: "success", title: location ? "Place updated." : "Place added." });
      await onSaved();
    } catch (saveError) {
      const message = errorMessage(saveError, "We couldn't save that place.");
      setError(message);
      toast({ tone: "error", title: message });
    } finally {
      setSaving(false);
    }
  }

  const mapCenter = point ?? DEFAULT_MAP_CENTER;

  return (
    <Modal open onClose={onClose} title={location ? "Edit place" : "Add a place"}>
      <form className="grid gap-4" onSubmit={(event) => void save(event)}>
        <SelectField
          label="What kind of place is it?"
          value={type}
          onChange={(event) => setType(event.target.value as LocationType)}
        >
          <option value="PUBLIC_SALON">Public salon — clients come to a shop</option>
          <option value="PRIVATE_STUDIO">Private studio — at home or by appointment only</option>
          <option value="MOBILE_ORIGIN">Mobile base — where you travel from</option>
        </SelectField>

        {type !== "PUBLIC_SALON" ? (
          <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] px-3 py-2 text-sm">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-gold)]" size={15} />
            Clients will see an approximate location until 24 hours before their appointment.
          </p>
        ) : null}

        <Input label="Name for this place" value={label} onChange={(event) => setLabel(event.target.value)} required />

        <div className="grid gap-2">
          <Input
            label="Address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            helperText="Type it, then search to drop the pin."
            required
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void findAddress()} loading={searching}>
              Search address
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void fillFromDeviceLocation()}
              loading={locating}
              leadingIcon={<Crosshair size={15} aria-hidden="true" />}
            >
              Use my current location
            </Button>
          </div>
          {results.length > 0 ? (
            <ul role="list" className="grid gap-1 rounded-[var(--radius-control)] border border-[var(--color-border)] p-1">
              {results.slice(0, 5).map((result) => (
                <li key={`${result.coordinates.lat},${result.coordinates.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPoint(result.coordinates);
                      setAddress(result.label);
                      setResults([]);
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-[var(--radius-control)] px-2 text-left text-sm hover:bg-[var(--color-brand-soft)]"
                  >
                    <MapPin aria-hidden="true" className="shrink-0 text-[var(--color-brand)]" size={15} />
                    <span className="min-w-0 flex-1 truncate">{result.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="h-48 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)]">
          <StudioMap
            braiders={[]}
            userCoordinates={point}
            focusRequest={point ? { coordinates: point, zoom: 15 } : null}
          />
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {point
            ? `Pin at ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}.`
            : `No pin yet. The map is centred on ${mapCenter.lat.toFixed(2)}, ${mapCenter.lng.toFixed(2)}.`}
        </p>

        <FormError message={error} />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={saving}>
            {location ? "Save place" : "Add place"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ServiceAreaForm({
  area,
  onClose,
  onSaved,
}: {
  area: ServiceArea | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const definition = (area?.definition ?? {}) as AreaDefinition;
  const [areaType, setAreaType] = useState<ServiceAreaType>(area?.areaType ?? "RADIUS");
  const [radiusMiles, setRadiusMiles] = useState(String(definition.radiusMiles ?? 10));
  const [origin, setOrigin] = useState<Coordinates>({
    lat: Number(definition.originLatitude ?? DEFAULT_MAP_CENTER.lat),
    lng: Number(definition.originLongitude ?? DEFAULT_MAP_CENTER.lng),
  });
  const [cities, setCities] = useState(((definition.cities as string[] | undefined) ?? []).join("\n"));
  const [zipCodes, setZipCodes] = useState(((definition.zipCodes as string[] | undefined) ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fillFromDeviceLocation() {
    setLocating(true);
    try {
      setOrigin(await getDeviceLocation({ timeoutMs: 5000, maximumAgeMs: 0 }));
      setError(null);
    } catch {
      setError("We couldn't get your location. Type the coordinates instead.");
    } finally {
      setLocating(false);
    }
  }

  function buildDefinition(): AreaDefinition {
    switch (areaType) {
      case "RADIUS":
        return {
          originLatitude: origin.lat,
          originLongitude: origin.lng,
          radiusMiles: Number(radiusMiles),
        };
      case "CITY_LIST":
        return { cities: cities.split("\n").map((line) => line.trim()).filter(Boolean) };
      case "ZIP_LIST":
        return { zipCodes: zipCodes.split(/[\n,]/).map((line) => line.trim()).filter(Boolean) };
      default:
        return definition;
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = { areaType, definition: buildDefinition() };
      if (area) {
        await studioRequest(`/api/v1/braiders/service-areas/${area.id}`, "PATCH", body);
      } else {
        await studioRequest("/api/v1/braiders/service-areas", "POST", body);
      }
      toast({ tone: "success", title: area ? "Travel area updated." : "Travel area added." });
      await onSaved();
    } catch (saveError) {
      const message = errorMessage(saveError, "We couldn't save that area.");
      setError(message);
      toast({ tone: "error", title: message });
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: ServiceAreaType; label: string }[] = [
    { key: "RADIUS", label: "By radius" },
    { key: "CITY_LIST", label: "By cities" },
    { key: "ZIP_LIST", label: "By postal codes" },
    { key: "POLYGON", label: "By area" },
  ];

  return (
    <Modal open onClose={onClose} title={area ? "Edit travel area" : "Add a travel area"}>
      <form className="grid gap-4" onSubmit={(event) => void save(event)}>
        <div role="tablist" aria-label="How to define the area" className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={areaType === tab.key}
              onClick={() => setAreaType(tab.key)}
              className={`inline-flex min-h-11 items-center rounded-[var(--radius-control)] border px-3 text-sm font-semibold ${
                areaType === tab.key
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {areaType === "RADIUS" ? (
          <div className="grid gap-3">
            <Input
              label="How far do you travel? (miles)"
              inputMode="decimal"
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(event.target.value.replace(/[^0-9.]/g, ""))}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                label="From latitude"
                value={String(origin.lat)}
                onChange={(event) => setOrigin({ ...origin, lat: Number(event.target.value) })}
              />
              <Input
                label="From longitude"
                value={String(origin.lng)}
                onChange={(event) => setOrigin({ ...origin, lng: Number(event.target.value) })}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void fillFromDeviceLocation()}
              loading={locating}
              leadingIcon={<Crosshair size={15} aria-hidden="true" />}
            >
              Use my current location
            </Button>
            <div className="h-44 overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)]">
              <StudioMap
                braiders={[]}
                userCoordinates={origin}
                searchArea={{ center: origin, radiusKm: Number(radiusMiles || 0) * 1.60934 }}
                focusRequest={{ coordinates: origin, radiusKm: Math.max(1, Number(radiusMiles || 0) * 1.60934) }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Your starting point is never shown exactly: clients see an approximate circle.
            </p>
          </div>
        ) : null}

        {areaType === "CITY_LIST" ? (
          <TextAreaField
            label="Cities you travel to"
            rows={5}
            value={cities}
            onChange={(event) => setCities(event.target.value)}
            hint="One per line."
          />
        ) : null}

        {areaType === "ZIP_LIST" ? (
          <TextAreaField
            label="Postal codes you travel to"
            rows={5}
            value={zipCodes}
            onChange={(event) => setZipCodes(event.target.value)}
            hint="One per line, or separated by commas."
          />
        ) : null}

        {areaType === "POLYGON" ? (
          <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
            Drawing an area on the map needs a map drawing tool this app doesn&apos;t include yet. The other
            three ways cover the same ground: a radius, a list of cities, or a list of postal codes.
          </p>
        ) : null}

        <FormError message={error} />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={saving} disabled={areaType === "POLYGON" && !area}>
            {area ? "Save area" : "Add area"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Travel fees have no endpoint yet, so this reads and writes nothing. It
 * is left visible, clearly marked, because the shape of the setting is
 * what the backend work will be built against.
 */
// TODO: wire to travel fee endpoint once created.
function TravelFeeSection() {
  const [charging, setCharging] = useState(false);
  const [feeType, setFeeType] = useState("flat");

  return (
    <section className="grid gap-3 rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--color-text-primary)]">Travel fee</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Not switched on yet: there is nowhere to save it, and nothing would charge it. Shown so you can
            see what is coming.
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-warning-soft)] px-3 py-1 text-xs font-bold text-[var(--color-warning)]">
          Coming soon
        </span>
      </div>

      <div className="grid gap-3 opacity-60">
        <Toggle checked={charging} onChange={setCharging} label="Charge a travel fee" disabled />
        <SelectField label="Fee type" value={feeType} onChange={(event) => setFeeType(event.target.value)} disabled>
          <option value="flat">A flat fee per visit</option>
          <option value="per-km">A rate per kilometre</option>
        </SelectField>
        <Input label="Waive the fee above this booking value" value="" readOnly disabled />
      </div>
    </section>
  );
}
