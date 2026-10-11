"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Icon } from "@/components/app/Icon";
import { Portrait, hashString, type LookName } from "@/components/app/art";
import { BusinessCover, DemoNote, Option, Rating, businessName } from "@/components/app/ui";
import { useViewer } from "@/components/providers/ViewerProvider";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";
import { lookForService } from "@/lib/app/business-look";
import { apiGet, useBusiness, useLocations, useServices } from "@/lib/app/data";
import { formatDay, formatDuration, formatFcfa, formatTime } from "@/lib/app/format";
import type { Service, Variation } from "@/lib/app/types";

type Step = "service" | "pro" | "time" | "confirm";
const STEPS: [Step, string][] = [
  ["service", "Service"],
  ["pro", "Professional"],
  ["time", "Time"],
  ["confirm", "Confirm"],
];

type Pricing = { priceCents: number; durationMins: number; depositCents: number };
type Hold = { id: string; startAt: string };
const TEAM_LOOKS: LookName[] = ["silk", "braids", "fade", "locs", "bob", "twists", "afro", "glam"];

/** The next 14 days as YYYY-MM-DD in Cameroon time. */
function upcomingDays() {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" });
  const today = new Date();
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today.getTime() + index * 86_400_000);
    return formatter.format(date);
  });
}

function groupOf(variation: Variation) {
  return variation.variationType ?? "OPTION";
}

export function BookFlow({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const viewer = useViewer();
  const { business } = useBusiness(id);
  const { services, isLoading } = useServices(id);
  const locations = useLocations(id);
  const [step, setStep] = useState<Step>(params.get("service") ? "pro" : "service");
  const [serviceId, setServiceId] = useState<string | null>(params.get("service"));
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [pro, setPro] = useState<string | null>(null);
  const [days] = useState(upcomingDays);
  const [day, setDay] = useState<string>(days[0]!);
  const [slot, setSlot] = useState<string | null>(null);
  const [pay, setPay] = useState<"momo" | "orange" | "card">("momo");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const service: Service | null = services.find((item) => item.id === serviceId) ?? null;

  // Required options (a size, a length) need one choice each; preselect the first.
  const groups = useMemo(() => {
    const map = new Map<string, Variation[]>();
    for (const variation of service?.variations ?? []) {
      const key = groupOf(variation);
      map.set(key, [...(map.get(key) ?? []), variation]);
    }
    return [...map.entries()];
  }, [service]);
  const variationIds = groups
    .map(([key, options]) => picked[key] ?? (options.some((option) => option.isRequired) ? options[0]!.id : undefined))
    .filter((value): value is string => Boolean(value));
  const variationKey = variationIds.join(",");

  const { data: pricing } = useSWR(
    service ? [`/api/v1/services/${service.id}/preview-price`, variationKey] : null,
    ([path]) =>
      browserApiFetch<{ computed: Pricing }>(path, { method: "POST", body: { variationIds } }).then((result) => result.computed),
    { revalidateOnFocus: false },
  );

  const slotsQuery = service
    ? `/api/v1/braiders/${id}/availability/slots?serviceId=${service.id}&date=${day}${variationKey ? `&variationIds=${variationKey}` : ""}`
    : null;
  const { data: slotData, isLoading: slotsLoading } = useSWR(step === "time" ? slotsQuery : null, (path: string) => apiGet<{ slots: string[] }>(path), {
    revalidateOnFocus: false,
  });
  const slots = slotData?.slots ?? [];

  useEffect(() => {
    if (!viewer) router.replace(`/customer/sign-in?callbackUrl=${encodeURIComponent(`/businesses/${id}/book${serviceId ? `?service=${serviceId}` : ""}`)}`);
  }, [viewer, router, id, serviceId]);

  const team = (business?.team ?? []).filter((member) => member.role !== "RECEPTIONIST");
  const stepIndex = STEPS.findIndex(([key]) => key === step);
  const proName = team.find((member) => member.id === pro)?.displayName ?? "Any professional";
  const price = pricing?.priceCents ?? service?.basePriceCents ?? 0;
  const deposit = pricing?.depositCents ?? Math.round(((service?.basePriceCents ?? 0) * (service?.depositPercentage ?? 20)) / 100);
  const duration = pricing?.durationMins ?? service?.baseDurationMins ?? 0;
  const name = business ? businessName(business) : "";

  const canContinue = step === "service" ? Boolean(service) : step === "pro" ? true : step === "time" ? Boolean(slot) : true;

  const back = () => {
    if (stepIndex === 0) router.push(`/businesses/${id}`);
    else setStep(STEPS[stepIndex - 1]![0]);
  };

  const confirm = async () => {
    if (!service || !slot) return;
    const location = locations[0];
    if (!location) {
      setFailure("This business hasn't published a location to book at yet.");
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      const { hold } = await browserApiFetch<{ hold: Hold }>("/api/v1/availability/holds", {
        method: "POST",
        body: { serviceId: service.id, startAt: slot, variationIds },
      });
      const result = await browserApiFetch<{ appointment: { id: string } }>("/api/v1/bookings", {
        method: "POST",
        body: {
          holdId: hold.id,
          serviceId: service.id,
          locationId: location.id,
          variationIds,
          ...(pro ? { teamMemberId: pro } : {}),
        },
      });
      // Payments run in mock mode: this stands in for the Mobile Money approval.
      await browserApiFetch(`/api/v1/bookings/${result.appointment.id}/mock-confirm`, { method: "POST", body: {} });
      router.push(`/bookings/${result.appointment.id}?booked=1`);
    } catch (error) {
      setFailure(
        error instanceof ApiClientError
          ? error.message
          : "We couldn't complete the booking. Your card or wallet hasn't been charged. Try another time.",
      );
      setBusy(false);
    }
  };

  const next = () => {
    if (step === "confirm") void confirm();
    else setStep(STEPS[stepIndex + 1]![0]);
  };

  return (
    <div className="toh-bkshell">
      <header className="toh-bkh">
        <button type="button" className="toh-icon-btn" aria-label="Back" onClick={back}>
          <Icon name="arrowL" />
        </button>
        <nav className="toh-bkh__steps" aria-label="Booking steps">
          {STEPS.map(([key, label], index) => (
            <span key={key} style={{ display: "contents" }}>
              {index ? <span className="toh-bkh__sep">›</span> : null}
              {index === stepIndex ? (
                <b>{label}</b>
              ) : index < stepIndex ? (
                <button type="button" onClick={() => setStep(key)}>
                  {label}
                </button>
              ) : (
                <span>{label}</span>
              )}
            </span>
          ))}
        </nav>
        <Link href={`/businesses/${id}`} className="toh-icon-btn" aria-label="Close booking">
          <Icon name="x" />
        </Link>
      </header>

      <div className="toh-bkbody">
        <section>
          {step === "service" ? (
            <>
              <h1>Select a service</h1>
              {isLoading ? <div className="toh-skeleton" style={{ height: 200 }} /> : null}
              {services.map((item) => {
                const on = item.id === serviceId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`toh-svc${on ? " is-on" : ""}`}
                    aria-pressed={on}
                    onClick={() => {
                      setServiceId(item.id);
                      setPicked({});
                      setSlot(null);
                    }}
                  >
                    <div className="toh-art toh-svc__art">
                      <Portrait look={lookForService(item.name)} />
                    </div>
                    <div className="toh-svc__t">
                      <b>{item.name}</b>
                      <span>{formatDuration(item.baseDurationMins)}</span>
                      {item.description ? <p>{item.description}</p> : null}
                      <span className="toh-svc__p">from {formatFcfa(item.basePriceCents)}</span>
                    </div>
                    <span className="toh-svc__add">
                      <Icon name={on ? "check" : "plus"} size={18} />
                    </span>
                  </button>
                );
              })}
              {groups.map(([key, options]) => (
                <div key={key} style={{ marginTop: 18 }}>
                  <h3 className="toh-h3" style={{ marginTop: 0, textTransform: "capitalize" }}>
                    {key.toLowerCase().replace(/_/g, " ")}
                  </h3>
                  <div className="toh-chips" style={{ flexWrap: "wrap" }}>
                    {options.map((option) => {
                      const on = variationIds.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`toh-chip${on ? " is-on" : ""}`}
                          onClick={() => {
                            setPicked((current) => ({ ...current, [key]: option.id }));
                            setSlot(null);
                          }}
                        >
                          {option.label}
                          {option.priceDeltaCents ? ` · +${formatFcfa(option.priceDeltaCents)}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : null}

          {step === "pro" ? (
            <>
              <h1>Select a professional</h1>
              <div className="toh-proopt">
                <button type="button" className={pro === null ? "is-on" : ""} onClick={() => setPro(null)}>
                  <span className="toh-avatar" style={{ width: 72, height: 72, background: "var(--color-brand-soft)", color: "var(--color-brand)" }}>
                    <Icon name="users" size={32} />
                  </span>
                  <b>Any professional</b>
                  <small>For the most open times</small>
                </button>
                {team.map((member) => (
                  <button key={member.id} type="button" className={pro === member.id ? "is-on" : ""} onClick={() => setPro(member.id)}>
                    <span className="toh-avatar toh-art" style={{ width: 72, height: 72 }}>
                      <Portrait look={TEAM_LOOKS[hashString(member.id) % TEAM_LOOKS.length]!} />
                    </span>
                    <b>{member.displayName}</b>
                    <small>{member.jobTitle ?? "Stylist"}</small>
                  </button>
                ))}
              </div>
              {team.length === 0 ? (
                <p className="toh-muted" style={{ marginTop: 14 }}>
                  {name} works solo, so you&apos;ll be booked with them.
                </p>
              ) : null}
            </>
          ) : null}

          {step === "time" ? (
            <>
              <h1>Select a time</h1>
              <div className="toh-dates">
                {days.map((value) => {
                  const date = new Date(`${value}T12:00:00`);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={day === value ? "is-on" : ""}
                      onClick={() => {
                        setDay(value);
                        setSlot(null);
                      }}
                    >
                      <span className="toh-dates__c">{date.getDate()}</span>
                      {date.toLocaleDateString("en-GB", { weekday: "short" })}
                    </button>
                  );
                })}
              </div>
              <p className="toh-muted" style={{ marginTop: 10 }}>
                {formatDay(`${day}T12:00:00`)} · {formatDuration(duration)} with {proName}
              </p>
              {slotsLoading ? (
                <div className="toh-skeleton" style={{ height: 160, marginTop: 16 }} />
              ) : slots.length ? (
                <div className="toh-times">
                  {slots.map((value) => (
                    <button key={value} type="button" className={slot === value ? "is-on" : ""} onClick={() => setSlot(value)}>
                      <span>{formatTime(value)}</span>
                      <small>{slot === value ? "Selected" : ""}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="toh-empty toh-card" style={{ marginTop: 16 }}>
                  <Icon name="cal" size={30} />
                  <span>No open times this day. Try another day.</span>
                </div>
              )}
            </>
          ) : null}

          {step === "confirm" ? (
            <>
              <h1>Review and confirm</h1>
              <h3 className="toh-h3" style={{ marginTop: 0 }}>
                Pay the deposit with
              </h3>
              <div className="toh-stack">
                <Option on={pay === "momo"} onClick={() => setPay("momo")} icon="phone" title="MTN Mobile Money" detail="Approve the prompt on your phone" />
                <Option on={pay === "orange"} onClick={() => setPay("orange")} icon="phone" title="Orange Money" detail="Approve the prompt on your phone" />
                <Option on={pay === "card"} onClick={() => setPay("card")} icon="card" title="Card" detail="Visa or Mastercard" />
              </div>
              <DemoNote>Demo payments: no money moves. Confirming books the slot for real in this demo.</DemoNote>
              <h3 className="toh-h3">Cancellation policy</h3>
              <p className="toh-muted" style={{ lineHeight: 1.6 }}>
                {business?.policy?.cancellationPolicy?.description ??
                  "Cancel for free up to 24 hours before your appointment and your deposit is refunded."}{" "}
                Later cancellations and no-shows keep the {formatFcfa(deposit)} deposit, which goes to {name}.
              </p>
              {failure ? (
                <p className="toh-notice toh-notice--error" style={{ marginTop: 14 }}>
                  {failure}
                </p>
              ) : null}
            </>
          ) : null}
        </section>

        <aside className="toh-card toh-bksum">
          {business ? (
            <div className="toh-bksum__vn toh-hide-m">
              <BusinessCover id={id} category={business.businessCategory} photoUrl={business.coverPhotoUrl} name={name} className="toh-bksum__art" />
              <div>
                <b>{name}</b>
                <Rating average={business.rating.average} count={business.rating.count} size={12} />
                <span className="toh-muted" style={{ fontSize: 12.5 }}>
                  {locations[0]?.address ?? ""}
                </span>
              </div>
            </div>
          ) : null}
          {slot ? (
            <div className="toh-bksum__ln toh-hide-m">
              <Icon name="cal" size={16} />
              <b style={{ flex: 1 }}>
                {formatDay(slot)}
                <br />
                <span className="toh-muted" style={{ fontWeight: 600 }}>
                  {formatTime(slot)} · {formatDuration(duration)}
                </span>
              </b>
            </div>
          ) : null}
          <div className="toh-hide-m" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
            {service ? (
              <div className="toh-bksum__ln">
                <div>
                  <b style={{ fontWeight: 600 }}>{service.name}</b>
                  <br />
                  <span style={{ fontSize: 12.5 }} className="toh-muted">
                    {formatDuration(duration)} with {proName}
                  </span>
                </div>
                <b className="toh-num">{formatFcfa(price)}</b>
              </div>
            ) : (
              <p className="toh-muted">No service selected</p>
            )}
          </div>
          <div className="toh-bksum__ln toh-bksum__tot">
            <span>Total</span>
            <span className="toh-num">{service ? formatFcfa(price) : "0 FCFA"}</span>
          </div>
          {service ? (
            <>
              <div className="toh-bksum__ln" style={{ fontSize: 13 }}>
                <span>Pay now (deposit)</span>
                <b className="toh-num">{formatFcfa(deposit)}</b>
              </div>
              <div className="toh-bksum__ln toh-hide-m" style={{ fontSize: 13 }}>
                <span>Pay at the appointment</span>
                <b className="toh-num">{formatFcfa(price - deposit)}</b>
              </div>
            </>
          ) : null}
          <button type="button" className="toh-btn toh-btn--dark toh-btn--lg toh-btn--block toh-btn--pill" onClick={next} disabled={!canContinue || busy}>
            {busy ? "Booking…" : step === "confirm" ? `Confirm and pay ${formatFcfa(deposit)}` : "Continue"}
          </button>
        </aside>
      </div>
    </div>
  );
}
