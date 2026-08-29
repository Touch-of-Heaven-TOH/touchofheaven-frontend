"use client";

import { MapPin, Home, Car, User } from "lucide-react";

const OPTIONS: { value: string; label: string; icon: typeof MapPin }[] = [
  { value: "PUBLIC_SALON", label: "Business location", icon: MapPin },
  { value: "PRIVATE_STUDIO", label: "Private studio", icon: Home },
  { value: "MOBILE", label: "Mobile service", icon: Car },
  { value: "CLIENT_LOCATION", label: "Client's location", icon: User },
];

export function LocationTypeToggleGroup({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(option: string) {
    onChange(
      value.includes(option) ? value.filter((v) => v !== option) : [...value, option],
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Service location type">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const pressed = value.includes(option.value);
        return (
          <button
            aria-pressed={pressed}
            className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition ${
              pressed
                ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand-strong)]"
                : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-brand)]/50"
            }`}
            key={option.value}
            onClick={() => toggle(option.value)}
            type="button"
          >
            <Icon aria-hidden="true" size={18} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
