/* =====================================================================
   Places I've lived — edit this list to update the map and timeline.
   flags: two-letter country codes matching files in assets/flags/
   ===================================================================== */
const PLACES = [
  { city: "Bern", country: "Switzerland", flags: ["ch"], years: "2008 – 2010", lat: 46.948, lon: 7.447 },
  { city: "Montpellier", country: "France", flags: ["fr"], years: "2011 – 2018", lat: 43.611, lon: 3.877 },
  { city: "Sydney", country: "Australia", flags: ["au"], years: "2019 – 2020", lat: -33.869, lon: 151.209 },
  { city: "Montpellier & Baiersbronn", country: "France & Germany", flags: ["fr", "de"], years: "2021 – 2026",
    note: "Two-thirds of the year in Montpellier, one-third in the Black Forest", lat: 43.611, lon: 3.877,
    also: { lat: 48.503, lon: 8.372 } },
  { city: "Montreal", country: "Canada", flags: ["ca"], years: "2026 – today", lat: 45.502, lon: -73.567 },
];

(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme toggle (remembers the choice when the browser allows it) ---------- */
  try { const saved = localStorage.getItem("theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}
  const toggle = document.querySelector(".theme-toggle");
  const isDark = () => root.getAttribute("data-theme") === "dark" ||
    (!root.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const paintIcon = () => {
    if (!toggle) return;
    toggle.innerHTML = isDark()
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    toggle.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
  };
  if (toggle) {
    paintIcon();
    toggle.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paintIcon();
      window.dispatchEvent(new Event("themechange"));
    });
  }
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  /* ---------- copy email ---------- */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-copy");
      const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = "Copy"), 1600); };
      try {
        navigator.clipboard.writeText(text).then(done, () => selectText(btn.previousElementSibling));
      } catch (e) { selectText(btn.previousElementSibling); }
    });
  });
  function selectText(el) {
    if (!el) return;
    const r = document.createRange(); r.selectNodeContents(el);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* ---------- reveal on scroll: only elements below the first screen start hidden ---------- */
  if ("IntersectionObserver" in window && !reduceMotion) {
    const items = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); e.target.classList.remove("pre"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("pre"); io.observe(el); }
    });
  }

  /* ---------- hero: simulated GARCH(1,1) price paths ---------- */
  const hero = document.querySelector(".hero canvas");
  if (hero) {
    const ctx = hero.getContext("2d");
    let W = 0, H = 0, paths = [], start = 0, raf = 0, visible = true;
    const N = 6, STEPS = 420, DRAW_MS = 5200, HOLD_MS = 6000, FADE_MS = 1200;
    function randn() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    function gamma(k) { // Marsaglia–Tsang, shape k >= 1
      const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
      for (;;) { let x, v; do { x = randn(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random();
        if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; }
    }
    // Hansen (1994) skewed Student-t, standardized to mean 0 and variance 1
    function skewT(eta, lam) {
      const lg = (x) => { // log-gamma (Lanczos)
        const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
        x -= 1; let a = 0.99999999999980993; const t = x + 7.5; g.forEach((q, i) => { a += q / (x + i + 1); });
        return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
      };
      const c = Math.exp(lg((eta + 1) / 2) - lg(eta / 2)) / Math.sqrt(Math.PI * (eta - 2));
      const a = 4 * lam * c * (eta - 2) / (eta - 1), b = Math.sqrt(1 + 3 * lam * lam - a * a);
      const T = Math.abs(randn() / Math.sqrt(2 * gamma(eta / 2) / eta)) * Math.sqrt((eta - 2) / eta);
      const y = Math.random() < (1 - lam) / 2 ? -(1 - lam) * T : (1 + lam) * T;
      return (y - a) / b;
    }
    function simulate() {
      // AR(1)-GARCH(1,1) with skewed-t shocks, as estimated for Arafura Rare Earths (ASX: ARU), daily % returns, 2018-2025:
      // r_t = mu + phi r_{t-1} + e_t,  e_t = sigma_t z_t,  sigma^2_t = omega + alpha e^2_{t-1} + beta sigma^2_{t-1}
      const mu = -0.0254, phi = -0.1341, omega = 1.7468, alpha = 0.1284, beta = 0.807, eta = 4.4907, lam = 0.1593;
      paths = [];
      for (let k = 0; k < N; k++) {
        let s2 = omega / (1 - alpha - beta), e = 0, r = 0, lp = 0; const pts = [0];
        for (let t = 1; t < STEPS; t++) {
          s2 = omega + alpha * e * e + beta * s2;
          e = Math.sqrt(s2) * skewT(eta, lam);
          r = mu + phi * r + e;
          lp += r / 100;               // log price
          pts.push(lp);
        }
        paths.push(pts);
      }
      let lo = Infinity, hi = -Infinity;
      paths.forEach((pts) => pts.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));
      paths.forEach((pts, i) => { paths[i] = pts.map((v) => (v - lo) / (hi - lo || 1)); });
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      hero.width = W * dpr; hero.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(frac, alphaMul) {
      ctx.clearRect(0, 0, W, H);
      const ink = css("--path"), acc = css("--accent");
      const top = H * 0.14, span = H * 0.72, n = Math.max(2, Math.floor(STEPS * frac));
      paths.forEach((pts, i) => {
        ctx.beginPath();
        for (let t = 0; t < n; t++) { const x = (t / (STEPS - 1)) * W, y = top + (1 - pts[t]) * span; t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = i === 0 ? acc : ink;
        ctx.globalAlpha = (i === 0 ? 0.85 : 0.16) * alphaMul;
        ctx.lineWidth = i === 0 ? 1.6 : 1;
        ctx.stroke();
        if (i === 0 && frac < 1) { const x = ((n - 1) / (STEPS - 1)) * W, y = top + (1 - pts[n - 1]) * span; ctx.globalAlpha = alphaMul; ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
      });
      ctx.globalAlpha = 1;
    }
    function loop(ts) {
      if (!start) start = ts;
      const t = ts - start;
      if (t < DRAW_MS) draw(t / DRAW_MS, 1);
      else if (t < DRAW_MS + HOLD_MS) draw(1, 1);
      else if (t < DRAW_MS + HOLD_MS + FADE_MS) draw(1, 1 - (t - DRAW_MS - HOLD_MS) / FADE_MS);
      else { simulate(); start = ts; }
      raf = visible ? requestAnimationFrame(loop) : 0;
    }
    simulate(); resize();
    if (reduceMotion) draw(1, 1);
    else {
      raf = requestAnimationFrame(loop);
      if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => {
        visible = e.isIntersecting; if (visible && !raf) { start = 0; raf = requestAnimationFrame(loop); }
      }).observe(hero);
    }
    window.addEventListener("resize", () => { resize(); if (reduceMotion) draw(1, 1); });
    window.addEventListener("themechange", () => { if (reduceMotion) draw(1, 1); });
  }

  /* ---------- places: dotted world map with an animated route ---------- */
  const map = document.querySelector(".map");
  const list = document.querySelector(".timeline");
  if (map && list && window.WORLD_MASK) {
    const M = window.WORLD_MASK, VW = 1000, VH = Math.round(VW * (M.lat0 - M.lat1) / 360);
    const proj = (lat, lon) => [((lon - M.lon0) / 360) * VW, ((M.lat0 - lat) / (M.lat0 - M.lat1)) * VH];
    const bytes = Uint8Array.from(atob(M.data), (c) => c.charCodeAt(0));
    const canvas = map.querySelector("canvas"), dctx = canvas.getContext("2d");
    const svg = map.querySelector("svg"); svg.setAttribute("viewBox", `0 0 ${VW} ${VH}`);
    const NS = "http://www.w3.org/2000/svg";

    function drawDots() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dctx.clearRect(0, 0, w, h); dctx.fillStyle = css("--dot");
      const cw = w / M.cols, ch = h / M.rows, r = Math.max(0.6, Math.min(cw, ch) * 0.32);
      for (let i = 0; i < M.rows * M.cols; i++) {
        if (bytes[i >> 3] & (1 << (7 - (i & 7)))) {
          const row = Math.floor(i / M.cols), col = i % M.cols;
          dctx.beginPath(); dctx.arc((col + 0.5) * cw, (row + 0.5) * ch, r, 0, Math.PI * 2); dctx.fill();
        }
      }
    }

    // timeline list
    PLACES.forEach((p, i) => {
      const li = document.createElement("li");
      li.dataset.i = i;
      li.innerHTML = `<div class="flags">${p.flags.map((f) => `<img src="assets/flags/${f}.svg" alt="" width="22" height="16">`).join("")}</div>
        <span class="city">${p.city}</span><span class="years">${p.years}</span>${p.note ? `<span class="note">${p.note}</span>` : ""}`;
      list.appendChild(li);
    });
    const lis = [...list.children];

    // stops (unique coordinates) and route segments
    const stopEls = [], segs = [];
    function addStop(lat, lon, idx) {
      const [x, y] = proj(lat, lon);
      const pulse = document.createElementNS(NS, "circle"); pulse.setAttribute("class", "pulse"); pulse.setAttribute("cx", x); pulse.setAttribute("cy", y); pulse.setAttribute("r", 5);
      const c = document.createElementNS(NS, "circle"); c.setAttribute("class", "stop"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 4.5);
      svg.appendChild(pulse); svg.appendChild(c); stopEls.push({ c, pulse, idx });
    }
    function arc(a, b, bend, minor) {
      const [x1, y1] = proj(a.lat, a.lon), [x2, y2] = proj(b.lat, b.lon);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
      const cx = mx - dy * bend, cy = my + dx * bend;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`);
      path.setAttribute("class", "route" + (minor ? " minor" : ""));
      svg.insertBefore(path, svg.firstChild);
      return path;
    }
    const bends = [-0.6, -0.22, -0.22, 0.18];   // curve direction/strength per leg
    for (let i = 1; i < PLACES.length; i++) segs.push({ el: arc(PLACES[i - 1], PLACES[i], bends[i - 1] ?? -0.2), to: i });
    PLACES.forEach((p, i) => { addStop(p.lat, p.lon, i); if (p.also) { const m = arc(p, p.also, -0.5, true); segs.push({ el: m, to: i, minor: true }); addStop(p.also.lat, p.also.lon, i); } });

    // labels (font size kept readable at any width)
    const labels = [
      { t: "Bern · Montpellier · Baiersbronn", lat: 54.5, lon: -5, anchor: "middle" },
      { t: "Sydney", lat: -33.9, lon: 145.5, anchor: "end" },
      { t: "Montreal", lat: 50.5, lon: -73.6, anchor: "middle" },
    ].map((l) => {
      const [x, y] = proj(l.lat, l.lon), t = document.createElementNS(NS, "text");
      t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", l.anchor); t.setAttribute("dominant-baseline", "middle");
      t.textContent = l.t; svg.appendChild(t); return t;
    });
    function sizeLabels() { const k = VW / Math.max(1, svg.clientWidth); labels[0].textContent = svg.clientWidth < 640 ? "Europe" : "Bern · Montpellier · Baiersbronn"; labels.forEach((t) => t.style.fontSize = (12 * k) + "px"); labels.forEach((t) => t.style.strokeWidth = (4 * k) + "px"); }

    const setActive = (i) => {
      lis.forEach((li, j) => li.classList.toggle("on", j === i));
      stopEls.forEach((s) => s.pulse.classList.toggle("on", s.idx === i));
    };
    // hover a timeline entry to highlight its place
    lis.forEach((li) => {
      li.addEventListener("mouseenter", () => stopEls.forEach((s) => s.c.classList.toggle("hl", s.idx === +li.dataset.i)));
      li.addEventListener("mouseleave", () => stopEls.forEach((s) => s.c.classList.remove("hl")));
    });

    // route animation: everything is drawn at rest; scrolling the map into view replays the journey
    const prep = segs.map((s) => { const L = s.el.getTotalLength(); return { ...s, L }; });
    function showAll() { prep.forEach((s) => { s.el.style.strokeDasharray = s.minor ? "" : "none"; s.el.style.strokeDashoffset = 0; s.el.style.opacity = 1; }); setActive(PLACES.length - 1); }
    let token = 0;
    function play(onDone) {
      const me = ++token;
      if (reduceMotion) { showAll(); return onDone && onDone(); }
      prep.forEach((s) => { if (!s.minor) { s.el.style.strokeDasharray = s.L; s.el.style.strokeDashoffset = s.L; } else s.el.style.opacity = 0; });
      setActive(0);
      let t0 = null, i = 0, legStart = 0;
      const legs = prep.filter((s) => !s.minor), dur = (s) => Math.max(500, s.L * 2.2), pause = 450;
      function step(ts) {
        if (t0 === null) { t0 = ts; legStart = ts + pause; }
        if (me !== token) return;
        const leg = legs[i]; if (!leg) { showAll(); return onDone && onDone(); }
        const k = Math.min(1, Math.max(0, (ts - legStart) / dur(leg)));
        const e = 1 - Math.pow(1 - k, 3);
        leg.el.style.strokeDashoffset = leg.L * (1 - e);
        if (k >= 1) {
          setActive(leg.to);
          prep.filter((s) => s.minor && s.to === leg.to).forEach((s) => s.el.style.opacity = 1);
          i++; legStart = ts + pause;
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    drawDots(); sizeLabels(); showAll();
    window.addEventListener("resize", () => { drawDots(); sizeLabels(); });
    window.addEventListener("themechange", drawDots);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", drawDots);
    let playing = false;
    const run = () => { if (playing) return; playing = true; play(() => { playing = false; }); };
    const replay = document.getElementById("replay-route");
    if (replay) replay.addEventListener("click", () => { playing = false; run(); map.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.45 });
      io.observe(map);
    }
  }
})();
