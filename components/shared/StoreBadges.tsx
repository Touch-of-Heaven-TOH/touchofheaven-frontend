import { Apple, Play } from "lucide-react";

export function GooglePlayBadge() {
  return (
    <span
      aria-label="Get it on Google Play"
      className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#151015] px-4 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
      role="img"
    >
      <Play
        aria-hidden="true"
        className="fill-[var(--color-gold)] text-[var(--color-gold)]"
        size={22}
      />
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">
          Get it on
        </span>
        <span className="block text-base font-bold">Google Play</span>
      </span>
    </span>
  );
}

export function AppStoreBadge() {
  return (
    <span
      aria-label="Download on the App Store"
      className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#151015] px-4 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
      role="img"
    >
      <Apple aria-hidden="true" size={22} />
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-white/70">
          Download on the
        </span>
        <span className="block text-base font-bold">App Store</span>
      </span>
    </span>
  );
}
