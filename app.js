/* ══════════════════════════════════════════════════════════════════
   CraveAsia Video Presentations — the wheel drives the device.

   The page itself never moves: it is locked to one screen, no
   scrollbar, no runway. Wheel, trackpad and touch gestures are
   captured and fed to a virtual playhead (0 → 1) instead of the
   document, and that playhead IS the video's currentTime. Scroll
   down and the device comes apart; scroll back and it reassembles.

   The same playhead drives the timeline fill, the live chapter and
   the active tick. You can also drag the device sideways, pick a
   chapter, or switch device from the rail on the left.
   ══════════════════════════════════════════════════════════════════ */
(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = $("#scene"), stage = $("#stage"), video = $("#scrub"), glow = $(".scene-glow");
  const caption = $("#caption"), trackFill = $("#track-fill"), ticks = $("#track-ticks");
  const track = $("#track"), picker = $("#picker"), pickList = $("#picker-list");
  const cue = $("#cue");

  const META = typeof VIDEO_META === "object" && VIDEO_META ? VIDEO_META : {};
  const EXT = /\.(mp4|webm|mov|m4v)$/i;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  const pretty = f => f.replace(EXT, "").replace(/[-_]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());

  let entries = [], active = -1, chapters = [], activeChapter = -1, dragging = false;
  let pos = 0;                       // the playhead: 0 → 1 through the clip
  let duration = 0, target = 0, current = 0, easing = false;

  /* ── Boot ────────────────────────────────────────────────────── */
  (async function boot() {
    let list = [];
    try {
      const r = await fetch("api/videos", { cache: "no-store" });
      if (r.ok) list = await r.json();
    } catch { /* static hosting — fall back to what videos.js names */ }

    list = list.map(v => (typeof v === "string" ? { file: v, scrub: false } : v))
               .filter(v => v && EXT.test(v.file));
    if (!list.length) list = Object.keys(META).filter(f => EXT.test(f)).map(f => ({ file: f, scrub: false }));

    // videos.js order wins; anything it doesn't mention follows
    const named = Object.keys(META);
    list.sort((a, b) => {
      const ia = named.indexOf(a.file), ib = named.indexOf(b.file);
      return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib) || a.file.localeCompare(b.file);
    });
    entries = list;

    if (!entries.length) { $("#blank").hidden = false; scene.classList.add("is-empty"); return; }

    $("#count").textContent = `${entries.length} device${entries.length > 1 ? "s" : ""}`;
    buildPicker();
    const heroAt = entries.findIndex(v => (META[v.file] || {}).hero);
    mount(heroAt > -1 ? heroAt : 0);
  })();

  /* ── Left rail: choose a device ──────────────────────────────── */
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
    // thumbnails stay on their first frame — nothing moves without scrolling
  }

  /* ── Swap in a device ────────────────────────────────────────── */
  function mount(i) {
    const entry = entries[i];
    if (!entry) return;
    active = i;

    const meta = META[entry.file] || {};
    chapters = Array.isArray(meta.chapters) ? meta.chapters.slice().sort((a, b) => a.at - b.at) : [];
    activeChapter = -1;

    $("#scene-title").textContent = meta.title || pretty(entry.file);
    $("#scene-eyebrow").textContent = meta.eyebrow || "Exploded View";
    $("#cap-desc").textContent = meta.desc || "";
    caption.classList.remove("on");
    if (trackFill) trackFill.style.width = "0%";
    stage.classList.add("swapping");
    pickList?.querySelectorAll(".pick").forEach(b => b.classList.toggle("on", +b.dataset.i === i));

    // the all-keyframe copy scrubs smoothly; a normal export snaps to keyframes
    const name = encodeURIComponent(entry.file);
    const scrubSrc = `videos/.scrub/${encodeURIComponent(entry.file.replace(EXT, ".mp4"))}`;
    video.onerror = () => { if (video.src.includes("/.scrub/")) video.src = `videos/${name}`; };
    video.onloadedmetadata = () => {
      duration = video.duration || 0;
      video.pause();                       // never plays on its own
      if (reduce) video.controls = true;   // reduced motion: give them a player
      buildTicks();
      stage.classList.remove("swapping");
      pos = current = target = 0;          // a new device starts sealed
      apply();
    };
    video.src = entry.scrub ? scrubSrc : `videos/${name}`;
    video.load();
  }

  /* ── Timeline ticks ──────────────────────────────────────────── */
  function buildTicks() {
    if (!ticks) return;
    if (!chapters.length) { ticks.innerHTML = ""; track.hidden = true; return; }
    track.hidden = false;
    ticks.innerHTML = chapters.map((c, i) =>
      `<button class="tick" data-i="${i}" style="left:${c.at * 100}%">
         <span class="tick-dot"></span><span class="tick-name">${esc(c.title)}</span>
       </button>`).join("");
  }
  ticks?.addEventListener("click", e => {
    const b = e.target.closest(".tick");
    if (b) seek(chapters[+b.dataset.i].at);
  });
  track?.addEventListener("click", e => {          // click anywhere on the line
    if (e.target.closest(".tick")) return;
    const r = track.getBoundingClientRect();
    seek(clamp((e.clientX - r.left) / r.width, 0, 1));
  });

  // jumping to a chapter just moves the playhead — the easing glides there
  const seek = p => { pos = clamp(p, 0, 1); apply(); };

  /* ── The playhead ────────────────────────────────────────────────
     `pos` is 0 → 1 through the clip. Nothing about it touches the
     document, so the page cannot move.                              */
  function apply() {
    if (reduce || !duration) return;
    target = pos * (duration - 0.01);
    if (cue) cue.style.opacity = String(clamp(1 - pos * 14, 0, 1));
    paintChapter(pos);
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

  /* ── Wheel / trackpad → playhead (never the page) ────────────── */
  // how much wheel travel covers the whole clip — longer clips, longer throw
  const throwPx = () => clamp((duration || 8) * 420, 1600, 5200);

  addEventListener("wheel", e => {
    if (e.target.closest(".picker-list")) return;   // the device list may scroll itself
    e.preventDefault();                             // the page stays put
    if (reduce || !duration) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    pos = clamp(pos + (e.deltaY * unit) / throwPx(), 0, 1);
    apply();
  }, { passive: false });

  /* ── Touch swipe → playhead ──────────────────────────────────── */
  {
    let y0 = 0, p0 = 0, active = false;
    addEventListener("touchstart", e => {
      if (e.target.closest(".picker-list")) return;
      active = true; y0 = e.touches[0].clientY; p0 = pos;
    }, { passive: true });
    addEventListener("touchmove", e => {
      if (!active) return;
      e.preventDefault();                           // no rubber-banding the page
      if (reduce || !duration) return;
      pos = clamp(p0 + (y0 - e.touches[0].clientY) / (innerHeight * 0.9), 0, 1);
      apply();
    }, { passive: false });
    addEventListener("touchend", () => { active = false; }, { passive: true });
  }

  // belt and braces: if anything ever does scroll the document, undo it
  addEventListener("scroll", () => { if (scrollY || scrollX) scrollTo(0, 0); }, { passive: true });
  addEventListener("resize", apply, { passive: true });

  /* ── Scroll position drives the readouts ─────────────────────── */
  function paintChapter(p) {
    if (trackFill) trackFill.style.width = `${p * 100}%`;
    if (glow) glow.style.opacity = String(0.35 + Math.sin(p * Math.PI) * 0.65);

    let idx = -1;
    for (let i = 0; i < chapters.length; i++) if (p >= chapters[i].at - 0.002) idx = i;
    if (idx === activeChapter) return;
    activeChapter = idx;
    const c = chapters[idx];
    caption.classList.toggle("on", !!c);
    if (c) {
      $("#cap-idx").textContent = `${String(idx + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
      $("#cap-title").textContent = c.title;
      $("#cap-text").textContent = c.text || "";
    }
    ticks?.querySelectorAll(".tick").forEach(t => t.classList.toggle("on", +t.dataset.i === idx));
  }

  /* ── Drag the device to scrub (drags the scroll) ─────────────── */
  if (!reduce && stage) {
    let startX = 0, startP = 0;

    stage.addEventListener("pointerdown", e => {
      dragging = true;
      startX = e.clientX; startP = pos;
      stage.classList.add("dragging");
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", e => {
      if (!dragging) return;
      // one stage width of drag ≈ the whole clip
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

  /* ── Keys: step between chapters and devices ─────────────────── */
  addEventListener("keydown", e => {
    if (e.target.closest("input,textarea")) return;
    const step = d => {
      const p = pos;
      let i = -1;
      for (let k = 0; k < chapters.length; k++) if (p >= chapters[k].at - 0.002) i = k;
      const next = clamp(i + d, 0, chapters.length - 1);
      if (chapters[next]) { e.preventDefault(); seek(chapters[next].at); }
    };
    if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1);
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   step(-1);
    if (e.key === "[" && entries.length) mount((active - 1 + entries.length) % entries.length);
    if (e.key === "]" && entries.length) mount((active + 1) % entries.length);
  });
})();
