// Posts the contact form to Web3Forms when WEB3FORMS_ACCESS_KEY is set on Vercel.
// Web3Forms is a browser API. A serverless call is rejected (HTTP 403
// "This method is not allowed", or a Cloudflare challenge to Node fetch).
// That used to become a 502 and the page opened mailto. When the upstream
// blocks the server, this handler hands the public access key to a page on
// this site so the browser can submit. Mailto remains for a missing key or
// a real Web3Forms failure. Do not commit the key, and do not log it.
// Create a free key at https://web3forms.com for support@saltit.co.uk, then add
// WEB3FORMS_ACCESS_KEY to the saltit project (Production, Preview and Development).

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const AREAS = new Set([
  "Saltdean",
  "Rottingdean",
  "Peacehaven",
  "Woodingdean",
  "Brighton & Hove",
  "Somewhere else",
]);

const clip = (value, max, keepBreaks) => {
  let text = String(value ?? "");
  text = keepBreaks
    ? text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    : text.replace(/[\u0000-\u001F\u007F]/g, " ");
  return text.trim().slice(0, max);
};

const readBody = (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
};

const headerValue = (req, name) => {
  const headers = req.headers || {};
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return String(raw[0] ?? "");
  return typeof raw === "string" ? raw : "";
};

// The access key is a public form alias, but it is only returned to this site
// so a curl of /api/enquiry does not print it into logs.
const browserMaySubmit = (req) => {
  const origin = headerValue(req, "origin") || headerValue(req, "referer");
  if (!origin) return false;
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === "saltit.co.uk" || host === "www.saltit.co.uk") return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "saltit.vercel.app") return true;
  return host.startsWith("saltit") && host.endsWith("-sis-projects-607c3063.vercel.app");
};

const safeMessage = (data, key) => {
  const message = data && typeof data.message === "string" ? data.message : "";
  let text = message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[redacted]")
    .slice(0, 160);
  if (key && text.includes(key)) text = text.replaceAll(key, "[redacted]");
  return text;
};

const serverBlocked = (status, contentType, data) => {
  if (status === 403 || status === 429) return true;
  if (!String(contentType || "").includes("json")) return true;
  const message = data && typeof data.message === "string" ? data.message : "";
  return /not allowed|client side|server ip|too many requests/i.test(message);
};

const send = (res, status, body) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  res.status(status).json(body);
};

const clientHandoff = (req, res, key, submission) => {
  if (!browserMaySubmit(req)) {
    send(res, 200, { ok: false, fallback: "client" });
    return;
  }
  send(res, 200, {
    ok: false,
    fallback: "client",
    accessKey: key,
    submission,
  });
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    send(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const body = readBody(req);
  if (clip(body.hp_field, 200)) {
    send(res, 200, { ok: true });
    return;
  }

  const name = clip(body.name, 80);
  const phone = clip(body.phone, 40);
  const area = clip(body.area, 40);
  const problem = clip(body.problem, 2000, true);
  const forSomeoneElse = body.for_someone_else === "yes" || body.for_someone_else === true;
  const submission = { name, phone, area, problem, forSomeoneElse };

  if (!name || !phone || !problem || !AREAS.has(area)) {
    send(res, 400, { ok: false, error: "Missing fields" });
    return;
  }

  const key = String(process.env.WEB3FORMS_ACCESS_KEY || "").trim();
  if (!key) {
    // 200 so the designed mailto fallback is not a failed request in the browser.
    send(res, 200, { ok: false, fallback: "mailto" });
    return;
  }

  try {
    const upstream = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: key,
        subject: `Home visit enquiry — ${area} — ${name}`,
        from_name: name,
        name,
        phone,
        area,
        booking_for_someone_else: forSomeoneElse ? "Yes" : "No",
        message: problem,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const contentType = upstream.headers.get("content-type") || "";
    let data = {};
    if (contentType.includes("json")) {
      data = await upstream.json().catch(() => ({}));
    } else {
      await upstream.arrayBuffer().catch(() => null);
    }
    if (upstream.ok && data.success === true) {
      send(res, 200, { ok: true });
      return;
    }
    const blocked = serverBlocked(upstream.status, contentType, data);
    console.error("enquiry: Web3Forms did not accept the server submission", {
      status: upstream.status,
      blocked,
      nonJson: !contentType.includes("json"),
      message: safeMessage(data, key),
    });
    if (blocked) {
      clientHandoff(req, res, key, submission);
      return;
    }
    send(res, 502, { ok: false, fallback: "mailto" });
  } catch (err) {
    console.error("enquiry: Web3Forms request failed", {
      name: err && err.name ? err.name : "Error",
    });
    clientHandoff(req, res, key, submission);
  }
};
