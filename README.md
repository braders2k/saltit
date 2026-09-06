# SaltIT

The first marketing site for [saltit.co.uk](https://saltit.co.uk): local home IT support and
small-business AI automations, based in Saltdean.

## Run locally

The site is deliberately framework-free. Serve the repository root with any static server:

```sh
npx serve .
```

Then open the local URL printed in the terminal. The contact form validates in the browser and
opens a pre-filled email to `hello@saltit.co.uk`; it does not claim to submit to a backend.

## Brand

| Token | Hex | Use |
| --- | --- | --- |
| Salt white | `#FAFBFC` | Page background |
| Soft charcoal | `#2B2F33` | Body text and dark sections |
| Lido sky | `#7EB8D4` | Primary accent |
| Turkish Aegean | `#7898A4` | Secondary accent |

- Brand name: **SaltIT** (capital S and IT)
- Voice: direct, calm, local, and free of corporate jargon
- Visual direction: extreme negative space, sharp type, minimal decoration
- Typeface: system Helvetica/Arial stack for speed and consistency

## Structure

`index.html` contains the complete semantic single-page site. `styles.css` is mobile-first
responsive styling, and `script.js` handles the email-form handoff and current footer year.
Optimized artwork and the favicon live in `assets/`.
