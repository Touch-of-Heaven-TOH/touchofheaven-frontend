export type VerifiedBadgeProps = {
  label?: string;
  size?: number;
  className?: string;
};

export function VerifiedBadge({
  label = "Verified professional",
  size = 16,
  className,
}: VerifiedBadgeProps) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={["inline-flex shrink-0 text-[#1D9BF0]", className].filter(Boolean).join(" ")}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1.5 14.85 3.9l3.6-.6 1.05 3.53 3.15 2-1.5 3.35 1.5 3.35-3.15 2-1.05 3.53-3.6-.6L12 22.5l-2.85-2.4-3.6.6-1.05-3.53-3.15-2 1.5-3.35-1.5-3.35 3.15-2 1.05-3.53 3.6.6L12 1.5Z" />
        <path
          d="M8.5 12.2l2.4 2.4 4.6-5.2"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
}
