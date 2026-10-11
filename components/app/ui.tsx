"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon, Stars, VerifiedMark, type IconName } from "@/components/app/Icon";
import { Portrait, ProductArt, VenueArt, productLook } from "@/components/app/art";
import { lookForBusiness, venueKindFor, BUSINESS_CATEGORY_LABEL, type BusinessCategory } from "@/lib/app/business-look";
import { formatDistanceKm, formatFcfa } from "@/lib/app/format";
import type { AppNearbyBusiness, Product } from "@/lib/app/types";

/** The phone header with a back button; on desktop it reads as a page title. */
export function TopBar({
  title,
  back,
  right,
}: {
  title: React.ReactNode;
  back?: string | true;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="toh-topbar">
      {back ? (
        <button
          type="button"
          className="toh-icon-btn"
          aria-label="Back"
          onClick={() => (back === true ? router.back() : router.push(back))}
        >
          <Icon name="chevL" />
        </button>
      ) : null}
      <h1>{title}</h1>
      {right}
    </header>
  );
}

export function Section({ title, action, children }: { title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      <div className="toh-sec">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </>
  );
}

export function Empty({ icon, title, children }: { icon: IconName; title?: string; children?: React.ReactNode }) {
  return (
    <div className="toh-empty">
      <Icon name={icon} size={32} />
      {title ? <b style={{ color: "var(--color-text-primary)" }}>{title}</b> : null}
      {children}
    </div>
  );
}

export function Rating({ average, count, size = 13 }: { average: number | null; count: number; size?: number }) {
  if (!count || average == null) return <span className="toh-meta">New on Touch of Heaven</span>;
  return (
    <span className="toh-meta">
      <b>{average.toFixed(1)}</b>
      <Stars rating={average} size={size} />
      <span>({count})</span>
    </span>
  );
}

/** A business cover: its own photo when it has one, else the illustrated venue. */
export function BusinessCover({
  id,
  category,
  photoUrl,
  name,
  className,
}: {
  id: string;
  category: BusinessCategory | null | undefined;
  photoUrl?: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div className={`toh-art ${className ?? ""}`}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- business-uploaded media on an external host
        <img src={photoUrl} alt={`${name}`} />
      ) : (
        <VenueArt kind={venueKindFor(category)} seed={id} />
      )}
    </div>
  );
}

export function BusinessAvatar({
  id,
  category,
  logoUrl,
  size = 48,
}: {
  id: string;
  category: BusinessCategory | null | undefined;
  logoUrl?: string | null;
  size?: number;
}) {
  return (
    <span className="toh-avatar toh-art" style={{ width: size, height: size }}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- business-uploaded logo
        <img src={logoUrl} alt="" />
      ) : (
        <Portrait look={lookForBusiness(id, category)} />
      )}
    </span>
  );
}

export function businessName(business: { businessName?: string | null; professionalName: string }) {
  return business.businessName || business.professionalName;
}

export function businessKind(business: AppNearbyBusiness) {
  if (business.locationModel === "MOBILE") return "Comes to you";
  if (business.locationModel === "PRIVATE_STUDIO") return "Private studio";
  return business.businessCategory ? BUSINESS_CATEGORY_LABEL[business.businessCategory] : "Salon";
}

/** The Fresha-style venue card used on Home and in grids. */
export function BusinessCard({ business }: { business: AppNearbyBusiness }) {
  const name = businessName(business);
  return (
    <Link href={`/businesses/${business.braiderId}`} className="toh-vc">
      <BusinessCover
        id={business.braiderId}
        category={business.businessCategory}
        photoUrl={business.coverPhotoUrl ?? business.photo?.url}
        name={name}
        className="toh-vc__art"
      />
      <div>
        <h3>
          {name} <VerifiedMark size={15} />
        </h3>
        <Rating average={business.rating.average} count={business.rating.count} />
        <p className="toh-vc__m">
          {business.locationLabel ?? business.address ?? "Douala"} · {formatDistanceKm(business.distanceKm)}
        </p>
        <p className="toh-vc__m">{businessKind(business)}</p>
      </div>
    </Link>
  );
}

export function productArtFor(product: { id: string; name: string }) {
  const look = productLook(product.name, product.id);
  return <ProductArt kind={look.kind} c1={look.c1} c2={look.c2} />;
}

export function lowestPrice(product: Product) {
  const prices = product.variants.filter((variant) => variant.isActive).map((variant) => variant.priceCents);
  return prices.length ? Math.min(...prices) : 0;
}

export function Price({ cents, size = 14 }: { cents: number; size?: number }) {
  return (
    <span className="toh-price" style={{ fontSize: size }}>
      {formatFcfa(cents)}
    </span>
  );
}

/** The Amazon-style product card. */
export function ProductCard({
  product,
  onAdd,
  busy,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
  busy?: boolean;
}) {
  const inStock = product.variants.some((variant) => variant.isActive && variant.availableToSell > 0);
  return (
    <article className="toh-pc">
      <Link href={`/marketplace/products/${product.id}`} className="toh-art toh-pc__art" aria-label={product.name}>
        {product.media[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded media
          <img src={product.media[0].url} alt={product.media[0].altText} />
        ) : (
          productArtFor(product)
        )}
      </Link>
      <div className="toh-pc__b">
        <span className="toh-pc__brand">
          {product.sellerName}
        </span>
        <Link href={`/marketplace/products/${product.id}`} className="toh-pc__nm">
          {product.name}
        </Link>
        <span className="toh-pc__cat">{product.category.name}</span>
        <Price cents={lowestPrice(product)} size={16} />
        <span className="toh-pc__ship">{inStock ? "In stock · delivery in Douala & Yaoundé" : "Out of stock"}</span>
        {onAdd ? (
          <div className="toh-pc__add">
            <button
              type="button"
              className="toh-btn toh-btn--cta toh-btn--sm toh-btn--block"
              disabled={!inStock || busy}
              onClick={() => onAdd(product)}
            >
              {busy ? "Adding…" : "Add to cart"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** A bottom sheet on phones, a centred dialog on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  lead,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="toh-sheet-wrap" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="toh-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="toh-sheet__grab" />
        <h2>{title}</h2>
        {lead ? <p className="toh-sheet__lead">{lead}</p> : null}
        {children}
      </div>
    </div>
  );
}

/** A choice row with a radio dot, used by service, payment and delivery pickers. */
export function Option({
  on,
  disabled,
  onClick,
  icon,
  title,
  detail,
  right,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: IconName;
  title: React.ReactNode;
  detail?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <button type="button" className={`toh-opt${on ? " is-on" : ""}`} onClick={onClick} disabled={disabled} aria-pressed={on}>
      <span className="toh-opt__radio" />
      {icon ? (
        <span style={{ color: "var(--color-brand)" }}>
          <Icon name={icon} size={20} />
        </span>
      ) : null}
      <span className="toh-opt__t">
        <b>{title}</b>
        {detail ? <span>{detail}</span> : null}
      </span>
      {right}
    </button>
  );
}

export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="toh-notice" role="note">
      <Icon name="info" size={16} />
      <span>{children}</span>
    </p>
  );
}

const REVIEWER_COLOURS = ["#7a2fe0", "#d9507f", "#17845a", "#c08a24", "#2f6fd6", "#8b5a2b"];

/** A reviewer avatar that reveals nothing about who they are. */
export function InitialsAvatarSafe({ seed, size = 42 }: { seed: string; size?: number }) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (
    <span className="toh-avatar" style={{ width: size, height: size, background: REVIEWER_COLOURS[hash % REVIEWER_COLOURS.length] }} aria-hidden="true">
      <Icon name="user" size={Math.round(size * 0.5)} />
    </span>
  );
}
