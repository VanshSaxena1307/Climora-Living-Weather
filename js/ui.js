/* ============================================================
   CLIMORA — UI Rendering Layer
   ============================================================ */

import { describeCode, quoteFor } from "./weatherCodes.js";
import {
  ICON, WICON, formatTemp, formatHour, formatDayShort, formatDayDate,
  formatHM, degToCompass, animateCount, moonPhase, moonPhaseName, aqiInfo, round,
} from "./utils.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------- Hero ---------------- */

export function renderHero({ place, current, daily }, unit) {
  const info = describeCode(current.weather_code);
  $("#hero-city").textContent = place.name;
  $("#hero-country").textContent = [place.admin1, place.country].filter(Boolean).join(", ");

  const tempEl = $("#hero-temp-value");
  const target = parseFloat(formatTemp(current.temperature_2m, unit));
  animateCount(tempEl, target, { duration: 1100 });

  $("#hero-icon").innerHTML = WICON[info.icon] || WICON.cloud;
  $("#hero-desc-text").textContent = info.desc;
  $("#hero-feels").textContent = `Feels like ${formatTemp(current.apparent_temperature, unit)}°`;
  $("#hero-hi").textContent = `${formatTemp(daily.temperature_2m_max[0], unit)}°`;
  $("#hero-lo").textContent = `${formatTemp(daily.temperature_2m_min[0], unit)}°`;

  document.getElementById("hero").classList.add("hero-anim-in");
}

export function tickClock() {
  const now = new Date();
  $("#hero-clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  $("#hero-date").textContent = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

/* ---------------- Hourly rail ---------------- */

export function renderHourly(hourly, unit, isDayNow) {
  const rail = $("#hourly-rail");
  const nowIdx = findNowIndex(hourly.time);
  const slice = hourly.time.slice(nowIdx, nowIdx + 24);

  rail.innerHTML = slice.map((iso, i) => {
    const idx = nowIdx + i;
    const info = describeCode(hourly.weather_code[idx]);
    const label = i === 0 ? "Now" : formatHour(iso);
    return `
      <div class="hour-card glass" data-ripple>
        <span class="h-time">${label}</span>
        <span class="h-icon">${WICON[info.icon] || WICON.cloud}</span>
        <span class="h-temp">${formatTemp(hourly.temperature_2m[idx], unit)}°</span>
        <span class="h-rain">💧 ${hourly.precipitation_probability[idx]}%</span>
        <span class="h-wind">${Math.round(hourly.wind_speed_10m[idx])} km/h</span>
      </div>`;
  }).join("");
}

function findNowIndex(times) {
  const now = Date.now();
  let idx = times.findIndex((t) => new Date(t).getTime() >= now);
  return idx === -1 ? 0 : idx;
}

/* ---------------- 7-day grid ---------------- */

export function renderDaily(daily, unit) {
  const grid = $("#day-grid");
  const globalMax = Math.max(...daily.temperature_2m_max);
  const globalMin = Math.min(...daily.temperature_2m_min);
  const span = Math.max(1, globalMax - globalMin);

  grid.innerHTML = daily.time.map((iso, i) => {
    const info = describeCode(daily.weather_code[i]);
    const dayLabel = i === 0 ? "Today" : formatDayShort(iso);
    const max = daily.temperature_2m_max[i];
    const min = daily.temperature_2m_min[i];
    const leftPct = ((min - globalMin) / span) * 100;
    const widthPct = ((max - min) / span) * 100;
    return `
      <div class="day-card glass">
        <span class="d-name">${dayLabel}</span>
        <span class="d-date">${formatDayDate(iso)}</span>
        <span class="d-icon">${WICON[info.icon] || WICON.cloud}</span>
        <span class="d-rain">💧 ${daily.precipitation_probability_max[i]}%</span>
        <span class="d-range"><b class="d-max">${formatTemp(max, unit)}°</b><span class="d-min">${formatTemp(min, unit)}°</span></span>
        <span class="d-bar"><span class="d-bar-fill" style="margin-left:${leftPct}%;width:${Math.max(widthPct, 8)}%"></span></span>
      </div>`;
  }).join("");
}

/* ---------------- Bento metrics ---------------- */

export function renderBento({ current, daily, hourly, aqi }, unit) {
  const grid = $("#bento-grid");
  const sunrise = daily.sunrise[0], sunset = daily.sunset[0];
  const sunProgress = sunArcProgress(sunrise, sunset);
  const phase = moonPhase();
  const dew = hourly.dew_point_2m ? hourly.dew_point_2m[findNowIndex(hourly.time)] : null;
  const vis = hourly.visibility ? hourly.visibility[findNowIndex(hourly.time)] / 1000 : null;
  const uv = current.uv_index ?? daily.uv_index_max[0];
  const aqiVal = aqi?.us_aqi ?? null;
  const aq = aqiInfo(aqiVal);

  grid.innerHTML = `
    <div class="metric-card glass big">
      <div class="metric-top"><span class="metric-label">Sunrise &amp; Sunset</span>${ICON.sun}</div>
      <div class="sun-arc-wrap">${sunArcSvg(sunProgress)}</div>
      <div class="metric-foot" style="display:flex;justify-content:space-between">
        <span>↑ ${formatHM(sunrise)}</span><span>↓ ${formatHM(sunset)}</span>
      </div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">Humidity</span>${ICON.droplet}</div>
      <div class="metric-value">${current.relative_humidity_2m}<span class="metric-unit">%</span></div>
      <div class="metric-foot">Dew point ${dew != null ? formatTemp(dew, unit) + "°" : "--"}</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">Wind</span>${ICON.wind}</div>
      <div class="compass">${compassSvg(current.wind_direction_10m)}</div>
      <div class="metric-foot">${Math.round(current.wind_speed_10m)} km/h · ${degToCompass(current.wind_direction_10m)}</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">Pressure</span>${ICON.gauge}</div>
      <div class="metric-value">${Math.round(current.pressure_msl)}<span class="metric-unit">hPa</span></div>
      <div class="metric-foot">${current.pressure_msl > 1013 ? "High pressure" : "Low pressure"}</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">UV Index</span>${ICON.uv}</div>
      <div class="metric-value">${round(uv, 1)}</div>
      <div class="metric-foot">${uvLabel(uv)}</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">Visibility</span>${ICON.eye}</div>
      <div class="metric-value">${vis != null ? round(vis, 1) : "--"}<span class="metric-unit">km</span></div>
      <div class="metric-foot">${vis != null && vis > 10 ? "Crystal clear" : "Reduced range"}</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">Cloud Cover</span>${ICON.cloud}</div>
      <div class="metric-value">${current.cloud_cover}<span class="metric-unit">%</span></div>
      <div class="metric-foot">${current.cloud_cover < 30 ? "Mostly open sky" : current.cloud_cover < 70 ? "Partly veiled" : "Fully overcast"}</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">Moon Phase</span>${ICON.moon}</div>
      <div class="moon-vis">${moonSvg(phase)}</div>
      <div class="metric-foot">${moonPhaseName(phase)}</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-top"><span class="metric-label">Air Quality</span>${ICON.leaf}</div>
      <div class="metric-value" style="color:${aq.color}">${aqiVal ?? "--"}</div>
      <div class="aqi-meter">
        <div class="aqi-bar-track"><div class="aqi-bar-fill" style="width:${Math.min(100, (aqiVal || 0) / 3)}%;background:${aq.color}"></div></div>
        <span class="aqi-chip" style="background:${aq.color}22;color:${aq.color}">${aq.label}</span>
      </div>
    </div>
  `;
}

function uvLabel(uv) {
  if (uv < 3) return "Low exposure";
  if (uv < 6) return "Moderate exposure";
  if (uv < 8) return "High exposure";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function sunArcProgress(sunriseIso, sunsetIso) {
  const now = Date.now();
  const sr = new Date(sunriseIso).getTime();
  const ss = new Date(sunsetIso).getTime();
  if (now <= sr) return 0;
  if (now >= ss) return 1;
  return (now - sr) / (ss - sr);
}

function sunArcSvg(progress) {
  const w = 260, h = 64;
  // r must stay small enough that the apex (cy - r) doesn't go negative —
  // the svg uses overflow:visible so anything above y=0 draws outside the
  // wrap and overlaps the "SUNRISE & SUNSET" label sitting above it.
  const cx = w / 2, cy = h + 6, r = 58;
  const angle = Math.PI - progress * Math.PI;
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy - r * Math.sin(angle);
  const startX = cx - r, endX = cx + r;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <path class="sun-arc-track" d="M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}" />
    <path class="sun-arc-fill" d="M ${startX} ${cy} A ${r} ${r} 0 0 1 ${dotX} ${dotY}" />
    <circle class="sun-arc-dot" cx="${dotX}" cy="${dotY}" r="5" />
  </svg>`;
}

function compassSvg(deg) {
  return `<svg viewBox="0 0 58 58">
    <circle cx="29" cy="29" r="26" fill="none" stroke="var(--border-hairline)" stroke-width="2"/>
    <text x="29" y="10" text-anchor="middle" font-size="7" fill="var(--text-muted)" font-family="JetBrains Mono">N</text>
    <g class="compass-needle" style="transform: rotate(${deg}deg)">
      <line x1="29" y1="29" x2="29" y2="10" stroke="var(--accent-1)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="29" y1="29" x2="29" y2="44" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/>
    </g>
    <circle cx="29" cy="29" r="2.5" fill="var(--text-primary)"/>
  </svg>`;
}

function moonSvg(phase) {
  const offset = (phase <= 0.5 ? phase : 1 - phase) * 4 - 2;
  const dir = phase <= 0.5 ? 1 : -1;
  return `<div class="moon-shadow" style="transform: translateX(${offset * 20 * dir}px) scale(1.02)"></div>`;
}

/* ---------------- Quote strip ---------------- */

export function renderQuote(scene) {
  const [text, cite] = quoteFor(scene);
  $("#quote-text").textContent = `"${text}"`;
  $("#quote-cite").textContent = `— ${cite}`;
}

/* ---------------- Search panel ---------------- */

export function renderSearchPanel({ results, recent, popular, query }) {
  const panel = $("#search-panel");
  if (query && query.length >= 2) {
    if (!results.length) {
      panel.innerHTML = `<div class="search-empty">No cities found for “${escapeHtml(query)}”.</div>`;
      return;
    }
    panel.innerHTML = `<h4>Results</h4>` + results.map(placeItem).join("");
    return;
  }
  let html = "";
  if (recent.length) html += `<h4>Recent</h4>` + recent.map(placeItem).join("");
  html += `<h4>Popular Cities</h4>` + popular.map(placeItem).join("");
  panel.innerHTML = html;
}

function placeItem(p) {
  return `<div class="search-item" data-ripple data-lat="${p.latitude}" data-lon="${p.longitude}" data-name="${escapeHtml(p.name)}" data-country="${escapeHtml(p.country || "")}" data-admin1="${escapeHtml(p.admin1 || "")}" tabindex="0">
    <span class="si-icon">${ICON.pin}</span>
    <span class="si-main">${escapeHtml(p.name)}<span class="si-sub"> ${[p.admin1, p.country].filter(Boolean).map(escapeHtml).join(", ")}</span></span>
  </div>`;
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------------- Toasts ---------------- */

export function showToast(title, msg) {
  const root = $("#toast-root");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <span class="toast-icon">${ICON.alert}</span>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(msg)}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss">${ICON.x}</button>
  `;
  root.appendChild(el);
  const kill = () => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 260);
  };
  el.querySelector(".toast-close").addEventListener("click", kill);
  const timer = setTimeout(kill, 6000);
  el.addEventListener("pointerenter", () => clearTimeout(timer));
}

/* ---------------- Skeletons ---------------- */

export function showSkeletons() {
  $("#hourly-rail").innerHTML = Array.from({ length: 8 }).map(() =>
    `<div class="hour-card skeleton card-skel-h"></div>`
  ).join("");
  $("#day-grid").innerHTML = Array.from({ length: 7 }).map(() =>
    `<div class="day-card skeleton day-skel"></div>`
  ).join("");
  $("#bento-grid").innerHTML = Array.from({ length: 8 }).map((_, i) =>
    `<div class="metric-card skeleton ${i === 0 ? "big" : ""}" style="min-height:150px"></div>`
  ).join("");
}

/* ---------------- Theme ---------------- */

export function applyTheme() {
  document.documentElement.setAttribute("data-theme", "dark");
}

export function applyWeatherScene(scene) {
  document.documentElement.dataset.weather = scene;
}
