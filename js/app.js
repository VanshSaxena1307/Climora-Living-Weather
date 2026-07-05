/* ============================================================
   CLIMORA — App Orchestrator
   ============================================================ */

import { searchCities, reverseGeocode, fetchWeather, fetchAirQuality, ApiError } from "./api.js";
import { Store, POPULAR_CITIES } from "./storage.js";
import { LivingSky, initScrollProgress, initCursorGlow, initRipple, initMagnetic, initReveal } from "./animations.js";
import { sceneFor, describeCode } from "./weatherCodes.js";
import * as UI from "./ui.js";
import { debounce } from "./utils.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  place: null,
  weather: null,
  aqi: null,
  unit: Store.getUnit(),
  scene: "clear-day",
  loading: false,
};

let sky;

/* ---------------- Boot ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  sky = new LivingSky($("#sky-canvas"));
  sky.start();

  UI.applyTheme(); // Climora is dark-only now — no user toggle.
  updateUnitButton();

  initScrollProgress($("#scroll-progress"));
  initCursorGlow($("#cursor-glow"));
  initRipple(document.body);
  initMagnetic(".icon-btn, .search-go");
  setInterval(UI.tickClock, 1000 * 30);
  UI.tickClock();

  wireTopbar();
  wireSearch();
  wireFooterActions();

  // Safety net: never let the boot screen hang forever if a network call
  // stalls. If nothing has rendered within 6s, dismiss the loader and show
  // whatever we have (or the empty state) rather than blocking the UI.
  setTimeout(() => {
    const loader = $("#app-loading");
    if (loader && !loader.classList.contains("hidden")) {
      loader.classList.add("hidden");
      if (!state.weather) showEmptyState();
    }
  }, 6000);

  const last = Store.getLastPlace();
  if (last) {
    loadPlace(last, { silent: true });
  } else {
    tryGeolocation({ fallbackToDefault: true });
  }
});

/* ---------------- Core data flow ---------------- */

async function loadPlace(place, { silent = false } = {}) {
  if (state.loading) return;
  state.loading = true;
  UI.showSkeletons();
  try {
    const [weather, aqi] = await Promise.all([
      fetchWeather(place.latitude, place.longitude),
      fetchAirQuality(place.latitude, place.longitude),
    ]);
    state.place = place;
    state.weather = weather;
    state.aqi = aqi;
    Store.setLastPlace(place);
    Store.addRecent(place);
    render();
  } catch (err) {
    handleError(err, silent);
  } finally {
    state.loading = false;
  }
}

function render() {
  const { place, weather, aqi, unit } = state;
  const current = weather.current;
  const daily = weather.daily;
  const hourly = weather.hourly;

  const scene = sceneFor(current.weather_code, current.is_day === 1);
  state.scene = scene;
  UI.applyWeatherScene(scene);
  sky.setScene(scene);

  UI.renderHero({ place, current, daily }, unit);
  UI.renderHourly(hourly, unit, current.is_day === 1);
  UI.renderDaily(daily, unit);
  UI.renderBento({ current, daily, hourly, aqi }, unit);
  UI.renderQuote(scene);

  initReveal(".hour-card, .day-card, .metric-card, blockquote");
  checkExtremeWeather(current, daily);

  const loader = $("#app-loading");
  if (loader && !loader.classList.contains("hidden")) loader.classList.add("hidden");
}

function checkExtremeWeather(current, daily) {
  const info = describeCode(current.weather_code);
  if (info.group === "thunder") {
    UI.showToast("Thunderstorm nearby", "Lightning activity detected in the forecast. Stay indoors if possible.");
  } else if (current.wind_speed_10m >= 50) {
    UI.showToast("High wind advisory", `Sustained winds of ${Math.round(current.wind_speed_10m)} km/h reported.`);
  } else if (daily.uv_index_max[0] >= 9) {
    UI.showToast("Extreme UV today", "UV index is very high — sun protection is strongly advised.");
  }
}

function handleError(err, silent) {
  console.error(err);

  // Never leave the boot screen stuck: if we still have no data at all,
  // drop it and try one fallback city before giving up.
  const loader = $("#app-loading");
  if (!state.weather && loader && !loader.classList.contains("hidden")) {
    loader.classList.add("hidden");
    if (!state.fallbackAttempted) {
      state.fallbackAttempted = true;
      loadPlace(POPULAR_CITIES[0], { silent: true });
    } else {
      showEmptyState();
    }
  }

  if (silent) return;
  if (err instanceof ApiError && err.kind === "network") {
    UI.showToast("Connection issue", "Climora can't reach the weather service right now. Check your connection.");
  } else if (err instanceof ApiError && err.kind === "not-found") {
    UI.showToast("City not found", "Try a different spelling or a nearby larger city.");
  } else {
    UI.showToast("Something went wrong", "The forecast couldn't be loaded. Please try again.");
  }
}

function showEmptyState() {
  const html = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
      <h3>Climora can't reach the sky right now</h3>
      <p>Check your connection and search for a city above, or try "Use my location" again.</p>
    </div>`;
  $("#hourly-rail").innerHTML = html;
  $("#day-grid").innerHTML = "";
  $("#bento-grid").innerHTML = "";
  UI.showToast("Offline", "Climora couldn't load any forecast data.");
}

/* ---------------- Geolocation ---------------- */

function tryGeolocation({ fallbackToDefault = false } = {}) {
  if (!("geolocation" in navigator)) {
    if (fallbackToDefault) loadPlace(POPULAR_CITIES[0]);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const place = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      loadPlace(place);
    },
    () => {
      if (fallbackToDefault) {
        UI.showToast("Location unavailable", "Showing New York instead — search any city above.");
        loadPlace(POPULAR_CITIES[0]);
      } else {
        UI.showToast("Permission denied", "Enable location access, or search for a city instead.");
      }
    },
    { timeout: 5000, maximumAge: 5 * 60 * 1000 }
  );
}

/* ---------------- Topbar: theme + locate + unit ---------------- */

function wireTopbar() {
  $("#locate-btn").addEventListener("click", () => tryGeolocation({}));

  $("#unit-btn").addEventListener("click", () => {
    state.unit = state.unit === "C" ? "F" : "C";
    Store.setUnit(state.unit);
    updateUnitButton();
    if (state.weather) render();
  });
}

function updateUnitButton() {
  $("#unit-btn").textContent = state.unit === "C" ? "°C" : "°F";
}

/* ---------------- Search ---------------- */

function wireSearch() {
  const input = $("#search-input");
  const panel = $("#search-panel");
  const form = $("#search-form");

  const openPanel = () => panel.classList.add("open");
  const closePanel = () => panel.classList.remove("open");

  const runSearch = debounce(async (q) => {
    if (q.length < 2) {
      UI.renderSearchPanel({ results: [], recent: Store.getRecent(), popular: POPULAR_CITIES, query: "" });
      return;
    }
    try {
      const results = await searchCities(q);
      UI.renderSearchPanel({ results, recent: [], popular: [], query: q });
    } catch {
      UI.renderSearchPanel({ results: [], recent: [], popular: [], query: q });
    }
  }, 320);

  input.addEventListener("focus", () => {
    if (!input.value) UI.renderSearchPanel({ results: [], recent: Store.getRecent(), popular: POPULAR_CITIES, query: "" });
    openPanel();
  });
  input.addEventListener("input", () => runSearch(input.value.trim()));
  input.addEventListener("keydown", (e) => handleSearchKeys(e, panel, input));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const first = $(".search-item", panel);
    if (first) selectPlaceFromEl(first);
  });

  panel.addEventListener("click", (e) => {
    const item = e.target.closest(".search-item");
    if (item) selectPlaceFromEl(item);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-shell")) closePanel();
  });

  function selectPlaceFromEl(el) {
    const place = {
      name: el.dataset.name,
      country: el.dataset.country,
      admin1: el.dataset.admin1,
      latitude: parseFloat(el.dataset.lat),
      longitude: parseFloat(el.dataset.lon),
    };
    input.value = "";
    closePanel();
    loadPlace(place);
  }
}

function handleSearchKeys(e, panel, input) {
  const items = $$(".search-item", panel);
  if (!items.length) return;
  let idx = items.findIndex((i) => i.classList.contains("kb-active"));
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (idx >= 0) items[idx].classList.remove("kb-active");
    idx = (idx + 1) % items.length;
    items[idx].classList.add("kb-active");
    items[idx].scrollIntoView({ block: "nearest" });
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (idx >= 0) items[idx].classList.remove("kb-active");
    idx = (idx - 1 + items.length) % items.length;
    items[idx].classList.add("kb-active");
    items[idx].scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter" && idx >= 0) {
    e.preventDefault();
    items[idx].click();
  } else if (e.key === "Escape") {
    input.blur();
    panel.classList.remove("open");
  }
}

/* ---------------- Footer: share / download ---------------- */

function wireFooterActions() {
  $("#download-btn").addEventListener("click", downloadWeatherCard);
  $("#share-btn").addEventListener("click", shareWeatherCard);
}

function buildCardCanvas() {
  const { place, weather, unit } = state;
  if (!weather) return null;
  const current = weather.current;
  const info = describeCode(current.weather_code);
  const canvas = document.createElement("canvas");
  canvas.width = 720; canvas.height = 900;
  const ctx = canvas.getContext("2d");

  const scene = state.scene;
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  const colors = {
    "clear-day": ["#2a6fb0", "#f2c987"], "clear-night": ["#03040a", "#161135"],
    cloudy: ["#3a4453", "#7c8496"], rain: ["#111a24", "#324a5c"],
    thunder: ["#0c0a14", "#2a1f3d"], snow: ["#3c4a5c", "#c9dced"], fog: ["#4b5460", "#8a92a0"],
  }[scene] || ["#1a2230", "#4a617a"];
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "600 28px sans-serif";
  ctx.fillText("CLIMORA", 50, 70);

  ctx.font = "300 180px serif";
  ctx.fillText(`${Math.round(unit === "F" ? current.temperature_2m * 9 / 5 + 32 : current.temperature_2m)}°`, 50, 330);

  ctx.font = "600 40px sans-serif";
  ctx.fillText(place.name, 50, 410);
  ctx.font = "400 24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText([place.admin1, place.country].filter(Boolean).join(", "), 50, 448);

  ctx.font = "500 30px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(info.desc, 50, 500);

  ctx.font = "400 20px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText(new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }), 50, 540);

  ctx.font = "400 18px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("climora — living weather", 50, 850);

  return canvas;
}

function downloadWeatherCard() {
  const canvas = buildCardCanvas();
  if (!canvas) { UI.showToast("Nothing to export", "Load a city's weather first."); return; }
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `climora-${state.place.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function shareWeatherCard() {
  const canvas = buildCardCanvas();
  if (!canvas) { UI.showToast("Nothing to share", "Load a city's weather first."); return; }
  canvas.toBlob(async (blob) => {
    const file = new File([blob], "climora-weather.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Climora Weather", text: `Weather in ${state.place.name}` });
      } catch { /* user cancelled */ }
    } else {
      downloadWeatherCard();
      UI.showToast("Saved instead", "Native sharing isn't available here, so the card was downloaded.");
    }
  });
}
