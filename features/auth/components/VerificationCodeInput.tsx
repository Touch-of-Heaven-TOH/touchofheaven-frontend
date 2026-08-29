"use client";

import { useEffect, useRef } from "react";

const CODE_LENGTH = 6;

export type VerificationCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
};

export function VerificationCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
}: VerificationCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");
  // Mirrors `digits` but updates synchronously, in-place, ahead of React's
  // render cycle - setDigit/handlePaste read this instead of the `digits`
  // above so two digits typed in quick succession (or a paste that lands
  // just after a keystroke) both build on the true latest value instead of
  // a stale pre-render snapshot, which could otherwise silently drop a
  // digit and leave onComplete never firing. Only ever written from event
  // handlers (never during render, which React disallows) - this effect
  // just resyncs it when `value` changes for a reason other than this
  // component's own handlers, e.g. the parent clearing the code on error.
  const latestDigitsRef = useRef(digits);
  useEffect(() => {
    latestDigitsRef.current = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");
  }, [value]);

  function setDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const nextDigits = [...latestDigitsRef.current];
    nextDigits[index] = digit;
    latestDigitsRef.current = nextDigits;
    const next = nextDigits.join("");
    onChange(next);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.length === CODE_LENGTH && !nextDigits.includes("")) {
      onComplete?.(next);
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();

    const next = (latestDigitsRef.current.join("").slice(0, index) + pasted).slice(
      0,
      CODE_LENGTH,
    );
    latestDigitsRef.current = Array.from({ length: CODE_LENGTH }, (_, i) => next[i] ?? "");
    onChange(next);
    const focusIndex = Math.min(next.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
    if (next.length === CODE_LENGTH) {
      onComplete?.(next);
    }
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
          className="size-12 rounded-md border border-[var(--color-border)] bg-white text-center text-2xl font-bold text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-brand)] sm:size-14"
          disabled={disabled}
          inputMode="numeric"
          key={index}
          maxLength={1}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          value={digit}
        />
      ))}
    </div>
  );
}
