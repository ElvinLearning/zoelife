# Zoe Life pre-release review

Review date: 2026-10-20 UTC. Base: `ElvinLearning/zoelife:claude/zoe-life-website-boiqf0`, commit `7591a0cf2e058ef13b03c57fabfcefcd3f376f33`. Work is proposed from `kaysongt/zoelife:cozy/pre-release-copy-shop-qa`. This is a review branch, not a release approval.

All 31 public pages and all 13 article sources were read before editing. The site’s current layout, portraits, book-cover shadows, Scripture quotations, and individual personal stories were retained. Internal Squarespace snippets and old meeting/demo HTML are development documents, not public navigation pages or files in the assembled site.

## Review documents

- [Every visible copy change, before and after](copy-changes.md): 107 distinct changes, with affected pages; includes metadata and calculated reading times. The dynamic course-return message is also documented.
- [Source-level copy edit record](source-copy-changes.json): 136 targeted edits in the builder, articles, and course descriptions.
- [Client decisions and exact TODO locations](client-todos.md).
- [All 93 full-page screenshots](screenshots.md): every page at 375px, 414px, and 1280px.
- [Browser checks and outcomes](results.json).
- [External-link reachability](external-links.json).

## Results

| Check | Result | Evidence / limitation |
|---|---|---|
| Static site checks | PASS | 1,183 checks; labels, metadata, canonical URLs, local assets, naming, palette contrast, preserved clip catalog and integration checks |
| Build/config checks | PASS | 51 checks; configured URLs survive rebuilding without environment overrides |
| Integration build | PASS | Mock Amazon/Lulu/Gumroad URLs, paid booking, course slots, unsafe URL rejection, isolated Stripe sandbox, production test-link rejection |
| Workspace backend tests | PASS, simulated | Validation, persistence/email failures, retries, rate limits, formula escaping, consent, confirmation, expiry, unsubscribe, read-only GET and daily cap; no real mail sent |
| Responsive browser render | PASS | 31 pages × 3 widths = 93 renders; no horizontal overflow, duplicate IDs, missing images, heading-order gaps, or JavaScript exceptions |
| Interactions and link checks | PASS | 1,619 checks including menus, Escape/focus behavior, every newsletter form, conditional contact field, rejection/success states, confirmation/unsubscribe and directory aliases |
| Internal destinations | PASS | 155 unique internal URLs/anchors plus alias navigation/assets resolve |
| Images | PASS | Existing compressed JPEG portraits/covers, explicit dimensions, alt attributes, below-fold lazy images; original full portrait replaces the cropped consultation asset |
| Metadata | PASS | 31 unique titles/descriptions; canonical and OG image/title on every page; favicon; subscription page stays noindex/no-referrer |
| Short clips | PASS | All 24 local clips started playback; original files, titles, source YouTube URLs, categories, order, and six playlist embeds preserved |
| YouTube playlist playback | UNVERIFIED | Browser embed requests returned empty responses in this environment. Preserved all six URLs and added a direct YouTube fallback per series. HTTP 200 alone does not prove playback |
| External reachability | PARTIAL | 45 of 46 destinations returned HTTP 200; Zoe Family Life TikTok returned 403. No links were replaced with guesses |
| Booking | PARTIAL | Original Google Calendar link preserved and resolves to its appointment schedule; no appointment was booked |
| Live contact/Sheet/email delivery | UNVERIFIED | Browser POSTs were intercepted. Owner needs one end-to-end check against deployed Apps Script and the designated Sheet |
| Live newsletter delivery | UNVERIFIED | Consent/confirmation/unsubscribe logic passes mocked tests; actual email delivery and live subscription state need an owner check |
| Book checkout | PENDING CLIENT | All existing product slots are null in this branch. Eight disabled controls show Coming soon; no invented URLs or purchases. Only approved devotional prices shown: website $9.99 / Amazon $12.99 |
| Domain release | UNCHANGED | Canonicals target `https://www.zoelifehub.com/`. Staging/noindex preserved. DNS, Pages configuration, billing, and CNAME were not changed |

The final screenshot capture resets scroll before each page and tiles long pages to avoid a Chromium capture-surface artifact. The final consultation screenshot uses the uncropped original; that image reference was the only site change after the all-page interaction run. Its asset loads and rendered result were checked at all three widths.

## Bugs and discrepancies fixed

| Location | Fix |
|---|---|
| `tools/build.mjs`, `content/blog/*.md`, `tools/site-content.mjs` | Replaced narrator-style introductions and attributions with shared voice; removed chat-like homepage language and repetitive filler; rewrote the generic Recipes article; retained personal anecdotes and unchanged Bible quotations |
| `tools/build.mjs` About faith section; `css/style.css` `.faith-disclosure` | Kept all ten statements behind a keyboard-operable native disclosure, collapsed by default |
| `tools/build.mjs` `payButtons`; `tools/site-config.mjs` | Replaced internal Stripe/PayPal setup copy with Amazon, Lulu print, Gumroad PDF and Etsy PDF controls; unconfigured slots are disabled buttons without fake hrefs |
| `.github/workflows/deploy.yml` | Added the two Lulu variables; retained every existing deploy variable and the deployment trigger/permission model |
| `tools/assemble.mjs` | Fixed relative asset/navigation paths in pretty-URL directory aliases, retaining same-page anchors. Copies only public files, keeping QA screenshots out of the deployed artifact |
| `subscription.html` | Removed its separate off-palette stylesheet; added unique description, canonical, OG data and favicon; retained no-referrer, noindex, token handling and endpoint behavior |
| `css/style.css` | Aligned status/error backgrounds and text with approved cream/beige/charcoal; gold/peach remain accents; restored native select affordance; gave breadcrumb/standalone links and consent labels appropriate tap space; stopped masking overflow with body clipping |
| `tools/build.mjs` consultation image | Replaced the already-cropped photograph with the existing full image so Tayo’s head is visible |
| `tools/build.mjs` footer/journal image markup | Added lazy loading below the fold; clip video preload remains none and playlist embeds remain lazy |
| `tools/build.mjs` resource playlists | Added direct playlist links as a fallback when embeds cannot load |

## Protected integrations

Compared every original key/value in `js/config.js` with the base commit: all unchanged. The only additive payment keys are `payments.devotional.lulu` and `payments.journal.lulu`, initially null. The entire clip/category portion of `tools/site-content.mjs` is byte-for-byte unchanged. Every original `vars.*` name in the deployment workflow is retained. Form handlers, Apps Script backend, mailing endpoints, Google Calendar URL, and subscription script are unchanged. FormSubmit PR #10 was not edited or merged.

## Adding the real book links

Use the existing payment resolver in `tools/site-config.mjs` and its generated `js/config.js` payments object. Supply URLs through existing repository variables or the matching build environment variables, then rebuild. Ordinary rebuilds retain configured HTTPS values. Do not paste sample URLs into the public config.

| Product | Amazon | Lulu Direct | Digital |
|---|---|---|---|
| Devotional | `ZOE_AMAZON_DEVOTIONAL_URL` | `ZOE_LULU_DEVOTIONAL_URL` | `ZOE_GUMROAD_DEVOTIONAL_URL`, `ZOE_ETSY_DEVOTIONAL_URL` |
| Journal | `ZOE_AMAZON_JOURNAL_URL` | `ZOE_LULU_JOURNAL_URL` | `ZOE_GUMROAD_JOURNAL_URL`, `ZOE_ETSY_JOURNAL_URL` |

Lulu needs the actual order/checkout destination connected to fulfillment, not merely an account sign-in or registration URL. The UI explains that the buyer pays shipping at checkout. Existing Stripe/PayPal book config is retained for compatibility, while the explicit staging sandbox remains available. Partnership Stripe/PayPal controls are unchanged.

## Reproducing the checks

```sh
node tools/build.mjs --staging
node tests/check-site.mjs
node tests/check-build.mjs
node tests/workspace-forms.mjs
node tests/integration-build.mjs
node tools/assemble.mjs /tmp/zoe-release-site
QA_ROOT=/tmp/zoe-release-site node tools/serve.mjs
```

In a second terminal with Playwright, Chromium, and Sharp installed:

```sh
QA_ROOT=/tmp/zoe-release-site node tools/qa-release.mjs
```

`PLAYWRIGHT_MODULE`, `SHARP_MODULE`, `CHROME_PATH`, and `QA_BROWSER_ARGS` can select an existing local browser/runtime. They are QA-only options and are not deployment variables. Analytics is suppressed and Apps Script POSTs are intercepted during browser QA. The runner exits nonzero for interaction, layout, internal-link, or page-script failures.
