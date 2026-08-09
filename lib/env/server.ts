import { getClientEnv } from "@/lib/env/client";

export type ServerEnv = {
  backendApiUrl: string;
};

export function getServerEnv(): ServerEnv {
  const clientEnv = getClientEnv();
  const backendApiUrl = process.env.BACKEND_INTERNAL_API_URL?.trim();

  if (!backendApiUrl) {
    return { backendApiUrl: clientEnv.apiUrl };
  }

  try {
    return { backendApiUrl: new URL(backendApiUrl).origin };
  } catch {
    throw new Error("BACKEND_INTERNAL_API_URL must be a valid absolute URL.");
  }
}
