"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  ImagePlus,
  Loader2,
  Search,
  Share2,
  SlidersHorizontal,
  UploadCloud,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { brandAssets } from "@/config/site";
import {
  fetchAiStudioCredits,
  fetchAiStudioSession,
  fetchAiStudioSessions,
  fetchAiStudioStyles,
  requestAiStudioUploadUrl,
  shareAiStudioSession,
  startAiStudioGeneration,
} from "@/features/ai-studio/api/studio.api";
import {
  aiStudioCategories,
  aiStudioColors,
  fallbackAiStudioStyles,
} from "@/features/ai-studio/data/fallback-catalog";
import type {
  AiStudioColor,
  AiStudioExperienceProps,
  AiStudioSession,
  AiStudioStyle,
} from "@/features/ai-studio/types";
import { getClientEnv } from "@/lib/env/client";

type Stage = "choose" | "photo" | "review" | "processing" | "result";
type UploadStatus = "idle" | "validating" | "ready" | "uploading" | "error";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const colorGroups = ["Black", "Brown", "Blonde", "Blends"] as const;

function categoryLabel(style: AiStudioStyle) {
  const detail = [style.density, style.length, style.parting].filter(Boolean).join(" · ");
  return detail || style.category;
}

function sanitizeFilename(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  return clean.endsWith(".jpg") || clean.endsWith(".jpeg")
    ? clean
    : `${clean.replace(/\.(png|jpeg|jpg)$/i, "")}.jpg`;
}

async function sniffImageType(file: File) {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47;

  if (isJpeg) return "image/jpeg" as const;
  if (isPng) return "image/png" as const;
  return null;
}

async function stripImageMetadata(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("The selected image could not load."));
      element.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this photo.");
    context.drawImage(image, 0, 0);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Your browser could not prepare this photo."));
        },
        "image/jpeg",
        0.92,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function swatchStyle(color: AiStudioColor) {
  if (color.swatchColors.length === 1) return { background: color.swatchColors[0] };
  return {
    background: `linear-gradient(135deg, ${color.swatchColors[0]} 0 50%, ${color.swatchColors[1]} 50% 100%)`,
  };
}

function previewImageStyle(src: string): CSSProperties {
  return {
    backgroundImage: `url("${src.replace(/"/g, "%22")}")`,
  };
}

function StepProgress({ stage }: { stage: Stage }) {
  const active = stage === "choose" ? 0 : stage === "photo" ? 1 : 2;
  const labels = ["Choose your look", "Add your photo", "Review and create"];

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Creation progress">
      {labels.map((label, index) => (
        <li className="min-w-0" key={label}>
          <div
            className={`h-1 rounded-full ${
              index <= active
                ? "bg-[var(--color-brand-strong)]"
                : "bg-[var(--color-border)]"
            }`}
          />
          <p
            className={`mt-2 truncate text-[0.7rem] font-bold md:text-xs ${
              index === active
                ? "text-[var(--color-brand-strong)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            {label}
          </p>
        </li>
      ))}
    </ol>
  );
}

function CreditCounter({
  authenticated,
  balance,
  unavailable,
}: {
  authenticated: boolean;
  balance: number | null;
  unavailable: boolean;
}) {
  return (
    <div className="inline-flex min-h-11 items-center gap-3 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm shadow-[var(--shadow-subtle)]">
      <Coins aria-hidden="true" className="text-[var(--color-gold)]" size={17} />
      {authenticated ? (
        <span>
          <span className="font-serif text-lg font-semibold text-[var(--color-brand-strong)]">
            {unavailable ? "0" : balance ?? "..."}
          </span>{" "}
          credits
        </span>
      ) : (
        <span className="font-semibold">0 credits</span>
      )}
      {authenticated && balance === 0 ? (
        <Link className="font-bold text-[var(--color-copper)]" href="/account/credits">
          Get more
        </Link>
      ) : null}
    </div>
  );
}

function StyleCard({
  style,
  selected,
  onSelect,
}: {
  style: AiStudioStyle;
  selected: boolean;
  onSelect: (style: AiStudioStyle) => void;
}) {
  return (
    <button
      type="button"
      className={`group overflow-hidden rounded-md border bg-white text-left shadow-[var(--shadow-subtle)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] focus-ring ${
        selected
          ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]"
          : "border-[var(--color-border)]"
      }`}
      onClick={() => onSelect(style)}
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-[var(--color-skeleton)]">
        <Image
          alt={`${style.name} reference`}
          className="object-cover transition duration-300 group-hover:scale-[1.035]"
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 220px"
          src={style.thumbnailUrl}
        />
        <span
          className={`absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-[var(--color-brand)] text-white shadow ${
            selected ? "opacity-100" : "opacity-0"
          }`}
        >
          <Check aria-hidden="true" size={15} />
        </span>
      </span>
      <span className="block p-3">
        <span className="block text-sm font-bold text-[var(--color-text-primary)]">
          {style.name}
        </span>
        <span className="mt-1 block truncate text-xs text-[var(--color-text-muted)]">
          {categoryLabel(style)}
        </span>
      </span>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          className="overflow-hidden rounded-md border border-[var(--color-border)] bg-white"
          key={index}
        >
          <div className="aspect-[4/3] animate-pulse bg-[var(--color-skeleton)]" />
          <div className="grid gap-2 p-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-skeleton)]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--color-skeleton)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function YourLookPanel({
  stage,
  selectedStyle,
  selectedColor,
  selectedSize,
  selectedLength,
  onColorSelect,
  photoPreview,
  availableColorIds,
}: {
  stage: Stage;
  selectedStyle: AiStudioStyle | null;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedLength: string | null;
  onColorSelect: (color: AiStudioColor) => void;
  photoPreview: string | null;
  availableColorIds: string[];
}) {
  const activeColor = aiStudioColors.find((color) => color.id === selectedColor);
  const hasAvailabilityRules = availableColorIds.length > 0;

  return (
    <aside className="rounded-md border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-soft)] lg:sticky lg:top-24">
      <StepProgress stage={stage} />
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
          Your look
        </h2>
        <div className="mt-4 overflow-hidden rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface-strong)]">
          <div className="relative aspect-[16/9]">
            {selectedStyle ? (
              <Image
                alt={`${selectedStyle.name} selected reference`}
                className="object-cover"
                fill
                sizes="360px"
                src={selectedStyle.thumbnailUrl}
              />
            ) : (
              <div className="grid size-full place-items-center text-sm font-medium text-[var(--color-text-muted)]">
                Select a style to start.
              </div>
            )}
          </div>
        </div>
        {selectedStyle ? (
          <dl className="mt-4 grid gap-2 border-b border-[var(--color-border)] pb-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">Style</dt>
              <dd className="font-bold">{selectedStyle.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">Color</dt>
              <dd className="font-bold">{activeColor?.name ?? "Choose a shade"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">Size</dt>
              <dd className="font-bold">{selectedSize ?? "Choose size"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--color-text-muted)]">Length</dt>
              <dd className="font-bold">{selectedLength ?? "Choose length"}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="mt-6">
        <h3 className="font-bold text-[var(--color-text-primary)]">Hair color</h3>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Select a braiding-hair shade or blend.
        </p>
        <div className="mt-4 rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 text-center text-sm text-[var(--color-text-muted)]">
          {activeColor ? activeColor.name : "Choose a shade below"}
        </div>

        <div className="mt-4 grid gap-4">
          {colorGroups.map((group) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                {group}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {aiStudioColors
                  .filter((color) => color.group === group)
                  .map((color) => {
                    const isSelected = selectedColor === color.id;
                    const isAvailable =
                      !hasAvailabilityRules || availableColorIds.includes(color.id);
                    return (
                      <button
                        aria-label={`Choose ${color.name}, shade ${color.code}`}
                        aria-disabled={!isAvailable}
                        className={`rounded-md border bg-white p-2 text-center transition focus-ring ${
                          isSelected
                            ? "border-[var(--color-brand)] ring-2 ring-[var(--color-brand)] ring-offset-2"
                            : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                        } ${isAvailable ? "" : "cursor-not-allowed opacity-45"}`}
                        disabled={!isAvailable}
                        key={color.id}
                        type="button"
                        onClick={() => onColorSelect(color)}
                      >
                        <span
                          aria-hidden="true"
                          className="mx-auto block size-9 rounded-md border border-black/10"
                          style={swatchStyle(color)}
                        />
                        <span className="mt-2 block text-xs font-bold text-[var(--color-text-primary)]">
                          {color.name}
                        </span>
                        <span className="mt-1 block text-[0.65rem] uppercase text-[var(--color-text-muted)]">
                          Shade {color.code}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {photoPreview ? (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Your photo
          </p>
          <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-md border border-[var(--color-border)]">
            <div
              aria-label="Selected upload preview"
              className="size-full bg-cover bg-center"
              role="img"
              style={previewImageStyle(photoPreview)}
            />
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function AuthGateModal({
  open,
  callbackUrl,
  onClose,
}: {
  open: boolean;
  callbackUrl: string;
  onClose: () => void;
}) {
  const { apiUrl } = getClientEnv();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay)] grid bg-[rgba(43,23,36,0.35)] p-0 backdrop-blur-sm md:place-items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-studio-auth-title"
    >
      <section className="relative flex min-h-dvh flex-col bg-white p-6 shadow-[var(--shadow-media)] md:min-h-0 md:w-full md:max-w-md md:rounded-md md:p-8">
        <button
          aria-label="Close sign in prompt"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)]"
          type="button"
          onClick={onClose}
        >
          <X aria-hidden="true" size={18} />
        </button>
        <div className="relative mx-auto size-16">
          <Image
            alt=""
            className="object-contain"
            fill
            sizes="64px"
            src={brandAssets.logoMark}
          />
        </div>
        <h2
          className="mt-5 text-center font-serif text-3xl font-semibold text-[var(--color-brand-strong)]"
          id="ai-studio-auth-title"
        >
          Sign in to generate your preview
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[var(--color-text-muted)]">
          Your style choices stay on this page. We will only upload a photo after
          your account is protected.
        </p>
        <div className="mt-7 grid gap-3">
          <a
            className="btn-secondary w-full justify-center"
            href={`${apiUrl}/api/v1/auth/oauth/google?callbackUrl=${encodeURIComponent(
              callbackUrl,
            )}`}
          >
            Continue with Google
          </a>
          <Link
            className="btn-primary w-full"
            href={`/customer/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            Sign in with email
          </Link>
          <Link
            className="btn-ghost w-full"
            href={`/customer/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            New here? Create a free account
          </Link>
        </div>
      </section>
    </div>
  );
}

function BeforeAfterResult({
  session,
  before,
}: {
  session: AiStudioSession;
  before: string | null;
}) {
  const [position, setPosition] = useState(50);
  const resultImage = session.resultImageUrl;
  if (!resultImage) return null;

  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-white">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-strong)]">
        {before ? (
          <div
            aria-label="Before hairstyle preview"
            className="absolute inset-0 bg-cover bg-center"
            role="img"
            style={previewImageStyle(before)}
          />
        ) : null}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <div
            aria-label="Generated hairstyle preview"
            className="size-full bg-cover bg-center"
            role="img"
            style={previewImageStyle(resultImage)}
          />
        </div>
        <span className="absolute bottom-3 left-3 rounded bg-black/60 px-3 py-1 text-xs font-bold text-white">
          Before
        </span>
        <span className="absolute bottom-3 right-3 rounded bg-black/60 px-3 py-1 text-xs font-bold text-white">
          After
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-px bg-white"
          style={{ left: `${position}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white bg-white text-[var(--color-brand)] shadow"
          style={{ left: `${position}%` }}
        >
          <ChevronLeft size={14} />
          <ChevronRight size={14} />
        </span>
        <input
          aria-label="Compare before and after"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          max={100}
          min={0}
          type="range"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
        />
      </div>
    </div>
  );
}

export function AiStudioExperience({
  initialUser,
  initialStyleId,
  initialColorId,
  initialStyles = [],
  initialCatalogSource = "backend",
  initialCatalogError = null,
}: AiStudioExperienceProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [styles, setStyles] = useState<AiStudioStyle[]>(initialStyles);
  const [catalogSource, setCatalogSource] = useState<"backend" | "fallback">(
    initialCatalogSource,
  );
  const [loadingStyles, setLoadingStyles] = useState(initialStyles.length === 0);
  const [catalogError, setCatalogError] = useState<string | null>(
    initialCatalogError,
  );
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeAudience, setActiveAudience] =
    useState<"ALL" | "WOMEN" | "MEN">("ALL");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(
    initialStyleId ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialColorId ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [generationSession, setGenerationSession] =
    useState<AiStudioSession | null>(null);
  const [previousSessions, setPreviousSessions] = useState<AiStudioSession[]>([]);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [creditsUnavailable, setCreditsUnavailable] = useState(false);

  const authenticated = Boolean(initialUser);
  const selectedStyle = useMemo(
    () => styles.find((style) => style.id === selectedStyleId) ?? null,
    [selectedStyleId, styles],
  );
  const selectedSizeValue =
    selectedStyle && selectedSize && selectedStyle.availableSizes.includes(selectedSize)
      ? selectedSize
      : selectedStyle?.availableSizes[0] ?? null;
  const selectedLengthValue =
    selectedStyle &&
    selectedLength &&
    selectedStyle.availableLengths.includes(selectedLength)
      ? selectedLength
      : selectedStyle?.availableLengths[0] ?? null;

  const callbackUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedStyleId) params.set("style", selectedStyleId);
    if (selectedColor) params.set("color", selectedColor);
    return `/ai-studio${params.toString() ? `?${params.toString()}` : ""}`;
  }, [selectedColor, selectedStyleId]);

  useEffect(() => {
    // The server-rendered initial page only ever covers audience "ALL" -
    // once the visitor picks Women/Men, this always refetches even on the
    // very first render for that audience.
    if (initialStyles.length > 0 && activeAudience === "ALL") return;

    let live = true;
    fetchAiStudioStyles(activeAudience === "ALL" ? {} : { audience: activeAudience })
      .then((items) => {
        if (!live) return;
        const next = items.length > 0 ? items : fallbackAiStudioStyles;
        setStyles(next);
        setCatalogSource(items.length > 0 ? "backend" : "fallback");
        setCatalogError(null);
        setActiveCategory("All");
      })
      .catch(() => {
        if (!live) return;
        setStyles(fallbackAiStudioStyles);
        setCatalogSource("fallback");
        setCatalogError(
          "Live catalogue is not available locally, so approved imported Brane references are shown.",
        );
      })
      .finally(() => {
        if (live) setLoadingStyles(false);
      });

    return () => {
      live = false;
    };
  }, [initialStyles.length, activeAudience]);

  useEffect(() => {
    if (!authenticated) return;

    let live = true;
    fetchAiStudioCredits()
      .then((credits) => {
        if (!live) return;
        setBalance(credits.balance);
        setCreditsUnavailable(false);
      })
      .catch(() => {
        if (!live) return;
        setCreditsUnavailable(true);
      });

    fetchAiStudioSessions()
      .then((sessions) => {
        if (live) setPreviousSessions(sessions);
      })
      .catch(() => {
        if (live) setPreviousSessions([]);
      });

    return () => {
      live = false;
    };
  }, [authenticated]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const filteredStyles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return styles.filter((style) => {
      const categoryMatch =
        activeCategory === "All" || style.category === activeCategory;
      const queryMatch =
        normalizedQuery.length === 0 ||
        [
          style.name,
          style.category,
          style.density,
          style.length,
          style.parting,
          style.texture ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, query, styles]);

  // The fallback catalog only ever has its own fixed 5 categories; real
  // backend data can include any of the full TryOnCategory taxonomy
  // (including men's/barber categories), so its chips are derived from
  // whatever categories are actually present rather than hardcoded.
  const categoryOptions = useMemo(() => {
    if (catalogSource === "fallback") return aiStudioCategories;
    const present = Array.from(new Set(styles.map((style) => style.category)));
    return ["All", ...present];
  }, [catalogSource, styles]);

  function selectStyle(style: AiStudioStyle) {
    setSelectedStyleId(style.id);
    setSelectedColor(null);
    setSelectedSize(style.availableSizes[0] ?? null);
    setSelectedLength(style.availableLengths[0] ?? null);
    setStage("choose");
    setGenerationSession(null);
  }

  async function handleFile(file: File) {
    setUploadStatus("validating");
    setUploadError(null);

    try {
      if (file.size > MAX_PHOTO_SIZE) {
        throw new Error("Your photo must be under 10MB");
      }

      const type = await sniffImageType(file);
      if (!type) throw new Error("Please upload a JPG or PNG image");

      const cleanBlob = await stripImageMetadata(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoBlob(cleanBlob);
      setPhotoPreview(URL.createObjectURL(cleanBlob));
      setUploadStatus("ready");
      setStage("review");
      if (!authenticated) setAuthOpen(true);
    } catch (error) {
      setUploadStatus("error");
      setPhotoBlob(null);
      setUploadError(
        error instanceof Error
          ? error.message
          : "We could not prepare that photo. Try another image.",
      );
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) void handleFile(file);
  }

  function handleUploadKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  }

  function canContinue() {
    return Boolean(
      selectedStyle && selectedColor && selectedSizeValue && selectedLengthValue,
    );
  }

  async function createPreview() {
    if (!selectedStyle || !selectedColor || !selectedSizeValue || !selectedLengthValue) {
      return;
    }
    if (!photoBlob) {
      fileInputRef.current?.click();
      return;
    }
    if (!authenticated) {
      setAuthOpen(true);
      return;
    }
    if (balance === 0) {
      setUploadError("You need at least 1 credit to create this preview.");
      return;
    }

    setUploadStatus("uploading");
    setStage("processing");
    setUploadError(null);

    try {
      const upload = await requestAiStudioUploadUrl({
        filename: sanitizeFilename(`${selectedStyle.slug}.jpg`),
        contentType: "image/jpeg",
      });

      const uploadResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        body: photoBlob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!uploadResponse.ok) {
        throw new Error("Photo upload failed.");
      }

      const generation = await startAiStudioGeneration({
        objectKey: upload.objectKey,
        styleId: selectedStyle.id,
        selectedColor,
        selectedSize: selectedSizeValue,
        selectedLength: selectedLengthValue,
      });

      setBalance((current) =>
        typeof current === "number" ? Math.max(0, current - 1) : current,
      );
      const session = await fetchAiStudioSession(generation.sessionId);
      setGenerationSession(session);
      setStage(session.status === "COMPLETED" ? "result" : "processing");
    } catch {
      setUploadStatus("error");
      setStage("review");
      setUploadError(
        "AI generation is not available from the local backend yet. Your style and photo preview are still here.",
      );
      setBalance((current) =>
        typeof current === "number" ? current + 1 : current,
      );
    }
  }

  async function handleShare() {
    if (!generationSession) return;
    try {
      const response = await shareAiStudioSession(generationSession.id);
      await navigator.clipboard.writeText(response.shareUrl);
      setShareMessage("Copied!");
      window.setTimeout(() => setShareMessage(null), 2000);
    } catch {
      setShareMessage("Sharing is not available yet.");
      window.setTimeout(() => setShareMessage(null), 2500);
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-white/80 backdrop-blur">
        <div className="mx-auto grid min-h-16 w-full max-w-[1360px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-8">
          <Link className="flex items-center" href="/" aria-label="Touch of Heaven home">
            <span className="relative block h-11 w-36 sm:w-44">
              <Image
                alt="Touch of Heaven"
                className="object-contain object-left"
                fill
                priority
                sizes="(max-width: 640px) 144px, 176px"
                src={brandAssets.logoLockup}
              />
            </span>
          </Link>
          <nav className="flex rounded-md bg-[var(--color-brand-soft)] p-1 text-sm font-semibold">
            <Link className="rounded px-4 py-2 text-[var(--color-brand-strong)]" href="/ai-studio">
              Create
            </Link>
            <Link className="rounded px-4 py-2 text-[var(--color-text-muted)]" href="/account">
              My looks
            </Link>
          </nav>
          <div className="flex justify-end">
            <CreditCounter
              authenticated={authenticated}
              balance={balance}
              unavailable={creditsUnavailable}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1360px] px-4 py-8 md:px-8 md:py-12">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="grid gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                Touch of Heaven Studio
              </p>
              <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
                Create your next look
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] md:text-base">
                Move at your own pace. Your final selection stays visible before
                you spend a credit.
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold">1. Choose and personalize</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Upload a hairstyle you saved, or explore the imported catalogue
                and personalize your color.
              </p>
            </div>

            <button
              className="mt-6 grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-md border border-[var(--color-border)] bg-white/70 p-5 text-left transition hover:border-[var(--color-brand)] md:grid-cols-[auto_1fr_auto] md:gap-5"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="grid size-14 place-items-center rounded-md bg-[var(--color-brand)] text-white">
                <ImagePlus aria-hidden="true" size={24} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold">
                  Upload your own inspiration
                </span>
                <span className="mt-1 block text-sm leading-6 text-[var(--color-text-muted)]">
                  Use a hairstyle photo you already love. Touch of Heaven will
                  keep it local until you sign in and confirm.
                </span>
              </span>
              <span className="hidden text-sm font-bold text-[var(--color-text-muted)] md:inline">
                Coming soon
              </span>
            </button>

            <div className="my-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Or pick from one of these
              </span>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  size={18}
                />
                <input
                  className="min-h-12 w-full rounded-md border border-[var(--color-border)] bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[var(--color-brand)]"
                  placeholder="Search styles, length, texture..."
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <button className="btn-secondary" type="button">
                <SlidersHorizontal aria-hidden="true" size={17} />
                Filters
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              {(["ALL", "WOMEN", "MEN"] as const).map((audience) => (
                <button
                  className={`rounded-md border px-4 py-2 text-sm font-bold transition ${
                    activeAudience === audience
                      ? "border-[var(--color-brand-strong)] bg-[var(--color-brand-strong)] text-white"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                  }`}
                  key={audience}
                  type="button"
                  onClick={() => {
                    if (audience === activeAudience) return;
                    setLoadingStyles(true);
                    setActiveAudience(audience);
                  }}
                >
                  {audience === "ALL" ? "All" : audience === "WOMEN" ? "Women" : "Men"}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {categoryOptions.map((category) => (
                <button
                  className={`shrink-0 rounded-md border px-4 py-3 text-sm font-bold transition ${
                    activeCategory === category
                      ? "border-[var(--color-brand-strong)] bg-[var(--color-brand-strong)] text-white"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                  }`}
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
              <p>{filteredStyles.length} looks</p>
              {catalogSource === "fallback" ? (
                <p className="text-xs font-semibold text-[var(--color-copper)]">
                  Imported Brane references
                </p>
              ) : null}
            </div>
            {catalogError ? (
              <p className="mt-2 rounded-md bg-[var(--color-warning-soft)] p-3 text-sm text-[var(--color-warning)]">
                {catalogError}
              </p>
            ) : null}

            <div className="mt-5">
              {loadingStyles ? (
                <SkeletonGrid />
              ) : (
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                  {filteredStyles.map((style) => (
                    <StyleCard
                      key={style.id}
                      selected={style.id === selectedStyleId}
                      style={style}
                      onSelect={selectStyle}
                    />
                  ))}
                </div>
              )}
            </div>

            {selectedStyle ? (
              <section className="mt-8 rounded-md border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-lg font-bold">Personalize this style</h3>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-bold">Size</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedStyle.availableSizes.map((size) => (
                        <button
                          className={`rounded-md border px-4 py-2 text-sm font-bold ${
                            selectedSizeValue === size
                              ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                              : "border-[var(--color-border)] bg-white"
                          }`}
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Length</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedStyle.availableLengths.map((length) => (
                        <button
                          className={`rounded-md border px-4 py-2 text-sm font-bold ${
                            selectedLengthValue === length
                              ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                              : "border-[var(--color-border)] bg-white"
                          }`}
                          key={length}
                          type="button"
                          onClick={() => setSelectedLength(length)}
                        >
                          {length}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section
              className={`mt-8 rounded-md border p-5 transition ${
                dragging
                  ? "border-[var(--color-brand)] bg-white"
                  : "border-dashed border-[var(--color-border)] bg-white/70"
              }`}
              role="button"
              tabIndex={0}
              aria-label="Upload your photo"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleUploadKeyDown}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                accept="image/jpeg,image/png"
                className="sr-only"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.currentTarget.value = "";
                }}
              />
              <div className="grid place-items-center py-8 text-center">
                <UploadCloud
                  aria-hidden="true"
                  className="text-[var(--color-brand)]"
                  size={34}
                />
                <h3 className="mt-3 text-lg font-bold">Upload your photo</h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  JPG or PNG, max 10MB
                </p>
                <span className="btn-secondary mt-4">Browse Photos</span>
                {uploadStatus === "validating" ? (
                  <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">
                    Preparing your private preview...
                  </p>
                ) : null}
                {uploadError ? (
                  <p
                    className="mt-3 max-w-xl text-sm font-semibold text-[var(--color-danger)]"
                    role="alert"
                  >
                    {uploadError}
                  </p>
                ) : null}
              </div>
            </section>

            {generationSession?.status === "COMPLETED" ? (
              <section className="mt-8">
                <BeforeAfterResult
                  before={photoPreview}
                  session={generationSession}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    className="btn-primary"
                    download
                    href={generationSession.resultImageUrl ?? "#"}
                  >
                    <Download aria-hidden="true" size={17} />
                    Save Result
                  </a>
                  <button className="btn-secondary" type="button" onClick={handleShare}>
                    <Share2 aria-hidden="true" size={17} />
                    {shareMessage ?? "Share"}
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() =>
                      router.push(
                        `/businesses?style=${selectedStyle?.slug ?? ""}&q=${encodeURIComponent(
                          selectedStyle?.name ?? "",
                        )}`,
                      )
                    }
                  >
                    Book This Style
                    <ArrowRight aria-hidden="true" size={17} />
                  </button>
                </div>
              </section>
            ) : null}

            {previousSessions.length > 0 ? (
              <section className="mt-12 border-t border-[var(--color-border)] pt-8">
                <h2 className="font-serif text-3xl font-semibold">
                  Your Previous Looks
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {previousSessions.map((session) => (
                    <article
                      className="overflow-hidden rounded-md border border-[var(--color-border)] bg-white"
                      key={session.id}
                    >
                      <div className="relative aspect-[4/5] bg-[var(--color-skeleton)]">
                        {session.resultImageUrl ? (
                          <div
                            aria-label={`${session.styleName} generated preview`}
                            className="size-full bg-cover bg-center"
                            role="img"
                            style={previewImageStyle(session.resultImageUrl)}
                          />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <h3 className="truncate text-sm font-bold">
                          {session.styleName}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <YourLookPanel
            photoPreview={photoPreview}
            selectedColor={selectedColor}
            selectedLength={selectedLengthValue}
            selectedSize={selectedSizeValue}
            selectedStyle={selectedStyle}
            stage={stage}
            availableColorIds={selectedStyle?.availableColors ?? []}
            onColorSelect={(color) => {
              setSelectedColor(color.id);
              if (selectedStyle) setStage("photo");
            }}
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-[var(--color-border)] bg-white/88 px-4 py-3 shadow-[0_-10px_30px_rgba(43,23,36,0.12)] backdrop-blur">
        <div className="mx-auto flex max-w-[760px] items-center gap-3 rounded-md border border-[var(--color-border)] bg-white p-2 shadow-[var(--shadow-subtle)]">
          <p className="min-w-0 flex-1 truncate text-xs text-[var(--color-text-muted)]">
            {selectedStyle
              ? selectedColor
                ? photoPreview
                  ? "Ready to review before creating."
                  : "Style and color ready. Add your photo."
                : "Choose a hair color before adding your photo."
              : "Choose a style to start."}
          </p>
          {stage === "processing" ? (
            <span className="btn-primary pointer-events-none">
              <Loader2 aria-hidden="true" className="animate-spin" size={17} />
              Generating...
            </span>
          ) : (
            <button
              className="btn-primary"
              disabled={!canContinue() || uploadStatus === "validating"}
              type="button"
              onClick={() => {
                if (photoPreview) void createPreview();
                else fileInputRef.current?.click();
              }}
            >
              {photoPreview ? "Create preview" : "Add photo"}
              <ArrowRight aria-hidden="true" size={17} />
            </button>
          )}
        </div>
      </div>

      <AuthGateModal
        callbackUrl={callbackUrl}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}
