# Zoe Life — Phase 1 custom site

A complete, responsive, accessible static site for Zoe Life, prepared by Cozy
Digital. Site voice is Zoe Life.

This is the shipping Phase 1 custom site (native HTML + `tools/build.mjs`).
It is not a Squarespace restyle. Live Squarespace at
[zoelifehub.com](https://www.zoelifehub.com) remains the public domain until
cutover. GitHub Pages on upstream still publishes an older branch.

Meeting 3 direction (launch target Wednesday 2 September 2026): banner
wordmark, one-sentence tagline, Instagram grey / tan / peach palette, real
photos of Pastors Tayo and Kemi Akinyemi, two Saturday book covers only, Connect
(not Family Life as the main nav), Google Calendar consult booking, inbox-routed
forms, and fail-closed payments.

## Run it

```bash
node tools/build.mjs            # production build (indexable)
node tools/build.mjs --staging  # staging build (noindex + robots Disallow)
node tools/serve.mjs 8765       # http://127.0.0.1:8765
```

Keep `--staging` on any public preview until the domain actually switches, so
this copy cannot compete with the live Squarespace site in search.

Every integration is **fail closed** until configured and explicitly accepted by
its provider. See `DEPLOY.md`.

## Checks

```bash
node tests/check-site.mjs     # static honesty, SEO, contrast, and structure
node tools/qa.mjs             # page/width browser checks, including 390px
node tools/qa-forms.mjs       # interaction checks, including fail-closed submit
```

`tools/qa.mjs` and `tools/qa-forms.mjs` need the server running and drive real
Chrome over the DevTools Protocol. No npm dependencies.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| About | `about.html` |
| Books & Resources | `books.html` |
| Connect | `connect.html` |
| Contact | `contact.html` |
| Complimentary consultation | `consult.html` |

`family-life.html` and `appointments.html` are short “this page has a new home”
stubs that point at Connect and Consult.

Pages are generated from shared chrome by `node tools/build.mjs`. The output is
plain static HTML and is committed, so hosting still needs no build step.

## Design

Warm, light, welcoming, professional. Instagram grey, tan, and a little pastel
yellow / peach, with sage and gold from the wordmark. Fraunces (display) and
Outfit (humanist sans), self-hosted. Photo-led layouts rather than generic card
grids.

Header uses the gold **ZOE LIFE** banner wordmark (green leaf in the O). The
circular mark is favicon and footer only. Tagline is a separate sentence:
*Helping people thrive in every season of life.*

## Honesty rules

The build never invents client facts:

- No prices, and no invented store URLs. If Stripe / PayPal links are not in
  the environment, the Books page says **purchase options coming**.
- Printed copies, when offered, will be fulfilled by a print-on-demand partner.
  The site does not describe packing and shipping from home.
- Consultation booking uses the approved Google Calendar appointment schedule.
  If `ZOE_GOOGLE_CALENDAR_BOOKING_URL` is unset, `/consult` shows a clearly
  labeled `GOOGLE_CALENDAR_BOOKING_URL` placeholder. Complimentary 20-minute
  consults, Mondays and Wednesdays, 6:00 to 8:00 PM Central.
- Contact messages and mailing-list signup requests route to
  `contact@zoelifehub.com` through FormSubmit. The browser reports success only
  when FormSubmit returns an explicit accepted response; HTTP 2xx alone is not
  enough. Signup requests reach the inbox for processing and do not pretend to
  create a subscriber record in a separate email platform.
- The Zoe Life inbox appears in the public FormSubmit endpoint configuration,
  not as a direct email link in visible page copy.
- Google Analytics uses GA4 property `G-R18R3LVBK9` on every generated page.
- No Unsplash, Pexels, or generated pastor-couple stock. People photos are
  Pastors Tayo and Kemi Akinyemi from the live Zoe Life site.
- The couple workbook (“Questions Every Christian Couple Should Discuss”) is
  not on this site.

## Assets

```
assets/brand/zoe-life-wordmark.jpg          header banner wordmark
assets/brand/zoe-life-mark.png              circular mark (favicon / footer)
assets/books/gratitude-devotional-cover.jpg 7-Day Gratitude Devotional (Saturday)
assets/books/gratitude-journal-cover.jpg    100-Day Gratitude Journal (Saturday)
assets/photos/*.jpg                         Tayo and Kemi photographs
assets/photos/provenance.json               source notes for every image
```

The 7-Day cover and people photographs come from the live Squarespace CDN. The
header wordmark and 100-Day journal cover were rebuilt from the Saturday files
supplied for this update so the header is a banner (not only the circular mark)
and the journal is no longer a “cover pending” box.

## Out of scope

Client AI self-edit tool, courses / training videos, paid coaching rates, and
marketplace URLs are not built. Print-on-demand partner onboarding is a
separate intro.
