import { Check } from "lucide-react";
import { WIZARD_STEPS, type WizardStepNumber } from "@/features/business-wizard/wizard-steps";

export function WizardStepperDesktop({ currentStep }: { currentStep: WizardStepNumber }) {
  return (
    <nav aria-label="Setup progress" className="mt-6">
      <ol className="grid gap-6">
        {WIZARD_STEPS.map((step, index) => {
          const isComplete = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          return (
            <li className="relative flex gap-4" key={step.number}>
              {index < WIZARD_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`absolute left-[19px] top-10 h-[calc(100%+0.5rem)] w-px ${
                    isComplete ? "bg-[var(--color-gold)]" : "bg-white/25"
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 font-serif text-lg font-semibold ${
                  isComplete
                    ? "border-white bg-white text-[var(--color-brand-strong)]"
                    : isCurrent
                      ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-[var(--color-brand-strong)]"
                      : "border-white/40 text-white/60"
                }`}
              >
                {isComplete ? <Check aria-hidden="true" size={18} /> : step.number}
              </span>
              <span>
                <span
                  className={`block text-base font-semibold ${
                    isCurrent
                      ? "text-[var(--color-gold-light)]"
                      : isComplete
                        ? "text-white"
                        : "text-white/60"
                  }`}
                >
                  {step.title}
                </span>
                <span className="block text-sm text-white/60">{step.subtitle}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function WizardStepperMobile({ currentStep }: { currentStep: WizardStepNumber }) {
  const current = WIZARD_STEPS[currentStep - 1]!;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
        Step {currentStep} of {WIZARD_STEPS.length}
      </p>
      <div className="mt-3 flex gap-1.5" role="presentation">
        {WIZARD_STEPS.map((step) => (
          <span
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-full ${
              step.number <= currentStep
                ? "bg-[var(--color-brand)]"
                : "bg-[var(--color-border)]"
            }`}
            key={step.number}
          />
        ))}
      </div>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-[var(--color-text-primary)]">
        {current.title}
      </h1>
    </div>
  );
}
