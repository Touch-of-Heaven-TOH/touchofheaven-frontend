export type ClientEnv = {
  appUrl: string;
  apiUrl: string;
  stripePublishableKey: string;
};

function normalizeUrl(name: string, value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback;

  try {
    return new URL(candidate).origin;
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`);
  }
}

export function getClientEnv(): ClientEnv {
  return {
    appUrl: normalizeUrl(
      "NEXT_PUBLIC_APP_URL",
      process.env.NEXT_PUBLIC_APP_URL,
      "http://localhost:3001",
    ),
    apiUrl: normalizeUrl(
      "NEXT_PUBLIC_API_URL",
      process.env.NEXT_PUBLIC_API_URL,
      "http://localhost:3000",
    ),
    stripePublishableKey:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "",
  };
}
