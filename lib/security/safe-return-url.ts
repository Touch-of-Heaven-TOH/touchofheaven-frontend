export function safeReturnUrl(
  value: string | null | undefined,
  fallback = "/account",
): string {
  if (!value) return fallback;

  try {
    const decoded = decodeURIComponent(value);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return fallback;
    }

    if (decoded.includes("\\") || decoded.includes("\u0000")) {
      return fallback;
    }

    return decoded;
  } catch {
    return fallback;
  }
}
