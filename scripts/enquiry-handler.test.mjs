import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import handler from "../api/enquiry.mjs";

const KEY = "test-access-key";
const ORIGIN = "https://saltit.co.uk";

const validBody = {
  name: "Ada Lovelace",
  phone: "07843 468904",
  area: "Saltdean",
  problem: "The printer stopped.",
  for_someone_else: "yes",
  hp_field: "",
};

const invoke = async (body, { origin = ORIGIN, method = "POST", envKey = KEY, headers: extraHeaders = {} } = {}) => {
  const previous = process.env.WEB3FORMS_ACCESS_KEY;
  if (envKey === undefined) delete process.env.WEB3FORMS_ACCESS_KEY;
  else process.env.WEB3FORMS_ACCESS_KEY = envKey;
  const headers = { "content-type": "application/json" };
  if (origin) headers.origin = origin;
  Object.assign(headers, extraHeaders);
  const request = new Request("https://saltit.co.uk/api/enquiry", {
    method,
    headers,
    body: JSON.stringify(body ?? {}),
  });
  try {
    const response = await handler(request);
    const outHeaders = {};
    response.headers.forEach((value, name) => {
      outHeaders[name] = value;
    });
    let parsed = null;
    try { parsed = await response.json(); } catch { parsed = null; }
    return { statusCode: response.status, body: parsed, headers: outHeaders };
  } finally {
    if (previous === undefined) delete process.env.WEB3FORMS_ACCESS_KEY;
    else process.env.WEB3FORMS_ACCESS_KEY = previous;
  }
};

let ipCounter = 0;
const freshIp = () => {
  ipCounter += 1;
  return `198.51.100.${ipCounter}`;
};

const validBooking = {
  kind: "booking",
  name: "Test Person",
  phone: "07843 468904",
  email: "",
  area: "Peacehaven",
  problem_type: "Printer setup",
  description: "The printer stopped.",
  days: [],
  times: [],
  elapsed_ms: 5000,
  hp_field: "",
};

// Each booking gets its own IP unless the test names one, so the shared rate limit does not carry over.
const invokeBooking = (body, options = {}) => {
  const headers = { ...options.headers };
  if (!headers["x-forwarded-for"] && !headers["x-real-ip"]) headers["x-forwarded-for"] = freshIp();
  return invoke(body, { ...options, headers });
};

// Web3Forms accepts the call. The returned list collects each body that was sent.
const acceptUpstream = () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ success: true, message: "Email sent successfully!" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  return calls;
};

// Fails the test if the handler calls Web3Forms. The count shows whether it tried.
const refuseUpstream = () => {
  const state = { calls: 0 };
  globalThis.fetch = async () => {
    state.calls += 1;
    throw new Error("fetch should not run");
  };
  return state;
};

describe("enquiry handler", { concurrency: 1 }, () => {
afterEach(() => {
  delete globalThis.fetch;
});

test("missing key asks for mailto and does not call Web3Forms", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error("fetch should not run");
  };
  const res = await invoke(validBody, { envKey: "  " });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: false, fallback: "mailto" });
  assert.equal(called, false);
});

test("invalid fields are rejected before any upstream call", async () => {
  globalThis.fetch = async () => {
    throw new Error("fetch should not run");
  };
  const res = await invoke({ ...validBody, area: "London" });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
  assert.equal("accessKey" in res.body, false);
});

test("a filled honeypot is dropped", async () => {
  globalThis.fetch = async () => {
    throw new Error("fetch should not run");
  };
  const res = await invoke({ ...validBody, hp_field: "https://spam.example" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});

test("upstream success returns ok and does not echo the key", async () => {
  globalThis.fetch = async (_url, init) => {
    const sent = JSON.parse(init.body);
    assert.equal(sent.access_key, KEY);
    assert.equal(sent.booking_for_someone_else, "Yes");
    assert.equal(sent.subject, "Home visit enquiry — Saltdean — Ada Lovelace");
    return new Response(JSON.stringify({ success: true, message: "Email sent successfully!" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const res = await invoke(validBody);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});

test("server 403 hands the key to this site and withholds it from other callers", async () => {
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args);
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        message:
          "This method is not allowed. Use our API in client side or contact support with server IP address (Pro plan is required)",
      }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  try {
    const site = await invoke(validBody);
    assert.equal(site.statusCode, 200);
    assert.equal(site.body.ok, false);
    assert.equal(site.body.fallback, "client");
    assert.equal(site.body.accessKey, KEY);
    assert.equal(site.body.submission.area, "Saltdean");
    assert.equal(site.body.submission.forSomeoneElse, true);
    assert.equal(site.headers["cache-control"], "no-store");

    const curl = await invoke(validBody, { origin: "" });
    assert.deepEqual(curl.body, { ok: false, fallback: "client" });
    assert.equal("accessKey" in curl.body, false);

    const other = await invoke(validBody, { origin: "https://evil.example" });
    assert.equal("accessKey" in other.body, false);
  } finally {
    console.error = original;
  }
  const logged = JSON.stringify(logs);
  assert.equal(logged.includes(KEY), false);
  assert.match(logged, /not allowed/);
});

test("a Cloudflare challenge page is treated as a server block", async () => {
  globalThis.fetch = async () =>
    new Response("<!DOCTYPE html><title>Just a moment...</title>", {
      status: 403,
      headers: { "content-type": "text/html; charset=UTF-8" },
    });
  const res = await invoke(validBody, { origin: "https://saltit-git-preview-sis-projects-607c3063.vercel.app" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.fallback, "client");
  assert.equal(res.body.accessKey, KEY);
});

test("a genuine upstream rejection stays on mailto and omits the key", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ success: false, message: "Invalid access key" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  const res = await invoke(validBody);
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { ok: false, fallback: "mailto" });
});

test("a network failure hands off to the browser", async () => {
  globalThis.fetch = async () => {
    const error = new Error("connect ETIMEDOUT");
    error.name = "TimeoutError";
    throw error;
  };
  const res = await invoke(validBody, { origin: "http://127.0.0.1:8080" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.fallback, "client");
  assert.equal(res.body.accessKey, KEY);
  assert.equal(JSON.stringify(res.body).includes("ETIMEDOUT"), false);
});

test("the contact form still sends the same Web3Forms body", async () => {
  const calls = acceptUpstream();
  const res = await invoke(validBody);
  assert.deepEqual(res.body, { ok: true });
  assert.deepEqual(calls[0].body, {
    access_key: KEY,
    subject: "Home visit enquiry — Saltdean — Ada Lovelace",
    from_name: "Ada Lovelace",
    name: "Ada Lovelace",
    phone: "07843 468904",
    area: "Saltdean",
    booking_for_someone_else: "Yes",
    message: "The printer stopped.",
  });
});

test("the contact form has no rate limit and no minimum fill time", async () => {
  const calls = acceptUpstream();
  for (let i = 0; i < 7; i += 1) {
    const res = await invoke(validBody, { headers: { "x-forwarded-for": "203.0.113.50" } });
    assert.deepEqual(res.body, { ok: true });
  }
  assert.equal(calls.length, 7);
});

test("a booking goes to Web3Forms with its own fields in list order and no auto-reply keys", async () => {
  const calls = acceptUpstream();
  const res = await invokeBooking({
    ...validBooking,
    email: "  ada@example.com  ",
    days: ["Friday", "Monday", "Friday", "Saturday or Sunday (by arrangement)"],
    times: ["Evening", "Morning"],
    description: "The printer stopped.\nIt shows an error.",
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.web3forms.com/submit");
  assert.deepEqual(calls[0].body, {
    access_key: KEY,
    subject: "Visit request — Peacehaven — Test Person",
    from_name: "Test Person",
    request: "Visit request (not confirmed until Simon calls or texts)",
    name: "Test Person",
    phone: "07843 468904",
    customer_email: "ada@example.com",
    area: "Peacehaven",
    problem_type: "Printer setup",
    preferred_days: "Monday, Friday, Saturday or Sunday (by arrangement)",
    preferred_times: "Morning, Evening",
    message: "The printer stopped.\nIt shows an error.",
  });
  for (const key of ["email", "replyto", "reply_to", "autoresponse"]) {
    assert.equal(key in calls[0].body, false);
  }
});

test("a booking with no email, days or times is sent as Not given and No preference", async () => {
  const calls = acceptUpstream();
  const res = await invokeBooking({ ...validBooking, email: "   ", days: [], times: undefined });
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls[0].body.customer_email, "Not given");
  assert.equal(calls[0].body.preferred_days, "No preference");
  assert.equal(calls[0].body.preferred_times, "No preference");
});

test("booking name, phone and description are clipped to 80, 40 and 1000 characters", async () => {
  const calls = acceptUpstream();
  const res = await invokeBooking({
    ...validBooking,
    name: "N".repeat(100),
    phone: "7".repeat(60),
    description: "D".repeat(1200),
  });
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls[0].body.from_name, "N".repeat(80));
  assert.equal(calls[0].body.phone, "7".repeat(40));
  assert.equal(calls[0].body.message, "D".repeat(1000));
});

const rejectedBookings = [
  ["an email that does not look like one", { email: "not-an-email" }],
  ["an email over 254 characters", { email: `${"a".repeat(250)}@example.com` }],
  ["an area outside the booking list", { area: "London" }],
  ["the contact form's area name", { area: "Somewhere else" }],
  ["an unknown problem type", { problem_type: "Broadband" }],
  ["a day outside the list", { days: ["Sunday"] }],
  ["days that are not a list", { days: "Monday" }],
  ["a day that is not text", { days: [1] }],
  ["a time outside the list", { times: ["Night"] }],
  ["a missing description", { description: undefined }],
  ["a blank name", { name: "   " }],
];

for (const [label, change] of rejectedBookings) {
  test(`a booking with ${label} is rejected before any upstream call`, async () => {
    const upstream = refuseUpstream();
    const res = await invokeBooking({ ...validBooking, ...change });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { ok: false, error: "Missing fields" });
    assert.equal(upstream.calls, 0);
  });
}

test("a filled booking honeypot is dropped before any upstream call", async () => {
  const upstream = refuseUpstream();
  const res = await invokeBooking({ ...validBooking, hp_field: "https://spam.example" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(upstream.calls, 0);
});

test("a booking filled in under three seconds, or with no timing, is dropped silently", async () => {
  for (const elapsed of [1500, 2999, undefined, "soon"]) {
    const upstream = refuseUpstream();
    const res = await invokeBooking({ ...validBooking, elapsed_ms: elapsed });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { ok: true });
    assert.equal(upstream.calls, 0);
  }
});

test("a booking filled in exactly three seconds is accepted", async () => {
  const calls = acceptUpstream();
  const res = await invokeBooking({ ...validBooking, elapsed_ms: 3000 });
  assert.deepEqual(res.body, { ok: true });
  assert.equal(calls.length, 1);
});

test("five booking attempts from one IP go through and the sixth gets a 429", async () => {
  const calls = acceptUpstream();
  const headers = { "x-forwarded-for": "203.0.113.7, 10.0.0.1" };
  for (let i = 0; i < 5; i += 1) {
    const res = await invokeBooking(validBooking, { headers });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { ok: true });
  }
  // Only the first x-forwarded-for entry is the key, so another hop does not get a fresh allowance.
  const limited = await invokeBooking(validBooking, { headers: { "x-forwarded-for": "203.0.113.7, 10.9.9.9" } });
  assert.equal(limited.statusCode, 429);
  assert.deepEqual(limited.body, {
    ok: false,
    error: "Too many requests. Please wait a few minutes, or call 07843 468904.",
  });
  assert.equal(calls.length, 5);

  const other = await invokeBooking(validBooking, { headers: { "x-forwarded-for": "192.0.2.77" } });
  assert.deepEqual(other.body, { ok: true });
  assert.equal(calls.length, 6);
});

test("x-real-ip is the rate limit key when x-forwarded-for is absent", async () => {
  acceptUpstream();
  const headers = { "x-real-ip": "192.0.2.78" };
  for (let i = 0; i < 5; i += 1) {
    assert.deepEqual((await invokeBooking(validBooking, { headers })).body, { ok: true });
  }
  assert.equal((await invokeBooking(validBooking, { headers })).statusCode, 429);
});

test("the booking rate limit window slides, so an IP can book again after ten minutes", async () => {
  acceptUpstream();
  const headers = { "x-forwarded-for": freshIp() };
  const realNow = Date.now;
  let clock = 1_800_000_000_000;
  Date.now = () => clock;
  try {
    for (let i = 0; i < 5; i += 1) {
      assert.deepEqual((await invokeBooking(validBooking, { headers })).body, { ok: true });
    }
    clock += 9 * 60 * 1000;
    assert.equal((await invokeBooking(validBooking, { headers })).statusCode, 429);
    clock += 61 * 1000;
    assert.deepEqual((await invokeBooking(validBooking, { headers })).body, { ok: true });
  } finally {
    Date.now = realNow;
  }
});

test("a booking blocked by Web3Forms hands the key and the booking to this site only", async () => {
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args);
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        message:
          "This method is not allowed. Use our API in client side or contact support with server IP address (Pro plan is required)",
      }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  try {
    const site = await invokeBooking(validBooking);
    assert.equal(site.statusCode, 200);
    assert.equal(site.body.ok, false);
    assert.equal(site.body.fallback, "client");
    assert.equal(site.body.accessKey, KEY);
    assert.deepEqual(site.body.submission, {
      kind: "booking",
      name: "Test Person",
      phone: "07843 468904",
      email: "",
      area: "Peacehaven",
      problemType: "Printer setup",
      days: [],
      times: [],
      description: "The printer stopped.",
    });

    const curl = await invokeBooking(validBooking, { origin: "" });
    assert.deepEqual(curl.body, { ok: false, fallback: "client" });

    const other = await invokeBooking(validBooking, { origin: "https://evil.example" });
    assert.deepEqual(other.body, { ok: false, fallback: "client" });
  } finally {
    console.error = original;
  }
  const logged = JSON.stringify(logs);
  assert.equal(logged.includes(KEY), false);
  assert.match(logged, /booking: Web3Forms did not accept the submission/);
});

test("a booking with no access key asks for mailto and does not call Web3Forms", async () => {
  const upstream = refuseUpstream();
  const res = await invokeBooking(validBooking, { envKey: "  " });
  assert.deepEqual(res.body, { ok: false, fallback: "mailto" });
  assert.equal(upstream.calls, 0);
});

test("a booking that Web3Forms rejects stays on mailto with a 502", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ success: false, message: "Invalid access key" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  const res = await invokeBooking(validBooking);
  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { ok: false, fallback: "mailto" });
});
});
