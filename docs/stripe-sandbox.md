# Zoe Life Stripe sandbox

Created September 26, 2026 under Zoe Life LLC: **Zoe Life Website Integration**.
Dashboard: https://dashboard.stripe.com/acct_1UJyf9DMqlCMZsan/test/dashboard

Both books have one-off USD 1.00 test prices, clearly marked SANDBOX TEST.
These are placeholders, not approved retail prices. No physical or digital
fulfillment is attached. The live Stripe account and live checkout variables
were not changed.

Public test links and product/price IDs are in
`integrations/stripe/sandbox.json`. No Stripe secret key is needed or stored:
this static site links directly to Stripe-hosted checkout.

## Preview locally

```sh
node tools/stripe-sandbox.mjs
node .stripe-sandbox/tools/serve.mjs 8766
```

Open http://127.0.0.1:8766/books.html. The helper creates a separate ignored
`.stripe-sandbox` directory, builds with `--staging --stripe-sandbox`, and runs
the site checks. Committed HTML and production configuration are untouched.
The test build includes only sandbox book checkout links; paid-session links
are disabled. Its contact and newsletter forms still use the existing
FormSubmit endpoints, so do not send synthetic form submissions from this preview.

The lower-level `node tools/build.mjs --staging --stripe-sandbox` command writes
into the current checkout like the regular builder; prefer the isolated helper.
Sandbox mode requires staging, and production builds reject Stripe test links
even if they arrive through the normal payment environment variables.

## Test checkout

Use only Stripe's published test values: card `4242 4242 4242 4242`, future
expiry `12/34`, CVC `123`, and synthetic contact details. Disable saving
payment information. Sandbox transactions do not move real money.

- https://docs.stripe.com/testing
- https://docs.stripe.com/payment-links/create

## Verification on September 26, 2026

- Both hosted checkouts reported `livemode: false`, USD, and an amount of 100 cents.
- Both completed a simulated Visa payment and displayed "Thanks for your payment".
- The preview books page exposes the correct link for each book with test-only copy.
- All 383 static checks pass in both the existing site and sandbox build.
- Integration tests check sandbox labels, link mapping, exclusion of other checkout
  providers, staging requirements, and production rejection of test Payment Links.

This verifies sandbox payment collection only. No actual money was charged,
and live payments, fulfillment, refunds, and tax calculation were not tested.

Before live sales, confirm retail prices, digital/printed formats, delivery,
shipping/tax treatment, and refund terms; then create approved live Payment
Links and set `ZOE_STRIPE_DEVOTIONAL_URL` and `ZOE_STRIPE_JOURNAL_URL`.
Stripe payment collection by itself does not deliver books or downloads.
