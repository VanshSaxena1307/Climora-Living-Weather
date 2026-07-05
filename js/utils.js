/* ============================================================
   CLIMORA — Utilities
   ============================================================ */

export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
export function lerp(a, b, t) { return a + (b - a) * t; }

export function round(v, d = 0) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

export function cToF(c) { return c * 9 / 5 + 32; }

export function formatTemp(celsius, unit) {
  if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return "--";
  const v = unit === "F" ? cToF(celsius) : celsius;
  return `${Math.round(v)}`;
}

export function formatClock(date, withSeconds = false) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  });
}

export function formatDateLong(date) {
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function formatHour(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric" });
}

export function formatDayShort(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short" });
}

export function formatDayDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatHM(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function isToday(iso) {
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

/** 16-point compass direction from a wind bearing in degrees. */
export function degToCompass(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

/** Animate a numeric counter from its current text to a target value. */
export function animateCount(el, target, { duration = 900, suffix = "", decimals = 0 } = {}) {
  const start = parseFloat(el.dataset.raw || "0") || 0;
  const startTime = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function tick(now) {
    const p = clamp((now - startTime) / duration, 0, 1);
    const val = start + (target - start) * ease(p);
    el.textContent = val.toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.dataset.raw = String(target);
  }
  requestAnimationFrame(tick);
}

/** Approximate moon phase (0=new, 0.5=full, 1=new) using a simple synodic calc. */
export function moonPhase(date = new Date()) {
  const synodic = 29.53058867;
  const known = Date.UTC(2000, 0, 6, 18, 14); // known new moon
  const diffDays = (date.getTime() - known) / 86400000;
  let phase = (diffDays % synodic) / synodic;
  if (phase < 0) phase += 1;
  return phase; // 0..1
}

export function moonPhaseName(phase) {
  const names = [
    "New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
    "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent",
  ];
  return names[Math.round(phase * 8) % 8];
}

export function aqiInfo(aqi) {
  if (aqi == null) return { label: "N/A", color: "#8b93a3" };
  if (aqi <= 50) return { label: "Good", color: "#4ade80" };
  if (aqi <= 100) return { label: "Moderate", color: "#facc15" };
  if (aqi <= 150) return { label: "Sensitive", color: "#fb923c" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#f87171" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#c084fc" };
  return { label: "Hazardous", color: "#7f1d1d" };
}

/** Minimal inline icon set — stroke-based, currentColor, 24x24 viewbox. */
export const ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.1 7-12.5A7 7 0 0 0 5 9.5C5 14.9 12 22 12 22z"/><circle cx="12" cy="9.5" r="2.4"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  monitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  crosshair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>`,
  droplet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s7 8.1 7 12.6A7 7 0 1 1 5 14.6C5 10.1 12 2 12 2z"/></svg>`,
  wind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10a2.5 2.5 0 1 0-2.4-3.2M3 16h13a2.5 2.5 0 1 1-2.4 3.2M3 12h16a2.2 2.2 0 1 0-2.1-2.8"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14 15 9"/><circle cx="12" cy="14" r="1"/><path d="M4 15a8 8 0 1 1 16 0"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  uv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="15" r="4.5"/><path d="M12 2v3M4.9 8.9l1.4 1.4M19.1 8.9l-1.4 1.4"/></svg>`,
  sunrise: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 9V2M4.2 10.2l1.5 1.5M19.8 10.2l-1.5 1.5M1 18h2M21 18h2"/><path d="M8 21h8"/></svg>`,
  sunset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14a5 5 0 0 0-10 0"/><path d="M12 5V2M4.2 6.2l1.5 1.5M19.8 6.2l-1.5 1.5M1 14h2M21 14h2"/><path d="M8 21h8M5 18h14"/></svg>`,
  thermo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 19a4.5 4.5 0 0 1-.6-8.96 5.5 5.5 0 0 1 10.8-1.9A4.5 4.5 0 0 1 17.5 19h-11z"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-6 8-11 15-11 0 8-3 15-8 15z"/><path d="M4 20c4-4 8-6.5 15-8"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
  starIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.2 6.8H21l-5.6 4.1L17.6 20 12 15.9 6.4 20l2.2-7.1L3 8.8h6.8z"/></svg>`,
};

/** Weather-condition icon set (fills a 32x32-ish canvas, currentColor + accent). */
export const WICON = {
  sun: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="10" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"/></g></svg>`,
  "sun-cloud": `<svg viewBox="0 0 48 48"><circle cx="18" cy="18" r="8" fill="currentColor" opacity="0.9"/><path d="M12 34a8 8 0 0 1-1-15.9A9.6 9.6 0 0 1 29.6 15 7.6 7.6 0 0 1 29 30H12z" fill="currentColor" opacity="0.55"/></svg>`,
  cloud: `<svg viewBox="0 0 48 48"><path d="M13 36a9 9 0 0 1-1.2-17.9A11 11 0 0 1 33.2 14 9 9 0 0 1 32 36H13z" fill="currentColor"/></svg>`,
  fog: `<svg viewBox="0 0 48 48"><path d="M13 22a9 9 0 0 1 19.4-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity="0.7"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 26h36M6 32h36M10 38h28"/></g></svg>`,
  drizzle: `<svg viewBox="0 0 48 48"><path d="M13 26a9 9 0 0 1-1.2-17.9A11 11 0 0 1 33.2 4 9 9 0 0 1 32 26H13z" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M16 32v4M24 32v4M32 32v4"/></g></svg>`,
  rain: `<svg viewBox="0 0 48 48"><path d="M13 24a9 9 0 0 1-1.2-17.9A11 11 0 0 1 33.2 2 9 9 0 0 1 32 24H13z" fill="currentColor"/><g stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M14 30l-3 8M24 30l-3 8M34 30l-3 8"/></g></svg>`,
  snow: `<svg viewBox="0 0 48 48"><path d="M13 22a9 9 0 0 1-1.2-17.9A11 11 0 0 1 33.2 0 9 9 0 0 1 32 22H13z" fill="currentColor" opacity="0.85"/><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M16 30v10M11 35h10M24 30v10M19 35h10M32 30v10M27 35h10"/></g></svg>`,
  storm: `<svg viewBox="0 0 48 48"><path d="M13 20a9 9 0 0 1-1.2-17.9A11 11 0 0 1 33.2-2 9 9 0 0 1 32 20H13z" fill="currentColor" opacity="0.9" transform="translate(0,4)"/><path d="M25 24l-6 10h5l-3 8 9-12h-5z" fill="currentColor"/></svg>`,
};
