/**
 * Zoe Life Phase 1 page builder.
 *
 * Assembles the five static pages from shared chrome + per page content so the
 * header, footer and social data cannot drift between pages. Output is plain
 * static HTML committed to the repo, so the site still needs no build step to
 * run or host. Re-run with:  node tools/build.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------------------------------------------------------- config -- */

/**
 * Deployment configuration.
 *
 * Every integration defaults to null, which makes the corresponding UI fail
 * closed: the form refuses to submit and says so, the booking button stays
 * disabled. Set a value here (or via env) and that feature becomes real, with
 * success reported only when the endpoint actually accepts the request.
 *
 * Build for production:   node tools/build.mjs
 * Build a staging copy:   node tools/build.mjs --staging   (adds noindex)
 */
const STAGING = process.argv.includes("--staging") || process.env.ZOE_STAGING === "1";

const CONFIG = {
  // Canonical home of the site. Used for canonical tags and the sitemap.
  siteUrl: process.env.ZOE_SITE_URL || "https://www.zoelifehub.com",

  // POST target for the Contact Us form. Must return 2xx on success.
  // e.g. a Formspree/Basin/Web3Forms endpoint, or your own handler.
  formEndpoint: process.env.ZOE_FORM_ENDPOINT || null,

  // POST target for mailing-list signup.
  newsletterEndpoint: process.env.ZOE_NEWSLETTER_ENDPOINT || null,

  // Public booking URL for the complimentary 20 minute consultation.
  bookingUrl: process.env.ZOE_BOOKING_URL || null,

  staging: STAGING,
};

/* ------------------------------------------------------------------ data -- */

const TAGLINE = "Helping People Thrive in Every Season of Life";

/* Verified public Zoe Life copy. Source: docs/current-site-content.md,
   captured from zoelifehub.com. Do not expand beyond what is stated there. */
const MISSION =
  "Zoe Life equips individuals, couples, families, churches, and organizations with " +
  "biblical truth, practical wisdom, and Christ-centered resources to help them thrive " +
  "in every season of life.";

/* Zoe Life is the parent brand. Programs sit beneath it. Adding a program here
   adds it to the Family Life / Socials page without touching page layout. */
const PROGRAMS = [
  {
    id: "zoe-family-life",
    name: "Zoe Family Life",
    status: "active",
    blurb:
      "The first focused program under Zoe Life, centred on relationships, marriage, " +
      "parenting, and family life.",
    socials: [
      ["facebook", "Facebook", "https://www.facebook.com/zoefamilylife10"],
      ["instagram", "Instagram", "https://www.instagram.com/zoefamilylife"],
      ["tiktok", "TikTok", "https://www.tiktok.com/@zoefamilylife"],
      ["youtube", "YouTube", "https://www.youtube.com/@zoefamilylife"],
    ],
    socialNote: "No X account for Zoe Family Life at this time.",
  },
  {
    id: "academic-career",
    name: "Academic and Career",
    status: "planned",
    blurb:
      "Support for students, young adults, and professionals across education, careers, " +
      "leadership, and stewardship. Planned as a later Zoe Life program.",
    socials: [],
    socialNote: "Program not yet launched. No accounts to list.",
  },
  {
    id: "faith-life-resources",
    name: "Faith and Life Resources",
    status: "planned",
    blurb:
      "Books, devotionals, journals, studies, and courses for spiritual and personal growth. " +
      "Published today through Books and Resources.",
    socials: [],
    socialNote: "Published under the main Zoe Life accounts for now.",
  },
];

const ZOE_LIFE_SOCIALS = [
  ["facebook", "Facebook", "https://www.facebook.com/zoelifehub"],
  ["instagram", "Instagram", "https://www.instagram.com/zoelifehub/"],
  ["tiktok", "TikTok", "https://www.tiktok.com/@zoelifehub1"],
  ["youtube", "YouTube", "https://www.youtube.com/@zoelifehub1"],
  ["x", "X", "https://x.com/zoelifehub"],
];

const NAV = [
  ["index.html", "Home"],
  ["about.html", "About"],
  ["books.html", "Books &amp; Resources"],
  ["family-life.html", "Family Life"],
  ["contact.html", "Contact"],
];

/* Three pathways, per the client direction recorded in docs/current-site-content.md. */
const PATHWAYS = [
  {
    name: "Relationships and Family",
    body:
      "Marriage, premarital preparation, parenting, and family life. Delivered through the " +
      "Zoe Family Life program.",
    href: "family-life.html",
    linkText: "Visit Zoe Family Life",
  },
  {
    name: "Academic and Career",
    body:
      "Education, careers, leadership, and stewardship for students, young adults, and " +
      "working professionals.",
    href: "contact.html",
    linkText: "Ask about academic and career support",
  },
  {
    name: "Faith and Life Resources",
    body:
      "Devotionals, journals, and study resources for growing in Christ and applying " +
      "Scripture to everyday life.",
    href: "books.html",
    linkText: "Browse books and resources",
  },
];

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

/* ---------------------------------------------------------------- helpers -- */

const icon = (key) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${SOCIAL_ICONS[key]}</svg>`;

/** External links get rel=noopener for safety and a screen reader hint. */
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

const head = ({ title, description, page }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
${CONFIG.staging
  ? '<meta name="robots" content="noindex, nofollow">'
  : '<meta name="robots" content="index, follow">'}
<link rel="canonical" href="${canonicalFor(page)}">
<meta name="theme-color" content="#FBF7F0">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Zoe Life">
<meta property="og:url" content="${canonicalFor(page)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${CONFIG.siteUrl.replace(/\/$/, "")}/assets/brand/zoe-life-logo.png">
<meta name="twitter:card" content="summary">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/brand/zoe-life-logo.png">
<link rel="preload" href="fonts/fraunces-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/outfit-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/style.css">
<script src="js/config.js"></script>
</head>
<body data-page="${page}">
<a class="skip-link" href="#main">Skip to main content</a>`;

const header = (current) => `
<header class="site-header">
  <div class="wrap-wide header-inner">
    <a class="brand" href="index.html">
      <img src="assets/brand/zoe-life-logo.png" alt="Zoe Life" width="46" height="46">
      <span>
        <span class="brand-name">Zoe Life</span>
        <span class="brand-sub">Thrive in every season</span>
      </span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span aria-hidden="true">&#9776;</span> Menu
    </button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul>
${NAV.map(
  ([href, label]) =>
    `        <li><a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a></li>`
).join("\n")}
        <li class="nav-cta"><a href="contact.html#consultation">Book a free consultation</a></li>
      </ul>
    </nav>
    <a class="btn btn-primary header-cta" href="contact.html#consultation">Book a free consultation</a>
  </div>
</header>
<main id="main">`;

/* Mailing list signup. Fail closed: no list is connected yet, so the form
   cannot and must not report a successful subscription. */
const subscribeForm = (idPrefix, compact) => `
      <form class="subscribe-form" data-form="subscribe" novalidate>
        ${compact ? "" : '<p class="hint">Occasional notes on new resources and Zoe Life news. No spam, unsubscribe any time.</p>'}
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
            <span>Yes, email me Zoe Life updates. I can unsubscribe from any email.</span>
          </label>
          <p class="error" id="${idPrefix}-consent-error" role="alert"></p>
        </div>
        <button class="btn btn-primary" type="submit">Sign up</button>
        <div class="form-status" data-status role="status" aria-live="polite"></div>
      </form>`;

const footer = () => `
</main>
<footer class="site-footer">
  <div class="wrap-wide">
    <div class="footer-grid">

      <div class="footer-brand">
        <img src="assets/brand/zoe-life-logo.png" alt="" width="58" height="58">
        <p class="footer-tagline">${TAGLINE}</p>
        <h2 class="footer-h" style="margin-top:1.75rem">Follow Zoe Life</h2>
        ${socialList(ZOE_LIFE_SOCIALS, "Zoe Life")}
      </div>

      <nav class="footer-nav" aria-label="Footer">
        <h2 class="footer-h">Explore</h2>
        <ul>
${NAV.map(([href, label]) => `          <li><a href="${href}">${label}</a></li>`).join("\n")}
          <li><a href="contact.html#consultation">Free 20 minute consultation</a></li>
        </ul>
      </nav>

      <div>
        <h2 class="footer-h">Stay in touch</h2>
${subscribeForm("footer", false)}
      </div>

    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>2026</span> Zoe Life. All rights reserved.</p>
      <p>Founded by Pastors Tayo and Kemi Akinyemi.</p>
    </div>
  </div>
</footer>
<script src="js/main.js"></script>
</body>
</html>
`;

const page = (meta, body) => head(meta) + header(meta.page) + body + footer();

/* ------------------------------------------------------------------ pages -- */

const home = page(
  {
    page: "index.html",
    title: "Zoe Life | Helping People Thrive in Every Season of Life",
    description:
      "Zoe Life equips individuals, couples, families, churches, and organizations with " +
      "biblical truth, practical wisdom, and Christ-centered resources.",
  },
  `
<section class="hero">
  <div class="hero-texture" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow">Zoe Life</p>
    <h1>Life, in all its fullness.</h1>
    <p class="tagline">${TAGLINE}</p>
    <p class="lede">${MISSION}</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="contact.html#consultation">Book a free 20 minute consultation</a>
      <a class="btn btn-secondary" href="books.html">Explore books and resources</a>
    </div>
  </div>
</section>

<section class="band-deep">
  <div class="wrap">
    <p class="eyebrow">What is Zoe Life</p>
    <div class="split split-wide-left">
      <div>
        <h2>Zoe is the Greek word for life.</h2>
        <p>In Scripture it often points to the fullness of life that comes from God. That
          idea sits at the centre of everything Zoe Life does.</p>
        <p><em>"I have come that they may have life, and that they may have it more
          abundantly."</em> John 10:10, NKJV</p>
        <p>Zoe Life is biblical and practical. We start with what Scripture says, then work
          out what it means for real decisions, real relationships, and real seasons.</p>
        <p><a href="about.html">Read more about Zoe Life</a></p>
      </div>
      <figure>
        <img src="assets/photos/small-group-study.jpg"
             alt="A small group of adults studying and discussing an open Bible together around a table."
             width="1600" height="1066" loading="lazy">
      </figure>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Who Zoe Life serves</p>
    <h2>Every season looks different.</h2>
    <p class="lede">Zoe Life works with people across many stages and settings.</p>
    <div class="grid grid-3" style="margin-top:2.5rem">
      <div class="card"><h3>People</h3>
        <ul>
          <li>Individuals seeking spiritual and personal growth</li>
          <li>Couples preparing for or strengthening marriage</li>
          <li>Parents and families</li>
          <li>Students and young adults</li>
          <li>Professionals and leaders</li>
        </ul>
      </div>
      <div class="card"><h3>Communities</h3>
        <ul>
          <li>Churches and ministries</li>
          <li>Schools and organizations</li>
          <li>Small groups and community groups</li>
        </ul>
      </div>
      <div class="card"><h3>How we help</h3>
        <ul>
          <li><strong>Spiritually:</strong> growing in Christ and applying God's Word</li>
          <li><strong>Relationally:</strong> healthy marriages, families, and friendships</li>
          <li><strong>Personally:</strong> wisdom, character, purpose, and resilience</li>
          <li><strong>Professionally:</strong> education, careers, leadership, stewardship</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="band-deep">
  <div class="wrap">
    <p class="eyebrow">Where to start</p>
    <h2>Three pathways.</h2>
    <p class="lede">Zoe Life is the parent brand. Focused programs sit beneath it, and more
      are planned.</p>
    <div class="grid grid-3" style="margin-top:2.5rem">
${PATHWAYS.map(
  (p, i) => `      <div class="card pathway">
        <span class="card-num">0${i + 1}</span>
        <h3>${p.name}</h3>
        <p>${p.body}</p>
        <p class="card-link"><a href="${p.href}">${p.linkText}</a></p>
      </div>`
).join("\n")}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Launch resources</p>
    <h2>Two gratitude resources, built to work together.</h2>
    <div class="grid grid-2" style="margin-top:2.5rem">

      <div class="card">
        <h3>A 7-Day Gratitude Devotional</h3>
        <p>Cultivating a Heart of Thanksgiving to God. By Kemi Akinyemi.</p>
        <p><span class="pending">Description pending</span></p>
        <p class="card-link"><a href="books.html#devotional">See formats and availability</a></p>
      </div>

      <div class="card">
        <h3>A 100-Day Gratitude Journal</h3>
        <p>A companion journal for recording gratitude over 100 days.</p>
        <p><span class="pending">Description pending</span></p>
        <p class="card-link"><a href="books.html#journal">See formats and availability</a></p>
      </div>

    </div>
    <div class="note">
      <p><strong>Not yet on sale.</strong> Final covers, prices, and store links are still to be
        confirmed by Zoe Life. Purchase options appear on the Books and Resources page as soon
        as each listing is live.</p>
    </div>
  </div>
</section>

<section class="band-sage">
  <div class="wrap">
    <div class="split">
      <div>
        <p class="eyebrow">The founders</p>
        <h2>Pastors Tayo and Kemi Akinyemi</h2>
        <p>Founders of Zoe Life and pastors of Life Springs Church. They combine ministry
          experience, professional leadership, teaching, mentoring, coaching, and a habit of
          lifelong learning.</p>
        <p>Their focus spans relationships, family life, leadership, education, careers,
          stewardship, and personal growth through Scripture.</p>
        <div class="btn-row">
          <a class="btn btn-secondary" href="about.html">Meet Tayo and Kemi</a>
        </div>
      </div>
      <figure class="founders-photo">
        <img src="assets/photos/founders-tayo-kemi.jpg"
             alt="Pastors Tayo and Kemi Akinyemi smiling together."
             width="930" height="920" loading="lazy">
      </figure>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Take a next step</p>
    <h2>Start with a conversation.</h2>
    <p class="lede">A complimentary 20 minute consultation is a simple way to talk through
      where you are and whether Zoe Life can help.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="contact.html#consultation">Book a free consultation</a>
      <a class="btn btn-secondary" href="contact.html">Send a message instead</a>
    </div>
    <hr>
    <div class="split">
      <div>
        <h3>Join the Zoe Life mailing list</h3>
        <p>Occasional notes on new resources, teaching, and Zoe Life news.</p>
      </div>
      <div class="form-card">
${subscribeForm("home", true)}
      </div>
    </div>
  </div>
</section>
`
);

const about = page(
  {
    page: "about.html",
    title: "About Zoe Life | Biblical truth, practical wisdom",
    description:
      "The meaning of Zoe, the vision behind Zoe Life, and an introduction to founders " +
      "Pastors Tayo and Kemi Akinyemi.",
  },
  `
<section class="hero">
  <div class="hero-texture" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow">About</p>
    <h1>About Zoe Life</h1>
    <p class="tagline">${TAGLINE}</p>
    <p class="lede">${MISSION}</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="split split-wide-left">
      <div>
        <p class="eyebrow">The meaning of Zoe</p>
        <h2>Life as God intends it.</h2>
        <p>Zoe comes from the Greek word for life. In Scripture it often refers to the
          fullness of life that comes from God, not simply being alive but living well,
          with purpose and hope.</p>
        <p><em>"I have come that they may have life, and that they may have it more
          abundantly."</em> John 10:10, NKJV</p>
        <p>That abundant life is the heart of this organization. Zoe Life exists to help
          people experience it, whatever season they are in.</p>
      </div>
      <figure>
        <img src="assets/photos/hands-reaching.jpg"
             alt="Two people reaching out to take hold of each other's hands."
             width="2000" height="2500" loading="lazy">
      </figure>
    </div>
  </div>
</section>

<section class="band-deep">
  <div class="wrap">
    <div class="grid grid-2">
      <div>
        <p class="eyebrow">Mission</p>
        <h2>Biblical and practical.</h2>
        <p>${MISSION}</p>
        <p>Zoe Life starts with what Scripture says, then works out what it means in
          practice, through thoughtful questions, biblically grounded guidance, and
          practical tools.</p>
      </div>
      <div>
        <p class="eyebrow">Vision</p>
        <h2>Lives changed by the truth of God's Word.</h2>
        <ul>
          <li>Individuals growing spiritually</li>
          <li>Marriages strengthened</li>
          <li>Families flourishing</li>
          <li>Leaders serving with wisdom and integrity</li>
          <li>Churches equipped for ministry</li>
          <li>Communities positively affected</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Meet the founders</p>
    <div class="split">
      <figure class="founders-photo">
        <img src="assets/photos/founders-tayo-kemi.jpg"
             alt="Pastors Tayo and Kemi Akinyemi smiling together."
             width="930" height="920">
        <figcaption>Pastors Tayo and Kemi Akinyemi, founders of Zoe Life.</figcaption>
      </figure>
      <div>
        <h2>Tayo and Kemi Akinyemi</h2>
        <p>Pastors Tayo and Kemi Akinyemi are the founders of Zoe Life and pastors of Life
          Springs Church.</p>
        <p>They are founders, pastors, coaches, mentors, parents, and professionals. Their
          work brings together ministry experience, professional leadership, teaching,
          mentoring, coaching, and lifelong learning.</p>
        <p>Their public focus includes relationships, family life, leadership, education,
          careers, stewardship, and personal growth through Scripture.</p>
        <p><span class="pending">Biography pending</span></p>
      </div>
    </div>
    <div class="note">
      <p><strong>Content note for Zoe Life.</strong> The wording above is drawn from the current
        public zoelifehub.com pages. The longer "About Zoe Life" and "Meet Tayo &amp; Kemi"
        copy sent by email has not been supplied to this build, so nothing has been invented
        to fill the gap. Send that copy and it will replace these sections.</p>
    </div>
  </div>
</section>

<section class="band-deep">
  <div class="wrap">
    <p class="eyebrow">What Zoe Life does</p>
    <h2>Ways we serve.</h2>
    <div class="grid grid-3" style="margin-top:2.5rem">
      <div class="card"><h3>Coaching</h3>
        <p>Personalized guidance rooted in God's Word, for important decisions, relationships,
          and changing seasons. Areas include marriage, premarital, relationships, parenting
          and family, academic, career, and leadership.</p></div>
      <div class="card"><h3>Speaking and teaching</h3>
        <p>Serving churches, conferences, ministries, schools, organizations, and community
          groups. Topics include marriage, parenting, family life, spiritual growth,
          Christian living, leadership, stewardship, purpose, and discipleship.</p></div>
      <div class="card"><h3>Workshops</h3>
        <p>Marriage enrichment, premarital preparation, parenting, leadership development,
          Christian living, communication, conflict resolution, stewardship, and personal
          growth.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Where next</p>
    <h2>Take a next step.</h2>
    <div class="grid grid-3" style="margin-top:2rem">
      <div class="card"><h3>Books and Resources</h3>
        <p>Devotionals and journals to use on your own or with a group.</p>
        <p class="card-link"><a href="books.html">Browse resources</a></p></div>
      <div class="card"><h3>Contact us</h3>
        <p>Questions about coaching, speaking, workshops, or partnership.</p>
        <p class="card-link"><a href="contact.html">Send a message</a></p></div>
      <div class="card"><h3>Free consultation</h3>
        <p>A complimentary 20 minute conversation about your situation.</p>
        <p class="card-link"><a href="contact.html#consultation">See how it works</a></p></div>
    </div>
  </div>
</section>
`
);

/* Purchase options grouped by format. Every link is pending until Zoe Life
   supplies a real URL, so each store renders as a disabled chip, never a fake
   href. Adding a real url turns a chip into a working link automatically. */
const storeChip = ({ store, url }) =>
  url
    ? `<li><a class="social-link" href="${url}" target="_blank" rel="noopener noreferrer">${store}<span class="visually-hidden">, opens in a new tab</span></a></li>`
    : `<li><span class="store-chip">${store} <span class="pending">Link pending</span></span></li>`;

const formatGroup = (g) => `
        <div class="format-group">
          <h4>${g.title}</h4>
          <p class="format-meta">${g.meta}</p>
          <ul class="store-list">
${g.stores.map((s) => `            ${storeChip(s)}`).join("\n")}
          </ul>
        </div>`;

const books = page(
  {
    page: "books.html",
    title: "Books and Resources | Zoe Life",
    description:
      "Gratitude resources from Zoe Life, including A 7-Day Gratitude Devotional and " +
      "A 100-Day Gratitude Journal. Formats and availability.",
  },
  `
<section class="hero">
  <div class="hero-texture" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow">Books and Resources</p>
    <h1>Resources for everyday faith.</h1>
    <p class="lede">Two gratitude resources launch first. More books, workbooks, and guides
      will be added here as they are published.</p>
    <div class="note">
      <p><strong>Nothing is on sale yet.</strong> Zoe Life has not yet confirmed final covers,
        prices, or store listings. Buying options below are shown as pending rather than as
        live links, so nothing on this page is misleading.</p>
    </div>
  </div>
</section>

<section id="devotional">
  <div class="wrap">
    <div class="book">
      <div class="book-cover">
        <img src="assets/books/gratitude-devotional-cover.jpg"
             alt="Cover of A 7-Day Gratitude Devotional by Kemi Akinyemi, showing a journal and mug beside a calm mountain lake at sunrise."
             width="576" height="1024">
      </div>
      <div>
        <p class="eyebrow">Devotional</p>
        <h2>A 7-Day Gratitude Devotional</h2>
        <p class="lede">Cultivating a Heart of Thanksgiving to God. By Kemi Akinyemi.</p>
        <p><span class="pending">Description pending</span></p>
        <p><span class="pending">Price pending</span></p>

        <h3 style="margin-top:2rem">Choose a format</h3>
${formatGroup({
  title: "Read on Kindle",
  meta: "Kindle edition, read on any Kindle app or device.",
  stores: [{ store: "Amazon Kindle" }],
})}
${formatGroup({
  title: "Digital download",
  meta: "Instant download, read on any device.",
  stores: [{ store: "Etsy" }, { store: "Gumroad" }, { store: "Selar" }],
})}
${formatGroup({
  title: "Printed copy",
  meta: "Paperback, shipped to you.",
  stores: [{ store: "Zoe Life store" }, { store: "Amazon" }],
})}
      </div>
    </div>
  </div>
</section>

<section id="journal" class="band-deep">
  <div class="wrap">
    <div class="book">
      <div>
        <div class="cover-pending">
          <span class="pending">Cover pending</span>
          <span>The final cover for A 100-Day Gratitude Journal has not been supplied yet.</span>
        </div>
      </div>
      <div>
        <p class="eyebrow">Journal</p>
        <h2>A 100-Day Gratitude Journal</h2>
        <p class="lede">A companion journal for recording gratitude over 100 days.</p>
        <p><span class="pending">Description pending</span></p>
        <p><span class="pending">Price pending</span></p>

        <h3 style="margin-top:2rem">Choose a format</h3>
${formatGroup({
  title: "Printable PDF",
  meta: "Digital download, print at home or use on a tablet.",
  stores: [{ store: "Etsy" }, { store: "Gumroad" }, { store: "Selar" }],
})}
${formatGroup({
  title: "Printed copy",
  meta: "Paperback journal, shipped to you.",
  stores: [{ store: "Zoe Life store" }, { store: "Amazon" }],
})}
        <p class="format-meta">No Kindle edition is planned for the journal.</p>
      </div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Better together</p>
    <div class="split">
      <div>
        <h2>How the two work together.</h2>
        <p>The devotional carries you through seven days of reflection on thanksgiving to God.
          The journal gives you 100 days of space to keep going, recording what you are
          grateful for well beyond the first week.</p>
        <p>Start with the devotional, then continue in the journal.</p>
        <p><span class="pending">Copy pending</span></p>
      </div>
      <div class="card">
        <h3>Also published by Zoe Life</h3>
        <p><strong>Questions Every Christian Couple Should Discuss Before Marriage</strong><br>
          A Biblical Conversation Guide for Couples Considering Marriage. Workbook by Tayo and
          Kemi Akinyemi.</p>
        <p><span class="pending">Availability pending</span></p>
      </div>
    </div>
  </div>
</section>

<section class="band-sage">
  <div class="wrap">
    <h2>More resources are coming.</h2>
    <p>This page is built to grow. Future books, workbooks, guides, and course materials will
      be added in the same format, alongside the resources above.</p>
    <div class="btn-row">
      <a class="btn btn-secondary" href="contact.html">Ask about bulk or group orders</a>
    </div>
  </div>
</section>
`
);

const brandBlock = (p) => `
      <article class="brand-block is-${p.status === "active" ? "child" : "planned"}" id="${p.id}">
        <h3>${p.name}${p.status === "planned" ? ' <span class="pending">Planned</span>' : ""}</h3>
        <p>${p.blurb}</p>
        ${p.socials.length ? socialList(p.socials, p.name) : ""}
        <p class="format-meta" style="margin-top:1rem">${p.socialNote}</p>
      </article>`;

const familyLife = page(
  {
    page: "family-life.html",
    title: "Family Life and Socials | Zoe Life",
    description:
      "Zoe Life and its focused programs, including Zoe Family Life. Follow Zoe Life and " +
      "Zoe Family Life on Facebook, Instagram, TikTok, YouTube, and X.",
  },
  `
<section class="hero">
  <div class="hero-texture" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow">Programs and socials</p>
    <h1>One family of work.</h1>
    <p class="lede">Zoe Life is the parent brand. Focused programs sit beneath it, each with
      its own audience and, where they exist, its own social accounts.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">The parent brand</p>
    <article class="brand-block is-parent">
      <h2>Zoe Life</h2>
      <p class="tagline" style="font-size:1.15rem;margin:.5rem 0 1rem">${TAGLINE}</p>
      <p>${MISSION} Zoe Life covers spiritual growth, relationships, personal development,
        and academic and professional life. It is not limited to any single one of them.</p>
      ${socialList(ZOE_LIFE_SOCIALS, "Zoe Life")}
      <p class="format-meta" style="margin-top:1rem">These are the main Zoe Life accounts, also
        linked in the footer of every page.</p>
    </article>
  </div>
</section>

<section class="band-deep">
  <div class="wrap">
    <p class="eyebrow">Programs under Zoe Life</p>
    <h2>Focused areas.</h2>
    <p class="lede">Zoe Family Life is the first. Others are planned and will appear here as
      they launch, without changing how this page works.</p>
    <div class="grid" style="margin-top:2.5rem;gap:1.25rem">
${PROGRAMS.map(brandBlock).join("\n")}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="split">
      <div>
        <p class="eyebrow">Zoe Family Life</p>
        <h2>Relationships, marriage, parenting, family.</h2>
        <p>Zoe Family Life is where Zoe Life focuses specifically on the home: preparing for
          marriage, strengthening a marriage, raising children, and building family life that
          lasts.</p>
        <p>It carries its own social accounts so families can follow that conversation
          directly, while Zoe Life remains the parent brand across everything else.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="contact.html#consultation">Book a free consultation</a>
          <a class="btn btn-secondary" href="books.html">See related resources</a>
        </div>
      </div>
      <figure>
        <img src="assets/photos/coaching-conversation.jpg"
             alt="Two people in a supportive one to one coaching conversation."
             width="1600" height="1066" loading="lazy">
      </figure>
    </div>
  </div>
</section>
`
);

const contact = page(
  {
    page: "contact.html",
    title: "Contact Zoe Life | Message us or book a free consultation",
    description:
      "Send Zoe Life a message about coaching, speaking, workshops, resources, or " +
      "partnership, or book a complimentary 20 minute consultation.",
  },
  `
<section class="hero">
  <div class="hero-texture" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow">Contact</p>
    <h1>Get in touch.</h1>
    <p class="lede">Send a message, or book a complimentary 20 minute consultation. They are
      two separate things, so pick whichever fits.</p>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="split split-wide-left" style="align-items:start">
      <div>
        <h2>Send us a message</h2>
        <p>Fill in the form and it goes straight to the Zoe Life inbox. Zoe Life aims to reply
          within three business days.</p>

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
              <label for="c-website">Leave this field empty</label>
              <input type="text" id="c-website" name="website" tabindex="-1" autocomplete="off">
            </div>

            <button class="btn btn-primary" type="submit">Send message</button>
            <div class="form-status" data-status role="status" aria-live="polite"></div>
          </form>
        </div>
      </div>

      <aside>
        <div class="card">
          <h3>Prefer to talk?</h3>
          <p>Book a complimentary 20 minute consultation instead. It is a separate booking, not
            this form.</p>
          <p class="card-link"><a href="#consultation">See consultation details</a></p>
        </div>
        <div class="card" style="margin-top:1.25rem">
          <h3>Follow Zoe Life</h3>
          ${socialList(ZOE_LIFE_SOCIALS, "Zoe Life")}
        </div>
        <div class="note">
          <p><strong>Privacy.</strong> Messages go to the Zoe Life team privately. Zoe Life does
            not publish its email addresses on this site.</p>
        </div>
      </aside>
    </div>
  </div>
</section>

<section id="consultation" class="band-sage">
  <div class="wrap">
    <p class="eyebrow">Complimentary consultation</p>
    <h2>A free 20 minute conversation.</h2>
    <p class="lede">No cost and no deposit. A short call to understand where you are and
      whether Zoe Life can help.</p>

    <div class="split" style="margin-top:2.5rem;align-items:start">
      <div>
        <h3>How it works</h3>
        <ul class="detail-list">
          <li><span class="k">Length</span> <span class="v">20 minutes</span></li>
          <li><span class="k">Cost</span> <span class="v">Free, no deposit</span></li>
          <li><span class="k">When</span> <span class="v">Mondays and Wednesdays, 6:00 to 8:00 PM Central</span></li>
          <li><span class="k">Notice</span> <span class="v">At least 24 hours ahead</span></li>
          <li><span class="k">How far ahead</span> <span class="v">Up to 30 days</span></li>
          <li><span class="k">Where</span> <span class="v">Zoom, link sent on confirmation</span></li>
          <li><span class="k">Reminders</span> <span class="v">Confirmation, then 24 hours and 1 hour before</span></li>
        </ul>
      </div>
      <div>
        <h3>What you will be asked</h3>
        <p>The booking form collects your name, email, phone, and a brief description of what
          you would like to discuss, plus:</p>
        <ul>
          <li><strong>Topic:</strong> Coaching, Speaking Engagement, Workshop / Group Session,
            Academic Support, Career Support, Books &amp; Resources,
            Collaboration / Partnership, or Other / Not Sure</li>
          <li><strong>How you heard about Zoe Life:</strong> friend or family, church or
            ministry, Instagram, Facebook, TikTok, YouTube, a Zoe Life resource, search, or
            other</li>
        </ul>
        <div class="btn-row">
${CONFIG.bookingUrl
  ? `          <a class="btn btn-secondary" href="${CONFIG.bookingUrl}" target="_blank" rel="noopener noreferrer">Book your consultation<span class="visually-hidden">, opens in a new tab</span></a>`
  : `          <a class="btn btn-secondary" aria-disabled="true" href="#consultation"
             onclick="return false;">Booking opens soon</a>`}
        </div>
${CONFIG.bookingUrl
  ? ""
  : `        <p class="format-meta">The scheduling tool is not connected yet, so
          there is no booking link to publish. Use the contact form in the meantime and Zoe Life
          will arrange a time.</p>`}
      </div>
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
  "family-life.html": familyLife,
  "contact.html": contact,
};

mkdirSync(ROOT, { recursive: true });
const wrote = (name, body) => {
  writeFileSync(join(ROOT, name), body, "utf8");
  console.log(`wrote ${name.padEnd(20)} ${String(body.length).padStart(6)} bytes`);
};

for (const [name, html] of Object.entries(PAGES)) wrote(name, html);

/* Runtime config consumed by js/main.js. Null endpoints keep the UI fail closed. */
wrote(
  "js/config.js",
  `/* Generated by tools/build.mjs. Do not edit by hand. */\n` +
    `window.ZOE_CONFIG = ${JSON.stringify(
      {
        formEndpoint: CONFIG.formEndpoint,
        newsletterEndpoint: CONFIG.newsletterEndpoint,
        bookingUrl: CONFIG.bookingUrl,
      },
      null,
      2
    )};\n`
);

/* Favicon drawn from the logo mark: gold ring, green leaf. */
wrote(
  "favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#FBF7F0"/>
  <circle cx="16" cy="16" r="11.5" fill="none" stroke="#C9A227" stroke-width="1.6"/>
  <path d="M16 22c-3.2 0-5.6-2.4-5.6-5.6C10.4 12.6 13.6 9.6 16 8c2.4 1.6 5.6 4.6 5.6 8.4 0 3.2-2.4 5.6-5.6 5.6z" fill="#6F7D5E"/>
  <path d="M16 9.5v12" stroke="#FBF7F0" stroke-width="1.1" stroke-linecap="round"/>
</svg>\n`
);

/* Sitemap and robots. A staging build asks robots to stay out entirely, so a
   pre-switchover copy can never compete with the live Squarespace site. */
const base = CONFIG.siteUrl.replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);
wrote(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    Object.keys(PAGES)
      .map(
        (p) =>
          `  <url>\n    <loc>${canonicalFor(p)}</loc>\n    <lastmod>${today}</lastmod>\n` +
          `    <priority>${p === "index.html" ? "1.0" : "0.8"}</priority>\n  </url>`
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

/* 404 works on GitHub Pages and most static hosts. */
wrote(
  "404.html",
  page(
    {
      page: "404.html",
      title: "Page not found | Zoe Life",
      description: "That page could not be found. Find Zoe Life resources, about, and contact here.",
    },
    `
<section class="hero">
  <div class="hero-texture" aria-hidden="true"></div>
  <div class="wrap">
    <p class="eyebrow">404</p>
    <h1>That page has moved on.</h1>
    <p class="lede">We could not find the page you were looking for. It may have been renamed,
      or the link may be out of date.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="index.html">Back to the home page</a>
      <a class="btn btn-secondary" href="contact.html">Contact Zoe Life</a>
    </div>
  </div>
</section>

<section class="band-deep">
  <div class="wrap">
    <h2>Try one of these.</h2>
    <div class="grid grid-3" style="margin-top:2rem">
      <div class="card"><h3>About</h3><p>The meaning of Zoe and the founders behind it.</p>
        <p class="card-link"><a href="about.html">Read about Zoe Life</a></p></div>
      <div class="card"><h3>Books and Resources</h3><p>Devotionals and journals for everyday faith.</p>
        <p class="card-link"><a href="books.html">Browse resources</a></p></div>
      <div class="card"><h3>Family Life</h3><p>Zoe Family Life and the wider Zoe Life programs.</p>
        <p class="card-link"><a href="family-life.html">Visit Family Life</a></p></div>
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
    `\nbooking url:         ${CONFIG.bookingUrl || "not set (button disabled)"}`
);
