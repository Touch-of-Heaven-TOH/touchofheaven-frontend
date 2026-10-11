"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { BusinessAvatar, DemoNote, Empty, TopBar } from "@/components/app/ui";
import { useToast } from "@/components/feedback/ToastProvider";
import { AppointmentChangeRequests } from "@/features/bookings/components/AppointmentChangeRequests";
import { startConversation, submitReview, useAppointment, useBusiness } from "@/lib/app/data";
import { formatDay, formatDuration, formatFcfa, formatTime } from "@/lib/app/format";
import type { AppointmentDetail } from "@/lib/app/types";
import { statusPill } from "./BookingsScreen";

const PLACE: Record<string, string> = {
  PUBLIC_SALON: "At the salon",
  PRIVATE_STUDIO: "At a private studio",
  MOBILE: "They come to you",
};

/** A calendar file the phone or laptop opens in its own calendar app. */
function downloadCalendar(appointment: AppointmentDetail) {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const service = appointment.snapshot?.serviceName ?? "Appointment";
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Touch of Heaven//Bookings//EN",
    "BEGIN:VEVENT",
    `UID:${appointment.id}@touchofheaven`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(appointment.startAt)}`,
    `DTEND:${stamp(appointment.endAt)}`,
    `SUMMARY:${service} at ${appointment.business.name}`,
    `LOCATION:${appointment.location.label}`,
    `DESCRIPTION:Check-in code ${appointment.checkInCode ?? ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "touch-of-heaven-booking.ics";
  link.click();
  URL.revokeObjectURL(url);
}

export function AppointmentScreen({ id }: { id: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const justBooked = params.get("booked") === "1";
  const { appointment, error, isLoading, refresh } = useAppointment(id);
  const { business } = useBusiness(appointment?.business.id ?? null);
  const [opening, setOpening] = useState(false);

  if (error) {
    return (
      <>
        <TopBar title="Booking" back="/bookings" />
        <div className="toh-page toh-page--narrow">
          <div className="toh-card">
            <Empty icon="cal" title="We couldn't find this booking">
              <span>It may belong to another account.</span>
              <Link href="/bookings" className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill">
                Back to bookings
              </Link>
            </Empty>
          </div>
        </div>
      </>
    );
  }
  if (isLoading || !appointment) {
    return (
      <div className="toh-page toh-page--narrow">
        <div className="toh-skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const service = appointment.snapshot?.serviceName ?? "Appointment";
  const venue = appointment.business;
  const message = async () => {
    setOpening(true);
    try {
      const conversationId = await startConversation(venue.id);
      router.push(`/messages?c=${conversationId}`);
    } catch {
      toast.error("Couldn't open the chat. Try again.");
      setOpening(false);
    }
  };

  const summary = (
    <div className="toh-card toh-okcard">
      <Link href={`/businesses/${venue.id}`} className="toh-apt__venue">
        <BusinessAvatar id={venue.id} category={business?.businessCategory ?? null} logoUrl={business?.logoUrl} size={52} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <b>{venue.name}</b>
          <br />
          <span className="toh-muted" style={{ fontSize: 13 }}>
            {appointment.location.label} · {PLACE[appointment.location.locationType] ?? "Venue"}
          </span>
        </span>
        <Icon name="chevR" size={18} />
      </Link>
      <div className="toh-ln">
        <span>When</span>
        <b>
          {formatDay(appointment.startAt)}, {formatTime(appointment.startAt)}
        </b>
      </div>
      <div className="toh-ln">
        <span>Service</span>
        <b style={{ textAlign: "right" }}>{service}</b>
      </div>
      <div className="toh-ln">
        <span>Takes about</span>
        <b>{formatDuration(appointment.durationMins)}</b>
      </div>
      <div className="toh-ln">
        <span>With</span>
        <b>{appointment.teamMemberName ?? venue.professionalName}</b>
      </div>
      <div className="toh-ln">
        <span>Total</span>
        <b className="toh-num">{formatFcfa(appointment.computedPriceCents)}</b>
      </div>
      <div className="toh-ln">
        <span>Deposit paid</span>
        <b className="toh-num">{formatFcfa(appointment.depositPaidCents)}</b>
      </div>
      <div className="toh-ln">
        <span>Pay at the venue</span>
        <b className="toh-num">{formatFcfa(appointment.balanceDueCents)}</b>
      </div>
    </div>
  );

  if (justBooked) {
    return (
      <>
        <TopBar title="Booked" back="/bookings" />
        <div className="toh-okhero">
          <span className="toh-okhero__tick">
            <Icon name="check" size={40} />
          </span>
          <h1>Booking confirmed</h1>
          <p className="toh-muted">
            {venue.name} has your booking. Show your check-in code{" "}
            <b className="toh-num" style={{ color: "var(--color-text-primary)" }}>
              {appointment.checkInCode}
            </b>{" "}
            when you arrive.
          </p>
          {summary}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" className="toh-btn toh-btn--dark toh-btn--pill" onClick={() => downloadCalendar(appointment)}>
              <Icon name="cal" size={18} /> Add to calendar
            </button>
            <button type="button" className="toh-btn toh-btn--line toh-btn--pill" onClick={() => void message()} disabled={opening}>
              <Icon name="chat" size={18} /> Message {venue.name.split(" ")[0]}
            </button>
            <Link href="/bookings" className="toh-btn toh-btn--line toh-btn--pill">
              View bookings
            </Link>
          </div>
          <DemoNote>Demo: the deposit was confirmed by the test payment, no money moved.</DemoNote>
        </div>
      </>
    );
  }

  const upcoming = appointment.status === "CONFIRMED" || appointment.status === "ARRIVED" || appointment.status === "IN_PROGRESS";

  return (
    <>
      <TopBar title="Booking" back="/bookings" />
      <div className="toh-page toh-page--narrow">
        <nav className="toh-crumbs toh-only-desk" aria-label="Breadcrumb">
          <Link href="/bookings">Bookings</Link>
          <Icon name="chevR" size={12} />
          <span>{service}</span>
        </nav>
        <div className="toh-apt">
          <div className="toh-stack" style={{ gap: 16 }}>
            <div>
              {statusPill(appointment.status)}
              <h1 className="toh-apt__h">{service}</h1>
              <p className="toh-muted">
                {formatDay(appointment.startAt)} · {formatTime(appointment.startAt)} at {venue.name}
              </p>
            </div>

            {upcoming && appointment.checkInCode ? (
              <div className="toh-card toh-apt__code">
                <span className="toh-muted">Check-in code</span>
                <b className="toh-num">{appointment.checkInCode.split("").join(" ")}</b>
                <span className="toh-muted" style={{ fontSize: 13 }}>
                  Show it at the front desk. The business asks for it, so keep it to yourself until then.
                </span>
              </div>
            ) : null}

            {appointment.cancellationReason ? (
              <div className="toh-notice">
                <Icon name="info" size={16} />
                <span>Reason given: {appointment.cancellationReason}</span>
              </div>
            ) : null}

            {summary}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="toh-btn toh-btn--line toh-btn--pill" onClick={() => void message()} disabled={opening}>
                <Icon name="chat" size={18} /> Message
              </button>
              {venue.phone ? (
                <a href={`tel:${venue.phone}`} className="toh-btn toh-btn--line toh-btn--pill">
                  <Icon name="phone" size={18} /> Call
                </a>
              ) : null}
              {upcoming ? (
                <button type="button" className="toh-btn toh-btn--line toh-btn--pill" onClick={() => downloadCalendar(appointment)}>
                  <Icon name="cal" size={18} /> Add to calendar
                </button>
              ) : (
                <Link
                  href={`/businesses/${venue.id}/book${appointment.serviceId ? `?service=${appointment.serviceId}` : ""}`}
                  className="toh-btn toh-btn--dark toh-btn--pill"
                >
                  Book again
                </Link>
              )}
            </div>

            <div className="toh-legacy">
              <AppointmentChangeRequests
                appointmentId={appointment.id}
                startAt={appointment.startAt}
                businessName={venue.name}
                canRequestChange={appointment.canRequestChange}
                pendingRequest={appointment.pendingChangeRequest}
                onRequested={() => void refresh()}
              />
            </div>

            {appointment.status === "COMPLETED" ? (
              appointment.reviewed ? (
                <div className="toh-notice toh-notice--info">
                  <Icon name="star" size={16} />
                  <span>Thanks, your review is on {venue.name}&apos;s page.</span>
                </div>
              ) : (
                <ReviewForm appointmentId={appointment.id} venue={venue.name} onDone={() => void refresh()} />
              )
            ) : null}
          </div>

          <aside className="toh-card toh-apt__side">
            <h3>{appointment.cancellationPolicy.label} cancellation policy</h3>
            <p className="toh-muted">{appointment.cancellationPolicy.description}</p>
            <h3 style={{ marginTop: 14 }}>Need help?</h3>
            <p className="toh-muted">
              If something went wrong with this booking,{" "}
              <Link href="/support" className="toh-link">
                contact support
              </Link>{" "}
              and we will look into it with the business.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}

function ReviewForm({ appointmentId, venue, onDone }: { appointmentId: string; venue: string; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await submitReview(appointmentId, rating, text.trim());
      toast.success("Review posted. Thank you.");
      onDone();
    } catch {
      toast.error("We couldn't post your review. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section id="review" className="toh-card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800 }}>How was {venue}?</h2>
      <p className="toh-muted" style={{ fontSize: 13, marginTop: 4 }}>
        Your review shows on their page and helps other clients choose.
      </p>
      <div className="toh-rate" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            className={value <= rating ? "is-on" : ""}
            onClick={() => setRating(value)}
          >
            <Icon name="star" size={30} filled={value <= rating} />
          </button>
        ))}
      </div>
      <label className="toh-field">
        Your review
        <textarea
        rows={4}
        maxLength={1000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="What did you like? Was it on time, clean, worth the price?"
        />
      </label>
      <button
        type="button"
        className="toh-btn toh-btn--dark toh-btn--pill"
        style={{ marginTop: 12 }}
        disabled={!rating || !text.trim() || busy}
        onClick={() => void send()}
      >
        {busy ? "Posting…" : "Post review"}
      </button>
    </section>
  );
}
