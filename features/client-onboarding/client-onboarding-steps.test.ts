import { describe, expect, it } from "vitest";
import {
  CLIENT_ONBOARDING_STEPS,
  nextStepSlug,
  previousStepSlug,
  stepFromSlug,
} from "@/features/client-onboarding/client-onboarding-steps";

describe("client onboarding steps", () => {
  it("keeps the approved ten-step journey in order", () => {
    expect(CLIENT_ONBOARDING_STEPS.map((step) => step.slug)).toEqual([
      "welcome",
      "profile",
      "contact",
      "verify-phone",
      "location",
      "services",
      "booking",
      "notifications",
      "privacy",
      "complete",
    ]);
  });

  it("falls back to the welcome step for missing or unknown slugs", () => {
    expect(stepFromSlug(undefined).slug).toBe("welcome");
    expect(stepFromSlug("missing").slug).toBe("welcome");
  });

  it("moves forward and backward through route slugs", () => {
    expect(nextStepSlug(1)).toBe("profile");
    expect(nextStepSlug(9)).toBe("complete");
    expect(nextStepSlug(10)).toBeUndefined();
    expect(previousStepSlug(10)).toBe("privacy");
    expect(previousStepSlug(1)).toBeUndefined();
  });
});
