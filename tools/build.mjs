/**
 * Zoe Life Phase 1 page builder (Meeting 3).
 *
 * Shared chrome + per-page content. Re-run with:  node tools/build.mjs
 * Staging:  node tools/build.mjs --staging
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STAGING = process.argv.includes("--staging") || process.env.ZOE_STAGING === "1";

const CONFIG = {
  siteUrl: process.env.ZOE_SITE_URL || "https://www.zoelifehub.com",
  formEndpoint: process.env.ZOE_FORM_ENDPOINT || null,
  newsletterEndpoint: process.env.ZOE_NEWSLETTER_ENDPOINT || null,
  bookingUrl: process.env.ZOE_GOOGLE_CALENDAR_BOOKING_URL || process.env.ZOE_BOOKING_URL || null,
  payments: {
    devotional: {
      stripe: process.env.ZOE_STRIPE_DEVOTIONAL_URL || null,
      paypal: process.env.ZOE_PAYPAL_DEVOTIONAL_URL || null,
    },
    journal: {
      stripe: process.env.ZOE_STRIPE_JOURNAL_URL || null,
      paypal: process.env.ZOE_PAYPAL_JOURNAL_URL || null,
    },
  },
  staging: STAGING,
};

const TAGLINE = "Helping people thrive in every season of life.";
const MISSION =
  "Zoe Life equips individuals, couples, families, churches, and organizations with " +
  "biblical truth, practical wisdom, and Christ-centered resources to help them thrive " +
  "in every season of life.";
const MESSAGE_CTA = "Send a message";
const MESSAGE_HREF = "contact.html#message";
const CONSULT_CTA = "Schedule a complimentary 20-minute consultation";
const CONSULT_HREF = "consult.html";
const SUBSCRIBE_INTRO =
  "Subscribe to receive encouragement, updates, and helpful resources from Zoe Life.";
const CONSENT =
  "I agree to join Zoe Life's mailing list. My email address will be sent through FormSubmit, " +
  "a service provider, for delivery to Zoe Life and may be retained by FormSubmit for up to 30 days. " +
  "Zoe Life will use it for updates, and I can unsubscribe at any time.";

const BOOKS_INTRO =
  "At Zoe Life, we create faith-centered, practical resources to encourage growth, " +
  "strengthen your walk with God, and provide support for the different areas and seasons of life. " +
  "Explore our current books and resources below, with more to come.";

const DEVOTIONAL_SUB = "Cultivating a Lifestyle of Thanksgiving to God";
const JOURNAL_SUB = "Cultivating a Lifestyle of Thanksgiving to God";

const DEVOTIONAL_BLURB = [
  "Gratitude is more than an occasional response to God's blessings. It is a way of life rooted in recognizing who God is, remembering His goodness, and responding to Him with thanksgiving.",
  "The 7-Day Gratitude Devotional invites you to explore the biblical foundation of gratitude through seven days of Scripture, reflection, prayer, and practical application. Each day provides an opportunity to pause, reflect on God's faithfulness, and intentionally cultivate a heart of thanksgiving.",
  "Whether you use it during your daily Bible reading, prayer time, or personal reflection, this devotional is designed to help you grow in gratitude and make thanksgiving an intentional part of your walk with God.",
];

const JOURNAL_BLURB = [
  "Gratitude grows when we intentionally pause to recognize and remember God's goodness.",
  "A 100-Day Gratitude Journal provides a dedicated space to pause, remember God's goodness, record the ways He has been faithful, and respond to Him with heartfelt thanksgiving.",
  "Whether you use it during your daily Bible reading, prayer time, or personal reflection, this journal encourages you to develop a consistent practice of gratitude. Over the course of 100 days, your entries can become more than individual reflections. Together, they create a meaningful record of blessings, answered prayers, reflections, and reminders of God's faithfulness along the way.",
];

const COLLECTION_COPY = [
  "The 7-Day Gratitude Devotional and A 100-Day Gratitude Journal were created to complement one another while also being valuable as individual resources. Begin with the 7-Day Gratitude Devotional, then continue with the journal. You can begin with either resource or use them together.",
];

const COMING_SOON =
  "We are continuing to develop faith-centered, practical resources. Check back for new books, workbooks, guides, and other resources from Zoe Life.";

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

const NAV = [
  ["index.html", "Home"],
  ["about.html", "About"],
  ["books.html", "Books &amp; Resources"],
  ["connect.html", "Connect"],
  ["contact.html", "Contact"],
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

const payButtons = (book) => {
  const p = CONFIG.payments[book];
  const buttons = [];
  if (p.stripe) {
    buttons.push(
      `<a class="btn btn-primary" href="${p.stripe}" target="_blank" rel="noopener noreferrer">Pay with Stripe<span class="visually-hidden">, opens in a new tab</span></a>`
    );
  }
  if (p.paypal) {
    buttons.push(
      `<a class="btn btn-secondary" href="${p.paypal}" target="_blank" rel="noopener noreferrer">Pay with PayPal<span class="visually-hidden">, opens in a new tab</span></a>`
    );
  }
  if (!buttons.length) {
    return `<p class="purchase-coming">Purchase options coming. Stripe and PayPal checkout will appear here once Zoe Life publishes live payment links. Printed copies will be fulfilled by a print-on-demand partner. Zoe Life is not packing and shipping orders from home.</p>`;
  }
  return `<div class="pay-row">${buttons.join("")}</div>
        <p class="format-meta">Printed copies, when offered, will be fulfilled by a print-on-demand partner.</p>`;
};

const bookingBlock = () =>
  CONFIG.bookingUrl
    ? `<div class="btn-row">
          <a class="btn btn-primary" href="${CONFIG.bookingUrl}" target="_blank" rel="noopener noreferrer">${CONSULT_CTA}<span class="visually-hidden">, Google Calendar, opens in a new tab</span></a>
        </div>
        <p class="format-meta">Booking uses Google Calendar appointment scheduling on the Zoe Life Workspace calendar.</p>`
    : `<div class="booking-placeholder">
          <p>Complimentary 20-minute consultations will open here for Mondays and Wednesdays, 6:00 to 8:00 PM Central. Until booking is live, send us a message and we will arrange a time.</p>
          <div class="btn-row">
            <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
          </div>
        </div>`;

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
<meta name="theme-color" content="#E6E1DA">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Zoe Life">
<meta property="og:url" content="${canonicalFor(page)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${CONFIG.siteUrl.replace(/\/$/, "")}/assets/photos/tayo-kemi-about.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/brand/zoe-life-mark.png">
<link rel="preload" href="fonts/fraunces-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/outfit-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/style.css">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-R18R3LVBK9"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-R18R3LVBK9');
</script>
<script src="js/config.js"></script>
</head>
<body data-page="${page}">
<a class="skip-link" href="#main">Skip to main content</a>`;

const header = (current) => `
<header class="site-header">
  <div class="wrap-wide header-inner">
    <a class="brand" href="index.html">
      <img class="brand-wordmark" src="assets/brand/zoe-life-wordmark.png" alt="Zoe Life" width="220" height="45">
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
        <li class="nav-cta"><a href="${MESSAGE_HREF}">${MESSAGE_CTA}</a></li>
      </ul>
    </nav>
    <a class="btn btn-primary header-cta" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
  </div>
</header>
<main id="main">`;

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

const footer = () => `
</main>
<footer class="site-footer">
  <div class="wrap-wide">
    <div class="footer-top">
      <img class="footer-wordmark" src="assets/brand/zoe-life-wordmark.png" alt="" width="220" height="45">
      <p class="footer-tagline">${TAGLINE}</p>
    </div>
    <div class="footer-grid">

      <nav class="footer-nav" aria-label="Footer">
        <h2 class="footer-h">Explore</h2>
        <ul>
${NAV.map(([href, label]) => `          <li><a href="${href}">${label}</a></li>`).join("\n")}
          <li><a href="${MESSAGE_HREF}">${MESSAGE_CTA}</a></li>
          <li><a href="${CONSULT_HREF}">Complimentary consultation</a></li>
        </ul>
      </nav>

      <div class="footer-social">
        <h2 class="footer-h">Social</h2>
        ${socialList(ZOE_LIFE_SOCIALS, "Zoe Life")}
      </div>

      <div class="footer-subscribe">
        <h2 class="footer-h footer-h-lead">Stay in Touch</h2>
${subscribeForm("footer", true)}
      </div>

    </div>
    <div class="footer-bottom">
      <p>&copy; <span data-year>2026</span> Zoe Life. All rights reserved.</p>
      <p>Founded by Pastor Kemi and Pastor Tai.</p>
    </div>
  </div>
</footer>
<script src="js/main.js"></script>
</body>
</html>
`;

const page = (meta, body) => head(meta) + header(meta.page) + body + footer();

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
      "Zoe Life equips individuals, couples, families, churches, and organizations with biblical truth, practical wisdom, and Christ-centered resources.",
  },
  `
<section class="hero-home">
  <div class="hero-split wrap-wide">
    <div class="hero-copy">
      <p class="eyebrow">Zoe Life</p>
      <h1 class="tagline-heading"><span>Helping people thrive</span> <span>in every season of life.</span></h1>
      <p class="lede">${MISSION}</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
        <a class="btn btn-primary" href="books.html">Explore books and resources</a>
      </div>
    </div>
    <figure class="hero-photo">
      <img src="assets/photos/tayo-kemi-hero.jpg"
           alt="Pastor Tai and Pastor Kemi Akinyemi standing together outdoors, smiling."
           width="1240" height="960">
    </figure>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">A word from us</p>
      <h2>You don't have to do life by yourself.</h2>
    <p>We care about people. This is a place to start a conversation, pick up a resource, and keep going, whether you already walk with God or you are simply looking for a little more hope in an ordinary season. The message stays the same. You don't have to do life alone.</p>
    <p><a href="about.html">Read more about Zoe Life</a></p>
  </div>
</section>

<section class="band-tan">
  <div class="wrap">
    <div class="split split-copy-photo">
      <div>
        <p class="eyebrow">Pastor Tai and Pastor Kemi</p>
        <h2>Zoe Life was founded by Pastor Kemi and Pastor Tai.</h2>
        <p>We start with Scripture, then talk about what it means for the decisions, relationships, and seasons you are actually in. Biblical and practical, in the same breath.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="about.html">Meet Tayo and Kemi</a>
        </div>
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-about.jpg"
             alt="Pastor Tai and Pastor Kemi Akinyemi standing together outdoors."
             width="1000" height="1250" loading="lazy">
      </figure>
    </div>
  </div>
</section>

<section class="band-grey" id="resources">
  <div class="wrap">
    <p class="eyebrow">Books and resources</p>
    <h2>Resources to help you thrive.</h2>
    <p class="lede">Start with 7 days. Keep going for 100. More to come.</p>

    <div class="book-tease" style="margin-top:2.4rem">
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

    <div class="book-tease" style="margin-top:2.75rem">
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
</section>

<section class="band-peach" id="connect">
  <div class="wrap">
    <p class="eyebrow">A next step</p>
    <h2>Start with a conversation.</h2>
    <p class="lede">Send us a message to connect. We would love to hear from you.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="${MESSAGE_HREF}">${MESSAGE_CTA}</a>
    </div>
    <hr>
    <div class="split">
      <div>
        <h3>Stay in Touch</h3>
        <p>${SUBSCRIBE_INTRO}</p>
      </div>
      <div class="form-card">
${subscribeForm("home", false)}
      </div>
    </div>
    <p class="consult-aside">If you would like a short call, you can also schedule a complimentary 20-minute consultation. Mondays and Wednesdays, 6:00 to 8:00 PM Central.</p>
    <div class="btn-row">
      <a class="btn btn-secondary" href="${CONSULT_HREF}">${CONSULT_CTA}</a>
    </div>
  </div>
</section>
`
);

const about = page(
  {
    page: "about.html",
    title: "About Zoe Life | Pastor Kemi and Pastor Tai",
    description:
      "Zoe Life was founded by Pastor Kemi and Pastor Tai. A place to start a conversation, pick up a resource, and keep going.",
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
        <p>Zoe Life was founded by Pastor Kemi and Pastor Tai.</p>
        <p>The name <em>Zoe</em> comes from the Greek word used in John 10:10 for the abundant life Jesus came to give. That is the heart of this work, said in ordinary language: helping people thrive in every season of life.</p>
        <p>You don't have to do life by yourself. We care about people, and we want this to be a place where you can start a conversation, pick up a resource, and keep going, whether you already walk with God or you are simply looking for a little more hope.</p>
        <p>We believe biblical truth is not boxed into one corner of life. It gives wisdom for relationships, family, school, work, and the questions that show up on ordinary days.</p>
        <p>Every season has room to grow. Some seasons also bring questions, transitions, and hard days that are easier to walk through with encouragement and practical support.</p>
        <p>Through books and resources, speaking, workshops, and personal conversations, Zoe Life seeks to encourage individuals, couples, families, students, and professionals with biblical principles and tools they can use in everyday life.</p>
        <p>We start with Scripture, then talk about what it means for the life you are actually living. Every person's journey is different. Our desire is to meet people where they are and help them move forward with wisdom, faith, and purpose.</p>
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-about.jpg"
             alt="Pastor Tai and Pastor Kemi Akinyemi standing together outdoors."
             width="1000" height="1250">
        <figcaption>Pastor Tai and Pastor Kemi, founders of Zoe Life.</figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="band-tan">
  <div class="wrap">
    <div class="grid grid-2">
      <div>
        <p class="eyebrow">Mission</p>
        <h2>What we are here for.</h2>
        <p>${MISSION}</p>
        <p>We start with what Scripture says, then talk it through in spoken English for real decisions, real relationships, and real seasons.</p>
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
      <div class="value"><h3>Christ-centered</h3><p>Jesus Christ is the foundation of everything we do. We desire that every resource, conversation, and opportunity to serve points people toward Him.</p></div>
      <div class="value"><h3>Biblical truth</h3><p>God's Word is our final authority. We seek to faithfully understand, teach, and apply Scripture in ways that are both biblically sound and practically relevant.</p></div>
      <div class="value"><h3>Practical wisdom</h3><p>Knowledge is most valuable when it is applied. We are committed to guidance that helps people live out biblical principles in everyday life.</p></div>
      <div class="value"><h3>Excellence</h3><p>We seek to honor God by pursuing excellence in our work, our relationships, our communication, and the resources we create.</p></div>
      <div class="value"><h3>Integrity</h3><p>We desire to serve with honesty, humility, transparency, and faithfulness, reflecting the character of Christ in all we do.</p></div>
      <div class="value"><h3>Compassion</h3><p>Every person has a unique story. We strive to serve with grace, patience, understanding, and genuine care.</p></div>
      <div class="value"><h3>Stewardship</h3><p>We believe every gift, opportunity, and resource entrusted to us should be managed faithfully for God's glory and the benefit of others.</p></div>
      <div class="value"><h3>Growth</h3><p>Spiritual maturity is a lifelong journey. Our desire is to encourage continual growth in faith, wisdom, character, and service.</p></div>
    </div>
  </div>
</section>

<section class="band-grey" id="meet">
  <div class="wrap">
    <p class="eyebrow">Meet Tayo and Kemi</p>
    <h2>Pastor Tai and I.</h2>
    <figure class="portrait portrait-couple" style="margin:1.75rem 0 2rem;max-width:34rem">
      <img src="assets/photos/tayo-kemi-park.jpg"
           alt="Pastor Tai and Pastor Kemi Akinyemi sitting together outdoors, smiling."
           width="1400" height="1866" loading="lazy">
      <figcaption>Pastor Tai and Pastor Kemi Akinyemi.</figcaption>
    </figure>
    <p>Tayo and Kemi Akinyemi are husband and wife, and the founders of Zoe Life. They share a passion for helping people grow and thrive. Their work is shaped not only by what they have studied and taught, but also by what they have lived.</p>
    <p>They also serve as pastors at Life Springs Church. Through Zoe Life they bring together their faith, their work, years of teaching and mentoring, and lessons learned through marriage, parenting, and everyday life.</p>
    <div class="headshot-pair" style="margin:2rem 0 0">
      <figure class="portrait">
        <img src="assets/photos/tayo-headshot.jpg"
             alt="Portrait of Pastor Tayo Akinyemi of Zoe Life."
             width="900" height="1350" loading="lazy">
        <figcaption>Pastor Tayo Akinyemi</figcaption>
      </figure>
      <figure class="portrait">
        <img src="assets/photos/kemi-headshot.jpg"
             alt="Portrait of Pastor Kemi Akinyemi of Zoe Life."
             width="1200" height="1800" loading="lazy">
        <figcaption>Pastor Kemi Akinyemi</figcaption>
      </figure>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <p class="eyebrow">Statement of faith</p>
    <h2>Grounded in historic Christian faith.</h2>
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
  </div>
</section>

<section class="band-peach">
  <div class="wrap">
    <p class="eyebrow">Where next</p>
    <h2>We would be glad to connect.</h2>
    <p>Send us a message if you are looking for resources, considering Tayo and Kemi for a speaking engagement or workshop, or simply want to say hello.</p>
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
    title: "Books and Resources | Zoe Life",
    description:
      "A 7-Day Gratitude Devotional and A 100-Day Gratitude Journal by Kemi Akinyemi. Biblical, practical gratitude resources from Zoe Life.",
  },
  `
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Books and Resources</p>
    <h1>Resources to help you thrive.</h1>
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
      </div>
    </div>
  </div>
</section>

<section id="journal" class="band-grey">
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
      </div>
    </div>
  </div>
</section>

<section class="band-tan" id="collection">
  <div class="wrap">
    <p class="eyebrow">Gratitude Collection</p>
    <h2>A Gratitude package, made to work together.</h2>
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
             alt="Pastor Tai and Pastor Kemi Akinyemi sitting together outdoors, smiling."
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
      <p>Zoe Family Life is part of Zoe Life, with a particular focus on relationships, marriage, parenting, and family life. Follow along here.</p>
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
    <p class="lede">Start with a conversation. We would love to hear from you.</p>
  </div>
</section>

<section id="message">
  <div class="wrap">
    <div class="split split-wide-left" style="align-items:start">
      <div>
        <h2>Send a message</h2>
        <p>Tell us a little about how we can help, and we will get back to you.</p>

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
              <label for="c-honey">Leave this field empty</label>
              <input type="text" id="c-honey" name="_honey" tabindex="-1" autocomplete="off">
            </div>

            <button class="btn btn-primary" type="submit">Send message</button>
            <p class="reply-note">Please expect a reply within three business days.</p>
            <div class="note">
              <p><strong>Message delivery.</strong> Messages are sent through FormSubmit for delivery to the Zoe Life team.</p>
            </div>
            <div class="form-status" data-status role="status" aria-live="polite"></div>
          </form>
        </div>
      </div>

      <aside>
        <figure class="portrait portrait-couple">
          <img src="assets/photos/tayo-kemi-park.jpg"
               alt="Pastor Tai and Pastor Kemi Akinyemi sitting together outdoors, smiling."
               width="1400" height="1866" loading="lazy">
        </figure>
        <div class="form-card" style="margin-top:1.25rem">
          <h3>Stay in Touch</h3>
          <p>${SUBSCRIBE_INTRO}</p>
${subscribeForm("contact", false)}
        </div>
        <p class="consult-aside">If you would like a short call, you can also schedule a complimentary 20-minute consultation. It is a separate booking, not this form.</p>
        <p class="card-link"><a class="btn btn-secondary" href="${CONSULT_HREF}">${CONSULT_CTA}</a></p>
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
    <p class="lede">No cost and no deposit. A short call to understand where you are and whether Zoe Life can help.</p>
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
      </div>
      <figure class="portrait portrait-couple">
        <img src="assets/photos/tayo-kemi-hero.jpg"
             alt="Pastor Tai and Pastor Kemi Akinyemi standing together outdoors, smiling."
             width="1240" height="960">
      </figure>
    </div>
  </div>
</section>
`
);

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
  "connect.html": connect,
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
  writeFileSync(join(ROOT, name), body, "utf8");
  console.log(`wrote ${name.padEnd(22)} ${String(body.length).padStart(6)} bytes`);
};

for (const [name, html] of Object.entries(PAGES)) wrote(name, html);

wrote(
  "js/config.js",
  `/* Generated by tools/build.mjs. Do not edit by hand. */\n` +
    `window.ZOE_CONFIG = ${JSON.stringify(
      {
        formEndpoint: CONFIG.formEndpoint,
        newsletterEndpoint: CONFIG.newsletterEndpoint,
        bookingUrl: CONFIG.bookingUrl,
        payments: CONFIG.payments,
      },
      null,
      2
    )};\n`
);

wrote(
  "favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#F7F4EE"/>
  <circle cx="16" cy="16" r="11.5" fill="none" stroke="#C9A44A" stroke-width="1.6"/>
  <path d="M16 22c-3.2 0-5.6-2.4-5.6-5.6C10.4 12.6 13.6 9.6 16 8c2.4 1.6 5.6 4.6 5.6 8.4 0 3.2-2.4 5.6-5.6 5.6z" fill="#4F6B45"/>
  <path d="M16 9.5v12" stroke="#F7F4EE" stroke-width="1.1" stroke-linecap="round"/>
</svg>\n`
);

const base = CONFIG.siteUrl.replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);
const sitemapPages = ["index.html", "about.html", "books.html", "connect.html", "contact.html", "consult.html"];
wrote(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapPages
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
    <h1>That page has moved on.</h1>
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
      Object.values(CONFIG.payments).some((p) => p.stripe || p.paypal)
        ? "at least one live link"
        : "purchase options coming"
    }`
);
