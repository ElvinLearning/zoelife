# Blog workflow

Every post is one Markdown file in `content/blog/`. The build turns it into
`blog/<file-name>.html`, adds it to the Blog page, the home page "Read and
watch" section, and the sitemap, and gives it search metadata (BlogPosting
structured data, Open Graph article tags, canonical URL).

## Add a post

1. Generate the post with the prompt below, or write it by hand.
2. Save it as `content/blog/<short-name>.md`. The file name becomes the URL,
   so use lowercase words joined by hyphens: `conflict-resolution-basics.md`
   publishes at `/blog/conflict-resolution-basics`.
3. Build and check:

   ```bash
   node tools/build.mjs --staging
   node tests/check-site.mjs
   ```

4. Commit and push. Pages publishes from the `claude/zoe-life-website-boiqf0`
   branch (see `DEPLOY.md`).

To hold a post back, add `draft: true` to its front matter. To remove one,
delete its `.md` file; the next build deletes the old page.

## File format

```markdown
---
title: Recipes for a Blessed Marriage: 5 Essential Ingredients for Lasting Harmony
description: 50 to 170 characters for search results. Lead with the main keyword.
date: 2026-10-13
author: Pastors Tayo and Kemi
category: Marriage
series: Recipes for a Blessed Marriage
playlist: PL2QfJI8adA_Zlr6yymbp_MkVfb0tO9cze
translation: ESV
excerpt: One or two sentences for the blog cards.
---

Intro paragraph...

## 1. First principle

Body text with **bold** and *italic* and [a link](resources.html).

> Where there is no guidance, a people falls, but in an abundance of counselors there is safety.
> Proverbs 11:14

::: takeaways Key Takeaways for Couples
- **Daily Check-In:** ...
:::
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Shown as the page heading and search title |
| `description` | yes | Meta description, 50 to 170 characters |
| `date` | yes | `YYYY-MM-DD`; newest posts list first |
| `author` | yes | Byline. "Pastors Tayo and Kemi" also emits both founders as authors in structured data |
| `category` | yes | Marriage, Singles, Dating, Conflict, Faith, and so on |
| `excerpt` | yes | Card text on the Blog and home pages |
| `series` | no | Names the closing "Watch the series" band |
| `playlist` | no | YouTube playlist id from the Resources page. The "Watch the series" button jumps straight to it |
| `translation` | no | `ESV` adds the required ESV copyright notice under the post |
| `draft` | no | `true` skips the post |

Playlist ids on the Resources page:

| Series | `playlist` |
| --- | --- |
| Roadmap from Single to Married | `PLTiUnmAGHZkM` |
| Recognizing the Right One | `PL2QfJI8adA_YfcMZByFKFitwv59m6iDnP` |
| Dangerous Lies Singles Believe | `PL2QfJI8adA_YOC37FdaYA0rCaTSNbyyk-` |
| Marriage 101 | `PL2QfJI8adA_YXHB-JjLXv7qyP2pbetI0Z` |
| Recipes for a Blessed Marriage | `PL2QfJI8adA_Zlr6yymbp_MkVfb0tO9cze` |
| Conflict Resolution | `PL2QfJI8adA_b13X9wl5zwxWDyeO5pCkK2` |

### Supported Markdown

- `##` and `###` headings. No `#` heading: the title comes from front matter.
  Every `##` heading appears in the "In this article" list.
- Paragraphs, `-` bullets, `1.` numbered lists, `---` divider.
- `**bold**`, `*italic*`, `[link text](page.html)`. Site links are written as
  the page name (`resources.html`, `contact.html#message`); external links must
  be `https://` and open in a new tab.
- `>` blockquotes. When the last line is a Bible reference (`Proverbs 11:14`,
  `1 Corinthians 13:4-7`), it becomes the citation under the quote.
- `::: takeaways Heading` ... `:::` draws the highlighted takeaways box.

### Rules the build enforces

The build stops and names the file rather than publish a post that breaks one:

- No em dashes or en dashes anywhere in the copy. Use commas, colons, or
  periods. (Site-wide Zoe Life style.)
- All required front matter present, a real date, a valid playlist id.
- Links are `https://` or pages on this site.

The site tests also check the names: always "Tayo and Kemi" in that order,
never "Tai". No prices, and no donation language.

## Batch-generation prompt

The prompt below came with the first draft post. Paste a transcript or notes
into INPUT DATA, then append the **Site output format** section so the result
can be saved straight into `content/blog/`.

```
# TASK: Convert Video Transcripts into High-Converting Blog Posts for Zoe Life

Act as a Senior Copywriter and Content Strategist for Zoe Life (zoelifehope.com), a ministry dedicated to equipping individuals, couples, and families with biblical truth and practical wisdom for every season of life.

Your objective is to transform video transcripts or audio notes from Pastors Tayo and Kemi into engaging, publication-ready blog posts.

---

## 1. Brand Tone & Persona
- **Voice:** Warm, encouraging, wise, conversational, and grounded in biblical truth.
- **Authorship:** Pastors Tayo & Kemi (a collaborative, practical, and welcoming tone; balancing pastoral wisdom with relational warmth).
- **Audience:** Singles, dating couples, engaged couples, and married spouses looking for practical guidance.

---

## 2. Structure & Formatting Requirements
Every blog post must follow this structure:
1. **SEO Title:** Catchy and optimized for search (include primary keywords like "Christian marriage advice," "conflict resolution," "dating guidance," or "singles devotional").
2. **Engaging Intro (150–200 words):** Hook the reader, state the core topic, and set an encouraging tone.
3. **Core Principles / Subsections (3–5 subheadings):**
   - Break down the key points from the transcript.
   - Include relevant Bible verses (formatted as blockquotes).
   - Use bulleted lists and bold lead-ins for readability.
4. **Practical Application / Takeaways:** 2–3 actionable steps or discussion prompts for readers or couples.
5. **Call-To-Action (CTA):** Invite readers to explore more resources, watch the full video series, or subscribe to the newsletter at `zoelifehope.com`.

---

## 3. Optimization Guidelines
- Write with high information density—avoid fluff.
- Naturally integrate long-tail keywords for search engine and AI discovery (ChatGPT, Perplexity).
- Ensure headers follow a logical H2 and H3 hierarchy.

---

## INPUT DATA
[Paste Video Transcript or Notes Here]
```

### Site output format (append to the prompt)

```
## 4. Site output format (overrides anything above that conflicts)
Return ONE Markdown file and nothing else, in exactly this shape:

---
title: <SEO title>
description: <meta description, 120 to 160 characters, primary keyword first>
date: <YYYY-MM-DD>
author: Pastors Tayo and Kemi
category: <Marriage | Singles | Dating | Conflict | Faith>
series: <the video series name>
playlist: <playlist id from the table I give you, or leave this line out>
translation: ESV
excerpt: <one or two sentences for the blog card>
---

<intro paragraphs>

## <subheading>
<body>

> <verse text, ESV, quoted exactly>
> <Book Chapter:Verse>

::: takeaways <Takeaways heading>
- **<Bold lead-in>:** <action>
:::

Rules:
- Do not write a "# " title line; the title lives in the front matter.
- Do not write the call to action. The site adds a "Watch the series" band,
  a message link, and the newsletter signup under every post.
- Never use em dashes or en dashes. Use commas, colons, or periods. Write
  verse ranges with a hyphen (1 Corinthians 13:4-7).
- Write the names as "Tayo and Kemi", always in that order.
- Quote Scripture word for word from the ESV, verse reference on its own line.
- Only use teaching that is in the transcript. Do not invent stories, quotes,
  or claims and attribute them to Tayo and Kemi.
- No prices, no donation requests.
```

The CTA in the original prompt points at `zoelifehope.com`. This site is
`zoelifehub.com`, and the build writes the CTA itself, so that line never
reaches a published post.
