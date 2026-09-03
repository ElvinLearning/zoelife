/**
 * Zoe Life Phase 1 site checks. No dependencies.
 *   node tests/check-site.mjs
 *
 * Regression checks for the things most likely to go wrong on a client build:
 * broken links, missing labels, invented facts, misleading privacy claims,
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
const allHtmlPages = { ...html, "404.html": read("404.html") };
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
check("Contact form has a provider-recognized honeypot", /name="_honey"/.test(contact));
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
  "renderSent requires an accepted provider response",
  /providerAccepted\(payload\)[\s\S]{0,200}renderSent\(/.test(js),
  "HTTP 2xx alone must not be treated as delivery"
);
check(
  "Provider responses are parsed before success",
  /res[\s\S]{0,80}\.json\(\)[\s\S]{0,500}providerAccepted\(payload\)/.test(js) &&
    /function providerAccepted\(payload\)[\s\S]{0,180}payload\.success/.test(js)
);
check("Contact messages set a reply-to address", /data\.set\("_replyto"/.test(js));
check("Contact and subscribe messages identify their form type", /data\.set\("form_type"/.test(js));
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
const FORM_ENDPOINT = "https://formsubmit.co/ajax/contact@zoelifehub.com";
const BOOKING_URL = "https://calendar.app.google/Uj9v44HE72kJrKz8A";
check("Contact form targets the Zoe Life inbox", cfgObj.formEndpoint === FORM_ENDPOINT);
check("Mailing list targets the Zoe Life inbox", cfgObj.newsletterEndpoint === FORM_ENDPOINT);
check("Consult uses the approved Google Calendar link", cfgObj.bookingUrl === BOOKING_URL);
check("config.payments is present", cfgObj.payments && typeof cfgObj.payments === "object");
check(
  "No placeholder endpoint was invented",
  flattenValues(cfgObj).every((v) => v === null || /^https:\/\//.test(String(v))),
  JSON.stringify(cfgObj)
);

check(
  "No direct Zoe Life email address appears in visible page copy",
  !/[a-z0-9._%+-]+@zoelifehub\.com/i.test(visibleText(publishedHtml)),
  (publishedHtml.match(/[a-z0-9._%+-]+@zoelifehub\.com/i) || [])[0]
);
check("Contact copy names FormSubmit delivery", /Messages are sent through FormSubmit for delivery to the Zoe Life team\./.test(contact));
check("Contact copy makes no email-publication claim", !/does not publish (?:its )?email addresses/i.test(contact));
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
  check("Consult does not show an internal booking placeholder", !/GOOGLE_CALENDAR_BOOKING_URL/.test(consult));
  check("Unconfigured consult still offers Send a message", /contact\.html#message/.test(consult));
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
check("Header uses the transparent banner wordmark", /class="brand-wordmark"[^>]*src="assets\/brand\/zoe-life-wordmark\.png"/.test(html["index.html"]));
check("Header does not use the circular mark as the logo", !indexHeader.includes("zoe-life-mark.png"));
check("Header does not use the boxed jpg wordmark", !indexHeader.includes("zoe-life-wordmark.jpg"));
check("Footer uses the banner wordmark", footerOf(html["index.html"]).includes("assets/brand/zoe-life-wordmark.png"));

check("Header has no cart", !/\(0\)|\bCart\b|\bLogin\b|\bAccount\b/i.test(indexHeader));
check("Primary header CTA is Send a message", /Send a message/.test(indexHeader) && /contact\.html#message/.test(indexHeader));
check("Header CTA is not the consultation", !/consult\.html/.test(indexHeader));

const navBlock = html["index.html"].match(/<nav class="site-nav"[\s\S]*?<\/nav>/)[0];
for (const label of ["Home", "About", "Books &amp; Resources", "Connect", "Contact"]) {
  check(`Main nav includes ${label}`, navBlock.includes(`>${label}<`));
}
check("Family Life is not a main nav label", !/>Family Life</.test(navBlock));

const builder = read("tools/build.mjs");
check("Home hero shares the header wrap-wide column", /class="hero-split wrap-wide"/.test(html["index.html"]));
check("Builder emits the shared wrap-wide hero column", /class="hero-split wrap-wide"/.test(builder));
check("Hero desktop columns can shrink instead of overflowing",
  /@media \(min-width: 56rem\)\s*\{\s*\.hero-split \{[^}]*minmax\(0,\s*2fr\)\s+minmax\(0,\s*1fr\)/.test(css));
check("Hero no longer uses a 28rem column floor", !/minmax\(28rem/.test(css));
check("Hero copy and photo can shrink below their intrinsic size",
  /\.hero-copy \{[\s\S]*?min-width:\s*0/.test(css) && /\.hero-photo \{[\s\S]*?min-width:\s*0/.test(css));
check("Home hero uses the full beach portrait with sky above Tayo's head",
  /tayo-kemi-full\.jpg/.test(html["index.html"]) && /tayo-kemi-full\.jpg/.test(builder));
check("Home hero is not the tight crop, park walk, or stage photo",
  !/tayo-kemi-hero\.jpg/.test(html["index.html"]) &&
  !/tayo-kemi-park\.jpg/.test(html["index.html"]) &&
  !/tayo-kemi-stage\.jpg/.test(html["index.html"]));
check("Home hero cover crop pins to the top so the hairline stays in frame",
  /\.hero-photo img \{[^}]*object-position:\s*50%\s*0%/.test(css));
check("Home founders block uses the studio couple photo, not the beach hug",
  /tayo-kemi-studio\.jpeg/.test(html["index.html"]) &&
  !/<img src="assets\/photos\/tayo-kemi-about\.jpg"/.test(html["index.html"]));
check("About couple photo is the studio portrait",
  /tayo-kemi-studio\.jpeg/.test(html["about.html"]) &&
  !/<img src="assets\/photos\/tayo-kemi-about\.jpg"/.test(html["about.html"]));
check("Consult shows Tayo and Kemi", /tayo-kemi-hero\.jpg/.test(consult));
check("Home does not use the stage photo", !/tayo-kemi-stage\.jpg/.test(html["index.html"]));
const homePhotoImgs = [...html["index.html"].matchAll(/<img[^>]+src="assets\/photos\/([^"]+)"/g)].map((m) => m[1]);
check("Home uses at most one beach-hug file",
  homePhotoImgs.filter((f) => /tayo-kemi-(?:full|hero|about)\.jpg/.test(f)).length <= 1);
check("Contact shows the couple, not Kemi only", /tayo-kemi-park\.jpg/.test(contact) && !/kemi-white\.jpg/.test(contact));
check("Home does not use a Kemi-only photo", !/kemi-white\.jpg|kemi-headshot\.jpg/.test(html["index.html"]));

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
  connectMain.indexOf("Find us online") < connectMain.indexOf("Zoe Family Life") && connectMain.indexOf("Find us online") >= 0);
for (const s of ZFL) check(`Connect page links ${s}`, html["connect.html"].includes(s));
check("Connect uses a filled icon+label layout, not a split with empty column",
  /connect-find/.test(connectMain) && !/split-copy-photo/.test(connectMain));
check("Connect uses Visit labels, not a handle dump", /Visit Facebook/.test(connectMain) && !/The main accounts/.test(connectMain));
check("Stay in Touch is more prominent than the mailing disclaimer",
  /footer-h-lead/.test(footerOf(html["index.html"])));
check("Connect does not lecture about footer links", !/also linked in the footer|Start here if you are new/.test(connectMain));

check("Subscribe intro copy is present",
  publishedHtml.includes("Subscribe to receive encouragement, updates, and helpful resources from Zoe Life."));
const subscribeForms = [...publishedHtml.matchAll(/data-form="subscribe"[\s\S]*?<\/form>/g)].map((m) => m[0]);
check("Subscribe consent names FormSubmit as a service provider",
  subscribeForms.length > 0 && subscribeForms.every((form) => /FormSubmit, a service provider/.test(form)));
check("Subscribe consent explains FormSubmit retention",
  subscribeForms.every((form) => /retained by FormSubmit for up to 30 days/.test(form)));
check("Subscribe consent explains Zoe Life's use and unsubscribe choice",
  subscribeForms.every((form) => /Zoe Life will use it for updates, and I can unsubscribe at any time\./.test(form)));
check("Subscribe consent makes no absolute third-party-sharing claim",
  subscribeForms.every((form) => !/will not share (?:your|my) information with third parties/i.test(form)));
check("Consent is demoted with the consent-note class", /consent-note/.test(publishedHtml));
check("Stay in Touch is the mailing list title", /Stay in Touch/.test(footerOf(html["index.html"])));

const homeMain = mainOf(html["index.html"]);
const aboutMain = mainOf(html["about.html"]);
check("No leftover builder note: Home is a starting place", !/Home is a starting place/.test(publishedHtml));
check("No leftover builder note: form goes to inbox", !/form goes to the Zoe Life inbox|The form goes to the Zoe Life inbox/i.test(publishedHtml));
check("No leftover morning-only book copy", !/ordinary mornings|naming what God has done|long after the first week/.test(publishedHtml));
check("Home does not lead with a Greek-word lecture", !/Zoe is the Greek word for life/.test(homeMain));
check("Home founder line does not mention Life Springs", !/Life Springs/.test(homeMain));
check("Home consult is not in the hero", !/hero-home[\s\S]{0,1200}consult\.html/.test(html["index.html"]));
check("Home leads with Send a message", /contact\.html#message/.test(homeMain));
const homeHero = html["index.html"].match(/<section class="hero-home">[\s\S]*?<\/section>/)[0];
const homeHeroBtns = [...homeHero.matchAll(/<a class="btn ([^"]+)"/g)].map((m) => m[1]);
check("Home hero has two equal primary CTAs",
  homeHeroBtns.length === 2 && homeHeroBtns.every((c) => c === "btn-primary"));
check("Home hero puts Send a message before books",
  homeHero.indexOf("Send a message") < homeHero.indexOf("Explore books and resources"));
check("You don't have to do life by yourself appears on Home", /don't have to do life/.test(homeMain));
check("About cites John 10:10 without making Greek the point", /John 10:10/.test(aboutMain) && /<em>Zoe<\/em>/.test(aboutMain));
check("About founder line is Tayo and Kemi", /founded by Tayo and Kemi/.test(aboutMain));
check("About Meet section keeps the Meet Tayo and Kemi eyebrow",
  /id="meet"[\s\S]*?<p class="eyebrow">Meet Tayo and Kemi<\/p>/.test(aboutMain));
check("About Meet section has no Tayo and I or Tai and I heading",
  !/<h2>\s*(?:Tayo|Tai) and I\.?\s*<\/h2>/.test(aboutMain) &&
  !/(?:Tayo|Tai) and I/.test(aboutMain));
check("Builder does not emit a Tayo and I or Tai and I heading",
  !/<h2>\s*(?:Tayo|Tai) and I\.?\s*<\/h2>/.test(builder) &&
  !/(?:Tayo|Tai) and I/.test(builder));
const namingCorpus = Object.values(allHtmlPages).join("\n") + builder + read("assets/photos/provenance.json");
check("His name is spelled Tayo, never Tai", !/\bTai\b/.test(namingCorpus));
check("Couple names are Tayo then Kemi, never Kemi and Tayo",
  !/Kemi and Tayo/.test(namingCorpus) && !/Kemi and Pastor/.test(namingCorpus));
check("Home does not prefix Pastor on every mention",
  !/Pastor (?:Tayo|Kemi|Tai)/.test(html["index.html"]));
check("Footer says Founded by Tayo and Kemi",
  /Founded by Tayo and Kemi/.test(footerOf(html["index.html"])));
check("Pastor title is used once on About Meet, not on every caption",
  (aboutMain.match(/Pastors Tayo and Kemi/g) || []).length === 1 &&
  !/Pastor Tayo and Pastor Kemi/.test(aboutMain) &&
  !/<figcaption>Pastor /.test(aboutMain));
check("Her 7-day copy is on Books", /biblical foundation of gratitude/.test(booksDoc));
check("Her 100-day copy is on Books", /dedicated space to pause, remember God's goodness/.test(booksDoc));
check("Books page is expandable, not a closed catalog", /more to come|coming soon/i.test(booksDoc));
check("Group orders jump to the message form", /href="contact.html#message"/.test(booksDoc));
check("Contact reply copy is spoken English", /Please expect a reply within three business days/.test(contact));
check("No Life Springs branding on Home or Books", !/Life Springs/.test(homeMain + mainOf(html["books.html"])));

/* ------------------------------------------------------------ styling -- */
group("Visual direction");

check("No dark page theme", !/--ink:\s*#(?:0|1|2)[0-9a-f]{5}\b/i.test(css) || /--cream:\s*#F/i.test(css));
check("Background is warm cream", /--cream:\s*#F8F4ED/i.test(css) && /--paper:\s*#F8F4ED/i.test(css));
check("Soft beige is the alternate ground", /--beige:\s*#E8DED2/i.test(css));
check("Sage is the one brand green", /--sage:\s*#526B58/i.test(css));
check("Olive is a sage-family neighbor, not a second accent", /--olive:\s*#4A5C3A/i.test(css));
check("Gold and peach exist as spices", /--gold:\s*#C6A15B/i.test(css) && /--peach:\s*#E0A994/i.test(css));
check("Charcoal is the type color", /--ink:\s*#343A36/i.test(css));
check("Primary buttons use sage, hover uses olive",
  /\.btn-primary \{[^}]*background:\s*var\(--sage\)/.test(css) &&
  /\.btn-primary:hover \{[^}]*background:\s*var\(--olive\)/.test(css) &&
  !/\.btn-primary \{[^}]*var\(--gold\)/.test(css) &&
  !/\.btn-primary \{[^}]*var\(--peach\)/.test(css));
check("Peach is not a section fill", /\.band-peach[^}]*background:\s*var\(--cream\)/.test(css));
check("Home does not use peach or grey as competing section fills",
  !/band-peach/.test(html["index.html"]) && !/band-grey/.test(html["index.html"]));
check("theme-color is warm cream", PAGES.every((p) => /<meta name="theme-color" content="#F8F4ED">/.test(html[p])));
check("Reduced motion is respected", /prefers-reduced-motion:\s*reduce/.test(css));
check("Focus is visible", /:focus-visible/.test(css) && /outline:\s*3px/.test(css));
check("Type pairing is Fraunces and Outfit", /font-family: Fraunces/.test(css) && /font-family: Outfit/.test(css));
check("No Inter or Roboto as the only sans", !/--sans:\s*Inter|--sans:\s*Roboto/.test(css));

const scriptSrcs = [...publishedHtml.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
const GTAG_SRC = "https://www.googletagmanager.com/gtag/js?id=G-R18R3LVBK9";
for (const [pageName, doc] of Object.entries(allHtmlPages)) {
  check(
    `${pageName} loads the approved Google tag once`,
    (doc.match(new RegExp(GTAG_SRC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length === 1
  );
  check(
    `${pageName} configures the approved GA4 property once`,
    (doc.match(/gtag\('config', 'G-R18R3LVBK9'\);/g) || []).length === 1
  );
}
check(
  "No WebGL or heavy animation libraries loaded",
  !scriptSrcs.some((s) => /three|gsap|lenis|scrolltrigger/i.test(s)),
  scriptSrcs.join(", ")
);
check(
  "Only local site scripts and the approved Google tag are loaded",
  scriptSrcs.every((s) => s === "js/main.js" || s === "js/config.js" || s === GTAG_SRC),
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
  beige: token("beige"),
  white: token("white"),
  goldDeep: token("gold-deep"),
  sage: token("sage"),
  olive: token("olive"),
  terracotta: token("terracotta"),
  ink: token("ink"),
  inkSoft: token("ink-soft"),
};

const PAIRS = [
  ["body text on cream", T.ink, T.cream, 4.5],
  ["body text on beige", T.ink, T.beige, 4.5],
  ["muted text on cream", T.inkSoft, T.cream, 4.5],
  ["muted text on beige", T.inkSoft, T.beige, 4.5],
  ["muted text on white", T.inkSoft, T.white, 4.5],
  ["link sage on cream", T.sage, T.cream, 4.5],
  ["link sage on white", T.sage, T.white, 4.5],
  ["olive hover on cream", T.olive, T.cream, 4.5],
  ["olive hover on beige", T.olive, T.beige, 4.5],
  ["eyebrow gold-deep on cream", T.goldDeep, T.cream, 4.5],
  ["eyebrow gold-deep on beige", T.goldDeep, T.beige, 4.5],
  ["pending badge text on peach tint", T.terracotta, "#F3E6DF", 4.5],
  ["error text on cream", "#8A3E17", T.cream, 4.5],
  ["primary button label", T.white, T.sage, 4.5],
  ["olive deeper fill button label", T.white, T.olive, 4.5],
  ["focus ring on cream", T.sage, T.cream, 3],
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
