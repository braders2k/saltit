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
// JSON-LD alternateName deliberately lists the misspellings people search for; the name checks skip that one line.
const withoutAltNames = (src) => src.replace(/^\s*"alternateName":.*$/gm, "");
const html = read(join(root, "index.html"));
const visible = html
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&/g, "&")
  .replace(/\s+/g, " ");

const errors = [];
const blockers = [];

const spelling = [/SaltIT/, /Salt Dean/i, /Salt-dean/i, /Southend/i, /01x{3}/i];
for (const f of files) {
  const src = read(f);
  for (const re of spelling) if (re.test(withoutAltNames(src))) errors.push(`${f.replace(root, "")}: forbidden "${re.source}"`);
  const visibleSrc = src.replace(/<!--[\s\S]*?-->/g, " ");
  if (/\bAI\b/.test(visibleSrc)) errors.push(`${f.replace(root, "")}: forbidden "AI" in visible text`);
}

const count = (needle) => visible.split(needle).length - 1;
const phrases = [
  ["HOME IT SUPPORT — SALTDEAN & NEARBY", 1],
  ["computer repair in Saltdean", 2],
  ["computer help in Peacehaven", 1],
  ["PC repair in Rottingdean", 1],
  ["home visit computer repair in Woodingdean", 1],
  ["Wi-Fi help in Brighton", 1],
];
for (const [p, want] of phrases) {
  const n = count(p);
  if (n !== want) errors.push(`SEO phrase "${p}" appears ${n} times (want ${want})`);
}
for (const banned of ["before I visit", "before travelling", "before the visit"]) {
  if (visible.toLowerCase().includes(banned.toLowerCase())) errors.push(`Banned price timing phrase "${banned}" is still visible`);
}
if (/Salt IT(?!\.)/.test(withoutAltNames(html))) errors.push('Customer-facing name must be "Salt I.T."');
if (/aggregateRating|reviewCount/.test(html)) errors.push("Do not publish ratings or review counts");
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
  const graph = ld["@graph"] || [ld];
  const biz = graph.find((node) => node["@type"] === "LocalBusiness");
  const faq = graph.find((node) => node["@type"] === "FAQPage");
  const areaNames = (biz?.areaServed || []).map((area) => area.name);
  if (!biz || biz.name !== "Salt I.T." || areaNames.length !== 5 || biz.priceRange !== "£35+") errors.push("JSON-LD fields incomplete");
  if (biz?.address?.streetAddress) errors.push("JSON-LD must not invent a street address");
  if (biz?.aggregateRating || biz?.review) errors.push("JSON-LD must not invent ratings or reviews");
  for (const name of ["Saltdean", "Rottingdean", "Peacehaven", "Woodingdean", "Brighton and Hove"]) {
    if (!areaNames.includes(name)) errors.push(`JSON-LD areaServed missing ${name}`);
  }
  if (!faq || faq.mainEntity?.length !== 8) errors.push("FAQPage JSON-LD should list eight questions");
  if (!/^\+44\d{10}$/.test(biz?.telephone || "")) errors.push(`JSON-LD telephone "${biz?.telephone}" is not E.164`);
  for (const [, tel] of html.matchAll(/href="tel:([^"]*)"/g)) {
    if (tel !== biz.telephone) errors.push(`tel: link "${tel}" does not match JSON-LD telephone`);
  }
  const waText = "Hi Simon, I need help with...";
  const expectedWa = `https://wa.me/${biz.telephone.replace("+", "")}?text=${encodeURIComponent(waText)}`;
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

const servicePages = ["wifi-help", "virus-scam-cleanup", "laptop-pc-repair", "printer-setup", "help-for-parents"];
const sitemap = read(join(root, "sitemap.xml"));
if (!sitemap.includes("<loc>https://saltit.co.uk/</loc>")) errors.push("sitemap.xml is missing the homepage loc");
const vercel = JSON.parse(read(join(repoRoot, "vercel.json")));
const documentOnly = new Set(["Content-Security-Policy", "Permissions-Policy"]);
const servicePagesSource = `/:service(${servicePages.join("|")})(/|/index\\.html)?`;
const htmlSources = new Set(["/", "/index.html", servicePagesSource]);
let homepageCsp = false;
let servicePagesCsp = false;
for (const rule of vercel.headers || []) {
  for (const header of rule.headers || []) {
    if (!documentOnly.has(header.key)) continue;
    if (!htmlSources.has(rule.source)) errors.push(`${header.key} is not limited to HTML (source ${rule.source})`);
    if (header.key === "Content-Security-Policy" && rule.source === "/") homepageCsp = true;
    if (header.key === "Content-Security-Policy" && rule.source === servicePagesSource) servicePagesCsp = true;
  }
}
if (!homepageCsp) errors.push("Homepage is missing Content-Security-Policy");
if (!servicePagesCsp) errors.push("Service pages are missing Content-Security-Policy");
const rewriteSources = (vercel.rewrites || []).filter((rule) => rule.destination === "/api/sitemap").map((rule) => rule.source);
for (const source of ["/sitemap.xml", "/sitemap"]) {
  if (!rewriteSources.includes(source)) errors.push(`vercel.json is missing a rewrite from ${source} to /api/sitemap`);
}
const ignore = read(join(repoRoot, ".vercelignore"));
if (!ignore.includes("site/sitemap.xml")) errors.push("site/sitemap.xml must stay out of the Vercel upload");
const { default: sitemapHandler } = await import("../api/sitemap.mjs");
const sitemapRes = await sitemapHandler();
const sitemapType = sitemapRes.headers.get("content-type") || "";
const sitemapBody = await sitemapRes.text();
if (sitemapRes.status !== 200) errors.push(`sitemap handler status ${sitemapRes.status}`);
if (!/^text\/xml;\s*charset=utf-8$/i.test(sitemapType)) errors.push(`sitemap content-type "${sitemapType}"`);
if (sitemapRes.headers.has("content-disposition")) errors.push("sitemap handler must not set Content-Disposition");
if (!sitemapBody.includes("<loc>https://saltit.co.uk/</loc>")) errors.push("sitemap handler is missing the homepage loc");

// Service pages: one job each, not town doorways. Same chrome, NAP and schema rules as the homepage.
for (const slug of servicePages) {
  const loc = `<loc>https://saltit.co.uk/${slug}/</loc>`;
  if (!sitemap.includes(loc)) errors.push(`sitemap.xml is missing ${loc}`);
  if (!sitemapBody.includes(loc)) errors.push(`sitemap handler is missing ${loc}`);
  if (!html.includes(`href="/${slug}/"`)) errors.push(`Homepage does not link to /${slug}/`);

  let page;
  try { page = read(join(root, slug, "index.html")); } catch { errors.push(`/${slug}/index.html is missing`); continue; }
  const at = `/${slug}/`;
  if ((page.match(/<h1[\s>]/g) || []).length !== 1) errors.push(`${at}: must have exactly one <h1>`);
  if (!page.includes(`<link rel="canonical" href="https://saltit.co.uk/${slug}/">`)) errors.push(`${at}: canonical URL is wrong`);
  if (/Salt IT(?!\.)/.test(withoutAltNames(page))) errors.push(`${at}: customer-facing name must be "Salt I.T."`);
  if (/aggregateRating|reviewCount/.test(page)) errors.push(`${at}: do not publish ratings or review counts`);
  if (/(?:src|href)="(?!\/|#|https?:|tel:|mailto:)/.test(page)) errors.push(`${at}: relative link or asset path (use root-absolute paths)`);
  if (/style="/.test(page)) errors.push(`${at}: inline style attribute is blocked by the CSP`);
  const pageDesc = page.match(/<meta name="description" content="([^"]+)"/);
  if (!pageDesc || pageDesc[1].length >= 160) errors.push(`${at}: meta description missing or 160+ characters`);
  for (const price of ["Home visit, first hour</th><td>£35", "Each extra half hour</th><td>£15", "Remote support, per hour</th><td>£30", "Saturday visit, first hour</th><td>£60"]) {
    if (!page.includes(price)) errors.push(`${at}: price row "${price.replace(/<[^>]+>/g, " ")}" missing`);
  }
  for (const [, tel] of page.matchAll(/href="tel:([^"]*)"/g)) {
    if (tel !== "+447843468904") errors.push(`${at}: tel: link "${tel}" is wrong`);
  }
  for (const [, href] of page.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)) {
    if (href !== "https://wa.me/447843468904?text=Hi%20Simon%2C%20I%20need%20help%20with...") errors.push(`${at}: WhatsApp link "${href}" is wrong`);
  }
  try {
    const ld = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const graph = ld["@graph"] || [ld];
    const biz = graph.find((node) => node["@type"] === "LocalBusiness");
    const faq = graph.find((node) => node["@type"] === "FAQPage");
    if (!biz || biz.name !== "Salt I.T." || biz.telephone !== "+447843468904" || biz.priceRange !== "£35+") errors.push(`${at}: LocalBusiness JSON-LD incomplete`);
    if (biz?.address?.streetAddress) errors.push(`${at}: JSON-LD must not invent a street address`);
    if (biz?.aggregateRating || biz?.review) errors.push(`${at}: JSON-LD must not invent ratings or reviews`);
    const unescape = (t) => t.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
    const shownQ = [...page.matchAll(/<summary><h3>([\s\S]*?)<\/h3><\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [unescape(m[1]), unescape(m[2])]);
    const ldQ = (faq?.mainEntity || []).map((q) => [q.name, q.acceptedAnswer?.text]);
    if (!shownQ.length || JSON.stringify(shownQ) !== JSON.stringify(ldQ)) errors.push(`${at}: FAQPage JSON-LD does not match the visible FAQ`);
  } catch {
    errors.push(`${at}: JSON-LD missing or invalid`);
  }
}

const sectionNums = [...html.matchAll(/<p class="idx"><span>(\d{2})<\/span>/g)].map((m) => m[1]);
const expectedNums = ["01", "02", "03", "04", "05", "06", "07", "08"];
if (sectionNums.join(",") !== expectedNums.join(",")) {
  errors.push(`Section numbers ${sectionNums.join(", ") || "(none)"} (want ${expectedNums.join(", ")})`);
}

for (const e of errors) console.error(`ERROR    ${e}`);
for (const b of blockers) console.warn(`BLOCKER  ${b}`);
if (!errors.length && !blockers.length) console.log("All checks passed. Ready for launch.");
else if (!errors.length) console.log(`\nContent checks passed. ${blockers.length} launch blocker(s) left for Brad.`);
process.exit(errors.length || blockers.length ? 1 : 0);
