# Pending client decisions

These comments are in the HTML/source so they stay visible during review without appearing as unfinished visitor-facing text.

- `about.html:173`: Confirm whether to retain the Statement of Faith. Kept here, collapsed, pending Kemi's decision.
- `blog/after-you-meet-the-right-one.html:99`: Confirm the personal anecdote about the woman and the man's death before publication.
- `blog/preparing-for-marriage-while-single.html:101`: Confirm the source for Mary's estimated age; Scripture does not state her age.
- `blog/recipes-for-a-blessed-marriage.html:101`: Kemi to approve the rewritten Recipes article against the original teaching.
- `books.html:98`: Supply the devotional Amazon and Lulu Direct checkout URLs and confirm its Gumroad/Etsy product URLs in the existing payments config.
- `books.html:161`: Supply the journal Amazon and Lulu Direct checkout URLs and confirm its Gumroad/Etsy product URLs in the existing payments config.
- `books.html:162`: Confirm journal pricing before publishing a price.
- `courses/committed.html:79`: Approve course outline and confirm enrollment availability, including the lesson drawn from our years of marriage.
- `courses/engaged-first-year.html:79`: Approve course outline and confirm enrollment availability, including the lesson drawn from our years of marriage.
- `courses/single-dating.html:79`: Approve course outline and confirm enrollment availability, including the lesson drawn from our years of marriage.
- `index.html:74`: Kemi's homepage copy goes here

## Owner-side release checks

- Verify one contact reaches the intended Sheet tab and inbox, and one newsletter signup confirms and unsubscribes against the deployed Apps Script service. The tests here use mocks and cannot certify live delivery.
- Confirm all six YouTube playlists play in a normal browser, especially the existing short ID `PLTiUnmAGHZkM`. URL identity was preserved; an HTTP 200 is not proof a playlist is playable.
- Confirm `https://www.tiktok.com/@zoefamilylife`; the reachability check returned 403, so its validity is unverified.
- Supply checkout/product URLs: the current Pages snapshot has **null Amazon, Lulu, Gumroad and Etsy values for both books**. Reports that shops are ready do not provide product URLs in this branch.
- Keep staging/noindex until the domain cutover is approved. This PR does not change Pages settings, DNS, CNAME, billing, or merge/deploy the branch.
