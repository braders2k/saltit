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
// The booking form (/book/) shares this handler, with kind: "booking".
// Bookings also get a minimum fill time and a per-IP rate limit. The honeypot applies to both.

export const config = { runtime: "edge" };

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const AREAS = new Set([
  "Saltdean",
  "Rottingdean",
  "Peacehaven",
  "Woodingdean",
  "Telscombe Cliffs",
  "Ovingdean",
  "Brighton & Hove",
  "Somewhere else",
]);

const BOOKING_AREAS = new Set([
  "Saltdean",
  "Rottingdean",
  "Woodingdean",
  "Ovingdean",
  "Telscombe Cliffs",
  "Peacehaven",
  "Brighton & Hove",
  "Other",
]);

const PROBLEM_TYPES = new Set([
  "Wi-Fi help",
  "Laptop & PC repair",
  "Printer setup",
  "Virus & scam clean-up",
  "Computer help for Mum & Dad",
  "Email that's stopped working",
  "Something else",
]);

const PREFERRED_DAYS = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday or Sunday (by arrangement)",
]);

const PREFERRED_TIMES = new Set(["Morning", "Afternoon", "Evening"]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const MIN_FILL_MS = 3000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 5;
const RATE_MAP_LIMIT = 5000;
const RATE_LIMIT_ERROR = "Too many requests. Please wait a few minutes, or call 07843 468904.";

// Booking attempts per IP. This is per Edge instance and best-effort: instances
// do not share memory, and a cold start clears it.
const bookingAttempts = new Map();

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

// A missing list counts as no choice. Anything else must be an array where every
// item is on the list. The result keeps the list's order and has no repeats.
const pickListed = (value, listed) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((item) => listed.has(item))) return null;
  return [...listed].filter((item) => value.includes(item));
};

// The first x-forwarded-for entry, else x-real-ip, else one shared bucket.
const clientIp = (request) =>
  headerValue(request, "x-forwarded-for").split(",")[0].trim() ||
  headerValue(request, "x-real-ip").trim() ||
  "unknown";

const pruneBookingAttempts = (cutoff) => {
  for (const [ip, stamps] of bookingAttempts) {
    if (Math.max(...stamps) <= cutoff) bookingAttempts.delete(ip);
  }
  if (bookingAttempts.size > RATE_MAP_LIMIT) bookingAttempts.clear();
};

// Returns false once an IP has RATE_MAX_ATTEMPTS in the last ten minutes.
// Every call first drops addresses with no attempt in the last ten minutes.
// This runs before validation, so a bad booking uses up an attempt too.
const allowBookingAttempt = (ip, now) => {
  const cutoff = now - RATE_WINDOW_MS;
  pruneBookingAttempts(cutoff);
  const recent = (bookingAttempts.get(ip) || []).filter((stamp) => stamp > cutoff);
  if (recent.length >= RATE_MAX_ATTEMPTS) {
    bookingAttempts.set(ip, recent);
    return false;
  }
  recent.push(now);
  bookingAttempts.set(ip, recent);
  return true;
};

// The Web3Forms call for either form. The timeout, the server-block handoff and
// the 502 mailto fallback are shared. logLabel prefixes the log lines.
const deliver = async (request, key, payload, submission, logLabel) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
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
    console.error(`${logLabel}: Web3Forms did not accept the submission`, {
      status: upstream.status,
      blocked,
      nonJson: !contentType.includes("json"),
      message: safeMessage(data, key),
    });
    if (blocked) return clientHandoff(request, key, submission);
    return send(502, { ok: false, fallback: "mailto" });
  } catch (err) {
    console.error(`${logLabel}: Web3Forms request failed`, {
      name: err && err.name ? err.name : "Error",
    });
    return clientHandoff(request, key, submission);
  } finally {
    clearTimeout(timer);
  }
};

const handleBooking = async (request, body) => {
  if (clip(body.hp_field, 200)) return send(200, { ok: true });

  const elapsed = Number(body.elapsed_ms);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return send(200, { ok: true });

  if (!allowBookingAttempt(clientIp(request), Date.now())) {
    return send(429, { ok: false, error: RATE_LIMIT_ERROR });
  }

  const name = clip(body.name, 80);
  const phone = clip(body.phone, 40);
  // Clipped one past the limit, so a longer address is rejected rather than cut short.
  const email = clip(body.email, EMAIL_MAX + 1);
  const area = clip(body.area, 40);
  const problemType = clip(body.problem_type, 40);
  const description = clip(body.description, 1000, true);
  const days = pickListed(body.days, PREFERRED_DAYS);
  const times = pickListed(body.times, PREFERRED_TIMES);
  const emailOk = !email || (email.length <= EMAIL_MAX && EMAIL_PATTERN.test(email));

  if (
    !name ||
    !phone ||
    !description ||
    !emailOk ||
    !BOOKING_AREAS.has(area) ||
    !PROBLEM_TYPES.has(problemType) ||
    !days ||
    !times
  ) {
    return send(400, { ok: false, error: "Missing fields" });
  }

  const key = String(process.env.WEB3FORMS_ACCESS_KEY || "").trim();
  if (!key) return send(200, { ok: false, fallback: "mailto" });

  const submission = { kind: "booking", name, phone, email, area, problemType, days, times, description };
  // No email, replyto or autoresponse keys here. Those can trigger a Web3Forms
  // auto-reply, so the customer's address goes in customer_email.
  return deliver(
    request,
    key,
    {
      access_key: key,
      subject: `Visit request — ${area} — ${name}`,
      from_name: name,
      request: "Visit request (not confirmed until Simon calls or texts)",
      name,
      phone,
      customer_email: email || "Not given",
      area,
      problem_type: problemType,
      preferred_days: days.join(", ") || "No preference",
      preferred_times: times.join(", ") || "No preference",
      message: description,
    },
    submission,
    "booking",
  );
};

export default async function handler(request) {
  if (request.method !== "POST") {
    return send(405, { ok: false, error: "Method not allowed" }, { allow: "POST" });
  }

  const body = await readBody(request);
  if (body.kind === "booking") return handleBooking(request, body);

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

  return deliver(
    request,
    key,
    {
      access_key: key,
      subject: `Home visit enquiry — ${area} — ${name}`,
      from_name: name,
      name,
      phone,
      area,
      booking_for_someone_else: forSomeoneElse ? "Yes" : "No",
      message: problem,
    },
    submission,
    "enquiry",
  );
}
