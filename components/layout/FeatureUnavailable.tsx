import Link from "next/link";
import { PauseCircle } from "lucide-react";

/**
 * What a client sees when a feature is switched off at the platform
 * level. Not a 404 - the page exists and will come back - and not an
 * empty screen either: it says what is unavailable, what still works, and
 * offers somewhere to go.
 */
export function FeatureUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto grid w-full max-w-[640px] justify-items-start gap-4 px-4 py-20 sm:px-6">
      <PauseCircle aria-hidden="true" className="size-9 text-[var(--color-brand)]" />
      <h1 className="font-serif text-3xl font-semibold text-[var(--color-text-primary)]">
        {title}
      </h1>
      <p className="text-[var(--color-text-muted)]">{description}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link className="btn-primary min-h-11" href="/explore">
          Find a professional
        </Link>
        <Link className="btn-secondary min-h-11" href="/home">
          Go to your home
        </Link>
      </div>
    </section>
  );
}
