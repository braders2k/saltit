// Pre-launch checks for the brief's acceptance criteria. Run: node scripts/check.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = new URL("../site/", import.meta.url).pathname;
const textExt = new Set([".html", ".css", ".js", ".txt", ".xml", ".svg"]);

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (textExt.has(extname(name)) || name === "_headers") files.push(p);
  }
};
walk(root);

const read = (p) => readFileSync(p, "utf8");
const html = read(join(root, "index.html"));
const visible = html
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ");

const errors = [];
const blockers = [];

const spelling = [/SaltIT/, /Salt Dean/i, /Salt-dean/i, /Southend/i, /\bAI\b/, /01x{3}/i];
for (const f of files) {
  const src = read(f);
  for (const re of spelling) if (re.test(src)) errors.push(`${f.replace(root, "")}: forbidden "${re.source}"`);
}

const count = (needle) => visible.split(needle).length - 1;
const phrases = [
  "IT support in Saltdean",
  "Computer repair in Saltdean",
  "computer help in Peacehaven",
  "PC repair in Rottingdean",
  "computer repair in Woodingdean",
  "Wi-Fi help across Brighton",
];
for (const p of phrases) {
  const n = count(p);
  if (n !== 1) errors.push(`SEO phrase "${p}" appears ${n} times (want 1)`);
}
for (const area of ["Saltdean", "Rottingdean", "Peacehaven", "Woodingdean", "Brighton & Hove"]) {
  if (!count(area)) errors.push(`Area "${area}" missing from visible copy`);
}
if ((html.match(/<h1[\s>]/g) || []).length !== 1) errors.push("Page must have exactly one <h1>");
for (const price of ["£75", "£30", "£35", "£95", "£75–£90", "£80–£110", "£90–£130"]) {
  if (!count(price)) errors.push(`Price ${price} missing`);
}
const desc = html.match(/<meta name="description" content="([^"]+)"/);
if (!desc || desc[1].length >= 160) errors.push("Meta description missing or 160+ characters");
try {
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  if (ld.name !== "Salt IT" || ld.areaServed.length !== 5 || !ld.priceRange) errors.push("JSON-LD fields incomplete");
} catch {
  errors.push("JSON-LD missing or invalid");
}

const phCount = (html.match(/REPLACE_WITH_PHONE/g) || []).length;
if (phCount) blockers.push(`Phone: ${phCount} × REPLACE_WITH_PHONE (tel: links and JSON-LD)`);
const phText = (html.match(/Add phone before launch/g) || []).length;
if (phText) blockers.push(`Phone: ${phText} × "Add phone before launch" (visible number)`);
for (const m of html.matchAll(/data-todo[^>]*>([^<]+)</g)) blockers.push(m[1].trim());

for (const e of errors) console.error(`ERROR    ${e}`);
for (const b of blockers) console.warn(`BLOCKER  ${b}`);
if (!errors.length && !blockers.length) console.log("All checks passed. Ready for launch.");
else if (!errors.length) console.log(`\nContent checks passed. ${blockers.length} launch blocker(s) left for Brad.`);
process.exit(errors.length || blockers.length ? 1 : 0);
