export const DISPUTE_CASE_TYPES = [
  "APPOINTMENT_QUALITY",
  "NO_SHOW",
  "LATE_CANCELLATION",
  "PRODUCT_NOT_RECEIVED",
  "PRODUCT_DAMAGED",
  "OTHER",
] as const;

export type DisputeCaseType = (typeof DISPUTE_CASE_TYPES)[number];

export const DISPUTE_CASE_TYPE_LABELS: Record<DisputeCaseType, string> = {
  APPOINTMENT_QUALITY: "Appointment quality",
  NO_SHOW: "No-show",
  LATE_CANCELLATION: "Late cancellation",
  PRODUCT_NOT_RECEIVED: "Product not received",
  PRODUCT_DAMAGED: "Product damaged",
  OTHER: "Other",
};

export type DisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "AWAITING_RESPONSE"
  | "RESOLVED"
  | "DISMISSED";

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  AWAITING_RESPONSE: "Awaiting response",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

export type DisputeSummary = {
  id: string;
  referenceNumber: string;
  caseType: DisputeCaseType;
  status: DisputeStatus;
  createdAt: string;
  openedByUserId: string;
  respondentUserId: string | null;
};

export type DisputesResponse = {
  disputes: DisputeSummary[];
  total: number;
  page: number;
  limit: number;
};

export type DisputeDetail = {
  id: string;
  referenceNumber: string;
  caseType: DisputeCaseType;
  description: string;
  status: DisputeStatus;
  openedByUserId: string;
  respondentUserId: string | null;
  appointmentId: string | null;
  respondentReplyBody: string | null;
  respondentRepliedAt: string | null;
  decisionReason: string | null;
  decisionRefundAmountMinor: string | null;
  decidedAt: string | null;
  createdAt: string;
  evidence: { id: string; createdAt: string }[];
};
