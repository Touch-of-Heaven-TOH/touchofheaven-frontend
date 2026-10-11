"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/app/Icon";
import { useViewer } from "@/components/providers/ViewerProvider";
import { useCity } from "@/lib/app/city";
import { useCart, useProducts } from "@/lib/app/data";
import type { CommerceCategory, Product } from "@/lib/app/types";

/** Departments that actually have products, in catalogue order. */
export function departmentsOf(products: Product[]): CommerceCategory[] {
  const seen = new Map<string, CommerceCategory>();
  for (const product of products) seen.set(product.category.id, product.category);
  return [...seen.values()];
}

/** The store header from the desktop prototype: deliver-to, search, account, orders and cart. */
export function MarketHeader() {
  const router = useRouter();
  const params = useSearchParams();
  const viewer = useViewer();
  const [city] = useCity();
  const { count } = useCart();
  const { products } = useProducts();
  const departments = departmentsOf(products);
  const dept = params.get("dept") ?? "";
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [searchDept, setSearchDept] = useState(dept);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (searchDept) next.set("dept", searchDept);
    router.push(`/marketplace${next.size ? `?${next.toString()}` : "?all=1"}`);
  };

  return (
    <header className="toh-mh">
      <div className="toh-mh__top">
        <Link href="/" className="toh-icon-btn toh-only-phone toh-mh__back" aria-label="Home">
          <Icon name="arrowL" />
        </Link>
        <span className="toh-mh__loc">
          <Icon name="pin" size={18} />
          <span>
            <small>Deliver to {viewer?.firstName ?? "you"}</small>
            <b>{city.label}</b>
          </span>
        </span>
        <form className="toh-msearch" role="search" onSubmit={search}>
          <select value={searchDept} onChange={(event) => setSearchDept(event.target.value)} aria-label="Search in department">
            <option value="">All</option>
            {departments.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search hair care, skincare, sellers"
            autoComplete="off"
            aria-label="Search products"
          />
          <button aria-label="Search">
            <Icon name="search" size={22} />
          </button>
        </form>
        <Link href={viewer ? "/account" : "/customer/sign-in?callbackUrl=%2Fmarketplace"} className="toh-mh__acc">
          <small>Hello, {viewer?.firstName ?? "sign in"}</small>
          <b>Account</b>
        </Link>
        <Link href="/bookings?tab=orders" className="toh-mh__acc toh-only-desk">
          <small>Returns</small>
          <b>& Orders</b>
        </Link>
        <Link href="/cart" className="toh-mh__cart" aria-label={`Cart, ${count} items`}>
          <Icon name="cart" size={32} />
          <span className="toh-mh__cc toh-num">{count}</span>
          <span className="toh-only-desk" style={{ paddingBottom: 4 }}>
            Cart
          </span>
        </Link>
      </div>
      <nav className="toh-mh__nav" aria-label="Departments">
        <Link href="/marketplace?all=1" className={params.get("all") && !dept ? "is-on" : ""}>
          <Icon name="menu" size={18} /> All
        </Link>
        {departments.map((item) => (
          <Link key={item.id} href={`/marketplace?dept=${item.slug}`} className={dept === item.slug ? "is-on" : ""}>
            {item.name}
          </Link>
        ))}
        <Link href="/business/sign-up?callbackUrl=%2Fprofessional-application" className="toh-mh__promo">
          Sell on Touch of Heaven
        </Link>
      </nav>
    </header>
  );
}
