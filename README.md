# Salt IT — saltit.co.uk

One-page site for **Salt IT**: home IT support from Brad, based in **Saltdean**, East Sussex.
Built from `docs/saltit-design-brief.md` and `docs/saltit-local-market-research.md`.

Plain static HTML, CSS and a 2 KB script. No framework, no build step, no web fonts,
no third-party requests.

```text
site/                 ← the deployable site (publish this folder)
  index.html          all content, meta, Open Graph and LocalBusiness JSON-LD
  styles.css          mobile-first styles (breakpoints 760px and 1100px)
  script.js           mailto form handoff, footer year, sticky call-bar toggle
  robots.txt, sitemap.xml
  _headers            Cloudflare Pages security headers; noindex on *.pages.dev previews
  assets/             favicon.svg, icon-192.png, apple-touch-icon.png, og-image.png
scripts/
  check.mjs           pre-launch checks (spelling, SEO phrases, prices, placeholders)
  og-image.html       source for assets/og-image.png (1200×630)
  icon.html           source for the PNG icons
docs/                 design brief and market research (not deployed)
```

## Run locally

```sh
python3 -m http.server 8080 --directory site
# or: npx serve site
```

## Before launch

Run the checks. They fail until every launch blocker is resolved:

```sh
node scripts/check.mjs
```

Brad still needs to supply or confirm:

1. **Phone number.** Replace every `REPLACE_WITH_PHONE` with the E.164 number
   (e.g. `+441273000000`) — this covers the `tel:` links and JSON-LD `telephone`. Then replace every
   `<span class="ph">Add phone before launch</span>` with the number as people should read it
   (e.g. `01273 000 000`).
2. **Hours** (How it works section). Once confirmed, add `openingHoursSpecification` to the JSON-LD
   with the same hours, and remove the "Before launch" tag.
3. **Payment methods** (Prices small print).
4. **Bio** (Who you'll get): 20+ years, EPOS background, lives in Saltdean.
5. Confirm: the 14-day free return (it appears in Prices *and* the promises, so change both or neither),
   no travel supplement elsewhere in Brighton & Hove, and "ring you back as soon as I can".
6. Optional: WhatsApp on the same number (the sticky bar's **Message** button can then link to
   `https://wa.me/44…`), a real photo of Brad, and a Google review link once the Business Profile exists.

## Deploy (Cloudflare Pages)

No build command. Output directory: `site`. DNS and the saltit.co.uk zone are managed separately
and are not part of this repo.

## Brand rules

- Name: **Salt IT** (with a space). Never "SaltIT".
- Place: **Saltdean** (one word), East Sussex. Never "Salt Dean" or "Southend".
- Domain / email: `saltit.co.uk` / `hello@saltit.co.uk`.
- Voice: first person, plain UK English, short sentences, no exclamation marks.
- No invented reviews, ratings, customer counts, stock photos or AI-generated people.

## Visual system

Near-black and white, one signal-orange accent, 1px rules instead of cards, square buttons,
monospace micro-labels, and large tight sans-serif headings (system fonts only).

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| Ink | `#0A0B0D` | Text on white; hero, contact and footer bands | 19.7:1 on white |
| Paper | `#FFFFFF` | Page background; text on ink | — |
| Muted | `#52575D` | Secondary text on white | 7.3:1 |
| Muted on ink | `#B7BCC2` | Secondary text on ink | 10.3:1 |
| Signal | `#C2410C` | Labels, index numbers and focus ring on white | 5.2:1 |
| Signal on ink | `#FF6B35` | Labels, placeholders and focus ring on ink | 6.9:1 |
| Rule | `#DCDFE3` / `#2A2D31` | Decorative 1px rules on white / on ink | — |
