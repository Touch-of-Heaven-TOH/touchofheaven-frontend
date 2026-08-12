"use client";

import { useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { browserApiFetch } from "@/lib/api/browser";

type Category = "OPERATIONAL" | "MARKETING";
type Channel = "EMAIL" | "SMS" | "PUSH";

type PreferenceRow = {
  category: Category | null;
  notificationType: string | null;
  channel: Channel;
  isEnabled: boolean;
};

type PreferencesResponse = { preferences: PreferenceRow[] };

const CATEGORIES: { value: Category; label: string; description: string }[] = [
  {
    value: "OPERATIONAL",
    label: "Appointment & account updates",
    description: "Booking confirmations, reminders, receipts, security alerts.",
  },
  {
    value: "MARKETING",
    label: "Offers & promotions",
    description: "Deals, new braiders in your area, seasonal campaigns.",
  },
];

const CHANNELS: { value: Channel; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "PUSH", label: "Push" },
];

// Only consulted when no explicit override row exists for a category -
// mirrors the backend's own default policy (notification.constants.ts's
// defaultIsEnabled): operational notifications default on, marketing
// defaults off until the user opts in.
function defaultForCategory(category: Category) {
  return category === "OPERATIONAL";
}

function fetchPreferences(path: string): Promise<PreferencesResponse> {
  return browserApiFetch<PreferencesResponse>(path);
}

export function NotificationPreferences() {
  const { data, error, isLoading, mutate } = useSWR<PreferencesResponse>(
    "/api/v1/notifications/preferences",
    fetchPreferences,
  );
  const [pending, setPending] = useState<string | null>(null);

  const preferences = data?.preferences ?? [];

  function currentValue(category: Category, channel: Channel) {
    const override = preferences.find(
      (pref) => pref.category === category && pref.channel === channel,
    );
    return override ? override.isEnabled : defaultForCategory(category);
  }

  async function toggle(category: Category, channel: Channel) {
    const key = `${category}:${channel}`;
    setPending(key);
    try {
      await browserApiFetch("/api/v1/notifications/preferences", {
        method: "PATCH",
        body: { category, channel, isEnabled: !currentValue(category, channel) },
      });
      await mutate();
    } finally {
      setPending(null);
    }
  }

  if (isLoading) return <LoadingSkeleton label="Loading notification preferences" lines={4} />;
  if (error) {
    return (
      <ErrorState description="We couldn't load your notification preferences." onRetry={() => void mutate()} />
    );
  }

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase text-[var(--color-brand)]">Account</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
          Notification preferences
        </h1>
      </div>

      <div className="grid gap-4">
        {CATEGORIES.map((category) => (
          <div key={category.value} className="surface-panel p-4">
            <p className="font-semibold text-[var(--color-text-primary)]">{category.label}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{category.description}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              {CHANNELS.map((channel) => {
                const key = `${category.value}:${channel.value}`;
                const enabled = currentValue(category.value, channel.value);
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]"
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={pending === key}
                      onChange={() => void toggle(category.value, channel.value)}
                    />
                    {channel.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        These settings apply to notification categories as a whole. Fine-grained control over
        individual notification types isn&apos;t available yet.
      </p>
    </section>
  );
}
