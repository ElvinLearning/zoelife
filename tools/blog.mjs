/**
 * Zoe Life blog posts.
 *
 * Each post is one Markdown file:  content/blog/<slug>.md
 * tools/build.mjs turns every file into blog/<slug>.html and lists it on
 * blog.html, the home page, and the sitemap. See docs/blog-workflow.md.
 *
 * No npm dependencies, so the Markdown support is deliberately small:
 *   ## and ### headings, paragraphs, - bullets, 1. numbered lists, ---,
 *   **bold**, *italic*, [links](url), > blockquotes (a last line that is a
 *   Bible reference becomes the citation), and one container:
 *     ::: takeaways Optional heading
 *     - ...
 *     :::
 *
 * The build fails, naming the file, rather than publishing a post that breaks
 * a house rule (missing front matter, an em or en dash, an unsafe link).
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REQUIRED = ["title", "description", "date", "author", "category", "excerpt"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

// A Bible reference such as "Proverbs 11:14", "1 Corinthians 13:4-7",
// "Song of Solomon 2:15", or "Psalm 127:1 (ESV)".
const REF = String.raw`(?:[1-3]\s?)?[A-Z][a-z]+(?:\s(?:of\s)?[A-Z][a-z]+)*\s\d+:\d+(?:[-–—]\d+)?(?:,\s?\d+)*(?:\s\(?[A-Z]{2,5}\)?)?`;
const CITE_LINE = new RegExp(`^(?:--|[—–-])?\\s*(${REF})\\s*$`);
const CITE_TAIL = new RegExp(`\\s+(?:--|[—–-])\\s*(${REF})\\s*$`);

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const dateLabel = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

/** Post pages live in blog/, so site links need one "../". */
const linkTag = (label, href, file) => {
  if (/^https:\/\//.test(href)) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}<span class="visually-hidden">, opens in a new tab</span></a>`;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) throw new Error(`${file}: links must be https or a page on this site, not ${href}`);
  if (href.startsWith("#")) return `<a href="${href}">${label}</a>`;
  return `<a href="../${href.replace(/^\/+/, "")}">${label}</a>`;
};

const inline = (text, file) =>
  escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => linkTag(label, href, file))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");

const normalizeRef = (ref) => ref.replace(/[–—]/g, "-");

function blockquote(lines, file) {
  let body = lines.map((l) => l.trim()).filter(Boolean);
  let cite = null;
  let m;
  if (body.length > 1 && (m = body[body.length - 1].match(CITE_LINE))) {
    cite = m[1];
    body = body.slice(0, -1);
  }
  let text = body.join(" ");
  if (!cite && (m = text.match(CITE_TAIL))) {
    cite = m[1];
    text = text.slice(0, m.index);
  }
  text = text.replace(/^["“]\s*/, "").replace(/\s*["”]$/, "");
  const cls = cite ? ' class="scripture"' : "";
  return `<blockquote${cls}><p>${inline(text, file)}</p>${cite ? `<cite>${escapeHtml(normalizeRef(cite))}</cite>` : ""}</blockquote>`;
}

const BLOCK_START = /^(#{1,6}\s|>|\s*[-*]\s+|\s*\d+[.)]\s+|:::|(?:-{3,}|\*{3,})\s*$)/;

export function markdownToHtml(md, { file = "post", toc = [], ids = new Set() } = {}) {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const blank = (l) => !l.trim();

  const list = (re, tag) => {
    const items = [];
    while (i < lines.length && re.test(lines[i])) {
      let item = lines[i++].replace(re, "");
      while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) item += " " + lines[i++].trim();
      items.push(`  <li>${inline(item, file)}</li>`);
    }
    out.push(`<${tag}>\n${items.join("\n")}\n</${tag}>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    let m;
    if (blank(line)) { i++; continue; }

    if ((m = line.match(/^:::\s*(takeaways|note)\b\s*(.*)$/))) {
      const body = [];
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) body.push(lines[i++]);
      if (i >= lines.length) throw new Error(`${file}: "::: ${m[1]}" is never closed with ":::"`);
      i++;
      const title = m[2].trim();
      let heading = "";
      if (title) {
        const id = uniqueId(title, ids);
        toc.push({ id, text: title });
        heading = `<h2 id="${id}">${inline(title, file)}</h2>\n`;
      }
      out.push(`<aside class="post-callout post-${m[1]}">\n${heading}${markdownToHtml(body.join("\n"), { file, toc, ids })}\n</aside>`);
      continue;
    }

    if (/^#\s/.test(line)) throw new Error(`${file}: put the title in the front matter, not in a "# " heading`);
    if ((m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/))) {
      const level = m[1].length;
      const id = uniqueId(m[2], ids);
      if (level === 2) toc.push({ id, text: m[2] });
      out.push(`<h${level} id="${id}">${inline(m[2], file)}</h${level}>`);
      i++;
      continue;
    }
    if (/^#{4,}\s/.test(line)) throw new Error(`${file}: use ## or ### headings only`);

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
      out.push(blockquote(quote, file));
      continue;
    }

    if (/^(?:-{3,}|\*{3,})\s*$/.test(line)) { out.push("<hr>"); i++; continue; }
    if (/^\s*[-*]\s+/.test(line)) { list(/^\s*[-*]\s+/, "ul"); continue; }
    if (/^\s*\d+[.)]\s+/.test(line)) { list(/^\s*\d+[.)]\s+/, "ol"); continue; }

    const para = [];
    while (i < lines.length && !blank(lines[i]) && (para.length === 0 || !BLOCK_START.test(lines[i]))) {
      para.push(lines[i++].trim());
    }
    out.push(`<p>${inline(para.join(" "), file)}</p>`);
  }
  return out.join("\n");
}

function uniqueId(text, ids) {
  const base = slugify(text) || "section";
  let id = base;
  for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
  ids.add(id);
  return id;
}

function parseFrontMatter(raw, file) {
  const m = raw.replace(/^﻿/, "").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: must start with a front matter block between --- lines`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: cannot read front matter line "${line}"`);
    meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return { meta, body: m[2] };
}

const visible = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ");

function assertNoDashes(text, file, where) {
  const at = text.search(/[—–]/);
  if (at >= 0) {
    const context = text.slice(Math.max(0, at - 30), at + 30).trim();
    throw new Error(
      `${file}: em or en dash in the ${where} ("...${context}..."). ` +
        "Zoe Life copy uses commas, colons, or periods instead."
    );
  }
}

export function loadPosts(root) {
  const dir = join(root, "content", "blog");
  if (!existsSync(dir)) return [];
  const posts = [];
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    const file = `content/blog/${name}`;
    const slug = name.replace(/\.md$/, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(`${file}: file names must be lowercase words joined by hyphens`);
    }
    const { meta, body } = parseFrontMatter(readFileSync(join(dir, name), "utf8"), file);
    if (/^(true|yes)$/i.test(meta.draft || "")) continue;
    for (const key of REQUIRED) {
      if (!meta[key]) throw new Error(`${file}: front matter is missing "${key}"`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || Number.isNaN(Date.parse(meta.date))) {
      throw new Error(`${file}: date must look like 2026-10-13`);
    }
    if (meta.playlist && !/^PL[\w-]+$/.test(meta.playlist)) {
      throw new Error(`${file}: playlist must be a YouTube playlist id starting with PL`);
    }
    if (meta.description.length < 50 || meta.description.length > 170) {
      throw new Error(`${file}: description should be 50 to 170 characters (it is ${meta.description.length})`);
    }
    for (const key of ["title", "description", "excerpt", "author", "category", "series"]) {
      if (meta[key]) assertNoDashes(meta[key], file, `front matter ${key}`);
    }

    const toc = [];
    const html = markdownToHtml(body, { file, toc });
    const text = visible(html);
    assertNoDashes(text, file, "post body");
    const words = text.split(" ").filter(Boolean).length;

    posts.push({
      slug,
      page: `blog/${slug}.html`,
      title: meta.title,
      description: meta.description,
      excerpt: meta.excerpt,
      author: meta.author,
      category: meta.category,
      series: meta.series || null,
      playlist: meta.playlist || null,
      translation: (meta.translation || "").toUpperCase() || null,
      date: meta.date,
      dateLabel: dateLabel(meta.date),
      words,
      minutes: Math.max(1, Math.round(words / 200)),
      toc,
      html,
    });
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}
