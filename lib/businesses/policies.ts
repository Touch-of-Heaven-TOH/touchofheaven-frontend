/**
 * The cancellation policies a business can put a service under. The codes
 * are the backend's (Service.cancellationPolicy); refunds follow them
 * automatically, judged at the moment the client asks.
 */
export const CANCELLATION_POLICIES = [
  { value: "flexible-v1", label: "Flexible", description: "Full refund up to 4 hours before." },
  { value: "standard-v1", label: "Standard", description: "Full refund up to 24 hours before, 50% after." },
  { value: "strict-v1", label: "Strict", description: "Full refund up to 72 hours before, 50% up to 24 hours." },
] as const;

export type CancellationPolicy = (typeof CANCELLATION_POLICIES)[number];

export function cancellationPolicyFor(code: string): CancellationPolicy | null {
  return CANCELLATION_POLICIES.find((policy) => policy.value === code) ?? null;
}
