"use client";

import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Clock3,
  ImagePlus,
  Images,
  Info,
  Pencil,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import { Button } from "@/components/shared/Button";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import { useToast } from "@/features/studio/components/ui/Toaster";
import {
  Card,
  EmptyPanel,
  PageHeader,
  Pill,
  Segmented,
  SkeletonRows,
  type ChipTone,
} from "@/features/studio/components/ui/primitives";
import { errorMessage, studioFetcher, studioRequest } from "@/features/studio/lib/api";

/**
 * A provider's portfolio.
 *
 * What makes this page different from an ordinary gallery is that a
 * provider does not own these photos outright. Each one exists because a
 * client agreed, on one specific finished appointment, that their hair
 * could be shown - and each one is checked before the public sees it. So
 * the page is built around that: you upload against a consent, every photo
 * names the appointment it came from and where it is in review, and a
 * consent a client later withdraws is called out rather than quietly
 * disappearing.
 */

type ModerationStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

type PortfolioItem = {
  id: string;
  altText: string;
  sortOrder: number;
  moderationStatus: ModerationStatus;
  rejectionReason: string | null;
  consentRevoked: boolean;
  imageUrl: string | null;
  serviceName: string;
  serviceId: string;
  clientName: string;
  appointmentId: string;
  createdAt: string;
};

type PortfolioResponse = {
  items: PortfolioItem[];
  counts: { total: number; approved: number; pending: number; rejected: number };
};

type UsableConsent = {
  id: string;
  consentType: string;
  clientName: string;
  serviceName: string;
  appointmentId: string;
  appointmentAt: string;
  photoCount: number;
};

const STATUS_META: Record<
  ModerationStatus,
  { tone: ChipTone; label: string; icon: typeof CircleCheck }
> = {
  APPROVED: { tone: "success", label: "On your profile", icon: CircleCheck },
  PENDING_REVIEW: { tone: "warning", label: "In review", icon: Clock3 },
  REJECTED: { tone: "danger", label: "Not approved", icon: TriangleAlert },
};

type Filter = "ALL" | ModerationStatus;

/** The only file types the upload endpoint will sign a URL for. */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function formatDay(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StudioPortfolio() {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [deleting, setDeleting] = useState<PortfolioItem | null>(null);
  const [reordering, setReordering] = useState(false);

  const portfolio = useSWR<PortfolioResponse>("/api/v1/braiders/portfolio", studioFetcher);
  const consents = useSWR<{ consents: UsableConsent[] }>(
    "/api/v1/braiders/portfolio/consents",
    studioFetcher,
  );

  // Memoised so the filtered list below is not rebuilt on every render:
  // `?? []` produces a new array each time otherwise.
  const items = useMemo(() => portfolio.data?.items ?? [], [portfolio.data]);
  const counts = portfolio.data?.counts;
  const available = consents.data?.consents ?? [];

  const visible = useMemo(
    () => (filter === "ALL" ? items : items.filter((item) => item.moderationStatus === filter)),
    [items, filter],
  );

  /**
   * Reordering by buttons, not by dragging. WCAG 2.2 asks for a
   * single-pointer alternative to any drag operation, and inside a
   * scrolling grid on a phone a drag handle fights the scroll anyway.
   *
   * The whole order goes to the server rather than a swapped pair:
   * sortOrder starts at 0 for every photo, so on a gallery that has never
   * been ordered there is no meaningful pair to swap.
   */
  async function move(item: PortfolioItem, direction: -1 | 1) {
    const loaded = portfolio.data;
    if (!loaded) return;
    const index = items.findIndex((candidate) => candidate.id === item.id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved!);

    setReordering(true);
    try {
      // Drawn in the new order straight away; the revalidation confirms it
      // rather than being what makes it appear.
      await portfolio.mutate(
        async () => {
          await studioRequest("/api/v1/braiders/portfolio/reorder", "PATCH", {
            mediaIds: next.map((entry) => entry.id),
          });
          return undefined;
        },
        {
          optimisticData: { ...loaded, items: next },
          rollbackOnError: true,
          revalidate: true,
        },
      );
      toast({
        tone: "success",
        title: `Moved "${item.altText}" ${direction === -1 ? "earlier" : "later"}.`,
      });
    } catch (error) {
      toast({ tone: "error", title: errorMessage(error, "We couldn't change the order.") });
    } finally {
      setReordering(false);
    }
  }

  async function remove(item: PortfolioItem) {
    try {
      await studioRequest(`/api/v1/braiders/portfolio/${item.id}`, "DELETE");
      await Promise.all([portfolio.mutate(), consents.mutate()]);
      setDeleting(null);
      toast({ tone: "success", title: "Photo removed." });
    } catch (error) {
      toast({ tone: "error", title: errorMessage(error, "We couldn't remove that photo.") });
    }
  }

  const filters: { value: Filter; label: string; count?: number }[] = [
    { value: "ALL", label: "All", count: counts?.total },
    { value: "APPROVED", label: "On your profile", count: counts?.approved },
    { value: "PENDING_REVIEW", label: "In review", count: counts?.pending },
    { value: "REJECTED", label: "Not approved", count: counts?.rejected },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Portfolio"
        icon={Images}
        description="Your finished work, shown on your public profile. Every photo is here because a client agreed to it."
        badge={
          counts && counts.approved > 0 ? (
            <Pill tone="gold" icon={CircleCheck}>
              {counts.approved} live
            </Pill>
          ) : null
        }
        actions={
          <Button
            onClick={() => setUploadOpen(true)}
            leadingIcon={<Upload aria-hidden="true" className="size-4" />}
            disabled={available.length === 0}
          >
            Add a photo
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
        <section className="grid min-w-0 gap-4">
          {items.length > 0 ? (
            <>
              <Segmented
                label="Filter your portfolio by review status"
                options={filters}
                value={filter}
                onChange={setFilter}
              />
              <p role="status" className="text-sm text-[var(--color-text-muted)]">
                {visible.length === items.length
                  ? `Showing all ${items.length} photo${items.length === 1 ? "" : "s"}.`
                  : `Showing ${visible.length} of ${items.length} photos. Switch to All to change the order.`}
              </p>
            </>
          ) : null}

          {portfolio.isLoading ? (
            <SkeletonRows rows={3} label="Loading your portfolio" />
          ) : portfolio.error ? (
            <Card>
              <div className="grid justify-items-start gap-3">
                <p className="font-semibold text-[var(--color-danger)]">
                  {errorMessage(portfolio.error, "We couldn't load your portfolio.")}
                </p>
                <Button onClick={() => void portfolio.mutate()}>Try again</Button>
              </div>
            </Card>
          ) : items.length === 0 ? (
            <EmptyPanel
              icon={<ImagePlus aria-hidden="true" className="size-6" />}
              title="No photos yet"
              description={
                available.length > 0
                  ? "You have finished appointments where the client agreed to their photo being shown. Add one to start your portfolio."
                  : "Photos come from finished appointments where the client agreed to their picture being used. Ask at the end of an appointment, and anything you're given will show up here ready to upload."
              }
              action={
                available.length > 0 ? (
                  <Button onClick={() => setUploadOpen(true)}>Add your first photo</Button>
                ) : (
                  <Link href="/studio/appointments" className="btn-secondary">
                    View your bookings
                  </Link>
                )
              }
            />
          ) : visible.length === 0 ? (
            <EmptyPanel
              icon={<Images aria-hidden="true" className="size-6" />}
              title="Nothing at this stage"
              description="No photos are in this group right now."
              action={
                <Button variant="secondary" onClick={() => setFilter("ALL")}>
                  Show all photos
                </Button>
              }
            />
          ) : (
            <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => {
                const index = items.findIndex((candidate) => candidate.id === item.id);
                return (
                  <PhotoCard
                    key={item.id}
                    item={item}
                    position={index + 1}
                    total={items.length}
                    canReorder={filter === "ALL" && !reordering}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    onMove={move}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                );
              })}
            </ul>
          )}
        </section>

        <aside className="grid gap-4">
          <Card title="How a photo gets here" icon={ShieldCheck}>
            <ol className="grid gap-3 text-sm text-[var(--color-text-muted)]">
              <Step n={1}>
                You finish an appointment and the client agrees their photo can be shown.
              </Step>
              <Step n={2}>You upload it here, against that appointment.</Step>
              <Step n={3}>We check it. Once approved it appears on your public profile.</Step>
            </ol>
            <p className="mt-4 flex items-start gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand-soft)] px-3 py-2.5 text-xs text-[var(--color-text-primary)]">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                A client can withdraw their agreement at any time. If they do, the photo
                comes down and you&apos;ll see it marked here.
              </span>
            </p>
          </Card>

          <Card title="Ready to post from" icon={Clock3}>
            {consents.isLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
            ) : available.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nothing yet. Consent is recorded when an appointment is completed — see{" "}
                <Link
                  href="/studio/appointments"
                  className="font-semibold text-[var(--color-brand)] hover:underline"
                >
                  your bookings
                </Link>
                .
              </p>
            ) : (
              <ul role="list" className="grid gap-2">
                {available.slice(0, 6).map((consent) => (
                  <li
                    key={consent.id}
                    className="min-w-0 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3"
                  >
                    <p className="text-sm font-semibold break-words text-[var(--color-text-primary)]">
                      {consent.serviceName}
                    </p>
                    <p className="mt-0.5 text-xs break-words text-[var(--color-text-muted)]">
                      {consent.clientName} · {formatDay(consent.appointmentAt)}
                    </p>
                    {consent.photoCount > 0 ? (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {consent.photoCount} photo{consent.photoCount === 1 ? "" : "s"} added
                      </p>
                    ) : null}
                  </li>
                ))}
                {available.length > 6 ? (
                  <li className="text-xs text-[var(--color-text-muted)]">
                    and {available.length - 6} more
                  </li>
                ) : null}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <UploadDialog
        open={uploadOpen}
        consents={available}
        nextSortOrder={items.length}
        onClose={() => setUploadOpen(false)}
        onUploaded={async () => {
          await Promise.all([portfolio.mutate(), consents.mutate()]);
          setUploadOpen(false);
        }}
      />

      <EditDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          await portfolio.mutate();
          setEditing(null);
        }}
      />

      <StudioDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove this photo?"
        description="It comes off your public profile straight away. This cannot be undone."
        size="sm"
        footer={
          deleting ? (
            <>
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Keep it
              </Button>
              <Button variant="danger" onClick={() => void remove(deleting)}>
                Yes, remove it
              </Button>
            </>
          ) : null
        }
      >
        {deleting ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            &ldquo;{deleting.altText}&rdquo; — {deleting.serviceName} for {deleting.clientName}.
          </p>
        ) : null}
      </StudioDialog>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-[var(--color-text-inverse)]"
      >
        {n}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

const ICON_BUTTON =
  "grid size-11 place-items-center rounded-[var(--radius-control)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] focus-ring aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:hover:text-[var(--color-text-muted)]";

function PhotoCard({
  item,
  position,
  total,
  canReorder,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDelete,
}: {
  item: PortfolioItem;
  position: number;
  total: number;
  canReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (item: PortfolioItem, direction: -1 | 1) => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
}) {
  const meta = STATUS_META[item.moderationStatus];

  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]">
      <div className="relative aspect-[4/3] bg-[var(--color-surface-strong)]">
        {item.imageUrl ? (
          // Portfolio media lives in object storage on hosts that are not
          // listed in next.config, so a plain img avoids per-host setup.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={item.altText}
            src={item.imageUrl}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-[var(--color-text-muted)]">
            {item.moderationStatus === "APPROVED"
              ? "Photo storage isn't set up in this environment yet."
              : item.moderationStatus === "REJECTED"
                ? "This photo won't be shown. Remove it and upload another."
                : "Your photo appears here once it's approved."}
          </div>
        )}
        <span className="absolute inset-x-2 top-2 flex flex-wrap gap-1.5">
          <Pill tone={meta.tone} icon={meta.icon}>
            {meta.label}
          </Pill>
        </span>
      </div>

      <div className="grid flex-1 content-start gap-2 p-4">
        <p className="font-semibold break-words text-[var(--color-text-primary)]">{item.altText}</p>
        <p className="min-w-0 text-xs break-words text-[var(--color-text-muted)]">
          {item.serviceName} · {item.clientName}
        </p>

        {item.consentRevoked ? (
          <p className="rounded-[var(--radius-control)] bg-[var(--color-warning-soft)] px-2.5 py-2 text-xs font-medium text-[var(--color-warning)]">
            This client withdrew their agreement, so the photo is no longer shown publicly.
          </p>
        ) : null}

        {item.moderationStatus === "REJECTED" ? (
          <p className="rounded-[var(--radius-control)] bg-[var(--color-danger-soft)] px-2.5 py-2 text-xs text-[var(--color-danger)]">
            {item.rejectionReason ?? "This photo wasn't approved for your public profile."}
          </p>
        ) : null}

        <div className="mt-auto flex items-center gap-1 pt-2">
          <button
            type="button"
            aria-disabled={!canReorder || isFirst || undefined}
            onClick={() => (canReorder && !isFirst ? onMove(item, -1) : undefined)}
            aria-label={`Move "${item.altText}" earlier. Currently ${position} of ${total}.`}
            className={ICON_BUTTON}
          >
            <ArrowUp aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            aria-disabled={!canReorder || isLast || undefined}
            onClick={() => (canReorder && !isLast ? onMove(item, 1) : undefined)}
            aria-label={`Move "${item.altText}" later. Currently ${position} of ${total}.`}
            className={ICON_BUTTON}
          >
            <ArrowDown aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Edit the description of "${item.altText}"`}
            className={ICON_BUTTON}
          >
            <Pencil aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Remove "${item.altText}"`}
            className={`${ICON_BUTTON} ml-auto text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]`}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

const FIELD =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] focus-ring";

function UploadDialog({
  open,
  consents,
  nextSortOrder,
  onClose,
  onUploaded,
}: {
  open: boolean;
  consents: UsableConsent[];
  nextSortOrder: number;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}) {
  const toast = useToast();
  const [consentId, setConsentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  function reset() {
    setConsentId("");
    setFile(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setAltText("");
    setProblem(null);
  }

  function chooseFile(next: File | null) {
    setProblem(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
    if (next && !EXTENSION_BY_TYPE[next.type]) {
      setFile(null);
      setProblem("Please choose a JPEG, PNG or WebP image.");
      return;
    }
    setFile(next);
  }

  async function submit() {
    if (!file || !consentId || altText.trim().length === 0) return;
    const extension = EXTENSION_BY_TYPE[file.type];
    if (!extension) {
      setProblem("Please choose a JPEG, PNG or WebP image.");
      return;
    }

    setBusy(true);
    setProblem(null);
    try {
      const presign = await studioRequest<{ uploadUrl: string; key: string }>(
        `/api/v1/portfolio/consents/${consentId}/media/upload-url`,
        "POST",
        { fileExtension: extension },
      );

      // The browser PUTs straight to object storage; the backend never
      // handles the bytes.
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!put.ok) throw new Error("upload failed");

      await studioRequest(`/api/v1/portfolio/consents/${consentId}/media`, "POST", {
        key: presign.key,
        altText: altText.trim(),
        sortOrder: nextSortOrder,
      });

      toast({ tone: "success", title: "Photo added. We'll review it shortly." });
      reset();
      await onUploaded();
    } catch (error) {
      setProblem(errorMessage(error, "We couldn't add that photo. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    reset();
    onClose();
  }

  return (
    <StudioDialog
      open={open}
      onClose={() => (busy ? undefined : cancel())}
      title="Add a photo"
      description="Pick the appointment it came from. Only appointments where the client agreed are listed."
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={cancel}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            loading={busy}
            disabled={!file || !consentId || altText.trim().length === 0}
          >
            Add photo
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {problem ? (
          <p
            role="alert"
            className="rounded-[var(--radius-control)] border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
          >
            {problem}
          </p>
        ) : null}

        <div className="grid gap-1.5">
          <label htmlFor="portfolio-consent" className="text-sm font-medium">
            Which appointment?
          </label>
          <select
            id="portfolio-consent"
            required
            value={consentId}
            onChange={(event) => setConsentId(event.target.value)}
            className={FIELD}
          >
            <option value="">Choose an appointment…</option>
            {consents.map((consent) => (
              <option key={consent.id} value={consent.id}>
                {consent.serviceName} — {consent.clientName} — {formatDay(consent.appointmentAt)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="portfolio-photo" className="text-sm font-medium">
            Photo
          </label>
          <input
            id="portfolio-photo"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            className="min-h-11 w-full rounded-[var(--radius-control)] border border-dashed border-[var(--color-border-strong,#ddd0cc)] px-3 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-brand-soft)] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[var(--color-brand)]"
          />
          <p className="text-xs text-[var(--color-text-muted)]">JPEG, PNG or WebP.</p>
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
          <label htmlFor="portfolio-alt" className="text-sm font-medium">
            Describe the style
          </label>
          <input
            id="portfolio-alt"
            required
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Medium knotless braids, waist length"
            maxLength={280}
            className={FIELD}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Read out to clients using a screen reader, and shown if the photo can&apos;t load.
          </p>
        </div>
      </div>
    </StudioDialog>
  );
}

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: PortfolioItem | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Take the current text the first time this photo opens. Done during
  // render rather than in an effect so the field is never briefly wrong,
  // and keyed by id so it doesn't fight the person's own typing.
  if (item && loadedFor !== item.id) {
    setLoadedFor(item.id);
    setDraft(item.altText);
  }

  async function save() {
    if (!item || draft.trim().length === 0) return;
    setBusy(true);
    try {
      await studioRequest(`/api/v1/braiders/portfolio/${item.id}`, "PATCH", {
        altText: draft.trim(),
      });
      toast({ tone: "success", title: "Description saved." });
      setLoadedFor(null);
      await onSaved();
    } catch (error) {
      toast({ tone: "error", title: errorMessage(error, "We couldn't save that.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <StudioDialog
      open={item !== null}
      onClose={() => (busy ? undefined : onClose())}
      title="Edit the description"
      description="This is what a screen reader reads out, and what shows if the photo can't load."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void save()} loading={busy} disabled={draft.trim().length === 0}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-1.5">
        <label htmlFor="portfolio-edit-alt" className="text-sm font-medium">
          Describe the style
        </label>
        <input
          id="portfolio-edit-alt"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={280}
          className={FIELD}
        />
        <p className="text-xs text-[var(--color-text-muted)]">{draft.length}/280</p>
      </div>
    </StudioDialog>
  );
}
