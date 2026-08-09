import { headers as incomingHeaders } from "next/headers";
import { getServerEnv } from "@/lib/env/server";
import { requestId, toApiUrl, unwrapApiResponse } from "@/lib/api/shared";

export async function serverApiFetch<TData>(
  path: string,
  init: RequestInit = {},
): Promise<TData> {
  const env = getServerEnv();
  const requestHeaders = await incomingHeaders();
  const headers = new Headers(init.headers);
  const cookie = requestHeaders.get("cookie");

  headers.set("X-Request-Id", requestId());
  if (cookie) {
    headers.set("Cookie", cookie);
  }

  const response = await fetch(toApiUrl(env.backendApiUrl, path), {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  return unwrapApiResponse<TData>(response);
}
