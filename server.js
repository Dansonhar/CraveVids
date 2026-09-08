/* Dev/static server for CraveAsia Video Presentations.
   Zero dependencies — no npm install needed.
   - GET /api/videos lists whatever is in videos/
   - HTTP Range support so large videos seek properly
   - Live reload: edit index.html / styles.css / app.js / videos.js and the page refreshes */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const scrub = require("./scripts/make-scrub");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const LIVE = process.env.NO_RELOAD !== "1";
const OPEN = process.env.NO_OPEN !== "1";

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm",
  ".mov": "video/quicktime", ".m4v": "video/x-m4v", ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8", ".woff2": "font/woff2",
};

const RELOAD_SNIPPET = `
<script>
(() => {
  const es = new EventSource("/__reload");
  es.onmessage = () => location.reload();
})();
</script>`;

const clients = new Set();

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);

  // live-reload stream
  if (url === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  // list the videos folder
  if (url === "/api/videos") {
    const dir = path.join(ROOT, "videos");
    let files = [];
    try {
      files = fs.readdirSync(dir)
        .filter(f => /\.(mp4|webm|mov|m4v)$/i.test(f) && !f.startsWith("."))
        .sort((a, b) => a.localeCompare(b));
    } catch { /* no videos/ folder yet */ }
    // each entry says whether an all-keyframe scroll-scrub copy exists
    const out = files.map(f => ({
      file: f,
      scrub: fs.existsSync(path.join(dir, ".scrub", f.replace(/\.[^.]+$/, ".mp4"))),
    }));
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(JSON.stringify(out));
  }

  // resolve path, keep it inside ROOT
  let file = path.join(ROOT, url === "/" ? "index.html" : url);
  if (!path.resolve(file).startsWith(ROOT)) return send(res, 403, "Forbidden");
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) return send(res, 404, `Not found: ${url}`);

  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const stat = fs.statSync(file);

  // HTML: inject live reload
  if (ext === ".html") {
    let html = fs.readFileSync(file, "utf8");
    if (LIVE) html = html.replace("</body>", `${RELOAD_SNIPPET}\n</body>`);
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    return res.end(html);
  }

  // Range requests — required for smooth video scrubbing
  const range = req.headers.range;
  if (range && /^bytes=/.test(range)) {
    const [startStr, endStr] = range.replace("bytes=", "").split("-");
    const start = parseInt(startStr, 10) || 0;
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
    if (start >= stat.size || end >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }

  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stat.size,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
});

function send(res, code, msg) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(msg);
}

// watch source files for live reload
if (LIVE) {
  let timer = null;
  for (const f of ["index.html", "styles.css", "app.js", "videos.js"]) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    fs.watch(p, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        for (const c of clients) c.write("data: reload\n\n");
      }, 80);
    });
  }
}

function listen(port, attemptsLeft) {
  const onError = err => {
    server.removeListener("listening", onListening);
    if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
      console.log(`  port ${port} is busy, trying ${port + 1}\u2026`);
      listen(port + 1, attemptsLeft - 1);
    } else {
      console.error(`\n  Could not start server: ${err.message}\n`);
      process.exit(1);
    }
  };
  const onListening = () => {
    server.removeListener("error", onError);
    const url = `http://localhost:${port}`;
    console.log(`\n  CraveAsia Video Presentations`);
    console.log(`  \u279c  ${url}`);
    console.log(`  ${LIVE ? "live reload on" : "live reload off"} \u00b7 Ctrl+C to stop\n`);
    if (OPEN && process.platform === "darwin") execFile("open", [url], () => {});
  };
  server.once("error", onError);
  server.once("listening", onListening);
  server.listen(port);
}

// keep scroll-scrub copies current before the browser asks for them
scrub.main({ quiet: true }).catch(() => {});

listen(PORT, 10);
