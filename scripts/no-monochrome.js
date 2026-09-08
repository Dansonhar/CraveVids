#!/usr/bin/env node
/* Colour lock. Fails if anything would drain the colour out of the product
   footage. Run by `npm run guard` and by .git/hooks/pre-commit, so a commit
   that reintroduces greyscale is refused before it can reach the site. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const FILES = ["styles.css", "app.js", "index.html", "videos.js"];

// desaturating CSS on anything, and any filter aimed at a <video>
const BANNED = [
  { re: /grayscale\s*\(\s*(?!0\s*\)|0%\s*\))/i, why: "grayscale() drains the footage" },
  { re: /saturate\s*\(\s*0\s*%?\s*\)/i,          why: "saturate(0) drains anything behind it" },
  { re: /\bsepia\s*\(\s*(?!0)/i,                 why: "sepia() tints the footage" },
  { re: /\bhue-rotate\s*\(\s*(?!0)/i,            why: "hue-rotate() shifts the colour" },
];
// the deliberate exception: the lock rule itself, and comments about it
const ALLOW = /colour lock|never saturate|no filter|original colour|DO NOT REMOVE|-moz-osx-font-smoothing/i;

let bad = [];
for (const f of FILES) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  fs.readFileSync(p, "utf8").split("\n").forEach((line, i) => {
    if (ALLOW.test(line)) return;
    for (const b of BANNED) if (b.re.test(line)) bad.push({ f, n: i + 1, line: line.trim(), why: b.why });
  });
}

if (!bad.length) {
  console.log("  colour lock: ok — nothing desaturates the footage");
  process.exit(0);
}

console.error("\n  ✗ COLOUR LOCK: the product footage must keep its original colour.\n");
for (const b of bad) {
  console.error(`    ${b.f}:${b.n}  ${b.why}`);
  console.error(`      ${b.line.slice(0, 96)}`);
}
console.error("\n  Remove it. This is a hard project rule — greyscale on the videos is not wanted.\n");
process.exit(1);
