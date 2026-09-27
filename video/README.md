# Salt IT Facebook ad

A 27-second video ad built from the rebuilt saltit.co.uk: the same copy, prices, Barlow type,
warm paper and Lido turquoise palette, and the area map.

| File | Size | Use it for |
| --- | --- | --- |
| `salt-it-facebook-ad-4x5-feed.mp4` | 1080×1350 (4:5) | Facebook and Instagram feed. Start with this one. |
| `salt-it-facebook-ad-9x16-stories-reels.mp4` | 1080×1920 (9:16) | Stories and Reels. Text stays clear of the app's top and bottom overlays. |
| `salt-it-facebook-ad-1x1-square.mp4` | 1080×1080 (1:1) | Marketplace, right column, or a plain page post. |

In Ads Manager you can upload the 4:5 and 9:16 files to the same ad ("Customise asset per
placement") and Facebook shows the right one in each place.

All three are H.264 + AAC at 30fps, about 2 MB each. Every word is on screen, so the ad works
with the sound off, which is how most people see it in the feed.

## What it says

| Time | Scene |
| --- | --- |
| 0–4s | The hook, on dark ink: *Wi-Fi dropping out? Printer gone offline? Laptop crawling? Email won't send? Worried it's a scam?* The first frame already has a headline, so the thumbnail isn't blank. |
| 4–8s | *Simon fixes it. At your home.* Reliable home IT support from a neighbour in Saltdean, 20+ years in IT. |
| 8–13s | The five jobs from the site, in the site's order. |
| 13–17s | *£75 first hour*, the price before I travel, no contracts, remote from £35, free return visit within 14 days. |
| 17–22s | The area map: Saltdean, Rottingdean, Peacehaven, Woodingdean, Brighton & Hove. *Booking for Mum or Dad?* |
| 22–27s | Call or WhatsApp Simon on **07843 468904**, saltit.co.uk, and the hours. |

The phone number stays in the top corner the whole way through, for anyone who scrolls on early.

## Suggested ad text

**Primary text**

> Wi-Fi dropping out? Printer gone offline after a new router? Worried you've been scammed?
>
> I'm Simon. I fix home IT in Saltdean, Rottingdean, Peacehaven and Woodingdean. I come to you, tell you the price before I travel, and explain what I did in plain English.
>
> First hour £75 · No contracts · Remote help from £35
>
> Call or WhatsApp 07843 468904

**Headline:** Home IT support in Saltdean
**Description:** First hour £75. The price before I travel.
**Button:** Call now, or Send WhatsApp message

## Editing and re-rendering

`ad.html` is the whole ad. Every scene is plain HTML/CSS, animated by a deterministic
`render(t)` function. Open it in a browser to watch it loop, add `?format=story` or
`?format=square` for the other sizes, or `&t=12` to freeze on one moment while you change the
wording.

To make new MP4s you need Node, Python 3 with numpy, and an ffmpeg that has libx264:

```sh
npm install --no-save playwright && npx playwright install chromium
python3 video/make_audio.py                # writes video/audio.wav (same result every run)
node video/render.js                       # 4:5 feed
node video/render.js --format story        # 9:16 Stories / Reels
node video/render.js --format square       # 1:1
node video/render.js --stills 2,10,24      # quick PNG previews instead of a full render
```

Set `FFMPEG=/path/to/ffmpeg` if ffmpeg is not on your PATH. If you change scene timings in
`ad.html`, update `SCENES` and `HOOK` in `make_audio.py` so the music still lands on the cuts.

The soundtrack is synthesised by `make_audio.py`, so there is no music licence to worry about.
The ad does not use the cliffs photo from the site: it is CC BY-SA and would need a credit on
screen.
