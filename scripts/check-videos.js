/* npm run check — what's in videos/, and which files still have no description */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const META = eval(fs.readFileSync(path.join(root, "videos.js"), "utf8") + ";VIDEO_META");

const g = s => `\x1b[32m${s}\x1b[0m`, y = s => `\x1b[33m${s}\x1b[0m`, d = s => `\x1b[2m${s}\x1b[0m`;
const mb = n => (n / 1048576).toFixed(1) + " MB";

let files = [];
try {
  files = fs.readdirSync(path.join(root, "videos"))
    .filter(f => /\.(mp4|webm|mov|m4v)$/i.test(f) && !f.startsWith("."))
    .sort((a, b) => a.localeCompare(b));
} catch { /* no videos/ folder */ }

if (!files.length) {
  console.log(`\n  No videos yet — drop files into ${d("videos/")}\n`);
  process.exit(0);
}

const described = files.filter(f => META[f]);
const bare = files.filter(f => !META[f]);

console.log(`\n  ${files.length} video${files.length > 1 ? "s" : ""} — ${g(described.length + " described")}, ${y(bare.length + " without a description")}\n`);
for (const f of files) {
  const size = mb(fs.statSync(path.join(root, "videos", f)).size);
  const m = META[f];
  console.log(`  ${m ? g("✓") : y("·")} ${f.padEnd(34)} ${d(size.padStart(9))}  ${m ? d(m.title || "") : d("no description yet")}`);
}
if (bare.length) console.log(`\n  ${d("Add entries for the marked files in videos.js")}`);
console.log();
