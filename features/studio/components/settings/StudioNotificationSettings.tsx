"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { SettingsFrame } from "@/features/studio/components/settings/SettingsFrame";
import { useToast } from "@/features/studio/components/ui/Toaster";
import { SkeletonRows } from "@/features/studio/components/ui/primitives";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";

/**
 * How the business hears about its own work. Same endpoint and same
 * preference rows the client notification screen uses; only the list of
 * things worth being told about differs.
 *
 * Each row here is a notification the platform actually sends. Anything it
 * doesn't send yet has no switch, because a switch over nothing teaches
 * someone the wrong thing about what will reach them.
 */

type Channel = "EMAIL" | "SMS";

type PreferenceRow = {
  category: "OPERATIONAL" | "MARKETING" | null;
  notificationType: string | null;
  channel: "EMAIL" | "SMS" | "PUSH";
  isEnabled: boolean;
  updatedAt?: string;
};

type Group = {
  title: string;
  description: string;
  items: { type: string; label: string; description: string; channels: Channel[] }[];
};

const GROUPS: Group[] = [
  {
    title: "Bookings",
    description: "The day-to-day of a working calendar.",
    items: [
      {
        type: "APPOINTMENT_CONFIRMED",
        label: "Booking confirmed",
        description: "A client paid their deposit and the slot is yours.",
        channels: ["EMAIL", "SMS"],
      },
      {
        type: "APPOINTMENT_CANCELLED",
        label: "Booking cancelled",
        description: "A client cancelled, and the slot is free again.",
        channels: ["EMAIL", "SMS"],
      },
      {
        type: "APPOINTMENT_CHANGE_REQUEST_UPDATE",
        label: "Reschedule or cancellation request",
        description: "A client asked for a change and is waiting on you.",
        channels: ["EMAIL", "SMS"],
      },
      {
        type: "APPOINTMENT_REMINDER_24H",
        label: "Reminder — a day before",
        description: "What tomorrow looks like.",
        channels: ["EMAIL", "SMS"],
      },
      {
        type: "APPOINTMENT_REMINDER_2H",
        label: "Reminder — two hours before",
        description: "The next client, shortly before they arrive.",
        channels: ["EMAIL", "SMS"],
      },
      {
        type: "WAITLIST_SLOT_OFFERED",
        label: "Waitlist offer sent",
        description: "A cancelled slot was offered to someone waiting.",
        channels: ["EMAIL"],
      },
    ],
  },
  {
    title: "Money and team",
    description: "Deposits, payouts and the people you work with.",
    items: [
      {
        type: "DEPOSIT_RECEIVED",
        label: "Deposit received",
        description: "A deposit landed for a new booking.",
        channels: ["EMAIL"],
      },
      {
        type: "BALANCE_RECEIPT",
        label: "Balance recorded",
        description: "The rest of a service was taken at the appointment.",
        channels: ["EMAIL"],
      },
      {
        type: "PAYOUT_SENT",
        label: "Payout sent",
        description: "Your earnings are on their way to your account.",
        channels: ["EMAIL", "SMS"],
      },
      {
        type: "TEAM_INVITATION",
        label: "Team invitation answered",
        description: "Someone you invited accepted or declined.",
        channels: ["EMAIL"],
      },
      {
        type: "RESOLUTION_CASE_UPDATE",
        label: "Dispute update",
        description: "A case involving one of your appointments moved on.",
        channels: ["EMAIL"],
      },
    ],
  },
  {
    title: "From Touch of Heaven",
    description: "Off by default. Nothing here is about your bookings.",
    items: [
      {
        type: "PROMOTIONAL_OFFER",
        label: "Offers and platform news",
        description: "New features and occasional offers for businesses.",
        channels: ["EMAIL"],
      },
      {
        type: "SEASONAL_CAMPAIGN",
        label: "Seasonal campaigns",
        description: "Promotions you can opt into, around busy periods.",
        channels: ["EMAIL"],
      },
    ],
  },
];

const MARKETING_TYPES = new Set(["PROMOTIONAL_OFFER", "SEASONAL_CAMPAIGN"]);

export function StudioNotificationSettings() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useSWR<{ preferences: PreferenceRow[] }>(
    "/api/v1/notifications/preferences",
    studioFetcher,
  );
  const [pending, setPending] = useState<string | null>(null);

  const preferences = data?.preferences ?? [];

  function rowFor(type: string, channel: Channel) {
    return preferences.find(
      (preference) => preference.notificationType === type && preference.channel === channel,
    );
  }

  /** No row yet means the platform default: operational on, marketing off. */
  function isOn(type: string, channel: Channel) {
    const row = rowFor(type, channel);
    if (row) return row.isEnabled;
    const category = preferences.find(
      (preference) =>
        preference.category === (MARKETING_TYPES.has(type) ? "MARKETING" : "OPERATIONAL") &&
        preference.channel === channel,
    );
    if (category) return category.isEnabled;
    return !MARKETING_TYPES.has(type);
  }

  async function toggle(type: string, channel: Channel, label: string) {
    const key = `${type}:${channel}`;
    setPending(key);
    try {
      await studioRequest("/api/v1/notifications/preferences", "PATCH", {
        notificationType: type,
        channel,
        isEnabled: !isOn(type, channel),
      });
      await mutate();
      toast({
        tone: "success",
        title: `${label}: ${!isOn(type, channel) ? "on" : "off"} for ${channel === "EMAIL" ? "email" : "SMS"}.`,
      });
    } catch (toggleError) {
      toast({ tone: "error", title: errorMessage(toggleError, "We couldn't save that choice.") });
    } finally {
      setPending(null);
    }
  }

  return (
    <SettingsFrame
      current="notifications"
      title="Notifications"
      description="What reaches you, and how. Each one saves as soon as you change it."
    >
      {isLoading ? (
        <SkeletonRows rows={6} label="Loading your notification settings" />
      ) : error ? (
        <div className="grid justify-items-start gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="font-semibold">We couldn&apos;t load your notification settings.</p>
          <Button onClick={() => void mutate()}>Try again</Button>
        </div>
      ) : (
        <div className="grid gap-5">
          {GROUPS.map((group) => {
            const latest = group.items
              .flatMap((item) => item.channels.map((channel) => rowFor(item.type, channel)?.updatedAt))
              .filter(Boolean)
              .sort()
              .at(-1);
            return (
              <section
                key={group.title}
                className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <header className="border-b border-[var(--color-border)] p-5">
                  <h2 className="font-semibold text-[var(--color-text-primary)]">{group.title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{group.description}</p>
                  {latest ? (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Last updated {new Date(latest).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  ) : null}
                </header>
                <ul role="list" className="divide-y divide-[var(--color-border)]">
                  {group.items.map((item) => (
                    <li key={item.type} className="flex flex-wrap items-start justify-between gap-4 p-5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--color-text-primary)]">{item.label}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {item.channels.map((channel) => {
                          const key = `${item.type}:${channel}`;
                          const on = isOn(item.type, channel);
                          return (
                            <label key={channel} className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                              <input
                                type="checkbox"
                                checked={on}
                                disabled={pending === key}
                                onChange={() => void toggle(item.type, channel, item.label)}
                                className="size-4 accent-[var(--color-brand)]"
                              />
                              {channel === "EMAIL" ? "Email" : "SMS"}
                              {pending === key ? (
                                <Loader2 aria-hidden="true" className="animate-spin text-[var(--color-brand)]" size={14} />
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <p className="text-sm text-[var(--color-text-muted)]">
            Reviews, failed payouts and a monthly summary aren&apos;t here yet: the platform doesn&apos;t send
            them, so there is nothing to switch on. They&apos;ll appear once it does.
          </p>
        </div>
      )}
    </SettingsFrame>
  );
}
