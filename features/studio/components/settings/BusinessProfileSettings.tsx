"use client";

import Link from "next/link";
import {
  AtSign,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Store,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { SettingsFrame } from "@/features/studio/components/settings/SettingsFrame";
import { useToast } from "@/features/studio/components/ui/Toaster";
import {
  FormError,
  SkeletonRows,
  TextAreaField,
  Toggle,
} from "@/features/studio/components/ui/primitives";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/**
 * The business's own shop front. Split into three sections rather than one
 * long form, because identity, links and practice details are edited at
 * different times and for different reasons.
 *
 * The handle is checked against the platform while it is typed, so a
 * collision is known before Save rather than after.
 */

const DESCRIPTION_LIMIT = 300;
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "pid", label: "Pidgin" },
];

type Profile = {
  userId: string;
  professionalName: string;
  bio: string | null;
  businessName: string | null;
  businessDescription: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  handle: string | null;
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  yearsOfExperience: number | null;
  /** Absent on an older API build, so every read guards it. */
  languages?: string[] | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTiktok: string | null;
  socialWebsite: string | null;
  acceptsNewClients: boolean;
};

type Form = {
  businessName: string;
  handle: string;
  businessEmail: string;
  businessPhone: string;
  businessDescription: string;
  professionalName: string;
  yearsOfExperience: string;
  languages: string[];
  acceptsNewClients: boolean;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialWebsite: string;
};

type Tab = "identity" | "presence" | "practice";

function toForm(profile: Profile): Form {
  return {
    businessName: profile.businessName ?? "",
    handle: profile.handle ?? "",
    businessEmail: profile.businessEmail ?? "",
    businessPhone: profile.businessPhone ?? "",
    businessDescription: profile.businessDescription ?? profile.bio ?? "",
    professionalName: profile.professionalName ?? "",
    yearsOfExperience: profile.yearsOfExperience === null ? "" : String(profile.yearsOfExperience),
    languages: [...(profile.languages ?? [])],
    acceptsNewClients: profile.acceptsNewClients,
    socialInstagram: profile.socialInstagram ?? "",
    socialFacebook: profile.socialFacebook ?? "",
    socialTiktok: profile.socialTiktok ?? "",
    socialWebsite: profile.socialWebsite ?? "",
  };
}

type HandleState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "free" }
  | { state: "taken"; reason: string }
  | { state: "invalid" };

export function BusinessProfileSettings() {
  const studio = useStudio();
  const toast = useToast();
  const { data, error, isLoading, mutate } = useSWR<{ profile: Profile }>(
    "/api/v1/braiders/profile",
    studioFetcher,
  );
  const profile = data?.profile;

  const [tab, setTab] = useState<Tab>("identity");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!profile) return;
    const stamp = JSON.stringify(toForm(profile));
    if (loadedFor.current === stamp) return;
    loadedFor.current = stamp;
    setForm(toForm(profile));
  }, [profile]);

  const dirty = useMemo(
    () => (profile && form ? JSON.stringify(toForm(profile)) !== JSON.stringify(form) : false),
    [profile, form],
  );

  // Checked half a second after typing stops, so the platform isn't asked
  // on every keystroke.
  const handleValue = form?.handle.trim().toLowerCase() ?? "";
  const debouncedHandle = useDebouncedValue(handleValue, 500);
  const handleChanged = Boolean(profile) && debouncedHandle !== (profile?.handle ?? "");
  const handleWellFormed = /^[a-z0-9-]{3,60}$/.test(debouncedHandle);
  const { data: availability, isLoading: checkingHandle } = useSWR<{
    available: boolean;
    reason?: string;
  }>(
    handleChanged && handleWellFormed
      ? `/api/v1/braiders/handle-availability?handle=${encodeURIComponent(debouncedHandle)}`
      : null,
    studioFetcher,
  );

  const handleState: HandleState = !handleChanged
    ? { state: "idle" }
    : debouncedHandle.length === 0
      ? { state: "idle" }
      : !handleWellFormed
        ? { state: "invalid" }
        : checkingHandle || !availability
          ? { state: "checking" }
          : availability.available
            ? { state: "free" }
            : { state: "taken", reason: availability.reason ?? "taken" };

  if (isLoading || (!profile && !error)) {
    return (
      <SettingsFrame current="profile" title="Business profile">
        <SkeletonRows rows={6} label="Loading your business profile" />
      </SettingsFrame>
    );
  }

  if (error || !profile || !form) {
    return (
      <SettingsFrame current="profile" title="Business profile">
        <div className="grid justify-items-start gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="font-semibold">We couldn&apos;t load your business profile.</p>
          <Button onClick={() => void mutate()}>Try again</Button>
        </div>
      </SettingsFrame>
    );
  }

  function set<TKey extends keyof Form>(key: TKey, value: Form[TKey]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function uploadImage(kind: "logo" | "cover", file: File) {
    setUploading(kind);
    try {
      const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const presign = await studioRequest<{ uploadUrl: string; publicUrl: string }>(
        "/api/v1/braiders/profile/media/upload-url",
        "POST",
        { kind, fileExtension: extension },
      );
      const uploaded = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });
      if (!uploaded.ok) throw new Error("The image could not be uploaded.");
      await studioRequest("/api/v1/braiders/profile", "PATCH", {
        [kind === "logo" ? "logoUrl" : "coverPhotoUrl"]: presign.publicUrl,
      });
      await mutate();
      toast({ tone: "success", title: kind === "logo" ? "Logo updated." : "Cover photo updated." });
    } catch (uploadError) {
      toast({ tone: "error", title: errorMessage(uploadError, "We couldn't upload that image.") });
    } finally {
      setUploading(null);
      if (logoInput.current) logoInput.current.value = "";
      if (coverInput.current) coverInput.current.value = "";
    }
  }

  async function removeImage(kind: "logo" | "cover") {
    try {
      await studioRequest("/api/v1/braiders/profile", "PATCH", {
        [kind === "logo" ? "logoUrl" : "coverPhotoUrl"]: null,
      });
      await mutate();
      toast({ tone: "success", title: kind === "logo" ? "Logo removed." : "Cover photo removed." });
    } catch (removeError) {
      toast({ tone: "error", title: errorMessage(removeError, "We couldn't remove that image.") });
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !profile) return;
    if (!form.professionalName.trim()) {
      setFormError("The name clients see can't be empty.");
      setTab("identity");
      return;
    }
    if (handleState.state === "taken") {
      setFormError("That handle is already in use. Try another.");
      setTab("identity");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const original = toForm(profile);
      const changes: Record<string, string | number | boolean | string[] | null> = {};
      const keys = Object.keys(original) as (keyof Form)[];
      for (const key of keys) {
        if (JSON.stringify(original[key]) === JSON.stringify(form[key])) continue;
        if (key === "yearsOfExperience") {
          changes[key] = form.yearsOfExperience === "" ? null : Number(form.yearsOfExperience);
          continue;
        }
        if (key === "handle") {
          changes[key] = form.handle.trim() === "" ? null : form.handle.trim().toLowerCase();
          continue;
        }
        changes[key] = form[key];
      }
      await studioRequest("/api/v1/braiders/profile", "PATCH", changes);
      await mutate();
      toast({ tone: "success", title: "Business profile saved." });
    } catch (saveError) {
      const message = errorMessage(saveError, "We couldn't save your business profile.");
      setFormError(message);
      toast({ tone: "error", title: message });
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "identity", label: "Identity" },
    { key: "presence", label: "Online presence" },
    { key: "practice", label: "Professional details" },
  ];

  return (
    <SettingsFrame
      current="profile"
      title="Business profile"
      description="What clients see when they find you: your name, your handle, and how to reach you."
      actions={
        <Link
          href={`/businesses/${studio.businessId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--color-brand-strong)]"
        >
          Preview my public profile
          <ExternalLink aria-hidden="true" size={15} />
        </Link>
      }
    >
      <form className="grid gap-5" onSubmit={(event) => void save(event)}>
        <div role="tablist" aria-label="Profile sections" className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-control)] border px-4 text-sm font-semibold transition ${
                tab === item.key
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "identity" ? (
          <section className="grid gap-5 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
              <div className="grid justify-items-center gap-2">
                {profile.logoUrl ? (
                  // Object storage isn't a next/image host in this app.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="Your business logo"
                    className="size-24 rounded-full object-cover ring-2 ring-[var(--color-border)]"
                    src={profile.logoUrl}
                  />
                ) : (
                  <span className="grid size-24 place-items-center rounded-full bg-[var(--color-brand)] text-[var(--color-gold-light)]">
                    <Store aria-hidden="true" size={28} />
                  </span>
                )}
                <input
                  ref={logoInput}
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadImage("logo", file);
                  }}
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-brand)] px-3 text-sm font-bold text-[var(--color-brand)]"
                >
                  {uploading === "logo" ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={15} />
                  ) : (
                    <Upload aria-hidden="true" size={15} />
                  )}
                  {profile.logoUrl ? "Change logo" : "Add logo"}
                </label>
                {profile.logoUrl ? (
                  <button
                    type="button"
                    onClick={() => void removeImage("logo")}
                    className="min-h-11 text-sm font-semibold text-[var(--color-danger)]"
                  >
                    Remove logo
                  </button>
                ) : null}
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">Cover photo</span>
                <div className="relative h-28 overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-brand-soft)]">
                  {profile.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Your cover photo"
                      className="absolute inset-0 h-full w-full object-cover"
                      src={profile.coverPhotoUrl}
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-[var(--color-text-muted)]">
                      <ImageIcon aria-hidden="true" size={24} />
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={coverInput}
                    id="cover-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadImage("cover", file);
                    }}
                  />
                  <label
                    htmlFor="cover-upload"
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-brand)] px-3 text-sm font-bold text-[var(--color-brand)]"
                  >
                    {uploading === "cover" ? (
                      <Loader2 aria-hidden="true" className="animate-spin" size={15} />
                    ) : (
                      <Upload aria-hidden="true" size={15} />
                    )}
                    {profile.coverPhotoUrl ? "Change cover" : "Add cover"}
                  </label>
                  {profile.coverPhotoUrl ? (
                    <button
                      type="button"
                      onClick={() => void removeImage("cover")}
                      className="min-h-11 text-sm font-semibold text-[var(--color-danger)]"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Shown across the top of your public profile. Landscape photos work best.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Name clients see"
                required
                value={form.professionalName}
                onChange={(event) => set("professionalName", event.target.value)}
                helperText="The heading on your public profile. Often your own name."
              />
              <Input
                label="Business name"
                value={form.businessName}
                onChange={(event) => set("businessName", event.target.value)}
                helperText="Your trading name, used in search and on invoices."
              />
              <div className="grid content-start gap-1.5">
                <label htmlFor="handle" className="text-sm font-medium text-[var(--color-text-primary)]">
                  Handle
                </label>
                <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3">
                  <AtSign aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" size={16} />
                  <input
                    id="handle"
                    value={form.handle}
                    onChange={(event) => set("handle", event.target.value.toLowerCase())}
                    className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="ada-braids"
                    autoComplete="off"
                  />
                  {handleState.state === "checking" ? (
                    <Loader2 aria-hidden="true" className="animate-spin text-[var(--color-text-muted)]" size={16} />
                  ) : handleState.state === "free" ? (
                    <Check aria-hidden="true" className="text-[var(--color-success)]" size={16} />
                  ) : handleState.state === "taken" || handleState.state === "invalid" ? (
                    <X aria-hidden="true" className="text-[var(--color-danger)]" size={16} />
                  ) : null}
                </div>
                <p
                  className={`text-xs ${
                    handleState.state === "taken" || handleState.state === "invalid"
                      ? "font-semibold text-[var(--color-danger)]"
                      : handleState.state === "free"
                        ? "font-semibold text-[var(--color-success)]"
                        : "text-[var(--color-text-muted)]"
                  }`}
                  role={handleState.state === "taken" ? "alert" : "status"}
                >
                  {handleState.state === "free"
                    ? "That handle is free."
                    : handleState.state === "taken"
                      ? handleState.reason === "requested"
                        ? "Someone else has applied for that handle."
                        : "That handle is already in use."
                      : handleState.state === "invalid"
                        ? "Use 3-60 lowercase letters, numbers or hyphens."
                        : "Your short web address, used in links to your page."}
                </p>
              </div>
              <Input
                label="Business email"
                type="email"
                value={form.businessEmail}
                onChange={(event) => set("businessEmail", event.target.value)}
                helperText="Shown to clients. Separate from the email you sign in with."
              />
              <Input
                label="Business phone"
                type="tel"
                value={form.businessPhone}
                onChange={(event) => set("businessPhone", event.target.value)}
                placeholder="+237 6 12 34 56 78"
                helperText="Include the country code, starting with +."
              />
            </div>

            <TextAreaField
              label="Description"
              rows={4}
              maxLength={DESCRIPTION_LIMIT}
              value={form.businessDescription}
              onChange={(event) => set("businessDescription", event.target.value)}
              hint={`${form.businessDescription.length}/${DESCRIPTION_LIMIT} · What you do, in your own words.`}
            />
          </section>
        ) : null}

        {tab === "presence" ? (
          <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm text-[var(--color-text-muted)]">
              These appear as links on your public profile. Leave one empty to remove it.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Instagram"
                value={form.socialInstagram}
                onChange={(event) => set("socialInstagram", event.target.value)}
                placeholder="https://instagram.com/yourname"
              />
              <Input
                label="Facebook"
                value={form.socialFacebook}
                onChange={(event) => set("socialFacebook", event.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
              <Input
                label="TikTok"
                value={form.socialTiktok}
                onChange={(event) => set("socialTiktok", event.target.value)}
                placeholder="https://tiktok.com/@yourname"
              />
              <Input
                label="Website"
                value={form.socialWebsite}
                onChange={(event) => set("socialWebsite", event.target.value)}
                placeholder="https://yoursite.com"
              />
            </div>
          </section>
        ) : null}

        {tab === "practice" ? (
          <section className="grid gap-5 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Years of experience"
                inputMode="numeric"
                value={form.yearsOfExperience}
                onChange={(event) =>
                  set("yearsOfExperience", event.target.value.replace(/[^0-9]/g, "").slice(0, 2))
                }
                helperText="Optional. Shown on your public profile."
              />
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-[var(--color-text-primary)]">Languages you work in</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((language) => {
                  const selected = form.languages.includes(language.value);
                  return (
                    <button
                      key={language.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        set(
                          "languages",
                          selected
                            ? form.languages.filter((value) => value !== language.value)
                            : [...form.languages, language.value],
                        )
                      }
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border px-4 text-sm font-semibold transition ${
                        selected
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                          : "border-[var(--color-border)] bg-white hover:border-[var(--color-brand)]"
                      }`}
                    >
                      {selected ? <Check aria-hidden="true" size={15} /> : null}
                      {language.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] p-4">
              <Toggle
                checked={form.acceptsNewClients}
                onChange={(checked) => set("acceptsNewClients", checked)}
                label="Accepting new clients"
              />
              <p className="text-sm text-[var(--color-text-muted)]">
                {form.acceptsNewClients
                  ? "Your page shows a Book button as usual."
                  : "Your page stays visible, and the Book button is replaced with “Not accepting new clients”. Existing appointments are unaffected."}
              </p>
            </div>

            <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-brand-soft)] p-4 text-sm">
              <p className="font-semibold text-[var(--color-text-primary)]">Specialties</p>
              <p className="mt-1 text-[var(--color-text-muted)]">
                Clients see what you actually offer, taken from your published services, so there is nothing to
                keep in step by hand.{" "}
                <Link className="font-semibold text-[var(--color-brand)] hover:underline" href="/studio/services">
                  Manage services
                </Link>
              </p>
            </div>
          </section>
        ) : null}

        <FormError message={formError} />

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
          {dirty ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => setForm(toForm(profile))}
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
    </SettingsFrame>
  );
}
