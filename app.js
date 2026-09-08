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
      if (r.ok) files = (await r.json()).filter(f => EXT.test(f));
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
