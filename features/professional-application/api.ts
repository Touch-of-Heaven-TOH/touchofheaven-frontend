"use client";

import { browserApiFetch } from "@/lib/api/browser";

export type ProfessionalApplicationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type RequestableRole = "BRAIDER" | "SELLER";

export type ProfessionalApplication = {
  id: string;
  requestedRoles: RequestableRole[];
  applicantMessage: string;
  status: ProfessionalApplicationStatus;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

export async function fetchMyProfessionalApplications() {
  const { applications } = await browserApiFetch<{
    applications: ProfessionalApplication[];
  }>("/api/v1/professional-applications/me");
  return applications;
}

export async function submitProfessionalApplication(input: {
  requestedRoles: RequestableRole[];
  applicantMessage: string;
}) {
  return browserApiFetch<{ id: string; status: ProfessionalApplicationStatus }>(
    "/api/v1/professional-applications",
    { method: "POST", body: input },
  );
}
