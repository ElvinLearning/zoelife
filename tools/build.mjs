/**
 * Zoe Life Phase 1 page builder (Meeting 3).
 *
 * Shared chrome + per-page content. Re-run with:  node tools/build.mjs
 * Staging:  node tools/build.mjs --staging
 */

import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { escapeAttr, loadExistingConfig, resolveIntegrations } from "./site-config.mjs";
import {
  ALL_CLIPS,
  CLIPS,
  COURSE_BUNDLE,
  COURSE_TRACKS,
  RESOURCE_CATEGORIES,
} from "./site-content.mjs";
import { loadPosts, slugify } from "./blog.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTS = loadPosts(ROOT);
const STAGING = process.argv.includes("--staging") || process.env.ZOE_STAGING === "1";
const STRIPE_SANDBOX = process.argv.includes("--stripe-sandbox");
if (STRIPE_SANDBOX && !STAGING) throw new Error('Stripe sandbox requires --staging');
const sandbox = STRIPE_SANDBOX
  ? JSON.parse(readFileSync(join(ROOT, 'integrations/stripe/sandbox.json'), 'utf8')) : null;

const resolved = resolveIntegrations({
  env: process.env,
  existing: loadExistingConfig(join(ROOT, "js/config.js")),
  staging: STAGING,
});
const CONFIG = {
  siteUrl: process.env.ZOE_SITE_URL || "https://www.zoelifehub.com",
  ...resolved,
  staging: STAGING,
};

if (sandbox) {
  for (const book of ['devotional', 'journal']) {
    const url = sandbox.products[book].paymentLink;
    if (!/^https:\/\/buy\.stripe\.com\/test_[a-zA-Z0-9]+$/.test(url)) throw new Error('Sandbox requires Stripe test Payment Links');
    CONFIG.payments[book] = {amazon:null, etsy:null, gumroad:null, paypal:null, stripe:url};
  }
  CONFIG.paidBookingUrl = null;
}
const stripeTestLink = url => /^https:\/\/buy\.stripe\.com\/test_/.test(url || '');
const courseStripeUrls = ["singleDating", "committed", "engagedFirstYear", "couplesBundle"].map(
  (key) => CONFIG.courses[key]
);
if (!STAGING && [...Object.values(CONFIG.payments).map((p) => p.stripe), ...courseStripeUrls].some(stripeTestLink)) {
  throw new Error('Stripe test Payment Links cannot be used in production');
}

// Fail the build before interpolating untrusted/invalid URLs into HTML.
for (const value of [CONFIG.siteUrl, CONFIG.formEndpoint, CONFIG.newsletterEndpoint,
  CONFIG.bookingUrl, CONFIG.paidBookingUrl, CONFIG.coursesUrl, CONFIG.resources.channelUrl,
  ...CONFIG.resources.playlists.map((item) => item.embedUrl),
  ...Object.values(CONFIG.giving),
  ...Object.values(CONFIG.courses),
  ...Object.values(CONFIG.payments).flatMap(Object.values)]) {
  if (value && (!/^https:\/\//.test(value) || /[\s<>"']/.test(value) || new URL(value).username || new URL(value).password)) {
    throw new Error('Integration URLs must be valid HTTPS URLs without credentials or HTML');
  }
}
const workspaceEndpoint = (value) => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(value || '');
const TAGLINE = "Helping people thrive in every season of life.";
const MESSAGE_CTA = "Send a Message";
const MESSAGE_HREF = "contact.html#message";
const CONSULT_CTA = "Schedule a Complimentary 20-Minute Consultation";
const CONSULT_HREF = "consult.html";
const SUBSCRIBE_INTRO =
  "Stay connected with Zoe Life! Subscribe to receive encouragement, helpful resources, and updates on our latest books, articles, videos, and upcoming opportunities.";
const CONSENT_JOIN = "I agree to receive emails from Zoe Life and understand that I can unsubscribe at any time.";
const CONSENT = workspaceEndpoint(CONFIG.newsletterEndpoint)
  ? `${CONSENT_JOIN} We will email you a link to confirm.`
  : CONSENT_JOIN;

const ZOE_LIFE_SOCIALS = [
  ["facebook", "Facebook", "https://www.facebook.com/zoelifehub", "@zoelifehub"],
  ["instagram", "Instagram", "https://www.instagram.com/zoelifehub/", "@zoelifehub"],
  ["tiktok", "TikTok", "https://www.tiktok.com/@zoelifehub1", "@zoelifehub1"],
  ["youtube", "YouTube", "https://www.youtube.com/@zoelifehub1", "@zoelifehub1"],
  ["x", "X", "https://x.com/zoelifehub", "@zoelifehub"],
];

const FAMILY_SOCIALS = [
  ["facebook", "Facebook", "https://www.facebook.com/zoefamilylife10", "@zoefamilylife10"],
  ["instagram", "Instagram", "https://www.instagram.com/zoefamilylife", "@zoefamilylife"],
  ["tiktok", "TikTok", "https://www.tiktok.com/@zoefamilylife", "@zoefamilylife"],
  ["youtube", "YouTube", "https://www.youtube.com/@zoefamilylife", "@zoefamilylife"],
];

// Two plain links and two short menus. Keep the header to four items so it
// never has to shrink its type to fit.
const NAV = [
  { href: "index.html", label: "Home" },
  { href: "about.html", label: "About" },
  {
    id: "resources",
    label: "Resources",
    items: [
      ["books.html", "Books", "Gratitude devotional and journal"],
      ["blog.html", "Articles", "Articles on marriage, dating, and faith"],
      ["resources.html", "Videos", "Teaching clips and full series"],
    ],
  },
  {
    id: "connect",
    label: "Connect",
    items: [
      ["connect.html", "Follow Along", "Our socials and Zoe Family Life"],
      ["consult.html", "Consultation", "What to expect from a complimentary consultation"],
      ["partner.html", "Partner With Us", "Explore partnerships and collaborations"],
      ["contact.html", "Contact", "Send us a message"],
    ],
  },
];

const FOOTER_NAV = [
  ["Explore", [
    ["index.html", "Home"],
    ["about.html", "About Zoe Life"],
    ["resources-overview.html", "Books &amp; Resources"],
    ["blog.html", "Articles"],
    ["resources.html", "Videos"],
  ]],
  ["Connect", [
    ["connect.html", "Follow Along"],
    [MESSAGE_HREF, MESSAGE_CTA],
    [CONSULT_HREF, "Schedule a Complimentary Consultation"],
    ["partner.html", "Partner With Us"],
  ]],
];

// Exact page gets aria-current="page"; a page inside a section (a course
// track, a blog post) marks its section link with aria-current="true".
const currentState = (href, current) => {
  if (href === current) return "page";
  const section = href.replace(/\.html$/, "/");
  return ["courses/", "blog/"].includes(section) && current.startsWith(section) ? "true" : null;
};

const SOCIAL_ICONS = {
  facebook:
    '<path d="M14 9h2.5V6H14c-2 0-3.5 1.5-3.5 3.5V11H8v3h2.5v7h3v-7H16l.5-3h-3V9.5C13.5 9.2 13.7 9 14 9z"/>',
  instagram:
    '<path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.8.07-.9 0-1.4.2-1.7.3-.4.2-.7.4-1 .7-.3.3-.5.6-.7 1-.1.3-.3.8-.3 1.7C3.5 8.5 3.5 8.9 3.5 12s0 3.5.07 4.8c0 .9.2 1.4.3 1.7.2.4.4.7.7 1 .3.3.6.5 1 .7.3.1.8.3 1.7.3 1.3.07 1.7.07 4.8.07s3.5 0 4.8-.07c.9 0 1.4-.2 1.7-.3.4-.2.7-.4 1-.7.3-.3.5-.6.7-1 .1-.3.3-.8.3-1.7.07-1.3.07-1.7.07-4.8s0-3.5-.07-4.8c0-.9-.2-1.4-.3-1.7-.2-.4-.4-.7-.7-1-.3-.3-.6-.5-1-.7-.3-.1-.8-.3-1.7-.3C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 110 9.8 4.9 4.9 0 010-9.8zm0 8a3.1 3.1 0 100-6.2 3.1 3.1 0 000 6.2zm6.2-8.2a1.15 1.15 0 11-2.3 0 1.15 1.15 0 012.3 0z"/>',
  tiktok:
    '<path d="M16.5 2h-3v13.2a2.6 2.6 0 11-2.2-2.6v-3a5.6 5.6 0 105.2 5.6V8.9a6.6 6.6 0 003.5 1V6.8a3.6 3.6 0 01-3.5-3.5V2z"/>',
  youtube:
    '<path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15.1V8.9l5.2 3.1-5.2 3.1z"/>',
  x: '<path d="M17.5 3h3.1l-6.8 7.7L21.8 21h-6.3l-4.9-6.4L4.9 21H1.8l7.2-8.2L1.5 3h6.4l4.4 5.9L17.5 3zm-1.1 16.1h1.7L7.7 4.8H5.9l10.5 14.3z"/>',
};

const icon = (key) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SOCIAL_ICONS[key]}</svg>`;

// Decorative section icons keep the client's labels and descriptions untouched.
const SECTION_ICONS = {
  cross: '<path d="M9 3h6v6h5v5h-5v7H9v-7H4V9h5z"/>',
  book: '<path d="M12 6v15M3 3h5a4 4 0 0 1 4 3 4 4 0 0 1 4-3h5v16h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6zM8.5 12l2.5 2.5 4.5-5"/>',
  heart: '<path d="M20.2 5.8a5 5 0 0 0-7.1 0L12 6.9l-1.1-1.1a5 5 0 0 0-7.1 7.1L12 21l8.2-8.1a5 5 0 0 0 0-7.1z"/>',
  hands: '<path d="M3 15h3l3-3h5a2 2 0 0 1 0 4h-3M3 15v6h4l11-4 3-5a2 2 0 0 0-3-1l-2 3M8 7h8M12 3v8"/>',
  growth: '<path d="M12 21V10M12 14C5 14 3 10 3 5c6 0 9 3 9 9ZM12 10c0-5 3-7 9-7 0 5-3 8-9 8"/>',
  conversation: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8Z"/><path d="M7 8h9M7 12h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m16 9 6-3v12l-6-3"/>',
  collaboration: '<path d="m9 15 6-6M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(0 -1) scale(.95)"/>',
  microphone: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
};
const sectionIcon = (key) => `<svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${SECTION_ICONS[key]}</svg>`;

const socialLink = ([key, label, href], brand) => `
              <li><a class="social-link" href="${href}" target="_blank" rel="noopener noreferrer">
                ${icon(key)}<span>${label}</span>
                <span class="visually-hidden">, ${brand}, opens in a new tab</span>
              </a></li>`;

const socialList = (list, brand) =>
  `<ul class="social-list">${list.map((s) => socialLink(s, brand)).join("")}
            </ul>`;

const canonicalFor = (page) =>
  `${CONFIG.siteUrl.replace(/\/$/, "")}/${page === "index.html" ? "" : page.replace(/\.html$/, "")}`;

const prefixOf = (page) => "../".repeat(Math.max(0, String(page).split("/").length - 1));

const externalLink = (href, className, label, extraHidden = "") =>
  `<a class="btn ${className}" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${label}<span class="visually-hidden">, opens in a new tab${extraHidden}</span></a>`;

const consultationLink = (label) => CONFIG.bookingUrl
  ? externalLink(CONFIG.bookingUrl, "btn-secondary", label)
  : `<a class="btn btn-secondary" href="${CONSULT_HREF}">${label}</a>`;

const payButtons = (book) => {
  const p = CONFIG.payments[book];
  // Retain the explicit sandbox workflow without exposing test purchases to visitors.
  if (sandbox) return `<div class="pay-row">${externalLink(p.stripe, "btn-primary", "Test Stripe checkout")}</div><p class="format-meta">Sandbox test only. No real payment or book delivery.</p>`;
  return p.amazon ? `<div class="pay-row">${externalLink(p.amazon, "btn-primary", "Buy on Amazon")}</div>` : "";
};

const clipById = (id) => {
  const clip = ALL_CLIPS.find((item) => item.id === id);
  if (!clip) throw new Error(`Unknown clip ${id}`);
  return clip;
};

const clipPlayer = (clip, heading) => `<figure class="clip">
          <div class="clip-stage">
            <video playsinline preload="none" poster="assets/clips/${clip.file}.jpg" width="720" height="1280" aria-labelledby="clip-${clip.id}-title">
              <source src="assets/clips/${clip.file}.mp4" type="video/mp4">
            </video>
            <button type="button" class="clip-play">
              <svg viewBox="0 0 12 14" aria-hidden="true" focusable="false"><path d="M1 1.2v11.6L11 7 1 1.2z"/></svg>
              <span class="visually-hidden">Play ${escapeAttr(clip.title)}</span>
            </button>
          </div>
          <figcaption>
            <${heading} class="clip-title" id="clip-${clip.id}-title">${escapeAttr(clip.title)}</${heading}>
            <p class="clip-source"><a href="${escapeAttr(clip.youtube)}" target="_blank" rel="noopener noreferrer">Watch the full video<span class="visually-hidden"> on YouTube, opens in a new tab</span></a></p>
          </figcaption>
        </figure>`;

const clipGrid = (clips, heading) =>
  `<div class="clip-grid">
${clips.map((clip) => clipPlayer(clip, heading)).join("\n")}
        </div>`;

const enrollOrBuy = (slot, label) => {
  const url = CONFIG.courses[slot];
  if (!url) return `<p class="enrollment-note">Enrollment opens soon.</p>`;
  return `<div class="btn-row">${externalLink(url, "btn-primary", label)}</div>`;
};

const dangerousLiesShorts = `<div class="short-clips" id="short-clips">
          <p class="eyebrow">Short clips</p>
          <p>Eight short clips from this series. Captions are already in the picture. Press play when you are ready.</p>
          ${clipGrid(CLIPS, "h4")}
        </div>`;

const playlistById = (id) => {
  const item = CONFIG.resources.playlists.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown playlist ${id}`);
  return item;
};

const renderResourceBlock = (block) => {
  if (block.type === "clips") {
    return `<div class="short-clips">
          <p>${escapeAttr(block.intro)}</p>
          ${clipGrid(block.ids.map(clipById), block.heading)}
        </div>`;
  }
  const item = playlistById(block.id);
  const shorts = block.shorts ? dangerousLiesShorts : "";
  return `<article class="video-item" id="${escapeAttr(item.id)}">
        <h3>${escapeAttr(item.title)}</h3>
        <div class="video-frame">
          <iframe src="${escapeAttr(item.embedUrl)}" title="${escapeAttr(item.title)} playlist from Zoe Family Life" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <p class="card-link"><a href="https://www.youtube.com/playlist?list=${escapeAttr(item.id)}" target="_blank" rel="noopener noreferrer">Watch this series on YouTube<span class="visually-hidden">, opens in a new tab</span></a></p>
        ${shorts}
      </article>`;
};

const categorySections = () => {
  const used = new Set();
  const html = RESOURCE_CATEGORIES.map((category) => {
    const blocks = category.blocks
      .map((block) => {
        if (block.type === "playlist") {
          if (used.has(block.id)) throw new Error(`Playlist ${block.id} is listed twice`);
          used.add(block.id);
        }
        return renderResourceBlock(block);
      })
      .join("\n");
    const classes = ["resource-category", category.band].filter(Boolean).join(" ");
    return `<section class="${classes}" id="${escapeAttr(category.id)}">
  <div class="wrap">
    <h2>${escapeAttr(category.title)}</h2>
    <p>${escapeAttr(category.intro)}</p>
    <div class="video-list">
${blocks}
    </div>
  </div>
</section>`;
  }).join("\n");
  for (const item of CONFIG.resources.playlists) {
    if (!used.has(item.id)) throw new Error(`Playlist ${item.id} is not in a Resources category`);
  }
  return html;
};

const categoryNav = () =>
  `<nav class="category-nav" aria-label="Resource categories">
          ${RESOURCE_CATEGORIES.map(
            (category) => `<a href="#${escapeAttr(category.id)}">${escapeAttr(category.title)}</a>`
          ).join("\n          ")}
        </nav>`;

const postCard = (post, heading, pre, eyebrow = post.category) => `      <article class="card post-card">
        <p class="eyebrow">${escapeAttr(eyebrow)}</p>
        <${heading}><a href="${pre}${post.page}">${escapeAttr(post.title)}</a></${heading}>
        <p class="post-meta"><time datetime="${post.date}">${post.dateLabel}</time> <span aria-hidden="true">&middot;</span> ${post.minutes} min read</p>
        <p>${escapeAttr(post.excerpt)}</p>
        <p class="read-more" aria-hidden="true">Read the Article</p>
      </article>`;

const bookingBlock = () =>
  CONFIG.bookingUrl
    ? `<p>Choose a convenient time using our online scheduling calendar.</p><div class="btn-row">
          ${externalLink(CONFIG.bookingUrl, "btn-primary", "Schedule Your Complimentary Consultation")}
        </div>`
    : `<p>Send us a message and we’ll help you arrange a time.</p>
        <div class="btn-row"><a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a></div>`;

const head = ({ title, description, page, noindex = false, ogType = "website", extraHead = "" }) => {
  const pre = prefixOf(page);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
${CONFIG.staging || noindex
  ? '<meta name="robots" content="noindex, nofollow">'
  : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${canonicalFor(page)}">
<meta name="theme-color" content="#F8F4ED">
<meta property="og:type" content="${ogType}">${extraHead}
<meta property="og:site_name" content="Zoe Life">
<meta property="og:url" content="${canonicalFor(page)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${CONFIG.siteUrl.replace(/\/$/, "")}/assets/photos/tayo-kemi-about.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${pre}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${pre}assets/brand/zoe-life-mark.png">
<link rel="preload" href="${pre}fonts/fraunces-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${pre}fonts/outfit-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${pre}css/style.css">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-R18R3LVBK9"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-R18R3LVBK9');
</script>
<script src="${pre}js/config.js"></script>
</head>
<body data-page="${page}">
<a class="skip-link" href="#main">Skip to main content</a>`;
};

const header = (current) => {
  const pre = prefixOf(current);
  const messageHref = `${pre}contact.html#message`;
  return `
<header class="site-header">
  <div class="wrap-wide header-inner">
    <a class="brand" href="${pre}index.html">
      <img class="brand-wordmark" src="${pre}assets/brand/zoe-life-wordmark.png" alt="Zoe Life" width="220" height="45">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span aria-hidden="true">&#9776;</span> Menu
    </button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="nav-list">
${NAV.map((entry, index) => {
  if (!entry.items) {
    const state = currentState(entry.href, current);
    return `        <li><a class="nav-link" href="${pre}${entry.href}"${state ? ` aria-current="${state}"` : ""}>${entry.label}</a></li>`;
  }
  const inSection = entry.items.some(([href]) => currentState(href, current));
  const end = index === NAV.length - 1 ? " nav-group-end" : "";
  return `        <li class="nav-group${end}">
          <button class="nav-trigger${inSection ? " is-current" : ""}" type="button" aria-expanded="false" aria-controls="nav-${entry.id}">${entry.label}<svg viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <span class="nav-group-label" aria-hidden="true">${entry.label}</span>
          <ul class="nav-sub" id="nav-${entry.id}" aria-label="${entry.label}">
${entry.items.map(([href, label, desc]) => {
  const state = currentState(href, current);
  return `            <li><a href="${pre}${href}"${state ? ` aria-current="${state}"` : ""}><span class="nav-sub-label">${label}</span><span class="nav-sub-desc">${desc}</span></a></li>`;
}).join("\n")}
          </ul>
        </li>`;
}).join("\n")}
        <li class="nav-cta"><a href="${messageHref}">${MESSAGE_CTA}</a></li>
      </ul>
    </nav>
    <a class="btn btn-primary header-cta" href="${messageHref}">${MESSAGE_CTA}</a>
  </div>
</header>
<main id="main">`;
};

const subscribeForm = (idPrefix, intro) => `
      <form class="subscribe-form" data-form="subscribe" novalidate>
        ${intro ? `<p class="hint">${SUBSCRIBE_INTRO}</p>` : ""}
        <div class="field">
          <label for="${idPrefix}-email">Email address <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
          <input type="email" id="${idPrefix}-email" name="email" autocomplete="email"
                 required aria-describedby="${idPrefix}-email-error">
          <p class="error" id="${idPrefix}-email-error" role="alert"></p>
        </div>
        <div class="field">
          <label class="consent" for="${idPrefix}-consent">
            <input type="checkbox" id="${idPrefix}-consent" name="consent" required
                   aria-describedby="${idPrefix}-consent-error">
            <span class="consent-note">${CONSENT_JOIN}</span>
          </label>
          <p class="error" id="${idPrefix}-consent-error" role="alert"></p>
        </div>
        <div class="field" aria-hidden="true" style="position:absolute;left:-9999px">
          <label for="${idPrefix}-honey">Leave this field empty</label>
          <input type="text" id="${idPrefix}-honey" name="_honey" tabindex="-1" autocomplete="off">
        </div>
        ${workspaceEndpoint(CONFIG.newsletterEndpoint) ? "<p class=\"hint\">We will email you a link to confirm.</p>" : ""}
        <button class="btn btn-primary" type="submit">Subscribe</button>
        <div class="form-status" data-status role="status" aria-live="polite"></div>
      </form>`;

// A page that already carries its own Stay in Touch form does not get a
// second one in the footer.
const footer = (current, { subscribe = true } = {}) => {
  const pre = prefixOf(current);
  return `
</main>
<footer class="site-footer">
  <div class="wrap-wide">
    <div class="footer-top">
      <img class="footer-wordmark" src="${pre}assets/brand/zoe-life-wordmark.png" alt="" width="220" height="45" loading="lazy">
      <p class="footer-tagline">${TAGLINE}</p>
    </div>
    <div class="footer-grid${subscribe ? "" : " footer-grid-compact"}">
${FOOTER_NAV.map(([heading, links]) => `
      <nav class="footer-nav" aria-labelledby="footer-${slugify(heading)}">
        <h2 class="footer-h" id="footer-${slugify(heading)}">${heading}</h2>
        <ul>
${links.map(([href, label]) => `          <li><a href="${pre}${href}">${label}</a></li>`).join("\n")}
        </ul>
      </nav>`).join("\n")}

      <div class="footer-social">
        <h2 class="footer-h">Social</h2>
        ${socialList(ZOE_LIFE_SOCIALS, "Zoe Life")}
      </div>
${subscribe ? `
      <div class="footer-subscribe">
        <h2 class="footer-h footer-h-lead">Stay in Touch</h2>
${subscribeForm("footer", true)}
      </div>
` : ""}
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Zoe Life LLC. All rights reserved.</p>
      <p><a href="${pre}privacy.html">Privacy Policy</a> · <a href="${pre}terms.html">Terms &amp; Conditions</a></p>
    </div>
  </div>
</footer>
<script src="${pre}js/main.js"></script>
</body>
</html>
`;
};

const page = (meta, body) =>
  head(meta) + header(meta.page) + body +
  footer(meta.page, { subscribe: !/data-form="subscribe"/.test(body) });

const socialVisit = (list, brand) =>
  `<ul class="social-list social-visit">${list
    .map(
      ([key, label, href]) => `
              <li><a class="social-link" href="${href}" target="_blank" rel="noopener noreferrer">
                ${icon(key)}<span>Visit ${label}</span>
                <span class="visually-hidden">, ${brand}, opens in a new tab</span>
              </a></li>`
    )
    .join("")}
            </ul>`;

/* ------------------------------------------------------------------ pages -- */

const home = page(
  {
    page: "index.html",
    title: "Zoe Life | Helping people thrive in every season of life",
    description:
      "At Zoe Life, we are passionate about helping individuals, couples, and families grow and thrive in every season of life.",
  },
  `

<section class="hero-home">
  <div class="hero-split wrap-wide">
    <div class="hero-copy">
      <p class="eyebrow">Zoe Life</p>
      <h1 class="tagline-heading"><span>Helping people thrive</span> <span>in every season of life.</span></h1>
      <p class="lede">At Zoe Life, we are passionate about helping individuals, couples, and families grow and thrive in every season of life. We believe that every season of life presents opportunities for growth, and our desire is to walk alongside you, providing faith-based and practical guidance, coaching, encouragement, and resources to help you navigate life’s opportunities and challenges, strengthen relationships, and live a purposeful and fulfilling life.</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="about.html#about-zoe-life">Explore Zoe Life</a>
        <a class="btn btn-secondary" href="resources-overview.html">Explore Resources</a>
        <a class="btn btn-secondary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
      </div>
    </div>
    <figure class="hero-photo">
      <img src="assets/photos/tayo-kemi-full.jpg"
           alt="Tayo and Kemi Akinyemi standing together outdoors, smiling."
           width="1600" height="2134">
    </figure>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="intro-split">
      <div>
        <p class="eyebrow">A word from us</p>
        <h2>We’re Here to Walk Alongside You.</h2>
      </div>
      <div>
        <p>We believe that God’s Word provides the foundation and guidance we need for every area of life. Our heart is to encourage you and walk alongside you, helping you apply biblical principles and practical wisdom as you navigate life’s opportunities, decisions, and challenges. Whether it’s personal growth, relationships, marriage, parenting, education, or career development, we are passionate about providing encouragement, guidance, and resources to help you make wise decisions, grow in faith, and thrive in every season of life.</p>
        <p class="card-link"><a href="about.html#about-zoe-life">Get to Know Zoe Life</a></p>
      </div>
    </div>
  </div>
</section>

<section class="band-tan">
  <div class="wrap">
    <div class="split split-copy-photo">
      <div>
        <p class="eyebrow">Tayo and Kemi</p>
        <h2>We Are Glad You Are Here.</h2>
        <p>We are Tayo and Kemi Akinyemi, cofounders of Zoe Life and married for nearly twenty years. Our shared passion for God and people, along with our experiences in marriage, family life, ministry, and our professional careers, inspired us to establish Zoe Life as a platform to encourage, equip, and empower others. We are excited to share this journey with you and look forward to connecting with you!</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="about.html#meet">Get to Know Us</a>
        </div>
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-studio.jpeg"
             alt="Tayo and Kemi Akinyemi in a studio portrait, smiling."
             width="1600" height="2400" loading="lazy">
      </figure>
    </div>
  </div>
</section>

<section id="resources">
  <div class="wrap">
    <p class="eyebrow">Books &amp; Resources</p>
    <h2>Resources to Encourage and Equip You.</h2>
    <p class="lede">Explore books and resources created to encourage your faith, support personal growth, and help you apply biblical principles in everyday life.</p><p>We are excited to introduce our first two publications, designed to help you cultivate and maintain a lifestyle of thanksgiving to God.</p>

    <div class="book-pair">
    <div class="book-tease">
      <div class="book-cover">
        <img src="assets/books/gratitude-devotional-cover.jpg"
             alt="Cover of A 7-Day Gratitude Devotional by Kemi Akinyemi, cream cover with green serif title and botanical accents."
             width="888" height="1292" loading="lazy">
      </div>
      <div>
        <h3 class="book-title">A 7-Day Gratitude Devotional</h3>
        <p>A seven-day journey through Scripture, reflection, and prayer to encourage you to cultivate a heart of gratitude to God and make thanksgiving a part of your daily life.</p>
        <p class="card-link"><a href="books.html#devotional">Explore the Devotional</a></p>
      </div>
    </div>

    <div class="book-tease">
      <div class="book-cover">
        <img src="assets/books/gratitude-journal-cover.jpg"
             alt="Cover of A 100-Day Gratitude Journal by Kemi Akinyemi, open journal with eucalyptus and a dawn landscape."
             width="900" height="1350" loading="lazy">
      </div>
      <div>
        <h3 class="book-title">A 100-Day Gratitude Journal</h3>
        <p>A guided journal designed to help you reflect on God’s goodness, express your personal thanksgiving, and develop a consistent lifestyle of gratitude to Him.</p>
        <p class="card-link"><a href="books.html#journal">Explore the Journal</a></p>
      </div>
    </div>
    </div>
  </div>
</section>

<section class="band-tan" id="read-and-watch">
  <div class="wrap">
    <p class="eyebrow">Articles &amp; Videos</p>
    <h2>Insights and Encouragement for Everyday Life</h2>
    <p>Explore articles, videos, and practical insights to encourage your faith, strengthen relationships, support personal growth, and help you navigate everyday life with biblical wisdom.</p>
    <div class="card-grid">
${POSTS.slice(0, 2).map((post) => postCard(post, "h3", "")).join("\n")}
      <article class="card">
        <p class="eyebrow">Videos</p>
        <h3>Teaching from Zoe Family Life.</h3>
        <p>Our teaching on singleness, marriage, conflict, and faith, in short clips and full series.</p>
        <p class="card-link"><a href="resources.html">Watch the Series</a></p>
      </article>
    </div>
    <p class="card-link"><a href="articles-videos.html">Explore More Articles &amp; Videos</a></p>
  </div>
</section>

<section id="connect" class="cta-center">
  <div class="wrap">
    <p class="eyebrow">A next step</p>
    <h2>We Would Love to Hear From You!</h2>
    <p class="lede">Whether you have a question, would like to learn more about our coaching services, explore our books and resources, or connect with us about speaking engagements and other opportunities, we would love to hear from you. Feel free to send us a message or schedule a complimentary consultation to explore how we can support you.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
      ${consultationLink(CONSULT_CTA)}
    </div>

  </div>
</section>
`
);

const about = page(
  {
    page: "about.html",
    title: "About Zoe Life | Tayo and Kemi",
    description:
      "We are Tayo and Kemi. Learn why we started Zoe Life and how Scripture shapes our teaching and resources.",
  },
  `
<section class="page-hero" id="about-zoe-life">
  <div class="wrap">
    <p class="eyebrow">About</p>
    <h1>About Zoe Life</h1>
    <p class="lede">${TAGLINE}</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="split split-wide-left">
      <div>
        <p>Zoe Life was established out of our shared passion for God and people, and our desire to encourage, equip, and empower individuals, couples, and families to thrive in every season of life.</p>
        <p>We believe that God’s Word provides the foundation for living a purposeful and fulfilling life. Through faith-based and practical coaching, teaching, books, and other resources, our desire is to help people grow in their relationship with God, develop personally, strengthen relationships, and navigate life’s opportunities and challenges with wisdom and confidence.</p>
        <p>The name <em>Zoe</em> comes from the Greek word for life, used in John 10:10, where Jesus speaks of the abundant life He came to give. This Scripture reflects the heart behind Zoe Life. We desire to help people discover, experience, and walk in the fullness of life that God has made available through Jesus Christ.</p>
        <p>Whether you’re seeking personal growth, guidance in relationships or marriage, support in parenting, or direction in education or career development, our heart is to provide encouragement, biblical wisdom, and practical resources that support you along the way.</p>
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-studio.jpeg"
             alt="Tayo and Kemi Akinyemi in a studio portrait, smiling."
             width="1600" height="2400">
        <figcaption>Tayo and Kemi Akinyemi</figcaption>
      </figure>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="grid grid-2">
      <div>
        <p class="eyebrow">Mission</p>
        <h2>Encouraging, Equipping, and Empowering People to Thrive</h2>
        <p>Our mission is to provide faith-based and practical coaching, teaching, encouragement, and resources that help individuals, couples, and families grow in faith, develop personally, strengthen relationships, make wise decisions, and thrive in every season of life.</p>
      </div>
      <div>
        <p class="eyebrow">Vision</p>
        <h2>Lives Transformed, Families Strengthened, and Communities Impacted</h2>
        <p>Our vision is to see individuals experiencing the abundant life that Jesus Christ came to give, growing in their relationship with God, and fulfilling His purpose for their lives. We desire to see marriages and families strengthened, individuals thriving in every season of life, and people making a positive difference in their homes, workplaces, churches, and communities.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Who we are</p>
    <h2>Core values</h2>
    <div class="values" style="margin-top:1.75rem">
      <div class="value">${sectionIcon("cross")}<h3>Christ-Centered</h3><p>Jesus Christ is the foundation of all we do. We desire to honor Him and point others toward Him through our work.</p></div>
      <div class="value">${sectionIcon("book")}<h3>Biblical Truth</h3><p>God’s Word is our foundation and final authority. We are committed to sharing biblical truth faithfully and encouraging its application in everyday life.</p></div>
      <div class="value">${sectionIcon("compass")}<h3>Practical Wisdom</h3><p>We believe biblical principles should be lived out. Our desire is to help people apply God’s Word and practical wisdom to everyday decisions and experiences.</p></div>
      <div class="value">${sectionIcon("star")}<h3>Excellence</h3><p>We are committed to honoring God through excellence, diligence, and faithful service in all we do.</p></div>
      <div class="value">${sectionIcon("shield")}<h3>Integrity</h3><p>We value honesty, accountability, and consistency between what we believe, teach, and practice.</p></div>
      <div class="value">${sectionIcon("heart")}<h3>Compassion</h3><p>We desire to serve others with genuine love, kindness, patience, and understanding.</p></div>
      <div class="value">${sectionIcon("hands")}<h3>Stewardship</h3><p>We seek to faithfully manage the time, opportunities, gifts, and resources God has entrusted to us.</p></div>
      <div class="value">${sectionIcon("growth")}<h3>Growth</h3><p>We believe in continually growing in our relationship with God, developing personally, and becoming more effective in serving others.</p></div>
    </div>
  </div>
</section>

<section class="band-tan" id="meet">
  <div class="wrap">
    <div class="split meet-split">
    <figure class="portrait portrait-couple portrait-tree">
      <img src="assets/photos/tayo-kemi-tree.jpeg"
           alt="Tayo and Kemi smiling and embracing outdoors in front of a large tree with vibrant pink blossoms."
           width="1024" height="1536" loading="lazy">
      <figcaption>Tayo and Kemi Akinyemi</figcaption>
    </figure>
    <div>
    <h2>Meet Tayo and Kemi Akinyemi</h2>
    <p>Tayo and Kemi Akinyemi are beloved children of God, husband and wife, parents of six children, pastors, and cofounders of Zoe Life LLC. Married for nearly twenty years, they serve together in pastoral leadership at Life Springs Church in Naperville, Illinois.</p>
        <p>Their shared passion for God and people, together with their experiences in marriage, parenting, ministry, education, leadership, and their professional careers, inspired them to establish Zoe Life as a platform to encourage, equip, and empower others.</p>
        <p>Through Zoe Life, they bring together biblical wisdom, practical insights, and personal and professional experiences to support individuals, couples, and families as they grow in faith, strengthen relationships, pursue their goals, and thrive in every season of life.</p>
    <div class="headshot-pair">
      <figure class="portrait">
        <img src="assets/photos/tayo-headshot.jpg"
             alt="Portrait of Tayo Akinyemi of Zoe Life."
             width="900" height="1350" loading="lazy">
        <figcaption>Tayo Akinyemi</figcaption>
      </figure>
      <figure class="portrait">
        <img src="assets/photos/kemi-headshot.jpg"
             alt="Portrait of Kemi Akinyemi of Zoe Life."
             width="1200" height="1800" loading="lazy">
        <figcaption>Kemi Akinyemi</figcaption>
      </figure>
    </div>
    </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <details class="faith-disclosure">
    <summary>Our Statement of Faith</summary>
    <p>At Zoe Life, our faith in God and our commitment to His Word are at the heart of everything we do. We believe that God’s Word is the foundation for living a purposeful, fulfilling, and abundant life through Jesus Christ. Our beliefs guide what we teach, the resources we create, and how we serve others.</p>
    <p>We believe:</p>
    <ul class="faith-list">
      <li><strong>The Word of God:</strong> The Bible is the inspired, authoritative, and trustworthy Word of God. It is our foundation for faith, teaching, and everyday living.</li>
      <li><strong>The One True God:</strong> There is one God, eternally existing in three persons: God the Father, God the Son, and God the Holy Spirit.</li>
      <li><strong>Jesus Christ:</strong> Jesus Christ is the Son of God, fully God and fully man. Through His life, sacrificial death, and resurrection, He has made salvation available to all who believe in Him.</li>
      <li><strong>Salvation by Grace Through Faith:</strong> Salvation is a gift from God, received by grace through faith in Jesus Christ. It cannot be earned through human effort or good works.</li>
      <li><strong>The Holy Spirit:</strong> The Holy Spirit dwells in every believer, empowering us to live godly lives, grow spiritually, understand and apply God’s Word, and fulfill God’s purpose for our lives.</li>
      <li><strong>The Value of Every Person:</strong> Every person is created in the image of God and is worthy of love, dignity, and respect.</li>
      <li><strong>The Church:</strong> The Church is the body of Christ, called to worship God, grow in faith, make disciples, and demonstrate His love and power to the world.</li>
      <li><strong>Marriage and Family:</strong> Marriage is a covenant established by God between one man and one woman, designed to reflect Christ’s relationship with His Church. We believe that God’s Word provides the foundation for building strong marriages and families.</li>
      <li><strong>Christian Living:</strong> God calls us to live lives of holiness, love, integrity, compassion, stewardship, and obedience to His Word, reflecting the character of Christ in our everyday lives.</li>
      <li><strong>The Return of Jesus Christ:</strong> We believe in the return of our Lord Jesus Christ and the fulfillment of God’s eternal promises and Kingdom.</li>
    </ul>
    <p>These beliefs are foundational to Zoe Life. Through our coaching, teaching, books, and other resources, our desire is to remain faithful to God’s Word, encourage others to grow in their relationship with Him, and help individuals and families experience the abundant life Jesus Christ came to give.</p>
    </details>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Let’s Connect</p>
    <h2>We Would Love to Hear From You!</h2>
    <p>Whether you have a question, would like to learn more about our coaching services, explore our books and resources, or connect with us about speaking engagements and other opportunities, we would love to hear from you. Feel free to send us a message or schedule a complimentary consultation to explore how we can support you.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
      ${consultationLink(CONSULT_CTA)}
    </div>
  </div>
</section>
`
);

const books = page(
  {
    page: "books.html",
    title: "Books | Zoe Life",
    description:
      "A 7-Day Gratitude Devotional and A 100-Day Gratitude Journal by Kemi Akinyemi. Biblical, practical gratitude books from Zoe Life.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">BOOKS &amp; PUBLICATIONS</p>
<h1>Resources to Encourage and Equip You.</h1>
    <p>We are excited to share books and resources created to encourage you in your walk with God, support your personal growth, and help you apply biblical principles in everyday life.</p>
        <p>Our first two publications focus on something very close to our hearts: cultivating and maintaining a lifestyle of thanksgiving to God. We pray that these resources will encourage you to intentionally recognize God’s goodness and make gratitude a part of your daily life.</p>
  </div>
</section>

<section id="devotional">
  <div class="wrap">
    <div class="book">
      <div class="book-cover">
        <img src="assets/books/gratitude-devotional-cover.jpg"
             alt="Cover of A 7-Day Gratitude Devotional by Kemi Akinyemi, cream cover with green serif title and botanical accents."
             width="888" height="1292">
      </div>
      <div>
        <p class="eyebrow">Devotional</p>
        <h2 class="book-title">A 7-Day Gratitude Devotional</h2>
        <p class="lede">Cultivating a Heart of Thanksgiving to God</p><p>By Kemi Akinyemi</p>
        <p>There is so much to be thankful to God for, and sometimes we simply need to be more intentional about recognizing and expressing our gratitude to Him.</p>
        <p>This seven-day devotional invites you to spend time in God’s Word, reflect on His goodness, and express your thanksgiving through prayer. Each day provides Scripture, encouragement, reflection, and prayer to help you cultivate a heart of gratitude to God.</p>
        <p>Whether you are beginning this journey or looking to strengthen your existing practice of thanksgiving, we pray that this devotional will encourage you to make gratitude to God a part of your everyday life.</p>
${payButtons("devotional") ? "        " + payButtons("devotional") + "\n" : ""}      </div>
    </div>
  </div>
</section>

<section id="journal">
  <div class="wrap">
    <div class="book">
      <div class="book-cover">
        <img src="assets/books/gratitude-journal-cover.jpg"
             alt="Cover of A 100-Day Gratitude Journal by Kemi Akinyemi, open journal with eucalyptus and a dawn landscape."
             width="900" height="1350" loading="lazy">
      </div>
      <div>
        <p class="eyebrow">Journal</p>
        <h2 class="book-title">A 100-Day Gratitude Journal</h2>
        <p class="lede">Cultivating a Lifestyle of Thanksgiving to God</p><p>By Kemi Akinyemi</p>
        <p>God’s goodness and faithfulness give us countless reasons to be thankful, and we believe that taking time to intentionally reflect on them can help us develop a more consistent lifestyle of gratitude.</p>
        <p>This 100-day guided journal provides an opportunity to pause each day, reflect on Scripture, consider God’s goodness in your own life, and express your personal thanksgiving to Him.</p>
        <p>With daily Scriptures, gratitude reflections, and space to write your own thoughts and prayers, the journal encourages you to develop a habit of thanksgiving while creating a personal record of God’s faithfulness in your life.</p>
${payButtons("journal") ? "        " + payButtons("journal") + "\n" : ""}      </div>
    </div>
  </div>
</section>

<section class="band-tan" id="collection"><div class="wrap">
<p class="eyebrow">COMPANION RESOURCES</p>
<h2>Two Resources, One Journey of Thanksgiving</h2>
<p>We are excited to share A 7-Day Gratitude Devotional and A 100-Day Gratitude Journal as two complementary resources to help you cultivate and maintain a lifestyle of thanksgiving to God.</p>
        <p>The devotional provides seven days of Scripture, reflection, and prayer to encourage you to cultivate a heart of gratitude, while the journal provides an opportunity to continue reflecting on God’s goodness and expressing your personal thanksgiving to Him over 100 days.</p>
        <p>You are welcome to purchase either book individually or get both to use together. They also make thoughtful gifts for friends, family, and others you would like to encourage.</p>
<div class="book-pair"><article class="book-tease">
        <div class="book-cover"><img src="assets/books/gratitude-devotional-cover.jpg" alt="Cover of A 7-Day Gratitude Devotional" width="888" height="1292" loading="lazy"></div>
        <div><h3>A 7-Day Gratitude Devotional</h3>${!sandbox ? payButtons("devotional") : ""}</div>
      </article>
<article class="book-tease">
        <div class="book-cover"><img src="assets/books/gratitude-journal-cover.jpg" alt="Cover of A 100-Day Gratitude Journal" width="900" height="1350" loading="lazy"></div>
        <div><h3>A 100-Day Gratitude Journal</h3>${!sandbox ? payButtons("journal") : ""}</div>
      </article></div>
</div></section>

<section id="group-orders"><div class="wrap">
<p class="eyebrow">GROUP &amp; BULK ORDERS</p>
<h2>Interested in Ordering Multiple Copies?</h2>
<p>Planning to share our books with your church, ministry, small group, organization, friends, or family? We’d love to hear from you!</p>
        <p>Whether you’re purchasing books for a group study, an event, or as gifts, feel free to reach out to discuss your needs and available ordering options.</p>
<div class="btn-row"><a class="btn btn-primary" href="contact.html?reason=Group%20%26%20Bulk%20Book%20Orders#message">Inquire About Group Orders</a></div>
</div></section>

<section><div class="wrap">
<p class="eyebrow">MORE TO COME</p>
<h2>More Books and Resources Are on the Way!</h2>
<p>We are excited about the additional books and resources we’re working on! Our heart is to continue sharing biblical encouragement and practical guidance to support you in your faith, personal growth, relationships, marriage, family life, and other areas of life.</p>
        <p>We look forward to sharing more with you!</p>
</div></section>
`
);

const connect = page(
  {
    page: "connect.html",
    title: "Connect with Zoe Life | Socials and Zoe Family Life",
    description:
      "Follow Zoe Life on Facebook, Instagram, TikTok, YouTube, and X. Zoe Family Life is a focused program for relationships, marriage, parenting, and family life.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Connect</p>
    <h1>Come find us.</h1>
    <p class="lede">Send us a message to connect, or follow along on the channels you already use.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="connect-find">
      <div>
        <p class="eyebrow">Zoe Life</p>
        <h2>Find us online.</h2>
        ${socialVisit(ZOE_LIFE_SOCIALS, "Zoe Life")}
      </div>
      <figure class="portrait portrait-connect">
        <img src="assets/photos/tayo-kemi-park.jpg"
             alt="Tayo and Kemi Akinyemi sitting together outdoors, smiling."
             width="1400" height="1866" loading="lazy">
      </figure>
    </div>
  </div>
</section>

<section class="band-tan">
  <div class="wrap">
    <article class="family-panel" id="zoe-family-life">
      <p class="eyebrow">A Zoe Life program</p>
      <h2>Zoe Family Life</h2>
      <p>Zoe Family Life is part of Zoe Life, with a particular focus on relationships, marriage, parenting, and family life. Follow along here, or watch the marriage series on the <a href="resources.html">Resources</a> page.</p>
      ${socialVisit(FAMILY_SOCIALS, "Zoe Family Life")}
    </article>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Stay in Touch</h2>
    <p>${SUBSCRIBE_INTRO}</p>
    <div class="form-card" style="max-width:32rem;margin-top:1.25rem">
${subscribeForm("connect", false)}
    </div>
    <p class="consult-aside">If you would like a short call, you can also schedule a complimentary 20-minute consultation.</p>
    <div class="btn-row">
      ${consultationLink(CONSULT_CTA)}
    </div>
  </div>
</section>
`
);

const contact = page(
  {
    page: "contact.html",
    title: "Contact Zoe Life | Send a message",
    description:
      "Send us a message to connect. Ask about books, speaking, workshops, or anything else on your mind.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Contact</p>
    <h1>We’d Love to Hear From You!</h1>
    <p class="lede">Whether you have a question, would like to learn more about our coaching services, explore our books and resources, or connect with us about speaking engagements and other opportunities, we’d love to hear from you.</p>
  </div>
</section>

<section id="message">
  <div class="wrap">
    <div class="split split-wide-left" style="align-items:start">
      <div>
        <h2>Send a Message</h2>
        <p>Please complete the form below, and we’ll get back to you within three business days.</p>

        <div class="form-card" style="margin-top:1.5rem">
          <form data-form="contact" novalidate>
            <div class="field-row">
              <div class="field">
                <label for="c-first">First Name <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
                <input type="text" id="c-first" name="firstName" autocomplete="given-name" required aria-describedby="c-first-error">
                <p class="error" id="c-first-error" role="alert"></p>
              </div>
              <div class="field">
                <label for="c-last">Last Name <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
                <input type="text" id="c-last" name="lastName" autocomplete="family-name" required aria-describedby="c-last-error">
                <p class="error" id="c-last-error" role="alert"></p>
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="c-email">Email Address <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
                <input type="email" id="c-email" name="email" autocomplete="email" required aria-describedby="c-email-error">
                <p class="error" id="c-email-error" role="alert"></p>
              </div>
              <div class="field">
                <label for="c-phone">Phone Number (optional)</label>
                <input type="tel" id="c-phone" name="phone" autocomplete="tel" aria-describedby="c-phone-error">
                <p class="error" id="c-phone-error" role="alert"></p>
              </div>
            </div>

            <div class="field">
              <label for="c-reason">Reason for Contacting <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
              <select id="c-reason" name="reason" required aria-describedby="c-reason-error">
                <option value="">Please choose</option>
                <option>General Inquiry</option>
                <option>Coaching Services</option>
                <option>Speaking Engagement</option>
                <option>Workshop / Group Session</option>
                <option>Academic or Career Support</option>
                <option>Books &amp; Resources</option>
                <option>Group &amp; Bulk Book Orders</option>
                <option>Collaboration / Partnership</option>
                <option>Privacy or Website Inquiry</option>
                <option>Other</option>
              </select>
              <p class="error" id="c-reason-error" role="alert"></p>
            </div>

            <div class="field" data-reveal="Other" hidden>
              <label for="c-reason-other">Please tell us more <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
              <span class="hint" id="c-reason-other-hint">A short note about what you need.</span>
              <input type="text" id="c-reason-other" name="reasonOther" aria-describedby="c-reason-other-hint c-reason-other-error">
              <p class="error" id="c-reason-other-error" role="alert"></p>
            </div>

            <div class="field">
              <label for="c-message">Message <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
              <textarea id="c-message" name="message" required aria-describedby="c-message-error"></textarea>
              <p class="error" id="c-message-error" role="alert"></p>
            </div>

            <div class="field" aria-hidden="true" style="position:absolute;left:-9999px">
              <label for="c-honey">Leave this field empty</label>
              <input type="text" id="c-honey" name="_honey" tabindex="-1" autocomplete="off">
            </div>

            <button class="btn btn-primary" type="submit">Send Message</button>
            <div class="form-status" data-status role="status" aria-live="polite"></div>
          </form>
        </div>
      </div>

      <aside class="contact-aside">
        <figure class="portrait portrait-couple">
          <img src="assets/photos/tayo-kemi-park.jpg"
               alt="Tayo and Kemi Akinyemi sitting together outdoors, smiling."
               width="1400" height="1866" loading="lazy">
        </figure>
        <div class="card">
          <h3>Prefer to Have a Conversation?</h3>
          <p>We’d love to connect with you! If you’d like to explore how our coaching services can support you, feel free to schedule a complimentary 20-minute consultation.</p>
          ${consultationLink("Schedule a Complimentary Consultation")}
        </div>
      </aside>
    </div>
  </div>
</section>
`
);

const consult = page(
  {
    page: "consult.html",
    title: "Complimentary 20-minute consultation | Zoe Life",
    description:
      "Schedule a complimentary 20-minute consultation with Zoe Life. Explore your coaching needs in a virtual conversation.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Let’s Connect!</p>
    <h1>A Complimentary 20-Minute Consultation</h1>
    <p class="lede">We’d love to hear from you and learn more about what you’re looking for. This complimentary consultation is an opportunity for us to connect, discuss your coaching needs and interests, and explore how Zoe Life may be able to support you.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="split split-copy-photo" style="align-items:start">
      <div>
        <h2>What to Expect</h2>
        <div class="consult-expectations">
          <div class="consult-expectation">${sectionIcon("conversation")}<h3>A Personal Conversation</h3><p>Share a little about yourself, what you’re looking for, and how we may be able to help.</p></div>
          <div class="consult-expectation">${sectionIcon("clock")}<h3>20 Minutes, Complimentary</h3><p>There is no charge for this initial consultation.</p></div>
          <div class="consult-expectation">${sectionIcon("video")}<h3>Convenient Virtual Meeting</h3><p>We’ll meet online, and you’ll receive the meeting details with your booking confirmation.</p></div>
        </div>
        <h2>Ready to Connect?</h2>
        ${bookingBlock()}
${CONFIG.paidBookingUrl ? `<div style="margin-top:2rem"><h3>Continue with a paid session</h3><p>View available sessions, pricing, and appointment details before booking.</p><div class="btn-row">${externalLink(CONFIG.paidBookingUrl, "btn-secondary", "View paid sessions")}</div></div>` : ''}
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-full.jpg"
             alt="Tayo and Kemi Akinyemi standing together outdoors, smiling."
             width="1600" height="2134" loading="lazy">
      </figure>
    </div>
  </div>
</section>
`
);

const resources = page(
  {
    page: "resources.html",
    title: "Resources | Zoe Life",
    description:
      "Watch our Zoe Family Life teaching on singleness, marriage, conflict, and faith, in short clips and full playlists.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Resources</p>
    <h1>Teaching from Zoe Family Life.</h1>
    <p class="lede">We talk about singleness, marriage, conflict, and faith in these clips and full series. The short clips have captions. Press play, or follow the link to watch the full video on YouTube.</p>
    ${categoryNav()}
  </div>
</section>

${categorySections()}

<section class="band-tan">
  <div class="wrap">
    <h2>Watch on YouTube.</h2>
    <p>These playlists are from the Zoe Family Life channel.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${escapeAttr(CONFIG.resources.channelUrl)}" target="_blank" rel="noopener noreferrer">Visit the Zoe Family Life YouTube channel<span class="visually-hidden">, opens in a new tab</span></a>
    </div>
  </div>
</section>
`
);

const courseCard = (track) => `<article class="course-card">
        <p class="eyebrow">Draft</p>
        <h2>${escapeAttr(track.title)}</h2>
        <p class="course-sub">${escapeAttr(track.subtitle)}</p>
        <p>${escapeAttr(track.audience)}</p>
        <ol class="module-names">
${track.modules.map((mod) => `          <li>${escapeAttr(mod.title)}</li>`).join("\n")}
        </ol>
        <p class="draft-note">Outline is a draft. Lessons are coming soon.</p>
        ${enrollOrBuy(track.slot, "Buy this track")}
        <p class="card-link"><a href="${track.page}">See the draft outline</a></p>
      </article>`;

const courses = page(
  {
    page: "courses.html",
    title: "Courses | Zoe Life",
    description:
      "See the courses we are preparing for singles, committed couples, and newlyweds. Explore the draft outlines and hear when enrollment opens.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Courses</p>
    <h1>Courses for the season you are in.</h1>
    <p class="lede">We are preparing three courses for singles and couples. You can explore the draft outlines below. Lessons and enrollment are coming soon.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="course-grid">
${COURSE_TRACKS.map(courseCard).join("\n")}
    </div>
  </div>
</section>

<section class="band-tan">
  <div class="wrap">
    <h2>${escapeAttr(COURSE_BUNDLE.title)}</h2>
    <p>${escapeAttr(COURSE_BUNDLE.note)}</p>
    ${enrollOrBuy(COURSE_BUNDLE.slot, "Buy the couples bundle")}
  </div>
</section>

<section>
  <div class="wrap">
    <h2>Hear when enrollment opens.</h2>
    <p>Join the mailing list if you want a note when a track is ready to buy.</p>
    <div class="form-card" style="max-width:32rem;margin-top:1.25rem">
${subscribeForm("courses", true)}
    </div>
  </div>
</section>
`
);

const courseTrackPage = (track) => {
  const pre = prefixOf(track.page);
  return page(
    {
      page: track.page,
      title: `${track.title} | Zoe Life Courses`,
      description: track.description,
    },
    `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Draft outline</p>
    <h1>${escapeAttr(track.title)}</h1>
    <p class="lede">${escapeAttr(track.subtitle)}. ${escapeAttr(track.audience)}</p>
    <!-- TODO(client): Approve course outline and confirm enrollment availability, including the lesson drawn from our years of marriage. -->
    <p class="draft-note">We are still preparing this course. The outline below is a draft; lessons and enrollment are coming soon.</p>
  </div>
</section>

<section>
  <div class="wrap">
${track.modules
  .map(
    (mod, index) => `<article class="module-block">
      <h2>Module ${index + 1}: ${escapeAttr(mod.title)}</h2>
      <ul class="lesson-list">
${mod.lessons.map((lesson) => `        <li>${escapeAttr(lesson)}</li>`).join("\n")}
      </ul>
    </article>`
  )
  .join("\n")}
    ${enrollOrBuy(track.slot, "Buy this track")}
    <p>Have a question about a course? Send us a message and choose Course access on the form.</p>
    <p class="card-link"><a href="${pre}contact.html#message">Send a message</a></p>
    <p class="card-link"><a href="${pre}courses.html">Back to all courses</a></p>
    <div class="form-card" style="max-width:32rem;margin-top:1.5rem">
      <h2>Hear when enrollment opens.</h2>
${subscribeForm(`track-${track.id}`, false)}
    </div>
  </div>
</section>
`
  );
};

const courseWelcome = page(
  {
    page: "courses/welcome.html",
    title: "Course welcome | Zoe Life",
    description:
      "Course enrollment is not open yet. Find the latest course information or contact us about access.",
    noindex: true,
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Courses</p>
    <h1>Course welcome.</h1>
    <p class="lede" id="welcome-note">Enrollment is not open yet. Visit our Courses page for the latest information.</p>
    <p>If you have a question about a payment or access, <a href="../contact.html#message">send us a message</a>. Keep your receipt so we can help.</p>
    <p class="card-link"><a href="../courses.html">Back to courses</a></p>
  </div>
</section>
<script>
(function () {
  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get("session_id");
  var note = document.getElementById("welcome-note");
  if (!note || !sessionId) return;
  note.textContent = "This page cannot confirm your payment or give you course access. Please keep your receipt and contact us if you need help.";
})();
</script>
`
);

const partner = page(
  {
    page: "partner.html",
    title: "Partner with Zoe Life",
    description:
      "Help us keep sharing biblical teaching and practical resources. Learn about partnership with Zoe Life.",
  },
  `
<section class="page-hero"><div class="wrap">
<p class="eyebrow">Partnership &amp; Collaboration</p>
<h1>Partner with Zoe Life</h1>
<p>We believe that meaningful partnerships create opportunities to encourage, equip, and positively impact more lives.</p>
        <p>At Zoe Life, we welcome opportunities to connect and collaborate with individuals, churches, ministries, organizations, and others who share our passion for helping people grow in faith, strengthen relationships, develop personally, and thrive in every season of life.</p>
        <p>Whether you’re interested in working together on an initiative, inviting us to contribute to an event, sharing our resources with others, or exploring another opportunity for collaboration, we’d love to hear from you.</p>
</div></section>

<section><div class="wrap">
<h2>Ways We Can Partner</h2><div class="grid grid-2 partnership-grid"><article class="card">${sectionIcon("collaboration")}<h3>Collaborations &amp; Joint Initiatives</h3><p>Explore opportunities to work together on projects, programs, and initiatives that encourage personal growth, strengthen relationships, and support individuals and families.</p></article><article class="card">${sectionIcon("microphone")}<h3>Speaking Engagements &amp; Workshops</h3><p>Invite us to contribute to conferences, workshops, group sessions, or other events focused on faith, marriage, family life, personal development, education, and related topics.</p></article><article class="card">${sectionIcon("book")}<h3>Books &amp; Resource Partnerships</h3><p>Explore opportunities to share our books, devotionals, journals, and other resources with churches, groups, organizations, and communities.</p></article><article class="card">${sectionIcon("hands")}<h3>Supporting Zoe Life Initiatives</h3><p>We welcome opportunities to connect with individuals and organizations interested in sponsoring, contributing resources to, or otherwise supporting initiatives that align with Zoe Life’s mission.</p><div class="support-disclosure"><h4>Important Information About Financial Support</h4><p>Zoe Life LLC is not a 501(c)(3) tax-exempt nonprofit organization. Financial contributions or sponsorships made to Zoe Life are not tax-deductible charitable donations.</p></div></article></div>
</div></section>

<section class="band-tan"><div class="wrap">
<p class="eyebrow">LET’S CONNECT</p>
<h2>Let’s Explore Opportunities Together!</h2><p>We’d love to hear your ideas and explore how we might work together. If you’re interested in partnering or collaborating with Zoe Life, please send us a message and tell us a little about what you have in mind.</p><div class="btn-row"><a class="btn btn-primary" href="contact.html?reason=Collaboration%20%2F%20Partnership#message">Send a Partnership Inquiry</a></div>
</div></section>
`
);

// Blog topics follow the order of the video series on the Videos page.
const TOPIC_ORDER = ["Singles", "Dating", "Marriage", "Conflict", "Faith"];
const BLOG_TOPICS = [...new Set(POSTS.map((post) => post.category))]
  .sort((a, b) => {
    const rank = (name) => (TOPIC_ORDER.includes(name) ? TOPIC_ORDER.indexOf(name) : TOPIC_ORDER.length);
    return rank(a) - rank(b) || a.localeCompare(b);
  })
  .map((name) => ({ name, id: `topic-${slugify(name)}`, posts: POSTS.filter((post) => post.category === name) }));

const blog = page(
  {
    page: "blog.html",
    title: "Blog | Zoe Life",
    description:
      "We share what Scripture teaches about marriage, dating, and everyday life, with practical guidance for singles and couples.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Blog</p>
    <h1>Wisdom for every season of life.</h1>
    <p class="lede">We write about marriage, singleness, dating, conflict, and faith. Our aim is to help you put Scripture into practice in your own life.</p>
    ${BLOG_TOPICS.length > 1 ? `<nav class="category-nav" aria-label="Blog topics">
          ${BLOG_TOPICS.map((topic) => `<a href="#${topic.id}">${escapeAttr(topic.name)}</a>`).join("\n          ")}
        </nav>` : ""}
  </div>
</section>

${BLOG_TOPICS.length > 1
  ? BLOG_TOPICS.map((topic) => `<section class="blog-topic" id="${topic.id}">
  <div class="wrap">
    <h2>${escapeAttr(topic.name)}</h2>
    <div class="card-grid">
${topic.posts.map((post) => postCard(post, "h3", "", post.series || post.category)).join("\n")}
    </div>
  </div>
</section>`).join("\n")
  : `<section>
  <div class="wrap">
    <div class="card-grid">
${POSTS.map((post) => postCard(post, "h2", "")).join("\n")}
    </div>
    ${POSTS.length ? "" : "<p>New articles are on the way. Check back soon.</p>"}
  </div>
</section>`}

<section class="band-tan">
  <div class="wrap">
    <h2>Watch the teaching.</h2>
    <p>Many articles grow out of a video series. The full series and short clips are on the Videos page.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="resources.html">Watch the series</a>
      <a class="btn btn-secondary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
    </div>
  </div>
</section>
`
);

// Publisher-required credit lines, one per translation a post quotes.
const SCRIPTURE_NOTICES = {
  ESV:
    "Scripture quotations marked ESV are from the ESV&reg; Bible (The Holy Bible, English Standard Version&reg;), " +
    "copyright &copy; 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.",
  NKJV:
    "Scripture quotations marked NKJV are taken from the New King James Version&reg;. " +
    "Copyright &copy; 1982 by Thomas Nelson. Used by permission. All rights reserved.",
  NLT:
    "Scripture quotations marked NLT are taken from the Holy Bible, New Living Translation, copyright &copy; 1996, 2004, 2015 " +
    "by Tyndale House Foundation. Used by permission of Tyndale House Publishers, Carol Stream, Illinois 60188. All rights reserved.",
  KJV: "Scripture quotations marked KJV are from the King James Version, which is in the public domain.",
};

const jsonLd = (data) =>
  `\n<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const postAuthors = (author) =>
  /Tayo/.test(author) && /Kemi/.test(author)
    ? ["Tayo Akinyemi", "Kemi Akinyemi"].map((name) => ({
        "@type": "Person",
        name,
        url: `${CONFIG.siteUrl.replace(/\/$/, "")}/about#meet`,
      }))
    : { "@type": "Organization", name: "Zoe Life" };

const ARTICLE_REVIEW = {
  "recipes-for-a-blessed-marriage": "Kemi to approve the rewritten Recipes article against the original teaching.",
  "preparing-for-marriage-while-single": "Confirm the source for Mary's estimated age; Scripture does not state her age.",
  "after-you-meet-the-right-one": "Confirm the personal anecdote about the woman and the man's death before publication.",
};
const postPage = (post) => {
  const pre = prefixOf(post.page);
  const base = CONFIG.siteUrl.replace(/\/$/, "");
  const playlist = post.playlist
    ? CONFIG.resources.playlists.find((item) => item.id === post.playlist)
    : null;
  if (post.playlist && !playlist) throw new Error(`${post.page}: playlist ${post.playlist} is not on the Resources page`);
  for (const translation of post.translations) {
    if (!SCRIPTURE_NOTICES[translation]) throw new Error(`${post.page}: add a Scripture notice for ${translation} to tools/build.mjs`);
  }
  const notices = post.translations.map((translation) => SCRIPTURE_NOTICES[translation]);
  // Related reading: same topic first, then the newest of the rest.
  const others = [
    ...POSTS.filter((other) => other !== post && other.category === post.category),
    ...POSTS.filter((other) => other !== post && other.category !== post.category),
  ].slice(0, 2);
  const watchTitle = playlist ? playlist.title : "the teaching series";

  return page(
    {
      page: post.page,
      title: `${escapeAttr(post.title)} | Zoe Life`,
      description: escapeAttr(post.description),
      ogType: "article",
      extraHead:
        `\n<meta property="article:published_time" content="${post.date}">` +
        `\n<meta property="article:section" content="${escapeAttr(post.category)}">` +
        jsonLd({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          dateModified: post.date,
          articleSection: post.category,
          wordCount: post.words,
          inLanguage: "en",
          mainEntityOfPage: canonicalFor(post.page),
          image: `${base}/assets/photos/tayo-kemi-about.jpg`,
          author: postAuthors(post.author),
          publisher: {
            "@type": "Organization",
            name: "Zoe Life",
            url: `${base}/`,
            logo: { "@type": "ImageObject", url: `${base}/assets/brand/zoe-life-mark.png` },
          },
        }),
    },
    `
<article class="post">
  <div class="page-hero post-hero">
    <div class="wrap">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${pre}blog.html">Blog</a> <span aria-hidden="true">/</span> <span>${escapeAttr(post.category)}</span>
      </nav>
      <h1>${escapeAttr(post.title)}</h1>
      <p class="post-meta">By ${escapeAttr(post.author)} <span aria-hidden="true">&middot;</span> <time datetime="${post.date}">${post.dateLabel}</time> <span aria-hidden="true">&middot;</span> ${post.minutes} min read</p>
    </div>
  </div>

  <div class="wrap post-layout">
    ${post.toc.length > 2 ? `<nav class="post-toc" aria-label="In this article">
      <p class="post-toc-title">In this article</p>
      <ul>
${post.toc.map((item) => `        <li><a href="#${item.id}">${escapeAttr(item.text)}</a></li>`).join("\n")}
      </ul>
    </nav>` : ""}
    <div class="prose">
${ARTICLE_REVIEW[post.slug] ? `<!-- TODO(client): ${ARTICLE_REVIEW[post.slug]} -->` : ""}
${post.html}
${notices.map((notice) => `<p class="scripture-notice">${notice}</p>`).join("\n")}
      <p class="card-link post-back"><a href="${pre}blog.html">Back to all articles</a></p>
    </div>
  </div>
</article>

<section class="band-tan">
  <div class="wrap">
    <p class="eyebrow">${post.series ? escapeAttr(post.series) : "Keep going"}</p>
    <h2>Watch our ${escapeAttr(watchTitle)} series.</h2>
    <p>The full series is on the Videos page, alongside short clips on marriage, conflict, and singleness. Questions about your own season? Send us a message.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${pre}resources.html${playlist ? `#${playlist.id}` : ""}">Watch the series</a>
      <a class="btn btn-secondary" href="${pre}${MESSAGE_HREF}">${MESSAGE_CTA}</a>
    </div>
  </div>
</section>
${others.length ? `
<section>
  <div class="wrap">
    <h2>More from the blog</h2>
    <div class="card-grid">
${others.map((other) => postCard(other, "h3", pre)).join("\n")}
    </div>
  </div>
</section>` : ""}
`
  );
};

const moved = (fromPage, title, destHref, destLabel, description) =>
  page(
    { page: fromPage, title, description },
    `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Updated</p>
    <h1>This page has a new home.</h1>
    <p class="lede">What you are looking for now lives at ${destLabel}.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${destHref}">Go to ${destLabel}</a>
    </div>
  </div>
</section>
`
  );

/* ------------------------------------------------------------------ emit -- */

const resourcesOverview = page(
  {page:"resources-overview.html",title:"Explore Resources | Zoe Life",description:"Find Zoe Life books, biblical articles, and video teachings for everyday life."},
  `<section class="page-hero"><div class="wrap">
<p class="eyebrow">Zoe Life</p>
<h1>Explore Resources</h1>
</div></section>
<section><div class="wrap">
<div class="card-grid"><article class="card"><h2>Books</h2><p>Devotionals, journals, and other publications.</p><p class="card-link"><a href="books.html">Explore Books</a></p></article><article class="card"><h2>Articles</h2><p>Biblical insights, encouragement, and practical guidance for everyday life.</p><p class="card-link"><a href="blog.html">Explore Articles</a></p></article><article class="card"><h2>Videos</h2><p>Teachings, conversations, and video series.</p><p class="card-link"><a href="resources.html">Explore Videos</a></p></article></div>
</div></section>`
);

const PAGES = {
  "index.html": home,
  ...Object.fromEntries([["privacy.html","Privacy Policy"],["terms.html","Terms &amp; Conditions"]].map(([file,title]) => [file,page({page:file,title,description:"Zoe Life LLC",noindex:true}, `<section><div class="wrap legal-copy"><h1>${title}</h1>${file === "privacy.html" ? `<p>Zoe Life LLC</p>
<p>Effective Date: November 6, 2026</p>
<p>At Zoe Life LLC, we value your trust and respect your privacy. We are committed to handling the personal information you share with us responsibly and with care.</p>
<p>This Privacy Policy explains how Zoe Life LLC (“Zoe Life,” “we,” “us,” or “our”) collects, uses, shares, and protects personal information when you visit our website, www.zoelifehub.com, contact us, subscribe to our communications, purchase our products, or engage with our services.</p>
<h2>1. Information We Collect</h2>
<p>Depending on how you interact with Zoe Life, we may collect the following information:</p>
<p>Contact Information: Your name, email address, phone number, and other contact details you voluntarily provide.</p>
<p>Coaching and Consultation Information: Information you provide when requesting a consultation, completing an inquiry form, scheduling a session, or participating in our coaching services.</p>
<p>Purchase Information: Information related to purchases of books, digital resources, and other products or services. Payments may be processed through third-party payment providers.</p>
<p>Newsletter Information: Your email address and subscription preferences when you sign up to receive communications from Zoe Life.</p>
<p>Website Usage Information: Technical information such as browser type, device information, pages visited, and other usage data that may be collected through cookies or website analytics tools.</p>
<h2>2. How We Use Your Information</h2>
<p>We may use the information we collect to:</p>
<p>Respond to questions, inquiries, and requests.</p>
<p>Schedule consultations and coaching sessions.</p>
<p>Provide coaching, educational resources, and other services.</p>
<p>Process purchases and communicate about orders.</p>
<p>Send newsletters, encouragement, helpful resources, announcements, and updates when you have subscribed.</p>
<p>Improve our website, products, resources, and services.</p>
<p>Maintain appropriate business records and comply with applicable legal obligations.</p>
<p>We do not sell your personal information to third-party marketers.</p>
<h2>3. Coaching Information and Confidentiality</h2>
<p>We recognize that individuals, couples, and families may share personal or sensitive information when seeking coaching, encouragement, or guidance.</p>
<p>We seek to handle such information with care, discretion, and respect for your privacy.</p>
<p>Information shared through coaching inquiries and services is handled in accordance with our applicable coaching agreements and privacy practices. Confidentiality may be subject to legal obligations, safety considerations, and other exceptions described in the relevant coaching agreement.</p>
<p>We encourage visitors not to submit highly sensitive personal information through general website contact forms.</p>
<h2>4. Third-Party Service Providers</h2>
<p>We may use third-party service providers to support our website and business operations, including:</p>
<p>Website hosting and maintenance.</p>
<p>Appointment scheduling and virtual meetings.</p>
<p>Payment processing.</p>
<p>Email communications and newsletter management.</p>
<p>Product sales and digital resource delivery.</p>
<p>Website analytics and security.</p>
<p>These providers may process information as necessary to deliver their services, subject to their own privacy policies and applicable agreements.</p>
<p>We encourage you to review the privacy policies of third-party platforms when using their services.</p>
<h2>5. Email Communications</h2>
<p>If you subscribe to our mailing list, we may send you encouragement, helpful resources, announcements, and updates about Zoe Life’s books, services, events, and other offerings.</p>
<p>You may unsubscribe from our emails at any time using the unsubscribe link provided in our emails or by contacting us through the <a href="contact.html?reason=Privacy%20or%20Website%20Inquiry#message">Contact Us form</a> on our website.</p>
<h2>6. Cookies and Website Analytics</h2>
<p>Our website may use cookies and similar technologies to support website functionality, understand visitor interactions, and improve the user experience.</p>
<p>Depending on the technologies used, cookies may help us remember preferences, monitor website performance, or understand how visitors use our website.</p>
<p>Where applicable, visitors may be able to manage cookie preferences through their browser settings or available website controls.</p>
<h2>7. Information Security</h2>
<p>We take reasonable steps to protect personal information against unauthorized access, misuse, loss, or disclosure.</p>
<p>However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
<h2>8. Data Retention</h2>
<p>We retain personal information for as long as reasonably necessary to provide our services, maintain appropriate business records, fulfill the purposes described in this policy, and comply with applicable legal obligations.</p>
<h2>9. Your Privacy Choices</h2>
<p>You may contact us to request access to, correction of, or deletion of personal information we maintain about you, subject to applicable laws and legitimate business or legal requirements.</p>
<p>You may also unsubscribe from our emails at any time.</p>
<p>To make a privacy-related request, please use the <a href="contact.html?reason=Privacy%20or%20Website%20Inquiry#message">Contact Us form</a> on our website.</p>
<h2>10. Children’s Privacy</h2>
<p>Our website is intended primarily for adults, including parents and guardians seeking resources for themselves and their families.</p>
<p>We do not knowingly collect personal information directly from children under the age of 13 through our website without appropriate parental consent.</p>
<p>If you believe a child has provided personal information to us without appropriate authorization, please contact us so that we can review the situation and take appropriate action.</p>
<h2>11. External Websites</h2>
<p>Our website may contain links to third-party websites, including social media platforms, retailers, and scheduling or payment services.</p>
<p>We are not responsible for the privacy practices or content of websites that we do not operate.</p>
<p>We encourage visitors to review the privacy policies of external websites before sharing personal information.</p>
<h2>12. Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy periodically to reflect changes in our services, website practices, or legal requirements.</p>
<p>Any updates will be posted on this page with a revised effective date.</p>
<h2>13. Contact Us</h2>
<p>If you have questions about this Privacy Policy or how we handle personal information, please reach out through the <a href="contact.html#message">Contact Us form</a> on our website.</p>
<p>Zoe Life LLC</p>
<p>Aurora, Illinois, United States</p>
<p>Website: www.zoelifehub.com</p>` : `<p>Zoe Life LLC</p>
<p>Effective Date: November 6, 2026</p>
<p>Welcome to Zoe Life!</p>
<p>We are glad you are here. Zoe Life LLC provides faith-based and practical coaching, educational materials, books, digital resources, and other services designed to encourage, equip, and empower individuals, couples, and families.</p>
<p>These Terms &amp; Conditions explain the general terms governing your use of our website, www.zoelifehub.com, and the content and services available through it.</p>
<p>By accessing or using our website, you agree to these Terms &amp; Conditions. If you do not agree, please discontinue use of the website.</p>
<h2>1. About Zoe Life</h2>
<p>Zoe Life LLC is an Illinois-based organization offering faith-based and practical guidance, coaching, educational resources, publishing, and related services.</p>
<p>Our goal is to support personal growth, strengthen relationships, encourage faith, and help individuals and families navigate life’s opportunities and challenges.</p>
<p>Our offerings may include coaching sessions, consultations, books, journals, devotionals, workbooks, digital resources, speaking engagements, and educational programs.</p>
<h2>2. Faith-Based Content and Guidance</h2>
<p>Our content and services are informed by biblical principles and practical wisdom.</p>
<p>We seek to provide encouragement, guidance, and resources that individuals and families can thoughtfully apply to their lives.</p>
<p>Visitors and clients are responsible for their own decisions, actions, and circumstances. Our content is provided for educational, informational, and personal development purposes.</p>
<h2>3. Coaching Services</h2>
<p>Zoe Life offers coaching and guidance in areas that may include personal growth, relationships, marriage, parenting, family life, education, and career development.</p>
<p>Coaching is intended to provide encouragement, perspective, practical guidance, and support for personal growth and decision-making.</p>
<p>Coaching is not a substitute for licensed mental health treatment, psychotherapy, medical care, legal advice, or regulated financial services.</p>
<p>Our coaching services do not establish a therapist-patient, attorney-client, or other licensed professional relationship.</p>
<p>Clients engaging in coaching services may be required to review and accept a separate coaching agreement addressing the specific terms of their engagement.</p>
<p>Where a separate signed coaching agreement applies, its provisions will govern the coaching engagement in the event of a conflict with these general website terms.</p>
<h2>4. Consultations, Appointments, and Payments</h2>
<p>Certain consultations may be offered on a complimentary basis, while other coaching sessions and services require payment.</p>
<p>Information regarding appointment availability, session duration, fees, and booking procedures will be provided through our scheduling platform or directly by Zoe Life.</p>
<p>Payment, cancellation, rescheduling, and refund arrangements for coaching services will be governed by the terms communicated at booking and any applicable coaching agreement.</p>
<p>We reserve the right to decline or discontinue services when appropriate, subject to applicable agreements and legal obligations.</p>
<h2>5. Books, Digital Products, and Educational Resources</h2>
<p>Zoe Life may offer printed books, devotionals, journals, workbooks, downloadable resources, and other educational materials.</p>
<p>Products may be available through our website or third-party marketplaces and retailers.</p>
<p>Prices, availability, delivery methods, and applicable purchase terms may vary by product or sales platform.</p>
<p>Refunds, returns, cancellations, and digital product access are governed by the policies disclosed at the point of purchase and any applicable consumer protection laws.</p>
<p>Purchases made through third-party platforms may also be subject to those platforms’ terms and policies.</p>
<h2>6. Intellectual Property</h2>
<p>Unless otherwise stated, the original content published by Zoe Life, including written materials, books, workbooks, graphics, branding, videos, and digital resources, is owned by Zoe Life LLC or used with appropriate authorization.</p>
<p>Content is protected by applicable intellectual property laws.</p>
<p>You may access and use website content for lawful personal, noncommercial purposes.</p>
<p>You may not reproduce, redistribute, resell, republish, or commercially exploit our original materials without prior written permission, except as permitted by law or by the specific license accompanying a purchased product.</p>
<p>Purchasing a resource does not transfer ownership of its intellectual property rights.</p>
<h2>7. Appropriate Website Use</h2>
<p>You agree to use our website lawfully and respectfully.</p>
<p>You may not:</p>
<ul><li>Use the website for fraudulent, unlawful, or harmful purposes.</li><li>Attempt to gain unauthorized access to our website or systems.</li><li>Interfere with the operation or security of the website.</li><li>Misuse our content, intellectual property, or services.</li><li>Submit intentionally false, misleading, or abusive communications.</li></ul>
<p>We reserve the right to restrict access where reasonably necessary to protect our website, services, or users.</p>
<h2>8. No Guarantee of Specific Results</h2>
<p>We are committed to providing thoughtful, valuable, and practical resources and services.</p>
<p>However, personal growth, relationships, marriage, family life, education, career development, and other areas of life involve individual circumstances and decisions.</p>
<p>We do not guarantee specific outcomes from using our website, resources, coaching services, or educational materials.</p>
<p>Testimonials and personal experiences shared through Zoe Life reflect individual experiences and should not be interpreted as guarantees of similar results.</p>
<h2>9. External Links and Third-Party Services</h2>
<p>Our website may include links to third-party websites, retailers, payment processors, social media platforms, and scheduling services.</p>
<p>These services are operated independently and may have their own terms, privacy policies, and procedures.</p>
<p>We are not responsible for third-party content, policies, or services outside our control.</p>
<h2>10. Privacy</h2>
<p>Your use of our website is also subject to our <a href="privacy.html">Privacy Policy</a>, which explains how we collect, use, and protect personal information.</p>
<p>Please review the <a href="privacy.html">Privacy Policy</a> for additional information.</p>
<h2>11. Disclaimer and Limitation of Liability</h2>
<p>Our website content and general educational resources are provided for informational and educational purposes.</p>
<p>We make reasonable efforts to keep website information accurate and current, but we do not guarantee that all content will always be complete, error-free, or uninterrupted.</p>
<p>To the extent permitted by applicable law, Zoe Life LLC is not liable for losses or damages arising solely from reliance on general website information or from circumstances beyond our reasonable control.</p>
<p>Nothing in these Terms &amp; Conditions excludes or limits liability that cannot legally be excluded or limited.</p>
<h2>12. Changes to These Terms</h2>
<p>We may update these Terms &amp; Conditions periodically to reflect changes in our website, offerings, or applicable legal requirements.</p>
<p>The updated terms will be posted on this page with a revised effective date.</p>
<p>Changes to existing paid coaching engagements will remain subject to applicable agreements and legal requirements.</p>
<h2>13. Governing Law</h2>
<p>These Terms &amp; Conditions are governed by the laws of the State of Illinois, United States, except where applicable law requires otherwise.</p>
<h2>14. Contact Us</h2>
<p>If you have questions about these Terms &amp; Conditions, please reach out through the <a href="contact.html#message">Contact Us form</a> on our website.</p>
<p>Zoe Life LLC<br>
Aurora, Illinois, United States<br>
Website: www.zoelifehub.com</p>`}</div></section>`)])),
  "articles-videos.html": page({page:"articles-videos.html",title:"Articles &amp; Videos | Zoe Life",description:"Browse Zoe Life articles and video series."}, `<section><div class="wrap"><h1>Articles &amp; Videos</h1><div class="btn-row"><a class="btn btn-primary" href="blog.html">Browse Articles</a><a class="btn btn-secondary" href="resources.html">Browse Videos</a></div></div></section>`),
  "about.html": about,
  "books.html": books,
  "resources.html": resources,
  "resources-overview.html": resourcesOverview,
  "blog.html": blog,
  ...Object.fromEntries(POSTS.map((post) => [post.page, postPage(post)])),
  "courses.html": courses,
  ...Object.fromEntries(COURSE_TRACKS.map((track) => [track.page, courseTrackPage(track)])),
  "courses/welcome.html": courseWelcome,
  "connect.html": connect,
  "partner.html": partner,
  "contact.html": contact,
  "consult.html": consult,
  "family-life.html": moved(
    "family-life.html",
    "Family Life moved | Zoe Life",
    "connect.html",
    "Connect",
    "Zoe Family Life now lives on the Connect page, under Zoe Life."
  ),
  "appointments.html": moved(
    "appointments.html",
    "Appointments moved | Zoe Life",
    "consult.html",
    "the consultation page",
    "Complimentary consultations are now booked from the consultation page."
  ),
};

mkdirSync(ROOT, { recursive: true });
const wrote = (name, body) => {
  const dest = join(ROOT, name);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body, "utf8");
  console.log(`wrote ${name.padEnd(28)} ${String(body.length).padStart(6)} bytes`);
};

// A post removed from content/blog must not linger as a published page.
const blogDir = join(ROOT, "blog");
if (existsSync(blogDir)) {
  for (const name of readdirSync(blogDir)) {
    if (name.endsWith(".html") && !PAGES[`blog/${name}`]) {
      rmSync(join(blogDir, name));
      console.log(`removed blog/${name} (no longer in content/blog)`);
    }
  }
}

// Keep draft course templates in source. Direct URLs on the legacy branch host must
// not reveal their outlines either. Course previews are for local review only.
const previewCourses = process.argv.includes("--preview-courses") && STAGING;
for (const [name, html] of Object.entries(PAGES)) {
  const draft = name === "courses.html" || name.startsWith("courses/");
  wrote(name, draft && !previewCourses ? page({page:name,title:"Page unavailable | Zoe Life",description:"Return to Zoe Life.",noindex:true},
    `<section><div class="wrap"><h1>Page unavailable</h1><a class="btn btn-secondary" href="${prefixOf(name)}index.html">Return to Zoe Life</a></div></section>`) : html);
}

wrote(
  "js/config.js",
  `/* Generated by tools/build.mjs. Do not edit by hand. */\n` +
    `window.ZOE_CONFIG = ${JSON.stringify(
      {
        formEndpoint: CONFIG.formEndpoint,
        newsletterEndpoint: CONFIG.newsletterEndpoint,
        bookingUrl: CONFIG.bookingUrl,
        paidBookingUrl: CONFIG.paidBookingUrl,
        coursesUrl: CONFIG.coursesUrl,
        courses: previewCourses ? CONFIG.courses : Object.fromEntries(Object.keys(CONFIG.courses).map(key => [key,null])),
        giving: CONFIG.giving,
        payments: CONFIG.payments,
        resources: CONFIG.resources,
      },
      null,
      2
    )};\n`
);

wrote(
  "favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#F8F4ED"/>
  <circle cx="16" cy="16" r="11.5" fill="none" stroke="#C6A15B" stroke-width="1.6"/>
  <path d="M16 22c-3.2 0-5.6-2.4-5.6-5.6C10.4 12.6 13.6 9.6 16 8c2.4 1.6 5.6 4.6 5.6 8.4 0 3.2-2.4 5.6-5.6 5.6z" fill="#526B58"/>
  <path d="M16 9.5v12" stroke="#F8F4ED" stroke-width="1.1" stroke-linecap="round"/>
</svg>\n`
);

const base = CONFIG.siteUrl.replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);
const sitemapPages = [
  "index.html",
  "about.html",
  "books.html",
  "resources.html",
  "resources-overview.html",
  "blog.html",
  ...POSTS.map((post) => post.page),
  "articles-videos.html",
  "connect.html",
  "partner.html",
  "contact.html",
  "consult.html",
];
const sitemapAssets = ALL_CLIPS.flatMap((clip) => [
  `assets/clips/${clip.file}.mp4`,
  `assets/clips/${clip.file}.jpg`,
]);
wrote(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    [...sitemapPages.map((p) => ({ loc: canonicalFor(p), priority: p === "index.html" ? "1.0" : "0.8" })),
      ...sitemapAssets.map((asset) => ({ loc: `${base}/${asset}`, priority: "0.3" }))]
      .map(
        (item) =>
          `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <priority>${item.priority}</priority>\n  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`
);
wrote(
  "robots.txt",
  CONFIG.staging
    ? `# Staging build. Not the canonical site.\nUser-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`
);

wrote(
  "404.html",
  page(
    {
      page: "404.html",
      title: "Page not found | Zoe Life",
      description: "That page could not be found. Find Zoe Life resources, about, and contact here.",
    },
    `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">404</p>
    <h1>We could not find that page.</h1>
    <p class="lede">We could not find the page you were looking for. It may have been renamed, or the link may be out of date.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="index.html">Back to the home page</a>
      <a class="btn btn-secondary" href="contact.html">Contact Zoe Life</a>
    </div>
  </div>
</section>
`
  )
);

console.log(
  `\n${Object.keys(PAGES).length} pages + 404, sitemap, robots, favicon, config built.` +
    `\nmode: ${CONFIG.staging ? "STAGING (noindex, robots disallow)" : "PRODUCTION (indexable)"}` +
    `\nsite: ${base}` +
    `\nform endpoint:       ${CONFIG.formEndpoint || "not set (form fails closed)"}` +
    `\nnewsletter endpoint: ${CONFIG.newsletterEndpoint || "not set (signup fails closed)"}` +
    `\nbooking url:         ${CONFIG.bookingUrl || "not set (GOOGLE_CALENDAR_BOOKING_URL placeholder)"}` +
    `\npayments:            ${
      Object.values(CONFIG.payments).some((p) => Object.values(p).some(Boolean))
        ? "checkout links configured"
        : "purchase options coming"
    }` +
    `\ncourses:             ${
      courseStripeUrls.some(Boolean) ? "payment links configured" : "enrollment opens soon (no buy links)"
    }` +
    `\ngiving:              ${
      CONFIG.giving.stripe || CONFIG.giving.paypal ? "partnership links configured" : "hidden until links are set"
    }`
);
