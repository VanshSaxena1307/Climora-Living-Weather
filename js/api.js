/* ============================================================
   CLIMORA — Open-Meteo API Layer
   No API key required. Everything resolves through
   coordinates: city name -> geocode -> forecast.
   ============================================================ */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const REVERSE_URL = "https://geocoding-api.open-meteo.com/v1/reverse";

class ApiError extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind; // "network" | "not-found" | "server"
  }
}

async function safeFetchJson(url, kind = "server") {
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new ApiError("Could not reach the weather service.", "network");
  }
  if (!res.ok) throw new ApiError(`Service responded with ${res.status}.`, kind);
  return res.json();
}

/** Search for cities by name. Returns a normalized array of place objects. */
export async function searchCities(query, count = 6) {
  if (!query || !query.trim()) return [];
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query.trim())}&count=${count}&language=en&format=json`;
  const data = await safeFetchJson(url, "not-found");
  return (data.results || []).map(normalizePlace);
}

/** Reverse-geocode coordinates into a readable place (best effort). */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `${REVERSE_URL}?latitude=${lat}&longitude=${lon}&language=en&format=json`;
    const data = await safeFetchJson(url);
    const r = (data.results || [])[0];
    if (r) return normalizePlace(r);
  } catch { /* fall through to a coordinate-only label */ }
  return { name: "My Location", country: "", admin1: "", latitude: lat, longitude: lon };
}

function normalizePlace(r) {
  return {
    name: r.name,
    country: r.country || "",
    admin1: r.admin1 || "",
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  };
}

/** Fetch the full weather payload (current + hourly + daily) for a place. */
export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m", "relative_humidity_2m", "apparent_temperature",
      "is_day", "precipitation", "weather_code", "cloud_cover",
      "pressure_msl", "wind_speed_10m", "wind_direction_10m",
    ].join(","),
    hourly: [
      "temperature_2m", "precipitation_probability", "weather_code",
      "wind_speed_10m", "relative_humidity_2m", "pressure_msl",
      "visibility", "dew_point_2m", "uv_index",
    ].join(","),
    daily: [
      "weather_code", "temperature_2m_max", "temperature_2m_min",
      "precipitation_probability_max", "wind_speed_10m_max",
      "sunrise", "sunset", "uv_index_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "8",
  });
  const url = `${FORECAST_URL}?${params.toString()}`;
  return safeFetchJson(url, "server");
}

/** Fetch current US AQI (best effort — failures should not block the UI). */
export async function fetchAirQuality(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat, longitude: lon, current: "us_aqi,pm2_5", timezone: "auto",
    });
    const data = await safeFetchJson(`${AQI_URL}?${params.toString()}`);
    return data.current || null;
  } catch {
    return null;
  }
}

export { ApiError };
