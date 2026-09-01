"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";
import { ApiClientError } from "@/lib/api/errors";

type Service = {
  id: string;
  name: string;
  basePriceCents: number;
  baseDurationMins: number;
};

type Location = {
  id: string;
  locationType: "PUBLIC_SALON" | "PRIVATE_STUDIO" | "MOBILE";
  label: string;
  address: string | null;
};

type Hold = {
  id: string;
  startAt: string;
  computedPriceCents: number;
  depositCents: number;
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function nextSevenDays(): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

export function BookingFlow({ braiderId }: { braiderId: string }) {
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");

  const [services, setServices] = useState<Service[] | null>(null);
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState<string | null>(preselectedServiceId);
  const [locationId, setLocationId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(nextSevenDays()[0]!);
  // Keyed by service+date so "loading" and "which result is current" are
  // both derived below rather than set synchronously in the effect body -
  // every setSlotsResult call happens inside a fetch callback, the
  // React-Compiler-sanctioned place for it.
  const [slotsResult, setSlotsResult] = useState<{ key: string; slots: string[] } | null>(
    null,
  );
  const slotsKey = serviceId ? `${serviceId}|${selectedDate}` : null;
  const slots = slotsResult?.key === slotsKey ? slotsResult.slots : null;
  const slotsLoading = slotsKey !== null && slotsResult?.key !== slotsKey;

  const [hold, setHold] = useState<Hold | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmedAppointmentId, setConfirmedAppointmentId] = useState<string | null>(null);

  // Initial catalog load - service + location choices.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      browserApiFetch<{ services: Service[] }>(`/api/v1/braiders/${braiderId}/services`),
      browserApiFetch<{ locations: Location[] }>(`/api/v1/braiders/${braiderId}/locations`),
    ])
      .then(([serviceData, locationData]) => {
        if (cancelled) return;
        setServices(serviceData.services);
        setLocations(locationData.locations);
        if (locationData.locations.length === 1) {
          setLocationId(locationData.locations[0]!.id);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiClientError ? err.message : "We couldn't load this business.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [braiderId]);

  // Available slots for the selected service + date.
  useEffect(() => {
    if (!slotsKey) return;
    let cancelled = false;
    browserApiFetch<{ slots: string[] }>(
      `/api/v1/braiders/${braiderId}/availability/slots?serviceId=${serviceId}&date=${selectedDate}`,
    )
      .then((data) => {
        if (!cancelled) setSlotsResult({ key: slotsKey, slots: data.slots });
      })
      .catch(() => {
        if (!cancelled) setSlotsResult({ key: slotsKey, slots: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [braiderId, serviceId, selectedDate, slotsKey]);

  async function handleSelectSlot(startAt: string) {
    if (!serviceId) return;
    setHoldError(null);
    try {
      const result = await browserApiFetch<{ hold: Hold }>("/api/v1/availability/holds", {
        method: "POST",
        body: { serviceId, startAt, variationIds: [] },
      });
      setHold(result.hold);
    } catch (err) {
      setHoldError(
        err instanceof ApiClientError
          ? err.message
          : "This time slot was just taken. Please choose another.",
      );
      setSlotsResult((current) =>
        current ? { ...current, slots: current.slots.filter((slot) => slot !== startAt) } : current,
      );
    }
  }

  async function handleConfirm() {
    if (!hold || !serviceId || !locationId) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      const result = await browserApiFetch<{ id: string }>("/api/v1/bookings", {
        method: "POST",
        body: { holdId: hold.id, serviceId, locationId, variationIds: [] },
      });
      setConfirmedAppointmentId(result.id);
    } catch (err) {
      setConfirmError(
        err instanceof ApiClientError ? err.message : "We couldn't complete this booking.",
      );
    } finally {
      setConfirming(false);
    }
  }

  if (loadError) {
    return <ErrorState description={loadError} />;
  }

  if (!services || !locations) {
    return <LoadingSkeleton label="Loading booking options" lines={5} />;
  }

  if (confirmedAppointmentId) {
    return (
      <section className="surface-panel mx-auto max-w-md p-8 text-center">
        <p className="text-3xl" aria-hidden="true">
          ✓
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">
          Your booking is confirmed!
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Confirmation #{confirmedAppointmentId}
        </p>
        <Link href="/account/appointments" className="btn-primary mt-6 inline-flex">
          View my bookings
        </Link>
      </section>
    );
  }

  const selectedService = services.find((service) => service.id === serviceId) ?? null;

  return (
    <section className="page-container grid gap-6 py-8 md:grid-cols-[1fr_360px] md:items-start">
      <div className="grid gap-6">
        <div className="surface-panel p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">1. Style</h2>
          {selectedService ? (
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {selectedService.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {selectedService.baseDurationMins} min · From{" "}
                  {formatPrice(selectedService.basePriceCents)}
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--color-brand)]"
                onClick={() => setServiceId(null)}
              >
                Change
              </button>
            </div>
          ) : services.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              This business has no published services yet.
            </p>
          ) : (
            <ul role="list" className="mt-3 grid gap-2">
              {services.map((service) => (
                <li key={service.id}>
                  <button
                    type="button"
                    onClick={() => setServiceId(service.id)}
                    className="flex w-full items-center justify-between rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-left text-sm hover:border-[var(--color-brand)]"
                  >
                    <span>{service.name}</span>
                    <span className="text-[var(--color-text-muted)]">
                      {formatPrice(service.basePriceCents)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {locations.length > 1 ? (
          <div className="surface-panel p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Location</h2>
            <ul role="list" className="mt-3 grid gap-2">
              {locations.map((location) => (
                <li key={location.id}>
                  <button
                    type="button"
                    onClick={() => setLocationId(location.id)}
                    aria-current={locationId === location.id ? "true" : undefined}
                    className={`w-full rounded-[var(--radius-control)] border px-3 py-2 text-left text-sm ${
                      locationId === location.id
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    {location.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {serviceId ? (
          <div className="surface-panel p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              2. Date & time
            </h2>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {nextSevenDays().map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    setHold(null);
                  }}
                  aria-current={date === selectedDate ? "true" : undefined}
                  className={`shrink-0 rounded-[var(--radius-control)] border px-3 py-2 text-xs font-semibold ${
                    date === selectedDate
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-text-inverse)]"
                      : "border-[var(--color-border)] text-[var(--color-text-primary)]"
                  }`}
                >
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                  })}
                </button>
              ))}
            </div>

            {holdError ? (
              <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
                {holdError}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {slotsLoading ? (
                <LoadingSkeleton label="Loading times" lines={2} />
              ) : slots && slots.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No times available this day.
                </p>
              ) : (
                slots?.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => void handleSelectSlot(slot)}
                    aria-current={hold?.startAt === slot ? "true" : undefined}
                    className={`rounded-[var(--radius-control)] border px-3 py-2 text-sm font-semibold ${
                      hold?.startAt === slot
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-text-inverse)]"
                        : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                    }`}
                  >
                    {new Date(slot).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </button>
                ))
              )}
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              All times are in your local timezone.
            </p>
          </div>
        ) : null}
      </div>

      <aside className="surface-panel sticky top-20 grid gap-3 p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Booking summary
        </h2>
        {selectedService ? (
          <div className="text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">
              {selectedService.name}
            </p>
            {hold ? (
              <p className="mt-1 text-[var(--color-text-muted)]">
                {new Date(hold.startAt).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
            {hold ? (
              <p className="mt-2 font-semibold text-[var(--color-text-primary)]">
                {formatPrice(hold.computedPriceCents)}
                <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
                  ({formatPrice(hold.depositCents)} deposit due now)
                </span>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Select a style to begin.</p>
        )}

        {confirmError ? (
          <p role="alert" className="text-sm text-[var(--color-danger)]">
            {confirmError}
          </p>
        ) : null}

        <Button
          disabled={!hold || !locationId}
          loading={confirming}
          onClick={() => void handleConfirm()}
        >
          Confirm booking
        </Button>
        <p className="text-xs text-[var(--color-text-muted)]">
          Deposit payment collection isn&apos;t wired up yet - confirming here reserves the
          appointment; the payment and consultation steps are still in progress.
        </p>
      </aside>
    </section>
  );
}
