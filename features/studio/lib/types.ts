/**
 * Response shapes for /api/v1/business/* and the owner-only availability
 * and service endpoints the Studio uses. Mirrors
 * Backend_for_HOF/modules/business/*.service.ts - dates arrive as ISO
 * strings and every money value is an integer number of cents.
 */

export type AccessLevel = "none" | "view" | "manage";

export type BusinessModule =
  | "overview"
  | "calendar"
  | "appointments"
  | "clients"
  | "services"
  | "availability"
  | "waitlist"
  | "team"
  | "earnings"
  | "analytics"
  | "portfolio";

export type TeamRole = "OWNER" | "MANAGER" | "STAFF" | "RECEPTIONIST";

export type BusinessContext = {
  businessId: string;
  businessName: string;
  timezone: string;
  role: TeamRole;
  isOwner: boolean;
  teamMemberId: string | null;
  appointmentScope: "all" | "assigned";
  permissions: Record<BusinessModule, AccessLevel>;
  modules: BusinessModule[];
  user: { id: string; firstName: string; lastName: string; email: string };
};

export type AppointmentStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_PROFESSIONAL"
  | "NO_SHOW"
  | "DISPUTED";

export type ChangeRequestType = "RESCHEDULE" | "CANCELLATION";

export type AppointmentSummary = {
  id: string;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  durationMins: number;
  serviceName: string;
  customer: { id: string; name: string };
  teamMember: { id: string; name: string } | null;
  priceCents: number;
  depositPaidCents: number;
  balanceDueCents: number;
  tipCents: number;
  checkInAt: string | null;
  serviceStartedAt: string | null;
  completedAt: string | null;
  rescheduleCount: number;
  scalpSensitivity: boolean;
  pendingChangeRequest: {
    id: string;
    type: ChangeRequestType;
    requestedStartAt: string | null;
    createdAt: string;
  } | null;
  createdAt: string;
};

export type OverviewResponse = {
  date: string;
  timezone: string;
  businessName: string;
  today: {
    booked: number;
    completed: number;
    inChair: number;
    remaining: number;
    noShows: number;
    cancelled: number;
    expectedRevenueCents: number | null;
    completedRevenueCents: number | null;
  };
  nowServing: AppointmentSummary | null;
  nextUp: AppointmentSummary | null;
  schedule: AppointmentSummary[];
  comingUp: AppointmentSummary[];
  attention: {
    pendingChangeRequests: number;
    awaitingPayment: number;
    activeWaitlist: number | null;
    overdueCheckIns: number;
  };
  week: { bookings: number; revenueCents: number | null };
};

export type AppointmentsView = "today" | "upcoming" | "requests" | "history";

export type AppointmentsResponse = {
  appointments: AppointmentSummary[];
  total: number;
  page: number;
  limit: number;
  counts: { upcoming: number; today: number; requests: number };
};

export type PolicyView = { key: string; label: string; description: string };

export type RefundQuote = {
  policy: PolicyView;
  initiatedBy: "CLIENT" | "BUSINESS";
  hoursBeforeStart: number;
  refundBasisPoints: number;
  maxRefundableCents: number;
  policyRefundCents: number;
};

export type Refund = {
  id: string;
  amountCents: number;
  currency: string;
  status: "REQUESTED" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  reasonCategory: string;
  createdAt: string;
  completedAt: string | null;
  failureMessage: string | null;
};

export type ChangeRequest = {
  id: string;
  appointmentId: string;
  type: ChangeRequestType;
  status: "PENDING" | "APPROVED" | "DECLINED" | "WITHDRAWN";
  requestedStartAt: string | null;
  reason: string;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type TimelineEntry = {
  event: string;
  label: string;
  at: string;
  actor: string | null;
  detail: Record<string, unknown>;
};

export type BalanceCollectionMethod =
  | "CASH"
  | "CARD"
  | "MOBILE_MONEY"
  | "BANK_TRANSFER"
  | "OTHER";

export type AppointmentDetail = {
  id: string;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  durationMins: number;
  originalStartAt: string | null;
  rescheduleCount: number;
  createdAt: string;
  lifecycle: {
    checkInAt: string | null;
    checkInMethod: "QR_CODE" | "SHORT_CODE" | "MANUAL" | null;
    serviceStartedAt: string | null;
    completedAt: string | null;
    noShowAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;
  };
  service: {
    id: string;
    name: string;
    variations: Array<{ label: string; priceDeltaCents: number; durationDeltaMins: number }>;
    cancellationPolicy: PolicyView;
  };
  location: { id: string; label: string; locationType: string };
  teamMember: { id: string; name: string; jobTitle: string | null } | null;
  client: {
    id: string;
    name: string;
    preferredName: string | null;
    email: string;
    phone: string | null;
    stats: {
      visits: number;
      completed: number;
      noShows: number;
      cancellations: number;
      lastVisitAt: string | null;
    };
  };
  consultation: {
    recipientType: "SELF" | "CHILD";
    childName: string | null;
    currentHairLength: string;
    currentStyle: string;
    scalpSensitivity: boolean;
    tenderness: string | null;
    mediaCount: number;
  } | null;
  pricing: {
    servicePriceCents: number;
    depositPaidCents: number;
    balanceDueCents: number;
    balanceCollectedCents: number;
    balanceCollectionMethod: BalanceCollectionMethod | null;
    tipCents: number;
    refundedCents: number;
    pendingRefundCents: number;
    netCollectedCents: number;
  };
  notes: { professionalNotes: string | null; completionNotes: string | null };
  review: { rating: number; reviewBody: string; createdAt: string } | null;
  refunds: Refund[];
  changeRequests: ChangeRequest[];
  timeline: TimelineEntry[];
  allowedActions: {
    checkIn: boolean;
    undoCheckIn: boolean;
    startService: boolean;
    complete: boolean;
    markNoShow: boolean;
    noShowAvailableAt: string | null;
    reschedule: boolean;
    cancel: boolean;
    assign: boolean;
    editNotes: boolean;
    refund: boolean;
    decideChangeRequests: boolean;
  };
};

export type AppointmentDetailResponse = { appointment: AppointmentDetail };

export type CancellationQuoteResponse = {
  appointmentId: string;
  status: AppointmentStatus;
  canCancel: boolean;
  depositPaidCents: number;
  alreadyRefundedCents: number;
  business: RefundQuote;
  clientPolicy: RefundQuote;
};

export type BlockType =
  | "VACATION"
  | "PERSONAL"
  | "HOLIDAY"
  | "MAINTENANCE"
  | "MANUAL_APPOINTMENT";

export type CalendarBlockedPeriod = {
  id: string;
  startAt: string;
  endAt: string;
  blockType: BlockType;
  reason: string | null;
};

export type WorkingHours = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  locationId: string;
};

export type CalendarResponse = {
  timezone: string;
  range: { from: string; to: string };
  appointments: AppointmentSummary[];
  blockedPeriods: CalendarBlockedPeriod[];
  workingHours: WorkingHours[];
  teamMembers: Array<{ id: string; name: string; jobTitle: string | null }>;
};

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  visits: number;
  completedVisits: number;
  noShows: number;
  totalSpentCents: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  nextAppointmentAt: string | null;
  tags: string[];
};

export type ClientsResponse = {
  clients: ClientRow[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalClients: number;
    newThisMonth: number;
    returningClients: number;
    returningRateBp: number;
  };
};

export type ClientProfileResponse = {
  client: {
    id: string;
    name: string;
    preferredName: string | null;
    email: string;
    phone: string | null;
    firstVisitAt: string | null;
    lastVisitAt: string | null;
  };
  stats: {
    visits: number;
    completed: number;
    cancellations: number;
    noShows: number;
    totalSpentCents: number;
    averageSpendCents: number;
    tipsCents: number;
  };
  record: { notes: string | null; tags: string[]; updatedAt: string | null };
  hairProfile: {
    currentHairLength: string;
    currentStyle: string;
    scalpSensitivity: boolean;
    tenderness: string | null;
    updatedAt: string;
  } | null;
  reviews: Array<{ rating: number; reviewBody: string; createdAt: string }>;
  nextAppointment: AppointmentSummary | null;
  appointments: AppointmentSummary[];
  canManage: boolean;
};

export type WaitlistWindow = "ANY" | "MORNING" | "AFTERNOON" | "EVENING";

export type WaitlistEntry = {
  id: string;
  status: "ACTIVE" | "OFFERED" | "BOOKED" | "CANCELLED" | "EXPIRED";
  earliestDate: string;
  latestDate: string;
  preferredWindow: WaitlistWindow;
  preferredDays: number[];
  notes: string | null;
  createdAt: string;
  business: { id: string; name: string };
  service: { id: string; name: string; durationMins: number; priceCents: number };
  customer: { id: string; name: string };
  activeOffer: { id: string; startAt: string; endAt: string; expiresAt: string } | null;
  offers: Array<{
    id: string;
    status: "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";
    startAt: string;
    endAt: string;
    expiresAt: string;
    respondedAt: string | null;
    createdAt: string;
  }>;
};

export type WaitlistResponse = {
  entries: WaitlistEntry[];
  counts: { active: number; offered: number };
  timezone: string;
};

export type OpeningsResponse = {
  date: string;
  today: string;
  timezone: string;
  withinRequestedDates: boolean;
  slots: Array<{ startAt: string; matchesPreference: boolean }>;
};

export type TeamMember = {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  role: Exclude<TeamRole, "OWNER"> | "OWNER";
  roleLabel: string;
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
  permissions: Record<BusinessModule, AccessLevel>;
  overrides: Partial<Record<BusinessModule, AccessLevel>>;
  invitedAt: string;
  acceptedAt: string | null;
  hasAccount: boolean;
  upcomingAppointments: number;
};

export type TeamResponse = {
  owner: {
    name: string;
    professionalName: string;
    email: string;
    role: "OWNER";
    roleLabel: string;
    upcomingAppointments: number;
  } | null;
  members: TeamMember[];
  modules: BusinessModule[];
  roleDefaults: Record<TeamRole, Record<BusinessModule, AccessLevel>>;
  roleLabels: Record<TeamRole, string>;
  canManage: boolean;
};

export type TeamInvitation = {
  id: string;
  businessName: string;
  role: TeamRole;
  roleLabel: string;
  jobTitle: string | null;
  invitedAt: string;
};

export type AnalyticsRange = "7d" | "30d" | "90d" | "12m";

export type AnalyticsMetrics = {
  bookings: number;
  completed: number;
  cancellations: number;
  noShows: number;
  revenueCents: number;
  tipsCents: number;
  averageTicketCents: number;
  completionRateBp: number;
  cancellationRateBp: number;
  noShowRateBp: number;
  clients: number;
  newClients: number;
  returningClients: number;
  returningRateBp: number;
};

export type AnalyticsResponse = {
  range: AnalyticsRange;
  bucket: "day" | "week" | "month";
  timezone: string;
  period: { start: string; end: string };
  metrics: AnalyticsMetrics;
  previous: AnalyticsMetrics;
  changes: {
    revenueBp: number | null;
    bookingsBp: number | null;
    averageTicketBp: number | null;
    newClientsBp: number | null;
    completionRateBp: number;
  };
  series: Array<{ key: string; bookings: number; completed: number; revenueCents: number }>;
  topServices: Array<{
    serviceId: string;
    name: string;
    bookings: number;
    completed: number;
    revenueCents: number;
  }>;
  busiestDays: number[];
  busiestHours: number[];
  team: Array<{
    teamMemberId: string | null;
    name: string;
    bookings: number;
    completed: number;
    revenueCents: number;
  }>;
  definitions: Record<string, string>;
};

export type EarningsResponse = {
  currency: string;
  balances: {
    pendingCents: number;
    availableCents: number;
    paidOutCents: number;
    reversedCents: number;
  };
  lifetime: {
    grossCents: number;
    platformFeeCents: number;
    processorFeeCents: number;
    netCents: number;
  };
  thisMonth: {
    completedAppointments: number;
    serviceValueCents: number;
    depositsCents: number;
    collectedInPersonCents: number;
    tipsCents: number;
  };
  earnings: Array<{
    id: string;
    sourceType: "APPOINTMENT" | "SELLER_ORDER_GROUP";
    sourceId: string;
    description: string;
    serviceDate: string | null;
    grossAmountCents: number;
    platformFeeCents: number;
    netAmountCents: number;
    status: "PENDING" | "AVAILABLE" | "PAID" | "REVERSED";
    availableAt: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    amountCents: number;
    currency: string;
    status: string;
    provider: string;
    initiatedAt: string;
    expectedArrivalAt: string | null;
    arrivedAt: string | null;
    failureMessage: string | null;
    itemCount: number;
  }>;
  payoutAccount: {
    provider: string;
    onboardingState: string;
    payoutsEnabled: boolean;
    chargesEnabled: boolean;
  } | null;
};

export type ServiceStatus = "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "PAUSED" | "ARCHIVED";

export type OwnService = {
  id: string;
  name: string;
  description: string | null;
  basePriceCents: number;
  baseDurationMins: number;
  depositPercentage: number;
  cancellationPolicy: string;
  status: ServiceStatus;
  variations: Array<{ id: string; label: string; variationType: string; priceDeltaCents: number }>;
  media: Array<{ id: string; url: string; altText: string }>;
};

export type AvailabilityRule = {
  id: string;
  locationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type OwnLocation = {
  id: string;
  label: string;
  locationType: string;
};
