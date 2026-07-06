# Climora — Living Weather

# Live Demo Link:
  `https://climora-living-weather.vercel.app/`

A cinematic, single-page weather experience built with nothing but handcrafted HTML, CSS and vanilla JavaScript. No frameworks, no build step — open `index.html` and it runs.

## What makes it different

Climora's signature is the **Living Sky**: a full-viewport canvas that continuously repaints itself to match the real current weather — drifting clouds, falling rain or snow, flickering lightning, twinkling stars and aurora at night, sun rays by day. The whole interface (icons, glows, gradients, chart colors) is re-tinted from that same live condition through a small set of CSS custom properties, so the product feels like one living object rather than a static dashboard with a weather widget bolted on.

## Features

- **Live hero** — animated temperature counter, live clock and date, current conditions, feels-like, today's high/low.
- **Dynamic atmosphere** — seven distinct sky scenes (clear day, clear night, cloudy, rain, thunderstorm, snow, fog), each with its own particle system, palette and accent color.
- **24-hour rail** — horizontally snapping hourly forecast with icons, rain chance and wind.
- **7-day forecast** — cards with an inline min/max range bar, expand on hover.
- **Right Now bento grid** — humidity, dew point, wind + compass, pressure, UV index, visibility, cloud cover, moon phase (calculated locally), and live air quality (Open-Meteo Air Quality API).
- **Analytics** — Chart.js line/bar charts for temperature, rain probability, humidity, wind and pressure, themed to match the current accent color.
- **Search** — debounced city search via Open-Meteo Geocoding, keyboard navigation, recent searches and popular cities, all persisted in `localStorage`.
- **Geolocation** — "Use my location" with graceful, non-blocking permission-denied handling.
- **Theme system** — Light / Dark / Auto (follows OS), persisted and animated.
- **°C / °F toggle**, persisted.
- **Elegant error handling** — no `alert()`; animated toast cards for network failures, unknown cities and permission issues, plus an offline empty state.
- **Skeleton loading** — shimmer placeholders instead of spinners.
- **Extreme weather notices** — thunderstorm, high wind and extreme UV toasts.
- **Weather-based quotes** — a short storytelling strip that changes with the sky.
- **Share / download** — export the current conditions as a PNG weather card, or share it natively where supported.
- **Micro-interactions** — magnetic buttons, ripple clicks, cursor glow, scroll-reveal, scroll progress bar.
- **Fully responsive** — the mobile layout moves search + actions into a bottom bar rather than just shrinking the desktop grid.

## Data source

All weather data comes from the free [Open-Meteo](https://open-meteo.com/) API — no API key required:

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast: `https://api.open-meteo.com/v1/forecast`
- Air quality: `https://air-quality-api.open-meteo.com/v1/air-quality`

## Running it

Just open `index.html` in a browser. For geolocation to work in most browsers you'll want to serve it over `http://localhost` or `https://` rather than `file://`, e.g.:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Project structure

```
climora-app/
├── index.html
├── css/
│   ├── themes.css        design tokens: color, type, weather accents
│   ├── style.css         layout & components
│   ├── animations.css    keyframes & transitions
│   └── responsive.css    tablet/mobile redesigns
├── js/
│   ├── app.js            orchestrator: state, events, data flow
│   ├── api.js            Open-Meteo geocoding/forecast/air-quality
│   ├── ui.js             DOM rendering
│   ├── weatherCodes.js   WMO code → description/icon/scene map
│   ├── charts.js         Chart.js analytics
│   ├── storage.js        localStorage (theme, unit, recents)
│   ├── animations.js     Living Sky canvas engine + micro-interactions
│   └── utils.js          formatting, icons, small math helpers
└── README.md
```

## Notes

- Moon phase is computed locally from a synodic-month approximation — no extra API call.
- `prefers-reduced-motion` is respected: the sky renders a single static frame and CSS animations are disabled.
