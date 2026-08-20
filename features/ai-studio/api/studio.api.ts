"use client";

import { browserApiFetch } from "@/lib/api/browser";
import type {
  AiStudioCreditBalance,
  AiStudioGenerateResponse,
  AiStudioSession,
  AiStudioStyle,
  AiStudioUploadAuthorization,
} from "@/features/ai-studio/types";

type StylesPayload =
  | AiStudioStyle[]
  | {
      styles?: AiStudioStyle[];
      items?: AiStudioStyle[];
    };

type CreditsPayload =
  | AiStudioCreditBalance
  | {
      credits?: AiStudioCreditBalance;
    };

type SessionsPayload =
  | AiStudioSession[]
  | {
      sessions?: AiStudioSession[];
      items?: AiStudioSession[];
    };

function asStyles(payload: StylesPayload): AiStudioStyle[] {
  if (Array.isArray(payload)) return payload;
  return payload.styles ?? payload.items ?? [];
}

function asCredits(payload: CreditsPayload): AiStudioCreditBalance {
  if ("balance" in payload) return payload;
  return payload.credits ?? { balance: 0 };
}

function asSessions(payload: SessionsPayload): AiStudioSession[] {
  if (Array.isArray(payload)) return payload;
  return payload.sessions ?? payload.items ?? [];
}

export async function fetchAiStudioStyles(input: {
  category?: string;
  q?: string;
} = {}) {
  const params = new URLSearchParams();
  if (input.category && input.category !== "All") {
    params.set("category", input.category);
  }
  if (input.q) params.set("q", input.q);
  const query = params.toString();
  const payload = await browserApiFetch<StylesPayload>(
    `/api/v1/studio/styles${query ? `?${query}` : ""}`,
  );
  return asStyles(payload);
}

export async function fetchAiStudioCredits() {
  return asCredits(
    await browserApiFetch<CreditsPayload>("/api/v1/studio/credits"),
  );
}

export async function requestAiStudioUploadUrl(input: {
  filename: string;
  contentType: "image/jpeg";
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
  return browserApiFetch<AiStudioSession>(
    `/api/v1/studio/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export async function fetchAiStudioSessions(limit = 8) {
  const payload = await browserApiFetch<SessionsPayload>(
    `/api/v1/studio/sessions?limit=${limit}`,
  );
  return asSessions(payload);
}

export async function shareAiStudioSession(sessionId: string) {
  return browserApiFetch<{ shareUrl: string }>(
    `/api/v1/studio/sessions/${encodeURIComponent(sessionId)}/share`,
    { method: "POST", body: {} },
  );
}

