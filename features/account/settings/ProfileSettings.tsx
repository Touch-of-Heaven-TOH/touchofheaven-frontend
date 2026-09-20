"use client";

import { Camera, Loader2, Mail, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Input } from "@/components/shared/Input";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/components/feedback/ToastProvider";
import { SettingsShell } from "@/features/account/settings/SettingsShell";
import { errorMessage, useCustomerProfile, type CustomerProfile } from "@/features/account/settings/api";
import { browserApiFetch } from "@/lib/api/browser";

/**
 * The client's own details. Everything here is already known by the time
 * someone finishes registering, so the form opens filled in and the Save
 * button only sends what actually changed.
 */

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

type FormState = {
  displayName: string;
  preferredName: string;
  phoneNumberE164: string;
  preferredLanguage: string;
  timezone: string;
};

function toForm(profile: CustomerProfile): FormState {
  return {
    displayName: profile.displayName ?? "",
    preferredName: profile.preferredName ?? "",
    phoneNumberE164: profile.phoneNumberE164 ?? "",
    preferredLanguage: profile.preferredLanguage || "en",
    timezone: profile.timezone || browserTimezone(),
  };
}

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function timezoneOptions(current: string) {
  const supported =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  const all = supported.length > 0 ? supported : [browserTimezone(), "UTC"];
  return all.includes(current) ? all : [current, ...all];
}

function initialsOf(profile: CustomerProfile) {
  const source = profile.displayName || `${profile.firstName} ${profile.lastName}`;
  return (
    source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ProfileSettings() {
  const { data, error, isLoading, mutate } = useCustomerProfile();
  const profile = data?.profile;
  const toast = useToast();

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [emailHelpOpen, setEmailHelpOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Fill the form the first time the profile arrives, and whenever it is
  // re-fetched while the form has no edits of its own.
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile) return;
    const stamp = `${profile.userId}:${profile.displayName}:${profile.phoneNumberE164}:${profile.timezone}:${profile.preferredLanguage}:${profile.preferredName}`;
    if (loadedFor.current === stamp) return;
    loadedFor.current = stamp;
    setForm(toForm(profile));
  }, [profile]);

  const dirty = useMemo(() => {
    if (!profile || !form) return false;
    const original = toForm(profile);
    return (Object.keys(original) as (keyof FormState)[]).some((key) => original[key] !== form[key]);
  }, [profile, form]);

  // Closing the tab mid-edit asks first. Next's router has no blocking
  // hook, so in-app navigation is covered by the banner below instead.
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (isLoading || (!profile && !error)) {
    return (
      <SettingsShell current="profile" title="Profile">
        <LoadingSkeleton label="Loading your profile" lines={6} />
      </SettingsShell>
    );
  }

  if (error || !profile || !form) {
    return (
      <SettingsShell current="profile" title="Profile">
        <ErrorState description="We couldn't load your profile." onRetry={() => void mutate()} />
      </SettingsShell>
    );
  }

  function set<TKey extends keyof FormState>(key: TKey, value: FormState[TKey]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !profile) return;
    if (!form.displayName.trim()) {
      setFieldError("Your name can't be empty.");
      return;
    }
    setFieldError(null);
    setSaving(true);
    try {
      const original = toForm(profile);
      const changes: Record<string, string> = {};
      for (const key of Object.keys(original) as (keyof FormState)[]) {
        if (original[key] !== form[key]) changes[key] = form[key];
      }
      // An empty phone box means "remove it", which the API takes as an
      // absent value rather than an empty string.
      if (changes.phoneNumberE164 === "") delete changes.phoneNumberE164;
      await browserApiFetch("/api/v1/customer/me", { method: "PATCH", body: changes });
      await mutate();
      toast.success("Profile saved.");
    } catch (saveError) {
      const message = errorMessage(saveError, "We couldn't save your profile.");
      setFieldError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    setPhotoBusy(true);
    try {
      const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const presign = await browserApiFetch<{ uploadUrl: string; key: string }>(
        "/api/v1/customer/avatar/upload-url",
        { method: "POST", body: { fileExtension: extension } },
      );
      const uploaded = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });
      if (!uploaded.ok) throw new Error("The photo could not be uploaded.");
      await browserApiFetch("/api/v1/customer/me", {
        method: "PATCH",
        body: { avatarObjectKey: presign.key },
      });
      await mutate();
      toast.success("Photo updated.");
    } catch (uploadError) {
      toast.error(errorMessage(uploadError, "We couldn't update your photo."));
    } finally {
      setPhotoBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    try {
      await browserApiFetch("/api/v1/customer/me", {
        method: "PATCH",
        body: { avatarObjectKey: "" },
      });
      await mutate();
      toast.success("Photo removed.");
    } catch (removeError) {
      toast.error(errorMessage(removeError, "We couldn't remove your photo."));
    } finally {
      setPhotoBusy(false);
    }
  }

  const zones = timezoneOptions(form.timezone);

  return (
    <SettingsShell
      current="profile"
      title="Profile"
      description="Your name, photo and contact details. Providers see your name and preferred name when you book."
    >
      <form className="grid gap-6" onSubmit={(event) => void save(event)}>
        <section className="surface-panel p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Photo</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {profile.avatarUrl ? (
              // Object storage isn't a next/image host in this app.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Your profile photo"
                className="size-20 rounded-full object-cover ring-2 ring-[var(--color-border)]"
                src={profile.avatarUrl}
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-20 place-items-center rounded-full bg-[var(--color-brand)] font-serif text-2xl font-semibold text-[var(--color-gold-light)]"
              >
                {initialsOf(profile)}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                id="profile-photo"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
              <label
                htmlFor="profile-photo"
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-brand)] px-4 text-sm font-bold text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]"
              >
                {photoBusy ? (
                  <Loader2 aria-hidden="true" className="animate-spin" size={17} />
                ) : (
                  <Camera aria-hidden="true" size={17} />
                )}
                {profile.avatarUrl ? "Change photo" : "Upload photo"}
              </label>
              {profile.avatarObjectKey ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void removePhoto()}
                  disabled={photoBusy}
                  leadingIcon={<Trash2 size={16} aria-hidden="true" />}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            JPG, PNG or WebP. Your photo is shown to a provider once you have an appointment with them.
          </p>
        </section>

        <section className="surface-panel grid gap-4 p-5">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Your details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Name"
              required
              value={form.displayName}
              onChange={(event) => set("displayName", event.target.value)}
              helperText="Shown to providers you book with."
              error={fieldError && !form.displayName.trim() ? fieldError : undefined}
            />
            <Input
              label="Preferred name"
              value={form.preferredName}
              onChange={(event) => set("preferredName", event.target.value)}
              helperText="Optional. What you'd like to be called at the appointment."
            />
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Email</span>
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 truncate rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2.5 text-sm text-[var(--color-text-muted)]">
                {profile.email}
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEmailHelpOpen(true)}
                leadingIcon={<Mail size={16} aria-hidden="true" />}
              >
                Change email
              </Button>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              Your email is how you sign in and where bookings are confirmed.
            </p>
          </div>

          <Input
            label="Phone number"
            type="tel"
            inputMode="tel"
            value={form.phoneNumberE164}
            onChange={(event) => set("phoneNumberE164", event.target.value)}
            placeholder="+237 6 12 34 56 78"
            helperText="Include the country code, starting with +. Providers use this if they need to reach you about an appointment."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Language</span>
              <select
                value={form.preferredLanguage}
                onChange={(event) => set("preferredLanguage", event.target.value)}
                className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3 text-sm"
              >
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-[var(--color-text-muted)]">
                The language emails and reminders are written in.
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Timezone</span>
              <input
                list="timezone-options"
                value={form.timezone}
                onChange={(event) => set("timezone", event.target.value)}
                className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3 text-sm"
              />
              <datalist id="timezone-options">
                {zones.map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
              <span className="text-sm text-[var(--color-text-muted)]">
                Appointment times are shown in this zone. Type to search.
              </span>
            </label>
          </div>
        </section>

        {fieldError ? (
          <p role="alert" className="text-sm font-semibold text-[var(--color-danger)]">
            {fieldError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
          {dirty ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm(toForm(profile))}
                disabled={saving}
              >
                Discard
              </Button>
              <span role="status" className="text-sm font-semibold text-[var(--color-warning)]">
                You have unsaved changes.
              </span>
            </>
          ) : null}
        </div>
      </form>

      <Modal open={emailHelpOpen} onClose={() => setEmailHelpOpen(false)} title="Changing your email">
        <div className="grid gap-3 text-sm text-[var(--color-text-muted)]">
          <p>
            Your email is your sign-in, so changing it has to be verified before it takes effect. That
            flow isn&apos;t built yet.
          </p>
          <p>
            For now, contact support and they will change it for you. Everything else on this page you
            can change yourself.
          </p>
          <div className="pt-2">
            <Button type="button" onClick={() => setEmailHelpOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </SettingsShell>
  );
}
