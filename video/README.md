# SaltIT promo video

A 38-second brand video built from the site's own copy, colours and chalk-cliff artwork.

| File | Size | Use |
| --- | --- | --- |
| `saltit-promo-landscape.mp4` | 1920×1080 | YouTube, LinkedIn, Facebook, website, Google Business Profile |
| `saltit-promo-vertical.mp4` | 1080×1920 | Instagram Reels / Stories, TikTok, Facebook Stories, WhatsApp Status |

Both are H.264 + AAC at 30fps with a gentle synthesised soundtrack. The video still reads
with the sound off, as most social feeds autoplay muted.

## Scenes

1. SaltIT logo over the Saltdean shoreline
2. "Tech that works. At home and at work."
3. Home IT support: PCs and laptops, Wi‑Fi, printers, setup
4. AI for small business: capture leads, qualify them, automatic follow-ups
5. How it works, for home and for business
6. Local areas served and 20+ years of experience
7. Call to action: saltit.co.uk · hello@saltit.co.uk

## Editing and re-rendering

`promo.html` is the whole video: every scene is plain HTML/CSS, animated by a deterministic
`render(t)` function. Open it in a browser to watch a live loop, add `?format=vertical` for the
9:16 cut, or `?t=12` to freeze on one moment while you tweak copy or layout.

To produce new MP4s you need Node, Python 3 with numpy, and an ffmpeg that has libx264:

```sh
npm install --no-save playwright && npx playwright install chromium
python3 video/make_audio.py                  # writes video/audio.wav (deterministic)
node video/render.js                         # -> video/saltit-promo-landscape.mp4
node video/render.js --format vertical       # -> video/saltit-promo-vertical.mp4
node video/render.js --stills 6,12,36        # quick PNG previews instead of a full render
```

Set `FFMPEG=/path/to/ffmpeg` if ffmpeg is not on your PATH. If you change scene timings in
`promo.html`, update `SCENES` in `make_audio.py` so the chord changes stay in step.
