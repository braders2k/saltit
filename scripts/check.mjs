// Pre-launch checks for the brief's acceptance criteria. Run: node scripts/check.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = new URL("../site/", import.meta.url).pathname;
const repoRoot = new URL("../", import.meta.url).pathname;
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

const spelling = [/SaltIT/, /Salt Dean/i, /Salt-dean/i, /Southend/i, /01x{3}/i];
for (const f of files) {
  const src = read(f);
  for (const re of spelling) if (re.test(src)) errors.push(`${f.replace(root, "")}: forbidden "${re.source}"`);
  const visibleSrc = src.replace(/<!--[\s\S]*?-->/g, " ");
  if (/\bAI\b/.test(visibleSrc)) errors.push(`${f.replace(root, "")}: forbidden "AI" in visible text`);
}

const count = (needle) => visible.split(needle).length - 1;
const phrases = [
  "HOME IT SUPPORT — SALTDEAN & NEARBY",
  "computer repair Saltdean",
  "computer help Peacehaven",
  "PC repair Rottingdean",
  "home visit computer repair Woodingdean",
  "Wi-Fi help Brighton",
];
for (const p of phrases) {
  const n = count(p);
  if (n !== 1) errors.push(`SEO phrase "${p}" appears ${n} times (want 1)`);
}
for (const banned of ["before I travel", "before I visit", "before travelling", "before the visit"]) {
  if (visible.toLowerCase().includes(banned.toLowerCase())) errors.push(`Banned price timing phrase "${banned}" is still visible`);
}
for (const area of ["Saltdean", "Rottingdean", "Peacehaven", "Woodingdean", "Brighton & Hove"]) {
  if (!count(area)) errors.push(`Area "${area}" missing from visible copy`);
}
if ((html.match(/<h1[\s>]/g) || []).length !== 1) errors.push("Page must have exactly one <h1>");
for (const price of ["First hour £35", "Home visit, first hour £35", "Each extra half hour £15", "Remote support, per hour £30", "Saturday visit, first hour £60", "£35–£70", "£80–£110", "£70–£130"]) {
  if (!count(price)) errors.push(`Price ${price} missing`);
}
if (/30 minutes/i.test(visible)) errors.push("Old remote 30-minute framing is still visible");
for (const retired of ["£95", "£60–£90", "£90–£130", "First hour £60", "Each extra half hour £30"]) {
  if (count(retired)) errors.push(`Retired price "${retired}" is still visible`);
}
const desc = html.match(/<meta name="description" content="([^"]+)"/);
if (!desc || desc[1].length >= 160) errors.push("Meta description missing or 160+ characters");
if (!desc?.[1].includes("First hour £35")) errors.push("Meta description should publish first hour £35");
const og = html.match(/<meta property="og:description" content="([^"]+)"/);
if (!og?.[1].includes("First hour £35")) errors.push("Open Graph description should publish first hour £35");
try {
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  if (ld.name !== "Salt IT" || ld.areaServed.length !== 5 || ld.priceRange !== "£15–£130") errors.push("JSON-LD fields incomplete");
  if (!/^\+44\d{10}$/.test(ld.telephone)) errors.push(`JSON-LD telephone "${ld.telephone}" is not E.164`);
  for (const [, tel] of html.matchAll(/href="tel:([^"]*)"/g)) {
    if (tel !== ld.telephone) errors.push(`tel: link "${tel}" does not match JSON-LD telephone`);
  }
  const waText = "Hi Simon, I need help with...";
  const expectedWa = `https://wa.me/${ld.telephone.replace("+", "")}?text=${encodeURIComponent(waText)}`;
  const waLinks = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)].map((m) => m[1]);
  if (waLinks.length < 5) errors.push(`WhatsApp links: ${waLinks.length} (want at least 5)`);
  const parsedWa = new URL(expectedWa);
  if (parsedWa.searchParams.get("text") !== waText) errors.push("WhatsApp text does not round-trip through one decode");
  if (/%25/.test(parsedWa.search)) errors.push("WhatsApp text is double-encoded");
  const deep = `whatsapp://send?phone=${parsedWa.pathname.replace(/\D/g, "")}&text=${encodeURIComponent(parsedWa.searchParams.get("text"))}`;
  if (new URL(deep).searchParams.get("text") !== waText) errors.push("whatsapp:// draft text does not round-trip");
  for (const href of waLinks) {
    if (href !== expectedWa) errors.push(`WhatsApp link "${href}" does not match ${expectedWa}`);
  }
  const pageJs = read(join(root, "script.js"));
  if (!pageJs.includes("whatsapp://send?phone=")) errors.push("Mobile WhatsApp draft scheme missing from script.js");
  if (!pageJs.includes("encodeURIComponent(text)")) errors.push("WhatsApp draft text must be encoded once in script.js");
} catch {
  errors.push("JSON-LD missing or invalid");
}

const phCount = (html.match(/REPLACE_WITH_PHONE/g) || []).length;
if (phCount) blockers.push(`Phone: ${phCount} × REPLACE_WITH_PHONE (tel: links and JSON-LD)`);
const phText = (html.match(/Add phone before launch/g) || []).length;
if (phText) blockers.push(`Phone: ${phText} × "Add phone before launch" (visible number)`);
for (const m of html.matchAll(/data-todo[^>]*>([^<]+)</g)) blockers.push(m[1].trim());

const sitemap = read(join(root, "sitemap.xml"));
if (!sitemap.includes("<loc>https://saltit.co.uk/</loc>")) errors.push("sitemap.xml is missing the homepage loc");
const vercel = JSON.parse(read(join(repoRoot, "vercel.json")));
const documentOnly = new Set(["Content-Security-Policy", "Permissions-Policy"]);
const htmlSources = new Set(["/", "/index.html"]);
let homepageCsp = false;
for (const rule of vercel.headers || []) {
  for (const header of rule.headers || []) {
    if (!documentOnly.has(header.key)) continue;
    if (!htmlSources.has(rule.source)) errors.push(`${header.key} is not limited to HTML (source ${rule.source})`);
    if (header.key === "Content-Security-Policy" && rule.source === "/") homepageCsp = true;
  }
}
if (!homepageCsp) errors.push("Homepage is missing Content-Security-Policy");

const sectionNums = [...html.matchAll(/<p class="idx"><span>(\d{2})<\/span>/g)].map((m) => m[1]);
const expectedNums = ["01", "02", "03", "04", "05", "06"];
if (sectionNums.join(",") !== expectedNums.join(",")) {
  errors.push(`Section numbers ${sectionNums.join(", ") || "(none)"} (want ${expectedNums.join(", ")})`);
}

for (const e of errors) console.error(`ERROR    ${e}`);
for (const b of blockers) console.warn(`BLOCKER  ${b}`);
if (!errors.length && !blockers.length) console.log("All checks passed. Ready for launch.");
else if (!errors.length) console.log(`\nContent checks passed. ${blockers.length} launch blocker(s) left for Brad.`);
process.exit(errors.length || blockers.length ? 1 : 0);
