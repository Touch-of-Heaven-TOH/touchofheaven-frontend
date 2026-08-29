"use client";

// 0=Sunday..6=Saturday, matching AvailabilityRule.dayOfWeek.
const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export function WorkingDaysToggleRow({
  value,
  onChange,
}: {
  value: number[];
  onChange: (value: number[]) => void;
}) {
  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Typical working days">
      {DAYS.map((day) => {
        const pressed = value.includes(day.value);
        return (
          <button
            aria-pressed={pressed}
            className={`min-w-16 rounded-full border px-3 py-2 text-sm font-semibold transition ${
              pressed
                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/50"
            }`}
            key={day.value}
            onClick={() => toggle(day.value)}
            type="button"
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
