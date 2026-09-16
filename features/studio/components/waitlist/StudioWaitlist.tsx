"use client";

import { CalendarSearch, Clock, Hourglass, Sparkles } from "lucide-react";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Input } from "@/components/shared/Input";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  Avatar,
  EmptyPanel,
  FormError,
  PageHeader,
  Pill,
  Segmented,
  SkeletonRows,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioFetcher, studioRequest, withQuery } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  WEEKDAY_SHORT,
  dateKeyIn,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatTime,
  keyToLabel,
} from "@/features/studio/lib/format";
import type {
  OpeningsResponse,
  WaitlistEntry,
  WaitlistResponse,
  WaitlistWindow,
} from "@/features/studio/lib/types";

const WINDOW_LABEL: Record<WaitlistWindow, string> = {
  ANY: "Any time",
  MORNING: "Mornings",
  AFTERNOON: "Afternoons",
  EVENING: "Evenings",
};

const STATUS: Record<WaitlistEntry["status"], { label: string; tone: "info" | "warning" | "success" | "neutral" }> = {
  ACTIVE: { label: "Waiting", tone: "info" },
  OFFERED: { label: "Offer sent", tone: "warning" },
  BOOKED: { label: "Booked", tone: "success" },
  CANCELLED: { label: "Removed", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};

export function StudioWaitlist() {
  const studio = useStudio();
  const [status, setStatus] = useState<"open" | "all">("open");
  const key = withQuery("/api/v1/business/waitlist", { status });
  const { data, error, isLoading, mutate } = useSWR<WaitlistResponse>(key, studioFetcher);
  const [offering, setOffering] = useState<WaitlistEntry | null>(null);
  const canManage = studio.can("waitlist", "manage");

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader
        title="Waitlist"
        description="Clients waiting for an opening. Offer a time and it is held for them for 2 hours."
      />

      <Segmented
        label="Waitlist filter"
        value={status}
        onChange={setStatus}
        options={[
          {
            value: "open",
            label: "Open",
            ...(data ? { count: data.counts.active + data.counts.offered } : {}),
          },
          { value: "all", label: "All" },
        ]}
      />

      {isLoading && !data ? (
        <SkeletonRows label="Loading waitlist" />
      ) : error && !data ? (
        <ErrorState description="We couldn't load the waitlist." onRetry={() => void mutate()} />
      ) : !data || data.entries.length === 0 ? (
        <EmptyPanel
          icon={<Hourglass aria-hidden="true" className="size-6" />}
          title="Nobody is waiting"
          description="When a client can't find a time that suits them, they can join your waitlist from your booking page."
        />
      ) : (
        <ol className="grid *:min-w-0 gap-3">
          {data.entries.map((entry, index) => (
            <li key={entry.id}>
              <EntryCard
                entry={entry}
                position={index + 1}
                showPosition={status === "open"}
                canManage={canManage}
                onOffer={() => setOffering(entry)}
                onChanged={() => void mutate()}
              />
            </li>
          ))}
        </ol>
      )}

      {offering ? (
        <OfferDialog entry={offering} onClose={() => setOffering(null)} onOffered={() => void mutate()} />
      ) : null}
    </div>
  );
}

function EntryCard({
  entry,
  position,
  showPosition,
  canManage,
  onOffer,
  onChanged,
}: {
  entry: WaitlistEntry;
  position: number;
  showPosition: boolean;
  canManage: boolean;
  onOffer: () => void;
  onChanged: () => void;
}) {
  const { timezone } = useStudio();
  const notify = useToast();
  const [pending, setPending] = useState<"withdraw" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const status = STATUS[entry.status];

  const act = async (kind: "withdraw" | "remove") => {
    setPending(kind);
    setError(null);
    try {
      if (kind === "withdraw" && entry.activeOffer) {
        await studioRequest(`/api/v1/business/waitlist/offers/${entry.activeOffer.id}`, "DELETE");
        notify({ tone: "success", title: "Offer withdrawn", description: "The time is free for other clients again." });
      } else {
        await studioRequest(`/api/v1/business/waitlist/${entry.id}`, "DELETE");
        notify({ tone: "success", title: "Removed from the waitlist" });
      }
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const days =
    entry.preferredDays.length === 0
      ? "Any day"
      : entry.preferredDays.map((day) => WEEKDAY_SHORT[day]).join(", ");
  const open = entry.status === "ACTIVE" || entry.status === "OFFERED";

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)]">
      <div className="flex items-start gap-3">
        {showPosition ? (
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-strong)] text-sm font-bold text-[var(--color-text-muted)]">
            {position}
          </span>
        ) : null}
        <Avatar name={entry.customer.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate font-semibold text-[var(--color-text-primary)]">{entry.customer.name}</h2>
            <Pill tone={status.tone}>{status.label}</Pill>
          </div>
          <p className="truncate text-sm text-[var(--color-text-muted)]">
            {entry.service.name} · {formatDuration(entry.service.durationMins)} · {formatMoney(entry.service.priceCents)}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-primary)]">
            {keyToLabel(entry.earliestDate, { month: "short", day: "numeric" })} –{" "}
            {keyToLabel(entry.latestDate, { month: "short", day: "numeric", year: "numeric" })} ·{" "}
            {WINDOW_LABEL[entry.preferredWindow]} · {days}
          </p>
          {entry.notes ? (
            <p className="mt-1 text-sm break-words text-[var(--color-text-muted)]">“{entry.notes}”</p>
          ) : null}
          {entry.activeOffer ? (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl bg-[var(--color-warning-soft)] px-3 py-2 text-sm text-[var(--color-text-primary)]">
              <Clock aria-hidden="true" className="size-4 shrink-0 text-[var(--color-warning)]" />
              Offered {formatDateTime(entry.activeOffer.startAt, timezone)} · held until{" "}
              {formatTime(entry.activeOffer.expiresAt, timezone)}
            </p>
          ) : null}
        </div>
      </div>
      {canManage && open ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-3">
          <Button variant="ghost" loading={pending === "remove"} disabled={pending !== null} onClick={() => void act("remove")}>
            Remove
          </Button>
          {entry.activeOffer ? (
            <Button variant="secondary" loading={pending === "withdraw"} disabled={pending !== null} onClick={() => void act("withdraw")}>
              Withdraw offer
            </Button>
          ) : (
            <Button leadingIcon={<CalendarSearch aria-hidden="true" className="size-4" />} onClick={onOffer}>
              Find an opening
            </Button>
          )}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </article>
  );
}

function OfferDialog({
  entry,
  onClose,
  onOffered,
}: {
  entry: WaitlistEntry;
  onClose: () => void;
  onOffered: () => void;
}) {
  const { timezone } = useStudio();
  const notify = useToast();
  const { mutate } = useSWRConfig();
  const today = dateKeyIn(new Date(), timezone);
  const [date, setDate] = useState(entry.earliestDate > today ? entry.earliestDate : today);
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, error: openingsError, isLoading } = useSWR<OpeningsResponse>(
    date ? withQuery(`/api/v1/business/waitlist/${entry.id}/openings`, { date }) : null,
    studioFetcher,
  );

  const send = async () => {
    if (!selected) {
      setError("Choose one of the open times first.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await studioRequest(`/api/v1/business/waitlist/${entry.id}/offers`, "POST", { startAt: selected });
      notify({
        tone: "success",
        title: "Offer sent",
        description: `${entry.customer.name} has been emailed and the time is held for them.`,
      });
      await mutate((key) => typeof key === "string" && key.startsWith("/api/v1/business/overview"));
      onOffered();
      onClose();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSending(false);
    }
  };

  return (
    <StudioDialog
      open
      onClose={onClose}
      title={`Offer a time to ${entry.customer.name}`}
      description={`${entry.service.name} · ${formatDuration(entry.service.durationMins)}. Times in ${timezone}.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={sending} disabled={!selected} onClick={() => void send()}>
            Send offer
          </Button>
        </>
      }
    >
      <div className="grid *:min-w-0 gap-4">
        <Input
          label="Date"
          type="date"
          min={today}
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setSelected(null);
          }}
          helperText={`They asked for ${keyToLabel(entry.earliestDate, { month: "short", day: "numeric" })} – ${keyToLabel(entry.latestDate, { month: "short", day: "numeric" })}, ${WINDOW_LABEL[entry.preferredWindow].toLowerCase()}.`}
        />
        {isLoading ? (
          <div role="status" className="h-24 animate-pulse rounded-xl bg-[var(--color-skeleton)]">
            <span className="sr-only">Finding open times</span>
          </div>
        ) : openingsError ? (
          <FormError message={errorMessage(openingsError)} />
        ) : data ? (
          data.slots.length === 0 ? (
            <p className="rounded-xl bg-[var(--color-surface-strong)] p-4 text-sm text-[var(--color-text-muted)]">
              No open times on this day. Try another date.
            </p>
          ) : (
            <fieldset className="grid *:min-w-0 gap-2">
              <legend className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">Open times</legend>
              {!data.withinRequestedDates ? (
                <p className="text-xs text-[var(--color-warning)]">This day is outside the dates the client asked for.</p>
              ) : null}
              <div className="grid *:min-w-0 grid-cols-3 gap-2 sm:grid-cols-4">
                {data.slots.map((slot) => {
                  const isSelected = selected === slot.startAt;
                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelected(slot.startAt)}
                      className={`flex min-h-12 flex-col items-center justify-center rounded-xl border px-2 text-sm font-semibold ${
                        isSelected
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                          : slot.matchesPreference
                            ? "border-[var(--color-success)]/40 bg-[var(--color-success-soft)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                            : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                      }`}
                    >
                      {formatTime(slot.startAt, timezone)}
                      {slot.matchesPreference ? (
                        <span className={`flex items-center gap-0.5 text-[10px] ${isSelected ? "text-white/85" : "text-[var(--color-success)]"}`}>
                          <Sparkles aria-hidden="true" className="size-3" />
                          Best fit
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )
        ) : null}
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}
