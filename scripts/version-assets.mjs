// Stamp ?v=<content hash> on the CSS/JS references so vercel.json can cache them for a year (immutable).
// Run after editing styles.css, script.js, consent.js or ga4.js: node scripts/version-assets.mjs
// scripts/check.mjs fails if a stamp is stale.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../site/", import.meta.url).pathname;
// ga4.js first: consent.js references it, so consent.js's hash depends on ga4.js's stamp.
export const versioned = ["ga4.js", "consent.js", "script.js", "styles.css"];
export const hashOf = (name) => createHash("sha256").update(readFileSync(join(root, name))).digest("hex").slice(0, 8);
export const refPattern = (name) => new RegExp(`((?:href|src)="|addScript\\(")(/?${name.replace(".", "\\.")})(?:\\?v=[0-9a-f]+)?"`, "g");

const pages = (dir = root, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) pages(p, out);
    else if (name.endsWith(".html") || name.endsWith(".js")) out.push(p);
  }
  return out;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const name of versioned) {
    const v = hashOf(name);
    for (const p of pages()) {
      const src = readFileSync(p, "utf8");
      const next = src.replace(refPattern(name), `$1$2?v=${v}"`);
      if (next !== src) writeFileSync(p, next);
    }
    console.log(`${name}?v=${v}`);
  }
}
