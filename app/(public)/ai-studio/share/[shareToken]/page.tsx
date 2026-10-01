import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brandAssets } from "@/config/site";
import { serverApiFetch } from "@/lib/api/server";

type SharePageProps = {
  params: Promise<{ shareToken: string }>;
};

// Matches modules/studio/studio.service.ts#getPublicSharedSession's real
// response shape, wrapped in { session } by the route handler - not the
// flat shape this page originally assumed.
type SharedStudioPreviewResponse = {
  session: {
    style: { name: string; slug: string };
    outputImageUrl: string | null;
    selectedColor: string;
    selectedSize: string;
    selectedLength: string;
    createdAt: string;
  };
};

type SharedStudioPreview = {
  styleName: string;
  styleSlug: string;
  selectedColor: string;
  selectedSize: string;
  selectedLength: string;
  resultImageUrl: string;
};

export const metadata: Metadata = {
  title: "Shared AI hairstyle preview",
  description: "A Touch of Heaven AI Studio hairstyle preview.",
};

async function getSharedPreview(token: string): Promise<SharedStudioPreview | null> {
  try {
    const { session } = await serverApiFetch<SharedStudioPreviewResponse>(
      `/api/v1/studio/share/${encodeURIComponent(token)}`,
    );
    // A share link only ever exists for a COMPLETED session (see
    // findSharedSessionByTokenHash's own status filter), so outputImageUrl
    // should always be set here - but treat a null as "not ready to show"
    // rather than rendering a broken image.
    if (!session.outputImageUrl) return null;
    return {
      styleName: session.style.name,
      styleSlug: session.style.slug,
      selectedColor: session.selectedColor,
      selectedSize: session.selectedSize,
      selectedLength: session.selectedLength,
      resultImageUrl: session.outputImageUrl,
    };
  } catch {
    return null;
  }
}

function imageBackgroundStyle(src: string) {
  return { backgroundImage: `url("${src.replace(/"/g, "%22")}")` };
}

export default async function AiStudioSharePage({ params }: SharePageProps) {
  const { shareToken } = await params;
  const preview = await getSharedPreview(shareToken);

  if (!preview) {
    return (
      <section className="page-container grid min-h-[70dvh] place-items-center py-16 text-center">
        <div className="max-w-md">
          <div className="relative mx-auto size-16">
            <Image
              alt=""
              className="object-contain"
              fill
              sizes="64px"
              src={brandAssets.logoMark}
            />
          </div>
          <h1 className="mt-5 font-serif text-4xl font-semibold text-[var(--color-brand-strong)]">
            This preview has expired
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Create your own private hairstyle preview in Touch of Heaven AI
            Studio.
          </p>
          <Link className="btn-primary mt-6" href="/ai-studio">
            Create your own
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container py-12">
      <div className="mx-auto max-w-3xl text-center">
        <div className="relative mx-auto size-16">
          <Image
            alt=""
            className="object-contain"
            fill
            sizes="64px"
            src={brandAssets.logoMark}
          />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
          Generated with Touch of Heaven AI Studio
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold text-[var(--color-brand-strong)]">
          {preview.styleName}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {preview.selectedColor} · {preview.selectedSize} ·{" "}
          {preview.selectedLength}
        </p>
        <div className="relative mt-8 aspect-[4/5] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-strong)] shadow-[var(--shadow-media)]">
          <div
            aria-label={`${preview.styleName} generated result`}
            className="size-full bg-cover bg-center"
            role="img"
            style={imageBackgroundStyle(preview.resultImageUrl)}
          />
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            className="btn-primary"
            href={`/ai-studio?style=${encodeURIComponent(preview.styleSlug)}`}
          >
            Try This Style
          </Link>
          <Link
            className="btn-secondary"
            href={`/explore?style=${encodeURIComponent(
              preview.styleSlug,
            )}&q=${encodeURIComponent(preview.styleName)}`}
          >
            Book This Style
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
