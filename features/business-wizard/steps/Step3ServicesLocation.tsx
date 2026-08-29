"use client";

import { useRouter } from "next/navigation";
import { LocateFixed, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { CountrySelect } from "@/features/business-wizard/components/CountrySelect";
import { LocationTypeToggleGroup } from "@/features/business-wizard/components/LocationTypeToggleGroup";
import { WorkingDaysToggleRow } from "@/features/business-wizard/components/WorkingDaysToggleRow";
import type {
  WizardApplication,
  WizardStep3Payload,
} from "@/features/business-wizard/useBusinessWizardDraft";

const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Europe/London",
  "Europe/Paris",
  "Europe/Amsterdam",
  "Europe/Helsinki",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

type Category = { id: string; name: string };

type ServiceDraft = {
  name: string;
  categoryId: string;
  priceDollars: string;
  durationMins: string;
  optionLabelsText: string;
};

function emptyService(): ServiceDraft {
  return { name: "", categoryId: "", priceDollars: "", durationMins: "60", optionLabelsText: "" };
}

export function Step3ServicesLocation({
  application,
  saveStep3,
  saving,
}: {
  application: WizardApplication;
  saveStep3: (input: WizardStep3Payload) => Promise<WizardApplication>;
  saving: boolean;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locationType, setLocationType] = useState<string[]>(application.locationType);
  const [line1, setLine1] = useState(application.address?.line1 ?? "");
  const [line2, setLine2] = useState(application.address?.line2 ?? "");
  const [locality, setLocality] = useState(application.address?.locality ?? "");
  const [administrativeArea, setAdministrativeArea] = useState(
    application.address?.administrativeArea ?? "",
  );
  const [postalCode, setPostalCode] = useState(application.address?.postalCode ?? "");
  const [countryCode, setCountryCode] = useState(application.address?.countryCode ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [hideAddress, setHideAddress] = useState(application.hideAddressUntilConfirmed);
  const [timezone, setTimezone] = useState(application.timezone ?? "");
  const [workingDays, setWorkingDays] = useState<number[]>(application.workingDays);
  const [services, setServices] = useState<ServiceDraft[]>(
    application.draftServices.length > 0
      ? application.draftServices.map((service) => ({
          name: service.name,
          categoryId: service.categoryId,
          priceDollars: (service.basePriceCents / 100).toString(),
          durationMins: service.baseDurationMins.toString(),
          optionLabelsText: service.optionLabels.join(", "),
        }))
      : [emptyService()],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    browserApiFetch<{ categories: Category[] }>("/api/v1/services/categories")
      .then((data) => setCategories(data.categories))
      .catch(() => undefined);
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("We could not detect your location. Enter your address manually.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  function updateService(index: number, patch: Partial<ServiceDraft>) {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleContinue() {
    if (locationType.length === 0) {
      setError("Choose at least one way you serve clients.");
      return;
    }
    if (!line1 || !locality || !countryCode) {
      setError("Fill in your street address, city, and country.");
      return;
    }
    if (!coords) {
      setError('Click "Use my current location" to confirm your business coordinates.');
      return;
    }
    if (!timezone) {
      setError("Choose your business timezone.");
      return;
    }
    if (workingDays.length === 0) {
      setError("Choose at least one typical working day.");
      return;
    }
    const validServices = services.filter((s) => s.name && s.categoryId && s.priceDollars);
    if (validServices.length === 0) {
      setError("Add at least one service with a name, category, and price.");
      return;
    }

    setError(null);
    try {
      await saveStep3({
        locationType,
        address: {
          line1,
          ...(line2 ? { line2 } : {}),
          locality,
          ...(administrativeArea ? { administrativeArea } : {}),
          ...(postalCode ? { postalCode } : {}),
          countryCode,
        },
        latitude: coords.lat,
        longitude: coords.lng,
        hideAddressUntilConfirmed: hideAddress,
        timezone,
        workingDays,
        services: validServices.map((s) => ({
          name: s.name,
          categoryId: s.categoryId,
          basePriceCents: Math.round(parseFloat(s.priceDollars) * 100),
          baseDurationMins: parseInt(s.durationMins, 10) || 60,
          optionLabels: s.optionLabelsText
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean),
        })),
      });
      router.push("/business/setup/review");
    } catch (caught) {
      setError(
        caught instanceof ApiClientError ? caught.message : "We could not save that. Try again.",
      );
    }
  }

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
        Step 3 of 4
      </p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
        Where and how do you serve clients?
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Add your main location and a first service. You can expand these after approval.
      </p>

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Service location
        </h2>
        <div className="mt-3">
          <LocationTypeToggleGroup onChange={setLocationType} value={locationType} />
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            Street address
            <input
              className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
              onChange={(event) => setLine1(event.target.value)}
              value={line1}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            Apartment, suite, unit (optional)
            <input
              className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
              onChange={(event) => setLine2(event.target.value)}
              value={line2}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              City
              <input
                className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                onChange={(event) => setLocality(event.target.value)}
                value={locality}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              State / region
              <input
                className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                onChange={(event) => setAdministrativeArea(event.target.value)}
                value={administrativeArea}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Postal code
              <input
                className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                onChange={(event) => setPostalCode(event.target.value)}
                value={postalCode}
              />
            </label>
          </div>
          <CountrySelect onChange={setCountryCode} value={countryCode} />

          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-muted)]">
            <input
              checked={hideAddress}
              className="mt-1 size-4"
              onChange={(event) => setHideAddress(event.target.checked)}
              type="checkbox"
            />
            Hide the full address until a booking is confirmed
          </label>

          <div>
            <button
              className="btn-secondary inline-flex items-center gap-2"
              disabled={locating}
              onClick={useMyLocation}
              type="button"
            >
              <LocateFixed aria-hidden="true" size={16} />
              {locating
                ? "Detecting..."
                : coords
                  ? "Location confirmed - update"
                  : "Use my current location"}
            </button>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Confirms your exact coordinates so clients can find you on the map.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Your services</h2>
        <div className="mt-4 grid gap-6">
          {services.map((service, index) => (
            <div className="grid gap-4 border-b border-[var(--color-border)] pb-6 last:border-0 last:pb-0" key={index}>
              <div className="flex items-center justify-between">
                <label className="grid flex-1 gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  Service name
                  <input
                    className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                    onChange={(event) => updateService(index, { name: event.target.value })}
                    value={service.name}
                  />
                </label>
                {services.length > 1 ? (
                  <button
                    aria-label="Remove service"
                    className="ml-3 mt-6 text-[var(--color-danger)]"
                    onClick={() => setServices((prev) => prev.filter((_, i) => i !== index))}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  Category
                  <select
                    className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                    onChange={(event) => updateService(index, { categoryId: event.target.value })}
                    value={service.categoryId}
                  >
                    <option value="">Select</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  Duration (minutes)
                  <input
                    className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                    min={1}
                    onChange={(event) => updateService(index, { durationMins: event.target.value })}
                    type="number"
                    value={service.durationMins}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  Starting price ($)
                  <input
                    className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                    min={0}
                    onChange={(event) => updateService(index, { priceDollars: event.target.value })}
                    type="number"
                    value={service.priceDollars}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                Options (comma separated)
                <input
                  className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
                  onChange={(event) =>
                    updateService(index, { optionLabelsText: event.target.value })
                  }
                  placeholder="Medium size, Mid-back length"
                  value={service.optionLabelsText}
                />
              </label>
            </div>
          ))}
        </div>
        <button
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-brand)]"
          onClick={() => setServices((prev) => [...prev, emptyService()])}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Add another service
        </button>
      </div>

      <div className="mt-6 grid gap-6 rounded-xl border border-[var(--color-border)] bg-white p-6 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
          Business timezone
          <select
            className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
            onChange={(event) => setTimezone(event.target.value)}
            value={timezone}
          >
            <option value="">Select a timezone</option>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Typical working days
          </span>
          <WorkingDaysToggleRow onChange={setWorkingDays} value={workingDays} />
        </div>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-md bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex justify-between border-t border-[var(--color-border)] pt-6">
        <button
          className="btn-secondary"
          onClick={() => router.push("/business/setup/details")}
          type="button"
        >
          Back
        </button>
        <button className="btn-primary" disabled={saving} onClick={handleContinue} type="button">
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </section>
  );
}
