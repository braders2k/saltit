// Posts the contact form to Web3Forms when WEB3FORMS_ACCESS_KEY is set on Vercel.
// Without that key the handler asks the page to open a mailto fallback.
// Create a free key at https://web3forms.com for hello@saltit.co.uk, then add
// WEB3FORMS_ACCESS_KEY to the saltit project (Production and Preview). Do not commit it.

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = readBody(req);
  if (clip(body.hp_field, 200)) {
    res.status(200).json({ ok: true });
    return;
  }

  const name = clip(body.name, 80);
  const phone = clip(body.phone, 40);
  const area = clip(body.area, 40);
  const problem = clip(body.problem, 2000, true);
  const forSomeoneElse = body.for_someone_else === "yes" || body.for_someone_else === true;

  if (!name || !phone || !problem || !AREAS.has(area)) {
    res.status(400).json({ ok: false, error: "Missing fields" });
    return;
  }

  const key = process.env.WEB3FORMS_ACCESS_KEY;
  if (!key) {
    // 200 so the designed mailto fallback is not a failed request in the browser.
    res.status(200).json({ ok: false, fallback: "mailto" });
    return;
  }

  try {
    const upstream = await fetch("https://api.web3forms.com/submit", {
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
        botcheck: "",
      }),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || data.success !== true) {
      res.status(502).json({ ok: false, fallback: "mailto" });
      return;
    }
    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ ok: false, fallback: "mailto" });
  }
};
