# Zoe Life integration activation — September 26, 2026

## What is implemented, and what is not live

The repository now contains a Google Apps Script backend for contact capture and a confirmed subscriber list, with tests. It is deployed in Zoe Life's Google Workspace as contact@zoelifehub.com (Apps Script version 4). Contact capture, inbox notification, and browser-based subscriber confirmation have been verified with approved test data. The website configuration now uses that deployment. The GitHub Pages website is published with the verified connection.

`contact@zoelifehub.com` is confirmed by an email sent from that address and the Zoe Life Stripe invitation. Do not change it to `.org`.

Connected Calendar access currently exposes Cozy Digital's calendar, not Zoe Life's. A Stripe invitation dated August 28 exists in Cozy Digital's inbox; this is evidence of an account invitation, not evidence of payment readiness.

Later September 26 update: Zoe Life LLC dashboard access was verified and an
isolated Stripe sandbox was created with successful test checkouts for both
books. See [Stripe sandbox setup](stripe-sandbox.md). This does not establish
live payment or fulfillment readiness.

## 1. Activate contact capture and the subscriber list

Use the **Zoe Life-owned Workspace account**. Do not store client enquiries in a personal or Cozy Digital-owned spreadsheet.

1. Create a private Google Sheet named `Zoe Life — Website submissions and subscribers`. Limit editor access to the Zoe Life team and approved administrators. Tokens and contact messages in this Sheet are private.
2. Create a standalone Apps Script project in that account. Copy `integrations/google-workspace/Code.gs` and its `appsscript.json` manifest.
3. In Project Settings → Script Properties, add:
   - `SPREADSHEET_ID`: the new Sheet's ID.
   - `CONTACT_EMAIL`: `contact@zoelifehub.com`.
   - `SUBSCRIPTION_PAGE_URL`: `https://elvinlearning.github.io/zoelife/subscription.html`. Update this when the website origin changes. This page submits consent changes with anonymous POST requests, avoiding Google's multiple-account web-app navigation issue.
4. Deploy → New deployment → Web app. Execute as the Zoe Life owner; access must permit anonymous visitors (Anyone). If Workspace policy prevents anonymous deployment, stop: do not change organizational policy or use a personal account as a workaround.
5. Add the deployment's `/exec` URL as Script Property `WEB_APP_URL`. Run `setup()` from the editor and authorize the declared Sheets and email permissions. It initializes two tabs without sending messages. Update the deployment to the latest version after code changes.
6. Verify using a clearly labeled test enquiry and an email address controlled by the reviewer. Confirm the Sheet row and inbox receipt. Verify a signup is `pending`, then becomes `subscribed` only after the confirmation button is submitted. Verify unsubscribe and expired-link handling. Opening a link by GET must not change status.
7. Test from the actual GitHub Pages origin on desktop and mobile, including Google's ContentService redirect. A local test does not establish cross-origin delivery. Never use `no-cors` or opaque responses as proof of success.
8. Once verified, set GitHub Actions repository variables `ZOE_FORM_ENDPOINT` and `ZOE_NEWSLETTER_ENDPOINT` to the verified `/exec` URL and redeploy. Check again from the public site.

The frontend automatically changes its privacy copy and confirmation message for the Workspace endpoint. Contact success means the message is saved in the Sheet, not a guarantee of inbox delivery. The `Notification` column is `sent` or `pending`; review pending messages directly if mail fails. No automatic notification retry is installed.

The backend validates inputs, guards Sheet formula injection, serializes writes, deduplicates contact request IDs, limits repeat submissions per address, and caps public submissions at 100/day and outbound messages at 50/day. These are conservative starting limits, not a substitute for a dedicated abuse-protection service at larger scale. Google's quotas also apply. Do not raise limits without reviewing expected traffic and spam.

The `Subscribers` tab is the actual consent-backed list. Only rows with status `subscribed` may be used for updates. Keep unsubscribe links on any future campaign, honor status changes, and never import pending/unsubscribed addresses as active. **A campaign platform or automatic newsletter campaign is not configured by this implementation.** Agree on retention for contact records and unconfirmed signups before launch; deletion is not automated.

## 2. Paid scheduling and Zoom

The site now accepts `ZOE_PAID_BOOKING_URL`. Its CTA stays hidden until a real booking URL exists. The free 20-minute consultation remains separate and unchanged.

Before enabling the paid link, confirm the session duration, price, availability, cancellation/refund terms and approved booking provider with Pastor Kemi. In her account, connect payments and Zoom, ensure each appointment receives its own meeting link, and verify booking, payment confirmation, calendar entry and cancellation. Then set the variable to the public paid scheduling URL and redeploy. Do not publish a recurring private Zoom room URL or invent rates.

## 3. Book sales

Existing Stripe/PayPal variables remain available. New optional variables:

| Book | Amazon | Etsy | Gumroad |
| --- | --- | --- | --- |
| Devotional | `ZOE_AMAZON_DEVOTIONAL_URL` | `ZOE_ETSY_DEVOTIONAL_URL` | `ZOE_GUMROAD_DEVOTIONAL_URL` |
| Journal | `ZOE_AMAZON_JOURNAL_URL` | `ZOE_ETSY_JOURNAL_URL` | `ZOE_GUMROAD_JOURNAL_URL` |

Set only approved product-specific links. An existing Stripe account does not establish that products, prices, fulfilment or payment links are configured. Verify title, format, price, delivery and payment before enabling a purchase button. Do not charge a real card solely to test; use the provider's supported test flow. Purchase options remain unavailable without configured links.

## Verification performed

- All 383 static site checks pass with existing configuration.
- All static checks also pass in a temporary build with Workspace, paid scheduling and marketplace fixtures enabled.
- Backend mock tests cover validation, persistence failure, notification failure, duplicate retries, formula escaping, consent, confirmation, expiry, unsubscribe, read-only link previews and mail caps.
- URL validation rejects unsafe integration URLs.
- Workspace backend version 4: local-browser contact save, inbox receipt, pending signup and confirmation verified with contact@zoelifehub.com. Public GitHub Pages verification passed: desktop contact submission, Sheet notification status sent, inbox receipt, mobile signup, website confirmation and unsubscribe. The approved test address was left unsubscribed. Expiry and failure scenarios are covered by mock tests. Paid booking, Zoom generation and live book payments/fulfilment remain unverified.

## Remaining launch gates

- Workspace contact capture and consent-backed subscriber storage are complete. Automatic newsletter campaigns and contact-record retention automation are not configured.
- Paid session details, scheduling account and Zoom/payment connection.
- Approved book product links, prices and fulfilment details.
- Client wording feedback and final review.

Reference: Google Apps Script web app deployment and ContentService documentation:
https://developers.google.com/apps-script/guides/web
https://developers.google.com/apps-script/guides/content
https://developers.google.com/apps-script/reference/mail/mail-app

## Publishing note

The repository currently documents legacy Pages publishing from `claude/zoe-life-website-boiqf0`. Repository variables only affect Actions builds; they do not rewrite committed files served from that branch. While legacy publishing is in use, build with the verified environment variables, run the checks, and commit the generated HTML/config to the Pages source branch as well as main. Alternatively, an administrator can enable Actions as the Pages source and permit main in the github-pages environment before using the manual deployment workflow. Do not assume a green main build alone published the site.
