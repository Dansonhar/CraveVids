/* ══════════════════════════════════════════════════════════════════
   CraveAsia Video Presentations — the wheel drives the product.

   The page itself never moves: it is locked to one screen, no
   scrollbar. Wheel, trackpad and touch gestures are captured and fed
   to a virtual playhead (0 → 1) instead of the document, and that
   playhead IS the video's currentTime. Scroll down and the product
   comes apart; scroll back and it reassembles. Drag it sideways to
   scrub by hand, or switch product from the rail on the left.
   ══════════════════════════════════════════════════════════════════ */
(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stage = $("#stage"), video = $("#scrub"), glow = $(".stage-glow");
  const fill = $("#progress-fill"), picker = $("#picker"), pickList = $("#picker-list");

  const META = typeof VIDEO_META === "object" && VIDEO_META ? VIDEO_META : {};
  const EXT = /\.(mp4|webm|mov|m4v)$/i;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  const pretty = f => f.replace(EXT, "").replace(/[-_]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());

  let entries = [], active = -1, dragging = false, easing = false;
  let switching = false, over = 0;         // over = overscroll past an end
  let duration = 0, pos = 0, target = 0, current = 0;   // pos = playhead, 0 → 1

  /* ── Boot ────────────────────────────────────────────────────── */
  (async function boot() {
    let list = [];
    try {
      const r = await fetch("api/videos", { cache: "no-store" });
      if (r.ok) list = await r.json();
    } catch { /* static hosting — fall back to what videos.js names */ }

    list = list.map(v => (typeof v === "string" ? { file: v, scrub: false } : v))
               .filter(v => v && EXT.test(v.file));
    // Static hosting has no /api/videos: use what videos.js names. The
    // all-keyframe copies in videos/scrub/ are committed, so assume they are
    // there — video.onerror falls back to the original if one is missing.
    if (!list.length) list = Object.keys(META).filter(f => EXT.test(f)).map(f => ({ file: f, scrub: true }));
    if (!list.length) { $("#blank").hidden = false; return; }

    // videos.js order wins; anything it doesn't mention follows
    const named = Object.keys(META);
    list.sort((a, b) => {
      const ia = named.indexOf(a.file), ib = named.indexOf(b.file);
      return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib) || a.file.localeCompare(b.file);
    });
    entries = list;

    buildPicker();
    const heroAt = entries.findIndex(v => (META[v.file] || {}).hero);
    mount(heroAt > -1 ? heroAt : 0);
  })();

  /* ── Left rail: choose a product ─────────────────────────────── */
  function buildPicker() {
    if (!picker || !pickList) return;
    if (entries.length < 2) { picker.hidden = true; return; }

    pickList.innerHTML = entries.map((v, i) => {
      const title = (META[v.file] || {}).title || pretty(v.file);
      return `<button class="pick" data-i="${i}" title="${esc(title)}" aria-label="Show ${esc(title)}">
          <span class="pick-shot">
            <video src="videos/${encodeURIComponent(v.file)}#t=0.1" muted playsinline preload="metadata"></video>
          </span>
          <span class="pick-name">${esc(title)}</span>
        </button>`;
    }).join("");
    picker.hidden = false;

    pickList.addEventListener("click", e => {
      const b = e.target.closest(".pick");
      if (b && +b.dataset.i !== active) mount(+b.dataset.i);
    });
  }

  /* ── Swap in a product ───────────────────────────────────────── */
  function mount(i, startPos = 0) {
    const entry = entries[i];
    if (!entry) return;
    active = i;
    switching = true;                      // ignore input until it has loaded

    const meta = META[entry.file] || {};
    $("#scene-title").textContent = meta.title || pretty(entry.file);
    stage.classList.add("swapping");
    if (fill) fill.style.width = "0%";
    pickList?.querySelectorAll(".pick").forEach(b => b.classList.toggle("on", +b.dataset.i === i));

    // the all-keyframe copy scrubs smoothly; a normal export snaps to keyframes
    const name = encodeURIComponent(entry.file);
    const scrubSrc = `videos/scrub/${encodeURIComponent(entry.file.replace(EXT, ".mp4"))}`;
    video.onerror = () => { if (video.src.includes("/scrub/")) video.src = `videos/${name}`; };
    video.onloadedmetadata = () => {
      duration = video.duration || 0;
      video.pause();                       // never plays on its own
      if (reduce) video.controls = true;   // reduced motion: give them a player
      stage.classList.remove("swapping");
      // arriving by scrolling down starts sealed; scrolling back up starts
      // at the far end, so the reverse journey is continuous
      pos = clamp(startPos, 0, 1);
      current = target = pos * (duration - 0.01);
      try { video.currentTime = current; } catch {}
      switching = false;
      over = 0;
      apply();
      hintFor(pos);
    };
    video.src = entry.scrub ? scrubSrc : `videos/${name}`;
    video.load();
  }

  /* ── The playhead ────────────────────────────────────────────── */
  function apply() {
    if (reduce || !duration) return;
    target = pos * (duration - 0.01);
    if (fill) fill.style.width = `${pos * 100}%`;
    if (glow) glow.style.opacity = String(0.4 + Math.sin(pos * Math.PI) * 0.5);
    ease();
  }

  // glide the video toward the playhead instead of snapping to it
  function ease() {
    if (easing) return;
    easing = true;
    requestAnimationFrame(function step() {
      const diff = target - current;
      if (Math.abs(diff) < 0.004) { current = target; easing = false; }
      else { current += diff * 0.18; requestAnimationFrame(step); }
      if (video.readyState >= 1 && !video.seeking) {
        try { video.currentTime = clamp(current, 0, Math.max(0, duration - 0.01)); } catch {}
      }
    });
  }

  /* ── Wheel / trackpad → playhead, and on past the ends ───────── */
  const throwPx = () => clamp((duration || 8) * 420, 1600, 5200);

  // How far past an end you must keep pushing before the next product loads:
  // about five or six wheel ticks. Enough to be deliberate, not a chore.
  const OVER = 0.15;
  // If you stop for a moment at an end, the overscroll resets — so trackpad
  // momentum from finishing the animation cannot coast you into the next one.
  let overAt = 0;
  const OVER_IDLE = 260;

  // Move the playhead by `step` (in 0→1 units). At an end, keep pushing and
  // it carries you into the next or previous product instead of stopping.
  function nudge(step) {
    if (switching || reduce || !duration) return;
    const now = performance.now();
    if (now - overAt > OVER_IDLE) over = 0;      // paused at the end → start over
    overAt = now;
    const next = pos + step;

    if (next > 1 && pos >= 1) {            // past the end, still scrolling down
      over = Math.max(0, over) + step;
      if (over >= OVER && active < entries.length - 1) mount(active + 1, 0);
      return;
    }
    if (next < 0 && pos <= 0) {            // past the start, still scrolling up
      over = Math.min(0, over) + step;
      if (over <= -OVER && active > 0) mount(active - 1, 1);   // enter it fully exploded
      return;
    }

    over = 0;
    pos = clamp(next, 0, 1);
    apply();
    hintFor(pos);
  }

  // tell them what another push will do, once they reach an end
  function hintFor(p) {
    const el = $("#chain-hint");
    if (!el) return;
    const nextT = entries[active + 1] && (META[entries[active + 1].file] || {}).title;
    const prevT = entries[active - 1] && (META[entries[active - 1].file] || {}).title;
    let txt = "";
    if (p >= 0.999 && nextT) txt = `keep scrolling for ${nextT}`;
    else if (p <= 0.001 && prevT) txt = `scroll up for ${prevT}`;
    el.textContent = txt;
    el.classList.toggle("on", !!txt);
  }

  window.__nudge = nudge;          // used by the keyboard handler below

  addEventListener("wheel", e => {
    if (e.target.closest(".picker-list")) return;   // the product list may scroll itself
    e.preventDefault();                             // the page stays put
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    nudge((e.deltaY * unit) / throwPx());
  }, { passive: false });

  /* ── Touch swipe → playhead ──────────────────────────────────── */
  {
    let y0 = 0, p0 = 0, on = false;
    addEventListener("touchstart", e => {
      if (e.target.closest(".picker-list")) return;
      on = true; y0 = e.touches[0].clientY; p0 = pos;
    }, { passive: true });
    addEventListener("touchmove", e => {
      if (!on) return;
      e.preventDefault();                           // no rubber-banding the page
      if (reduce || !duration) return;
      const want = p0 + (y0 - e.touches[0].clientY) / (innerHeight * 0.9);
      nudge(want - pos);
    }, { passive: false });
    addEventListener("touchend", () => { on = false; }, { passive: true });
  }

  // belt and braces: if anything ever does scroll the document, undo it
  addEventListener("scroll", () => { if (scrollY || scrollX) scrollTo(0, 0); }, { passive: true });
  addEventListener("resize", apply, { passive: true });

  /* ── Drag the product to scrub ───────────────────────────────── */
  if (!reduce && stage) {
    let startX = 0, startP = 0;
    stage.addEventListener("pointerdown", e => {
      dragging = true; startX = e.clientX; startP = pos;
      stage.classList.add("dragging");
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", e => {
      if (!dragging) return;
      // one screen width of drag ≈ the whole clip
      pos = clamp(startP + (e.clientX - startX) / stage.offsetWidth, 0, 1);
      apply();
    });
    const end = e => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("dragging");
      try { stage.releasePointerCapture(e.pointerId); } catch {}
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  /* ── Keys ────────────────────────────────────────────────────── */
  addEventListener("keydown", e => {
    const nudge = d => { e.preventDefault(); pos = clamp(pos + d, 0, 1); apply(); };
    if (e.key === "ArrowRight" || e.key === "ArrowDown") nudge(0.04);
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   nudge(-0.04);
    if (e.key === "Home") { e.preventDefault(); pos = 0; apply(); }
    if (e.key === "End")  { e.preventDefault(); pos = 1; apply(); }
    if (e.key === "[" && entries.length) mount((active - 1 + entries.length) % entries.length);
    if (e.key === "]" && entries.length) mount((active + 1) % entries.length);
  });
})();

/* ══════════════════════════════════════════════════════════════════
   COLOUR LOCK — DO NOT REMOVE
   The product footage plays in its original colour, always. Greyscale
   and desaturation on video are banned in this project. The CSS rule
   at the end of styles.css blocks it from stylesheets; this catches
   the one thing !important cannot — an inline style set from script.
   ══════════════════════════════════════════════════════════════════ */
(() => {
  const strip = v => {
    if (v.style.filter && v.style.filter !== "none") v.style.filter = "none";
    if (v.style.webkitFilter && v.style.webkitFilter !== "none") v.style.webkitFilter = "none";
  };
  const sweep = () => document.querySelectorAll("video").forEach(strip);

  sweep();
  // catch inline filters added later, on existing or newly inserted videos
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === "attributes" && m.target.tagName === "VIDEO") strip(m.target);
      else m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.tagName === "VIDEO") strip(n);
        else n.querySelectorAll?.("video").forEach(strip);
      });
    }
  }).observe(document.documentElement, {
    subtree: true, childList: true, attributes: true, attributeFilter: ["style"],
  });
})();

/* ── Keys: arrows nudge the playhead, and carry on to the next product
      at the ends; [ and ] jump product directly ──────────────────── */
(() => {
  addEventListener("keydown", e => {
    if (e.target.closest("input,textarea")) return;
    const big = e.key === "PageDown" || e.key === "PageUp";
    const down = e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ";
    const up   = e.key === "ArrowUp"   || e.key === "ArrowLeft"  || e.key === "PageUp";
    if (!down && !up) return;
    e.preventDefault();
    const step = (big ? 0.25 : 0.06) * (down ? 1 : -1);
    window.__nudge?.(step);
  });
})();
