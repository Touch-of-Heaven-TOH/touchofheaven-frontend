"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { Portrait } from "@/components/app/art";
import { BusinessAvatar, Empty, TopBar, productArtFor } from "@/components/app/ui";
import { useViewer } from "@/components/providers/ViewerProvider";
import { lookForService } from "@/lib/app/business-look";
import { useAppointments, useFavorites, useOrders } from "@/lib/app/data";
import { formatDay, formatFcfa, formatTime } from "@/lib/app/format";
import type { Appointment, Order } from "@/lib/app/types";

type Tab = "appts" | "orders";
type Sub = "upcoming" | "completed" | "cancelled";

const SUBS: { key: Sub; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS: Record<string, { label: string; tone: string }> = {
  CONFIRMED: { label: "Confirmed", tone: "ok" },
  PENDING_PAYMENT: { label: "Awaiting deposit", tone: "warn" },
  ARRIVED: { label: "Checked in", tone: "ac" },
  IN_PROGRESS: { label: "In progress", tone: "ac" },
  COMPLETED: { label: "Completed", tone: "" },
  CANCELLED_BY_CUSTOMER: { label: "Cancelled", tone: "no" },
  CANCELLED_BY_PROFESSIONAL: { label: "Cancelled by the business", tone: "no" },
  NO_SHOW: { label: "Missed", tone: "no" },
  DISPUTED: { label: "In dispute", tone: "warn" },
};

export function statusPill(status: string) {
  const known = STATUS[status] ?? { label: status.replace(/_/g, " ").toLowerCase(), tone: "" };
  return <span className={`toh-pill${known.tone ? ` toh-pill--${known.tone}` : ""}`}>{known.label}</span>;
}

export function BookingsScreen() {
  const viewer = useViewer();
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "orders" ? "orders" : "appts";
  const sub = (SUBS.find((item) => item.key === params.get("show"))?.key ?? "upcoming") as Sub;
  const { appointments, isLoading } = useAppointments(Boolean(viewer), sub);
  const upcoming = useAppointments(Boolean(viewer), "upcoming").appointments;
  const { orders, isLoading: ordersLoading } = useOrders(Boolean(viewer));
  const { favorites } = useFavorites(Boolean(viewer));

  const go = (next: { tab?: Tab; show?: Sub }) => {
    const query = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    if (nextTab === "orders") query.set("tab", "orders");
    else if ((next.show ?? sub) !== "upcoming") query.set("show", next.show ?? sub);
    router.replace(`/bookings${query.size ? `?${query.toString()}` : ""}`, { scroll: false });
  };

  const sorted = [...appointments].sort((a, b) =>
    sub === "upcoming" ? a.startAt.localeCompare(b.startAt) : b.startAt.localeCompare(a.startAt),
  );

  return (
    <>
      <TopBar title="Bookings" />
      <div className="toh-page">
        <div className="toh-page-head">
          <div>
            <h1>Your bookings and orders</h1>
            <p>Appointments with pros and products from the Marketplace, in one place.</p>
          </div>
          <div className="toh-seg" style={{ minWidth: 260 }}>
            <button type="button" className={tab === "appts" ? "is-on" : ""} onClick={() => go({ tab: "appts" })}>
              Appointments
            </button>
            <button type="button" className={tab === "orders" ? "is-on" : ""} onClick={() => go({ tab: "orders" })}>
              Orders
            </button>
          </div>
        </div>

        <div className="toh-bkwrap">
          <div>
            {tab === "appts" ? (
              <>
                <div className="toh-chips" style={{ marginBottom: 16 }}>
                  {SUBS.map((item) => (
                    <button key={item.key} type="button" className={`toh-chip${sub === item.key ? " is-on" : ""}`} onClick={() => go({ show: item.key })}>
                      {item.label}
                    </button>
                  ))}
                </div>
                {isLoading ? (
                  <div className="toh-bkl">
                    {[0, 1].map((key) => (
                      <div key={key} className="toh-skeleton" style={{ height: 128 }} />
                    ))}
                  </div>
                ) : sorted.length ? (
                  <div className="toh-bkl">
                    {sorted.map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                ) : (
                  <div className="toh-card">
                    <Empty icon="cal" title={sub === "upcoming" ? "No upcoming bookings" : "Nothing here yet"}>
                      <span>Find a salon, barber or spa near you and book in a few taps.</span>
                      <Link href="/businesses" className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill">
                        Find a business
                      </Link>
                    </Empty>
                  </div>
                )}
              </>
            ) : ordersLoading ? (
              <div className="toh-skeleton" style={{ height: 200 }} />
            ) : orders.length ? (
              <div className="toh-bkl">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="toh-card">
                <Empty icon="pkg" title="No orders yet">
                  <span>Hair care, tools and beauty products from verified sellers.</span>
                  <Link href="/marketplace" className="toh-btn toh-btn--sm toh-btn--cta toh-btn--pill">
                    Shop the Marketplace
                  </Link>
                </Empty>
              </div>
            )}
          </div>

          <aside className="toh-bkside">
            <MiniCalendar dates={upcoming.map((appointment) => appointment.startAt)} />
            {favorites.length ? (
              <div className="toh-card" style={{ padding: 18 }}>
                <h3 style={{ fontSize: 15, marginBottom: 6 }}>Book your favourites again</h3>
                {favorites.slice(0, 5).map((favorite) => (
                  <Link key={favorite.braiderId} href={`/businesses/${favorite.braiderId}`} className="toh-row" style={{ padding: "8px 0" }}>
                    <BusinessAvatar id={favorite.braiderId} category={null} logoUrl={favorite.logoUrl} size={42} />
                    <span className="toh-row__text">
                      <b>{favorite.name}</b>
                      <span>{favorite.professionalName}</span>
                    </span>
                    <Icon name="chevR" size={16} className="toh-row__chev" />
                  </Link>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const name = appointment.serviceName ?? "Appointment";
  const isUpcoming = ["CONFIRMED", "PENDING_PAYMENT", "ARRIVED", "IN_PROGRESS"].includes(appointment.status);
  const isCancelled = /CANCEL|NO_SHOW/.test(appointment.status);
  const bookAgain =
    appointment.braiderId ? (
      <Link
        href={`/businesses/${appointment.braiderId}/book${appointment.serviceId ? `?service=${appointment.serviceId}` : ""}`}
        className="toh-btn toh-btn--dark toh-btn--sm toh-btn--pill"
      >
        Book again
      </Link>
    ) : null;
  return (
    <article className="toh-card toh-bk">
      <Link href={`/bookings/${appointment.id}`} className="toh-art toh-bk__art" aria-label={`${name} details`}>
        <Portrait look={lookForService(name)} />
      </Link>
      <Link href={`/bookings/${appointment.id}`} style={{ minWidth: 0 }}>
        {statusPill(appointment.status)}
        <h3 style={{ marginTop: 6 }}>{name}</h3>
        <div className="toh-bk__m">
          <span>
            <Icon name="cal" size={14} /> {formatDay(appointment.startAt)} · {formatTime(appointment.startAt)}
          </span>
          <span>
            <Icon name="pin" size={14} /> {appointment.braiderName}
          </span>
          {appointment.teamMemberName ? (
            <span>
              <Icon name="user" size={14} /> {appointment.teamMemberName}
            </span>
          ) : null}
        </div>
        <div className="toh-bk__m">
          {isCancelled
            ? appointment.depositPaidCents
              ? `Deposit of ${formatFcfa(appointment.depositPaidCents)} paid`
              : "No deposit was taken"
            : appointment.status === "COMPLETED" || !appointment.balanceDueCents
              ? `Paid ${formatFcfa(appointment.computedPriceCents)}`
              : `Deposit paid ${formatFcfa(appointment.depositPaidCents)} · ${formatFcfa(appointment.balanceDueCents)} due at the venue`}
        </div>
      </Link>
      <div className="toh-bk__acts">
        {isUpcoming ? (
          <Link href={`/bookings/${appointment.id}`} className="toh-btn toh-btn--line toh-btn--sm toh-btn--pill">
            Manage
          </Link>
        ) : appointment.status === "COMPLETED" ? (
          <>
            {appointment.reviewed ? (
              <span className="toh-pill toh-pill--ok">Reviewed</span>
            ) : (
              <Link href={`/bookings/${appointment.id}#review`} className="toh-btn toh-btn--ghost toh-btn--sm toh-btn--pill">
                Leave a review
              </Link>
            )}
            {bookAgain}
          </>
        ) : (
          bookAgain
        )}
      </div>
    </article>
  );
}

const ORDER_STEPS = ["Ordered", "Packed", "Shipped", "Delivered"];

function orderStep(order: Order) {
  const fulfilments = order.sellerGroups.flatMap((group) => group.fulfilments);
  if (fulfilments.length && fulfilments.every((item) => item.deliveredAt)) return 3;
  if (fulfilments.some((item) => item.shippedAt)) return 2;
  if (order.paidAt) return 1;
  return 0;
}

function OrderCard({ order }: { order: Order }) {
  const step = orderStep(order);
  const lines = order.sellerGroups.flatMap((group) => group.lineItems.map((line) => ({ ...line, seller: group.sellerName })));
  const paid = Boolean(order.paidAt);
  return (
    <article className="toh-card toh-ord">
      <div className="toh-ord__hd">
        <span>
          Order placed<b>{formatDay(order.placedAt ?? order.createdAt)}</b>
        </span>
        <span>
          Total<b className="toh-num">{formatFcfa(order.totalCents)}</b>
        </span>
        <span>
          From<b>{[...new Set(order.sellerGroups.map((group) => group.sellerName))].join(", ")}</b>
        </span>
        <span>
          Order<b className="toh-num">#{order.id.slice(0, 8).toUpperCase()}</b>
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <span className={`toh-pill ${step === 3 ? "toh-pill--ok" : paid ? "toh-pill--ac" : "toh-pill--warn"}`}>
            {paid ? ORDER_STEPS[step] : "Awaiting payment"}
          </span>
        </div>
        <Link href={`/marketplace/orders/${order.id}`} className="toh-btn toh-btn--line toh-btn--sm toh-btn--pill">
          View order
        </Link>
      </div>
      <div className="toh-track">
        {ORDER_STEPS.map((label, index) => (
          <div key={label} className={index <= step && paid ? "is-on" : ""}>
            <i />
            {label}
          </div>
        ))}
      </div>
      <div className="toh-ord__its">
        {lines.slice(0, 6).map((line) => {
          const productName = line.productSnapshot?.productName ?? line.productSnapshot?.name ?? "Product";
          return (
            <span key={line.id} className="toh-art toh-ord__art" title={`${productName} × ${line.quantity}`}>
              {productArtFor({ id: line.productVariantId, name: productName })}
            </span>
          );
        })}
      </div>
    </article>
  );
}

function MiniCalendar({ dates }: { dates: string[] }) {
  const [today] = useState(() => new Date());
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const booked = new Set(
    dates
      .map((value) => new Date(value))
      .filter((date) => date.getFullYear() === year && date.getMonth() === month)
      .map((date) => date.getDate()),
  );
  return (
    <div className="toh-card toh-only-desk" style={{ padding: 18 }}>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>
        {today.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
      </h3>
      <div className="toh-calmini">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <span key={index} className="is-h">
            {day}
          </span>
        ))}
        {Array.from({ length: first }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => (
          <span
            key={index}
            className={`toh-num${booked.has(index + 1) ? " is-has" : ""}${index + 1 === today.getDate() ? " is-td" : ""}`}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
