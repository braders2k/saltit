# Salt IT — Design brief for the saltit.co.uk one-pager

Status: **for Brad's approval. Nothing here is built yet.** The live site is unchanged.
Written 24 September 2026. The source is `docs/saltit-local-market-research.md` (the "research"), plus a review of the current static site (`index.html`, `styles.css`, `script.js`).

Place name: **Saltdean**, one word, East Sussex, on the coast east of Brighton. Not Southend, and not any other "Salt…" town.

Items marked **[BRAD]** are facts only Brad can supply or confirm. The build must not ship with any of them left as placeholders.

---

## 1. Positioning and audience

**One-line position**

> Salt IT is Brad, an IT engineer who lives in Saltdean. He comes to your home and fixes the Wi-Fi, the printer, the laptop, the email, or the mess after a scam. He tells you the price before he comes, in plain English.

**Primary audience: households in the Deans and Peacehaven.** That means Saltdean, Rottingdean, Peacehaven and Woodingdean, and within them two groups:

1. **Residents with a broken thing at home.** Most often this is Wi-Fi, a printer, a slow or new laptop, email, or a scam scare. They want someone local, a price up front, and no jargon.
2. **Adult children booking help for a parent.** They may live elsewhere. The Rottingdean Coastal ward (which covers Rottingdean and west Saltdean) is 25.7% aged 65+, against 18.6% for England and Wales (Census 2021). This group needs a named, patient person, written steps, and a call back to say what was done.

**Secondary audience**

- **Wider Brighton & Hove households.** These are the same jobs further out, and they're the wider net for search, not the headline.
- **Home offices and very small businesses.** They get the same one-off rates for a first visit, mentioned in one line only. No per-user pricing and no retainer.

**What we are not leading with.** "AI for local business" comes off the title, the H1 and the first screen. The research says it splits the query worth owning ("IT support Saltdean") and doesn't match what the catchment buys. See section 4 for what happens to that offer.

**Where the gap is.** None of the nearest specialists (Saltdean Tech, Southern PC Services, Cranfield) publish prices. Salt IT wins by combining four things nobody local combines:

- a **named person based in Saltdean**;
- **published prices**;
- **real hours**;
- **reviews gathered under one consistent name**.

---

## 2. Brand spelling decision

**Recommendation: "Salt IT", with a space.**

Why:

- **It reads correctly.** "SaltIT" can be read as "salt it" or "salty". "Salt IT" reads as Salt plus IT, which says what the business does. That matters for an older audience reading a van, a card or a Google listing.
- **It says the service out loud.** The phrase "IT support" sits right next to the brand in titles and listings ("IT Support Saltdean | … | Salt IT").
- **It matches the research** and every planning document so far. Only the current page uses SaltIT.
- **Search is unaffected.** The domain stays `saltit.co.uk` and the email stays `hello@saltit.co.uk`. Lowercase, no-space domains are normal and people will still find it.

**Rules (apply everywhere, before the first citation):**

| Item | Use | Never |
| --- | --- | --- |
| Business name | **Salt IT** | SaltIT, Salt-IT, Salt I.T., SALT IT in body copy |
| Place | **Saltdean** | Salt Dean, Salt-dean, Southend |
| Domain / email | saltit.co.uk / hello@saltit.co.uk | — |
| County line | Saltdean, East Sussex | "Saltdean, Brighton" as the only locator |

Uppercase "SALT IT" is fine inside all-caps micro-labels (eyebrows, buttons) because those are styled with CSS `text-transform`. The underlying HTML text must still read "Salt IT".

The name must be identical on the site header, the footer, the `<title>`, the JSON-LD, the Google Business Profile, Nextdoor, Bing Places and Apple Business Connect. **[BRAD]** Confirm "Salt IT" before any listing is created. If you prefer SaltIT, that's fine, but pick one and never mix them.

---

## 3. Keep vs replace (current one-pager)

| Current element | Decision | Notes |
| --- | --- | --- |
| Static HTML/CSS/JS, no framework | **Keep** | It's fast and simple, and the research says to keep the static page. |
| Colour tokens (salt white, soft charcoal, lido sky, Turkish Aegean) | **Keep** | Adjust the small-text accent colour for contrast (section 10). |
| Mark (`assets/mark.svg`, `mark-192.png`) | **Keep** | Update the `aria-label` from "SaltIT mark" to "Salt IT". |
| Hero art (`hero.webp` / `hero.svg`, chalk cliffs line art) | **Keep, optional** | Use it only as a faint background line. A real photo taken by Brad of the Saltdean cliffs or Lido can replace it later. |
| System Helvetica/Arial font stack | **Keep** | No web fonts. |
| Skip link, focus styles, reduced-motion rule | **Keep** | |
| Empty "proof" block that refuses invented quotes | **Keep the principle** | Reword it (section 5, Reviews). |
| `mailto:` contact form (no backend) | **Keep the mechanism** | Change the fields (section 5, Contact). The phone becomes the main call to action. |
| Title "IT Support Saltdean \| AI for Local Business \| SaltIT" | **Replace** | Section 9. |
| H1 "Tech that works. At home and at work." | **Replace** | It has no place name and no service. |
| Two-offer layout (Home IT / AI for small business) | **Replace** | Becomes one offer: home IT support. |
| "AI for small business" offer, process track, form option | **Remove from this page** | See section 4. |
| Four generic services ("PCs and laptops", etc.) | **Replace** | Use the five household jobs. |
| Area list: Saltdean, Peacehaven, Rottingdean, Brighton BN2 | **Replace** | Add **Woodingdean** and use "Brighton & Hove". |
| Placeholder phone `01xxx xxxxxx` (4 places) | **Replace [BRAD]** | This blocks launch and blocks the Google Business Profile. |
| Brand "SaltIT" throughout | **Replace** | Use "Salt IT". |
| No JSON-LD | **Add** | Section 9. |
| No published prices | **Add** | Section 7. |
| No published hours | **Add [BRAD]** | Section 6. |
| Brad bio line ("20+ years, EPOS background, home in Saltdean") | **Keep** | **[BRAD]** Confirm it's still accurate. |

---

## 4. Information architecture

**One page**, with anchor navigation. No town pages, no blog, no second page on day one.

**The AI automation offer.** Remove it from this page. It's a different buyer and a different search. Adding it to a household IT page weakens both. If Brad wants to keep selling it, give it its own page or site later, when it has its own proof. That's out of scope here. The only small-business mention on day one is a single line in Prices.

**Section order**

| # | Section (anchor) | Job of the section |
| --- | --- | --- |
| 0 | Header | Brand on the left, phone on the right, always one tap away. |
| 1 | Hero (`#top`) | Say what, where and who in one screen, with a call button and the first-hour price. |
| 2 | What I fix (`#fix`) | The five household jobs, plus the older-relative line. |
| 3 | How it works (`#how`) | On-site by default, remote as the second option, and hours. |
| 4 | Prices (`#prices`) | Exact published numbers. One-off. No contract. |
| 5 | Who you'll get (`#brad`) | A named local person and four plain promises. |
| 6 | Where (`#areas`) | Saltdean, Rottingdean, Peacehaven, Woodingdean, then Brighton & Hove. |
| 7 | Reviews (`#reviews`) | An honest empty state until real Google reviews exist. |
| 8 | Contact (`#contact`) | Phone first, then a short "what's gone wrong" note. |
| 9 | Footer | Name, address and phone (NAP), exactly as on Google. |

**Nav links** (desktop only, uppercase micro-labels): What I fix · Prices · Areas · Contact. Mobile shows no text nav, just the brand and a **Call** button, plus the sticky bottom bar (section 10).

---

## 5. Section-by-section copy

Voice: first person ("I") in body copy; buttons say "Call Brad". Short sentences, UK English, no jargon, no exclamation marks. Every phone number is a `tel:` link. `[PHONE]` means Brad's real number.

### 0. Header

- Left: mark plus the wordmark **Salt IT**.
- Right (desktop): `Call [PHONE]`, styled as a button.
- Right (mobile): a `Call` button (icon plus the word; never an icon alone).

### 1. Hero

- Eyebrow: `SALT IT · BRAD · BASED IN SALTDEAN`
- **H1:** `Home IT support in Saltdean.`
- Sub (one sentence): `Wi-Fi, printers, laptops, email and scam scares — fixed at your kitchen table by someone who lives down the road.`
- Primary button: `Call Brad — [PHONE]` (`tel:`)
- Secondary button (outline): `Book a home visit` (jumps to `#contact`)
- Micro line under the buttons: `First hour £75, travel included · Saltdean · Rottingdean · Peacehaven · Woodingdean`

### 2. What I fix

- Eyebrow: `WHAT I FIX`
- H2: `The five jobs I'm called for most.`

List these as five numbered rows (01–05), each with a bold plain-English problem and one or two sentences below it:

1. **Wi-Fi that dies in the back room.** Dead spots, dropouts, or a router in the wrong corner. I find where the signal fails and fix it, and get the smart TV and streaming stick back online while I'm there.
2. **The printer stopped after a new router.** It worked yesterday and now nothing can find it. I reconnect it to every computer and phone that needs it.
3. **A slow laptop, or a new one to set up.** I'll tidy up the slow one and tell you honestly whether it has life left before you buy new. Or I'll set up the new one and move your files, photos and email across.
4. **Email that's stopped working.** It won't send, won't arrive, has locked you out, or has vanished from your phone. I get it working on every device and write down what I changed.
5. **"I think I've been scammed."** A pop-up, a call "from Microsoft" or "BT", or someone was on your computer. Switch it off, leave it off, and call me. I'll check it, clean it up, and help you secure your accounts. If bank details were involved, call your bank first.

**Older-relative line** (set apart below the list with a rule above it and slightly larger type):

> **Booking for Mum or Dad?** I'll visit them, go at their pace, fix it, and leave simple written steps. If you like, I'll ring you afterwards to say what I did.

SEO phrase placed here, once: "computer repair Saltdean". Suggested use: the sentence above the list, `Computer repair in Saltdean and nearby usually means one of these.`

### 3. How it works

- Eyebrow: `HOW IT WORKS`
- H2: `I come to you. Remote when it's simpler.`

Two columns (they stack on mobile). The on-site column comes first and is visually heavier.

**At your home: the usual way.**
> Most jobs are best done in the room where the problem is. That includes Wi-Fi and router placement, printers, setting up a new device with you there, anything for an older relative, and anything after a scam, when letting a stranger connect remotely is the last thing you want.

**Remote: when it's simpler.**
> If your internet works and you're comfortable, I can sort a slow PC, email settings, or a quick follow-up on a machine I've already seen. You start the session and can end it at any time. **I will never call you out of the blue asking to connect.**

**Three steps** (a small numbered row under the columns):

1. **Call or message.** Tell me what's gone wrong.
2. **Hear the price.** I'll give you the likely cost before I travel.
3. **Fixed and explained.** I'll show you what I did and leave notes.

**Hours [BRAD]** (a single line; only promise hours you'll actually keep). Proposed format:

> `Mon–Fri 9am–6pm · Evenings and Saturdays by arrangement · Same-day: ask, and I'll tell you honestly if I can.`

The research identifies after 5–6pm and Saturday as the credible local gap. If Brad can reliably cover them, say so. If not, leave them "by arrangement". Same-day is always phrased as "ask", never as a promise.

### 4. Prices

- Eyebrow: `PRICES`
- H2: `The price, before I visit.`
- Intro: `Pay per visit. No contracts, no monthly fee.`

Show this as a price table (a real `<table>`), with prices right-aligned:

| Service | Price |
| --- | --- |
| Home visit, first hour (travel included in Saltdean, Rottingdean, Peacehaven and Woodingdean) | **£75** |
| Each extra half hour | **£30** |
| Remote session, up to 30 minutes | **£35** |
| Same-day, evening (after 6pm) or Saturday visit, first hour | **£95** |

Sub-heading `Typical jobs` (a second, smaller table):

| Job | Usually |
| --- | --- |
| Wi-Fi dead spot fixed, or printer back on the network | **£75–£90** |
| Scam or virus clean-up, including "someone was on my computer" | **£80–£110** |
| New laptop set up, files and email moved across | **£90–£130** |

Small print lines under the tables:

- `Parts, if needed, are quoted before I buy anything.`
- `Same problem back within 14 days? I'll pop back at no charge.` **[BRAD]** Confirm 14 days, or change it.
- `Elsewhere in Brighton & Hove: same rates. I'll tell you any travel charge on the phone before booking.` **[BRAD]** Decide whether there's a supplement. If there is, publish the figure here.
- `Home office or small business? Your first visit is on the same rates.`
- `Payment: [BRAD — e.g. card, bank transfer, cash].`

**Where these numbers come from.** They sit inside the research's recommended mid band:

| Line | Research mid band | Chosen |
| --- | --- | --- |
| First hour, travel included | £70–£85 | £75 |
| Further time | £55–£65 an hour, or £30 per half hour | £30 per half hour |
| Remote | £30–£40 per half hour or short session | £35 |
| Same-day, after 6pm or weekend | £90–£110 | £95 |

£75 matches Lewes Digital's published Peacehaven home rate, sits above 118 Computers' £60, and sits below AI Handyman's £90 same-day visit. The typical-job bands are the research's figures, except the Wi-Fi/printer floor, which moves from £70 to £75 so it never undercuts the first-hour price. Brad may move any number within its band, but the typical-job floors must never be below the first-hour price.

No retainer, subscription or annual plan appears on the page (section 12).

### 5. Who you'll get

- Eyebrow: `WHO YOU'LL GET`
- H2: `Brad. He lives in Saltdean.`
- Body: `I'm an IT engineer with more than 20 years' experience, including years in EPOS systems for shops and restaurants. I live in Saltdean, so I'm usually a few minutes away.` **[BRAD]** Confirm the wording and facts. Optionally add a surname.
- Optional photo: a real, recent photo of Brad, square, greyscale or natural. **No stock photos, and no AI-generated faces.** If there's no photo, leave the space out; don't use a placeholder silhouette.

Four promises, as a 2×2 grid (1 column on mobile), each a bold label plus one line:

1. **Price first.** You'll hear the likely cost before I travel.
2. **Plain English.** No jargon, and no making you feel daft for asking.
3. **I'll show you what I did.** And I'll leave written steps if you want them.
4. **I'll come back if it comes back.** The same problem within 14 days is on me. (This must match the Prices line.)

SEO phrase, once: "IT support Saltdean" is already in the H1. Here, use "computer help Peacehaven" naturally, for example: `I'm usually a few minutes away, whether you need computer help in Peacehaven or Saltdean.`

### 6. Where

- Eyebrow: `WHERE`
- H2: `Close to home.`

A ruled list, with postcode districts in small caps on the right:

- Saltdean — BN2
- Rottingdean — BN2
- Peacehaven — BN10
- Woodingdean — BN2
- Brighton & Hove — wider area (same rates; travel confirmed on the phone)

Body, one short paragraph that uses the remaining phrases once each:

> `I'm based in Saltdean and cover the Deans and Peacehaven for home visits, from PC repair in Rottingdean to a home-visit computer repair in Woodingdean, and Wi-Fi help across Brighton & Hove.`

(Brad can reword this, but the four phrases must appear in real sentences, and only once each.)

### 7. Reviews

- Eyebrow: `REVIEWS`
- H2: `What neighbours say.`
- **Day-one empty state** (use exactly this or similar):

> `Salt IT is new. I won't make up quotes. Reviews from real local jobs will appear here as they come in, on Google first.`

- Optional link: `Leave a review on Google →`, only once the Business Profile exists **[BRAD]**.
- **Later:** show up to three real Google reviews verbatim, with first name plus area (e.g. "Margaret, Rottingdean") and the date, plus a link to the full Google profile. No anonymous lines, no edited quotes, and no star widgets that load third-party scripts.
- **Never:** invented testimonials, "trusted by 100+ customers", or stock logos.

### 8. Contact

- Eyebrow: `CONTACT`
- H2: `What's gone wrong?`
- Lead: `The quickest way is to call. If I'm with a customer, leave a message and I'll ring you back the same day.` **[BRAD]** Only keep "same day" if you can honour it; otherwise use "as soon as I can".
- Large phone link: `[PHONE]`
- Optional: `WhatsApp: [PHONE]` (a `https://wa.me/44…` link), only if Brad uses WhatsApp on that number **[BRAD]**.
- Email: `hello@saltit.co.uk`
- Line: `Based in Saltdean, East Sussex`

**Form** (secondary, kept as a `mailto:` handoff):

| Field | Type | Required |
| --- | --- | --- |
| Your name | text, `autocomplete="name"` | yes |
| Phone number (so I can call you back) | `tel`, `autocomplete="tel"` | yes |
| Where are you? | select: Saltdean, Rottingdean, Peacehaven, Woodingdean, Brighton & Hove, Somewhere else | yes |
| What's gone wrong? | textarea, 4 rows, placeholder `e.g. The printer stopped working after BT changed our router.` | yes |
| I'm booking for someone else | checkbox | no |

- Button: `Send to Brad`
- Note under the button: `This opens a ready-to-send email in your email app. Prefer to talk? Call [PHONE].`
- The email subject should be generated as `Home visit enquiry — [area] — [name]`.

Remove the old "I need help with: Home IT support / AI automation / Something else" select.

### 9. Footer (NAP)

Plain text, left-aligned, identical to the Google Business Profile:

```
Salt IT
Based in Saltdean, East Sussex BN2
[PHONE] · hello@saltit.co.uk
Home visits in Saltdean, Rottingdean, Peacehaven, Woodingdean and Brighton & Hove
© 2026 Salt IT
```

No street address (it's a mobile service-area business). "Saltdean" is spelled as one word.

---

## 6. Service model (summary for the coder and for Brad)

- **On-site is the product and the default.** It covers Wi-Fi, printers, new-device setup, older relatives, scam recovery, and anyone uneasy about remote access.
- **Remote is second.** It covers slow-PC tidy-ups, email and account settings, and short follow-ups on a machine already seen, when the broadband works and the customer is comfortable.
- **No workshop and no drop-off** on day one. Collection is mentioned only if a job can't be finished in the house. It isn't advertised on the page.
- **Hours are published [BRAD]**, and only hours Brad can keep. Same-day is always "ask".

---

## 7. Pricing rules (summary)

- **One-off only.** Payment per visit.
- **Published figures:** £75 first hour including travel (four named places), £30 per extra half hour, £35 remote session up to 30 minutes, and £95 for a same-day, evening or Saturday first hour.
- **Typical jobs:** £75–£90 for Wi-Fi or printer, £80–£110 for a scam or virus clean-up, £90–£130 for a new-laptop setup.
- **Parts** are quoted first.
- **A free return** on the same problem within 14 days **[BRAD]**.
- **No** monthly household retainer, no annual plan, and no per-user business pricing on the page.
- **JSON-LD `priceRange`:** `£35–£130`.

---

## 8. Trust and calls to action

- **Named local:** "Brad, based in Saltdean" appears in the eyebrow, the "Who you'll get" H2 and the footer.
- **Price before the visit:** it's in the hero micro line, the Prices section and the promises.
- **"I'll show you what I did"** and written steps.
- **The anti-scam line:** "I will never call you out of the blue asking to connect."
- **The phone is the primary CTA everywhere.** It appears in the header, the hero, the sticky mobile bar and the contact section. **The placeholder `01xxx xxxxxx` must be replaced by Brad's real number before launch. [BRAD]** The same number goes on the Google Business Profile.
- **No invented testimonials, ratings, customer counts or logos.** The Reviews section stays in its honest empty state until real Google reviews exist.
- CTA wording, in order of preference: `Call Brad`, `Book a home visit`, `Send to Brad`. Avoid "Get a quote", "Contact us" and "Learn more".

---

## 9. SEO day-one checklist

### On the page (the coder's job)

- [ ] **`<title>`:** `IT Support Saltdean | Home Computer & Wi-Fi Help | Salt IT` (58 characters)
- [ ] **Meta description:** `Wi-Fi, printers, slow laptops, email and scams, fixed at home in Saltdean, Rottingdean, Peacehaven and Woodingdean. First hour £75, travel included.`
- [ ] **One H1 only:** `Home IT support in Saltdean.`
- [ ] **Heading order:** H1, then one H2 per section, then H3 only inside sections. No skipped levels.
- [ ] **Area names in visible copy:** Peacehaven, Rottingdean, **Woodingdean** and Brighton & Hove all appear.
- [ ] **Each phrase used once, in a real sentence:** "IT support Saltdean" (H1/title), "computer repair Saltdean", "computer help Peacehaven", "PC repair Rottingdean", "home visit computer repair Woodingdean" (worded naturally), "Wi-Fi help Brighton". No "near me" stuffing.
- [ ] **Canonical:** `https://saltit.co.uk/`
- [ ] **Open Graph tags:** title, description, url, type, `og:locale` `en_GB`, and a 1200×630 `og:image` made from the mark plus "Salt IT · Home IT support in Saltdean" (static PNG or JPG, under 100 KB).
- [ ] **`<html lang="en-GB">`**, which is already in place.
- [ ] **NAP** in the footer exactly matches the Google Business Profile: name, phone, email, "Based in Saltdean, East Sussex BN2".
- [ ] **LocalBusiness JSON-LD** in `<head>` (template below). It must validate in Google's Rich Results Test and the Schema.org validator.
- [ ] **`robots.txt`** allowing all, and a one-URL **`sitemap.xml`**. These are static files only, with no server or DNS work.
- [ ] **No text inside images.** All key copy is real HTML text.
- [ ] **Launch spelling check:** no "SaltIT", "Salt Dean" or "Southend" anywhere in the HTML, JSON-LD, alt text or meta.

**JSON-LD template.** Fill in the **[BRAD]** fields. Don't ship placeholders.

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://saltit.co.uk/#business",
  "name": "Salt IT",
  "description": "Home IT support in Saltdean, East Sussex: Wi-Fi, printers, laptops, email and scam clean-ups. On-site home visits, remote when simpler.",
  "url": "https://saltit.co.uk/",
  "telephone": "+44XXXXXXXXXX",
  "email": "hello@saltit.co.uk",
  "image": "https://saltit.co.uk/assets/og-image.png",
  "logo": "https://saltit.co.uk/assets/mark-192.png",
  "priceRange": "£35–£130",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Saltdean",
    "addressRegion": "East Sussex",
    "postalCode": "BN2",
    "addressCountry": "GB"
  },
  "areaServed": [
    { "@type": "Place", "name": "Saltdean, East Sussex" },
    { "@type": "Place", "name": "Rottingdean, East Sussex" },
    { "@type": "Place", "name": "Peacehaven, East Sussex" },
    { "@type": "Place", "name": "Woodingdean, East Sussex" },
    { "@type": "City", "name": "Brighton and Hove" }
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ]
}
```

`telephone` and `openingHoursSpecification` are **[BRAD]**. Use the real number in E.164 format, and hours that exactly match the page and the Google Business Profile. If hours aren't confirmed at build time, omit `openingHoursSpecification` rather than guess.

### Off the page: Brad's tasks as content owner (not the coder's)

- [ ] **Google Business Profile**, set up as a service-area business.
  - Name: **Salt IT**, exactly.
  - Categories: primary "Computer repair service", plus "Computer support and services" (or the closest available IT support category).
  - Service areas: Saltdean, Rottingdean, Peacehaven, Woodingdean, Brighton & Hove.
  - Hide the home street address.
  - Phone, email, website and hours identical to the site.
  - Description in plain English, reusing the hero sentence.
  - Add the five jobs as Services, with the published prices.
- [ ] **Real phone number** chosen once, and used on the site, GBP, Nextdoor, Bing and Apple.
- [ ] **Nextdoor business page**, complete. This is where Saltdean recommendations already happen.
- [ ] **Bing Places** (it can import from GBP) and **Apple Business Connect**, with identical NAP.
- [ ] **Review habit:** after every real visit, send the Google review link. Never buy, swap or write reviews.
- [ ] **No bought citation lists.**
- [ ] **Launch-day check:** search "IT support Saltdean" and "Salt IT Saltdean", and confirm the name, phone and spelling match everywhere.

---

## 10. Visual and UX direction: "SpaceX-minimal", adapted for an older audience

**What "SpaceX-minimal" means here:**

- one idea per screen;
- very large confident type;
- huge negative space;
- thin 1px rules instead of boxes;
- square-cornered buttons;
- uppercase micro-labels;
- almost no colour;
- no decoration, icons, gradients, shadows, carousels, stock photos or animation for show.

**What we deliberately don't copy:**

- all-caps headlines, which are harder for older readers;
- light-grey-on-black body text;
- tiny nav text as the only way to act.

Readability and the phone button win every conflict.

### Layout

- **Mobile-first.** Design at 360–390px wide, then scale up. Breakpoints are 760px (tablet) and 1100px (desktop).
- **Page width:** `min(1120px, 100% - 40px)` (32px gutters on mobile).
- **Spacing scale (px):** 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128. Section vertical padding is 64px on mobile and 112–128px on desktop.
- **Section separation:** a 1px `--line` rule plus space. There's one dark full-bleed band, the **hero** (see below). Everything else sits on salt white.
- **Hero:** full-bleed soft charcoal (`#2B2F33`) with salt-white text.
  - Height: `min-height: 88svh` on mobile, `min-height: 720px` on desktop.
  - Content sits in the lower two-thirds.
  - The chalk-cliff line art (`hero.svg`) may sit at 8–12% opacity along the bottom edge, recoloured for the dark ground. A real photo by Brad of Saltdean can replace it later, provided the text contrast holds.
  - The H1, sub, both buttons and the price micro line must all be visible **without scrolling on a 390×844 phone**.
- **No cards.** "What I fix" rows, prices and promises are separated by rules, not boxed.

### Colour (existing tokens, with one contrast fix)

| Token | Hex | Use |
| --- | --- | --- |
| Salt white | `#FAFBFC` | Page background; text on the hero |
| Soft charcoal | `#2B2F33` | Body text; hero background; primary button |
| Muted | `#5F676E` | Secondary text (5.55:1 on white) |
| Accent text | **`#4A7488`** (replaces `#527E91`) | Eyebrows and small labels on white (4.89:1). The old `#527E91` is 4.27:1 and fails AA for small text. |
| Lido sky | `#7EB8D4` | Rules, focus rings, and eyebrows **on charcoal only** (6.23:1). Never used as text on white (2.09:1). |
| Turkish Aegean | `#7898A4` | Decorative bullets and rules only. Never text on white (2.97:1). |
| Button hover | `#435F6D` | Primary hover (6.55:1 with white text) |

### Type

- **Font:** the existing system stack, `"Helvetica Neue", Helvetica, Arial, sans-serif`. No web fonts.
- **Body:** **18px** / 1.6 on all sizes. Nothing smaller than 16px except uppercase micro-labels (13px minimum, tracked 0.14em, weight 700).
- **H1:** `clamp(2.6rem, 9vw, 5rem)`, weight 500, letter-spacing −0.04em, line-height 1.02, sentence case.
- **H2:** `clamp(2rem, 5.5vw, 3.2rem)`, weight 500, letter-spacing −0.035em, line-height 1.05, sentence case.
- **Row labels (H3):** 1.25rem, weight 600.
- **Prices:** tabular figures (`font-variant-numeric: tabular-nums`), 1.25rem, weight 600, right-aligned.
- **Line length:** 60–70 characters maximum for body text.

### Buttons and calls to action

- **Primary:** solid charcoal (solid salt white on the hero), square corners, **minimum 52px tall** (48px is the floor for any tap target), 20–28px horizontal padding, 14px uppercase label tracked 0.08em.
- **Secondary:** a 1px outline in the same colour, same size.
- **Full width on mobile** in the hero and contact sections.
- **Phone links** are always `<a href="tel:+44…">`, and the accessible name includes the word "Call" (e.g. `aria-label="Call Brad on 07… "`).

### Sticky mobile call bar

- Shown **under 760px only**. Fixed to the bottom, 64px tall plus `env(safe-area-inset-bottom)`, soft charcoal background.
- Two equal buttons: **Call Brad** (`tel:`) and **Message** (WhatsApp if **[BRAD]** confirms it, otherwise `#contact`).
- Add bottom padding to the page so the bar never covers the footer.
- It appears once the hero's own call button has scrolled out of view (IntersectionObserver). With JS off it's simply always visible. No other scroll effects.

### Header

- Height 64px. Transparent over the dark hero, with salt-white text.
- Not sticky (the mobile bar does that job). On desktop it may become sticky with a salt-white background after the hero, if that stays simple. This is optional.

### Motion and interaction

- Only hover/focus colour transitions (150–180ms). No parallax, no scroll-triggered fades, no auto-playing anything.
- Keep the `prefers-reduced-motion` rule.
- Visible focus ring: 2px lido sky, 4px offset, on everything interactive.

### Accessibility (non-negotiable)

- WCAG 2.2 AA contrast for all text (see the colour table).
- Skip link, landmarks (`header`, `main`, `footer`, `nav`), and one H1.
- Form fields have visible labels (not placeholder-only). Errors are announced via `aria-live`, and invalid fields are marked with `aria-invalid`.
- Prices are a real `<table>` with `<th scope>`.
- Decorative images use `alt=""`. There's no text inside images.
- Everything is usable at 200% zoom and at 320px width with no horizontal scroll.

### Performance budget

- **Total transfer under 150 KB** on first load, excluding the optional Brad photo (which must be WebP/AVIF, under 60 KB, with explicit width and height).
- **Zero third-party requests.** No analytics, font CDN, review widget or map embed on day one.
- **JavaScript under 3 KB,** covering the form handoff, the year, and the sticky-bar observer. The page must work fully with JS off (phone links, anchors and content).
- **Lighthouse mobile:** Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100. LCP under 2.0s on simulated 4G. CLS under 0.05.

---

## 11. Files the later build will touch (for scoping only; do not implement now)

- `index.html`: full content rewrite to this IA. JSON-LD and meta go in `<head>`.
- `styles.css`: restyle to section 10, reusing the existing tokens and the contrast fix.
- `script.js`: new form fields and subject line, plus the sticky-bar observer. Remove the `data-interest` AI logic.
- `assets/mark.svg`: update the `aria-label` to "Salt IT".
- New: `assets/og-image.png`, `robots.txt`, `sitemap.xml`.
- `README.md`: update the brand rules (Salt IT, Saltdean) and the palette table.

No hosting, DNS, Cloudflare, build tooling or framework changes.

---

## 12. Explicitly out of scope

- **Domain, DNS, Cloudflare, hosting and deployment settings.** saltit.co.uk is already on Cloudflare and none of it is touched by this brief or the build.
- **Legal and regulatory content.** Privacy policy, cookie notices, terms, company or VAT details, insurance and certification claims are all excluded. They're not written, designed or drafted here.
- **A workshop or drop-off service**, and anything that implies one.
- **Multi-town "thin" pages** (e.g. `/it-support-peacehaven`). One page only until a town has something true and specific to say.
- **Small-business retainer or per-user pricing** (£35–£60 per user per month, monthly blocks, managed IT).
- **Household retainers, subscriptions and annual home-check plans.** The research says "optional later, not day one".
- **The AI automation offer** on this page.
- **Full smart-home installs** (doorbells, heating, cameras, hubs) as a featured service. Smart TV is mentioned only under Wi-Fi.
- **Screen, liquid-damage and hardware repair** as a featured service.
- **Invented testimonials, ratings, customer counts, stock photos and AI-generated people.**
- **Analytics, chat widgets, booking systems, maps, review widgets** and any third-party script.
- **A blog or news section.**
- **Creating the Google Business Profile, Nextdoor, Bing or Apple listings** (Brad's tasks, listed in section 9, not the build).

---

## 13. Build acceptance criteria (Brad ticks these after the build)

### Content and brand

- [ ] The brand reads **Salt IT** everywhere: header, footer, title, meta, JSON-LD, alt text, mark `aria-label`. Searching the HTML for `SaltIT` returns nothing.
- [ ] **Saltdean** is always one word. Searching for `Salt Dean`, `Salt-dean` and `Southend` returns nothing.
- [ ] H1 is exactly `Home IT support in Saltdean.` (or an approved variant containing "IT support" and "Saltdean").
- [ ] Title is `IT Support Saltdean | Home Computer & Wi-Fi Help | Salt IT`. "AI" appears nowhere in the title, meta or first screen.
- [ ] The five jobs appear in this order: Wi-Fi, printer after a new router, slow or new laptop, email, scam. Smart TV is mentioned under Wi-Fi.
- [ ] The older-relative line ("Booking for Mum or Dad?") is present.
- [ ] On-site is presented as the default, with remote as second. The line "I will never call you out of the blue asking to connect" is present.
- [ ] Hours are shown, and they're Brad's confirmed real hours. Same-day is phrased as "ask".
- [ ] The area list is Saltdean, Rottingdean, Peacehaven, **Woodingdean**, then Brighton & Hove.
- [ ] The AI automation offer is gone from the page, the nav and the form.

### Prices

- [ ] Published: **£75** first hour including travel (four named places), **£30** per extra half hour, **£35** remote up to 30 minutes, **£95** same-day, evening or Saturday first hour. (Or other figures Brad has approved within the research mid band.)
- [ ] Typical jobs: **£75–£90** Wi-Fi or printer, **£80–£110** scam or virus, **£90–£130** new laptop.
- [ ] "Pay per visit. No contracts, no monthly fee." is present. No retainer, subscription or per-user price appears anywhere.
- [ ] The 14-day return line matches in both Prices and the promises (or both are removed together).
- [ ] The prices are an HTML `<table>`.

### Trust and CTA

- [ ] **No placeholder phone anywhere.** Searching for `xxx` and `01xxx` returns nothing. Every phone number is Brad's real number, and every `tel:` link dials it correctly on a real phone.
- [ ] A phone call to action is visible in the header, in the hero without scrolling (390×844), in the sticky mobile bar, and in the contact section.
- [ ] Brad is named, and "based in Saltdean" is stated.
- [ ] The Reviews section shows the honest empty state, or only real, attributable Google reviews. Nothing is invented.
- [ ] The form has name, phone, area, "what's gone wrong" and a "booking for someone else" checkbox. It opens a pre-filled email with the subject `Home visit enquiry — [area] — [name]`.

### SEO

- [ ] The meta description is present and under 160 characters.
- [ ] The canonical is `https://saltit.co.uk/`, and the OG tags plus a 1200×630 OG image are present.
- [ ] LocalBusiness JSON-LD is present with the real phone. It passes Google's Rich Results Test with no errors, `areaServed` lists all five places, and `priceRange` is set.
- [ ] Footer NAP is character-for-character identical to the Google Business Profile.
- [ ] Each SEO phrase appears once, in a natural sentence, and nothing is keyword-stuffed.
- [ ] `robots.txt` and `sitemap.xml` are present.

### Visual, UX and accessibility

- [ ] Checked at 360, 390, 768 and 1280px wide, with no horizontal scroll at 320px.
- [ ] Body text is 18px. No text is smaller than 16px except uppercase micro-labels (13px minimum).
- [ ] All tap targets are at least 48px, and primary buttons are at least 52px tall.
- [ ] Contrast is AA throughout: lido sky and Turkish Aegean are never used as text on white, and small accent text uses `#4A7488`.
- [ ] Keyboard-only: skip link works, focus is always visible, and the form can be completed and submitted.
- [ ] The page works with JavaScript disabled (content, anchors, phone links).
- [ ] No carousels, parallax, auto-play or third-party requests (check the Network tab).

### Performance

- [ ] Lighthouse mobile: Performance ≥ 95, Accessibility 100, Best Practices ≥ 95, SEO 100.
- [ ] First-load transfer under 150 KB (excluding the optional photo).

### Scope

- [ ] No changes to Cloudflare, DNS or hosting.
- [ ] No legal or regulatory pages or text added.
- [ ] No town sub-pages, workshop mention, or business retainer pricing.

---

## 14. Open decisions for Brad (needed before the build)

1. **Spelling:** approve **Salt IT**, or choose SaltIT. Either way, it's one spelling everywhere.
2. **Phone number** for the site and all listings, and whether WhatsApp is on it.
3. **Hours** you can reliably keep, including whether evenings and Saturdays are standard or by arrangement.
4. **Prices:** approve £75 / £30 / £35 / £95 and the three job bands, or move them within the research mid band.
5. **Return window:** 14 days, or another figure.
6. **Wider Brighton & Hove travel:** no supplement, or a published figure.
7. **Payment methods** to list.
8. **Bio facts** (20+ years, EPOS) and an optional surname and photo.
9. **Callback promise:** "same day", or "as soon as I can".
