"use client";

import { browserApiFetch } from "@/lib/api/browser";
import { DISPLAY_TO_CATEGORY, toAiStudioSession, toAiStudioStyle } from "@/features/ai-studio/api/style-mapper";
import type { RawStyle } from "@/features/ai-studio/api/style-mapper";
import type {
  AiStudioAudience,
  AiStudioCreditBalance,
  AiStudioGenerateResponse,
  AiStudioSessionRaw,
  AiStudioUploadAuthorization,
} from "@/features/ai-studio/types";

type StylesPayload =
  | RawStyle[]
  | {
      styles?: RawStyle[];
      items?: RawStyle[];
    };

type CreditsPayload =
  | AiStudioCreditBalance
  | {
      credits?: AiStudioCreditBalance;
    };

type SessionsPayload =
  | AiStudioSessionRaw[]
  | {
      sessions?: AiStudioSessionRaw[];
      items?: AiStudioSessionRaw[];
    };

function asStyles(payload: StylesPayload): RawStyle[] {
  if (Array.isArray(payload)) return payload;
  return payload.styles ?? payload.items ?? [];
}

function asCredits(payload: CreditsPayload): AiStudioCreditBalance {
  if ("balance" in payload) return payload;
  return payload.credits ?? { balance: 0 };
}

function asSessions(payload: SessionsPayload): AiStudioSessionRaw[] {
  if (Array.isArray(payload)) return payload;
  return payload.sessions ?? payload.items ?? [];
}

export async function fetchAiStudioStyles(input: {
  category?: string;
  audience?: AiStudioAudience;
  q?: string;
} = {}) {
  const params = new URLSearchParams();
  if (input.category && input.category !== "All") {
    // Accepts either the raw backend enum ("KNOTLESS_BRAIDS") or the
    // display label ("Knotless Braids") the UI's category chips use -
    // the backend's query schema only understands the raw enum form.
    params.set("category", DISPLAY_TO_CATEGORY[input.category] ?? input.category);
  }
  if (input.audience) params.set("audience", input.audience);
  if (input.q) params.set("q", input.q);
  const query = params.toString();
  const payload = await browserApiFetch<StylesPayload>(
    `/api/v1/studio/styles${query ? `?${query}` : ""}`,
  );
  return asStyles(payload).map(toAiStudioStyle);
}

export async function fetchAiStudioCredits() {
  return asCredits(
    await browserApiFetch<CreditsPayload>("/api/v1/studio/credits"),
  );
}

export async function requestAiStudioUploadUrl(input: {
  filename: string;
  contentType: "image/jpeg" | "image/png";
}) {
  return browserApiFetch<AiStudioUploadAuthorization>(
    "/api/v1/studio/upload-url",
    {
      method: "POST",
      body: input,
    },
  );
}

export async function startAiStudioGeneration(input: {
  objectKey: string;
  styleId: string;
  selectedColor: string;
  selectedSize: string;
  selectedLength: string;
}) {
  return browserApiFetch<AiStudioGenerateResponse>("/api/v1/studio/generate", {
    method: "POST",
    body: input,
  });
}

export async function fetchAiStudioSession(sessionId: string) {
  const raw = await browserApiFetch<AiStudioSessionRaw>(
    `/api/v1/studio/sessions/${encodeURIComponent(sessionId)}`,
  );
  return toAiStudioSession(raw);
}

export async function fetchAiStudioSessions(limit = 8) {
  const payload = await browserApiFetch<SessionsPayload>(
    `/api/v1/studio/sessions?limit=${limit}`,
  );
  return asSessions(payload).map(toAiStudioSession);
}

export async function shareAiStudioSession(sessionId: string) {
  return browserApiFetch<{ shareUrl: string }>(
    `/api/v1/studio/sessions/${encodeURIComponent(sessionId)}/share`,
    { method: "POST", body: {} },
  );
}

