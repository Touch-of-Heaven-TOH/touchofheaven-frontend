export type StarRatingProps = {
  rating: number;
  reviewCount?: number;
  max?: number;
  size?: number;
  className?: string;
};

/**
 * Renders precise fractional fill (e.g. 4.9/5) via a clipped overlay star
 * layer rather than rounding to the nearest whole star.
 */
export function StarRating({
  rating,
  reviewCount,
  max = 5,
  size = 16,
  className,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(rating, max));
  const label =
    reviewCount === undefined
      ? `${clamped.toFixed(1)} out of ${max} stars`
      : `${clamped.toFixed(1)} out of ${max} stars, ${reviewCount} reviews`;

  return (
    <span
      role="img"
      aria-label={label}
      className={["inline-flex items-center gap-1", className].filter(Boolean).join(" ")}
    >
      <span className="relative inline-flex" style={{ width: size * max, height: size }}>
        <StarRow size={size} max={max} className="text-[var(--color-border)]" />
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${(clamped / max) * 100}%` }}
        >
          <StarRow size={size} max={max} className="text-[var(--color-gold)]" />
        </span>
      </span>
      {reviewCount !== undefined ? (
        <span aria-hidden="true" className="text-sm text-[var(--color-text-muted)]">
          {clamped.toFixed(1)} ({reviewCount})
        </span>
      ) : null}
    </span>
  );
}

function StarRow({
  size,
  max,
  className,
}: {
  size: number;
  max: number;
  className: string;
}) {
  return (
    <span aria-hidden="true" className={`flex ${className}`}>
      {Array.from({ length: max }, (_, index) => (
        <svg key={index} width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.5l2.598 5.264 5.809.844-4.204 4.098.993 5.789L10 14.847l-5.196 2.732.992-5.789L1.593 7.608l5.809-.844L10 1.5Z" />
        </svg>
      ))}
    </span>
  );
}
