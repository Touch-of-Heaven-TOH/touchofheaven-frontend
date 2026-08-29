"use client";

import { sortedCountriesForDropdown } from "@/lib/reference-data/countries";

const COUNTRIES = sortedCountriesForDropdown();

export function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
      Country
      <select
        className="min-h-12 rounded-md border border-[var(--color-border)] bg-white px-3 text-base outline-none focus:border-[var(--color-brand)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Select a country</option>
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </label>
  );
}
