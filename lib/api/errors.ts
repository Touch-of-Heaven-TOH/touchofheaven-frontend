import type { ApiFailure } from "@/lib/api/types";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | null;
  readonly details: unknown;

  constructor(input: {
    message: string;
    code: string;
    status: number;
    requestId?: string | null;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.code = input.code;
    this.status = input.status;
    this.requestId = input.requestId ?? null;
    this.details = input.details;
  }
}

export function errorFromEnvelope(
  envelope: ApiFailure,
  status: number,
): ApiClientError {
  return new ApiClientError({
    code: envelope.error.code,
    message: envelope.error.message,
    status,
    requestId: envelope.requestId,
    details: envelope.error.details,
  });
}
