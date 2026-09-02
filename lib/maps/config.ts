// Map rendering runs on MapLibre GL JS against OpenFreeMap's free vector
// tiles (https://openfreemap.org) - no API key, no billing account, no
// per-request quota. OpenFreeMap serves the whole planet from OpenStreetMap
// data, which has solid community coverage in Cameroon's major cities
// (Douala, Yaounde) - unlike the previous Google Maps integration this
// replaces, which also hard-required a paid API key that was never
// configured, so no map ever actually rendered.
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Nominatim (OpenStreetMap's own geocoder) also needs no API key. Its usage
// policy (https://operations.osmfoundation.org/policies/nominatim/) asks
// for a distinguishing identifier on every request, hence the `email`
// query param helper in lib/maps/geocode.ts - set this to a real inbox the
// team monitors if Nominatim ever rate-limits or blocks requests.
export const NOMINATIM_CONTACT_EMAIL = "support@touchofheavenafricanhairbraiding.com";

// Sensible default center before geolocation resolves (or if it's denied) -
// Douala, Cameroon's largest city and economic capital. Purely a fallback
// camera position; it has no effect on what data loads.
export const DEFAULT_MAP_CENTER = { lat: 4.0483, lng: 9.7043 };
