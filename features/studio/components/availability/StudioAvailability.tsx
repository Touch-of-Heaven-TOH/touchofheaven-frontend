"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Input } from "@/components/shared/Input";
import {
  BLOCK_TYPE_LABEL,
  BlockTimeDialog,
} from "@/features/studio/components/calendar/BlockTimeDialog";
import {
  Card,
  EmptyPanel,
  FormError,
  PageHeader,
  SelectField,
  SkeletonRows,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { WEEKDAY_LONG, formatDateTime } from "@/features/studio/lib/format";
import type {
  AvailabilityRule,
  BlockType,
  OwnLocation,
} from "@/features/studio/lib/types";

type Profile = {
  slotIntervalMinutes: number;
  bufferMinutes: number;
  leadTimeHours: number;
  acceptsNewClients: boolean;
  timezone: string;
};

type Period = { id: string; startAt: string; endAt: string; reason: string | null; blockType: BlockType };

// Monday first - the way a working week is read.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function StudioAvailability() {
  const rules = useSWR<{ rules: AvailabilityRule[] }>("/api/v1/availability/rules", studioFetcher);
  const locations = useSWR<{ locations: OwnLocation[] }>("/api/v1/braiders/locations", studioFetcher);
  const profile = useSWR<{ profile: Profile }>("/api/v1/braiders/profile", studioFetcher);

  const loading = (rules.isLoading && !rules.data) || (locations.isLoading && !locations.data);
  const failed = (rules.error && !rules.data) || (locations.error && !locations.data);

  return (
    <div className="grid *:min-w-0 gap-5">
      <PageHeader title="Availability" description="Your weekly hours, booking rules and time off." />
      {loading ? (
        <SkeletonRows label="Loading availability" rows={4} />
      ) : failed ? (
        <ErrorState
          description="We couldn't load your availability."
          onRetry={() => {
            void rules.mutate();
            void locations.mutate();
          }}
        />
      ) : (
        <div className="grid *:min-w-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <WeeklyHours
            rules={rules.data?.rules ?? []}
            locations={locations.data?.locations ?? []}
            onChanged={() => void rules.mutate()}
          />
          <div className="grid *:min-w-0 content-start gap-4">
            {profile.data ? (
              <BookingRules key={JSON.stringify(profile.data.profile)} profile={profile.data.profile} onSaved={() => void profile.mutate()} />
            ) : null}
            <TimeOff />
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyHours({
  rules,
  locations,
  onChanged,
}: {
  rules: AvailabilityRule[];
  locations: OwnLocation[];
  onChanged: () => void;
}) {
  const { timezone } = useStudio();

  if (locations.length === 0) {
    return (
      <Card title="Weekly hours">
        <EmptyPanel
          title="Add a location first"
          description="Working hours belong to a place you work from. Finish your business setup to add one."
        />
      </Card>
    );
  }

  return (
    <Card title="Weekly hours">
      <p className="mb-4 text-sm text-[var(--color-text-muted)]">Clients can book inside these hours ({timezone}).</p>
      <ul className="grid *:min-w-0 gap-3">
        {DAY_ORDER.map((day) => (
          <li key={day}>
            <DayRow
              day={day}
              rules={rules.filter((rule) => rule.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime))}
              locations={locations}
              onChanged={onChanged}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DayRow({
  day,
  rules,
  locations,
  onChanged,
}: {
  day: number;
  rules: AvailabilityRule[];
  locations: OwnLocation[];
  onChanged: () => void;
}) {
  const notify = useToast();
  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setError(null);
    if (end <= start) return setError("The end time must be after the start time.");
    setPending("add");
    try {
      await studioRequest("/api/v1/availability/rules", "POST", {
        locationId,
        dayOfWeek: day,
        startTime: start,
        endTime: end,
      });
      notify({ tone: "success", title: `${WEEKDAY_LONG[day]} hours added` });
      setAdding(false);
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const remove = async (ruleId: string) => {
    setPending(ruleId);
    setError(null);
    try {
      await studioRequest(`/api/v1/availability/rules/${ruleId}`, "DELETE");
      notify({ tone: "success", title: "Hours removed" });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  };

  const locationLabel = (id: string) => locations.find((location) => location.id === id)?.label ?? "";

  return (
    <div className="rounded-xl border border-[var(--color-border)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="w-28 shrink-0 font-semibold text-[var(--color-text-primary)]">{WEEKDAY_LONG[day]}</p>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {rules.length === 0 ? (
            <span className="text-sm text-[var(--color-text-muted)]">Closed</span>
          ) : (
            rules.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-soft)] py-1 pr-1 pl-3 text-sm font-semibold text-[var(--color-brand)]"
              >
                {rule.startTime}–{rule.endTime}
                {locations.length > 1 ? (
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">· {locationLabel(rule.locationId)}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => void remove(rule.id)}
                  disabled={pending !== null}
                  aria-label={`Remove ${WEEKDAY_LONG[day]} ${rule.startTime} to ${rule.endTime}`}
                  className="grid size-7 place-items-center rounded-full hover:bg-white disabled:opacity-50"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
        {!adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-soft)]"
          >
            <Plus aria-hidden="true" className="size-4" />
            Add hours
          </button>
        ) : null}
      </div>
      {adding ? (
        <div className="mt-3 grid gap-3 border-t border-[var(--color-border)] pt-3">
          <div className="grid *:min-w-0 gap-3 sm:grid-cols-2">
            <Input label="From" type="time" value={start} onChange={(event) => setStart(event.target.value)} />
            <Input label="To" type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
          </div>
          {locations.length > 1 ? (
            <SelectField label="Location" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </SelectField>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button loading={pending === "add"} onClick={() => void add()}>
              Save hours
            </Button>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="mt-2">
          <FormError message={error} />
        </div>
      ) : null}
    </div>
  );
}

function BookingRules({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const notify = useToast();
  const [slot, setSlot] = useState(String(profile.slotIntervalMinutes));
  const [buffer, setBuffer] = useState(String(profile.bufferMinutes));
  const [lead, setLead] = useState(String(profile.leadTimeHours));
  const [acceptsNew, setAcceptsNew] = useState(profile.acceptsNewClients);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    const values = { slotIntervalMinutes: Number(slot), bufferMinutes: Number(buffer), leadTimeHours: Number(lead) };
    if (!Object.values(values).every(Number.isInteger)) return setError("Use whole numbers.");
    setSaving(true);
    try {
      await studioRequest("/api/v1/braiders/profile", "PATCH", { ...values, acceptsNewClients: acceptsNew });
      notify({ tone: "success", title: "Booking rules saved" });
      onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Booking rules">
      <div className="grid *:min-w-0 gap-4">
        <SelectField label="Show start times every" value={slot} onChange={(event) => setSlot(event.target.value)}>
          {[15, 30, 45, 60].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} minutes
            </option>
          ))}
        </SelectField>
        <Input
          label="Break between appointments (minutes)"
          inputMode="numeric"
          value={buffer}
          onChange={(event) => setBuffer(event.target.value)}
          helperText="Time to clean up and reset before the next client."
        />
        <Input
          label="Minimum notice (hours)"
          inputMode="numeric"
          value={lead}
          onChange={(event) => setLead(event.target.value)}
          helperText="How far ahead clients must book."
        />
        <label className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-primary)]">
          <input
            type="checkbox"
            checked={acceptsNew}
            onChange={(event) => setAcceptsNew(event.target.checked)}
            className="size-4 accent-[var(--color-brand)]"
          />
          Accepting new clients
        </label>
        <FormError message={error} />
        <div className="flex justify-end">
          <Button loading={saving} onClick={() => void save()}>
            Save rules
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TimeOff() {
  const { timezone } = useStudio();
  const notify = useToast();
  const { data, mutate } = useSWR<{ periods: Period[] }>("/api/v1/availability/blocked-periods", studioFetcher);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const upcoming = (data?.periods ?? [])
    .filter((period) => new Date(period.endAt) > new Date())
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <Card
      title="Time off & blocked time"
      action={
        <Button variant="secondary" className="!min-h-9" leadingIcon={<Plus aria-hidden="true" className="size-4" />} onClick={() => setOpen(true)}>
          Add
        </Button>
      }
    >
      {upcoming.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Nothing blocked in the future.</p>
      ) : (
        <ul className="grid *:min-w-0 gap-2">
          {upcoming.map((period) => (
            <li key={period.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2">
              <Lock aria-hidden="true" className="size-4 shrink-0 text-[var(--color-text-muted)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{BLOCK_TYPE_LABEL[period.blockType]}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {formatDateTime(period.startAt, timezone)} → {formatDateTime(period.endAt, timezone)}
                </p>
              </div>
              <button
                type="button"
                disabled={pending !== null}
                aria-label="Remove blocked time"
                onClick={async () => {
                  setPending(period.id);
                  try {
                    await studioRequest(`/api/v1/availability/blocked-periods/${period.id}`, "DELETE");
                    notify({ tone: "success", title: "Blocked time removed" });
                    void mutate();
                  } catch (caught) {
                    notify({ tone: "error", title: "Could not remove it", description: errorMessage(caught) });
                  } finally {
                    setPending(null);
                  }
                }}
                className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] disabled:opacity-50"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <BlockTimeDialog
          open
          onClose={() => {
            setOpen(false);
            void mutate();
          }}
        />
      ) : null}
    </Card>
  );
}
