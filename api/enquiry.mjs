// Posts the contact form to Web3Forms when WEB3FORMS_ACCESS_KEY is set.
// Node fetch from a Vercel serverless function is rejected: a Cloudflare
// challenge, or HTTP 403 "This method is not allowed" for a plain HTTPS
// client. The same call from the Vercel Edge runtime reaches the real
// Web3Forms API (a bad key comes back as "invalid access key", not the
// server-side block), so this handler runs on the Edge and returns
// { ok: true } when Web3Forms accepts the note.
// If that call is blocked, a page on this site can still submit. Mailto
// remains for a missing key or a real Web3Forms rejection.
// Do not commit the key, and do not log it.

export const config = { runtime: "edge" };

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

const headerValue = (request, name) => request.headers.get(name) || "";

// The access key is a public form alias. It is only returned to this site,
// so a curl of /api/enquiry does not print it.
const browserMaySubmit = (request) => {
  const origin = headerValue(request, "origin") || headerValue(request, "referer");
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

const send = (status, body, extra) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      vary: "Origin",
      ...extra,
    },
  });

const clientHandoff = (request, key, submission) => {
  if (!browserMaySubmit(request)) return send(200, { ok: false, fallback: "client" });
  return send(200, { ok: false, fallback: "client", accessKey: key, submission });
};

const readBody = async (request) => {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return send(405, { ok: false, error: "Method not allowed" }, { allow: "POST" });
  }

  const body = await readBody(request);
  if (clip(body.hp_field, 200)) return send(200, { ok: true });

  const name = clip(body.name, 80);
  const phone = clip(body.phone, 40);
  const area = clip(body.area, 40);
  const problem = clip(body.problem, 2000, true);
  const forSomeoneElse = body.for_someone_else === "yes" || body.for_someone_else === true;
  const submission = { name, phone, area, problem, forSomeoneElse };

  if (!name || !phone || !problem || !AREAS.has(area)) {
    return send(400, { ok: false, error: "Missing fields" });
  }

  const key = String(process.env.WEB3FORMS_ACCESS_KEY || "").trim();
  if (!key) return send(200, { ok: false, fallback: "mailto" });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
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
      signal: controller.signal,
    });
    const contentType = upstream.headers.get("content-type") || "";
    let data = {};
    if (contentType.includes("json")) {
      data = await upstream.json().catch(() => ({}));
    } else {
      await upstream.arrayBuffer().catch(() => null);
    }
    if (upstream.ok && data.success === true) return send(200, { ok: true });

    const blocked = serverBlocked(upstream.status, contentType, data);
    console.error("enquiry: Web3Forms did not accept the submission", {
      status: upstream.status,
      blocked,
      nonJson: !contentType.includes("json"),
      message: safeMessage(data, key),
    });
    if (blocked) return clientHandoff(request, key, submission);
    return send(502, { ok: false, fallback: "mailto" });
  } catch (err) {
    console.error("enquiry: Web3Forms request failed", {
      name: err && err.name ? err.name : "Error",
    });
    return clientHandoff(request, key, submission);
  } finally {
    clearTimeout(timer);
  }
}
