/**
 * Zoe Life Phase 1 site checks. No dependencies.
 *   node tests/check-site.mjs
 *
 * Regression checks for the things most likely to go wrong on a client build:
 * broken links, missing labels, invented facts, exposed private addresses,
 * leftover stock, and forms that lie about succeeding.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html", "about.html", "books.html", "connect.html", "contact.html", "consult.html"];
const REDIRECTS = ["family-life.html", "appointments.html"];

let pass = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` :: ${detail}` : ""}`);
    console.log(`  FAIL ${name}${detail ? ` :: ${detail}` : ""}`);
  }
}

function group(title) {
  console.log(`\n${title}`);
}

const read = (f) => readFileSync(join(ROOT, f), "utf8");
const html = Object.fromEntries([...PAGES, ...REDIRECTS].map((p) => [p, read(p)]));
const js = read("js/main.js");
const css = read("css/style.css");

function visibleText(doc) {
  return doc
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
}

function headerOf(doc) {
  const start = doc.indexOf('<header class="site-header">');
  const end = doc.indexOf("<main id=\"main\">");
  return start >= 0 && end > start ? doc.slice(start, end) : "";
}

function footerOf(doc) {
  const start = doc.indexOf('<footer class="site-footer">');
  return start >= 0 ? doc.slice(start) : "";
}

function mainOf(doc) {
  const start = doc.indexOf('<main id="main">');
  const end = doc.indexOf("</main>");
  return start >= 0 && end > start ? doc.slice(start, end) : "";
}

function flattenValues(obj) {
  const out = [];
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") out.push(...flattenValues(v));
    else out.push(v);
  }
  return out;
}

/* ----------------------------------------------------------- structure -- */
group("Structure and SEO");

const titles = new Map();
const descs = new Map();

for (const p of PAGES) {
  const doc = html[p];
  const title = (doc.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const desc = (doc.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";

  check(`${p} has a title`, title.length > 10, title);
  check(`${p} has a meta description`, desc.length > 40, `${desc.length} chars`);
  titles.set(p, title);
  descs.set(p, desc);

  const h1s = doc.match(/<h1[\s>]/g) || [];
  check(`${p} has exactly one h1`, h1s.length === 1, `found ${h1s.length}`);

  check(`${p} has a main landmark`, /<main id="main">/.test(doc));
  check(`${p} has a skip link`, /class="skip-link"/.test(doc));
  check(`${p} has header and footer landmarks`, /<header class="site-header">/.test(doc) && /<footer class="site-footer">/.test(doc));
  check(`${p} declares lang`, /<html lang="en">/.test(doc));

  const levels = [...doc.matchAll(/<h([1-4])[\s>]/g)].map((m) => Number(m[1]));
  let skipped = null;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) skipped = `h${levels[i - 1]} then h${levels[i]}`;
  }
  check(`${p} heading order has no skipped level`, !skipped, skipped || "");
}

check("All page titles are unique", new Set(titles.values()).size === PAGES.length);
check("All meta descriptions are unique", new Set(descs.values()).size === PAGES.length);

/* ------------------------------------------------ deployability -------- */
group("Deployability");

const SITE = "https://www.zoelifehub.com";
for (const p of PAGES) {
  const doc = html[p];
  const canon = (doc.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  check(`${p} has a canonical URL`, !!canon && canon.startsWith(SITE), canon);
  check(`${p} declares og:url`, doc.includes(`<meta property="og:url"`));
}
const canons = PAGES.map((p) => (html[p].match(/rel="canonical" href="([^"]+)"/) || [])[1]);
check("Canonical URLs are unique per page", new Set(canons).size === PAGES.length);
check("Home canonical has no trailing filename", canons[0] === SITE + "/", canons[0]);

for (const f of ["404.html", "robots.txt", "sitemap.xml", "favicon.svg", "js/config.js"]) {
  check(`${f} is generated`, existsSync(join(ROOT, f)));
}

const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const isStaging = /noindex/.test(html["index.html"]);
if (isStaging) {
  check("Staging build disallows crawlers", /Disallow: \//.test(robots));
} else {
  check("Production build allows crawlers", /Allow: \//.test(robots));
  check("robots.txt points at the sitemap", robots.includes(`${SITE}/sitemap.xml`));
  check("Pages are indexable", PAGES.every((p) => /content="index, follow"/.test(html[p])));
}
check("Sitemap lists every page", PAGES.every((p) => sitemap.includes(canonicalOf(p))));
check("Sitemap omits moved-url stubs", !sitemap.includes("/family-life") && !sitemap.includes("/appointments"));
check("Sitemap is well formed", /^<\?xml/.test(sitemap) && /<\/urlset>/.test(sitemap));

const notFound = read("404.html");
check("404 page links home", /href="index\.html"/.test(notFound));
check("404 page has one h1", (notFound.match(/<h1[\s>]/g) || []).length === 1);

function canonicalOf(p) {
  return SITE + "/" + (p === "index.html" ? "" : p.replace(/\.html$/, ""));
}

for (const p of REDIRECTS) {
  check(`${p} exists as a moved-url page`, existsSync(join(ROOT, p)));
  check(`${p} has one h1`, (html[p].match(/<h1[\s>]/g) || []).length === 1);
}
check("family-life.html points to Connect", /href="connect\.html"/.test(html["family-life.html"]));
check("appointments.html points to Consult", /href="consult\.html"/.test(html["appointments.html"]));

/* --------------------------------------------------------------- links -- */
group("Links");

for (const p of [...PAGES, ...REDIRECTS]) {
  const doc = html[p];

  const internal = [...doc.matchAll(/href="(?!https?:|mailto:|#)([^"]+)"/g)].map((m) => m[1]);
  const broken = internal.filter((h) => !existsSync(join(ROOT, h.split("#")[0])));
  check(`${p} internal links all resolve`, broken.length === 0, broken.join(", "));

  const anchors = [...doc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  const missingAnchor = anchors.filter((a) => !doc.includes(`id="${a}"`));
  check(`${p} in-page anchors all have targets`, missingAnchor.length === 0, missingAnchor.join(", "));

  const ext = [...doc.matchAll(/<a[^>]*href="https?:[^"]*"[^>]*>/g)].map((m) => m[0]);
  const unsafe = ext.filter((a) => !/rel="noopener noreferrer"/.test(a));
  check(`${p} external links use rel=noopener noreferrer`, unsafe.length === 0, `${unsafe.length} missing`);

  const fake = (doc.match(/example\.(com|org)|lorem|TODO|FIXME|href="#"/gi) || []);
  check(`${p} has no placeholder or fake URLs`, fake.length === 0, fake.join(", "));
}

/* -------------------------------------------------------------- images -- */
group("Images");

for (const p of PAGES) {
  const imgs = [...html[p].matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((i) => !/\salt=/.test(i));
  check(`${p} every image has an alt attribute`, noAlt.length === 0, noAlt.join(" | "));

  const noDims = imgs.filter((i) => !/width=/.test(i) || !/height=/.test(i));
  check(`${p} images declare width and height`, noDims.length === 0, `${noDims.length} missing`);

  const named = imgs.filter((i) => /tayo|kemi|akinyemi/i.test(i));
  for (const img of named) {
    const alt = (img.match(/\salt="([^"]*)"/) || [])[1] || "";
    check(`Named photo alt includes Tayo or Kemi: ${alt.slice(0, 60)}`, /Tayo|Kemi/i.test(alt), alt);
  }
}

const allAssets = new Set();
for (const p of [...PAGES, ...REDIRECTS]) {
  for (const m of html[p].matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) allAssets.add(m[1]);
}
for (const m of css.matchAll(/url\(\.\.\/(assets\/[^)]+)\)/g)) allAssets.add(m[1]);
const missingAssets = [...allAssets].filter((a) => !existsSync(join(ROOT, a)));
check("All referenced assets exist", missingAssets.length === 0, missingAssets.join(", "));

const publishedHtml = PAGES.map((p) => html[p]).join("\n");
check("No Unsplash or Pexels assets", !/unsplash|pexels/i.test(publishedHtml + css));
check("No leftover stock filenames", !/hands-reaching|coaching-conversation|small-group-study|cream-plaster/i.test(publishedHtml));

/* --------------------------------------------------------------- forms -- */
group("Forms");

for (const p of PAGES) {
  const doc = html[p];
  const controls = [...doc.matchAll(/<(input|select|textarea)[^>]*>/g)].map((m) => m[0]);

  const noId = controls.filter((c) => !/\sid="/.test(c));
  check(`${p} every form control has an id`, noId.length === 0, `${noId.length} missing`);

  const ids = controls.map((c) => (c.match(/\sid="([^"]+)"/) || [])[1]).filter(Boolean);
  const unlabelled = ids.filter((id) => !doc.includes(`for="${id}"`));
  check(`${p} every form control has a label`, unlabelled.length === 0, unlabelled.join(", "));

  const required = controls.filter((c) => /\srequired/.test(c));
  const noDescribe = required.filter((c) => !/aria-describedby="/.test(c));
  check(`${p} required fields have aria-describedby`, noDescribe.length === 0, `${noDescribe.length} missing`);
}

const contact = html["contact.html"];
for (const opt of [
  "Coaching",
  "Speaking Engagement",
  "Workshop / Group Session",
  "Academic or Career Support",
  "Books &amp; Resources",
  "Collaboration / Partnership",
  "General Inquiry",
  "Other",
]) {
  check(`Contact reason option present: ${opt}`, contact.includes(`>${opt}<`) || contact.includes(`value="${opt}"`));
}
check("Contact form has a conditional Other field", /data-reveal="Other"/.test(contact));
check("Contact form has a honeypot", /name="website"/.test(contact));
check("Contact form includes first, last, email, phone, message",
  ["c-first", "c-last", "c-email", "c-phone", "c-message"].every((id) => contact.includes(`id="${id}"`)));
check("Contact form is separate from consultation booking",
  /data-form="contact"/.test(contact) && existsSync(join(ROOT, "consult.html")));
check("Subscribe forms are email-only",
  ![...publishedHtml.matchAll(/data-form="subscribe"[\s\S]*?<\/form>/g)].some((m) => /type="tel"|name="phone"/.test(m[0])));

/* ------------------------------------------------------------- honesty -- */
group("Honesty and safety");

check("Success is only rendered from renderSent", (js.match(/renderSent\(/g) || []).length >= 1);
check(
  "renderSent is called only inside a res.ok branch",
  /if \(res\.ok\) \{\s*renderSent\(/.test(js),
  "renderSent must be guarded by res.ok"
);
check(
  "Submission is attempted only when an endpoint is configured",
  /if \(!endpoint\) \{[\s\S]{0,200}renderBlocked/.test(js)
);
check("Blocked state is explicit", /not been delivered|not been sent|have not been subscribed/i.test(js));
check("Failure is never dressed as success", /renderFailed[\s\S]{0,400}did not send/i.test(js));

const cfg = read("js/config.js");
check("config.js exists and defines ZOE_CONFIG", /window\.ZOE_CONFIG\s*=/.test(cfg));
const cfgObj = JSON.parse(cfg.slice(cfg.indexOf("{"), cfg.lastIndexOf("}") + 1));
for (const k of ["formEndpoint", "newsletterEndpoint", "bookingUrl"]) {
  check(`config.${k} is present`, k in cfgObj);
}
check("config.payments is present", cfgObj.payments && typeof cfgObj.payments === "object");
check(
  "No placeholder endpoint was invented",
  flattenValues(cfgObj).every((v) => v === null || /^https:\/\//.test(String(v))),
  JSON.stringify(cfgObj)
);

check(
  "No Zoe Life email address is exposed",
  !/[a-z0-9._%+-]+@zoelifehub\.com/i.test(publishedHtml),
  (publishedHtml.match(/[a-z0-9._%+-]+@zoelifehub\.com/i) || [])[0]
);
check("No mailto links", !/mailto:/i.test(publishedHtml));
check("No private backend addresses", !/@yahoo\.com|@gmail\.com/i.test(publishedHtml));
check("No prices are stated", !/\$\s?\d|USD\s?\d|\d+\.\d{2}\s?(?:USD|dollars)/i.test(visibleText(publishedHtml)));
check("KingsWord is not listed as a client", !/kingsword/i.test(publishedHtml));

const booksDoc = html["books.html"];
check("No invented storefront URLs", !/amazon\.com|etsy\.com|gumroad\.com|selar\.co/i.test(booksDoc));
check("No leftover Link pending chips", !/Link pending/.test(booksDoc));
check("No Cover pending placeholder", !/Cover pending/.test(booksDoc));
check("Devotional cover is present", /assets\/books\/gratitude-devotional-cover\.jpg/.test(booksDoc));
check("Journal cover is present", /assets\/books\/gratitude-journal-cover\.jpg/.test(booksDoc));
check("Purchase options are fail-closed when unconfigured", /Purchase options coming/.test(booksDoc) || /Pay with Stripe/.test(booksDoc));
check("No couple workbook", !/Questions Every Christian Couple|questions-before-marriage/i.test(publishedHtml));
check("Books page has both Saturday titles",
  /A 7-Day Gratitude Devotional/.test(booksDoc) && /A 100-Day Gratitude Journal/.test(booksDoc));

const consult = html["consult.html"];
if (!cfgObj.bookingUrl) {
  check("Consult shows GOOGLE_CALENDAR_BOOKING_URL placeholder", /GOOGLE_CALENDAR_BOOKING_URL/.test(consult));
} else {
  check("Consult booking uses a live https URL", consult.includes(cfgObj.bookingUrl));
}
check(
  "No leftover Acuity sales copy",
  !/Ready for a Breakthrough|secure your slot|direct transformation/i.test(publishedHtml)
);

/* --------------------------------------------------------------- brand -- */
group("Brand structure");

const TAGLINE = "Helping people thrive in every season of life.";
check("Tagline appears on Home as a sentence", html["index.html"].includes(TAGLINE));
check("Tagline appears on About", html["about.html"].includes(TAGLINE));
check("Tagline is not inside the logo alt", !/alt="[^"]*Thrive[^"]*"/.test(publishedHtml));
const indexHeader = headerOf(html["index.html"]);
check("Header uses the banner wordmark", /class="brand-wordmark"[^>]*src="assets\/brand\/zoe-life-wordmark\.jpg"/.test(html["index.html"]));
check("Header does not use the circular mark as the logo", !indexHeader.includes("zoe-life-mark.png"));
check("Footer uses the circular mark", footerOf(html["index.html"]).includes("assets/brand/zoe-life-mark.png"));

check("Header has no cart", !/\(0\)|\bCart\b|\bLogin\b|\bAccount\b/i.test(indexHeader));
check("Primary CTA is the 20-minute consultation", /Schedule a complimentary 20-minute consultation/.test(indexHeader));

const navBlock = html["index.html"].match(/<nav class="site-nav"[\s\S]*?<\/nav>/)[0];
for (const label of ["Home", "About", "Books &amp; Resources", "Connect", "Contact"]) {
  check(`Main nav includes ${label}`, navBlock.includes(`>${label}<`));
}
check("Family Life is not a main nav label", !/>Family Life</.test(navBlock));

check("Home shows Pastors Tayo and Kemi", /tayo-kemi-full\.jpg/.test(html["index.html"]));
check("About shows Pastors Tayo and Kemi", /tayo-kemi-about\.jpg/.test(html["about.html"]));
check("Consult shows Pastors Tayo and Kemi", /tayo-kemi-full\.jpg/.test(consult));
check("Contact shows Pastor Kemi", /kemi-white\.jpg/.test(contact));

const ZOE_LIFE = ["facebook.com/zoelifehub", "instagram.com/zoelifehub", "tiktok.com/@zoelifehub1", "youtube.com/@zoelifehub1", "x.com/zoelifehub"];
const ZFL = ["facebook.com/zoefamilylife10", "instagram.com/zoefamilylife", "tiktok.com/@zoefamilylife", "youtube.com/@zoefamilylife"];

for (const p of PAGES) {
  const footer = footerOf(html[p]);
  for (const s of ZOE_LIFE) check(`${p} footer links Zoe Life ${s.split("/")[0]}`, footer.includes(s));
  const zflInFooter = ZFL.filter((s) => footer.includes(s));
  check(`${p} footer does NOT use Zoe Family Life accounts`, zflInFooter.length === 0, zflInFooter.join(", "));
}

const connectMain = mainOf(html["connect.html"]);
check("Connect introduces Zoe Life before Zoe Family Life",
  connectMain.indexOf("The main accounts") < connectMain.indexOf("Zoe Family Life") && connectMain.indexOf("The main accounts") >= 0);
for (const s of ZFL) check(`Connect page links ${s}`, html["connect.html"].includes(s));
check("Zoe Family Life X absence is stated", /No X account for Zoe Family Life/.test(html["connect.html"]));

check("Subscribe intro copy is present",
  publishedHtml.includes("Subscribe to receive encouragement, updates, and helpful resources from Zoe Life."));
check("Subscribe consent copy is present",
  publishedHtml.includes("I agree to receive emails and other communications, including marketing, from Zoe Life."));

/* ------------------------------------------------------------ styling -- */
group("Visual direction");

check("No dark page theme", !/--ink:\s*#(?:0|1|2)[0-9a-f]{5}\b/i.test(css) || /--cream:\s*#F/i.test(css));
check("Background is a light cream", /--cream:\s*#F7F4EE/i.test(css) && /--paper:\s*#F7F4EE/i.test(css));
check("Palette includes grey, tan, and peach", /--grey:\s*#E6E1DA/i.test(css) && /--tan:\s*#E4D3B8/i.test(css) && /--peach:\s*#F3D5B8/i.test(css));
check("theme-color is Instagram grey", PAGES.every((p) => /<meta name="theme-color" content="#E6E1DA">/.test(html[p])));
check("Reduced motion is respected", /prefers-reduced-motion:\s*reduce/.test(css));
check("Focus is visible", /:focus-visible/.test(css) && /outline:\s*3px/.test(css));
check("Type pairing is Fraunces and Outfit", /font-family: Fraunces/.test(css) && /font-family: Outfit/.test(css));
check("No Inter or Roboto as the only sans", !/--sans:\s*Inter|--sans:\s*Roboto/.test(css));

const scriptSrcs = [...publishedHtml.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
check(
  "No WebGL or heavy animation libraries loaded",
  !scriptSrcs.some((s) => /three|gsap|lenis|scrolltrigger/i.test(s)),
  scriptSrcs.join(", ")
);
check(
  "Only local site scripts are loaded",
  scriptSrcs.every((s) => s === "js/main.js" || s === "js/config.js"),
  scriptSrcs.join(", ")
);
check("Tap targets are at least 44px", /min-height:\s*4[48]px/.test(css));

for (const p of PAGES) {
  const text = visibleText(html[p]);
  const dashes = text.match(/[—–]/g) || [];
  check(`${p} has no em or en dashes in visible copy`, dashes.length === 0, `${dashes.length} found`);
}

/* ----------------------------------------------------------- contrast -- */
group("Colour contrast (WCAG 2.1)");

function srgb(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`token --${name} not found in css/style.css`);
  return m[1];
};

const T = {
  cream: token("cream"),
  creamDeep: token("cream-deep"),
  grey: token("grey"),
  tan: token("tan"),
  peach: token("peach"),
  sun: token("sun"),
  white: token("white"),
  goldDeep: token("gold-deep"),
  sageDeep: token("sage-deep"),
  terracotta: token("terracotta"),
  ink: token("ink"),
  inkSoft: token("ink-soft"),
};

const PAIRS = [
  ["body text on cream", T.ink, T.cream, 4.5],
  ["body text on cream-deep", T.ink, T.creamDeep, 4.5],
  ["body text on grey", T.ink, T.grey, 4.5],
  ["body text on tan", T.ink, T.tan, 4.5],
  ["body text on peach", T.ink, T.peach, 4.5],
  ["body text on sun", T.ink, T.sun, 4.5],
  ["muted text on cream", T.inkSoft, T.cream, 4.5],
  ["muted text on cream-deep", T.inkSoft, T.creamDeep, 4.5],
  ["muted text on grey", T.inkSoft, T.grey, 4.5],
  ["muted text on tan", T.inkSoft, T.tan, 4.5],
  ["muted text on peach", T.inkSoft, T.peach, 4.5],
  ["muted text on sun", T.inkSoft, T.sun, 4.5],
  ["muted text on white", T.inkSoft, T.white, 4.5],
  ["link sage-deep on cream", T.sageDeep, T.cream, 4.5],
  ["link sage-deep on white", T.sageDeep, T.white, 4.5],
  ["eyebrow gold-deep on cream", T.goldDeep, T.cream, 4.5],
  ["eyebrow gold-deep on cream-deep", T.goldDeep, T.creamDeep, 4.5],
  ["eyebrow gold-deep on grey", T.goldDeep, T.grey, 4.5],
  ["eyebrow gold-deep on tan", T.goldDeep, T.tan, 4.5],
  ["eyebrow gold-deep on peach", T.goldDeep, T.peach, 4.5],
  ["eyebrow gold-deep on sun", T.goldDeep, T.sun, 4.5],
  ["eyebrow gold-deep on white", T.goldDeep, T.white, 4.5],
  ["tagline terracotta on cream", T.terracotta, T.cream, 4.5],
  ["tagline terracotta on cream-deep", T.terracotta, T.creamDeep, 4.5],
  ["pending badge text on peach tint", T.terracotta, "#FBEDE2", 4.5],
  ["error text on cream", "#8A3E17", T.cream, 4.5],
  ["white text on sage-deep band", "#F6F4EE", T.sageDeep, 4.5],
  ["primary button label", T.white, T.sageDeep, 4.5],
  ["focus ring on cream", T.sageDeep, T.cream, 3],
];

for (const [name, fg, bg, min] of PAIRS) {
  const r = ratio(fg, bg);
  check(`${name} (${r.toFixed(2)}:1, needs ${min}:1)`, r >= min);
}

/* ---------------------------------------------------------------- done -- */
console.log(`\n${"=".repeat(60)}`);
if (failures.length) {
  console.log(`FAILED: ${failures.length} check(s), ${pass} passed\n`);
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
console.log(`PASSED: all ${pass} checks`);
