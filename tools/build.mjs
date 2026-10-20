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
const MISSION =
  "We share what Scripture teaches about everyday life, from the relationships at home " +
  "to the decisions we make at work. We want to help you put that teaching into practice.";
const MESSAGE_CTA = "Send a message";
const MESSAGE_HREF = "contact.html#message";
const CONSULT_CTA = "Schedule a complimentary 20-minute consultation";
const CONSULT_HREF = "consult.html";
const SUBSCRIBE_INTRO =
  "Subscribe to receive encouragement, updates, and helpful resources from Zoe Life.";
const CONSENT_JOIN = "I agree to join Zoe Life's mailing list and can unsubscribe at any time.";
const CONSENT = workspaceEndpoint(CONFIG.newsletterEndpoint)
  ? `${CONSENT_JOIN} We will email you a link to confirm.`
  : CONSENT_JOIN;

const BOOKS_INTRO =
  "We wrote these books to help you notice God's goodness and make thanksgiving part of your day. " +
  "You can use them on your own or alongside your Bible reading and prayer.";

const DEVOTIONAL_SUB = "Cultivating a Lifestyle of Thanksgiving to God";
const JOURNAL_SUB = "Cultivating a Lifestyle of Thanksgiving to God";

const DEVOTIONAL_BLURB = [
  "Gratitude begins with remembering who God is and what He has done. We want to help you make that a daily practice.",
  "Over seven days, this devotional takes you through Scripture with questions to reflect on, prayers, and practical ways to give thanks.",
  "Read a day at a time, and take a few minutes to remember God's faithfulness in your own life.",
];

const JOURNAL_BLURB = [
  "It is easy to forget the ways God has helped us. Writing them down gives us something to return to.",
  "This journal gives you 100 days of space to record what you are thankful for and how God has been faithful.",
  "Use it with your Bible reading or prayer time. As you fill the pages, you will have a record of answered prayers and everyday blessings to look back on.",
];

const COLLECTION_COPY = [
  "You can begin with the devotional, then keep writing in the journal. Each book also works on its own, so start with whichever helps you most.",
];

const COMING_SOON =
  "We are working on more books and practical resources to share with you.";

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
      ["blog.html", "Blog", "Articles on marriage, dating, and faith"],
      ["resources.html", "Videos", "Teaching clips and full series"],
      ["books.html", "Books", "Gratitude devotional and journal"],
      ["courses.html", "Courses", "Tracks for singles and couples"],
    ],
  },
  {
    id: "connect",
    label: "Connect",
    items: [
      ["connect.html", "Follow along", "Our socials and Zoe Family Life"],
      ["partner.html", "Partner", "Support the work of Zoe Life"],
      ["contact.html", "Contact", "Send us a message"],
    ],
  },
];

const FOOTER_NAV = [
  ["Explore", [
    ["index.html", "Home"],
    ["about.html", "About"],
    ["blog.html", "Blog"],
    ["resources.html", "Videos"],
    ["books.html", "Books"],
    ["courses.html", "Courses"],
  ]],
  ["Connect", [
    ["connect.html", "Follow along"],
    [MESSAGE_HREF, MESSAGE_CTA],
    [CONSULT_HREF, "Complimentary consultation"],
    ["partner.html", "Partner"],
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

const payButtons = (book) => {
  const p = CONFIG.payments[book];
  const buttons = [];
  if (p.stripe) {
    buttons.push(
      externalLink(p.stripe, "btn-primary", stripeTestLink(p.stripe) ? "Test Stripe checkout" : "Pay with Stripe")
    );
  }
  if (p.paypal) {
    buttons.push(externalLink(p.paypal, "btn-secondary", "Pay with PayPal"));
  }
  for (const [provider, label] of [['amazon', 'Amazon'], ['etsy', 'Etsy'], ['gumroad', 'Gumroad']]) {
    if (p[provider]) buttons.push(externalLink(p[provider], "btn-secondary", `Buy on ${label}`));
  }
  if (!buttons.length) {
    return `<p class="purchase-coming">Purchase options coming. Stripe and PayPal checkout will appear here once Zoe Life publishes live payment links. Printed copies will be fulfilled by a print-on-demand partner. Zoe Life is not packing and shipping orders from home.</p>`;
  }
  return `<div class="pay-row">${buttons.join("")}</div>
        <p class="format-meta">${stripeTestLink(p.stripe) ? 'Sandbox test only. No real payment or book delivery.' : 'Printed copies, when offered, will be fulfilled by a print-on-demand partner.'}</p>`;
};

const givingBlock = () => {
  const buttons = [];
  if (CONFIG.giving.stripe) buttons.push(externalLink(CONFIG.giving.stripe, "btn-primary", "Partner through Stripe"));
  if (CONFIG.giving.paypal) buttons.push(externalLink(CONFIG.giving.paypal, "btn-secondary", "Partner through PayPal"));
  if (!buttons.length) {
    return `<p>Partnership links are not published yet. Send a message if you would like to talk about partnering with Zoe Life.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
        </div>`;
  }
  return `<div class="btn-row">${buttons.join("")}</div>
        <p class="format-meta">Partnership checkout opens on Stripe or PayPal.</p>`;
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

const bookClips = (ids) => `<div class="book-clips">
          <p class="eyebrow">From Dangerous Lies Singles Believe</p>
          ${clipGrid(ids.map(clipById), "h3")}
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
        <p class="read-more" aria-hidden="true">Read the article</p>
      </article>`;

const bookingBlock = () =>
  CONFIG.bookingUrl
    ? `<div class="btn-row">
          <a class="btn btn-primary" href="${escapeAttr(CONFIG.bookingUrl)}" target="_blank" rel="noopener noreferrer">${CONSULT_CTA}<span class="visually-hidden">, Google Calendar, opens in a new tab</span></a>
        </div>
        <p class="format-meta">Choose an available time in Google Calendar. You will receive the call details with your confirmation.</p>`
    : `<div class="booking-placeholder">
          <p>Complimentary 20-minute consultations will open here for Mondays and Wednesdays, 6:00 to 8:00 PM Central. Until booking is live, send us a message and we will arrange a time.</p>
          <div class="btn-row">
            <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
          </div>
        </div>`;

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
            <span class="consent-note">${CONSENT}</span>
          </label>
          <p class="error" id="${idPrefix}-consent-error" role="alert"></p>
        </div>
        <div class="field" aria-hidden="true" style="position:absolute;left:-9999px">
          <label for="${idPrefix}-honey">Leave this field empty</label>
          <input type="text" id="${idPrefix}-honey" name="_honey" tabindex="-1" autocomplete="off">
        </div>
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
      <img class="footer-wordmark" src="${pre}assets/brand/zoe-life-wordmark.png" alt="" width="220" height="45">
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
      <p>&copy; <span data-year>2026</span> Zoe Life. All rights reserved.</p>
      <p>Tayo and Kemi</p>
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
      "We share biblical teaching and practical resources for your faith, relationships, and everyday decisions.",
  },
  `
<!-- TODO(client): Kemi's homepage copy goes here -->
<section class="hero-home">
  <div class="hero-split wrap-wide">
    <div class="hero-copy">
      <p class="eyebrow">Zoe Life</p>
      <h1 class="tagline-heading"><span>Helping people thrive</span> <span>in every season of life.</span></h1>
      <p class="lede">${MISSION}</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
        <a class="btn btn-primary" href="books.html">Explore books</a>
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
        <h2>You don't have to do life by yourself.</h2>
      </div>
      <div>
        <p>We want to see people growing, marriages strengthening, and families finding hope in God's Word. We share teaching and resources you can use in your own life, wherever you are starting from.</p>
        <p class="card-link"><a href="about.html">Read more about Zoe Life</a></p>
      </div>
    </div>
  </div>
</section>

<section class="band-tan">
  <div class="wrap">
    <div class="split split-copy-photo">
      <div>
        <p class="eyebrow">Tayo and Kemi</p>
        <h2>We are glad you are here.</h2>
        <p>We started Zoe Life to share what we have learned from Scripture and from our own marriage, family, and work. We hope it helps you with the decisions and relationships in your life.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="about.html">Get to know us</a>
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
    <p class="eyebrow">Books</p>
    <h2>Books to help you thrive.</h2>
    <p class="lede">Start with 7 days. Keep going for 100. More to come.</p>

    <div class="book-pair">
    <div class="book-tease">
      <div class="book-cover">
        <img src="assets/books/gratitude-devotional-cover.jpg"
             alt="Cover of A 7-Day Gratitude Devotional by Kemi Akinyemi, cream cover with green serif title and botanical accents."
             width="888" height="1292" loading="lazy">
      </div>
      <div>
        <h3 class="book-title">A 7-Day Gratitude Devotional</h3>
        <p>Seven days of Scripture, reflection, prayer, and practical application. By Kemi Akinyemi.</p>
        <p class="card-link"><a href="books.html#devotional">See the book</a></p>
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
        <p>A dedicated space to pause, remember God's goodness, and keep a record of His faithfulness. By Kemi Akinyemi.</p>
        <p class="card-link"><a href="books.html#journal">See the journal</a></p>
      </div>
    </div>
    </div>
  </div>
</section>

<section class="band-tan" id="read-and-watch">
  <div class="wrap">
    <p class="eyebrow">Read and watch</p>
    <h2>Teaching for everyday life.</h2>
    <div class="card-grid">
${POSTS.slice(0, 2).map((post) => postCard(post, "h3", "")).join("\n")}
      <article class="card">
        <p class="eyebrow">Videos</p>
        <h3>Teaching from Zoe Family Life.</h3>
        <p>Our teaching on singleness, marriage, conflict, and faith, in short clips and full series.</p>
        <p class="card-link"><a href="resources.html">Watch the series</a></p>
      </article>
    </div>
  </div>
</section>

<section id="connect" class="cta-center">
  <div class="wrap">
    <p class="eyebrow">A next step</p>
    <h2>We would love to hear from you.</h2>
    <p class="lede">Send us a message about books, speaking, or a question you have. Please allow three business days for a reply.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
      <a class="btn btn-secondary" href="${CONSULT_HREF}">${CONSULT_CTA}</a>
    </div>
    <p class="consult-aside">Complimentary consultations are 20 minutes, on Mondays and Wednesdays, 6:00 to 8:00 PM Central.</p>
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
<section class="page-hero">
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
        <p>We are Tayo and Kemi Akinyemi, and we started Zoe Life to share biblical teaching people can use in everyday life.</p>
        <p>The name <em>Zoe</em> comes from the Greek word used in John 10:10 for the abundant life Jesus came to give. That is why we chose the name: we want to help people live in the fullness of what Jesus gives.</p>
        <p>You don't have to do life by yourself. Whether you have walked with God for years or are still asking questions, we hope you find teaching here that helps you.</p>
        <p>Scripture speaks to the whole of life. We turn to it for wisdom at home, at work, and when we face difficult decisions.</p>
        <p>Some changes are exciting. Others are hard. We know how much it helps to have encouragement and practical support through both.</p>
        <p>We share through books, teaching, workshops, and personal consultations. Our aim is to help you apply what you learn.</p>
        <p>We know your circumstances may be different from ours. We want to offer biblical guidance that helps you think through what you are facing.</p>
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-studio.jpeg"
             alt="Tayo and Kemi Akinyemi in a studio portrait, smiling."
             width="1600" height="2400">
        <figcaption>Tayo and Kemi Akinyemi.</figcaption>
      </figure>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="grid grid-2">
      <div>
        <p class="eyebrow">Mission</p>
        <h2>What we are here for.</h2>
        <p>${MISSION}</p>
        <p>We start with what Scripture says, then talk about it in everyday, practical terms.</p>
      </div>
      <div>
        <p class="eyebrow">Vision</p>
        <h2>Lives changed by the truth of God's Word.</h2>
        <p>We want to see people growing, marriages strengthened, families flourishing, leaders serving with wisdom, churches equipped, and communities blessed by people who live what they believe.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Who we are</p>
    <h2>Core values</h2>
    <div class="values" style="margin-top:1.75rem">
      <div class="value"><h3>Christ-centered</h3><p>Jesus Christ is the foundation of our work. We want what we share to point people toward Him.</p></div>
      <div class="value"><h3>Biblical truth</h3><p>God's Word is our final authority. We take care to teach it faithfully and apply it to everyday life.</p></div>
      <div class="value"><h3>Practical wisdom</h3><p>We want what you learn to help you with the choices in front of you.</p></div>
      <div class="value"><h3>Excellence</h3><p>We want to honor God by doing our work well and taking care with what we share.</p></div>
      <div class="value"><h3>Integrity</h3><p>We want our actions to match what we teach. That means being honest and taking responsibility when we fall short.</p></div>
      <div class="value"><h3>Compassion</h3><p>We want to listen carefully and treat people with patience and kindness.</p></div>
      <div class="value"><h3>Stewardship</h3><p>We want to use what God has entrusted to us faithfully and for the good of others.</p></div>
      <div class="value"><h3>Growth</h3><p>We are still learning, too. We want to keep growing in our faith and in how we serve others.</p></div>
    </div>
  </div>
</section>

<section class="band-tan" id="meet">
  <div class="wrap">
    <div class="split meet-split">
    <figure class="portrait portrait-couple portrait-tree">
      <img src="assets/photos/tayo-kemi-tree.jpeg"
           alt="Pastors Tayo and Kemi smiling and embracing outdoors in front of a large tree with vibrant pink blossoms."
           width="1024" height="1536" loading="lazy">
      <figcaption>Pastors Tayo and Kemi Akinyemi.</figcaption>
    </figure>
    <div>
    <p class="eyebrow">Meet Tayo and Kemi</p>
    <p>We are husband and wife, and our teaching draws on our own life together as well as what we have studied. Marriage and parenting have given us plenty to learn and share.</p>
    <p>We also serve as pastors at Life Springs Church. Through Zoe Life, we share lessons from our faith, our work, and years of teaching and mentoring.</p>
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
    <!-- TODO(client): Confirm whether to retain the Statement of Faith. Kept here, collapsed, pending Kemi's decision. -->
    <details class="faith-disclosure">
    <summary>Our Statement of Faith</summary>
    <p>At Zoe Life, our work is grounded in historic Christian faith and the authority of God's Word. We believe:</p>
    <ul class="faith-list">
      <li>The Bible is the inspired, authoritative, and trustworthy Word of God.</li>
      <li>There is one God, eternally existing as Father, Son, and Holy Spirit.</li>
      <li>Jesus Christ is the Son of God, fully God and fully man, whose life, death, and resurrection provide salvation for all who place their faith in Him.</li>
      <li>Salvation is by God's grace through faith in Jesus Christ and cannot be earned by human effort.</li>
      <li>The Holy Spirit indwells every believer, empowering holy living, spiritual growth, and faithful service.</li>
      <li>Every person is created in the image of God and possesses inherent dignity and value.</li>
      <li>The Church is the body of Christ, called to worship God, make disciples, and demonstrate His love to the world.</li>
      <li>Marriage is God's covenant between one man and one woman and is designed to reflect Christ's relationship with His Church.</li>
      <li>God calls believers to lives of holiness, integrity, compassion, stewardship, and faithful obedience.</li>
      <li>Jesus Christ will return, and God's Kingdom will be fully established according to His promises.</li>
    </ul>
    <p>Everything we teach, create, and provide through Zoe Life seeks to be consistent with these biblical convictions.</p>
    </details>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Where next</p>
    <h2>We would be glad to connect.</h2>
    <p>Send us a message if you are looking for resources, thinking of inviting us to speak or lead a workshop, or simply want to say hello.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
      <a class="btn btn-secondary" href="${CONSULT_HREF}">${CONSULT_CTA}</a>
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
    <p class="eyebrow">Books</p>
    <h1>Books to help you thrive.</h1>
    <p class="lede">${BOOKS_INTRO}</p>
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
        <p class="lede">${DEVOTIONAL_SUB}. By Kemi Akinyemi.</p>
        ${DEVOTIONAL_BLURB.map((p) => `<p>${p}</p>`).join("\n        ")}
        ${payButtons("devotional")}
        ${bookClips(["05", "07"])}
      </div>
    </div>
  </div>
</section>

<section id="journal">
  <div class="wrap">
    <div class="book">
      <div class="book-cover">
        <img src="assets/books/gratitude-journal-cover.jpg"
             alt="Cover of A 100-Day Gratitude Journal by Kemi Akinyemi, open journal with eucalyptus and a dawn landscape."
             width="900" height="1350">
      </div>
      <div>
        <p class="eyebrow">Journal</p>
        <h2 class="book-title">A 100-Day Gratitude Journal</h2>
        <p class="lede">${JOURNAL_SUB}. By Kemi Akinyemi.</p>
        ${JOURNAL_BLURB.map((p) => `<p>${p}</p>`).join("\n        ")}
        ${payButtons("journal")}
        ${bookClips(["04"])}
      </div>
    </div>
  </div>
</section>

<section class="band-tan" id="collection">
  <div class="wrap">
    <p class="eyebrow">Gratitude Collection</p>
    <h2>Two ways to practice gratitude.</h2>
    <p>Start with 7 days. Keep going for 100.</p>
    ${COLLECTION_COPY.map((p) => `<p>${p}</p>`).join("\n    ")}
    <p>If you are buying for a group, a church, or a workshop, send a message and we can talk through a group order once purchase options are live.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${MESSAGE_HREF}">Ask about group orders</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">More to come</p>
    <h2>More books and resources coming soon.</h2>
    <p>${COMING_SOON}</p>
  </div>
</section>
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
      <a class="btn btn-secondary" href="${CONSULT_HREF}">${CONSULT_CTA}</a>
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
    <h1>Send us a message to connect.</h1>
    <p class="lede">Have a question or an invitation for us? Use the form below. Please expect a reply within three business days.</p>
  </div>
</section>

<section id="message">
  <div class="wrap">
    <div class="split split-wide-left" style="align-items:start">
      <div>
        <h2>Send a message</h2>
        <p>Tell us a little about how we can help. Please expect a reply within three business days.</p>

        <div class="form-card" style="margin-top:1.5rem">
          <form data-form="contact" novalidate>
            <div class="field-row">
              <div class="field">
                <label for="c-first">First name <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
                <input type="text" id="c-first" name="firstName" autocomplete="given-name" required aria-describedby="c-first-error">
                <p class="error" id="c-first-error" role="alert"></p>
              </div>
              <div class="field">
                <label for="c-last">Last name <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
                <input type="text" id="c-last" name="lastName" autocomplete="family-name" required aria-describedby="c-last-error">
                <p class="error" id="c-last-error" role="alert"></p>
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label for="c-email">Email address <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
                <input type="email" id="c-email" name="email" autocomplete="email" required aria-describedby="c-email-error">
                <p class="error" id="c-email-error" role="alert"></p>
              </div>
              <div class="field">
                <label for="c-phone">Phone number <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
                <input type="tel" id="c-phone" name="phone" autocomplete="tel" required aria-describedby="c-phone-error">
                <p class="error" id="c-phone-error" role="alert"></p>
              </div>
            </div>

            <div class="field">
              <label for="c-reason">Reason for contacting <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
              <select id="c-reason" name="reason" required aria-describedby="c-reason-error">
                <option value="">Please choose</option>
                <option>Coaching</option>
                <option>Speaking Engagement</option>
                <option>Workshop / Group Session</option>
                <option>Academic or Career Support</option>
                <option>Books &amp; Resources</option>
                <option>Course access</option>
                <option>Collaboration / Partnership</option>
                <option>General Inquiry</option>
                <option value="Other">Other</option>
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

            <button class="btn btn-primary" type="submit">Send message</button>
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
          <h3>Prefer a short call?</h3>
          <p>You can book a complimentary 20-minute consultation using the link below.</p>
          <a class="btn btn-secondary" href="${CONSULT_HREF}">Schedule a consultation</a>
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
      "Schedule a complimentary 20-minute consultation with Zoe Life. Mondays and Wednesdays, 6:00 to 8:00 PM Central, via Google Calendar appointment scheduling.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Consultation</p>
    <h1>A complimentary 20-minute conversation.</h1>
    <p class="lede">No cost and no deposit. A short call to hear what you need and see how we can help.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="split split-copy-photo" style="align-items:start">
      <div>
        <h2>How it works</h2>
        <ul class="detail-list">
          <li><span class="k">Length</span> <span class="v">20 minutes</span></li>
          <li><span class="k">Cost</span> <span class="v">Free, no deposit</span></li>
          <li><span class="k">When</span> <span class="v">Mondays and Wednesdays, 6:00 to 8:00 PM Central</span></li>
          <li><span class="k">Where</span> <span class="v">Video call, details sent on confirmation</span></li>
        </ul>
        <p style="margin-top:1.5rem">This is a first conversation, not a paid session.</p>
        ${bookingBlock()}
${CONFIG.paidBookingUrl ? `<div style="margin-top:2rem"><h3>Continue with a paid session</h3><p>View available sessions, pricing, and appointment details before booking.</p><div class="btn-row">${externalLink(CONFIG.paidBookingUrl, "btn-secondary", "View paid sessions")}</div></div>` : ''}
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-hero.jpg"
             alt="Tayo and Kemi Akinyemi standing together outdoors, smiling."
             width="1240" height="960">
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
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Partner</p>
    <h1>Partner with Zoe Life.</h1>
    <p class="lede">Your partnership helps us keep sharing biblical teaching and resources. Zoe Life is not a registered nonprofit.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <h2>A way to support the work.</h2>
    <p>If you would like to support this work, we would be glad to hear from you.</p>
${givingBlock()}
  </div>
</section>
`
);

// Blog topics follow the order of the video series on the Videos page; any
// new category is listed after these, alphabetically.
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

const PAGES = {
  "index.html": home,
  "about.html": about,
  "books.html": books,
  "resources.html": resources,
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

for (const [name, html] of Object.entries(PAGES)) wrote(name, html);

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
        courses: CONFIG.courses,
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
  "blog.html",
  ...POSTS.map((post) => post.page),
  "courses.html",
  ...COURSE_TRACKS.map((track) => track.page),
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
