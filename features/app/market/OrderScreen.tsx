"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/app/Icon";
import { DemoNote, Empty, Price, TopBar, productArtFor } from "@/components/app/ui";
import { useOrder } from "@/lib/app/data";
import { formatDay } from "@/lib/app/format";
import { MarketHeader } from "./MarketHeader";

const STEPS = ["Ordered", "Paid", "Shipped", "Delivered"];

export function OrderScreen({ id }: { id: string }) {
  const params = useSearchParams();
  const placed = params.get("placed") === "1";
  const { order, error, isLoading } = useOrder(id);

  if (error) {
    return (
      <div className="toh-market">
        <MarketHeader />
        <div className="toh-mbody">
          <div className="toh-card">
            <Empty icon="pkg" title="We couldn't find this order">
              <Link href="/bookings?tab=orders" className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill">
                Your orders
              </Link>
            </Empty>
          </div>
        </div>
      </div>
    );
  }
  if (isLoading || !order) {
    return (
      <div className="toh-market">
        <MarketHeader />
        <div className="toh-mbody">
          <div className="toh-skeleton" style={{ height: 320 }} />
        </div>
      </div>
    );
  }

  const fulfilments = order.sellerGroups.flatMap((group) => group.fulfilments);
  const step =
    fulfilments.length && fulfilments.every((item) => item.deliveredAt)
      ? 3
      : fulfilments.some((item) => item.shippedAt)
        ? 2
        : order.paidAt
          ? 1
          : 0;
  const number = order.id.slice(0, 8).toUpperCase();
  const itemCount = order.sellerGroups.reduce((sum, group) => sum + group.lineItems.reduce((total, line) => total + line.quantity, 0), 0);

  return (
    <div className="toh-market">
      <MarketHeader />
      <TopBar title={`Order #${number}`} back="/bookings?tab=orders" />
      {placed ? (
        <div className="toh-okhero">
          <span className="toh-okhero__tick">
            <Icon name="check" size={40} />
          </span>
          <h1>Order placed, thank you!</h1>
          <p className="toh-muted">The seller has your order and will contact you about delivery or pick-up.</p>
          <div className="toh-card toh-okcard">
            <div className="toh-ln">
              <span>Order number</span>
              <b className="toh-num">#{number}</b>
            </div>
            <div className="toh-ln">
              <span>Items</span>
              <b>{itemCount}</b>
            </div>
            <div className="toh-ln">
              <span>Total</span>
              <Price cents={order.totalCents} />
            </div>
            <div className="toh-ln">
              <span>Payment</span>
              <b>{order.paidAt ? "Confirmed" : "Waiting for payment"}</b>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/bookings?tab=orders" className="toh-btn toh-btn--dark">
              Track your order
            </Link>
            <Link href="/marketplace" className="toh-btn toh-btn--line">
              Keep shopping
            </Link>
          </div>
          <DemoNote>Demo: the payment was confirmed by a test payment, no money moved.</DemoNote>
        </div>
      ) : (
        <div className="toh-mbody" style={{ maxWidth: 980 }}>
          <div className="toh-page-head">
            <div>
              <h1>Order #{number}</h1>
              <p>Placed {formatDay(order.placedAt ?? order.createdAt)}</p>
            </div>
          </div>
          <div className="toh-card toh-ord">
            <div className="toh-track">
              {STEPS.map((label, index) => (
                <div key={label} className={index <= step ? "is-on" : ""}>
                  <i />
                  {label}
                </div>
              ))}
            </div>
            {order.sellerGroups.map((group) => (
              <div key={group.id}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "8px 0" }}>From {group.sellerName}</h3>
                {group.lineItems.map((line) => {
                  const name = line.productSnapshot?.productName ?? line.productSnapshot?.name ?? "Product";
                  return (
                    <div key={line.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0" }}>
                      <span className="toh-art" style={{ width: 56, height: 56, borderRadius: 10, flex: "none" }}>
                        {productArtFor({ id: line.productVariantId, name })}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
                        {name}
                        {line.productSnapshot?.variantTitle && line.productSnapshot.variantTitle !== "Standard" ? ` (${line.productSnapshot.variantTitle})` : ""}{" "}
                        <span className="toh-muted">× {line.quantity}</span>
                      </span>
                      <Price cents={line.unitPriceCents * line.quantity} size={14} />
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="toh-sumbox__ln toh-sumbox__tot" style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
              <span>Total</span>
              <Price cents={order.totalCents} size={18} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
