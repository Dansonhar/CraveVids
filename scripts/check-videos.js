/* npm run check — what's in videos/, and whether each has a scroll-scrub copy */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dir = path.join(root, "videos");
const EXT = /\.(mp4|webm|mov|m4v)$/i;

const g = s => `\x1b[32m${s}\x1b[0m`, y = s => `\x1b[33m${s}\x1b[0m`, d = s => `\x1b[2m${s}\x1b[0m`;
const mb = n => (n / 1048576).toFixed(1) + " MB";

let META = {};
try { META = eval(fs.readFileSync(path.join(root, "videos.js"), "utf8") + ";VIDEO_META") || {}; } catch {}

let files = [];
try { files = fs.readdirSync(dir).filter(f => EXT.test(f) && !f.startsWith(".")).sort(); } catch {}

if (!files.length) {
  console.log(`\n  ${y("No videos yet.")} Drop .mp4 / .webm / .mov files into videos/ and reload the page.\n`);
  process.exit(0);
}

console.log(`\n  ${files.length} video${files.length > 1 ? "s" : ""} in videos/\n`);
for (const f of files) {
  const m = META[f] || {};
  const scrubFile = path.join(dir, ".scrub", f.replace(EXT, ".mp4"));
  const hasScrub = fs.existsSync(scrubFile);
  const fresh = hasScrub && fs.statSync(scrubFile).mtimeMs >= fs.statSync(path.join(dir, f)).mtimeMs;
  const tags = [
    m.hero ? g("hero scene") : null,
    m.chapters ? `${m.chapters.length} chapters` : d("no chapters"),
    fresh ? g("scrub ready") : hasScrub ? y("scrub stale") : y("no scrub copy"),
  ].filter(Boolean).join(d(" · "));
  console.log(`  ${m.title || f}`);
  console.log(`    ${d(f)}  ${d(mb(fs.statSync(path.join(dir, f)).size))}`);
  console.log(`    ${tags}\n`);
}

const missing = files.filter(f => !fs.existsSync(path.join(dir, ".scrub", f.replace(EXT, ".mp4"))));
if (missing.length) console.log(`  ${d("Run 'npm run scrub' (or just 'npm run dev') to build the scroll-scrub copies.")}\n`);
