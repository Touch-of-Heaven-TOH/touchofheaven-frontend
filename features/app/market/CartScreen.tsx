"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { Empty, Price, productArtFor } from "@/components/app/ui";
import { useToast } from "@/components/feedback/ToastProvider";
import { useViewer } from "@/components/providers/ViewerProvider";
import { setCartQuantity, useCart } from "@/lib/app/data";
import { MarketHeader } from "./MarketHeader";

export function CartScreen() {
  const viewer = useViewer();
  const toast = useToast();
  const { cart, count, isLoading } = useCart();
  const [busy, setBusy] = useState<string | null>(null);
  const items = cart?.items ?? [];

  const change = async (itemId: string, quantity: number) => {
    setBusy(itemId);
    try {
      await setCartQuantity(itemId, quantity);
    } catch {
      toast.error("We couldn't update your cart. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="toh-market">
      <MarketHeader />
      <div className="toh-mbody">
        <div className="toh-cartp">
          <section className="toh-card" style={{ padding: "22px 24px" }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Shopping cart</h1>
            {!viewer ? (
              <Empty icon="cart" title="Sign in to see your cart">
                <span>Your cart is saved to your account, on every device.</span>
                <Link href="/sign-in?callbackUrl=%2Fcart" className="toh-btn toh-btn--cta">
                  Sign in
                </Link>
              </Empty>
            ) : isLoading ? (
              <div className="toh-skeleton" style={{ height: 160, marginTop: 16 }} />
            ) : items.length ? (
              <>
                <div className="toh-muted toh-only-desk" style={{ textAlign: "right", fontSize: 12.5 }}>
                  Price
                </div>
                {items.map((item) => (
                  <div key={item.id} className="toh-citem">
                    <Link href={`/marketplace/products/${item.product.id}`} className="toh-art toh-citem__art">
                      {productArtFor(item.product)}
                    </Link>
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/marketplace/products/${item.product.id}`} style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
                        {item.product.name}
                      </Link>
                      {item.variant.title && item.variant.title !== "Standard" ? (
                        <p style={{ fontSize: 13, marginTop: 2 }}>
                          Option: <b>{item.variant.title}</b>
                        </p>
                      ) : null}
                      <p style={{ color: item.availableToSell > 0 ? "var(--color-success)" : "var(--color-danger)", fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>
                        {item.availableToSell >= item.quantity ? "In stock" : `Only ${item.availableToSell} left`}
                      </p>
                      {item.product.sellerName ? (
                        <p className="toh-muted" style={{ fontSize: 12.5 }}>
                          Sold by {item.product.sellerName}
                        </p>
                      ) : null}
                      <div className="toh-citem__acts">
                        <span className="toh-qsel">
                          <button
                            type="button"
                            aria-label={item.quantity > 1 ? "Remove one" : "Remove item"}
                            disabled={busy === item.id}
                            onClick={() => void change(item.id, item.quantity - 1)}
                          >
                            <Icon name={item.quantity > 1 ? "minus" : "trash"} size={14} />
                          </button>
                          <b className="toh-num">{item.quantity}</b>
                          <button
                            type="button"
                            aria-label="Add one"
                            disabled={busy === item.id || item.quantity >= item.availableToSell}
                            onClick={() => void change(item.id, item.quantity + 1)}
                          >
                            <Icon name="plus" size={14} />
                          </button>
                        </span>
                        <button type="button" onClick={() => void change(item.id, 0)} disabled={busy === item.id}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="toh-citem__pr">
                      <Price cents={item.lineTotalCents} size={15} />
                    </div>
                  </div>
                ))}
                <p style={{ textAlign: "right", fontSize: 17, marginTop: 14 }}>
                  Subtotal ({count} {count === 1 ? "item" : "items"}): <Price cents={cart!.subtotalCents} size={17} />
                </p>
              </>
            ) : (
              <Empty icon="cart" title="Your cart is empty">
                <span>Find something for your next look.</span>
                <Link href="/marketplace" className="toh-btn toh-btn--cta">
                  Continue shopping
                </Link>
              </Empty>
            )}
          </section>
          {items.length ? (
            <aside className="toh-card toh-sumbox">
              <p style={{ fontSize: 17 }}>
                Subtotal ({count} {count === 1 ? "item" : "items"}): <Price cents={cart!.subtotalCents} size={17} />
              </p>
              <p className="toh-muted" style={{ fontSize: 12.5 }}>
                Delivery or salon pick-up is chosen at checkout.
              </p>
              <Link href="/checkout" className="toh-btn toh-btn--cta toh-btn--block">
                Proceed to checkout
              </Link>
              <p className="toh-muted" style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                <Icon name="shield" size={14} /> Questions about an item? Message the seller
              </p>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
