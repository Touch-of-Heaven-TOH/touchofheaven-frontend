import { Check } from "lucide-react";

// The backend's actual rule (modules/auth/auth.constants.ts's
// PASSWORD_MIN_LENGTH) is a flat minimum length - no enforced character
// mix. The strength bar below is advisory UX only; it must not claim
// requirements the backend doesn't check, or a password that clears real
// validation could look "wrong" here.
const MIN_LENGTH = 12;

function scorePassword(password: string) {
  if (password.length === 0) return 0;

  let score = password.length >= MIN_LENGTH ? 1 : 0;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  if (password.length >= MIN_LENGTH + 6) score += 1;

  return Math.min(score, 4);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const BAR_COLORS = [
  "bg-[var(--color-border)]",
  "bg-[var(--color-danger)]",
  "bg-[var(--color-copper)]",
  "bg-[var(--color-gold)]",
  "bg-[var(--color-success)]",
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = scorePassword(password);
  const meetsMinimum = password.length >= MIN_LENGTH;

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-4 gap-1.5" role="presentation">
          {[0, 1, 2, 3].map((segment) => (
            <span
              className={`h-1.5 rounded-full transition-colors ${
                segment < score ? BAR_COLORS[score] : "bg-[var(--color-border)]"
              }`}
              key={segment}
            />
          ))}
        </div>
        {password.length > 0 ? (
          <span className="text-xs font-bold text-[var(--color-text-muted)]">
            {LABELS[score]}
          </span>
        ) : null}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        {meetsMinimum ? (
          <Check aria-hidden="true" className="text-[var(--color-success)]" size={14} />
        ) : null}
        Use at least {MIN_LENGTH} characters.
      </p>
    </div>
  );
}
