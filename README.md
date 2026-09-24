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
  assets/
    mark.svg          the Salt IT mark (header, favicon)
    mark-192.png      the mark as PNG (apple-touch-icon, JSON-LD logo)
    og-image.jpg      1200×630 share image
scripts/
  check.mjs           pre-launch checks (spelling, SEO phrases, prices, phone, placeholders)
  og-image.html       source for assets/og-image.jpg (screenshot at 1200×630)
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
3. Confirm: the 14-day free return (it appears in Prices *and* the promises, so change both or neither),
   no travel supplement elsewhere in Brighton & Hove, and "ring you back as soon as I can".
4. Optional: WhatsApp on the same number (the sticky bar's **Message** button can then link to
   `https://wa.me/447843468904`), a real photo of Brad, and a Google review link once the Business
   Profile exists.

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

A near-black full-bleed hero and header band, a light salt-white page below it, lido blues for
rules, labels, outlines and focus, and a soft-charcoal band for contact and the footer. Rules instead
of cards, square buttons, monospace micro-labels, large tight sans-serif headings (system fonts only).

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| Near-black | `#0A0B0D` | Hero and header band | 19.0:1 with salt white |
| Salt white | `#FAFBFC` | Page background; text on the dark bands | — |
| Soft charcoal | `#2B2F33` | Body text; primary buttons; contact and footer band | 13.0:1 on salt white |
| Muted | `#5F676E` | Secondary text on light | 5.55:1 |
| Accent text | `#4A7488` | Eyebrows, labels, index numbers and focus ring on light | 4.89:1 |
| Lido sky | `#7EB8D4` | Rules and bullets on light; eyebrow, labels, outlines and focus on the dark bands | 9.1:1 on near-black, 6.23:1 on charcoal; never text on light |
| Turkish Aegean | `#7898A4` | Secondary button outline, mark | never text on light |
| Button hover | `#435F6D` | Primary hover on light | 6.55:1 with salt white |
