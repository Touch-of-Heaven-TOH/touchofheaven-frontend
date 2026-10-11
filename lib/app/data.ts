"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { browserApiFetch } from "@/lib/api/browser";
import type {
  Address,
  AppNearbyBusiness,
  Appointment,
  BusinessLocation,
  BusinessProfile,
  Cart,
  CommerceCategory,
  Conversation,
  Favorite,
  Order,
  Product,
  Review,
  Service,
} from "@/lib/app/types";

/** Shared SWR fetcher: every key is an API path. */
export function apiGet<T>(path: string) {
  return browserApiFetch<T>(path);
}

const quiet = { revalidateOnFocus: false, shouldRetryOnError: false } as const;

export function useBusiness(id: string | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/v1/braiders/${id}` : null,
    (path: string) => apiGet<BusinessProfile>(path),
    quiet,
  );
  return { business: data ?? null, error, isLoading };
}

export function useServices(id: string | null) {
  const { data, isLoading } = useSWR(
    id ? `/api/v1/braiders/${id}/services` : null,
    (path: string) => apiGet<{ services: Service[] }>(path),
    quiet,
  );
  return { services: data?.services ?? [], isLoading };
}

export function useReviews(id: string | null) {
  const { data } = useSWR(
    id ? `/api/v1/braiders/${id}/reviews?limit=20` : null,
    (path: string) => apiGet<{ reviews: Review[]; total?: number }>(path),
    quiet,
  );
  return data?.reviews ?? [];
}

export function useLocations(id: string | null) {
  const { data } = useSWR(
    id ? `/api/v1/braiders/${id}/locations` : null,
    (path: string) => apiGet<{ locations: BusinessLocation[] }>(path),
    quiet,
  );
  return data?.locations ?? [];
}

export function useProducts(query: { categoryId?: string | null; sellerId?: string | null; search?: string | null } = {}) {
  const params = new URLSearchParams();
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.sellerId) params.set("sellerId", query.sellerId);
  if (query.search) params.set("search", query.search);
  const qs = params.toString();
  const { data, isLoading, error } = useSWR(
    `/api/v1/commerce/products${qs ? `?${qs}` : ""}`,
    (path: string) => apiGet<{ products: Product[] }>(path),
    quiet,
  );
  return { products: data?.products ?? [], isLoading, error };
}

export function useProduct(id: string) {
  const { data, isLoading, error } = useSWR(
    `/api/v1/commerce/products/${id}`,
    (path: string) => apiGet<{ product: Product }>(path),
    quiet,
  );
  return { product: data?.product ?? null, isLoading, error };
}

export function useCategories() {
  const { data } = useSWR(
    "/api/v1/commerce/categories",
    (path: string) => apiGet<{ categories: CommerceCategory[] }>(path),
    quiet,
  );
  return data?.categories ?? [];
}

const CART_KEY = "/api/v1/commerce/cart";

export function useCart() {
  const { data, isLoading, mutate } = useSWR(CART_KEY, (path: string) => apiGet<{ cart: Cart }>(path), quiet);
  const cart = data?.cart ?? null;
  const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return { cart, count, isLoading, refresh: mutate };
}

export async function addToCart(productVariantId: string, quantity = 1) {
  const result = await browserApiFetch<{ cart: Cart }>("/api/v1/commerce/cart/items", {
    method: "POST",
    body: { productVariantId, quantity },
  });
  await globalMutate(CART_KEY, result, { revalidate: false });
  return result.cart;
}

export async function setCartQuantity(itemId: string, quantity: number) {
  const result =
    quantity > 0
      ? await browserApiFetch<{ cart: Cart }>(`/api/v1/commerce/cart/items/${itemId}`, {
          method: "PATCH",
          body: { quantity },
        })
      : await browserApiFetch<{ cart: Cart }>(`/api/v1/commerce/cart/items/${itemId}`, { method: "DELETE" });
  await globalMutate(CART_KEY, result, { revalidate: false });
  return result.cart;
}

export function useOrders(signedIn: boolean) {
  const { data, isLoading } = useSWR(
    signedIn ? "/api/v1/commerce/orders" : null,
    (path: string) => apiGet<{ orders: Order[] }>(path),
    quiet,
  );
  return { orders: data?.orders ?? [], isLoading };
}

export function useAddresses(signedIn: boolean) {
  const { data, isLoading } = useSWR(
    signedIn ? "/api/v1/customer/addresses" : null,
    (path: string) => apiGet<{ addresses: Address[] }>(path),
    quiet,
  );
  return { addresses: data?.addresses ?? [], isLoading };
}

export function useAppointments(signedIn: boolean, status?: "upcoming" | "completed" | "cancelled") {
  const { data, isLoading, mutate } = useSWR(
    signedIn ? `/api/v1/bookings?limit=50${status ? `&status=${status}` : ""}` : null,
    (path: string) => apiGet<{ appointments: Appointment[]; total: number }>(path),
    quiet,
  );
  return { appointments: data?.appointments ?? [], isLoading, refresh: mutate };
}

const FAVORITES_KEY = "/api/v1/customer/favorites";

export function useFavorites(signedIn: boolean) {
  const { data, mutate } = useSWR(
    signedIn ? FAVORITES_KEY : null,
    (path: string) => apiGet<{ favorites: Favorite[] }>(path),
    quiet,
  );
  const favorites = data?.favorites ?? [];
  return {
    favorites,
    isFavorite: (braiderId: string) => favorites.some((favorite) => favorite.braiderId === braiderId),
    refresh: mutate,
  };
}

export async function toggleFavorite(braiderId: string, on: boolean) {
  if (on) {
    await browserApiFetch(FAVORITES_KEY, { method: "POST", body: { braiderId } });
  } else {
    await browserApiFetch(`${FAVORITES_KEY}/${braiderId}`, { method: "DELETE" });
  }
  await globalMutate(FAVORITES_KEY);
}

export function useConversations(signedIn: boolean) {
  const { data, isLoading, mutate } = useSWR(
    signedIn ? "/api/v1/messaging/conversations?limit=50" : null,
    (path: string) => apiGet<{ conversations: Conversation[] }>(path),
    { refreshInterval: 20_000, shouldRetryOnError: false },
  );
  return { conversations: data?.conversations ?? [], isLoading, refresh: mutate };
}

/** Opens (or reuses) the conversation with a business and returns its id. */
export async function startConversation(recipientId: string) {
  const result = await browserApiFetch<{ id: string }>("/api/v1/messaging/conversations", {
    method: "POST",
    body: { recipientId },
  });
  return result.id;
}

export function useCredits(signedIn: boolean) {
  const { data, mutate } = useSWR(
    signedIn ? "/api/v1/studio/credits" : null,
    (path: string) => apiGet<{ balance: number }>(path),
    quiet,
  );
  return { credits: data?.balance ?? null, refresh: mutate };
}

export type City = { key: "douala" | "yaounde"; label: string; lat: number; lng: number };

export const CITIES: City[] = [
  { key: "douala", label: "Douala", lat: 4.0511, lng: 9.7679 },
  { key: "yaounde", label: "Yaoundé", lat: 3.848, lng: 11.5021 },
];

/** Nearby verified businesses around a city centre, with the redesign's filters. */
export function useNearby(
  city: City,
  filters: { category?: string | null; businessCategory?: string | null; locationType?: string | null } = {},
) {
  const params = new URLSearchParams({ lat: String(city.lat), lng: String(city.lng), radius: "30" });
  if (filters.category) params.set("category", filters.category);
  if (filters.businessCategory) params.set("businessCategory", filters.businessCategory);
  if (filters.locationType) params.set("locationType", filters.locationType);
  const { data, isLoading, error } = useSWR(
    `/api/v1/braiders/nearby?${params.toString()}`,
    (path: string) => apiGet<{ braiders: AppNearbyBusiness[]; total: number }>(path),
    { ...quiet, keepPreviousData: true },
  );
  // A business with a salon and a travel area comes back twice; show it once.
  const seen = new Set<string>();
  const businesses = (data?.braiders ?? []).filter((business) => {
    if (seen.has(business.braiderId)) return false;
    seen.add(business.braiderId);
    return true;
  });
  return { businesses, isLoading, error };
}
