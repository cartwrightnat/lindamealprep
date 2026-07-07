# Recipe photos for the item picking list

## What / why

`src/components/PrepItemCard.tsx` renders each recipe card with an `<Image
src="/items/{recipe.id}.jpg" ...>`, falling back to `/items/placeholder.svg` on
load error. Until 2026-07-07 no actual photos existed in `public/items/` — every
card in the item picker silently fell back to the placeholder icon. This was
never filed as a bug; it was noticed and fixed ad hoc in the same session as
[NAT-61](../tickets/fix-vercel-function-timeout.md) (unrelated Game Plan
timeout fix).

All 27 recipes in `src/data/library.json` now have a matching
`public/items/{id}.jpg`.

## Where the photos came from

Sourced via the [Openverse](https://openverse.org) API (`api.openverse.org`),
which aggregates openly-licensed images from Flickr, museums, and other
providers — no API key required. Wikimedia Commons was tried first and
rejected: its CDN (`upload.wikimedia.org`) aggressively rate-limits requests
from cloud/datacenter IP ranges (HTTP 429 with `Retry-After`, persistent even
with backoff), which made it impractical to use from a sandboxed dev
environment. Openverse results hosted on Flickr's CDN had no such issue.

**Method:** for each recipe, query Openverse with a few keyword variants,
download 1–3 top candidates, and visually review each one before picking —
plain keyword/title matching on Flickr's metadata is noisy (roughly 70% of
first-pick results in the initial pass were wrong dish entirely, e.g. a
"vegetarian chili" query top hit was a cucumber salad). Multiple search rounds
with tightened required-keyword filters were needed for about 20 of the 27
recipes. See `public/items/SOURCES.md` for the full per-photo attribution
(title, creator, license, provider) for every image actually used.

Images were normalized after download: EXIF orientation applied then stripped
(some source JPEGs carried EXIF/TIFF metadata that certain image viewers
choked on), converted to baseline RGB JPEG, capped at 1600px on the long edge.

## Licensing caveat — read before reusing these images elsewhere

This was done for **personal/family use only**, per explicit direction from
the project owner, who confirmed licensing/attribution risk was acceptable for
that audience. The images are real photos under their original creators'
Creative Commons licenses (see `public/items/SOURCES.md`) — several are marked
**NC (non-commercial)** or **ND (no-derivatives)**. They are *not* cleared for:

- Public or commercial deployment of this app
- Any use requiring attribution-free or unrestricted-modification rights

If this project's audience or purpose changes, treat every image in
`public/items/` as needing a license review (or replacement with genuine stock
photos / AI-generated images / the owner's own photos) before that change
ships.

## Known imperfect matches

A few recipes didn't have a great real-photo match available after multiple
search rounds; the closest reasonable proxy was used instead of leaving a
placeholder:

- `seared-salmon.jpg` — shows salmon actively searing in a pan rather than a
  finished glazed fillet
- `green-goddess-dressing.jpg` — shows a salad dressed with it (dressing itself
  reads white/cream in-photo, not visibly green) rather than a jar/bowl of the
  dressing alone
- `turkey-meatballs.jpg` — shows meatballs in a Moroccan-style stew rather than
  baked on a wire rack
- `cheddar-cheese-sauce.jpg` — shows nacho cheese sauce on chips rather than a
  standalone sauce/pot shot
- `nutritional-yeast-dressing.jpg` — a generic creamy vegan sauce; visually
  plausible but not confirmed to be nutritional-yeast-based
- `chopped-cabbage-salad.jpg` — cabbage is visible and dominant but mixed with
  pasta, not a pure chopped-cabbage salad

## Re-running or updating this later

There's no committed script for this — it was done interactively (Openverse
API calls via `requests`, image normalization via `Pillow`, both installed
ad hoc, neither added to this project's dependencies). To redo a photo for a
given recipe:

1. Query `https://api.openverse.org/v1/images/?q=<search terms>&mature=false`
   (no auth needed).
2. Filter results: skip `provider == "wikimedia"` (rate-limit issue above),
   require reasonable width/height, skip obviously irrelevant titles.
3. Download a few candidates and look at them before picking — don't trust
   the first result.
4. Normalize with Pillow: `ImageOps.exif_transpose`, convert to RGB, re-save
   as JPEG.
5. Save as `public/items/{recipe-id}.jpg` and add an entry to
   `public/items/SOURCES.md`.
