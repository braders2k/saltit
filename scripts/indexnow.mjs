// Tell IndexNow search engines (Bing, Yandex, etc.) which of the site's pages changed.
// Spec: https://www.indexnow.org/documentation  (submit changed URLs only, not the whole site)
// Run after a deploy is live. Exactly one mode per run; add --dry-run to print the payload only.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const HOST = "saltit.co.uk";
const ORIGIN = `https://${HOST}`;
const SITEMAP = `${ORIGIN}/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const USAGE = `Usage:
  node scripts/indexnow.mjs <url-or-path> [...]   submit these URLs (e.g. /wifi-help/ or ${ORIGIN}/peacehaven/)
  node scripts/indexnow.mjs --since <git-ref>     submit pages changed in <git-ref>..HEAD (e.g. --since HEAD~1)
  node scripts/indexnow.mjs --all                 submit every sitemap URL (full resubmit only)
Add --dry-run to any mode to print the payload without sending it.`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Parse arguments: one of explicit URLs, --since <ref> or --all, plus optional --dry-run.
let dryRun = false;
let all = false;
let since = null;
const given = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--dry-run") dryRun = true;
  else if (arg === "--all") all = true;
  else if (arg === "--since") {
    since = args[++i];
    if (!since || since.startsWith("-")) fail(`--since needs a git ref\n\n${USAGE}`);
  } else if (arg.startsWith("-")) fail(`Unknown option ${arg}\n\n${USAGE}`);
  else given.push(arg);
}
const modes = [all, since !== null, given.length > 0].filter(Boolean).length;
if (modes !== 1) {
  console.error(modes ? `Use exactly one mode per run.\n\n${USAGE}` : USAGE);
  process.exit(2);
}

// The key is the name (and the content) of the single 32-hex .txt file in site/.
const siteDir = new URL("../site/", import.meta.url);
const keyFiles = readdirSync(siteDir).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (keyFiles.length !== 1) throw new Error(`Expected one <32-hex>.txt key file in site/, found ${keyFiles.length}`);
const key = keyFiles[0].slice(0, -4);
if (readFileSync(new URL(keyFiles[0], siteDir), "utf8") !== key) throw new Error(`site/${keyFiles[0]} must contain only the key`);

async function sitemapUrls() {
  const res = await fetch(SITEMAP);
  if (!res.ok) throw new Error(`${SITEMAP} returned HTTP ${res.status}`);
  const urls = [...(await res.text()).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error(`No <loc> URLs found in ${SITEMAP}`);
  return urls;
}

// site/index.html -> /, site/<dir>/index.html -> /<dir>/. Anything else is not a page.
function pageUrl(file) {
  if (file === "site/index.html") return `${ORIGIN}/`;
  const m = file.match(/^site\/(.+\/)index\.html$/);
  return m ? `${ORIGIN}/${m[1]}` : null;
}

let urlList;
if (all) {
  urlList = await sitemapUrls();
  console.log(`${urlList.length} URLs from ${SITEMAP}`);
} else if (since !== null) {
  const repo = new URL("..", import.meta.url);
  const files = execFileSync("git", ["diff", "--name-only", `${since}..HEAD`, "--", "site/"], { cwd: repo, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const changed = [];
  const ignored = [];
  for (const file of files) {
    const url = pageUrl(file);
    if (url) changed.push(url);
    else ignored.push(file);
  }
  console.log(`${files.length} file(s) changed in site/ since ${since}: ${changed.length} page(s), ${ignored.length} other`);
  if (ignored.length) console.log(`Ignored (not pages): ${ignored.join(", ")}`);
  const inSitemap = new Set(await sitemapUrls());
  urlList = changed.filter((u) => inSitemap.has(u));
  for (const u of changed.filter((u) => !inSitemap.has(u))) console.log(`Skipped (not in sitemap): ${u}`);
} else {
  urlList = given.map((arg) => {
    let url;
    try {
      url = new URL(arg, arg.startsWith("/") ? ORIGIN : undefined);
    } catch {
      fail(`Not a URL or site path: ${arg}`);
    }
    if (url.protocol !== "https:" || url.host !== HOST) fail(`Rejected ${arg}: only ${ORIGIN}/... URLs or site paths are allowed`);
    url.hash = "";
    return url.href;
  });
}

urlList = [...new Set(urlList)];
const offHost = urlList.filter((u) => new URL(u).host !== HOST);
if (offHost.length) throw new Error(`URLs not on ${HOST}: ${offHost.join(", ")}`);
if (urlList.length > 10000) throw new Error(`${urlList.length} URLs; IndexNow allows up to 10,000 per post`);
if (!urlList.length) {
  console.log("Nothing to submit");
  process.exit(0);
}

const payload = { host: HOST, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList };
console.log(`Submitting ${urlList.length} URL(s)`);

if (dryRun) {
  console.log(`Dry run: would POST to ${ENDPOINT}`);
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

// Response table from the spec.
const meaning = {
  200: "OK: URL submitted successfully.",
  202: "Accepted: URL received. IndexNow key validation pending.",
  400: "Bad request: invalid format.",
  403: "Forbidden: key not valid (e.g. key not found, file found but key not in the file).",
  422: "Unprocessable Entity: URLs don't belong to the host, or the key doesn't match the schema in the protocol.",
  429: "Too Many Requests: potential spam. Wait before submitting again.",
};
const reply = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
const body = await reply.text();
console.log(`HTTP ${reply.status} ${reply.statusText}`);
if (body) console.log(body);
console.log(meaning[reply.status] || "Not in the IndexNow response table.");
if (reply.status !== 200 && reply.status !== 202) process.exitCode = 1;
