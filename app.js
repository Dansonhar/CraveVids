/* ══════════════════════════════════════════════════════════════════
   CraveAsia Video Presentations — one screen, no page scroll.

   The device keeps moving on its own (the clip loops), and playback
   position drives everything else: the timeline fill, the live
   chapter caption and the active tick. You can take hold of it —
   drag the device sideways to scrub, click to pause, pick a chapter
   to jump, or switch device from the rail on the left.
   ══════════════════════════════════════════════════════════════════ */
(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = $("#scene"), stage = $("#stage"), video = $("#scrub"), glow = $(".scene-glow");
  const caption = $("#caption"), trackFill = $("#track-fill"), ticks = $("#track-ticks");
  const track = $("#track"), toggle = $("#toggle"), picker = $("#picker"), pickList = $("#picker-list");

  const META = typeof VIDEO_META === "object" && VIDEO_META ? VIDEO_META : {};
  const EXT = /\.(mp4|webm|mov|m4v)$/i;
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
  const pretty = f => f.replace(EXT, "").replace(/[-_]+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());

  let entries = [], active = -1, chapters = [], activeChapter = -1, dragging = false;

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
    pickList.addEventListener("pointerover", e => {
      const v = e.target.closest(".pick")?.querySelector("video");
      if (v && !reduce) { v.loop = true; v.play().catch(() => {}); }
    });
    pickList.addEventListener("pointerout", e => {
      const b = e.target.closest(".pick");
      if (b && !b.contains(e.relatedTarget)) {
        const v = b.querySelector("video");
        if (v) { v.pause(); try { v.currentTime = 0.1; } catch {} }
      }
    });
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
      buildTicks();
      stage.classList.remove("swapping");
      frame();
      if (!reduce) play(); else video.controls = true;
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

  const seek = p => {
    if (!video.duration) return;
    try { video.currentTime = clamp(p, 0, 1) * (video.duration - 0.01); } catch {}
    frame();
  };

  /* ── Play / pause ────────────────────────────────────────────── */
  function play() { video.play().then(paint).catch(() => {}); }
  function paint() {
    const on = !video.paused;
    toggle.classList.toggle("playing", on);
    toggle.setAttribute("aria-label", on ? "Pause" : "Play");
    toggle.innerHTML = on ? '<span class="ico-pause"></span>' : '<span class="ico-play"></span>';
  }
  toggle?.addEventListener("click", () => { video.paused ? play() : video.pause(); paint(); });
  video.addEventListener("play", paint);
  video.addEventListener("pause", paint);

  /* ── Playback drives everything ──────────────────────────────── */
  function frame() {
    const d = video.duration || 0;
    const p = d ? clamp(video.currentTime / d, 0, 1) : 0;

    if (trackFill) trackFill.style.width = `${p * 100}%`;
    if (glow) glow.style.opacity = String(0.35 + Math.sin(p * Math.PI) * 0.65);

    let idx = -1;
    for (let i = 0; i < chapters.length; i++) if (p >= chapters[i].at - 0.002) idx = i;
    if (idx !== activeChapter) {
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
  }
  (function loop() { frame(); requestAnimationFrame(loop); })();

  /* ── Drag the device to scrub ────────────────────────────────── */
  if (!reduce && stage) {
    let startX = 0, startT = 0, moved = false, wasPlaying = false;

    stage.addEventListener("pointerdown", e => {
      if (e.target.closest(".stage-toggle")) return;
      dragging = true; moved = false;
      startX = e.clientX; startT = video.currentTime;
      wasPlaying = !video.paused;
      video.pause();
      stage.classList.add("dragging");
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", e => {
      if (!dragging || !video.duration) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      // one stage width of drag ≈ the whole clip
      const t = clamp(startT + (dx / stage.offsetWidth) * video.duration, 0, video.duration - 0.01);
      try { video.currentTime = t; } catch {}
    });
    const end = e => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("dragging");
      try { stage.releasePointerCapture(e.pointerId); } catch {}
      if (!moved) { wasPlaying ? video.pause() : play(); paint(); }   // a click, not a drag
      else if (wasPlaying) play();
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  /* ── Pointer tilt ────────────────────────────────────────────── */
  if (!reduce && stage) {
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    scene.addEventListener("pointermove", e => {
      if (dragging) return;
      const r = stage.getBoundingClientRect();
      tx = clamp((e.clientX - r.left) / r.width - 0.5, -1, 1) * 2;
      ty = clamp((e.clientY - r.top) / r.height - 0.5, -1, 1) * 2;
      if (!raf) raf = requestAnimationFrame(lean);
    });
    scene.addEventListener("pointerleave", () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(lean); });
    function lean() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      stage.style.transform =
        `perspective(1500px) rotateY(${cx * 3.4}deg) rotateX(${-cy * 2.2}deg)`;
      raf = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(lean) : 0;
    }
  }

  /* ── Keys ────────────────────────────────────────────────────── */
  addEventListener("keydown", e => {
    if (e.key === " ") { e.preventDefault(); video.paused ? play() : video.pause(); paint(); }
    if (e.key === "ArrowLeft")  seek((video.currentTime - 0.4) / (video.duration || 1));
    if (e.key === "ArrowRight") seek((video.currentTime + 0.4) / (video.duration || 1));
    if (e.key === "ArrowDown" && entries.length) mount((active + 1) % entries.length);
    if (e.key === "ArrowUp" && entries.length) mount((active - 1 + entries.length) % entries.length);
  });
})();
