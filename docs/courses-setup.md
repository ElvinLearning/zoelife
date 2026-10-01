# Course setup before enrollment can work

The site can show the three draft tracks today. Buying, Drive access, and the welcome email stay off until the items below are true. No paid lesson videos or workbooks belong in this repository.

An earlier plan said the live site still posts forms to FormSubmit. That is wrong. Contact and the mailing list already use the Google Apps Script web app in `integrations/google-workspace/Code.gs`. Leave that file alone. Course access is a **separate, not-deployed** script in `apps-script/courses/`.

## What Kemi supplies first

1. Stripe account access for **Zoe Life LLC**, not Cozy Digital. Payouts go to the Zoe Life bank account. Identity verification is complete. Kayson can create products and Payment Links, and cannot change payouts.
2. Prices for Single and Dating, Committed Relationship, Engaged / First Year of Marriage, and whether the couples bundle (tracks 2 and 3) is offered.
3. A yes or no on the draft module outlines now on the track pages. Final titles replace the draft copy.
4. Lesson videos, one private file per lesson. They go in Google Drive, not in git.
5. A refund policy: whether refunds exist, the window, and that a refund removes Drive access.
6. A support contact for "I can't get in" and how quickly someone replies.

Terms (how long access lasts, no sharing, educational and not a substitute for counseling) can follow the same pass. This note is not legal advice.

## Config slots

These stay null until the values are real https URLs. While they are null, the site shows "Enrollment opens soon" and the mailing list. It does not render a buy button.

| Variable | Slot in `js/config.js` |
| --- | --- |
| `ZOE_COURSE_SINGLE_DATING_URL` | `courses.singleDating` |
| `ZOE_COURSE_COMMITTED_URL` | `courses.committed` |
| `ZOE_COURSE_ENGAGED_FIRST_YEAR_URL` | `courses.engagedFirstYear` |
| `ZOE_COURSE_COUPLES_BUNDLE_URL` | `courses.couplesBundle` |
| `ZOE_COURSE_CLAIM_ENDPOINT` | `courses.claimEndpoint` |

`coursesUrl` is unused for display. Do not point it at another host.

Production builds reject `https://buy.stripe.com/test_...` links. Use test links only with `--staging`.

## Deploy steps, when the content exists

1. In Stripe, create one Product and one Payment Link per track, plus the bundle if it is offered. Add a required custom field named for the Google account email. After payment, redirect to `https://www.zoelifehub.com/courses/welcome.html?session_id={CHECKOUT_SESSION_ID}`.
2. In Drive, create a private folder per track. Upload lesson files there. Turn off download, print, and copy on each video. Confirm Workspace sharing allows viewers outside zoelifehub.com.
3. Create a **new** Apps Script project owned by `contact@zoelifehub.com`. Paste `apps-script/courses/Code.gs` and `appsscript.json`. Turn on the Advanced Drive service. Set Script properties from `config.example.json` (the restricted Stripe key can read Checkout Sessions only). Run `setupCourseSheet` once from the editor. Deploy as a web app that executes as that account. Add a 10-minute trigger for `syncRecent`.
4. Do not replace the existing forms deployment. Do not add `claim_course` to `integrations/google-workspace/Code.gs`.
5. Put the Payment Link URLs in the course variables above. Put the new web app `/exec` URL in `ZOE_COURSE_CLAIM_ENDPOINT`.
6. Only then wire `courses/welcome.html` to POST `{ action: "claim_course", sessionId }` to that endpoint. The page in this repo is a placeholder: it may read `session_id` from the query string, and it does not call the network.
7. Run a sandbox purchase, confirm the Sheet row, the Drive share, and the welcome email, then refund it and confirm access is removed.

Until step 6, `courses/welcome.html` stays `noindex` and is omitted from the sitemap. The three track pages are public drafts with lesson titles only.
