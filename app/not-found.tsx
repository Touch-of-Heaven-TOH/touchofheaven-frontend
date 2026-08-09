import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <section className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
          Page not found
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[var(--color-text-primary)]">
          This page is not part of the current experience.
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--color-text-muted)]">
          The route may have moved, or it may belong to a future marketplace or
          operational flow that is not active yet.
        </p>
        <Link className="btn-primary mt-8 inline-flex" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
