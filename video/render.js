// Renders video/ad.html frame-by-frame with Playwright and encodes an MP4 with ffmpeg.
//
//   node video/render.js                      # 4:5 feed ad (1080x1350), the default
//   node video/render.js --format story       # 9:16 for Stories / Reels (1080x1920)
//   node video/render.js --format square      # 1:1 (1080x1080)
//   node video/render.js --stills 1,6,12      # PNG previews at those seconds only
//
// Needs `playwright` (npm i -D playwright) and an ffmpeg with libx264 on PATH, or FFMPEG=/path/to/ffmpeg.
// If video/audio.wav exists (see make_audio.py) it is muxed in as the soundtrack.

const { chromium } = require("playwright");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FORMATS = {
  feed: { width: 1080, height: 1350, suffix: "4x5-feed" },
  story: { width: 1080, height: 1920, suffix: "9x16-stories-reels" },
  square: { width: 1080, height: 1080, suffix: "1x1-square" },
};

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const format = opt("format", "feed");
if (!FORMATS[format]) {
  console.error(`Unknown --format ${format}. Use one of: ${Object.keys(FORMATS).join(", ")}`);
  process.exit(1);
}
const { width, height, suffix } = FORMATS[format];
const fps = Number(opt("fps", 30));
const workers = Number(opt("workers", Math.max(1, Math.min(6, os.cpus().length))));
const stills = opt("stills", null);
const here = __dirname;
const out = opt("out", path.join(here, `salt-it-facebook-ad-${suffix}.mp4`));
const ffmpeg = process.env.FFMPEG || "ffmpeg";
const pageUrl = `file://${path.join(here, "ad.html")}?capture&format=${format}`;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(pageUrl);
  await page.evaluate(() => document.fonts.ready);
  const barlow = await page.evaluate(() => document.fonts.check('600 40px "Barlow"'));
  if (!barlow) throw new Error("Barlow did not load from site/assets/fonts");
  return page;
}

async function shoot(page, t, file) {
  await page.evaluate((time) => window.render(time), t);
  await page.locator("#stage").screenshot({ path: file, animations: "disabled" });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });

  if (stills) {
    const page = await openPage(browser);
    for (const t of stills.split(",").map(Number)) {
      const file = path.join(opt("stills-dir", here), `still-${format}-${t}.png`);
      await shoot(page, t, file);
      console.log(file);
    }
    await browser.close();
    return;
  }

  const probe = await openPage(browser);
  const duration = await probe.evaluate(() => window.DURATION);
  await probe.close();

  const total = Math.round(duration * fps);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "saltit-frames-"));
  let done = 0;

  await Promise.all(
    Array.from({ length: workers }, async (_, w) => {
      const page = await openPage(browser);
      for (let f = w; f < total; f += workers) {
        await shoot(page, f / fps, path.join(dir, `f${String(f).padStart(5, "0")}.png`));
        done += 1;
        if (done % fps === 0) process.stdout.write(`\r${done}/${total} frames`);
      }
      await page.close();
    })
  );
  await browser.close();
  console.log(`\rRendered ${total} frames at ${width}x${height}`);

  const audio = path.join(here, "audio.wav");
  const hasAudio = fs.existsSync(audio);
  const encode = spawnSync(
    ffmpeg,
    [
      "-y",
      "-loglevel", "error",
      "-framerate", String(fps),
      "-i", path.join(dir, "f%05d.png"),
      ...(hasAudio ? ["-i", audio] : []),
      "-c:v", "libx264",
      "-preset", "slow",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      ...(hasAudio ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
      out,
    ],
    { stdio: "inherit" }
  );
  fs.rmSync(dir, { recursive: true, force: true });
  if (encode.status !== 0) process.exit(encode.status || 1);
  console.log(`Wrote ${out}`);
})();
