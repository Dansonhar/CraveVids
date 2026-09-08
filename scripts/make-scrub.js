/* Builds scroll-scrub copies of every video in videos/ → videos/scrub/
   Scrubbing a normal MP4 is jerky: seeking snaps to the nearest keyframe, and
   most exports have one keyframe every few seconds (this project's first video
   had exactly one, for 240 frames). Re-encoding with a keyframe on EVERY frame
   makes video.currentTime land exactly where the scroll asks.
   Audio is dropped — the scrub copy is never heard, only scrolled.
   Requires ffmpeg. Safe to re-run: existing, up-to-date copies are skipped. */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "videos");
const OUT = path.join(SRC, "scrub");
const EXT = /\.(mp4|webm|mov|m4v)$/i;

const hasFfmpeg = () => spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;

function list() {
  try {
    return fs.readdirSync(SRC).filter(f => EXT.test(f) && !f.startsWith("."));
  } catch { return []; }
}

// needs rebuild if missing or older than the source
function stale(file) {
  const src = path.join(SRC, file);
  const out = path.join(OUT, file.replace(EXT, ".mp4"));
  if (!fs.existsSync(out)) return true;
  return fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs;
}

function encode(file) {
  return new Promise(resolve => {
    const src = path.join(SRC, file);
    const out = path.join(OUT, file.replace(EXT, ".mp4"));
    const tmp = out + ".tmp.mp4";
    const args = [
      "-y", "-i", src,
      "-an",                                  // no audio — scrub copy is silent
      "-vf", "scale='min(1600,iw)':-2",       // cap width, keep aspect (even height)
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
      "-g", "1", "-keyint_min", "1", "-sc_threshold", "0",  // every frame a keyframe
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      tmp,
    ];
    const p = spawn("ffmpeg", args, { stdio: "ignore" });
    p.on("close", code => {
      if (code === 0 && fs.existsSync(tmp)) {
        fs.renameSync(tmp, out);
        const mb = n => (n / 1048576).toFixed(1);
        console.log(`  ✓ ${file}  ${mb(fs.statSync(src).size)}MB → ${mb(fs.statSync(out).size)}MB scrub copy`);
      } else {
        fs.existsSync(tmp) && fs.unlinkSync(tmp);
        console.log(`  ✗ ${file} — ffmpeg failed (the page falls back to the original)`);
      }
      resolve();
    });
    p.on("error", () => resolve());
  });
}

async function main({ quiet = false } = {}) {
  const files = list();
  if (!files.length) return;
  const todo = files.filter(stale);
  if (!todo.length) { if (!quiet) console.log("  scrub copies already up to date"); return; }
  if (!hasFfmpeg()) {
    console.log("\n  ffmpeg not found — skipping scroll-scrub optimisation.");
    console.log("  Install it for smooth scroll scrubbing:  brew install ffmpeg\n");
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`\n  Building scroll-scrub copies (${todo.length})…`);
  for (const f of todo) await encode(f);
  console.log();
}

module.exports = { main, list, stale, hasFfmpeg };
if (require.main === module) main();
