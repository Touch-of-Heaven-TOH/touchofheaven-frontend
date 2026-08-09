"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <section className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase text-[var(--color-danger)]">
          Something went wrong
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[var(--color-text-primary)]">
          We could not finish loading this screen.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
          Try again. If the problem continues, contact support with the request
          time and page you were opening.
        </p>
        <button className="btn-primary mt-8" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
