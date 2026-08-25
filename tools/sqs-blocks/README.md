# Squarespace Phase 1 preview snippets

Paste-ready HTML for the five Zoe Life Phase 1 preview pages. Each file is a
self-contained Code Block: scoped CSS under `.zl-p1`, plus a fluid-engine width
fix so it spans the full page without resizing the block by hand.

Photography is referenced from Zoe Life's own Squarespace CDN, so nothing needs
uploading. Book covers are NOT on the CDN and are shown as honest placeholders.

## How to place one

1. Pages panel, `+` next to **Not Linked**, choose **Page** > **Add Blank**.
2. Name it, e.g. `Phase 1 Preview About`.
3. Gear icon > **SEO** > turn on **Hide Page from Search Results** > **Save**.
4. **Edit** > **Add Section** > **Add Blank** > **Add Block** > search `code` > **Code**.
5. Open the block's pencil, set Mode to **HTML**, select all, paste the file.
6. Click outside the code panel, then **Save**.

Regenerate all five with:

    node tools/build-squarespace-blocks.mjs

## Files

| File | Page |
| --- | --- |
| `home.html` | Home |
| `about.html` | About |
| `books.html` | Books & Resources |
| `family.html` | Family Life / Socials |
| `contact.html` | Contact |

## Status

`Phase 1 Preview Home` already exists at
`https://www.zoelifehub.com/phase-1-preview-home` (Not Linked, hidden from
search). Its block still carries an earlier `margin-left:-50vw` width attempt
that shifts content left. Re-paste `home.html` over the block contents to fix
it, since these files no longer use that approach.
