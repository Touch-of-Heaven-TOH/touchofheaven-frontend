"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchDate } from "@/components/search/search-date";
import {
  SEARCH_DATE_PRESETS,
  formatSearchDate,
  isoDate,
  startOfDay,
} from "@/components/search/search-date";

/*
 * The date field on the search bar: a button that opens a calendar.
 *
 * It offers the two presets the platform can answer directly - today, and
 * this week - alongside a month grid for an exact day. An exact day is a
 * real filter, not decoration: the discovery API returns each provider's
 * nextAvailableSlotAt as a timestamp, so "free by the 12th" is a question
 * the data can answer.
 *
 * Past days are disabled because a provider's next opening can never be
 * behind us, so picking one could only ever return nothing.
 */

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Days to render, Monday-first, with leading blanks for alignment. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  // getDay() is Sunday-first; shift so Monday is 0.
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
  ];
}

export function DateField({
  value,
  onChange,
  id,
}: {
  value: SearchDate;
  onChange: (value: SearchDate) => void;
  id?: string;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const today = startOfDay(new Date());
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : null;
  const [cursor, setCursor] = useState(() => {
    const base = selected ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) close(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function pick(next: SearchDate) {
    onChange(next);
    close();
  }

  const grid = monthGrid(cursor.year, cursor.month);
  // Nothing before this month is selectable, so hide the way back to it.
  const atFirstMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className="relative min-w-0" ref={wrapperRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="flex min-h-11 w-full min-w-0 items-center gap-2 bg-transparent px-3 text-left text-sm outline-none"
      >
        <CalendarDays
          aria-hidden="true"
          className="size-5 shrink-0 text-[var(--color-text-muted)]"
        />
        <span className="truncate">{formatSearchDate(value)}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Choose a date"
          className="absolute left-0 right-auto top-[calc(100%+0.5rem)] z-[var(--z-overlay)] w-[19rem] max-w-[calc(100vw-2rem)] rounded-[var(--radius-panel,16px)] border border-[var(--color-border)] bg-white p-3 shadow-[0_24px_70px_rgba(45,27,78,0.22)]"
        >
          <div className="grid grid-cols-3 gap-1.5">
            {SEARCH_DATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => pick(preset.value)}
                aria-pressed={value === preset.value}
                className={`min-h-9 rounded-full border px-2 text-xs font-bold transition ${
                  value === preset.value
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                    : "border-[var(--color-border)] bg-white text-[var(--color-brand-strong)] hover:border-[var(--color-brand)]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={atFirstMonth}
              aria-label="Previous month"
              className="grid size-9 place-items-center rounded-full text-[var(--color-brand)] transition enabled:hover:bg-[var(--color-brand-soft)] disabled:text-[var(--color-text-muted)]/40"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <p aria-live="polite" className="text-sm font-bold text-[var(--color-brand-strong)]">
              {monthLabel(cursor.year, cursor.month)}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="grid size-9 place-items-center rounded-full text-[var(--color-brand)] transition hover:bg-[var(--color-brand-soft)]"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>

          <div
            aria-hidden="true"
            className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[0.65rem] font-bold uppercase text-[var(--color-text-muted)]"
          >
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-0.5">
            {grid.map((day, index) => {
              if (!day) return <span key={`blank-${index}`} />;
              const iso = isoDate(day);
              const past = day < today;
              const isSelected = selected !== null && isoDate(selected) === iso;
              const isToday = isoDate(today) === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={past}
                  onClick={() => pick(iso as SearchDate)}
                  aria-label={day.toLocaleDateString(undefined, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  aria-current={isToday ? "date" : undefined}
                  className={`grid size-9 place-items-center rounded-full text-sm transition disabled:text-[var(--color-text-muted)]/35 ${
                    isSelected
                      ? "bg-[var(--color-brand)] font-bold text-white"
                      : isToday
                        ? "font-bold text-[var(--color-brand)] ring-1 ring-[var(--color-brand)] enabled:hover:bg-[var(--color-brand-soft)]"
                        : "text-[var(--color-text-primary)] enabled:hover:bg-[var(--color-brand-soft)]"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
