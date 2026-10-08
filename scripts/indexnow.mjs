// Tell IndexNow search engines (Bing, Yandex, etc.) that the site's pages changed.
// Spec: https://www.indexnow.org/documentation
// Run after a deploy is live: node scripts/indexnow.mjs   (or --dry-run to print the payload only)
import { readdirSync, readFileSync } from "node:fs";

const HOST = "saltit.co.uk";
const SITEMAP = `https://${HOST}/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const dryRun = process.argv.includes("--dry-run");

// The key is the name (and the content) of the single 32-hex .txt file in site/.
const siteDir = new URL("../site/", import.meta.url);
const keyFiles = readdirSync(siteDir).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (keyFiles.length !== 1) throw new Error(`Expected one <32-hex>.txt key file in site/, found ${keyFiles.length}`);
const key = keyFiles[0].slice(0, -4);
if (readFileSync(new URL(keyFiles[0], siteDir), "utf8") !== key) throw new Error(`site/${keyFiles[0]} must contain only the key`);

const res = await fetch(SITEMAP);
if (!res.ok) throw new Error(`${SITEMAP} returned HTTP ${res.status}`);
const urlList = [...(await res.text()).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);
if (!urlList.length) throw new Error(`No <loc> URLs found in ${SITEMAP}`);
const offHost = urlList.filter((u) => new URL(u).host !== HOST);
if (offHost.length) throw new Error(`URLs not on ${HOST}: ${offHost.join(", ")}`);
if (urlList.length > 10000) throw new Error(`${urlList.length} URLs; IndexNow allows up to 10,000 per post`);

const payload = { host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList };
console.log(`${urlList.length} URLs from ${SITEMAP}`);

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
