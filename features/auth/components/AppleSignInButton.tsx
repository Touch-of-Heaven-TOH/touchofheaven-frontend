import { getClientEnv } from "@/lib/env/client";

export type AppleSignInButtonProps = {
  className?: string;
};

/**
 * A real navigation (not a fetch), same reasoning as GoogleSignInButton.
 * Gracefully 404s server-side until APPLE_CLIENT_ID/SECRET are configured.
 */
export function AppleSignInButton({ className }: AppleSignInButtonProps) {
  const { apiUrl } = getClientEnv();

  return (
    <a
      href={`${apiUrl}/api/v1/auth/oauth/apple`}
      className={["btn-secondary w-full justify-center gap-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      <svg aria-hidden="true" viewBox="0 0 17 20" className="size-4 shrink-0" fill="currentColor">
        <path d="M14.06 10.6c-.02-2.1 1.72-3.11 1.8-3.16-.98-1.43-2.5-1.63-3.04-1.65-1.3-.13-2.53.76-3.19.76-.66 0-1.67-.75-2.75-.73-1.41.02-2.72.82-3.44 2.08-1.47 2.54-.38 6.31 1.06 8.37.7 1.01 1.53 2.14 2.62 2.1 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.63.68 2.75.66 1.13-.02 1.85-1.02 2.55-2.05.8-1.17 1.13-2.31 1.15-2.37-.03-.01-2.2-.85-2.23-3.33ZM11.98 4.24c.58-.71.98-1.68.87-2.66-.84.04-1.87.57-2.47 1.27-.54.62-1.02 1.62-.9 2.57.93.07 1.9-.47 2.5-1.18Z" />
      </svg>
      Continue with Apple
    </a>
  );
}
