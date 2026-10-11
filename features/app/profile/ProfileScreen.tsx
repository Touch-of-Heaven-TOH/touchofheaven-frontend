"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "@/components/app/Icon";
import { InitialsAvatar } from "@/components/app/art";
import { BusinessAvatar, TopBar } from "@/components/app/ui";
import { useViewer } from "@/components/providers/ViewerProvider";
import { browserApiFetch } from "@/lib/api/browser";
import { useCity } from "@/lib/app/city";
import { useAppointments, useFavorites, useOrders } from "@/lib/app/data";

const TILES: { icon: IconName; title: string; detail: string; href: string }[] = [
  { icon: "cal", title: "Bookings", detail: "Upcoming and past", href: "/bookings" },
  { icon: "pkg", title: "Orders", detail: "Track what you bought", href: "/bookings?tab=orders" },
  { icon: "spark", title: "Saved looks", detail: "From AI Studio", href: "/ai-studio" },
  { icon: "face", title: "Beauty profile", detail: "Hair type, skin and preferences", href: "/account/settings/beauty-profile" },
  { icon: "pin", title: "Addresses", detail: "Where we deliver", href: "/account/settings/addresses" },
  { icon: "wallet", title: "Payment methods", detail: "Mobile Money and cards", href: "/account/settings/payment-methods" },
  { icon: "bell", title: "Notifications", detail: "Reminders and messages", href: "/account/settings/notifications" },
  { icon: "lock", title: "Privacy and security", detail: "Password, sessions, your data", href: "/account/settings/security" },
  { icon: "help", title: "Help and support", detail: "A booking, an order or your account", href: "/support" },
];

export function ProfileScreen() {
  const viewer = useViewer();
  const router = useRouter();
  const [city] = useCity();
  const signedIn = Boolean(viewer);
  const { favorites } = useFavorites(signedIn);
  const { orders } = useOrders(signedIn);
  const { appointments: past } = useAppointments(signedIn, "completed");
  const [leaving, setLeaving] = useState(false);
  const isBusiness = viewer?.roles.includes("BRAIDER") ?? false;

  if (!viewer) return null;
  const name = `${viewer.firstName} ${viewer.lastName}`.trim();

  const signOut = async () => {
    setLeaving(true);
    try {
      await browserApiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  const settings = (
    <Link href="/account/settings" className="toh-icon-btn" aria-label="Settings">
      <Icon name="gear" />
    </Link>
  );

  return (
    <>
      <TopBar title="Profile" right={settings} />
      <div className="toh-page">
        <div className="toh-page-head toh-only-desk">
          <div>
            <h1>Profile</h1>
            <p>Your account, favourites and settings.</p>
          </div>
          <Link href="/account/settings" className="toh-btn toh-btn--line toh-btn--pill">
            <Icon name="gear" size={18} /> Settings
          </Link>
        </div>
        <div className="toh-prof">
          <aside className="toh-card toh-pcard">
            <InitialsAvatar name={name} size={104} />
            <h2>{name}</h2>
            <span className="toh-muted">
              {viewer.email} · {city.label}
            </span>
            {viewer.emailVerifiedAt ? null : <span className="toh-pill toh-pill--warn">Email not verified yet</span>}
            <div className="toh-pstats">
              <div>
                <b className="toh-num">{past.length}</b>
                <span>Visits</span>
              </div>
              <div>
                <b className="toh-num">{favorites.length}</b>
                <span>Favourites</span>
              </div>
              <div>
                <b className="toh-num">{orders.length}</b>
                <span>Orders</span>
              </div>
            </div>
            <Link href="/account/settings/profile" className="toh-btn toh-btn--line toh-btn--block" style={{ marginTop: 8 }}>
              Edit profile
            </Link>
          </aside>

          <div className="toh-stack" style={{ gap: 18, minWidth: 0 }}>
            <section className="toh-card toh-bizbox">
              <div>
                <h2>{isBusiness ? "Your business" : "Own a salon, barbershop or spa?"}</h2>
                <p>
                  {isBusiness
                    ? "Bookings, team, services, shop and payouts live in your business Studio."
                    : "List it on Touch of Heaven: take bookings with deposits, sell products and get found on the map."}
                </p>
              </div>
              <Link
                href={isBusiness ? "/studio" : "/business/sign-up?callbackUrl=%2Fprofessional-application"}
                className="toh-btn toh-btn--light"
              >
                {isBusiness ? "Open Studio" : "List your business"}
              </Link>
            </section>

            <div className="toh-ptiles">
              {TILES.map((tile) => (
                <Link key={tile.title} href={tile.href} className="toh-card toh-ptile">
                  <span className="toh-ptile__ic">
                    <Icon name={tile.icon} size={22} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b>{tile.title}</b>
                    <small>{tile.detail}</small>
                  </span>
                  <Icon name="chevR" size={16} />
                </Link>
              ))}
            </div>

            <section className="toh-card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Favourite businesses</h2>
              {favorites.length ? (
                <div className="toh-favs">
                  {favorites.map((favorite) => (
                    <Link key={favorite.braiderId} href={`/businesses/${favorite.braiderId}`} className="toh-fav">
                      <BusinessAvatar id={favorite.braiderId} category={null} logoUrl={favorite.logoUrl} size={56} />
                      <b>{favorite.name}</b>
                      <small className="toh-muted">{favorite.professionalName}</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="toh-muted" style={{ fontSize: 13.5 }}>
                  Tap the heart on a business page to keep it here.{" "}
                  <Link href="/businesses" className="toh-link">
                    Find a business
                  </Link>
                </p>
              )}
            </section>

            <button type="button" className="toh-btn toh-btn--line" style={{ color: "var(--color-danger)", alignSelf: "flex-start" }} onClick={() => void signOut()} disabled={leaving}>
              <Icon name="logout" size={18} /> {leaving ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
