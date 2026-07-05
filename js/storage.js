/* ============================================================
   CLIMORA — Local Persistence
   ============================================================ */

const KEYS = {
  unit: "climora:unit",
  recent: "climora:recent",
  lastPlace: "climora:lastPlace",
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export const Store = {
  getUnit: () => safeGet(KEYS.unit, "C"),
  setUnit: (v) => safeSet(KEYS.unit, v),

  getRecent: () => safeGet(KEYS.recent, []),
  addRecent(place) {
    const list = this.getRecent().filter(
      (p) => !(p.name === place.name && p.country === place.country)
    );
    list.unshift(place);
    safeSet(KEYS.recent, list.slice(0, 6));
  },

  getLastPlace: () => safeGet(KEYS.lastPlace, null),
  setLastPlace: (p) => safeSet(KEYS.lastPlace, p),
};

export const POPULAR_CITIES = [
  { name: "New York", country: "United States", latitude: 40.7128, longitude: -74.006, admin1: "New York" },
  { name: "London", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { name: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
];
