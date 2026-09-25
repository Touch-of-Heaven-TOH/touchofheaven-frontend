"use client";

import {
  CalendarDays,
  Heart,
  ImagePlus,
  Pencil,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/components/feedback/ToastProvider";
import { PortfolioGrid, VisibilityBadge } from "@/features/account/portfolio/PortfolioGrid";
import {
  CATEGORY_LABELS,
  VISIBILITY_LABELS,
  errorMessage,
  isStorageUnavailable,
  portfolioFetcher,
  portfolioRequest,
  uploadPortfolioPhoto,
  type ClientStats,
  type FavoriteProvider,
  type ItemVisibility,
  type PortfolioCategory,
  type PortfolioItem,
  type PortfolioPage,
} from "@/features/account/portfolio/api";

/**
 * A client's own portfolio: the looks they kept, and who gets to see each
 * one. Everything on this page is the signed-in client's own data - there
 * is no public view of it yet, so every control here is an edit control.
 */

type CustomerMe = {
  profile: {
    displayName: string;
    preferredName: string | null;
    avatarUrl: string | null;
    createdAt: string;
    email: string;
  };
};

const CATEGORY_ORDER: PortfolioCategory[] = [
  "HAIR",
  "NAILS",
  "WELLNESS",
  "AI_PREVIEW",
  "OTHER",
];

const VISIBILITY_HELP: { value: ItemVisibility; body: string }[] = [
  { value: "PUBLIC", body: "Anyone can see this on your profile." },
  {
    value: "SHARED_WITH_PROFESSIONALS",
    body: "Only providers you have booked with can see it.",
  },
  { value: "PRIVATE", body: "Only you can see it." },
];

export function ClientPortfolio() {
  const toast = useToast();
  const [category, setCategory] = useState<PortfolioCategory | "ALL">("ALL");
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const listKey = `/api/v1/customer/portfolio${
    category === "ALL" ? "" : `?category=${category}`
  }`;

  const me = useSWR<CustomerMe>("/api/v1/customer/me", portfolioFetcher);
  const stats = useSWR<ClientStats>("/api/v1/customer/stats", portfolioFetcher);
  const favorites = useSWR<{ favorites: FavoriteProvider[] }>(
    "/api/v1/customer/favorites",
    portfolioFetcher,
  );
  const portfolio = useSWR<PortfolioPage>(listKey, portfolioFetcher);

  const items = portfolio.data?.items ?? [];
  // Chips come from the categories this client actually has, so a chip
  // never leads to an empty grid.
  const usedCategories = useMemo(
    () =>
      CATEGORY_ORDER.filter((value) =>
        (portfolio.data?.categories ?? []).some((row) => row.category === value),
      ),
    [portfolio.data?.categories],
  );

  const memberSince = me.data
    ? new Date(me.data.profile.createdAt).getFullYear()
    : null;

  async function changeVisibility(item: PortfolioItem, visibility: ItemVisibility) {
    try {
      await portfolioRequest(`/api/v1/customer/portfolio/${item.id}`, "PATCH", {
        visibility,
      });
      await portfolio.mutate();
      toast.success(`"${item.title}" is now ${VISIBILITY_LABELS[visibility].toLowerCase()}.`);
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't change that."));
    }
  }

  async function removeItem(item: PortfolioItem) {
    try {
      await portfolioRequest(`/api/v1/customer/portfolio/${item.id}`, "DELETE");
      await Promise.all([portfolio.mutate(), stats.mutate()]);
      toast.success(`"${item.title}" was removed.`);
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't remove that."));
    }
  }

  return (
    <div className="grid gap-6">
      <ProfileHeader
        name={me.data?.profile.displayName ?? ""}
        avatarUrl={me.data?.profile.avatarUrl ?? null}
        memberSince={memberSince}
        loading={me.isLoading}
      />

      <StatsBar stats={stats.data} loading={stats.isLoading} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <section className="min-w-0">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
                My portfolio
              </h1>
              <p className="mt-1 text-[var(--color-text-muted)]">
                A collection of your beauty looks, inspirations and self-care moments.
              </p>
            </div>
            <Button
              onClick={() => setUploadOpen(true)}
              leadingIcon={<Plus aria-hidden="true" size={16} />}
            >
              Add a look
            </Button>
          </header>

          {usedCategories.length > 0 ? (
            <div
              role="tablist"
              aria-label="Filter by category"
              className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
            >
              {(["ALL", ...usedCategories] as const).map((value) => {
                const active = value === category;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(value)}
                    className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-bold transition ${
                      active
                        ? "bg-[var(--color-brand)] text-white"
                        : "border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                    }`}
                  >
                    {value === "ALL" ? "All" : CATEGORY_LABELS[value]}
                  </button>
                );
              })}
            </div>
          ) : null}

          <p role="status" className="mt-4 text-sm text-[var(--color-text-muted)]">
            {portfolio.isLoading
              ? "Loading your portfolio…"
              : `${items.length} ${items.length === 1 ? "look" : "looks"}`}
          </p>

          <div className="mt-3">
            {portfolio.isLoading ? (
              <GridSkeleton />
            ) : portfolio.error ? (
              <ErrorPanel
                message={errorMessage(portfolio.error, "We couldn't load your portfolio.")}
                onRetry={() => void portfolio.mutate()}
              />
            ) : items.length === 0 ? (
              <EmptyPortfolio
                filtered={category !== "ALL"}
                onAdd={() => setUploadOpen(true)}
              />
            ) : (
              <PortfolioGrid items={items} canEdit onEdit={setEditing} />
            )}
          </div>
        </section>

        <aside className="grid gap-4">
          <VisibilityExplainer />
          <FavoritesCard
            favorites={favorites.data?.favorites ?? []}
            loading={favorites.isLoading}
          />
          <BeautyPreferencesCard />
          <UpcomingAppointmentCard />
        </aside>
      </div>

      {/* A thumb-reachable way to add on a phone, where the header button
          has scrolled away. */}
      <button
        type="button"
        onClick={() => setUploadOpen(true)}
        aria-label="Add a look"
        className="fixed bottom-6 right-4 z-[var(--z-header)] grid size-14 place-items-center rounded-full bg-[var(--color-gold)] text-[#2b1724] shadow-lg xl:hidden"
      >
        <Plus aria-hidden="true" size={24} />
      </button>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={async () => {
          await Promise.all([portfolio.mutate(), stats.mutate()]);
          setUploadOpen(false);
        }}
      />

      <EditDialog
        item={editing}
        onClose={() => setEditing(null)}
        onVisibility={changeVisibility}
        onDelete={removeItem}
      />
    </div>
  );
}

function ProfileHeader({
  name,
  avatarUrl,
  memberSince,
  loading,
}: {
  name: string;
  avatarUrl: string | null;
  memberSince: number | null;
  loading: boolean;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white">
      {/* No cover-photo field exists on the customer profile yet, so this is
          the brand gradient rather than an upload control that saves
          nowhere. */}
      <div className="h-[180px] bg-[linear-gradient(120deg,#2D1B4E,#3D2070_55%,#C9963C)] md:h-[220px]" />
      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-wrap items-end gap-4 md:-mt-12">
          <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-[var(--color-brand-soft)] text-xl font-bold text-[var(--color-brand)] md:size-24">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={avatarUrl} className="h-full w-full object-cover" />
            ) : (
              initials || "?"
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-serif text-2xl font-semibold text-[var(--color-text-primary)] md:text-3xl">
              {loading ? "…" : name}
            </h2>
            {memberSince ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Client since {memberSince}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/account/settings/profile" className="btn-secondary">
              <Pencil aria-hidden="true" size={15} />
              Edit profile
            </Link>
            <Link href="/account/settings/privacy" className="btn-secondary">
              <Share2 aria-hidden="true" size={15} />
              Sharing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar({ stats, loading }: { stats?: ClientStats; loading: boolean }) {
  const cells: { label: string; value: number | undefined; icon: typeof CalendarDays }[] = [
    { label: "completed bookings", value: stats?.completedBookings, icon: CalendarDays },
    { label: "reviews written", value: stats?.verifiedReviews, icon: Sparkles },
    { label: "saved professionals", value: stats?.savedProfessionals, icon: Heart },
  ];

  return (
    <ul role="list" className="grid grid-cols-3 gap-3">
      {cells.map((cell) => {
        const Icon = cell.icon;
        return (
          <li
            key={cell.label}
            className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-4"
          >
            <Icon aria-hidden="true" size={18} className="text-[var(--color-gold)]" />
            <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
              {loading ? "—" : (cell.value ?? 0)}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{cell.label}</p>
            {/* One meaningful sentence rather than a bare number landing in
                a screen reader with no context. */}
            <span role="status" className="sr-only">
              {loading ? "" : `${cell.value ?? 0} ${cell.label}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function VisibilityExplainer() {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
        <ShieldCheck aria-hidden="true" size={18} className="text-[var(--color-gold)]" />
        Who sees what
      </h2>
      <ul role="list" className="mt-3 grid gap-3">
        {VISIBILITY_HELP.map((entry) => (
          <li key={entry.value} className="grid gap-1">
            <VisibilityBadge visibility={entry.value} allowFullLabel />
            <p className="text-sm text-[var(--color-text-muted)]">{entry.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        Every look starts private. You choose what others can see, and you can change
        it at any time.
      </p>
    </section>
  );
}

function FavoritesCard({
  favorites,
  loading,
}: {
  favorites: FavoriteProvider[];
  loading: boolean;
}) {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
        <Heart aria-hidden="true" size={18} className="text-[var(--color-gold)]" />
        Favourite professionals
      </h2>
      {loading ? (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : favorites.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Save a professional you love and they&apos;ll be here next time.{" "}
          <Link className="font-semibold text-[var(--color-brand)] hover:underline" href="/explore">
            Explore providers
          </Link>
          .
        </p>
      ) : (
        <ul role="list" className="mt-3 grid gap-2">
          {favorites.slice(0, 3).map((favorite) => (
            <li key={favorite.braiderId}>
              <Link
                href={`/businesses/${favorite.braiderId}`}
                className="flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] p-2 hover:bg-[var(--color-surface-strong)]"
              >
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-brand-soft)] text-xs font-bold text-[var(--color-brand)]">
                  {favorite.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={favorite.logoUrl} className="h-full w-full object-cover" />
                  ) : (
                    favorite.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold">{favorite.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BeautyPreferencesCard() {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-5">
      <h2 className="flex items-center justify-between gap-2 font-semibold text-[var(--color-text-primary)]">
        <span className="flex items-center gap-2">
          <Sparkles aria-hidden="true" size={18} className="text-[var(--color-gold)]" />
          Beauty preferences
        </span>
        <Link
          className="text-sm font-semibold text-[var(--color-brand)] hover:underline"
          href="/account/settings/beauty-profile"
        >
          Edit
        </Link>
      </h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Hair, scalp and skin details your provider uses to prepare for your appointment.
      </p>
    </section>
  );
}

function UpcomingAppointmentCard() {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-5">
      <h2 className="flex items-center justify-between gap-2 font-semibold text-[var(--color-text-primary)]">
        <span className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" size={18} className="text-[var(--color-gold)]" />
          Appointments
        </span>
        <Link
          className="text-sm font-semibold text-[var(--color-brand)] hover:underline"
          href="/bookings"
        >
          View all
        </Link>
      </h2>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Your upcoming and past bookings live on your bookings page.
      </p>
    </section>
  );
}

function GridSkeleton() {
  return (
    <ul role="list" aria-hidden="true" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <li
          key={index}
          className="aspect-[4/5] animate-pulse rounded-[var(--radius-panel)] bg-[var(--color-surface-strong)]"
        />
      ))}
    </ul>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-5">
      <p className="flex items-center gap-2 font-semibold text-[var(--color-danger)]">
        <TriangleAlert aria-hidden="true" size={18} />
        {message}
      </p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  );
}

function EmptyPortfolio({ filtered, onAdd }: { filtered: boolean; onAdd: () => void }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border)] bg-white p-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <ImagePlus aria-hidden="true" size={24} />
      </span>
      <p className="font-semibold text-[var(--color-text-primary)]">
        {filtered ? "Nothing in this category yet." : "No looks saved yet."}
      </p>
      <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
        {filtered
          ? "Try another category, or add a look to this one."
          : "Add a photo of a style you loved, or one you want to try. Every look starts private."}
      </p>
      <Button onClick={onAdd} leadingIcon={<Plus aria-hidden="true" size={16} />}>
        Add a look
      </Button>
    </div>
  );
}

function UploadDialog({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PortfolioCategory>("HAIR");
  const [visibility, setVisibility] = useState<ItemVisibility>("PRIVATE");
  const [busy, setBusy] = useState(false);
  const [storageMissing, setStorageMissing] = useState(false);

  function reset() {
    setFile(null);
    setPreview(null);
    setTitle("");
    setCategory("HAIR");
    setVisibility("PRIVATE");
    setStorageMissing(false);
  }

  async function submit() {
    if (!file || !title.trim()) return;
    setBusy(true);
    try {
      await uploadPortfolioPhoto({ file, title: title.trim(), category, visibility });
      toast.success(`"${title.trim()}" was added.`);
      reset();
      await onUploaded();
    } catch (error) {
      if (isStorageUnavailable(error)) {
        setStorageMissing(true);
      } else {
        toast.error(errorMessage(error, "We couldn't add that photo."));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={() => (busy ? undefined : onClose())} title="Add a look">
      <div className="grid gap-4">
        {storageMissing ? (
          <p
            role="alert"
            className="rounded-[var(--radius-control)] bg-[var(--color-warning-soft)] px-3 py-2 text-sm font-semibold text-[var(--color-warning)]"
          >
            Photo storage isn&apos;t set up in this environment yet, so the upload
            can&apos;t be saved. Everything else on this page works.
          </p>
        ) : null}

        <div className="grid gap-1.5">
          <label htmlFor="portfolio-file" className="text-sm font-semibold">
            Photo <span aria-hidden="true">*</span>
          </label>
          <input
            id="portfolio-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="min-h-11 text-sm"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setFile(next);
              setPreview(next ? URL.createObjectURL(next) : null);
            }}
          />
          <p className="text-xs text-[var(--color-text-muted)]">JPG, PNG or WebP.</p>
        </div>

        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="The photo you chose"
            src={preview}
            className="max-h-52 w-full rounded-[var(--radius-control)] object-cover"
          />
        ) : null}

        <div className="grid gap-1.5">
          <label htmlFor="portfolio-title" className="text-sm font-semibold">
            Title <span aria-hidden="true">*</span>
          </label>
          <input
            id="portfolio-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Birthday knotless braids"
            className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-sm"
          />
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold">Category</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                  category === value
                    ? "bg-[var(--color-brand)] text-white"
                    : "border border-[var(--color-border)] bg-white"
                }`}
              >
                {CATEGORY_LABELS[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold">Who can see it</span>
          <div className="grid gap-2">
            {VISIBILITY_HELP.map((entry) => (
              <button
                key={entry.value}
                type="button"
                aria-pressed={visibility === entry.value}
                onClick={() => setVisibility(entry.value)}
                className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border p-3 text-left ${
                  visibility === entry.value
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                    : "border-[var(--color-border)] bg-white"
                }`}
              >
                <VisibilityBadge visibility={entry.value} allowFullLabel />
                <span className="min-w-0 text-sm text-[var(--color-text-muted)]">
                  {entry.body}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            loading={busy}
            disabled={!file || title.trim().length === 0}
          >
            Add look
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditDialog({
  item,
  onClose,
  onVisibility,
  onDelete,
}: {
  item: PortfolioItem | null;
  onClose: () => void;
  onVisibility: (item: PortfolioItem, visibility: ItemVisibility) => Promise<void>;
  onDelete: (item: PortfolioItem) => Promise<void>;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Modal open={item !== null} onClose={onClose} title={item ? item.title : ""}>
      {item ? (
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold">Who can see it</span>
            {VISIBILITY_HELP.map((entry) => (
              <button
                key={entry.value}
                type="button"
                aria-pressed={item.visibility === entry.value}
                onClick={() => void onVisibility(item, entry.value)}
                className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border p-3 text-left ${
                  item.visibility === entry.value
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                    : "border-[var(--color-border)] bg-white"
                }`}
              >
                <VisibilityBadge visibility={entry.value} allowFullLabel />
                <span className="min-w-0 text-sm text-[var(--color-text-muted)]">
                  {entry.body}
                </span>
              </button>
            ))}
          </div>

          {confirmingDelete ? (
            <div className="grid gap-2 rounded-[var(--radius-control)] bg-[var(--color-danger-soft)] p-3">
              <p className="text-sm font-semibold text-[var(--color-danger)]">
                Remove &quot;{item.title}&quot;? This cannot be undone.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void onDelete(item)}>Yes, remove it</Button>
                <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="min-h-11 justify-self-start text-sm font-bold text-[var(--color-danger)] hover:underline"
            >
              Remove this look
            </button>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
