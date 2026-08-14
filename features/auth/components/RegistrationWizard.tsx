"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppleSignInButton } from "@/features/auth/components/AppleSignInButton";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { ApiClientError } from "@/lib/api/errors";
import { browserApiFetch } from "@/lib/api/browser";

// Must match modules/auth/auth.constants.ts PASSWORD_MIN_LENGTH on the
// backend - the reference design shows "8+ characters" but the backend
// actually requires 12, so the meter is corrected to match what the
// server will really accept rather than showing a passing meter the
// signup call then rejects.
const PASSWORD_MIN_LENGTH = 12;

const INTEREST_OPTIONS = [
  { value: "book-hairstyles", label: "Book hairstyles" },
  { value: "shop-products", label: "Shop African products" },
  { value: "sell-as-vendor", label: "Sell as a vendor/braider" },
  { value: "both", label: "Both booking & shopping" },
];

const COUNTRY_CODES = [
  { value: "+1", label: "+1 (US/Canada)" },
  { value: "+44", label: "+44 (UK)" },
  { value: "+233", label: "+233 (Ghana)" },
  { value: "+234", label: "+234 (Nigeria)" },
  { value: "+254", label: "+254 (Kenya)" },
  { value: "+27", label: "+27 (South Africa)" },
];

const DRAFT_KEY = "toh-signup-draft";

// Deliberately excludes password/confirmPassword: sessionStorage is
// readable by any script on the origin (including an XSS payload), and a
// plaintext password has no business surviving a tab close/reopen anyway.
type PersistedDraft = {
  firstName: string;
  lastName: string;
  email: string;
  interests: string[];
  location: string;
  countryCode: string;
  phone: string;
};

const emptyDraft: PersistedDraft = {
  firstName: "",
  lastName: "",
  email: "",
  interests: [],
  location: "",
  countryCode: "+1",
  phone: "",
};

type FieldErrors = Record<string, string>;

// Read once as the initial state (not in an effect + setState, which would
// cause an extra render pass) - guarded because this runs during SSR too,
// where sessionStorage does not exist.
function readDraft(): PersistedDraft {
  if (typeof window === "undefined") return emptyDraft;
  const saved = sessionStorage.getItem(DRAFT_KEY);
  if (!saved) return emptyDraft;
  try {
    return { ...emptyDraft, ...JSON.parse(saved) };
  } catch {
    sessionStorage.removeItem(DRAFT_KEY);
    return emptyDraft;
  }
}

export function RegistrationWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<PersistedDraft>(() => readDraft());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  function updateDraft(patch: Partial<PersistedDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function validateStep1(): FieldErrors {
    const errors: FieldErrors = {};
    if (draft.firstName.trim().length < 1) errors.firstName = "Enter your first name";
    if (draft.lastName.trim().length < 1) errors.lastName = "Enter your last name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      errors.email = "Enter a valid email address";
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    } else if (!/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      errors.password = "Include at least one number and one special character";
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  }

  function validateStep2(): FieldErrors {
    return draft.interests.length === 0
      ? { interests: "Select at least one interest to continue" }
      : {};
  }

  function goToStep(next: 1 | 2 | 3) {
    const errors = step === 1 ? validateStep1() : step === 2 ? validateStep2() : {};
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setStep(next);
  }

  function toggleInterest(value: string) {
    updateDraft({
      interests: draft.interests.includes(value)
        ? draft.interests.filter((item) => item !== value)
        : [...draft.interests, value],
    });
  }

  async function handleCreateAccount() {
    if (!acceptTerms) {
      setFieldErrors({ acceptTerms: "You must accept the terms to continue" });
      return;
    }

    setStatus("submitting");
    setFormError(null);
    setFieldErrors({});

    try {
      await browserApiFetch<{ message?: string }>("/api/v1/auth/signup", {
        method: "POST",
        body: {
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          email: draft.email.trim(),
          password,
          confirmPassword,
          acceptTerms: true,
        },
      });
      sessionStorage.removeItem(DRAFT_KEY);
      setStatus("success");
    } catch (error) {
      setStatus("idle");
      if (error instanceof ApiClientError) {
        if (error.code === "VALIDATION_ERROR" && isFieldErrorMap(error.details)) {
          const mapped = flattenFieldErrors(error.details);
          setFieldErrors(mapped);
          if (["firstName", "lastName", "email", "password", "confirmPassword"].some(
            (key) => key in mapped,
          )) {
            setStep(1);
          }
          return;
        }
        if (error.code === "EMAIL_ALREADY_REGISTERED") {
          setFieldErrors({ email: error.message });
          setStep(1);
          return;
        }
        setFormError(error.message);
        return;
      }
      setFormError("We could not create your account. Try again.");
    }
  }

  if (status === "success") {
    return (
      <section className="surface-panel w-full max-w-md bg-white/92 p-6 text-center shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
        <p className="text-sm font-semibold uppercase text-[var(--color-brand)]">
          Email verification
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">
          Check your email
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Account created. We sent a verification link to {draft.email}.
        </p>
        <Link className="btn-primary mt-6 justify-center" href="/sign-in">
          Return to sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="surface-panel w-full max-w-md bg-white/92 p-6 shadow-[var(--shadow-soft)] backdrop-blur md:p-8">
      <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--color-text-primary)]">
        Create Account
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
        Set up your Touch of Heaven profile for bookings, products, and secure account access.
      </p>

      <StepIndicator step={step} />

      {step === 1 ? (
        <div className="mt-6 grid gap-4">
          <Input
            label="First name"
            required
            value={draft.firstName}
            onChange={(event) => updateDraft({ firstName: event.target.value })}
            error={fieldErrors.firstName}
          />
          <Input
            label="Last name"
            required
            value={draft.lastName}
            onChange={(event) => updateDraft({ lastName: event.target.value })}
            error={fieldErrors.lastName}
          />
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={draft.email}
            onChange={(event) => updateDraft({ email: event.target.value })}
            error={fieldErrors.email}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />
          <PasswordStrength password={password} />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
          />
          <Button onClick={() => goToStep(2)}>Continue</Button>
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Already have an account?{" "}
            <Link className="font-semibold text-[var(--color-brand)]" href="/sign-in">
              Sign In
            </Link>
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 grid gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              What are you interested in?
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Select all that apply</p>
          </div>
          <div className="grid gap-2">
            {INTEREST_OPTIONS.map((option) => {
              const selected = draft.interests.includes(option.value);
              return (
                <button
                  type="button"
                  key={option.value}
                  aria-pressed={selected}
                  onClick={() => toggleInterest(option.value)}
                  className={[
                    "flex items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-left text-sm font-semibold transition-colors focus-ring",
                    selected
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] text-[var(--color-text-primary)]",
                  ].join(" ")}
                >
                  {option.label}
                  {selected ? <span aria-hidden="true">✓</span> : null}
                </button>
              );
            })}
          </div>
          {fieldErrors.interests ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {fieldErrors.interests}
            </p>
          ) : null}
          <Input
            label="Your location (optional)"
            placeholder="City or area"
            value={draft.location}
            onChange={(event) => updateDraft({ location: event.target.value })}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => goToStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 grid gap-4">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              Country
              <select
                className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm focus-ring"
                value={draft.countryCode}
                onChange={(event) => updateDraft({ countryCode: event.target.value })}
              >
                {COUNTRY_CODES.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Phone number (optional)"
              type="tel"
              value={draft.phone}
              onChange={(event) => updateDraft({ phone: event.target.value })}
            />
          </div>

          <label className="flex items-start gap-3 text-sm leading-6 text-[var(--color-text-muted)]">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
            />
            I agree to the{" "}
            <Link className="font-semibold text-[var(--color-brand)]" href="/legal/terms">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="font-semibold text-[var(--color-brand)]" href="/legal/privacy">
              Privacy Policy
            </Link>
          </label>
          {fieldErrors.acceptTerms ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {fieldErrors.acceptTerms}
            </p>
          ) : null}

          {formError ? (
            <p role="alert" className="text-sm text-[var(--color-danger)]">
              {formError}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="flex-1"
              loading={status === "submitting"}
              onClick={handleCreateAccount}
            >
              Create account
            </Button>
          </div>

          <div
            aria-hidden="true"
            className="flex items-center gap-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]"
          >
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            or
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <GoogleSignInButton />
          <AppleSignInButton />
        </div>
      ) : null}
    </section>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="mt-6 flex items-center gap-2" aria-label="Registration progress">
      {[1, 2, 3].map((value) => (
        <li key={value} className="flex flex-1 items-center gap-2">
          <span
            aria-current={step === value ? "step" : undefined}
            className={[
              "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
              value < step
                ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)]"
                : value === step
                  ? "border-2 border-[var(--color-brand)] text-[var(--color-brand)]"
                  : "border border-[var(--color-border)] text-[var(--color-text-muted)]",
            ].join(" ")}
          >
            {value < step ? "✓" : value}
          </span>
          {value < 3 ? (
            <span
              aria-hidden="true"
              className={[
                "h-px flex-1",
                value < step ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]",
              ].join(" ")}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: `${PASSWORD_MIN_LENGTH}+ characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { label: "Includes a number", met: /[0-9]/.test(password) },
    { label: "Includes a special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <ul className="grid gap-1 text-sm">
      {checks.map((check) => (
        <li
          key={check.label}
          className={
            check.met ? "text-[var(--color-success)]" : "text-[var(--color-text-muted)]"
          }
        >
          {check.met ? "✓" : "○"} {check.label}
        </li>
      ))}
    </ul>
  );
}

function isFieldErrorMap(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => Array.isArray(entry))
  );
}

function flattenFieldErrors(details: Record<string, string[]>): FieldErrors {
  const flattened: FieldErrors = {};
  for (const [field, messages] of Object.entries(details)) {
    if (messages[0]) flattened[field] = messages[0];
  }
  return flattened;
}
