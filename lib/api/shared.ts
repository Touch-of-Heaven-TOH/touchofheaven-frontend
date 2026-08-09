import { ApiClientError, errorFromEnvelope } from "@/lib/api/errors";
import type { ApiEnvelope } from "@/lib/api/types";

export function toApiUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export function requestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}`;
}

export async function unwrapApiResponse<TData>(
  response: Response,
): Promise<TData> {
  const contentType = response.headers.get("content-type") ?? "";
  const requestIdHeader = response.headers.get("x-request-id");

  if (!contentType.includes("application/json")) {
    if (!response.ok) {
      throw new ApiClientError({
        code: "NON_JSON_RESPONSE",
        message: "The server returned an unexpected response.",
        status: response.status,
        requestId: requestIdHeader,
      });
    }

    return undefined as TData;
  }

  const envelope = (await response.json()) as ApiEnvelope<TData>;

  if (!response.ok || !envelope.success) {
    if (envelope.success) {
      throw new ApiClientError({
        code: "HTTP_ERROR",
        message: "The server rejected the request.",
        status: response.status,
        requestId: envelope.requestId,
      });
    }

    throw errorFromEnvelope(envelope, response.status);
  }

  return envelope.data;
}
