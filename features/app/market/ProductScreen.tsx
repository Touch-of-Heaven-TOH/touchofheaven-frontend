"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { BusinessAvatar, Empty, Price, lowestPrice, productArtFor } from "@/components/app/ui";
import { useCity } from "@/lib/app/city";
import { useProduct, useProducts } from "@/lib/app/data";
import type { Product } from "@/lib/app/types";
import { MarketHeader } from "./MarketHeader";
import { useAddToCart } from "./MarketplaceScreen";

/** Seller descriptions arrive as HTML; show them as plain text, never as markup. */
function plainText(html: string | null) {
  return (html ?? "")
    .replace(/<\/(p|li|br)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ProductScreen({ id }: { id: string }) {
  const { product, isLoading, error } = useProduct(id);
  return (
    <div className="toh-market">
      <MarketHeader />
      <div className="toh-mbody">
        {error ? (
          <div className="toh-card">
            <Empty icon="bag" title="This product isn't available">
              <span>It may have sold out or been removed by the seller.</span>
              <Link href="/marketplace" className="toh-btn toh-btn--sm toh-btn--cta toh-btn--pill">
                Back to the Marketplace
              </Link>
            </Empty>
          </div>
        ) : isLoading || !product ? (
          <div className="toh-skeleton" style={{ height: 480 }} />
        ) : (
          <ProductDetail key={product.id} product={product} />
        )}
      </div>
    </div>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const [city] = useCity();
  const variants = product.variants.filter((variant) => variant.isActive);
  const firstInStock = variants.find((variant) => variant.availableToSell > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const { add, busy } = useAddToCart();
  const { products: fromSeller } = useProducts({ sellerId: product.sellerId });
  const { products: alike } = useProducts({ categoryId: product.category.id });
  const variant = variants.find((item) => item.id === variantId) ?? firstInStock;
  const inStock = Boolean(variant && variant.availableToSell > 0);
  const lines = plainText(product.descriptionHtml);
  const more = [...fromSeller, ...alike].filter((item, index, all) => item.id !== product.id && all.findIndex((other) => other.id === item.id) === index);

  return (
    <>
      <nav className="toh-crumbs" aria-label="Breadcrumb">
        <Link href="/marketplace">Marketplace</Link>
        <Icon name="chevR" size={12} />
        <Link href={`/marketplace?dept=${product.category.slug}`}>{product.category.name}</Link>
        <Icon name="chevR" size={12} />
        <span>{product.sellerName}</span>
      </nav>
      <div className="toh-pdp">
        <div className="toh-gal">
          <div className="toh-art toh-gal__main">
            {product.media[0] ? (
              // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded media
              <img src={product.media[0].url} alt={product.media[0].altText} />
            ) : (
              productArtFor(product)
            )}
          </div>
        </div>

        <div className="toh-pinfo">
          <h1>{product.name}</h1>
          <Link href={`/marketplace?seller=${product.sellerId}`} className="toh-pinfo__store">
            Visit the {product.sellerName} store
          </Link>
          <hr />
          <Price cents={variant?.priceCents ?? lowestPrice(product)} size={26} />
          <p style={{ fontSize: 13, marginTop: 6 }}>Pay with MTN Mobile Money, Orange Money or card.</p>
          {variants.length > 1 ? (
            <>
              <h4 style={{ marginTop: 16, fontSize: 14 }}>
                Option: <span style={{ fontWeight: 600 }}>{variant?.title}</span>
              </h4>
              <div className="toh-var">
                {variants.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === variant?.id ? "is-on" : ""}
                    disabled={item.availableToSell <= 0}
                    onClick={() => setVariantId(item.id)}
                  >
                    {item.title}
                    <small>{item.availableToSell > 0 ? <Price cents={item.priceCents} size={12} /> : "Sold out"}</small>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <Link href={`/businesses/${product.sellerId}`} className="toh-probox">
            <BusinessAvatar id={product.sellerId} category={null} size={44} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 13.5, display: "flex", gap: 6, alignItems: "center" }}>
                Sold by {product.sellerName}
              </b>
              <span className="toh-muted" style={{ fontSize: 12.5 }}>
                A business on Touch of Heaven. You can book them too.
              </span>
            </span>
            <span className="toh-btn toh-btn--sm toh-btn--dark">Book</span>
          </Link>
          <hr />
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>About this item</h3>
          <ul>
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
            <li>Category: {product.category.name}.</li>
          </ul>
        </div>

        <aside className="toh-buybox">
          <Price cents={(variant?.priceCents ?? 0) * quantity} size={22} />
          <span style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", color: "var(--color-brand)", fontWeight: 600 }}>
            <Icon name="pin" size={15} /> Delivery in {city.label}, or pick up at the salon
          </span>
          <span className={inStock ? "toh-buybox__stock" : "toh-buybox__stock is-out"}>
            {inStock ? (variant!.availableToSell < 10 ? `Only ${variant!.availableToSell} left` : "In stock") : "Out of stock"}
          </span>
          <label className="toh-buybox__qty">
            Quantity:
            <select className="toh-sel" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}>
              {Array.from({ length: Math.min(10, Math.max(1, variant?.availableToSell ?? 1)) }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="toh-btn toh-btn--cta toh-btn--block"
            disabled={!inStock || busy === product.id}
            onClick={() => void add(product, variant?.id, quantity)}
          >
            {busy === product.id ? "Adding…" : "Add to cart"}
          </button>
          <button
            type="button"
            className="toh-btn toh-btn--cta2 toh-btn--block"
            disabled={!inStock || busy === product.id}
            onClick={async () => {
              if (await add(product, variant?.id, quantity)) router.push("/checkout");
            }}
          >
            Buy now
          </button>
          <dl className="toh-kv">
            <dt>Sold by</dt>
            <dd>{product.sellerName}</dd>
            <dt>Payment</dt>
            <dd>Mobile Money or card</dd>
            <dt>Returns</dt>
            <dd>Ask the seller in Messages</dd>
          </dl>
        </aside>
      </div>

      {more.length ? (
        <section className="toh-rowcard">
          <h2>More from {product.sellerName} and similar</h2>
          <div className="toh-hscroll" style={{ "--cw": "180px" } as React.CSSProperties}>
            {more.slice(0, 10).map((item) => (
              <Link key={item.id} href={`/marketplace/products/${item.id}`} className="toh-mini">
                <span className="toh-art toh-mini__art">{productArtFor(item)}</span>
                <span className="toh-mini__nm">{item.name}</span>
                <Price cents={lowestPrice(item)} size={14} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
