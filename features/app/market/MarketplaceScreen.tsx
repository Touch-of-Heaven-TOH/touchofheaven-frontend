"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { BusinessAvatar, Empty, Price, ProductCard, lowestPrice, productArtFor } from "@/components/app/ui";
import { useToast } from "@/components/feedback/ToastProvider";
import { useViewer } from "@/components/providers/ViewerProvider";
import { addToCart, useProducts } from "@/lib/app/data";
import type { Product } from "@/lib/app/types";
import { MarketHeader, departmentsOf } from "./MarketHeader";

const PRICE_BANDS = [
  { label: "Under 3 000 FCFA", min: 0, max: 300_000 },
  { label: "3 000 to 6 000 FCFA", min: 300_000, max: 600_000 },
  { label: "6 000 to 10 000 FCFA", min: 600_000, max: 1_000_000 },
  { label: "10 000 FCFA and above", min: 1_000_000, max: Infinity },
];

type Sort = "feat" | "low" | "high" | "new";

/** Add-to-cart that sends signed-out shoppers to sign in first. */
export function useAddToCart() {
  const viewer = useViewer();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const add = async (product: Product, variantId?: string, quantity = 1) => {
    if (!viewer) {
      router.push(`/customer/sign-in?callbackUrl=${encodeURIComponent(`/marketplace/products/${product.id}`)}`);
      return false;
    }
    const variant =
      product.variants.find((item) => item.id === variantId) ??
      product.variants.find((item) => item.isActive && item.availableToSell > 0);
    if (!variant) return false;
    setBusy(product.id);
    try {
      await addToCart(variant.id, quantity);
      toast.success(`Added to cart: ${product.name}`);
      return true;
    } catch {
      toast.error("We couldn't add that to your cart. Try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };
  return { add, busy };
}

export function MarketplaceScreen() {
  const params = useSearchParams();
  const q = params.get("q");
  const dept = params.get("dept");
  const browsing = Boolean(q || dept || params.get("seller") || params.get("all"));
  return (
    <div className="toh-market">
      <MarketHeader />
      <div className="toh-mbody">{browsing ? <Results /> : <Storefront />}</div>
    </div>
  );
}

function Shelf({ products }: { products: Product[] }) {
  return (
    <div className="toh-hscroll" style={{ "--cw": "180px" } as React.CSSProperties}>
      {products.map((product) => (
        <Link key={product.id} href={`/marketplace/products/${product.id}`} className="toh-mini">
          <span className="toh-art toh-mini__art">{productArtFor(product)}</span>
          <span className="toh-mini__nm">{product.name}</span>
          <Price cents={lowestPrice(product)} size={14} />
        </Link>
      ))}
    </div>
  );
}

function Storefront() {
  const { products, isLoading } = useProducts();
  const departments = departmentsOf(products);
  const sellers = [...new Map(products.map((product) => [product.sellerId, product.sellerName])).entries()];
  const inDept = (pattern: RegExp) => products.filter((product) => pattern.test(product.category.name));
  const hair = inDept(/hair/i);
  const skin = inDept(/beauty|skin|cosmetic/i);
  const extras = inDept(/fashion|accessor/i);

  if (isLoading && !products.length) return <div className="toh-skeleton" style={{ height: 320 }} />;

  return (
    <>
      <section className="toh-mhero">
        <div style={{ position: "relative", zIndex: 2 }}>
          <span className="toh-pill" style={{ background: "rgba(255,255,255,.16)", color: "#fff", marginBottom: 12 }}>
            Sold by local beauty businesses
          </span>
          <h1>Beauty products for your best self</h1>
          <p>Hair, skin and grooming essentials, sold by the salons, spas and barbers you book with in Douala and Yaoundé.</p>
          <Link href="/marketplace?all=1" className="toh-btn toh-btn--cta toh-btn--lg">
            Shop everything
          </Link>
        </div>
        <div className="toh-mhero__shelf" aria-hidden="true">
          {products.slice(0, 4).map((product) => (
            <span key={product.id} className="toh-art">
              {productArtFor(product)}
            </span>
          ))}
        </div>
      </section>

      <div className="toh-tiles">
        <Tile title="Hair care for your next install" products={hair} href={departments.find((item) => /hair/i.test(item.name))?.slug} cta="Shop hair care" />
        <Tile title="Skin and body care" products={skin} href={departments.find((item) => /beauty/i.test(item.name))?.slug} cta="Shop skin care" />
        <Tile title="Bonnets, combs and tools" products={extras} href={departments.find((item) => /fashion/i.test(item.name))?.slug} cta="Shop accessories" />
        <div className="toh-tile">
          <h3>Picked by your pros</h3>
          <p className="toh-muted" style={{ fontSize: 13 }}>
            Every product here is sold by a beauty business. Buy from the one that does your hair.
          </p>
          <div className="toh-stack" style={{ gap: 8 }}>
            {sellers.slice(0, 3).map(([id, name]) => (
              <Link key={id} href={`/marketplace?seller=${id}`} className="toh-row" style={{ padding: "6px 0" }}>
                <BusinessAvatar id={id} category={null} size={36} />
                <span className="toh-row__text">
                  <b>{name}</b>
                </span>
                <Icon name="chevR" size={16} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {hair.length ? (
        <section className="toh-rowcard">
          <h2>
            Hair care <Link href={`/marketplace?dept=${hair[0]!.category.slug}`} className="toh-link">See more</Link>
          </h2>
          <Shelf products={hair} />
        </section>
      ) : null}
      {skin.length ? (
        <section className="toh-rowcard">
          <h2>Skin and body</h2>
          <Shelf products={skin} />
        </section>
      ) : null}
      <section className="toh-rowcard">
        <h2>Shop by store</h2>
        <div className="toh-hscroll" style={{ "--cw": "220px" } as React.CSSProperties}>
          {sellers.map(([id, name]) => {
            const theirs = products.filter((product) => product.sellerId === id);
            return (
              <Link key={id} href={`/marketplace?seller=${id}`} className="toh-mini">
                <span className="toh-art toh-mini__art" style={{ aspectRatio: "1.5" }}>
                  {productArtFor(theirs[0]!)}
                </span>
                <b style={{ fontSize: 14, display: "flex", gap: 6, alignItems: "center" }}>
                  {name}
                </b>
                <small className="toh-muted">{theirs.length} products</small>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="toh-rowcard">
        <h2>Not sure what suits your hair?</h2>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <p className="toh-muted" style={{ flex: 1, minWidth: 240 }}>
            Ask the pro who does your hair: message them from their page, or book a consultation.
          </p>
          <Link href="/businesses" className="toh-btn toh-btn--dark">
            <Icon name="pin" size={18} /> Find a pro
          </Link>
        </div>
      </section>
    </>
  );
}

function Tile({ title, products, href, cta }: { title: string; products: Product[]; href?: string; cta: string }) {
  if (!products.length) return null;
  return (
    <div className="toh-tile">
      <h3>{title}</h3>
      <div className="toh-tile__q4">
        {products.slice(0, 4).map((product) => (
          <Link key={product.id} href={`/marketplace/products/${product.id}`}>
            <span className="toh-art">{productArtFor(product)}</span>
            <span>{product.name.split(",")[0]}</span>
          </Link>
        ))}
      </div>
      {href ? (
        <Link href={`/marketplace?dept=${href}`} className="toh-link">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

function Results() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const dept = params.get("dept") ?? "";
  const seller = params.get("seller");
  const all = useProducts();
  const departments = departmentsOf(all.products);
  const category = departments.find((item) => item.slug === dept) ?? null;
  const { products, isLoading } = useProducts({ search: q || null, categoryId: category?.id ?? null, sellerId: seller });
  const [sort, setSort] = useState<Sort>("feat");
  const [band, setBand] = useState(-1);
  const [sellers, setSellers] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { add, busy } = useAddToCart();

  const pool = new Map(products.map((product) => [product.sellerId, product.sellerName]));
  const list = products
    .filter((product) => {
      const price = lowestPrice(product);
      if (band >= 0 && (price < PRICE_BANDS[band]!.min || price >= PRICE_BANDS[band]!.max)) return false;
      if (sellers.length && !sellers.includes(product.sellerId)) return false;
      if (inStock && !product.variants.some((variant) => variant.isActive && variant.availableToSell > 0)) return false;
      return true;
    })
    .sort(
      {
        feat: () => 0,
        low: (a: Product, b: Product) => lowestPrice(a) - lowestPrice(b),
        high: (a: Product, b: Product) => lowestPrice(b) - lowestPrice(a),
        new: (a: Product, b: Product) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      }[sort],
    );
  const active = (band >= 0 ? 1 : 0) + sellers.length + (inStock ? 1 : 0);
  const label = q || category?.name || (seller ? (pool.get(seller) ?? "this store") : "All products");
  const clear = () => {
    setBand(-1);
    setSellers([]);
    setInStock(false);
  };
  const goDept = (slug: string) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (slug) next.set("dept", slug);
    else next.set("all", "1");
    router.push(`/marketplace?${next.toString()}`);
  };

  return (
    <>
      <div className="toh-rbar">
        <span>
          {isLoading ? "Searching…" : list.length ? `${list.length} ${list.length === 1 ? "result" : "results"}` : "No results"} for{" "}
          <q>{label}</q>
          {category && q ? ` in ${category.name}` : ""}
        </span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="button" className="toh-btn toh-btn--line toh-btn--sm toh-fbtn" onClick={() => setFiltersOpen((open) => !open)}>
            <Icon name="sliders" size={16} /> Filters{active ? ` (${active})` : ""}
          </button>
          <label htmlFor="msort" className="toh-muted toh-only-desk" style={{ fontSize: 12.5 }}>
            Sort by
          </label>
          <select id="msort" className="toh-sel" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="feat">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="new">Newest</option>
          </select>
        </span>
      </div>
      <div className="toh-mres">
        <aside className={`toh-filters${filtersOpen ? " is-open" : ""}`} aria-label="Filters">
          <h4>Department</h4>
          <button type="button" className={`toh-fopt${!category ? " is-on" : ""}`} onClick={() => goDept("")}>
            All departments
          </button>
          {departments.map((item) => (
            <button key={item.id} type="button" className={`toh-fopt${category?.id === item.id ? " is-on" : ""}`} onClick={() => goDept(item.slug)}>
              {item.name}
            </button>
          ))}
          <h4>Price</h4>
          {PRICE_BANDS.map((item, index) => (
            <button key={item.label} type="button" className={`toh-fopt${band === index ? " is-on" : ""}`} onClick={() => setBand(band === index ? -1 : index)}>
              {item.label}
            </button>
          ))}
          <h4>Availability</h4>
          <button type="button" className={`toh-fopt${inStock ? " is-on" : ""}`} onClick={() => setInStock(!inStock)}>
            <span className="toh-cbx">{inStock ? <Icon name="check" size={12} /> : null}</span>In stock only
          </button>
          <h4>Seller</h4>
          {[...pool.entries()].map(([id, name]) => {
            const on = sellers.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`toh-fopt${on ? " is-on" : ""}`}
                onClick={() => setSellers(on ? sellers.filter((item) => item !== id) : [...sellers, id])}
              >
                <span className="toh-cbx">{on ? <Icon name="check" size={12} /> : null}</span>
                {name}
              </button>
            );
          })}
          <p className="toh-muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 8 }}>
            Every seller is a beauty business on Touch of Heaven.
          </p>
          {active ? (
            <button type="button" className="toh-btn toh-btn--line toh-btn--sm" style={{ marginTop: 16 }} onClick={clear}>
              Clear all filters
            </button>
          ) : null}
        </aside>
        <section>
          {isLoading && !products.length ? (
            <div className="toh-pgrid">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="toh-skeleton" style={{ height: 340 }} />
              ))}
            </div>
          ) : list.length ? (
            <div className="toh-pgrid">
              {list.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={(item) => void add(item)} busy={busy === product.id} />
              ))}
            </div>
          ) : (
            <div className="toh-card">
              <Empty icon="search" title="No results with these filters">
                <span>Try removing a filter or searching a broader term.</span>
                <button type="button" className="toh-btn toh-btn--sm toh-btn--dark toh-btn--pill" onClick={() => (active ? clear() : router.push("/marketplace?all=1"))}>
                  {active ? "Clear filters" : "See all products"}
                </button>
              </Empty>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
