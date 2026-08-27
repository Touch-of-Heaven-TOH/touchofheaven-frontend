import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <section className="surface-panel w-full max-w-xl p-6 text-center">
        <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
          Access
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text-primary)]">
          This workspace is not available for this account.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          You can continue from your account dashboard or sign in with an
          approved role.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="btn-primary" href="/account">
            Go to account
          </Link>
          <Link className="btn-secondary" href="/customer/sign-in">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
