# Client copy and publishing review

Source: the client's November 6 website edit emails, checked again after the
November 9 screenshots and follow-up. Public replacement copy is preserved
verbatim. Article/video-specific revisions are still to be supplied.

The screenshots showed the October homepage. The public GitHub Pages HTML was
byte-for-byte identical to the older Pages source branch, not `main`. The
November changes already on `main` had not reached that public preview.

| Request | Code review result |
| --- | --- |
| Homepage Part 1 | Entire supplied introduction; Explore Zoe Life, Explore Resources, Send a Message in that order. |
| Homepage Part 2 | Supplied welcome heading/paragraph; Get to Know Zoe Life opens the organization section. |
| Homepage Part 3 | Supplied founders introduction; Get to Know Us opens the combined biography. |
| Homepage Part 4 | Supplied Books & Resources copy, two descriptions and Explore links. |
| Homepage Part 5 | Supplied Articles & Videos heading and introduction; two article cards and one video card; collection link. Individual revisions pending. |
| Homepage Part 6 | Supplied closing invitation, centered layout, both buttons; availability note removed. |
| Homepage Part 7 | Footer wording, navigation order, green headings, consent wording and copyright. |
| Homepage Part 8 | Separate Privacy Policy and Terms & Conditions pages linked in all footers. |
| Privacy Policy | Supplied text, effective date and direct contact-form links retained. This does not verify live service behavior. |
| Terms & Conditions | Supplied text and Privacy Policy/contact links retained. |
| Resources navigation | Books, Articles, Videos in that order; overview page; courses absent from public navigation. |
| Books | Supplied descriptions, companion section, group-order section and more-to-come copy; Amazon-only buttons remain hidden until final URLs arrive. |
| Contact | Supplied text; phone optional; requested reasons; group/partnership preselection and submitted-message text. |
| Consultation page | Supplied invitation, What to Expect, Ready to Connect and booking button. |
| Booking calendar | External schedule duration/start times and confirmation still require provider-side verification. Website copy alone cannot complete this. |
| About | Supplied organization, mission, vision, eight values and combined biography; correct section links; retained Statement of Faith. |
| Partnership | Supplied four categories, disclosure and closing invitation; preselected partnership inquiry. |

## Release checks

`node tests/check-client-copy.mjs` compares 116 public passages from the original
client copy with six generated pages, plus exact hero text and button routing.
The fixture contains only public website copy, not private email threads. Do not
regenerate it from implementation output or rewrite it without client edits.

Run the existing build, static and integration checks too. The same copy check
accepts `SITE_BASE_URL` to verify publication. See `DEPLOY.md` for the two-branch
release requirement while legacy Pages publishing remains configured.

## Still open

- The custom domain remains on Squarespace; GitHub Pages is the review site.
- Final Amazon URLs for both books.
- Client-supplied article and video wording.
- Calendar duration, four start times and booking confirmation/Meet verification.
- Live contact delivery, Sheets capture, mailing-list confirmation/unsubscribe,
  and paid scheduling setup.
- Human review and final client approval. Automated checks are supplementary.
