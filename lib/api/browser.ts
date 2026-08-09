"use client";

import { getClientEnv } from "@/lib/env/client";
import type { RequestJson } from "@/lib/api/types";
import { requestId, toApiUrl, unwrapApiResponse } from "@/lib/api/shared";

let cachedCsrfToken: string | null = null;

type BrowserApiInit = Omit<RequestInit, "body"> & {
  body?: RequestJson | FormData;
  csrf?: boolean;
};

type CsrfResponse = {
  csrfToken: string;
};

async function csrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  const env = getClientEnv();
  const response = await fetch(toApiUrl(env.apiUrl, "/api/v1/auth/csrf"), {
    credentials: "include",
    headers: { "X-Request-Id": requestId() },
  });
  const data = await unwrapApiResponse<CsrfResponse>(response);
  cachedCsrfToken = data.csrfToken;
  return data.csrfToken;
}

export async function browserApiFetch<TData>(
  path: string,
  init: BrowserApiInit = {},
): Promise<TData> {
  const env = getClientEnv();
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);
  headers.set("X-Request-Id", requestId());

  const needsCsrf =
    init.csrf ?? !["GET", "HEAD", "OPTIONS"].includes(method);
  if (needsCsrf) {
    headers.set("X-CSRF-Token", await csrfToken());
  }

  let body: BodyInit | undefined;
  if (init.body instanceof FormData) {
    body = init.body;
  } else if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }

  const response = await fetch(toApiUrl(env.apiUrl, path), {
    ...init,
    method,
    headers,
    body,
    credentials: "include",
  });

  return unwrapApiResponse<TData>(response);
}
