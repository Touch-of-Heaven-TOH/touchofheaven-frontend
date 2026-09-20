"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { AdminPageHeader, AdminPanel } from "@/features/admin/components/AdminPrimitives";
import { AuditTrail } from "@/features/admin/platform/AuditTrail";
import { SystemHealth } from "@/features/admin/platform/SystemHealth";
import { adminFetcher, adminRequest, errorMessage, isAuditKey } from "@/features/admin/lib/api";
import type { SystemConfig } from "@/features/admin/lib/admin-types";

/**
 * The switches that take features away from everyone at once.
 *
 * Every one of them is confirmed before it saves, and the confirmation
 * names the consequence rather than asking "are you sure?" - someone who
 * has read "no new accounts can be created" is making a different decision
 * from someone who has read "are you sure?".
 */

type ToggleKey =
  | "maintenanceMode"
  | "newRegistrationsEnabled"
  | "aiStudioEnabled"
  | "marketplaceEnabled";

const TOGGLES: {
  key: ToggleKey;
  label: string;
  description: string;
  /** What happens when the switch ends up in this state. */
  consequence: { on: string; off: string };
  /** Off is the dangerous direction for a feature flag; on is for maintenance. */
  dangerWhenOn: boolean;
}[] = [
  {
    key: "maintenanceMode",
    label: "Maintenance mode",
    description: "Shows a banner on every public page with the message below.",
    consequence: {
      on: "Every visitor will see the maintenance banner, signed in or not.",
      off: "The maintenance banner will disappear from every page.",
    },
    dangerWhenOn: true,
  },
  {
    key: "newRegistrationsEnabled",
    label: "New registrations",
    description: "Whether anyone can create an account.",
    consequence: {
      on: "Anyone will be able to create an account again.",
      off: "Nobody will be able to create an account. People with accounts can still sign in.",
    },
    dangerWhenOn: false,
  },
  {
    key: "aiStudioEnabled",
    label: "AI Studio",
    description: "The hairstyle try-on feature.",
    consequence: {
      on: "AI Studio will be available to everyone again.",
      off: "AI Studio will be hidden. Credits already bought are not taken away.",
    },
    dangerWhenOn: false,
  },
  {
    key: "marketplaceEnabled",
    label: "Marketplace",
    description: "Buying and selling products.",
    consequence: {
      on: "The marketplace will be open again.",
      off: "Nobody will be able to browse or order products. Existing orders are unaffected.",
    },
    dangerWhenOn: false,
  },
];

type PendingChange = {
  key: ToggleKey;
  next: boolean;
  label: string;
  consequence: string;
};

export function SystemConfiguration() {
  const { data, error, isLoading, mutate } = useSWR<{ config: SystemConfig }>(
    "/api/v1/admin/system/config",
    adminFetcher,
  );

  const { mutate: mutateAudit } = useSWRConfig();
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const config = data?.config;
  const maintenanceMessage = message ?? config?.maintenanceMessage ?? "";

  async function applyChange() {
    if (!pending) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminRequest("/api/v1/admin/system/config", "PATCH", {
        changeNote: changeNote.trim(),
        [pending.key]: pending.next,
        // Turning maintenance on needs a message to show; send whatever is
        // in the box so the two can't drift apart.
        ...(pending.key === "maintenanceMode" && pending.next
          ? { maintenanceMessage: maintenanceMessage.trim() }
          : {}),
      });
      setSaved(`${pending.label} is now ${pending.next ? "on" : "off"}.`);
      setPending(null);
      setChangeNote("");
      await mutate();
      await mutateAudit(isAuditKey);
    } catch (requestError) {
      setSaveError(errorMessage(requestError, "We couldn't save that change."));
    } finally {
      setSaving(false);
    }
  }

  async function saveMessage() {
    setSaving(true);
    setSaveError(null);
    try {
      await adminRequest("/api/v1/admin/system/config", "PATCH", {
        changeNote: "Updated the maintenance message.",
        maintenanceMessage: maintenanceMessage.trim(),
      });
      setSaved("Maintenance message saved.");
      setMessage(null);
      await mutate();
      await mutateAudit(isAuditKey);
    } catch (requestError) {
      setSaveError(errorMessage(requestError, "We couldn't save the message."));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Loading the system configuration">
        <div className="h-20 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
        <div className="h-64 animate-pulse rounded-md bg-[var(--color-surface-strong)]" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="grid justify-items-start gap-3 rounded-md border border-[var(--color-border)] bg-white p-6">
        <p className="flex items-center gap-2 font-bold text-[var(--color-danger)]">
          <TriangleAlert aria-hidden="true" size={18} />
          {errorMessage(error, "We couldn't load the system configuration.")}
        </p>
        <Button onClick={() => void mutate()}>Try again</Button>
      </div>
    );
  }

  const messageDirty =
    message !== null && message.trim() !== (config.maintenanceMessage ?? "").trim();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Administration"
        title="System configuration"
        description="Maintenance mode and the switches that turn features off across the whole platform."
      />

      <p className="mb-5 flex items-start gap-3 rounded-md border-2 border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--color-danger)]">
        <TriangleAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
        <span>
          Changes here take effect immediately, for everyone. There is no staged rollout and no
          undo beyond switching back.
        </span>
      </p>

      {saved ? (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-md bg-[var(--color-success-soft)] px-4 py-3 text-sm font-bold text-[var(--color-success)]"
        >
          <CircleCheck aria-hidden="true" size={18} />
          {saved}
        </p>
      ) : null}

      {saveError ? (
        <p
          role="alert"
          className="mb-4 rounded-md bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--color-danger)]"
        >
          {saveError}
        </p>
      ) : null}

      <div className="grid gap-4">
        <AdminPanel title="Platform status">
          <ul role="list" className="divide-y divide-[var(--color-border)]">
            {TOGGLES.map((toggle) => {
              const on = config[toggle.key];
              const dangerous = toggle.dangerWhenOn ? on : !on;
              return (
                <li
                  key={toggle.key}
                  className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-bold text-[var(--color-text-primary)]">
                      {toggle.label}
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          dangerous
                            ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                            : "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                        }`}
                      >
                        {on ? "On" : "Off"}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {toggle.description}
                    </p>
                  </div>
                  <Button
                    variant={dangerous ? "primary" : "secondary"}
                    onClick={() => {
                      setSaveError(null);
                      setSaved(null);
                      setPending({
                        key: toggle.key,
                        next: !on,
                        label: toggle.label,
                        consequence: !on ? toggle.consequence.on : toggle.consequence.off,
                      });
                    }}
                  >
                    Turn {on ? "off" : "on"}
                  </Button>
                </li>
              );
            })}
          </ul>

          {config.maintenanceMode || message !== null ? (
            <div className="mt-4 grid gap-1.5 border-t border-[var(--color-border)] pt-4">
              <label htmlFor="maintenance-message" className="text-sm font-bold">
                Maintenance message
              </label>
              <textarea
                id="maintenance-message"
                rows={3}
                value={maintenanceMessage}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--color-brand)]"
                placeholder="We're doing some work and will be back shortly."
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                Shown to every visitor while maintenance mode is on. Say roughly how long, if you
                know.
              </p>
              {messageDirty ? (
                <div className="flex gap-2">
                  <Button onClick={() => void saveMessage()} loading={saving}>
                    Save message
                  </Button>
                  <button
                    type="button"
                    onClick={() => setMessage(null)}
                    className="min-h-11 text-sm font-bold text-[var(--color-text-muted)] hover:underline"
                  >
                    Discard
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-muted)]">
              Turning maintenance mode on will ask you for the message visitors see.{" "}
              <button
                type="button"
                onClick={() => setMessage(config.maintenanceMessage ?? "")}
                className="font-bold text-[var(--color-brand)] hover:underline"
              >
                Write it now
              </button>
              .
            </p>
          )}
        </AdminPanel>

        <SystemHealth />

        <AuditTrail
          event="SYSTEM_CONFIG_UPDATED"
          title="Configuration history"
          emptyText="No configuration changes recorded yet."
        />
      </div>

      <Modal
        open={pending !== null}
        onClose={() => (saving ? undefined : setPending(null))}
        title={pending ? `Turn ${pending.label.toLowerCase()} ${pending.next ? "on" : "off"}?` : ""}
      >
        {pending ? (
          <div className="grid gap-4">
            <p className="flex items-start gap-2 rounded-md bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-bold text-[var(--color-warning)]">
              <TriangleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              {pending.consequence} This affects all users immediately.
            </p>

            {pending.key === "maintenanceMode" && pending.next ? (
              <div className="grid gap-1.5">
                <label htmlFor="pending-maintenance-message" className="text-sm font-bold">
                  What should visitors see? <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="pending-maintenance-message"
                  required
                  rows={3}
                  value={maintenanceMessage}
                  onChange={(event) => setMessage(event.target.value)}
                  className="w-full rounded-md border border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--color-brand)]"
                  placeholder="We're doing some work and will be back shortly."
                />
              </div>
            ) : null}

            <div className="grid gap-1.5">
              <label htmlFor="system-change-note" className="text-sm font-bold">
                Why? <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="system-change-note"
                required
                rows={2}
                value={changeNote}
                onChange={(event) => setChangeNote(event.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] p-3 text-sm outline-none focus:border-[var(--color-brand)]"
                placeholder="e.g. Database migration, expected to take an hour."
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                Recorded against the change with your name. At least a few words.
              </p>
            </div>

            {saveError ? (
              <p
                role="alert"
                className="rounded-md bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-bold text-[var(--color-danger)]"
              >
                {saveError}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setPending(null)} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={() => void applyChange()}
                loading={saving}
                disabled={
                  changeNote.trim().length < 10 ||
                  (pending.key === "maintenanceMode" &&
                    pending.next &&
                    maintenanceMessage.trim().length === 0)
                }
              >
                Yes, turn it {pending.next ? "on" : "off"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
