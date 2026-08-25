# Deploying Zoe Life

The site is static: HTML, CSS, one small JS file, self-hosted fonts, local
images. No server, no database, no build step needed to *serve* it. Any static
host works. GitHub Pages is wired up already.

Nothing here has been pointed at a domain. DNS is yours to change.

---

## 1. Build

```bash
node tools/build.mjs              # production: indexable, canonical zoelifehub.com
node tools/build.mjs --staging    # staging: noindex + robots Disallow
```

The build writes the five pages plus `404.html`, `robots.txt`, `sitemap.xml`,
`favicon.svg` and `js/config.js`.

**Default the deploy to `--staging` until the domain actually switches.** A
production build published anywhere other than zoelifehub.com creates a second
indexable copy of the client's live site, which competes with it in search.

## 2. Configure the integrations

Every integration is **fail closed** by default. With nothing configured the
contact form validates, then tells the visitor plainly that it was not
delivered. It never fakes a success.

Set these as environment variables at build time, or as GitHub repository
variables (Settings > Secrets and variables > Actions > Variables):

| Variable | Effect when set | When unset |
| --- | --- | --- |
| `ZOE_SITE_URL` | Canonical URLs and sitemap | `https://www.zoelifehub.com` |
| `ZOE_FORM_ENDPOINT` | Contact form POSTs here; success only on 2xx | Form refuses to send, says so |
| `ZOE_NEWSLETTER_ENDPOINT` | Signup POSTs here; success only on 2xx | Signup refuses, says so |
| `ZOE_BOOKING_URL` | Consultation button becomes a real link | Button stays disabled |
| `ZOE_MODE` | `production` makes the workflow build indexable | staging |

The form posts `multipart/form-data` with `Accept: application/json`, which
suits Formspree, Basin, Web3Forms, Formsubmit, or any handler of your own.
Field names are `firstName`, `lastName`, `email`, `phone`, `reason`,
`reasonOther`, `message`, plus a `website` honeypot that should be ignored.

> Do not point the form anywhere until `contact@zoelifehub.com` is verified as
> receiving mail, and send a real test submission before launch. A form that
> silently drops enquiries is worse than one that admits it is not connected.

## 3. Deploy

### GitHub Pages (already wired)

`.github/workflows/deploy.yml` builds, runs the checks, and publishes on every
push to `main`. It refuses to deploy if the static checks fail.

One-time setup: **Settings > Pages > Source: GitHub Actions**.

Run it manually from the Actions tab with **Run workflow**, choosing `staging`
or `production`.

### Any other static host

Upload the repository root, or run the same copy step the workflow uses. Netlify,
Cloudflare Pages, Vercel, S3 and plain nginx all work with zero configuration.

## 4. Switching the domain over from Squarespace

Order matters. Do not cut DNS first.

1. **Verify the replacement is complete.** Every item in
   `docs/squarespace-setup.md` section 8 should be resolved, or accepted as
   knowingly missing.
2. **Wire the form and mailing list**, and test both end to end with a real
   submission that actually arrives at `contact@zoelifehub.com`.
3. **Decide what happens to commerce.** Squarespace Commerce does not come
   with the site. If products are selling through Squarespace, either keep
   Squarespace for checkout or move to an external store before switching.
   The Books page currently links out per format, so external stores are the
   simpler path.
4. **Decide what happens to Squarespace Scheduling.** The consultation booking
   is an Acuity/Squarespace feature. Either keep that subscription and set
   `ZOE_BOOKING_URL` to its public link, or move to another scheduler.
5. **Add `CNAME`** to the repository root containing exactly:
   ```
   www.zoelifehub.com
   ```
   There is a `CNAME.example` in the repo to copy.
6. **Build for production** (`ZOE_MODE=production`) so pages become indexable
   and `robots.txt` allows crawling.
7. **Point DNS** at GitHub Pages, per GitHub's current instructions for an
   apex plus `www` setup.
8. **After propagation**, confirm HTTPS is issued, then submit
   `https://www.zoelifehub.com/sitemap.xml` in Google Search Console.

### What is lost by leaving Squarespace

Be explicit with Zoe Life about this before switching:

- **Commerce**: product listings, checkout, orders, inventory
- **Scheduling**: the Acuity consultation and appointment system
- **Forms**: Squarespace Form Storage and any notification rules
- **Email Campaigns**: the subscriber list lives in Squarespace
- **Member/Login area**: the current site's `Login` and `Cart` nav items
- **Editing**: content changes become code changes, not drag and drop

None of these are blockers, but each needs a replacement chosen deliberately
rather than discovered missing after the switch.

## 5. Verify a build before shipping

```bash
node tools/build.mjs --staging
node tests/check-site.mjs     # 211 static checks
node tools/serve.mjs 8765     # then, in another shell:
node tools/qa.mjs             # 25 page/width browser checks
node tools/qa-forms.mjs       # 32 interaction checks
```

`qa.mjs` and `qa-forms.mjs` drive real Chrome over the DevTools Protocol and
need the server running. There are no npm dependencies at any point.
