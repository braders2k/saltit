import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { afterEach, describe, test } from "node:test";

const require = createRequire(import.meta.url);
const handler = require("../api/enquiry.js");

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

const invoke = async (body, { origin = ORIGIN, method = "POST", envKey = KEY } = {}) => {
  const previous = process.env.WEB3FORMS_ACCESS_KEY;
  if (envKey === undefined) delete process.env.WEB3FORMS_ACCESS_KEY;
  else process.env.WEB3FORMS_ACCESS_KEY = envKey;
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  const req = {
    method,
    headers: origin ? { origin } : {},
    body,
  };
  try {
    await handler(req, res);
  } finally {
    if (previous === undefined) delete process.env.WEB3FORMS_ACCESS_KEY;
    else process.env.WEB3FORMS_ACCESS_KEY = previous;
  }
  return res;
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
    assert.equal(site.headers["Cache-Control"], "no-store");

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
});
