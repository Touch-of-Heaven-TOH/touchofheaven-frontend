import { ICON_PATHS, type IconName } from "@/components/app/icon-paths";

export type { IconName };

/** One of the app's line icons. Decorative unless given a `label`. */
export function Icon({
  name,
  size = 22,
  filled = false,
  label,
  className,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      className={`toh-icon${filled ? " toh-icon--filled" : ""}${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

/** The verified-business seal used next to business names. */
export function VerifiedMark({ size = 16 }: { size?: number }) {
  return (
    <span className="toh-verified" title="Verified by Touch of Heaven">
      <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Verified">
        <path
          fill="currentColor"
          d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z"
        />
        <path d="M8 12.2l2.6 2.6L16.2 9" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="toh-stars" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <svg key={value} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={value <= rounded ? "on" : ""}>
          <path fill="currentColor" d={ICON_PATHS.star} />
        </svg>
      ))}
    </span>
  );
}
