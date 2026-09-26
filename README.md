# Salt IT — saltit.co.uk

One-page site for **Salt IT**: home IT support from Brad, based in **Saltdean**, East Sussex.
Built from `docs/saltit-design-brief.md` and `docs/saltit-local-market-research.md`.

Plain static HTML, CSS and a 2 KB script. No framework, no build step and no third-party
requests. The only web font is Barlow (SIL OFL), subset and self-hosted in `site/assets/fonts/`.

```text
site/                 ← the deployable site (publish this folder)
  index.html          all content, meta, Open Graph and LocalBusiness JSON-LD
  styles.css          mobile-first styles (breakpoints 760px and 1100px)
  script.js           mailto form handoff, footer year, sticky call-bar toggle
  robots.txt, sitemap.xml
  _headers            Cloudflare Pages security headers; noindex on *.pages.dev previews
  assets/
    mark.svg          the Salt IT mark (header, footer, favicon)
    mark-192.png      the mark as PNG (apple-touch-icon, JSON-LD logo)
    og-image.jpg      1200×630 share image
    lido-hero-*.webp  the colour-graded Lido photo (780m = mobile crop; 960 and 1440 = tablet/desktop)
    fonts/            Barlow 400 and 600, Latin subset (woff2), plus the OFL licence
scripts/
  check.mjs           pre-launch checks (spelling, SEO phrases, prices, phone, placeholders)
  og-image.html       source for assets/og-image.jpg (screenshot at 1200×630, JPEG ~80%)
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
| Email | `hello@saltit.co.uk` |
| Hours | Mon–Fri 9am–6pm · Evenings and Saturdays by arrangement · Same-day: ask, and I'll tell you honestly if I can. |

The JSON-LD `openingHoursSpecification` lists only the fixed Mon–Fri 09:00–18:00 block, because
evenings and Saturdays are by arrangement. If the hours change, update the page, the JSON-LD and
the Google Business Profile together.

Still open with Brad:

1. **Payment methods.** Not listed yet; add a line to the Prices small print once confirmed.
2. **Bio** (Who you'll get): 20+ years, EPOS background, lives in Saltdean. Uses the brief's wording.
   The "20+ years" figure also appears in the spec strip under the hero.
3. Confirm: the 14-day free return (it appears in Prices *and* the promises, so change both or neither),
   no travel supplement elsewhere in Brighton & Hove, and "ring you back as soon as I can".
4. Optional: WhatsApp on the same number (the sticky bar's **Message** button can then link to
   `https://wa.me/447843468904`), a real photo of Brad, and a Google review link once the Business
   Profile exists.

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

**Saltdean Lido after dark**, in a SpaceX-style layout: near-black full-bleed bands, one huge
uppercase idea per screen, hairline rules instead of boxes, square buttons, tracked micro-labels
and almost no colour except the Lido's own turquoise. The hero is a photo of the restored Lido (2024),
colour-graded to night so the pool glows turquoise against the white Deco wall.

Page rhythm: hero → spec strip (£75 · £35 · 0 contracts · 20+ years) → What I fix → How it works
(deep band, 3-step sequence) → **Prices on a Deco-white band** (the Lido's walls) → Who you'll get →
Where (deep band, coverage map) → Reviews (honest empty state) → Contact (pool-glow band) → footer.

| Token | Hex | From the Lido | Use | Contrast |
| --- | --- | --- | --- | --- |
| Abyss | `#050D14` | Night sea | Page background | — |
| Deep | `#081723` | Deep water | Alternate bands (How it works, Where, Contact) | — |
| Deco white | `#F2F4F3` | The 1938 walls | Text on dark; hover fill for buttons | 17.7:1 on abyss |
| Mute | `#A3B3BD` | — | Secondary text on dark | 9.1:1 on abyss |
| Lido turquoise | `#3EC6CF` | The pool / Lido brand | Primary buttons, eyebrows, numbers, focus ring, map | 9.5:1 on abyss; never text on the light band |
| Pool blue | `#9DCFF1` | Pool water in daylight | Coastline, mark detail | decorative |
| Lido sky | `#275E96` | Sky over the Lido | Map sea, contact glow | decorative |
| Terrace sand | `#C4B8A4` | Sun terraces | Meridian line, "none yet" status dot | decorative |
| Deco (light band) | `#F1F2EF` | White render | Prices background | — |
| Ink | `#07131C` | — | Text on the light band | 16.7:1 |
| Ink mute | `#4A5A64` | — | Secondary text on the light band | 6.4:1 |
| Lido ink | `#0B6B74` | Deep turquoise | Labels on the light band | 5.5:1 |

Type: Barlow 600 for headings, labels and buttons (H1/H2 uppercase, micro-labels tracked 0.16em),
Barlow 400 for body at 19px / 1.6. Tabular figures for prices and the phone number.

Motion: only a short fade-up of the hero on load, a slow pulse on the Saltdean map marker and
hover transitions. All of it is switched off under `prefers-reduced-motion`. The desktop header
turns solid once you scroll; on mobile the sticky call bar slides in after the hero's call button
scrolls away.

The coverage map in *Where* is hand-built inline SVG (approximate coastline, 2 km scale bar,
the 0° meridian through Peacehaven, and a ring round Saltdean labelled "Travel included").
Its text is an accessible `<title>`; the ruled list next to it is the real content.

Hero photo: "Saltdean Lido" © Ian Capper, taken 21 May 2024 after the main building's restoration,
[geograph.org.uk/photo/7783941](https://www.geograph.org.uk/photo/7783941),
[CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/). The WebP files in `site/assets/`
are upscaled from the 640px original, cropped and colour-graded (night sky, turquoise pool,
darkened grass); credit is in the footer. A sharper photo of Brad's own would be a good swap later.
