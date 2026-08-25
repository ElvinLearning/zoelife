# Zoe Life Phase 1: Squarespace configuration spec

This repo is the **design and content reference**. The production site is the
Squarespace build at zoelifehub.com. This document is the handoff: everything a
person (or another agent with Squarespace access) needs to assemble Phase 1 in
the Squarespace admin UI, matching the reference build.

Nothing in here has been executed. No account was created, no DNS was touched,
no subscription was activated, and nothing was published.

---

## 0. Access and prerequisites

| Item | Status |
| --- | --- |
| Squarespace contributor invitation | Received 22 Aug 2026 |
| Collaborator identity to use | `cozydigital.out@gmail.com` |
| Domain | `zoelifehub.com` (already live on Squarespace) |
| Google Workspace | Not yet verified operational |

**Before anything else:** check whether the current Squarespace plan includes a
Google Workspace promotion or first-year offer. If it does not, tell Zoe Life the
exact cost before purchasing. Do not activate any paid plan without written
approval.


---

## 0a. Decision recorded, 25 August 2026

**Zoe Life chose to stay on Squarespace.** This document is now the build plan,
not one of two options.

Consequences that change how we work:

### Build natively, not with code blocks

The Phase 1 preview page was a single **Code Block** holding hand written HTML
and CSS. That was right for a demo and is **wrong for production**, because a
code block cannot be edited from the Squarespace editor.

One of the strongest reasons to stay on Squarespace is that Zoe Life can update
their own content. Building the real pages as code blocks would quietly remove
that, and every future copy tweak would come back to us. So:

- Build pages from **native sections and blocks**.
- Put the palette and type in **Design > Site styles**, not inline CSS.
- Use **Custom CSS** only for the few details Site styles cannot express.
- Accept slightly less pixel fidelity than the reference build. That trade is
  the point of the decision.

### Site styles are now in scope

Earlier this was off limits because Site styles are global and would have
restyled the live site mid review. Now that Squarespace is the deliverable,
setting them is correct. Do it as part of the cutover, not piecemeal, so the
live site does not sit half restyled for days. Values are in section 2.

### The preview page is scaffolding

`/phase-1-preview-home` stays as a visual target while the native pages are
built, then **delete it before launch**. It is Not Linked and hidden from
search, so it is harmless in the meantime.

### The custom build is now a reference

The static build in this repo, and the deploy workflow, stay as the design and
content source of truth. Nothing depends on them being deployed. Decide
separately whether to keep the GitHub Pages copy alive as an internal
reference or switch it off.

### Build order

1. Fix the Appointments page (section 4 gate) so no unapproved pricing can surface.
2. Set Site styles: palette, fonts, buttons.
3. Build the five pages natively, Home last so the current one is untouched longest.
4. Wire the contact form once `contact@zoelifehub.com` is verified.
5. Configure the consultation properly: 20 minutes, Mon/Wed 6 to 8 PM Central.
6. Mailing list, then commerce.
7. Swap navigation, delete the preview page, launch.

---

## 1. Pages and navigation

Five pages, in this order in the main nav:

| Page | URL slug | Reference file |
| --- | --- | --- |
| Home | `/` | `index.html` |
| About | `/about` | `about.html` |
| Books & Resources | `/books` | `books.html` |
| Family Life | `/family-life` | `family-life.html` |
| Contact | `/contact` | `contact.html` |

Header also carries a primary button: **Book a free consultation** → `/contact#consultation`.

### Built to extend

Future programs (Academic and Career, Faith and Life Resources, courses) are
designed to be added as new blocks on `/family-life` and new nav items, without
re-laying-out any existing page. Do not restructure navigation to add one.

---

## 2. Brand and styling

Set these in **Design → Site styles**. Values are taken from `css/style.css`,
where each is already contrast-checked.

| Role | Hex | Notes |
| --- | --- | --- |
| Page background | `#FBF7F0` | cream |
| Alternate section background | `#F4ECDF` | cream deep |
| Borders / hairlines | `#E5D9C3` | sand |
| Dark accent band | `#4C5840` | sage deep |
| Body text | `#2E2A24` | warm near-black, not pure black |
| Muted text | `#5A5248` | |
| Links / buttons | `#4C5840` | sage deep |
| Accent, decorative only | `#C9A227` | gold. **Never use as text** |
| Gold as large text | `#A38119` | ≥3:1 |
| Gold as body text | `#7A600F` | ≥4.5:1 |
| Warm accent | `#9C5227` | terracotta, used sparingly |

Typography: Fraunces (headings) and Outfit (body). Both are on Google Fonts, so
they are available natively in Squarespace.

**Do not** enable a dark theme, heavy shadows, gradients, glass effects, or
animated section transitions. The approved direction is warm, light, and spacious.

### Logo

Upload `assets/brand/zoe-life-logo.png` as the site logo. Do **not** add the
tagline into the logo image. The tagline is separate site copy:

> Helping People Thrive in Every Season of Life

It appears in the Home hero, directly beneath the "About Zoe Life" heading on
`/about`, and in the footer.

---

## 3. Contact form

Build with a Squarespace **Form Block** on `/contact`. It must stay separate from
consultation booking.

| Field | Type | Required |
| --- | --- | --- |
| First name | Text | Yes |
| Last name | Text | Yes |
| Email address | Email | Yes |
| Phone number | Text | Yes |
| Reason for contacting | Dropdown | Yes |
| (conditional) Please tell us more | Text | Only when reason = Other |
| Message | Textarea | Yes |

Dropdown options, exactly:

1. Coaching
2. Speaking Engagement
3. Workshop / Group Session
4. Academic or Career Support
5. Books & Resources
6. Collaboration / Partnership
7. General Inquiry
8. Other

**Conditional logic:** Squarespace Form Blocks do not support conditional field
display. Two honest options:

- Keep the "Please tell us more" field always visible, labelled
  *"If you chose Other, tell us more"*, and not required; or
- Use a third-party form embed that supports conditional logic.

Pick one and record the choice. Do not imply conditional behaviour that the
platform does not deliver.

### Routing and behaviour

- **Storage:** Form Storage → email to `contact@zoelifehub.com`.
- Do **not** publish any Zoe Life email address anywhere on the site.
- Enable the built-in reCAPTCHA, or keep a honeypot. Do not add a puzzle captcha.
- Confirmation message on submit (only fires after Squarespace accepts it):

  > Thank you. Your message has reached the Zoe Life team, and we aim to reply
  > within three business days.

- **Auto-reply:** Squarespace Form Blocks do not send an acknowledgment email on
  their own. To send the "within three business days" acknowledgment from
  `contact@zoelifehub.com`, connect the form to Squarespace Email Campaigns or a
  Google Workspace/Zapier relay. If neither is set up, do not promise it in the
  confirmation copy.

> **Gate:** the form must not go live until `contact@zoelifehub.com` is verified
> as receiving mail. Send a real test submission and confirm it arrives before
> publishing.

---

## 4. Complimentary consultation

Separate from the contact form. Configure in Squarespace Scheduling (Acuity) or
whichever scheduler Zoe Life approves.

| Setting | Value |
| --- | --- |
| Appointment name | Complimentary 20 Minute Consultation |
| Duration | 20 minutes |
| Price | Free, no deposit |
| Availability | Mondays and Wednesdays, 6:00–8:00 PM |
| Time zone | America/Chicago |
| Buffer after | 10 minutes |
| Minimum notice | 24 hours |
| Maximum advance | 30 days |
| Calendar | `contact@zoelifehub.com` shared calendar |
| Conflict checking | Block against all Zoe Life consultation and coaching appointments |
| Location | Zoom, connected to `contact@zoelifehub.com` |
| Notifications | Confirmation on booking; reminder 24 hours before; reminder 1 hour before if supported |
| Admin access | Full admin for Zoe Life to add, remove, and block availability |

Intake questions:

- Name, email, phone (standard fields)
- Brief description of what you would like to discuss (long text, required)
- **Topic** (dropdown, required): Coaching · Speaking Engagement · Workshop /
  Group Session · Academic Support · Career Support · Books & Resources ·
  Collaboration / Partnership · Other / Not Sure
- **How did you hear about Zoe Life?** (dropdown, required): Friend or family ·
  Church/ministry · Instagram · Facebook · TikTok · YouTube · Zoe Life
  book/resource · Google/search · Other

If the platform supports conditional questions, add for Topic = Coaching:
coaching type, and who the coaching is for. If it does not, leave them out and
record the limitation rather than faking it.

**Never expose** the private backend Zoom account address or any recurring
meeting link.

Once the booking URL exists, replace the disabled "Booking opens soon" button in
`contact.html` with the real link.

---

## 5. Google Workspace

Controlling plan (supersedes the earlier two-account proposal):

| Mailbox | Type |
| --- | --- |
| `kemi@zoelifehub.com` | Individual mailbox |
| `tayo@zoelifehub.com` | Individual mailbox |
| `contact@zoelifehub.com` | Public-facing: forms, consultations, clients, integrations |
| `admin@zoelifehub.com` | **Alias** routed to Kemi, with send/reply-as-alias enabled |

Send collaborator and setup invitations to `cozydigital.out@gmail.com`.

Do not create accounts, activate subscriptions, or change DNS as part of a
routine change. Each of those needs explicit approval.

---

## 6. Commerce (products)

Two launch products. **Nothing is ready to sell yet** — see section 8.

### A 7-Day Gratitude Devotional (Kemi Akinyemi)

| Format | Channel |
| --- | --- |
| Kindle edition | Amazon |
| Digital edition | Etsy, Gumroad, Selar |
| Printed edition | Zoe Life store, Amazon |

### A 100-Day Gratitude Journal

| Format | Channel |
| --- | --- |
| Printable PDF | Etsy, Gumroad, Selar |
| Printed edition | Zoe Life store, Amazon |

No Kindle edition for the journal.

### Constraints

- **Keep the ebook out of KDP Select.** Select demands digital exclusivity, which
  would block Etsy, Gumroad, and Selar.
- **Use print on demand** for direct physical sales so Zoe Life never packs or
  ships manually.
- Before enabling direct physical sales, confirm: product weights and
  dimensions, shipping rates and zones, sales tax/nexus settings, inventory or
  POD fulfilment routing, and the returns policy. Do not claim physical
  fulfilment is ready until all of these exist.
- Optional marketing opt-in at checkout, once commerce is live.

---

## 7. Mailing list

Squarespace Email Campaigns, as approved.

- Create the **Zoe Life** subscriber list.
- Signup on the Home page (already positioned in `index.html`).
- Signup in the global footer (present on all five pages).
- Optional marketing opt-in during checkout when commerce is operational.
- Sender / reply-to: `contact@zoelifehub.com`, after it is verified.
- Keep the consent line and a working unsubscribe.

Do not activate a paid Email Campaigns plan or schedule an automated campaign
without showing Zoe Life the cost first.

---

## 8. Blocked pending client input

The reference build marks each of these visibly as pending rather than inventing
a plausible value. Replace them only with real supplied data.

| Item | Where it surfaces |
| --- | --- |
| "About Zoe Life" long-form copy | `about.html`, marked *Content note* |
| "Meet Tayo & Kemi" biography | `about.html`, badge *Biography pending* |
| Devotional product description | `books.html`, badge *Description pending* |
| Journal product description | `books.html`, badge *Description pending* |
| Companion-resource copy | `books.html`, badge *Copy pending* |
| **A 100-Day Gratitude Journal cover** | `books.html`, *Cover pending* placeholder |
| All prices | `books.html`, badge *Price pending* |
| Amazon / Etsy / Gumroad / Selar URLs | `books.html`, every store chip disabled |
| Consultation booking URL | `contact.html`, disabled button |
| Founder photo production approval | `assets/photos/provenance.json` |

The devotional cover **is** supplied and in use. The second cover currently in
the repo is *Questions Every Christian Couple Should Discuss Before Marriage*,
a different title, not the journal.

---

## 9. Explicitly out of scope

The **advanced paid-coaching system** is not part of Phase 1 and is not built:
six appointment types, one-coach versus two-coach pricing, 50% deposits,
remaining-balance collection 48 hours prior, refund and cancellation workflow,
Stripe and PayPal, private paid booking links, and per-appointment Zoom
generation.

Per the request summary, this is materially larger than the agreed
"20-minute consultation booking setup" inside the $400 build, and needs a written
scope decision before any of it is promised or activated.

No payment processing has been configured or enabled.

---

## 10. Pre-launch checklist

- [ ] `contact@zoelifehub.com` receives a real test submission
- [ ] Consultation booking creates a real Zoom link and calendar entry
- [ ] Mailing list signup adds a real test subscriber
- [ ] Every store chip is either a working link or still visibly pending
- [ ] Journal cover supplied and placed
- [ ] All prices supplied, or the product stays unpublished
- [ ] Founder photo approved for production use
- [ ] `noindex` removed from the reference build only if it is ever hosted
- [ ] Sitemap submitted; staging/preview URLs left unindexed
- [ ] Real-device pass on iOS and Android

---

## 11. How to demo before launch

Two review surfaces, for two different questions.

| Surface | Answers | Needs |
| --- | --- | --- |
| Static reference build (this repo) | Does the design, copy and structure work? | Nothing. Already reviewable. |
| Squarespace preview | Do the forms, booking and commerce actually work? | Squarespace access + `contact@` verified |

The second cannot be skipped. Forms, scheduling and commerce are
Squarespace-native, and this repo deliberately leaves them fail-closed rather
than simulating them. They can only be proven on the real platform.

### Recommended: Not Linked pages

In Squarespace 7.1 the Pages panel has a **Not Linked** section. Pages there are
live at their URL but do not appear in navigation.

1. Build the five Phase 1 pages as Not Linked (`/home-new`, `/about-new`, ...).
2. For each: **Page Settings → SEO → hide this page from search results.**
   Not Linked is *not* private; without this the page is guessable and indexable.
3. Optionally set a page password under **Page Settings → Password**.
4. Send Tayo and Kemi the direct links. They need no login and no seat.
5. On approval, swap them into the main navigation and remove the old pages.

The existing live site is untouched throughout.

### Alternatives

- **Site duplication.** Duplicates zoelifehub.com into a new trial site to rebuild
  in safely. Zero risk to production, but the trial expires (14 days), so do not
  start one until the review is actually ready to happen.
- **Site-wide Private + password.** Works, but takes the *existing live site*
  down for real visitors for the duration. Not worth it for a review.
- **Editor preview.** Fine for Cozy Digital, but needs a contributor seat per
  reviewer, so it is not the right surface for the client.

### Gate

Do not present a Squarespace preview as a *functional* demo until the
section 10 checklist passes. Until `contact@zoelifehub.com` is verified, a form
on a preview page either fails or silently goes nowhere, which is worse than the
honest "not connected yet" state in the reference build.
