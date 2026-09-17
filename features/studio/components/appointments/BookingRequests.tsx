"use client";

import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  DollarSign,
  Inbox,
  MapPin,
  MessageCircle,
  Scissors,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Button } from "@/components/shared/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { StudioDialog } from "@/features/studio/components/ui/StudioDialog";
import {
  Avatar,
  EmptyPanel,
  FormError,
  PageHeader,
  Pill,
  SkeletonRows,
  TextAreaField,
} from "@/features/studio/components/ui/primitives";
import { useToast } from "@/features/studio/components/ui/Toaster";
import {
  errorMessage,
  newIdempotencyKey,
  studioFetcher,
  studioRequest,
  withQuery,
} from "@/features/studio/lib/api";
import { useStudio } from "@/features/studio/lib/context";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatTime,
} from "@/features/studio/lib/format";
import { useIsDesktop } from "@/features/studio/lib/hooks";
import type {
  AppointmentDetail,
  AppointmentDetailResponse,
  AppointmentSummary,
  AppointmentsResponse,
  ChangeRequest,
  SlotCheck,
} from "@/features/studio/lib/types";

type Filter = "all" | "changes" | "deposit";

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function kindOf(appointment: AppointmentSummary) {
  if (appointment.pendingChangeRequest) {
    return appointment.pendingChangeRequest.type === "RESCHEDULE"
      ? { label: "Reschedule requested", tone: "danger" as const }
      : { label: "Cancellation requested", tone: "danger" as const };
  }
  return { label: "Deposit pending", tone: "warning" as const };
}

/**
 * Everything waiting on the business: clients asking to move or cancel, and
 * bookings still waiting for a deposit. Nothing here changes on the client
 * side of the browser - every decision is a server call that re-checks the
 * calendar and the booking's state before applying it.
 */
export function BookingRequests() {
  const isDesktop = useIsDesktop();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const [filter, setFilter] = useState<Filter>("all");
  const [searchInput, setSearchInput] = useState("");
  const search = useDeferredValue(searchInput.trim());

  const { data, error, isLoading, mutate } = useSWR<AppointmentsResponse>(
    withQuery("/api/v1/business/appointments", { view: "requests", search, limit: 50 }),
    studioFetcher,
    { keepPreviousData: true },
  );

  const all = data?.appointments ?? [];
  const changes = all.filter((row) => row.pendingChangeRequest);
  const deposits = all.filter((row) => !row.pendingChangeRequest);
  const rows = filter === "changes" ? changes : filter === "deposit" ? deposits : all;
  const selected = rows.find((row) => row.id === selectedId) ?? (isDesktop ? rows[0] : undefined);

  const select = (id: string | null) => {
    router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });
  };

  const pills: Array<{ value: Filter; label: string; count: number }> = [
    { value: "all", label: "All", count: all.length },
    { value: "changes", label: "Changes requested", count: changes.length },
    { value: "deposit", label: "Deposit pending", count: deposits.length },
  ];

  return (
    <div className="grid gap-5 *:min-w-0">
      <PageHeader
        title="Booking requests"
        icon={Inbox}
        backHref="/studio/appointments"
        backLabel="Bookings"
        description="Clients asking to change a booking, and bookings waiting for a deposit."
      />

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative -mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {pills.map((pill) => (
            <button
              key={pill.value}
              type="button"
              aria-pressed={filter === pill.value}
              onClick={() => setFilter(pill.value)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm whitespace-nowrap ${
                filter === pill.value
                  ? "border-[var(--color-brand)] bg-[var(--color-surface)] font-medium text-[var(--color-brand)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
              }`}
            >
              {pill.label}
              <span className="grid min-w-6 place-items-center rounded-full bg-[var(--color-brand-soft)] px-1.5 text-xs text-[var(--color-brand)]">
                {pill.count}
              </span>
            </button>
          ))}
        </div>
        <label className="relative block lg:w-80">
          <span className="sr-only">Search requests</span>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search requests…"
            className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pr-3 pl-9 text-sm focus-ring"
          />
        </label>
      </div>

      {isLoading && !data ? (
        <SkeletonRows label="Loading requests" rows={4} />
      ) : error && !data ? (
        <ErrorState description="We couldn't load booking requests." onRetry={() => void mutate()} />
      ) : rows.length === 0 ? (
        <EmptyPanel
          icon={<CircleCheck aria-hidden="true" className="size-6" />}
          title="No requests waiting"
          description="When a client asks to reschedule or cancel, or a booking is waiting for its deposit, it appears here."
        />
      ) : isDesktop ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
          <ul className="grid gap-2.5">
            {rows.map((row) => (
              <li key={row.id}>
                <RequestListItem appointment={row} selected={row.id === selected?.id} onSelect={() => select(row.id)} />
              </li>
            ))}
          </ul>
          {selected ? (
            <section className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-subtle)]">
              <RequestDetail key={selected.id} summary={selected} onDone={() => void mutate()} />
            </section>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-2.5">
          {rows.map((row) => {
            const open = row.id === selected?.id;
            return (
              <li
                key={row.id}
                className={`overflow-hidden rounded-[var(--radius-panel)] border bg-[var(--color-surface)] shadow-[var(--shadow-subtle)] ${
                  open ? "border-[var(--color-brand)]" : "border-[var(--color-border)]"
                }`}
              >
                <RequestListItem appointment={row} selected={open} onSelect={() => select(open ? null : row.id)} bare />
                {open ? (
                  <div className="border-t border-[var(--color-border)]">
                    <RequestDetail summary={row} onDone={() => void mutate()} compact />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RequestListItem({
  appointment,
  selected,
  onSelect,
  bare = false,
}: {
  appointment: AppointmentSummary;
  selected: boolean;
  onSelect: () => void;
  bare?: boolean;
}) {
  const { timezone } = useStudio();
  const kind = kindOf(appointment);
  const received = appointment.pendingChangeRequest?.createdAt ?? appointment.createdAt;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-expanded={selected}
      className={`flex w-full items-start gap-3 p-4 text-left ${
        bare
          ? ""
          : `rounded-[var(--radius-panel)] border shadow-[var(--shadow-subtle)] ${
              selected
                ? "border-[var(--color-brand)] bg-[#fdf6f7]"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]"
            }`
      }`}
    >
      <Avatar name={appointment.customer.name} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[17px] text-[var(--color-text-primary)]">
          {appointment.customer.name}
        </span>
        <span className="block truncate text-sm text-[var(--color-text-muted)]">{appointment.serviceName}</span>
        <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">Received {timeAgo(received)}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5 text-right">
        <span className="text-sm whitespace-nowrap text-[var(--color-text-primary)]">
          {formatDate(appointment.startAt, timezone, { weekday: "short", month: "short", day: "numeric" })}
        </span>
        <span className="text-sm whitespace-nowrap text-[var(--color-text-muted)]">{formatTime(appointment.startAt, timezone)}</span>
        <Pill tone={kind.tone}>{kind.label}</Pill>
      </span>
      {bare ? (
        <ChevronDown aria-hidden="true" className={`mt-1 size-5 shrink-0 text-[var(--color-text-muted)] transition-transform ${selected ? "rotate-180" : ""}`} />
      ) : null}
    </button>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3">
      <Icon aria-hidden="true" strokeWidth={1.6} className="mt-0.5 size-5 shrink-0 text-[var(--color-brand)]" />
      <div className="min-w-0">
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        <div className="text-[15px] text-[var(--color-text-primary)]">{children}</div>
      </div>
    </div>
  );
}

function RequestDetail({
  summary,
  onDone,
  compact = false,
}: {
  summary: AppointmentSummary;
  onDone: () => void;
  compact?: boolean;
}) {
  const { timezone, can } = useStudio();
  const { mutate: globalMutate } = useSWRConfig();
  const notify = useToast();
  const { data, error } = useSWR<AppointmentDetailResponse>(`/api/v1/business/appointments/${summary.id}`, studioFetcher);
  const request = data?.appointment.changeRequests.find((item) => item.status === "PENDING") ?? null;
  const proposedStart = request?.type === "RESCHEDULE" ? request.requestedStartAt : null;
  const { data: slot } = useSWR<SlotCheck>(
    data && (request === null || proposedStart)
      ? withQuery(`/api/v1/business/appointments/${summary.id}/slot-check`, { startAt: proposedStart })
      : null,
    studioFetcher,
  );
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (error) return <div className="p-5"><FormError message={errorMessage(error)} /></div>;
  if (!data) return <div className="p-5"><SkeletonRows label="Loading request" rows={2} /></div>;

  const appointment = data.appointment;
  const canManage = appointment.allowedActions.decideChangeRequests;

  const refresh = async () => {
    onDone();
    await globalMutate((key) => typeof key === "string" && key.startsWith("/api/v1/business/"));
  };

  const acceptReschedule = async (changeRequest: ChangeRequest) => {
    setAccepting(true);
    setActionError(null);
    try {
      await studioRequest(`/api/v1/business/change-requests/${changeRequest.id}`, "POST", { decision: "APPROVE" });
      notify({
        tone: "success",
        title: "Reschedule approved",
        description: changeRequest.requestedStartAt
          ? `Moved to ${formatDateTime(changeRequest.requestedStartAt, timezone)}. The client has been emailed.`
          : undefined,
      });
      await refresh();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setAccepting(false);
    }
  };

  const depositPercent = appointment.pricing.servicePriceCents
    ? Math.round((appointment.pricing.depositPaidCents / appointment.pricing.servicePriceCents) * 100)
    : 0;

  return (
    <div className="grid gap-5 p-4 sm:p-6">
      {!compact ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={appointment.client.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-display text-xl">{appointment.client.name}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {appointment.client.stats.completed > 0
                  ? `Returning client · ${appointment.client.stats.visits} bookings`
                  : "New client"}
              </p>
              <div className="mt-1">
                {appointment.client.stats.noShows > 0 ? (
                  <Pill tone="warning">{appointment.client.stats.noShows} no-show{appointment.client.stats.noShows === 1 ? "" : "s"}</Pill>
                ) : (
                  <Pill tone="info">Good standing</Pill>
                )}
              </div>
            </div>
          </div>
          <p className="text-right text-xs text-[var(--color-text-muted)]">
            Received {timeAgo(request?.createdAt ?? appointment.createdAt)}
            <br />
            <span className="font-mono">{summary.reference}</span>
          </p>
        </div>
      ) : null}

      {request ? (
        <blockquote className="rounded-xl bg-[var(--color-surface-strong)] p-4 text-[15px] text-[var(--color-text-primary)]">
          <p className="mb-1 text-xs font-medium tracking-wide text-[var(--color-text-muted)] uppercase">
            {request.type === "RESCHEDULE" ? "Reschedule reason" : "Cancellation reason"} (from client)
          </p>
          “{request.reason}”
        </blockquote>
      ) : (
        <p className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4 text-sm text-[var(--color-text-primary)]">
          This booking confirms automatically as soon as the client pays the deposit. Until then the time is held for them.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Detail icon={CalendarDays} label={proposedStart ? "Requested new time" : "Date & time"}>
          {formatDateTime(proposedStart ?? appointment.startAt, timezone)}
          {proposedStart ? (
            <span className="block text-sm text-[var(--color-text-muted)]">Currently {formatDateTime(appointment.startAt, timezone)}</span>
          ) : null}
        </Detail>
        <Detail icon={Clock} label="Estimated duration">
          {formatDuration(appointment.durationMins)}
        </Detail>
        <Detail icon={Scissors} label="Service">
          {appointment.service.name}
          {appointment.service.variations.length > 0 ? (
            <span className="block text-sm text-[var(--color-text-muted)]">
              {appointment.service.variations.map((variation) => variation.label).join(" · ")}
            </span>
          ) : null}
        </Detail>
        <Detail icon={MapPin} label="Location">
          {appointment.location.label}
        </Detail>
        <Detail icon={DollarSign} label="Total service price">
          {formatMoney(appointment.pricing.servicePriceCents)}
        </Detail>
        <Detail icon={DollarSign} label={`Deposit${depositPercent ? ` (${depositPercent}%)` : ""}`}>
          {appointment.pricing.depositPaidCents > 0 ? formatMoney(appointment.pricing.depositPaidCents) : "Not paid yet"}
          <span className="block text-sm text-[var(--color-danger)]">
            {formatMoney(appointment.pricing.balanceDueCents)} remaining balance
          </span>
        </Detail>
      </div>

      <div className="grid gap-3 border-t border-[var(--color-border)] pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <CircleCheck aria-hidden="true" strokeWidth={1.6} className="size-5 text-[var(--color-brand)]" />
          <span className="text-[15px]">Consultation</span>
          {appointment.consultation ? <Pill tone="success">Complete</Pill> : <Pill tone="neutral">Not submitted</Pill>}
        </div>
        {slot ? (
          <div className="flex flex-wrap items-start gap-2">
            {slot.available ? (
              <ShieldCheck aria-hidden="true" strokeWidth={1.6} className="size-5 text-[var(--color-success)]" />
            ) : (
              <ShieldAlert aria-hidden="true" strokeWidth={1.6} className="size-5 text-[var(--color-danger)]" />
            )}
            <span className="text-[15px]">Schedule conflict check</span>
            {slot.available ? <Pill tone="success">No conflicts</Pill> : <Pill tone="danger">Conflict</Pill>}
            <p className="w-full pl-7 text-sm text-[var(--color-text-muted)]">
              {slot.conflict?.message ??
                (slot.withinWorkingHours ? "You're available at this time." : "Free, but outside your published working hours.")}
            </p>
          </div>
        ) : null}
        <p className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
          <ShieldCheck aria-hidden="true" strokeWidth={1.6} className="mt-0.5 size-5 shrink-0 text-[var(--color-brand)]" />
          {appointment.service.cancellationPolicy.label} policy: {appointment.service.cancellationPolicy.description}
        </p>
      </div>

      <FormError message={actionError} />

      {canManage ? (
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:flex-wrap sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          {request?.type === "RESCHEDULE" ? (
            <>
              <Button variant="outline" leadingIcon={<X aria-hidden="true" className="size-4" />} onClick={() => setDeclining(true)}>
                Decline
              </Button>
              <Link href={`/studio/appointments/${appointment.id}/reschedule`} className="btn-secondary !font-medium">
                <CalendarClock aria-hidden="true" className="size-4" />
                Propose another time
              </Link>
              <Button
                leadingIcon={<Check aria-hidden="true" className="size-4" />}
                loading={accepting}
                disabled={slot ? !slot.available : true}
                onClick={() => void acceptReschedule(request)}
              >
                Accept request
              </Button>
            </>
          ) : request?.type === "CANCELLATION" ? (
            <>
              <Button variant="outline" leadingIcon={<X aria-hidden="true" className="size-4" />} onClick={() => setDeclining(true)}>
                Keep booking
              </Button>
              <Link href={`/studio/appointments/${appointment.id}/cancel?request=${request.id}`} className="btn-primary !font-medium">
                Review cancellation
              </Link>
            </>
          ) : (
            <>
              {can("appointments", "manage") ? (
                <Button variant="outline" leadingIcon={<X aria-hidden="true" className="size-4" />} onClick={() => setDeclining(true)}>
                  Decline booking
                </Button>
              ) : null}
              <Link href="/studio/messages" className="btn-secondary !font-medium">
                <MessageCircle aria-hidden="true" className="size-4" />
                Message client
              </Link>
              <Link href={`/studio/appointments/${appointment.id}`} className="btn-primary !font-medium">
                View booking
              </Link>
            </>
          )}
        </div>
      ) : null}

      {declining ? (
        <DeclineDialog
          appointment={appointment}
          request={request}
          onClose={() => setDeclining(false)}
          onDone={async () => {
            setDeclining(false);
            await refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function DeclineDialog({
  appointment,
  request,
  onClose,
  onDone,
}: {
  appointment: AppointmentDetail;
  request: ChangeRequest | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const notify = useToast();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(newIdempotencyKey);

  const submit = async () => {
    if (reason.trim().length < 3) {
      setError("Give the client a short reason.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (request) {
        await studioRequest(`/api/v1/business/change-requests/${request.id}`, "POST", {
          decision: "DECLINE",
          note: reason.trim(),
        });
        notify({ tone: "success", title: "Request declined", description: "The booking stays as it was. The client has been emailed." });
      } else {
        await studioRequest(`/api/v1/business/appointments/${appointment.id}/cancel`, "POST", {
          reason: reason.trim(),
          refundMode: "NONE",
          idempotencyKey,
          notifyClient: true,
        });
        notify({ tone: "success", title: "Booking declined", description: "The held time has been released." });
      }
      await onDone();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <StudioDialog
      open
      onClose={onClose}
      title={request ? "Decline request" : "Decline booking"}
      description={request ? "The appointment keeps its current time." : "The unpaid booking is cancelled and the time is released."}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Go back
          </Button>
          <Button variant="danger" loading={pending} onClick={() => void submit()}>
            Decline
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <TextAreaField
          label="Reason for the client"
          value={reason}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Unfortunately that time is no longer available."
        />
        <FormError message={error} />
      </div>
    </StudioDialog>
  );
}
