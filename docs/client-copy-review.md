# Client copy and publishing review

Source: the client's November 6 website edit emails, checked again on November 10
against the November 9 screenshots, follow-up and Statement of Faith email. Public replacement copy is preserved
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
| Consultation page | Supplied invitation, What to Expect, Ready to Connect and booking button; simple icons added to the three expectations. |
| Booking calendar | Public provider page checked November 10: still titled “20-minute booking” and still displays “30 min appointments.” Monday/Wednesday 6:00, 6:30, 7:00 and 7:30 PM Central start times are present. Duration/title/description remain unfinished; confirmation/Meet delivery is unverified. |
| About | Supplied organization, mission, vision, eight values and combined biography; correct section links. Eight decorative core-value icons restored; supplied words and existing layout retained. |
| Statement of Faith (November 9) | Exact new heading, introduction, ten beliefs and closing paragraph; expandable format retained. |
| Partnership | Supplied four categories, disclosure and closing invitation; simple category icons and preselected partnership inquiry. |

## Release checks

`node tests/check-client-copy.mjs` compares 278 public passages from the original
client copy with nine generated pages, plus exact hero text and button routing.
The fixture contains only public website copy, not private email threads. Do not
regenerate it from implementation output or rewrite it without client edits.

Run the existing build, static and integration checks too. The same copy check
accepts `SITE_BASE_URL` to verify publication. See `DEPLOY.md` for the two-branch
release requirement while legacy Pages publishing remains configured.

## Still open

- The custom domain was checked November 10 and remains on Squarespace; GitHub
  Pages is the review site. The launch request for the address printed in the
  books is therefore not complete.
- Final Amazon URLs for both books.
- Client-supplied article and video wording.
- Calendar duration must change from 30 to 20 minutes, with a 10-minute buffer.
  Replace the title and add the supplied description; then verify booking
  confirmation, time zone and Meet delivery. Public start times already match.
- A labelled public contact submission on November 10 returned the approved success
  message. Independently checking its row and inbox delivery still needs the client
  Workspace account. Mailing-list and paid scheduling status must remain separate.
- Human review and final client approval. Automated checks are supplementary.
- Individual completion replies for each client email have not been verified.


## Intensive release verification

The release workflow runs the exact-copy, static, build and Workspace unit checks,
then a browser review at 375, 768 and 1440 pixels. Browser forms are intercepted
to avoid sending bulk tests to the client. Current run results and screenshots
are saved in the `browser-review` Actions artifact; a green run is required before
advancing the Pages branch. Local Chromium could not launch in this workspace,
so browser execution is performed in GitHub Actions rather than reported as a
local pass. The October report in `docs/qa/pre-release` is historical.
