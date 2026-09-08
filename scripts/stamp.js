#!/usr/bin/env node
/* Cache-bust the asset links in index.html.

   GitHub Pages serves styles.css / app.js / videos.js with
   Cache-Control: max-age=600 and no version in the URL, so after a deploy a
   browser keeps showing the OLD files for up to ten minutes — which looks
   exactly like "live doesn't match local".

   This stamps ?v=<content hash> onto each link. The URL changes whenever the
   file changes, so the browser is forced to fetch the new one immediately.
   Run by `npm run stamp` and by the pre-commit hook, so every commit ships
   links that match its own contents. */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const HTML = path.join(root, "index.html");
const ASSETS = ["styles.css", "app.js", "videos.js"];

const hash = f => crypto.createHash("md5")
  .update(fs.readFileSync(path.join(root, f))).digest("hex").slice(0, 8);

let html = fs.readFileSync(HTML, "utf8");
let changed = [];

for (const a of ASSETS) {
  if (!fs.existsSync(path.join(root, a))) continue;
  const v = hash(a);
  // match href="app.js" or src="app.js?v=oldhash"
  const re = new RegExp(`((?:href|src)=")${a.replace(".", "\\.")}(?:\\?v=[a-f0-9]+)?(")`, "g");
  const before = html;
  html = html.replace(re, `$1${a}?v=${v}$2`);
  if (html !== before) changed.push(`${a}?v=${v}`);
}

fs.writeFileSync(HTML, html);
console.log(changed.length
  ? "  stamped: " + changed.join("  ")
  : "  nothing to stamp");
