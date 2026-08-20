import type { Metadata } from "next";
import { AiStudioExperience } from "@/features/ai-studio";
import { fallbackAiStudioStyles } from "@/features/ai-studio/data/fallback-catalog";
import type { AiStudioStyle } from "@/features/ai-studio/types";
import { serverApiFetch } from "@/lib/api/server";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "AI hairstyle studio",
  description:
    "Choose a hairstyle, personalize the look, and prepare a secure Touch of Heaven AI preview.",
};

type AiStudioPageProps = {
  searchParams?: Promise<{
    style?: string;
    color?: string;
  }>;
};

type StylesPayload =
  | AiStudioStyle[]
  | {
      styles?: AiStudioStyle[];
      items?: AiStudioStyle[];
    };

function asStyles(payload: StylesPayload) {
  if (Array.isArray(payload)) return payload;
  return payload.styles ?? payload.items ?? [];
}

async function getInitialCatalogue() {
  try {
    const styles = asStyles(await serverApiFetch<StylesPayload>("/api/v1/studio/styles"));
    if (styles.length > 0) {
      return {
        styles,
        source: "backend" as const,
        error: null,
      };
    }
  } catch {
    // The backend AI Studio endpoints are intentionally allowed to arrive later.
  }

  return {
    styles: fallbackAiStudioStyles,
    source: "fallback" as const,
    error:
      "Live catalogue is not available locally, so approved imported Brane references are shown.",
  };
}

export default async function AiStudioPage({ searchParams }: AiStudioPageProps) {
  const paramsPromise: Promise<{ style?: string; color?: string }> =
    searchParams ?? Promise.resolve({});
  const [user, params, catalogue] = await Promise.all([
    getCurrentUser(),
    paramsPromise,
    getInitialCatalogue(),
  ]);

  return (
    <AiStudioExperience
      initialCatalogError={catalogue.error}
      initialCatalogSource={catalogue.source}
      initialColorId={params.color ?? null}
      initialStyleId={params.style ?? null}
      initialStyles={catalogue.styles}
      initialUser={user}
    />
  );
}
