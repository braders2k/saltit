# Salt IT — saltit.co.uk

One-page site for **Salt IT**: home IT support from Brad, based in **Saltdean**, East Sussex.
Built from `docs/saltit-design-brief.md` and `docs/saltit-local-market-research.md`.

Plain static HTML, CSS and a small script. No framework and no build step. The page
itself makes no third-party requests. The only web font is Barlow (SIL OFL), subset and
self-hosted in `site/assets/fonts/`. The contact form posts to `/api/enquiry` on this
site; that function forwards to Web3Forms only when `WEB3FORMS_ACCESS_KEY` is set.

```text
site/                 ← the deployable site (publish this folder)
  index.html          all content, meta, Open Graph and LocalBusiness JSON-LD
  styles.css          mobile-first styles (breakpoints 760px and 1100px)
  script.js           contact form (on-site post, mailto fallback), footer year, sticky call-bar toggle
  robots.txt, sitemap.xml
  _headers            Cloudflare Pages security headers; noindex on *.pages.dev previews
  assets/
    mark.svg          the Salt IT mark (header, footer, favicon)
    mark-192.png      the mark as PNG (apple-touch-icon, JSON-LD logo)
    og-image.jpg      1200×630 share image
    cliffs-hero-*.webp  Saltdean undercliff (780m = mobile crop; 960 and 1440 = tablet/desktop)
    fonts/            Barlow 400 and 600, Latin subset (woff2), plus the OFL licence
scripts/
  check.mjs           pre-launch checks (spelling, SEO phrases, prices, phone, section numbers)
  og-image.html       source for assets/og-image.jpg (screenshot at 1200×630, JPEG ~80%)
api/
  enquiry.js          contact form handler (Web3Forms when WEB3FORMS_ACCESS_KEY is set)
docs/                 design brief and market research (not deployed)
```

## Run locally

```sh
python3 -m http.server 8080 --directory site
# or: npx serve site
```

## Before launch

Run the checks before every deploy:

```sh
node scripts/check.mjs
```

Live contact details (keep identical on the site, Google Business Profile, Nextdoor, Bing and Apple):

| Item | Value |
| --- | --- |
| Phone (display) | `07843 468904` |
| Phone (`tel:` and JSON-LD) | `+447843468904` |
| WhatsApp | `https://wa.me/447843468904` |
| Email | `hello@saltit.co.uk` |
| Hours | Mon–Fri 9am–6pm · Evenings and Saturdays by arrangement · Same-day: ask, and I'll tell you honestly if I can. |

The JSON-LD `openingHoursSpecification` lists only the fixed Mon–Fri 09:00–18:00 block, because
evenings and Saturdays are by arrangement. If the hours change, update the page, the JSON-LD and
the Google Business Profile together.

Still open with Brad:

1. **Payment methods.** Not listed yet; add a line to the Prices small print once confirmed.
2. **Bio** (Who you'll get): first person, from Brad. The spec strip still says "20+ years".
3. Confirm: the 14-day free return (it appears in Prices *and* the promises, so change both or neither),
   no travel supplement elsewhere in Brighton & Hove, and "ring you back as soon as I can".
4. A real photo of Brad, and a Google review link once the Business Profile exists.
   WhatsApp is already on the same number (`https://wa.me/447843468904`) in the hero, contact
   section, footer and sticky bar.

## Deploy (Vercel)

Hosted on Vercel, project **saltit** (team "Si's projects"), connected to this repo. Every push to
`main` deploys to production at https://saltit.co.uk; other branches get preview URLs.
No build command; output directory `site` (set in `vercel.json`, which also carries the security
headers and a `noindex` header for `*.vercel.app` hosts only).

DNS is on Cloudflare (DNS only, not proxied): `CNAME @` and `CNAME www` →
`35594c3e1ad992d0.vercel-dns-017.com`. `www.saltit.co.uk` 308-redirects to `saltit.co.uk` in Vercel.
`site/_headers` is kept for a Cloudflare Pages fallback but Vercel ignores it.

## Brand rules

- Name: **Salt IT** (with a space). Never "SaltIT".
- Place: **Saltdean** (one word), East Sussex. Never "Salt Dean" or "Southend".
- Domain / email: `saltit.co.uk` / `hello@saltit.co.uk`.
- Voice: first person, plain UK English, short sentences, no exclamation marks.
- No invented reviews, ratings, customer counts, stock photos or AI-generated people.

## Visual system

**Light comparison** of the same layout (this branch only; `main` stays the night palette).
Warm off-white paper, one huge uppercase idea per screen, hairline rules instead of boxes,
square buttons, tracked micro-labels, and the Lido's turquoise kept for buttons, dots and
the map. Turquoise *text* uses a deeper sea-green so it stays readable on the paper.
The hero is the chalk cliffs and undercliff at Saltdean, with a warm paper scrim so the
dark headline stays readable over the bright chalk and sky.

Page rhythm: hero → spec strip (£75 · £35 · 0 contracts · 20+ years) → What I fix → How it works
(warmer stone band, 3-step sequence) → **Prices on the brightest chalk band** → Who you'll get →
Where (stone band, coverage map) → Reviews (honest empty state) → Contact (soft pool-glow) → footer.

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| Paper | `#F6F1E8` | Page background | — |
| Stone | `#EFE6D8` | Alternate bands (How it works, Where, Contact) | — |
| Chalk | `#FBF8F2` | Prices band, raised panels | — |
| Ink | `#122028` | Text, outline buttons | 15:1 on paper |
| Mute | `#44555E` | Secondary text | 6.7:1 on paper |
| Lido turquoise | `#3EC6CF` | Primary button fill, dots, map home | 9:1 with ink text on the fill |
| Lido ink | `#085E66` | Eyebrows, numbers, links | 6.4:1 on paper |
| Pool blue | `#1D7AA6` | Coastline on the map | decorative |
| Terrace sand | `#8D7048` | Meridian, "none yet" status dot | decorative |

Type: Barlow 600 for headings, labels and buttons (H1/H2 uppercase, micro-labels tracked 0.16em),
Barlow 400 for body at 19px / 1.6. Tabular figures for prices and the phone number.

Motion: only a short fade-up of the hero on load, a slow pulse on the Saltdean map marker and
hover transitions. All of it is switched off under `prefers-reduced-motion`. The desktop header
turns solid once you scroll; on mobile the sticky call bar slides in after the hero's call button
scrolls away.

The coverage map in *Where* is hand-built inline SVG (approximate coastline, 2 km scale bar,
the 0° meridian through Peacehaven, and a ring round Saltdean labelled "Local area").
Its text is an accessible `<title>`; the ruled list next to it is the real content.

Hero photo: "Beaches and Undercliff - Saltdean" © Paul Gillett,
[geograph.org.uk/photo/3792351](https://www.geograph.org.uk/photo/3792351),
[CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). The WebP files in
`site/assets/` are crops of the Geograph original (no upscale). A warm paper gradient in CSS
keeps the headline, supporting line and buttons readable. Credit is in the footer.

## Contact form

`Send to Simon` posts JSON to `/api/enquiry` (same origin, so the site CSP can stay `form-action 'self'`).

| Env var | Where | What it does |
| --- | --- | --- |
| `WEB3FORMS_ACCESS_KEY` | Vercel project **saltit**, Production and Preview | Forwards the note to hello@saltit.co.uk via [Web3Forms](https://web3forms.com). Create the key with that address. Do not commit it. |

Until the key is set, the handler answers `{ ok: false, fallback: "mailto" }` and the page
opens a ready-to-send email to hello@saltit.co.uk instead. A filled honeypot (`hp_field`)
is dropped and reported as sent.
