import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication error",
  description: "Authentication could not be completed.",
};

export default function AuthErrorPage() {
  return (
    <section className="surface-panel w-full max-w-md p-6 text-center">
      <p className="text-sm font-semibold uppercase text-[var(--color-danger)]">
        Authentication error
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text-primary)]">
        We could not finish that sign-in.
      </h1>
      <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
        The provider may have cancelled, expired, or returned an unavailable
        account state.
      </p>
      <Link className="btn-primary mt-6" href="/customer/sign-in">
        Try again
      </Link>
    </section>
  );
}
