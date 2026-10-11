"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, Stars, VerifiedMark } from "@/components/app/Icon";
import { Portrait, VenueArt, hashString, type LookName } from "@/components/app/art";
import { Empty, InitialsAvatarSafe, ProductCard, Rating, businessName } from "@/components/app/ui";
import { useToast } from "@/components/feedback/ToastProvider";
import { useViewer } from "@/components/providers/ViewerProvider";
import { BUSINESS_CATEGORY_LABEL, lookForService, venueKindFor } from "@/lib/app/business-look";
import {
  addToCart,
  startConversation,
  toggleFavorite,
  useBusiness,
  useFavorites,
  useLocations,
  useProducts,
  useReviews,
  useServices,
} from "@/lib/app/data";
import { formatDuration, formatFcfa, formatRelative } from "@/lib/app/format";

const TABS = [
  ["services", "Services"],
  ["team", "Team"],
  ["reviews", "Reviews"],
  ["shop", "Shop"],
  ["about", "About"],
] as const;

const TEAM_LOOKS: LookName[] = ["silk", "braids", "fade", "locs", "bob", "twists", "afro", "glam"];

export function VenuePage({ id }: { id: string }) {
  const router = useRouter();
  const viewer = useViewer();
  const toast = useToast();
  const { business, isLoading, error } = useBusiness(id);
  const { services } = useServices(id);
  const reviews = useReviews(id);
  const locations = useLocations(id);
  const { products } = useProducts({ sellerId: id });
  const { isFavorite } = useFavorites(Boolean(viewer));
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("services");
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="toh-page">
        <div className="toh-skeleton" style={{ height: 380 }} />
      </div>
    );
  }
  if (error || !business) {
    return (
      <div className="toh-page">
        <Empty icon="store" title="This business isn't available">
          <span>It may be under review or no longer taking bookings.</span>
          <Link href="/businesses" className="toh-btn toh-btn--sm">
            Find another business
          </Link>
        </Empty>
      </div>
    );
  }

  const name = businessName(business);
  const liked = isFavorite(id);
  const location = locations[0];
  const address =
    location?.address ??
    (business.locationModel === "MOBILE" ? "Comes to you" : business.locationModel === "PRIVATE_STUDIO" ? "Private studio, address shared after booking" : null);
  const kind = business.businessCategory ? BUSINESS_CATEGORY_LABEL[business.businessCategory] : "Beauty business";
  const venue = venueKindFor(business.businessCategory);
  const team = business.team ?? [];
  const deposit = business.policy?.depositPercent ?? services[0]?.depositPercentage ?? 20;

  const needSignIn = () => {
    router.push(`/customer/sign-in?callbackUrl=${encodeURIComponent(`/businesses/${id}`)}`);
  };

  const message = async () => {
    if (!viewer) return needSignIn();
    setBusy(true);
    try {
      const conversationId = await startConversation(id);
      router.push(`/messages?c=${conversationId}`);
    } catch {
      toast.error("Couldn't open the chat. Try again.");
      setBusy(false);
    }
  };

  const like = async () => {
    if (!viewer) return needSignIn();
    try {
      await toggleFavorite(id, !liked);
      toast.success(liked ? "Removed from favourites" : "Saved to favourites");
    } catch {
      toast.error("Couldn't update favourites.");
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // The visitor closed the share sheet.
    }
  };

  const jump = (key: (typeof TABS)[number][0]) => {
    setTab(key);
    document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const directions = location?.latitude
    ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`
    : null;

  return (
    <div className="toh-venue">
      {/* Phone cover with back, share and like. */}
      <div className="toh-cover toh-only-phone">
        <div className="toh-art toh-cover__art">
          {business.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- business-uploaded cover
            <img src={business.coverPhotoUrl} alt="" />
          ) : (
            <VenueArt kind={venue} seed={id} />
          )}
        </div>
        <div className="toh-cover__bar">
          <button type="button" className="toh-icon-btn toh-cover__btn" aria-label="Back" onClick={() => router.back()}>
            <Icon name="chevL" />
          </button>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="toh-icon-btn toh-cover__btn" aria-label="Share" onClick={share}>
              <Icon name="share" size={20} />
            </button>
            <button
              type="button"
              className="toh-icon-btn toh-cover__btn"
              aria-label={liked ? "Remove from favourites" : "Save to favourites"}
              onClick={like}
              style={liked ? { color: "var(--color-rose)" } : undefined}
            >
              <Icon name="heart" size={20} filled={liked} />
            </button>
          </span>
        </div>
      </div>

      <div className="toh-page">
        <nav className="toh-crumbs toh-only-desk" aria-label="Breadcrumb">
          <Link href="/businesses">Businesses</Link>
          <Icon name="chevR" size={12} />
          <span>{name}</span>
        </nav>
        <div className="toh-vhead">
          <div>
            <h1>
              {name} {business.verifiedAt ? <VerifiedMark size={22} /> : null}
            </h1>
            <div className="toh-vhead__m">
              <Rating average={business.rating.average} count={business.rating.count} size={15} />
              <span className="toh-dot">·</span>
              <span>{kind}</span>
              {address ? (
                <>
                  <span className="toh-dot">·</span>
                  <span>{address}</span>
                </>
              ) : null}
              {directions ? (
                <>
                  <span className="toh-dot">·</span>
                  <a className="toh-link" href={directions} target="_blank" rel="noreferrer">
                    Get directions
                  </a>
                </>
              ) : null}
            </div>
            {business.acceptsNewClients ? null : (
              <p className="toh-notice" style={{ marginTop: 12 }}>
                <Icon name="info" size={16} /> {name} isn&apos;t taking new clients right now. Returning clients can still book.
              </p>
            )}
          </div>
          <div className="toh-only-desk" style={{ display: "flex", gap: 8 }}>
            <button type="button" className="toh-icon-btn toh-icon-btn--line" aria-label="Share" onClick={share}>
              <Icon name="share" size={18} />
            </button>
            <button
              type="button"
              className="toh-icon-btn toh-icon-btn--line"
              aria-label={liked ? "Remove from favourites" : "Save to favourites"}
              onClick={like}
              style={liked ? { color: "var(--color-rose)" } : undefined}
            >
              <Icon name="heart" size={18} filled={liked} />
            </button>
          </div>
        </div>
        <div className="toh-acts toh-only-phone">
          <button type="button" className="toh-btn toh-btn--ghost toh-btn--sm" onClick={message} disabled={busy}>
            <Icon name="chat" size={16} /> Message
          </button>
        </div>

        <div className="toh-photos toh-only-desk">
          <div className="toh-art">
            {business.coverPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- business-uploaded cover
              <img src={business.coverPhotoUrl} alt="" />
            ) : (
              <VenueArt kind={venue} seed={id} />
            )}
          </div>
          <div className="toh-photos__side">
            <div className="toh-art">
              <VenueArt kind={venue} seed={`${id}-2`} />
            </div>
            <div className="toh-art">
              <Portrait look={lookForService(services[0]?.name ?? business.specialties[0] ?? "")} />
            </div>
          </div>
        </div>

        <div className="toh-vbody">
          <div style={{ minWidth: 0 }}>
            <nav className="toh-vtabs" aria-label="Sections">
              {TABS.map(([key, label]) => (
                <button key={key} type="button" className={tab === key ? "is-on" : ""} onClick={() => jump(key)}>
                  {label}
                </button>
              ))}
            </nav>

            <section className="toh-vsec" id="sec-services">
              <h2>Services</h2>
              {services.length ? (
                services.map((service) => (
                  <div key={service.id} className="toh-svc">
                    <div className="toh-art toh-svc__art">
                      <Portrait look={lookForService(service.name)} />
                    </div>
                    <div className="toh-svc__t">
                      <b>{service.name}</b>
                      <span>
                        {formatDuration(service.baseDurationMins)}
                        {service.variations.length ? " · options available" : ""}
                      </span>
                      {service.description ? <p>{service.description}</p> : null}
                      <span className="toh-svc__p">from {formatFcfa(service.basePriceCents)}</span>
                    </div>
                    <Link href={`/businesses/${id}/book?service=${service.id}`} className="toh-btn toh-btn--line toh-btn--sm toh-btn--pill">
                      Book
                    </Link>
                  </div>
                ))
              ) : (
                <p className="toh-muted">No services published yet.</p>
              )}
            </section>

            {team.length ? (
              <section className="toh-vsec" id="sec-team">
                <h2>Team</h2>
                <div className="toh-team">
                  {team.map((member) => (
                    <div key={member.id} className="toh-tm">
                      <span className="toh-avatar toh-art toh-tm__av">
                        <Portrait look={TEAM_LOOKS[hashString(member.id) % TEAM_LOOKS.length]!} />
                      </span>
                      <b>{member.displayName}</b>
                      <span>{member.jobTitle ?? (member.role === "OWNER" ? "Owner" : "Stylist")}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <span id="sec-team" />
            )}

            <section className="toh-vsec" id="sec-reviews">
              <h2>Reviews</h2>
              {reviews.length ? (
                <>
                  <div className="toh-rsum">
                    <span className="toh-rsum__big">{business.rating.average?.toFixed(1)}</span>
                    <div>
                      <Stars rating={business.rating.average ?? 0} size={20} />
                      <p className="toh-muted" style={{ marginTop: 4 }}>
                        {business.rating.count} reviews, all from completed bookings
                      </p>
                    </div>
                  </div>
                  <div className="toh-rgrid">
                    {reviews.slice(0, 6).map((review) => (
                      <div key={review.id} className="toh-rc">
                        <div className="toh-rc__who">
                          <InitialsAvatarSafe seed={review.id} />
                          <div>
                            <b>Verified client</b>
                            <small>
                              {formatRelative(review.createdAt)} · {review.service.name}
                            </small>
                          </div>
                        </div>
                        <Stars rating={review.rating} size={14} />
                        <p>{review.reviewBody}</p>
                        {review.response ? (
                          <p className="toh-rc__reply">
                            <b>Reply from {name}:</b> {review.response.responseBody}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="toh-muted">No reviews yet. Reviews only come from completed bookings.</p>
              )}
            </section>

            <section className="toh-vsec" id="sec-shop">
              <h2>Shop {name.split(" ")[0]}&apos;s picks</h2>
              {products.length ? (
                <>
                  <p className="toh-muted" style={{ margin: "-8px 0 16px" }}>
                    Products this business sells and uses. Delivered across Douala and Yaoundé.
                  </p>
                  <div className="toh-pgrid">
                    {products.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={async (item) => {
                          const variant = item.variants.find((v) => v.isActive && v.availableToSell > 0);
                          if (!variant) return;
                          try {
                            await addToCart(variant.id);
                            toast.success("Added to your cart");
                          } catch {
                            toast.error("Couldn't add that to your cart.");
                          }
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="toh-muted">This business doesn&apos;t sell products yet.</p>
              )}
            </section>

            <section className="toh-vsec" id="sec-about">
              <h2>About</h2>
              {business.bio ? <p style={{ lineHeight: 1.65, maxWidth: "70ch" }}>{business.bio}</p> : null}
              {business.socialLinks?.instagram || business.socialLinks?.tiktok ? (
                <p style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <Icon name="globe" size={16} />
                  <span className="toh-link">{business.socialLinks.instagram ?? business.socialLinks.tiktok}</span>
                  <span className="toh-muted">on Instagram and TikTok</span>
                </p>
              ) : null}
              <h3 className="toh-h3">Good to know</h3>
              <div className="toh-facts">
                <div>
                  <Icon name="check" size={18} /> Instant confirmation
                </div>
                <div>
                  <Icon name="wallet" size={18} /> {deposit}% deposit to book, the rest paid at the appointment
                </div>
                <div>
                  <Icon name="phone" size={18} /> Pay by MTN or Orange Mobile Money
                </div>
                <div>
                  <Icon name="shield" size={18} /> {business.policy?.cancellationPolicy?.description ?? "Free cancellation up to 24 hours before."}
                </div>
                {business.languages.length ? (
                  <div>
                    <Icon name="globe" size={18} /> Speaks {business.languages.map((code) => (code === "fr" ? "French" : code === "en" ? "English" : code)).join(" and ")}
                  </div>
                ) : null}
                {business.locationModel === "MOBILE" ? (
                  <div>
                    <Icon name="pin" size={18} /> Travels to you
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="toh-card toh-vside">
            <h2>{name}</h2>
            <Rating average={business.rating.average} count={business.rating.count} size={15} />
            <Link href={`/businesses/${id}/book`} className="toh-btn toh-btn--dark toh-btn--lg toh-btn--block toh-btn--pill">
              Book now
            </Link>
            <button type="button" className="toh-btn toh-btn--line toh-btn--block toh-btn--pill" onClick={message} disabled={busy}>
              <Icon name="chat" size={18} /> Message
            </button>
            {address ? (
              <div className="toh-vside__ln">
                <Icon name="pin" size={18} />
                <span>
                  {address}
                  {directions ? (
                    <>
                      <br />
                      <a className="toh-link" href={directions} target="_blank" rel="noreferrer">
                        Get directions
                      </a>
                    </>
                  ) : null}
                </span>
              </div>
            ) : null}
            <div className="toh-vside__ln">
              <Icon name="shield" size={18} />
              <span>Verified business. Reviews come only from completed bookings.</span>
            </div>
          </aside>
        </div>
      </div>

      <div className="toh-sticky-cta toh-only-phone" style={{ padding: "12px var(--toh-pad)" }}>
        <Link href={`/businesses/${id}/book`} className="toh-btn toh-btn--block toh-btn--lg">
          Book now
        </Link>
      </div>
    </div>
  );
}
