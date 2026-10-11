"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { DemoNote, Empty, Option, Price, productArtFor } from "@/components/app/ui";
import { useViewer } from "@/components/providers/ViewerProvider";
import { ApiClientError } from "@/lib/api/errors";
import { CITIES, createAddress, placeOrder, useAddresses, useCart, type FulfilmentChoice } from "@/lib/app/data";

type Pay = "momo" | "orange" | "card";

export function CheckoutScreen() {
  const router = useRouter();
  const viewer = useViewer();
  const { cart, count, isLoading } = useCart();
  const { addresses } = useAddresses(Boolean(viewer));
  const [fulfilment, setFulfilment] = useState<FulfilmentChoice>("SHIPPING");
  const [picked, setPicked] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pay, setPay] = useState<Pay>("momo");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const shipping = addresses.filter((address) => address.purpose === "SHIPPING");
  const addressId = picked ?? shipping.find((address) => address.isDefault)?.id ?? shipping[0]?.id ?? null;
  const items = cart?.items ?? [];
  const sellers = [...new Set(items.map((item) => item.product.sellerName).filter(Boolean))];

  if (!viewer) {
    return (
      <Frame count={0}>
        <div className="toh-card">
          <Empty icon="lock" title="Sign in to check out">
            <Link href="/customer/sign-in?callbackUrl=%2Fcheckout" className="toh-btn toh-btn--cta">
              Sign in
            </Link>
          </Empty>
        </div>
      </Frame>
    );
  }
  if (isLoading) {
    return (
      <Frame count={0}>
        <div className="toh-skeleton" style={{ height: 320 }} />
      </Frame>
    );
  }
  if (!items.length) {
    return (
      <Frame count={0}>
        <div className="toh-card">
          <Empty icon="cart" title="Your cart is empty">
            <Link href="/marketplace" className="toh-btn toh-btn--cta">
              Continue shopping
            </Link>
          </Empty>
        </div>
      </Frame>
    );
  }

  const ready = fulfilment === "SALON_PICKUP" || Boolean(addressId);
  const submit = async () => {
    setBusy(true);
    setFailure(null);
    try {
      const order = await placeOrder(
        fulfilment === "SHIPPING" ? { fulfilmentType: "SHIPPING", shippingAddressId: addressId! } : { fulfilmentType: "SALON_PICKUP" },
      );
      router.push(`/marketplace/orders/${order.id}?placed=1`);
    } catch (caught) {
      setFailure(caught instanceof ApiClientError ? caught.message : "We couldn't place your order. Nothing was charged. Try again.");
      setBusy(false);
    }
  };

  return (
    <Frame count={count}>
      <div className="toh-chk">
        <div>
          <section className="toh-card toh-chk__step">
            <h3>
              <span className="toh-chk__n">1</span>Delivery
            </h3>
            <div className="toh-stack">
              <Option
                on={fulfilment === "SHIPPING"}
                onClick={() => setFulfilment("SHIPPING")}
                icon="truck"
                title="Deliver to my address"
                detail="The seller arranges delivery in Douala or Yaoundé"
              />
              <Option
                on={fulfilment === "SALON_PICKUP"}
                onClick={() => setFulfilment("SALON_PICKUP")}
                icon="store"
                title="Pick up at the salon"
                detail={sellers.length ? `Collect from ${sellers.join(", ")}` : "Collect from the seller"}
              />
            </div>
            {fulfilment === "SHIPPING" ? (
              <div style={{ marginTop: 14 }}>
                <h4 style={{ fontSize: 14, marginBottom: 8 }}>Deliver to</h4>
                {shipping.length ? (
                  <div className="toh-stack">
                    {shipping.map((address) => (
                      <Option
                        key={address.id}
                        on={address.id === addressId}
                        onClick={() => setPicked(address.id)}
                        icon="pin"
                        title={`${address.recipientName} · ${address.label}`}
                        detail={[address.line1, address.line2, address.locality].filter(Boolean).join(", ")}
                      />
                    ))}
                  </div>
                ) : null}
                {adding || !shipping.length ? (
                  <AddressForm defaultName={`${viewer.firstName} ${viewer.lastName}`.trim()} onDone={(id) => { setPicked(id); setAdding(false); }} onCancel={shipping.length ? () => setAdding(false) : undefined} />
                ) : (
                  <button type="button" className="toh-link" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>
                    Add a new address
                  </button>
                )}
              </div>
            ) : null}
          </section>

          <section className="toh-card toh-chk__step">
            <h3>
              <span className="toh-chk__n">2</span>Payment method
            </h3>
            <div className="toh-stack">
              <Option on={pay === "momo"} onClick={() => setPay("momo")} icon="phone" title="MTN Mobile Money" detail="Approve the prompt on your phone" />
              <Option on={pay === "orange"} onClick={() => setPay("orange")} icon="phone" title="Orange Money" detail="Approve the prompt on your phone" />
              <Option on={pay === "card"} onClick={() => setPay("card")} icon="card" title="Credit or debit card" detail="Visa or Mastercard" />
            </div>
            <div style={{ marginTop: 12 }}>
              <DemoNote>Demo mode: no money moves. Placing the order confirms it with a test payment.</DemoNote>
            </div>
          </section>

          <section className="toh-card toh-chk__step">
            <h3>
              <span className="toh-chk__n">3</span>Review items
            </h3>
            {items.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0" }}>
                <span className="toh-art" style={{ width: 56, height: 56, borderRadius: 10, flex: "none" }}>
                  {productArtFor(item.product)}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13.5 }}>
                  {item.product.name}
                  {item.variant.title !== "Standard" ? ` (${item.variant.title})` : ""} <span className="toh-muted">× {item.quantity}</span>
                </span>
                <Price cents={item.lineTotalCents} size={14} />
              </div>
            ))}
          </section>
        </div>

        <aside className="toh-card toh-sumbox">
          <button type="button" className="toh-btn toh-btn--cta toh-btn--block" disabled={!ready || busy} onClick={() => void submit()}>
            {busy ? "Placing your order…" : "Place your order"}
          </button>
          {failure ? (
            <p role="alert" className="toh-notice toh-notice--error">
              {failure}
            </p>
          ) : null}
          <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", width: "100%" }} />
          <div className="toh-sumbox__ln">
            <span>Items ({count})</span>
            <Price cents={cart!.subtotalCents} size={13.5} />
          </div>
          <div className="toh-sumbox__ln">
            <span>Delivery</span>
            <span>{fulfilment === "SALON_PICKUP" ? "Free pick-up" : "Agreed with the seller"}</span>
          </div>
          <div className="toh-sumbox__ln toh-sumbox__tot">
            <span>Order total</span>
            <Price cents={cart!.subtotalCents} size={18} />
          </div>
        </aside>
      </div>
    </Frame>
  );
}

function Frame({ count, children }: { count: number; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="toh-bkshell">
      <header className="toh-bkh">
        <button type="button" className="toh-icon-btn" aria-label="Back to cart" onClick={() => router.push("/cart")}>
          <Icon name="arrowL" />
        </button>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span className="toh-serif" style={{ fontSize: 24 }}>
            Checkout{count ? ` (${count} ${count === 1 ? "item" : "items"})` : ""}
          </span>
        </div>
        <span className="toh-muted" style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
          <Icon name="lock" size={16} /> Secure
        </span>
      </header>
      <div className="toh-mbody" style={{ width: "100%" }}>
        {children}
      </div>
    </div>
  );
}

function AddressForm({ defaultName, onDone, onCancel }: { defaultName: string; onDone: (id: string) => void; onCancel?: () => void }) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState<string>(CITIES[0]!.label);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const phoneE164 = phone.trim() ? `+237${phone.replace(/\D/g, "").replace(/^237/, "")}` : undefined;

  const save = async () => {
    setBusy(true);
    setFailure(null);
    try {
      const address = await createAddress({
        label: "Home",
        recipientName: name.trim(),
        recipientPhone: phoneE164,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        locality: city,
      });
      onDone(address.id);
    } catch (caught) {
      setFailure(caught instanceof ApiClientError ? caught.message : "We couldn't save that address.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="toh-addr">
      <label className="toh-field">
        Full name
        <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
      </label>
      <label className="toh-field">
        Phone (for the delivery rider)
        <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="6XX XX XX XX" autoComplete="tel-national" />
      </label>
      <label className="toh-field">
        Neighbourhood and street
        <input value={line1} onChange={(event) => setLine1(event.target.value)} placeholder="Bonamoussadi, rue des Écoles" />
      </label>
      <label className="toh-field">
        Landmark (optional)
        <input value={line2} onChange={(event) => setLine2(event.target.value)} placeholder="Opposite the pharmacy, blue gate" />
      </label>
      <label className="toh-field">
        City
        <select value={city} onChange={(event) => setCity(event.target.value)}>
          {CITIES.map((item) => (
            <option key={item.key}>{item.label}</option>
          ))}
        </select>
      </label>
      {failure ? (
        <p role="alert" className="toh-notice toh-notice--error">
          {failure}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="toh-btn toh-btn--dark toh-btn--sm" disabled={busy || !name.trim() || !line1.trim()} onClick={() => void save()}>
          {busy ? "Saving…" : "Use this address"}
        </button>
        {onCancel ? (
          <button type="button" className="toh-btn toh-btn--line toh-btn--sm" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
