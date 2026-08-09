export function safeReturnUrl(value: string | null | undefined): string {
  if (!value) return "/account";

  try {
    const decoded = decodeURIComponent(value);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return "/account";
    }

    if (decoded.includes("\\") || decoded.includes("\u0000")) {
      return "/account";
    }

    return decoded;
  } catch {
    return "/account";
  }
}
