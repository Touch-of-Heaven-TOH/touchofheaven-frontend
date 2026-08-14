type HeroProgressProps = {
  activeIndex: number;
  total: number;
};

export function HeroProgress({ activeIndex, total }: HeroProgressProps) {
  const width = `${((activeIndex + 1) / total) * 100}%`;

  return (
    <div className="w-full max-w-[220px]" aria-hidden="true">
      <div className="mb-2 flex justify-between text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
        <span>Slide {activeIndex + 1}</span>
        <span>{total}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[var(--color-brand)]/15">
        <div
          className="h-full rounded-full bg-[var(--color-gold)] transition-[width] duration-300"
          style={{ width }}
        />
      </div>
    </div>
  );
}
