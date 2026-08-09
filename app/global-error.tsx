"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-dvh place-items-center px-6 py-16">
          <section className="w-full max-w-xl text-center">
            <p className="text-sm font-semibold uppercase text-[#b42318]">
              Application error
            </p>
            <h1 className="mt-4 text-4xl font-semibold">
              Touch of Heaven needs a refresh.
            </h1>
            <button
              className="mt-8 rounded-md bg-[#5c2747] px-5 py-3 text-sm font-semibold text-white"
              type="button"
              onClick={reset}
            >
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
