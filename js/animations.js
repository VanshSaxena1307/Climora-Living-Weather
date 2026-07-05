/* ============================================================
   CLIMORA — Living Sky Engine & Micro-interactions
   The single signature element: a canvas atmosphere that
   continuously re-renders itself to match the real sky.
   ============================================================ */

const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class LivingSky {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.scene = "clear-day";
    this.particles = [];
    this.t = 0;
    this.flash = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._resize();
    window.addEventListener("resize", () => this._resize());
    this._raf = null;
  }

  _resize() {
    const { canvas } = this;
    this.w = canvas.clientWidth;
    this.h = canvas.clientHeight;
    canvas.width = this.w * this.dpr;
    canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setScene(scene) {
    if (this.scene === scene && this.particles.length) return;
    this.scene = scene;
    this._seed();
  }

  _seed() {
    const n = (count, factory) => Array.from({ length: count }, factory);
    const { w, h } = this;
    switch (this.scene) {
      case "clear-day":
        this.particles = n(26, () => ({
          x: Math.random() * w, y: Math.random() * h * 0.9,
          r: Math.random() * 1.6 + 0.6, s: Math.random() * 0.25 + 0.05,
          o: Math.random() * 0.5 + 0.15,
        }));
        break;
      case "clear-night":
        this.particles = n(90, () => ({
          x: Math.random() * w, y: Math.random() * h * 0.75,
          r: Math.random() * 1.3 + 0.3, tw: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.01,
        }));
        this.shooting = null;
        this.nextShoot = 120 + Math.random() * 240;
        break;
      case "cloudy":
        this.particles = n(6, (_, i) => ({
          x: Math.random() * w, y: h * (0.12 + i * 0.09),
          scale: Math.random() * 0.6 + 0.7, speed: Math.random() * 0.15 + 0.05,
          o: Math.random() * 0.25 + 0.35,
        }));
        break;
      case "rain":
        this.particles = n(140, () => ({
          x: Math.random() * w, y: Math.random() * h,
          len: Math.random() * 14 + 10, speed: Math.random() * 4 + 6,
          o: Math.random() * 0.4 + 0.25,
        }));
        break;
      case "thunder":
        this.particles = n(110, () => ({
          x: Math.random() * w, y: Math.random() * h,
          len: Math.random() * 16 + 10, speed: Math.random() * 5 + 7,
          o: Math.random() * 0.4 + 0.2,
        }));
        this.nextFlash = 90 + Math.random() * 220;
        break;
      case "snow":
        this.particles = n(90, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 2.4 + 1, speed: Math.random() * 0.8 + 0.4,
          drift: Math.random() * 1 - 0.5, sway: Math.random() * Math.PI * 2,
        }));
        break;
      case "fog":
        this.particles = n(5, (_, i) => ({
          y: h * (0.2 + i * 0.16), speed: Math.random() * 0.2 + 0.06,
          o: Math.random() * 0.15 + 0.08, x: Math.random() * w,
        }));
        break;
      default:
        this.particles = [];
    }
  }

  start() {
    if (this._raf) return;
    const loop = () => {
      this.t += 1;
      this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    if (REDUCE_MOTION) { this._draw(); return; }
    loop();
  }

  stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }

  _bgGradient() {
    const { ctx, w, h, scene } = this;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    const stops = {
      "clear-day":   ["#2a6fb0", "#6fb3d9", "#f2c987"],
      "clear-night": ["#03040a", "#0b0e22", "#161135"],
      cloudy:        ["#3a4453", "#5c6577", "#7c8496"],
      rain:          ["#111a24", "#1d2c3a", "#324a5c"],
      thunder:       ["#0c0a14", "#1c1428", "#2a1f3d"],
      snow:          ["#3c4a5c", "#7c93a8", "#c9dced"],
      fog:           ["#4b5460", "#6b7482", "#8a92a0"],
    }[scene] || ["#1a2230", "#2c3a4d", "#4a617a"];
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.55, stops[1]);
    g.addColorStop(1, stops[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  _draw() {
    const { ctx, w, h, scene } = this;
    ctx.clearRect(0, 0, w, h);
    this._bgGradient();

    switch (scene) {
      case "clear-day": this._drawSun(); this._drawDust(); break;
      case "clear-night": this._drawStars(); this._drawAurora(); break;
      case "cloudy": this._drawClouds(); break;
      case "rain": this._drawClouds(0.5); this._drawRain(); break;
      case "thunder": this._drawClouds(0.7); this._drawRain(); this._drawFlash(); break;
      case "snow": this._drawClouds(0.35); this._drawSnow(); break;
      case "fog": this._drawFog(); break;
    }

    // vignette for depth on every scene
    const vg = ctx.createRadialGradient(w * 0.5, h * 0.35, h * 0.2, w * 0.5, h * 0.5, h * 1.05);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  _drawSun() {
    const { ctx, w, h, t } = this;
    const cx = w * 0.78, cy = h * 0.28;
    const pulse = 1 + Math.sin(t * 0.02) * 0.03;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220 * pulse);
    glow.addColorStop(0, "rgba(255,230,180,0.85)");
    glow.addColorStop(0.4, "rgba(255,200,120,0.35)");
    glow.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.0015);
    ctx.strokeStyle = "rgba(255,244,214,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(46, 0);
      ctx.lineTo(70 * pulse, 0);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.fillStyle = "#fff6de";
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawDust() {
    const { ctx, particles, t } = this;
    particles.forEach((p) => {
      p.x -= p.s;
      if (p.x < -5) p.x = this.w + 5;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.o})`;
      ctx.arc(p.x, p.y + Math.sin(t * 0.01 + p.x) * 4, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  _drawStars() {
    const { ctx, particles, t } = this;
    particles.forEach((p) => {
      const tw = 0.5 + Math.sin(t * p.speed + p.tw) * 0.5;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.25 + tw * 0.7})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    const moonX = this.w * 0.76, moonY = this.h * 0.24;
    const mg = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 150);
    mg.addColorStop(0, "rgba(220,230,255,0.55)");
    mg.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.beginPath();
    ctx.fillStyle = "#eef1fb";
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();

    this.nextShoot -= 1;
    if (this.nextShoot <= 0 && !this.shooting) {
      this.shooting = { x: Math.random() * this.w * 0.6, y: Math.random() * this.h * 0.3, life: 40 };
      this.nextShoot = 200 + Math.random() * 300;
    }
    if (this.shooting) {
      const s = this.shooting;
      ctx.strokeStyle = `rgba(255,255,255,${s.life / 40})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - 70, s.y - 30);
      ctx.stroke();
      s.x += 6; s.y += 2.6; s.life -= 1.4;
      if (s.life <= 0) this.shooting = null;
    }
  }

  _drawAurora() {
    const { ctx, w, h, t } = this;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.15 + i * 20);
      for (let x = 0; x <= w; x += 20) {
        const y = h * (0.12 + i * 0.05) + Math.sin(x * 0.01 + t * 0.01 + i) * 30;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, 0); ctx.lineTo(0, 0); ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
      grad.addColorStop(0, `rgba(110,255,190,${0.05 + i * 0.02})`);
      grad.addColorStop(1, "rgba(110,255,190,0)");
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  _drawClouds(darken = 0) {
    const { ctx, particles, t } = this;
    particles.forEach((p) => {
      p.x -= p.speed;
      if (p.x < -260) p.x = this.w + 260;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.scale, p.scale);
      ctx.globalAlpha = p.o * (1 - darken * 0.3);
      ctx.fillStyle = darken ? "rgba(30,36,46,0.9)" : "rgba(255,255,255,0.9)";
      _cloudPuff(ctx);
      ctx.restore();
    });
  }

  _drawRain() {
    const { ctx, particles, h } = this;
    ctx.strokeStyle = "rgba(200,225,240,0.5)";
    ctx.lineWidth = 1.4;
    particles.forEach((p) => {
      p.y += p.speed;
      p.x -= p.speed * 0.25;
      if (p.y > h) { p.y = -20; p.x = Math.random() * this.w; }
      ctx.globalAlpha = p.o;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.len * 0.25, p.y + p.len);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  _drawFlash() {
    this.nextFlash -= 1;
    if (this.nextFlash <= 0 && this.flash <= 0) {
      this.flash = 10;
      this.nextFlash = 140 + Math.random() * 260;
    }
    if (this.flash > 0) {
      this.ctx.fillStyle = `rgba(220,225,255,${this.flash / 22})`;
      this.ctx.fillRect(0, 0, this.w, this.h);
      this.flash -= 1;
    }
  }

  _drawSnow() {
    const { ctx, particles, h, t } = this;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    particles.forEach((p) => {
      p.y += p.speed;
      p.sway += 0.02;
      p.x += Math.sin(p.sway) * 0.4 + p.drift * 0.1;
      if (p.y > h) { p.y = -10; p.x = Math.random() * this.w; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  _drawFog() {
    const { ctx, particles, w } = this;
    particles.forEach((p) => {
      p.x -= p.speed;
      if (p.x < -w) p.x = w;
      const grad = ctx.createLinearGradient(p.x, 0, p.x + w * 1.4, 0);
      grad.addColorStop(0, `rgba(255,255,255,0)`);
      grad.addColorStop(0.5, `rgba(255,255,255,${p.o})`);
      grad.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(p.x - w, p.y - 20, w * 2.4, 60);
    });
  }
}

function _cloudPuff(ctx) {
  ctx.beginPath();
  ctx.arc(0, 0, 34, Math.PI * 0.5, Math.PI * 1.5);
  ctx.arc(30, -28, 26, Math.PI, Math.PI * 1.85);
  ctx.arc(64, -14, 30, Math.PI * 1.2, Math.PI * 0.5, true);
  ctx.arc(30, 10, 34, 0, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();
}

/* ---------------- Shared micro-interactions ---------------- */

export function initScrollProgress(bar) {
  const onScroll = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = `${clampPct(pct)}%`;
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
function clampPct(v) { return Math.min(100, Math.max(0, v)); }

export function initCursorGlow(el) {
  if (window.matchMedia("(pointer: coarse)").matches) { el.style.display = "none"; return; }
  window.addEventListener("pointermove", (e) => {
    el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    el.style.opacity = "1";
  });
  window.addEventListener("pointerleave", () => { el.style.opacity = "0"; });
}

export function initRipple(container) {
  container.addEventListener("pointerdown", (e) => {
    const target = e.target.closest("[data-ripple]");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.4;
    const span = document.createElement("span");
    span.className = "ripple-el";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    target.style.position = target.style.position || "relative";
    target.style.overflow = "hidden";
    target.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  });
}

export function initMagnetic(selector, strength = 10) {
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / r.width;
      const y = (e.clientY - r.top - r.height / 2) / r.height;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

export function initReveal(selector, rootMargin = "0px 0px -10% 0px") {
  const els = document.querySelectorAll(selector);
  if (!("IntersectionObserver" in window) || REDUCE_MOTION) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("in-view"), i * 40);
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin, threshold: 0.1 }
  );
  els.forEach((el) => io.observe(el));
}
