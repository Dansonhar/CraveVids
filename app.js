/* CraveAsia Video Presentations — lists whatever is in videos/ */
(() => {
  const $ = s => document.querySelector(s);
  const grid = $("#grid"), search = $("#search"), empty = $("#empty"), blank = $("#blank");
  const modal = $("#modal"), player = $("#player");

  const META = typeof VIDEO_META === "object" && VIDEO_META ? VIDEO_META : {};
  const EXT = /\.(mp4|webm|mov|m4v)$/i;

  let all = [], visible = [], index = -1, query = "", lastFocus = null;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

  // "opening-reel_v2.mp4" → "Opening Reel V2"
  const pretty = f => f.replace(EXT, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
    .replace(/\b\w/g, c => c.toUpperCase());

  function build(files) {
    const listed = Object.keys(META).filter(f => files.includes(f));
    const rest = files.filter(f => !listed.includes(f)).sort((a, b) => a.localeCompare(b));
    return [...listed, ...rest].map(file => {
      const m = META[file] || {};
      return {
        file,
        title: m.title || pretty(file),
        desc: m.desc || "",
        notes: Array.isArray(m.notes) ? m.notes : [],
        src: `videos/${encodeURIComponent(file)}`,
      };
    });
  }

  /* ── Discover files ──────────────────────────────────────── */
  async function load() {
    let files = [];
    try {
      const r = await fetch("api/videos", { cache: "no-store" });
      // the API returns [{file, scrub}]; older/static setups may return plain names
      if (r.ok) files = (await r.json())
        .map(v => (typeof v === "string" ? v : v && v.file))
        .filter(f => f && EXT.test(f));
    } catch { /* static hosting — fall back to what videos.js names */ }
    if (!files.length) files = Object.keys(META).filter(f => EXT.test(f));

    all = build(files);
    blank.hidden = all.length > 0;
    search.hidden = all.length === 0;
    $("#count").textContent = all.length ? `${all.length} video${all.length > 1 ? "s" : ""}` : "";
    render();
    openFromHash();
  }

  /* ── Grid ────────────────────────────────────────────────── */
  function render() {
    visible = all.filter(v => !query || `${v.title} ${v.desc} ${v.file}`.toLowerCase().includes(query));
    grid.innerHTML = visible.map((v, i) => `
      <button class="card" data-i="${i}" aria-label="Play ${esc(v.title)}">
        <div class="shot">
          <video src="${v.src}#t=0.1" muted playsinline preload="metadata"></video>
          <span class="play" aria-hidden="true">&#9654;</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${esc(v.title)}</h3>
          ${v.desc ? `<p class="card-sub">${esc(v.desc)}</p>` : ""}
          <p class="card-file">${esc(v.file)}</p>
        </div>
      </button>`).join("");
    empty.hidden = visible.length > 0 || !all.length;
  }

  search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); render(); });
  grid.addEventListener("click", e => {
    const c = e.target.closest(".card");
    if (c) open(+c.dataset.i);
  });

  /* ── Player ──────────────────────────────────────────────── */
  function open(i) {
    if (i < 0 || i >= visible.length) return;
    lastFocus = lastFocus || document.activeElement;
    index = i;
    const v = visible[i];

    $("#m-title").textContent = v.title;
    $("#m-desc").textContent = v.desc;
    $("#m-desc").hidden = !v.desc;
    $("#m-notes").innerHTML = v.notes.map(n => `<li>${esc(n)}</li>`).join("");
    $("#m-pos").textContent = `${i + 1} / ${visible.length}`;

    player.src = v.src;
    player.load();
    player.play().catch(() => {});          // autoplay may be blocked — controls are there

    modal.hidden = false;
    document.body.classList.add("locked");
    $(".modal-close").focus();
    history.replaceState(null, "", `#${encodeURIComponent(v.file)}`);
  }

  function close() {
    player.pause();
    player.removeAttribute("src");
    player.load();
    modal.hidden = true;
    document.body.classList.remove("locked");
    history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  }

  function openFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    const i = visible.findIndex(v => v.file === h);
    if (i > -1) open(i);
  }

  const step = d => open((index + d + visible.length) % visible.length);

  modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
  $("#prev").addEventListener("click", () => step(-1));
  $("#next").addEventListener("click", () => step(1));
  document.addEventListener("keydown", e => {
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  load();
})();

/* ══════════════════════════════════════════════════════════════════
   MOTION SCENE — the page scroll drives the exploded-view video.

   How it works: the .scene section is several screens tall and its
   inner .scene-pin is sticky, so the device stays put while you keep
   scrolling. Scroll distance through that section maps 0→1 onto the
   video's duration, and each frame we ease the video's currentTime
   toward that target. Scrolling back reassembles the device.

   It plays the all-keyframe copy from videos/.scrub/ when the server
   has built one (npm run scrub) — seeking a normal export snaps to
   the nearest keyframe and stutters.
   ══════════════════════════════════════════════════════════════════ */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => document.querySelector(s);
  const scene = $("#scene"), pin = scene && scene.querySelector(".scene-pin");
  if (!scene) return;

  const video = $("#scrub"), stage = $("#stage"), glow = scene.querySelector(".scene-glow");
  const cue = $("#cue"), caption = $("#caption"), railFill = $("#rail-fill"), ticks = $("#rail-ticks");
  const META = typeof VIDEO_META === "object" && VIDEO_META ? VIDEO_META : {};
  const EXT = /\.(mp4|webm|mov|m4v)$/i;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pretty = f => f.replace(EXT, "").replace(/[-_]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());

  if (!reduce) document.body.classList.add("motion");   // unlocks the reveal animation

  let duration = 0, target = 0, current = 0, chapters = [], activeChapter = -1;
  let dragging = false, ticking = false;

  /* ── pick the hero video ─────────────────────────────────────── */
  async function boot() {
    let list = [];
    try {
      const r = await fetch("api/videos", { cache: "no-store" });
      if (r.ok) list = await r.json();
    } catch { /* static hosting */ }
    list = list.map(v => (typeof v === "string" ? { file: v, scrub: false } : v))
               .filter(v => v && EXT.test(v.file));
    if (!list.length) return;                       // no videos → no scene

    // videos.js can nominate one with `hero: true`; otherwise the first file
    const picked = list.find(v => (META[v.file] || {}).hero) || list[0];
    const meta = META[picked.file] || {};
    chapters = Array.isArray(meta.chapters) ? meta.chapters.slice().sort((a, b) => a.at - b.at) : [];

    $("#scene-title").textContent = meta.title || pretty(picked.file);
    if (meta.eyebrow) $("#scene-eyebrow").textContent = meta.eyebrow;

    // prefer the all-keyframe scrub copy
    const name = encodeURIComponent(picked.file);
    const scrubSrc = `videos/.scrub/${encodeURIComponent(picked.file.replace(EXT, ".mp4"))}`;
    video.src = picked.scrub ? scrubSrc : `videos/${name}`;
    video.addEventListener("error", () => {          // scrub copy missing → original
      if (video.src.includes("/.scrub/")) video.src = `videos/${name}`;
    }, { once: true });

    scene.hidden = false;
    const lead = $("#lead"); if (lead) lead.hidden = false;

    video.addEventListener("loadedmetadata", () => {
      duration = video.duration || 0;
      video.pause();
      // runway length scales with the video: ~45vh of scroll per second
      if (!reduce) scene.style.height = `${clamp(Math.round(duration * 45), 300, 700)}vh`;
      buildTicks();
      onScroll();
      if (reduce) video.controls = true;             // no scroll animation — just play it
    }, { once: true });
  }

  /* ── chapter ticks on the rail ───────────────────────────────── */
  function buildTicks() {
    if (!ticks) return;
    if (!chapters.length) { const r = $("#rail"); if (r) r.hidden = true; return; }
    ticks.innerHTML = chapters.map((c, i) =>
      `<button class="rail-tick" data-i="${i}" style="top:${c.at * 100}%">${c.title}</button>`).join("");
    ticks.addEventListener("click", e => {
      const b = e.target.closest(".rail-tick");
      if (b) scrollToProgress(chapters[+b.dataset.i].at);
    });
  }

  const runway = () => scene.offsetHeight - innerHeight;
  const sceneTop = () => scene.offsetTop;
  const scrollToProgress = p =>
    scrollTo({ top: sceneTop() + p * runway(), behavior: reduce ? "auto" : "smooth" });

  /* ── scroll → target time ────────────────────────────────────── */
  function progress() {
    return clamp((scrollY - sceneTop()) / Math.max(1, runway()), 0, 1);
  }

  function onScroll() {
    if (reduce || !duration) return;
    const p = progress();
    target = p * duration;

    if (railFill) railFill.style.height = `${p * 100}%`;
    if (glow) glow.style.opacity = String(0.35 + Math.sin(p * Math.PI) * 0.65);
    if (cue) cue.style.opacity = String(clamp(1 - p * 12, 0, 1));

    // active chapter = last one we've scrolled past
    let idx = -1;
    for (let i = 0; i < chapters.length; i++) if (p >= chapters[i].at - 0.002) idx = i;
    if (idx !== activeChapter) {
      activeChapter = idx;
      const c = chapters[idx];
      caption.classList.toggle("on", !!c);
      if (c) {
        $("#cap-idx").textContent = String(idx + 1).padStart(2, "0");
        $("#cap-title").textContent = c.title;
        $("#cap-text").textContent = c.text || "";
      }
      ticks && ticks.querySelectorAll(".rail-tick")
        .forEach(t => t.classList.toggle("on", +t.dataset.i === idx));
    }
    kick();
  }

  /* ── ease the video toward the target time ───────────────────── */
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  function tick() {
    const diff = target - current;
    if (Math.abs(diff) < 0.004) { current = target; ticking = false; }
    else { current += diff * 0.18; requestAnimationFrame(tick); }   // inertia
    if (video.readyState >= 1 && !video.seeking) {
      try { video.currentTime = clamp(current, 0, Math.max(0, duration - 0.01)); } catch {}
    }
  }

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { onScroll(); }, { passive: true });

  /* ── pointer tilt: the device leans toward the cursor ────────── */
  if (!reduce && pin) {
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    pin.addEventListener("pointermove", e => {
      const r = pin.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(lean);
    });
    pin.addEventListener("pointerleave", () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(lean); });
    function lean() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      stage.style.transform =
        `perspective(1400px) rotateY(${cx * 5}deg) rotateX(${-cy * 3.4}deg) translate3d(${cx * 12}px,${cy * 8}px,0)`;
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(lean) : 0;
    }
  }

  /* ── drag the device to scrub by hand ────────────────────────── */
  if (!reduce && stage) {
    let startX = 0, startP = 0;
    stage.addEventListener("pointerdown", e => {
      dragging = true; startX = e.clientX; startP = progress();
      stage.classList.add("dragging");
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", e => {
      if (!dragging) return;
      // a full stage width of drag ≈ the whole animation
      const p = clamp(startP + (e.clientX - startX) / stage.offsetWidth, 0, 1);
      scrollTo({ top: sceneTop() + p * runway() });   // scroll stays the source of truth
    });
    const end = e => {
      if (!dragging) return;
      dragging = false; stage.classList.remove("dragging");
      try { stage.releasePointerCapture(e.pointerId); } catch {}
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  /* ── grid motion: reveal on scroll + hover preview ───────────── */
  const grid = $("#grid");
  if (grid) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    const watch = () => grid.querySelectorAll(".card:not(.in)").forEach((c, i) => {
      c.style.transitionDelay = `${Math.min(i, 8) * 55}ms`;
      reduce ? c.classList.add("in") : io.observe(c);
    });
    new MutationObserver(watch).observe(grid, { childList: true });
    watch();

    // hover a card → its preview plays
    grid.addEventListener("pointerover", e => {
      const v = e.target.closest(".card")?.querySelector("video");
      if (v && !reduce) { v.muted = true; v.loop = true; v.play().catch(() => {}); }
    });
    grid.addEventListener("pointerout", e => {
      const card = e.target.closest(".card");
      if (card && !card.contains(e.relatedTarget)) {
        const v = card.querySelector("video");
        if (v) { v.pause(); try { v.currentTime = 0.1; } catch {} }
      }
    });
  }

  boot();
})();
