# Zoe Life — Phase 1 reference build

A complete, responsive, accessible five-page reference implementation of the
Zoe Life Phase 1 site, prepared by Cozy Digital.

**This repo is the design and content reference. It is not the production site.**
The agreed Phase 1 deliverable is a Squarespace build at zoelifehub.com. This
build exists so the design, copy, structure, and accessibility decisions are
settled and reviewable before they are assembled in Squarespace. The
configuration handoff is in [`docs/squarespace-setup.md`](docs/squarespace-setup.md).

Nothing here has been deployed. Every page carries `noindex, nofollow`.

## Run it

No build step is needed to view the site; the HTML is committed.

```bash
node tools/serve.mjs 8765     # http://127.0.0.1:8765
```

## Checks

```bash
node tests/check-site.mjs     # 179 static checks
node tools/qa.mjs             # 25 page/width browser checks + screenshots
node tools/qa-forms.mjs       # 32 interaction checks
```

`tools/qa.mjs` and `tools/qa-forms.mjs` need the server running and drive real
Chrome over the DevTools Protocol. No npm dependencies at any point.

> The previous `tests/check_site.py` was removed: this machine has no Python
> interpreter, so it could never actually be run. The Node suite covers the same
> ground and more.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| About | `about.html` |
| Books & Resources | `books.html` |
| Family Life / Socials | `family-life.html` |
| Contact | `contact.html` |

Pages are generated from shared chrome by `node tools/build.mjs`, so the header,
footer, and social links cannot drift apart. The output is plain static HTML and
is committed, so hosting still needs no build step.

## Design

Warm and light, per the approved 21 Aug brand direction: cream and warm neutrals,
sage green, warm gold, soft tan, with restrained terracotta and peach. Fraunces
and Outfit, self-hosted.

This replaces the earlier dark espresso concept, which contradicted the client's
written direction ("avoid black or dark themes"). The WebGL cross, GSAP, Lenis,
film grain, and custom cursor were removed with it; the concept branches
`claude/zoe-life-website-boiqf0` and `cozy/enhance-current-site-content` still
carry them.

Every colour pair is contrast-checked in `tests/check-site.mjs`, and `tools/qa.mjs`
independently measures the contrast of every rendered text element in the browser.

## Honesty rules

The build never invents client facts. Unverified data is either absent or
visibly marked pending:

- No prices, and no invented store URLs. Store options render as disabled chips.
- The 100-Day Gratitude Journal cover is missing and shows a "Cover pending" placeholder.
- Supplied "About Zoe Life" and "Meet Tayo & Kemi" copy was never provided to this
  build; those sections use verified public copy and say so.
- **Forms fail closed.** No endpoint is configured, so a valid submission reports
  that it was *not* delivered. It never fakes success. This is asserted by tests.
- No Zoe Life email address appears anywhere on the site.

Full list: `docs/squarespace-setup.md` section 8.

## Content sources

- `docs/current-site-content.md` — copy captured from the live zoelifehub.com
- `assets/photos/provenance.json` — image source URLs, dimensions, checksums

## Assets

Two files on the previous branch were misnamed: `founder-tayo.jpg` and
`founder-kemi.jpg` were not founder photos, they were book covers, and were being
rendered as covers with mismatched filenames. They are now:

```
assets/brand/zoe-life-logo.png                             the real logo
assets/books/gratitude-devotional-cover.jpg                7-Day Gratitude Devotional
assets/books/questions-before-marriage-workbook-cover.jpg  Questions Before Marriage workbook
assets/photos/founders-tayo-kemi.jpg                       the actual founders photo
assets/photos/*.jpg                                        supporting photography
```

## Out of scope

The advanced paid-coaching system (six appointment types, deposits, balance
collection, refunds, Stripe/PayPal, per-appointment Zoom) is **not** built and is
not stubbed into anything public. It needs a written scope decision first. See
`docs/squarespace-setup.md` section 9.
