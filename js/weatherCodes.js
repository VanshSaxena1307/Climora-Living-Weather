/* ============================================================
   CLIMORA — WMO Weather Code Dictionary
   Maps Open-Meteo's weather_code to description, icon key,
   and a broad "condition group" used to drive the Living Sky.
   ============================================================ */

export const WMO = {
  0:  { desc: "Clear sky",            icon: "sun",        group: "clear" },
  1:  { desc: "Mostly clear",         icon: "sun-cloud",  group: "clear" },
  2:  { desc: "Partly cloudy",        icon: "sun-cloud",  group: "cloudy" },
  3:  { desc: "Overcast",             icon: "cloud",      group: "cloudy" },
  45: { desc: "Fog",                  icon: "fog",        group: "fog" },
  48: { desc: "Rime fog",             icon: "fog",        group: "fog" },
  51: { desc: "Light drizzle",        icon: "drizzle",    group: "rain" },
  53: { desc: "Drizzle",              icon: "drizzle",    group: "rain" },
  55: { desc: "Dense drizzle",        icon: "drizzle",    group: "rain" },
  56: { desc: "Freezing drizzle",     icon: "drizzle",    group: "rain" },
  57: { desc: "Dense freezing drizzle", icon: "drizzle",  group: "rain" },
  61: { desc: "Light rain",           icon: "rain",       group: "rain" },
  63: { desc: "Rain",                 icon: "rain",       group: "rain" },
  65: { desc: "Heavy rain",           icon: "rain",       group: "rain" },
  66: { desc: "Freezing rain",        icon: "rain",       group: "rain" },
  67: { desc: "Heavy freezing rain",  icon: "rain",       group: "rain" },
  71: { desc: "Light snow",           icon: "snow",       group: "snow" },
  73: { desc: "Snow",                 icon: "snow",       group: "snow" },
  75: { desc: "Heavy snow",           icon: "snow",       group: "snow" },
  77: { desc: "Snow grains",          icon: "snow",       group: "snow" },
  80: { desc: "Light showers",        icon: "rain",       group: "rain" },
  81: { desc: "Showers",              icon: "rain",       group: "rain" },
  82: { desc: "Violent showers",      icon: "rain",       group: "rain" },
  85: { desc: "Snow showers",         icon: "snow",       group: "snow" },
  86: { desc: "Heavy snow showers",   icon: "snow",       group: "snow" },
  95: { desc: "Thunderstorm",         icon: "storm",      group: "thunder" },
  96: { desc: "Thunderstorm + hail",  icon: "storm",      group: "thunder" },
  99: { desc: "Severe thunderstorm",  icon: "storm",      group: "thunder" },
};

export function describeCode(code) {
  return WMO[code] || { desc: "Unknown", icon: "cloud", group: "cloudy" };
}

/** Resolve the "living sky" scene key from a WMO code + day/night flag. */
export function sceneFor(code, isDay) {
  const g = describeCode(code).group;
  if (g === "clear" && !isDay) return "clear-night";
  if (g === "clear") return "clear-day";
  if (g === "cloudy") return "cloudy";
  if (g === "rain") return "rain";
  if (g === "thunder") return "thunder";
  if (g === "snow") return "snow";
  if (g === "fog") return "fog";
  return isDay ? "clear-day" : "clear-night";
}

/** Small quote bank, keyed by scene, for the storytelling strip. */
export const WEATHER_QUOTES = {
  "clear-day": [
    ["Sunshine is a language everyone understands, spoken best on a clear afternoon.", "Old proverb"],
    ["Wherever you go, no matter what the weather, always bring your own sunshine.", "Anthony J. D'Angelo"],
  ],
  "clear-night": [
    ["The night sky is a map of everything that has ever burned.", "Anon."],
    ["Look up. The stars keep their own clock, and it never runs late.", "Climora"],
  ],
  cloudy: [
    ["Clouds come floating into my life, no longer to carry rain, but to add color to my sunset sky.", "Rabindranath Tagore"],
    ["Even the greyest sky is only ever one gust away from blue.", "Climora"],
  ],
  rain: [
    ["Some people feel the rain, others just get wet.", "Bob Marley"],
    ["The rain, it always seemed to me, is nature's tears of joy.", "Douglas Coupland"],
  ],
  thunder: [
    ["Thunder is good, thunder is impressive, but it is lightning that does the work.", "Mark Twain"],
    ["Storms make trees take deeper roots.", "Dolly Parton"],
  ],
  snow: [
    ["Snow flurries began to fall, and they say winter here in New York is cold.", "Frank Sinatra"],
    ["Every snowflake falls in exactly the right place.", "Zen proverb"],
  ],
  fog: [
    ["The fog comes on little cat feet, sits looking over harbor and city, and moves on.", "Carl Sandburg"],
  ],
};

export function quoteFor(scene) {
  const bank = WEATHER_QUOTES[scene] || WEATHER_QUOTES["clear-day"];
  return bank[Math.floor(Math.random() * bank.length)];
}
