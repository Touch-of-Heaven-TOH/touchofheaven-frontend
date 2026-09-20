/** Shapes the admin pages read from the backend. */

export type ApplicationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type ApplicationListItem = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  businessName: string | null;
  businessCategory: string | null;
  workMode: string | null;
  locationType: string[];
  location: string | null;
  requestedRoles: string[];
  status: ApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
};

export type ApplicationDetail = ApplicationListItem & {
  userId: string;
  professionalName: string | null;
  businessPhone: string | null;
  businessDescription: string | null;
  logoUrl: string | null;
  handle: string | null;
  applicantMessage: string | null;
  address: {
    line1: string;
    line2?: string;
    neighborhood?: string;
    locality: string;
    administrativeArea?: string;
    postalCode?: string;
    countryCode: string;
  } | null;
  addressLine: string | null;
  hideAddressUntilConfirmed: boolean;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  workingDays: number[];
  reviewNotes: string | null;
  reviewedByAdminId: string | null;
  createdAt: string;
  draftServices?: {
    id: string;
    name: string;
    description?: string | null;
    priceCents?: number | null;
    durationMinutes?: number | null;
  }[];
};

export type PlatformStats = {
  pendingApplications: number;
  openDisputes: number;
  activeProviders: number;
  activeClients: number;
};

export type PlatformPolicy = {
  platformFeePercent: number;
  minimumBookingValueCents: number;
  cancellationWindowHours: number;
  maxRefundDays: number;
  termsOfServiceUrl: string | null;
  privacyPolicyUrl: string | null;
  providerCodeOfConductUrl: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type SystemConfig = {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  newRegistrationsEnabled: boolean;
  aiStudioEnabled: boolean;
  marketplaceEnabled: boolean;
  maxBookingsPerDay: number | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type AuditEntry = {
  id: string;
  event: string;
  outcome: string;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
  metadata: unknown;
};
