"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { Portrait, type LookName } from "@/components/app/art";
import { BusinessCard, Empty, ProductCard, Section, productArtFor } from "@/components/app/ui";
import { MapIllustration } from "@/components/app/MapIllustration";
import { useViewer } from "@/components/providers/ViewerProvider";
import { useCity } from "@/lib/app/city";
import { addToCart, useAppointments, useCart, useNearby, useProducts } from "@/lib/app/data";
import { formatDay, formatTime, greetingForHour } from "@/lib/app/format";
import { lookForService } from "@/lib/app/business-look";
import { useToast } from "@/components/feedback/ToastProvider";

const TRENDING: { name: string; look: LookName; category: string }[] = [
  { name: "Knotless braids", look: "braids", category: "braids" },
  { name: "Silk press", look: "silk", category: "silk-press-styling" },
  { name: "Goddess locs", look: "locs", category: "locs" },
  { name: "Skin fade", look: "fade", category: "barbering" },
  { name: "Two-strand twists", look: "twists", category: "twists" },
  { name: "Soft glam", look: "glam", category: "makeup" },
  { name: "Afro puff", look: "afro", category: "natural-styles" },
];

const CATEGORIES: { label: string; icon: Parameters<typeof Icon>[0]["name"]; href: string }[] = [
  { label: "Braids", icon: "hair", href: "/businesses?filter=braids" },
  { label: "Barbers", icon: "scissors", href: "/businesses?filter=barber" },
  { label: "Nails", icon: "nail", href: "/businesses?filter=nails" },
  { label: "Spa", icon: "spa", href: "/businesses?filter=spa" },
  { label: "Locs", icon: "crown", href: "/businesses?filter=locs" },
  { label: "Silk press", icon: "brush", href: "/businesses?filter=silk" },
  { label: "Hair care", icon: "leaf", href: "/marketplace" },
  { label: "Skincare", icon: "drop", href: "/marketplace" },
];

export function HomeScreen() {
  const viewer = useViewer();
  const router = useRouter();
  const toast = useToast();
  const [city] = useCity();
  const [query, setQuery] = useState("");
  const { businesses, isLoading } = useNearby(city);
  const { products } = useProducts();
  const { count } = useCart();
  const { appointments } = useAppointments(Boolean(viewer), "upcoming");
  const [adding, setAdding] = useState<string | null>(null);
  const next = [...appointments]
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  const greeting = greetingForHour(Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Douala" }).format(new Date())));
  const topRated = [...businesses]
    .sort((a, b) => (b.rating.average ?? 0) * Math.log(b.rating.count + 1) - (a.rating.average ?? 0) * Math.log(a.rating.count + 1))
    .slice(0, 4);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(query.trim() ? `/businesses?q=${encodeURIComponent(query.trim())}` : "/businesses");
  };

  const add = async (productId: string, variantId: string | undefined) => {
    if (!variantId) return;
    setAdding(productId);
    try {
      await addToCart(variantId);
      toast.success("Added to your cart");
    } catch {
      toast.error("Couldn't add that to your cart. Try again.");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="toh-home">
      {/* Phone header, from the mobile prototype. */}
      <div className="toh-home-head">
        <div className="toh-home-head__hello">
          <div>
            <p className="toh-eyebrow">{greeting} 💜</p>
            <h1 className="toh-greet">
              Hi, <em>{viewer?.firstName ?? "there"}</em>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <Link href="/cart" className="toh-icon-btn" aria-label={`Cart, ${count} items`}>
              <Icon name="bag" />
              {count ? <span className="toh-badge">{count}</span> : null}
            </Link>
            <Link href="/messages" className="toh-icon-btn" aria-label="Messages">
              <Icon name="bell" />
            </Link>
          </div>
        </div>
        <form className="toh-search" onSubmit={search} role="search">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search styles, salons, barbers"
            aria-label="Search"
          />
        </form>
        <div className="toh-seg" role="navigation" aria-label="Browse">
          <Link href="/marketplace">Marketplace</Link>
          <span className="is-on">For you</span>
          <Link href="/businesses">Businesses</Link>
        </div>
      </div>

      {/* Desktop top bar. */}
      <header className="toh-deskbar">
        <b className="toh-deskbar__title">
          {greeting}
          {viewer ? `, ${viewer.firstName}` : ""}
        </b>
        <form className="toh-deskbar__search" onSubmit={search} role="search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search styles, pros or products" aria-label="Search" />
        </form>
        <span style={{ flex: 1 }} />
        <Link href="/cart" className="toh-icon-btn" aria-label={`Cart, ${count} items`}>
          <Icon name="bag" />
          {count ? <span className="toh-badge">{count}</span> : null}
        </Link>
        {viewer ? null : (
          <Link href="/customer/sign-in" className="toh-btn toh-btn--sm">
            Sign in
          </Link>
        )}
      </header>

      <div className="toh-page">
        <section className="toh-hhero">
          <div className="toh-hhero__tx">
            <span className="toh-pill toh-pill--ac" style={{ alignSelf: "flex-start" }}>
              <Icon name="spark" size={14} /> AI Studio
            </span>
            <h1>
              Discover your <em>perfect look</em> with AI
            </h1>
            <p>Try braids, fades and more on your own photo. Then book the pro who does it best near you, or shop the products to keep it fresh.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              <Link href="/ai-studio" className="toh-btn">
                <Icon name="camera" size={18} /> Try a look on my photo
              </Link>
            </div>
          </div>
          <div className="toh-hhero__pics" aria-hidden="true">
            <div className="toh-art">
              <Portrait look="braids" overrides={{ bg1: "transparent", bg2: "transparent" }} />
            </div>
            <div className="toh-art">
              <Portrait look="glam" overrides={{ bg1: "transparent", bg2: "transparent" }} />
            </div>
          </div>
        </section>

        <div className="toh-quick">
          <Link href="/ai-studio">
            <span className="toh-quick__i">
              <Icon name="spark" />
            </span>
            AI Studio
          </Link>
          <Link href="/marketplace">
            <span className="toh-quick__i">
              <Icon name="store" />
            </span>
            Shop
          </Link>
          <Link href="/businesses">
            <span className="toh-quick__i">
              <Icon name="pin" />
            </span>
            Salons
          </Link>
          <Link href="/businesses?filter=barber">
            <span className="toh-quick__i">
              <Icon name="scissors" />
            </span>
            Barbers
          </Link>
        </div>

        <div className="toh-split">
          <Link href="/marketplace" className="toh-door">
            <div>
              <div className="toh-door__eb">Marketplace</div>
              <h3>
                Shop beauty products <Icon name="arrowR" size={18} />
              </h3>
              <p>Hair, skincare and grooming from verified sellers, with picks from the pros you book.</p>
              <span className="toh-btn toh-btn--cta toh-btn--sm">Start shopping</span>
            </div>
            <div className="toh-art toh-door__art">
              {products[0] ? (
                <div className="toh-door__shelf">
                  {products.slice(0, 3).map((product) => (
                    <ProductThumb key={product.id} id={product.id} name={product.name} />
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
          <Link href="/businesses" className="toh-door">
            <div>
              <div className="toh-door__eb">Businesses</div>
              <h3>
                Book a pro near you <Icon name="arrowR" size={18} />
              </h3>
              <p>Braiders, barbers, nail techs and spas in {city.label}, on a map with real reviews.</p>
              <span className="toh-btn toh-btn--dark toh-btn--sm toh-btn--pill">Find a business</span>
            </div>
            <div className="toh-art toh-door__art">
              <MapIllustration pins={Math.min(6, businesses.length || 4)} />
            </div>
          </Link>
        </div>

        <Section title="Explore by category" />
        <div className="toh-cats">
          {CATEGORIES.map((category) => (
            <Link key={category.label} href={category.href} className="toh-cat">
              <span className="toh-cat__c">
                <Icon name={category.icon} size={26} />
              </span>
              {category.label}
            </Link>
          ))}
        </div>

        <div className="toh-home-grid">
          <div style={{ minWidth: 0 }}>
            {next ? (
              <Link href={`/bookings/${next.id}`} className="toh-card toh-next toh-only-phone">
                <div className="toh-art toh-next__art">
                  <Portrait look={lookForService(next.serviceName ?? "")} />
                </div>
                <span className="toh-next__t">
                  <span className="toh-pill toh-pill--ok">Next up</span>
                  <b>{next.serviceName}</b>
                  <span>
                    {formatDay(next.startAt)} · {formatTime(next.startAt)} · {next.braiderName}
                  </span>
                </span>
                <Icon name="chevR" size={18} />
              </Link>
            ) : null}

            <Section title="Trending looks" action={<Link href="/ai-studio" className="toh-link">Try them in AI Studio</Link>} />
            <div className="toh-hscroll">
              {TRENDING.map((style) => (
                <div key={style.name} className="toh-look">
                  <Link href={`/ai-studio?look=${encodeURIComponent(style.name)}`} className="toh-art toh-look__art" aria-label={`Try ${style.name} on`}>
                    <Portrait look={style.look} />
                    <span className="toh-look__try">
                      <Icon name="spark" size={14} /> Try on me
                    </span>
                  </Link>
                  <b>{style.name}</b>
                  <Link href={`/businesses?category=${style.category}`} className="toh-link" style={{ fontSize: 12 }}>
                    Find pros
                  </Link>
                </div>
              ))}
            </div>

            <Section
              title={`Top-rated in ${city.label}`}
              action={
                <Link href="/businesses" className="toh-link">
                  See all on the map
                </Link>
              }
            />
            {isLoading ? (
              <div className="toh-vgrid">
                {[0, 1, 2].map((key) => (
                  <div key={key} className="toh-skeleton" style={{ height: 240 }} />
                ))}
              </div>
            ) : topRated.length ? (
              <div className="toh-vgrid">
                {topRated.map((business) => (
                  <BusinessCard key={business.braiderId} business={business} />
                ))}
              </div>
            ) : (
              <Empty icon="pin" title="No businesses here yet">
                <span>Try the other city from the Businesses tab.</span>
              </Empty>
            )}

            <Section
              title="From verified sellers"
              action={
                <Link href="/marketplace" className="toh-link">
                  Shop all
                </Link>
              }
            />
            <div className="toh-pgrid">
              {products.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  busy={adding === product.id}
                  onAdd={(item) => add(item.id, item.variants.find((variant) => variant.isActive && variant.availableToSell > 0)?.id)}
                />
              ))}
            </div>
          </div>

          <aside className="toh-home-side">
            <div className="toh-sec" style={{ marginTop: 34 }}>
              <h2>Next up</h2>
              <Link href="/bookings" className="toh-link">
                All bookings
              </Link>
            </div>
            {next ? (
              <div className="toh-card toh-nextup">
                <div className="toh-nextup__r">
                  <div className="toh-art toh-next__art">
                    <Portrait look={lookForService(next.serviceName ?? "")} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="toh-pill toh-pill--ok">Confirmed</span>
                    <b style={{ display: "block", marginTop: 4 }}>{next.serviceName}</b>
                    <span className="toh-muted" style={{ fontSize: 13 }}>
                      {formatDay(next.startAt)} · {formatTime(next.startAt)}
                      <br />
                      {next.braiderName}
                      {next.teamMemberName ? ` with ${next.teamMemberName}` : ""}
                    </span>
                  </div>
                </div>
                <Link href={`/bookings/${next.id}`} className="toh-btn toh-btn--line toh-btn--sm">
                  View booking
                </Link>
              </div>
            ) : (
              <div className="toh-card toh-nextup">
                <p className="toh-muted">{viewer ? "No upcoming appointments." : "Sign in to see your appointments."}</p>
                <Link href={viewer ? "/businesses" : "/customer/sign-in"} className="toh-btn toh-btn--sm">
                  {viewer ? "Book something" : "Sign in"}
                </Link>
              </div>
            )}
            <div className="toh-card toh-promo">
              <h3>Run a salon, barbershop or work solo?</h3>
              <p>Get booked online, take deposits so no-shows stop costing you, and sell the products you already recommend.</p>
              <Link href="/business/sign-up?callbackUrl=%2Fprofessional-application" className="toh-btn toh-btn--light toh-btn--sm">
                List your business
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ProductThumb({ id, name }: { id: string; name: string }) {
  return <span className="toh-art toh-door__p">{productArtFor({ id, name })}</span>;
}
