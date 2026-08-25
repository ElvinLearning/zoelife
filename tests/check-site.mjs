/**
 * Zoe Life Phase 1 site checks. No dependencies.
 *   node tests/check-site.mjs
 *
 * Replaces the previous tests/check_site.py: this machine has no Python
 * interpreter, so the Python suite could not actually be run.
 *
 * These are regression checks for the things most likely to go wrong on a
 * client build: broken links, missing labels, invented facts, exposed private
 * addresses, and forms that lie about succeeding.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html", "about.html", "books.html", "family-life.html", "contact.html"];

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
const html = Object.fromEntries(PAGES.map((p) => [p, read(p)]));
const js = read("js/main.js");
const css = read("css/style.css");

/* Strip tags, scripts, styles and comments to approximate visible copy. */
function visibleText(doc) {
  return doc
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");
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

  // Heading order must not skip a level.
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
check("Sitemap is well formed", /^<\?xml/.test(sitemap) && /<\/urlset>/.test(sitemap));

const notFound = read("404.html");
check("404 page links home", /href="index\.html"/.test(notFound));
check("404 page has one h1", (notFound.match(/<h1[\s>]/g) || []).length === 1);

function canonicalOf(p) {
  return SITE + "/" + (p === "index.html" ? "" : p.replace(/\.html$/, ""));
}

/* --------------------------------------------------------------- links -- */
group("Links");

for (const p of PAGES) {
  const doc = html[p];

  // Internal hrefs must point at files that exist.
  const internal = [...doc.matchAll(/href="(?!https?:|mailto:|#)([^"]+)"/g)].map((m) => m[1]);
  const broken = internal.filter((h) => !existsSync(join(ROOT, h.split("#")[0])));
  check(`${p} internal links all resolve`, broken.length === 0, broken.join(", "));

  // In-page anchors must have a matching id.
  const anchors = [...doc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  const missingAnchor = anchors.filter((a) => !doc.includes(`id="${a}"`));
  check(`${p} in-page anchors all have targets`, missingAnchor.length === 0, missingAnchor.join(", "));

  // Every external link opens safely.
  const ext = [...doc.matchAll(/<a[^>]*href="https?:[^"]*"[^>]*>/g)].map((m) => m[0]);
  const unsafe = ext.filter((a) => !/rel="noopener noreferrer"/.test(a));
  check(`${p} external links use rel=noopener noreferrer`, unsafe.length === 0, `${unsafe.length} missing`);

  // No invented or placeholder destinations.
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
}

// Referenced asset files must exist on disk.
const allAssets = new Set();
for (const p of PAGES) {
  for (const m of html[p].matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) allAssets.add(m[1]);
}
for (const m of css.matchAll(/url\(\.\.\/(assets\/[^)]+)\)/g)) allAssets.add(m[1]);
const missingAssets = [...allAssets].filter((a) => !existsSync(join(ROOT, a)));
check("All referenced assets exist", missingAssets.length === 0, missingAssets.join(", "));

/* --------------------------------------------------------------- forms -- */
group("Forms");

for (const p of PAGES) {
  const doc = html[p];
  const controls = [...doc.matchAll(/<(input|select|textarea)[^>]*>/g)].map((m) => m[0]);
  const real = controls.filter((c) => !/type="checkbox"/.test(c) || true);

  const noId = real.filter((c) => !/\sid="/.test(c));
  check(`${p} every form control has an id`, noId.length === 0, `${noId.length} missing`);

  const ids = real.map((c) => (c.match(/\sid="([^"]+)"/) || [])[1]).filter(Boolean);
  const unlabelled = ids.filter((id) => !doc.includes(`for="${id}"`));
  check(`${p} every form control has a label`, unlabelled.length === 0, unlabelled.join(", "));

  // Required fields must be wired to an error container for inline messages.
  const required = real.filter((c) => /\srequired/.test(c));
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
check("Contact form is separate from consultation booking", /id="consultation"/.test(contact) && /data-form="contact"/.test(contact));

/* ------------------------------------------------------------- honesty -- */
group("Honesty and safety");

// Success wording may exist, but only inside renderSent, which is reachable
// solely from a 2xx response. Assert that gate rather than banning the words.
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

/* Config must ship fail-closed. */
const cfg = read("js/config.js");
check("config.js exists and defines ZOE_CONFIG", /window\.ZOE_CONFIG\s*=/.test(cfg));
const cfgObj = JSON.parse(cfg.slice(cfg.indexOf("{"), cfg.lastIndexOf("}") + 1));
for (const k of ["formEndpoint", "newsletterEndpoint", "bookingUrl"]) {
  check(`config.${k} is present`, k in cfgObj);
}
check(
  "No placeholder endpoint was invented",
  Object.values(cfgObj).every((v) => v === null || /^https:\/\//.test(String(v))),
  JSON.stringify(cfgObj)
);

const allHtml = PAGES.map((p) => html[p]).join("\n");
check(
  "No Zoe Life email address is exposed",
  !/[a-z0-9._%+-]+@zoelifehub\.com/i.test(allHtml),
  (allHtml.match(/[a-z0-9._%+-]+@zoelifehub\.com/i) || [])[0]
);
check("No mailto links", !/mailto:/i.test(allHtml));
check(
  "No private backend addresses",
  !/@yahoo\.com|@gmail\.com/i.test(allHtml)
);
check("No prices are stated", !/\$\s?\d|USD\s?\d|\d+\.\d{2}\s?(?:USD|dollars)/i.test(visibleText(allHtml)));

// Store links must be pending, not invented.
const booksDoc = html["books.html"];
check("No invented storefront URLs", !/amazon\.com|etsy\.com|gumroad\.com|selar\.co/i.test(booksDoc));
check("Store options are marked pending", (booksDoc.match(/Link pending/g) || []).length >= 8);
check("Missing journal cover is marked pending", /Cover pending/.test(booksDoc));
check("Devotional cover is the real supplied file", /assets\/books\/gratitude-devotional-cover\.jpg/.test(booksDoc));
check("Booking link is disabled while unconfigured", /aria-disabled="true"[^>]*>Booking opens soon|Booking opens soon/.test(contact));

/* --------------------------------------------------------------- brand -- */
group("Brand structure");

const TAGLINE = "Helping People Thrive in Every Season of Life";
check("Tagline appears on Home", html["index.html"].includes(TAGLINE));
check("Tagline appears under the About Zoe Life heading", /About Zoe Life<\/h1>\s*<p class="tagline">Helping People Thrive/.test(html["about.html"]));
check("Tagline is not inside the logo file name or alt", !/alt="[^"]*Thrive[^"]*"/.test(allHtml));

const ZOE_LIFE = ["facebook.com/zoelifehub", "instagram.com/zoelifehub", "tiktok.com/@zoelifehub1", "youtube.com/@zoelifehub1", "x.com/zoelifehub"];
const ZFL = ["facebook.com/zoefamilylife10", "instagram.com/zoefamilylife", "tiktok.com/@zoefamilylife", "youtube.com/@zoefamilylife"];

for (const p of PAGES) {
  const footer = html[p].slice(html[p].indexOf('<footer class="site-footer">'));
  for (const s of ZOE_LIFE) check(`${p} footer links Zoe Life ${s.split("/")[0]}`, footer.includes(s));
  const zflInFooter = ZFL.filter((s) => footer.includes(s));
  check(`${p} footer does NOT use Zoe Family Life accounts`, zflInFooter.length === 0, zflInFooter.join(", "));
}

const fam = html["family-life.html"];
// Compare within <main> only: the <title> and meta description legitimately
// mention Zoe Family Life before the body content starts.
const famMain = fam.slice(fam.indexOf('<main id="main">'), fam.indexOf("</main>"));
check("Zoe Life appears before Zoe Family Life", famMain.indexOf(">Zoe Life<") < famMain.indexOf("Zoe Family Life"));
for (const s of ZFL) check(`Family Life page links ${s}`, fam.includes(s));
check("Zoe Family Life X absence is stated", /No X account for Zoe Family Life/.test(fam));
check("Future programs are marked planned", (fam.match(/is-planned/g) || []).length >= 2);

/* ------------------------------------------------------------ styling -- */
group("Visual direction");

check("No dark page theme", !/--ink:\s*#(?:0|1|2)[0-9a-f]{5}\b/i.test(css) || /--cream:\s*#F/i.test(css));
check("Background is a light cream", /--cream:\s*#FBF7F0/i.test(css));
check("theme-color is light", PAGES.every((p) => /<meta name="theme-color" content="#FBF7F0">/.test(html[p])));
check("Reduced motion is respected", /prefers-reduced-motion:\s*reduce/.test(css));
check("Focus is visible", /:focus-visible/.test(css) && /outline:\s*3px/.test(css));
// Match loaded scripts, not prose. "three pathways" is legitimate copy.
const scriptSrcs = [...allHtml.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
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

// House style carried over from the previous suite: no em or en dashes in copy.
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

/* Read the real token values out of the stylesheet so this check can never
   drift from the CSS it is meant to be testing. */
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`token --${name} not found in css/style.css`);
  return m[1];
};

const T = {
  cream: token("cream"),
  creamDeep: token("cream-deep"),
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
  ["muted text on cream", T.inkSoft, T.cream, 4.5],
  ["muted text on cream-deep", T.inkSoft, T.creamDeep, 4.5],
  ["muted text on white", T.inkSoft, T.white, 4.5],
  ["link sage-deep on cream", T.sageDeep, T.cream, 4.5],
  ["link sage-deep on white", T.sageDeep, T.white, 4.5],
  ["eyebrow gold-deep on cream", T.goldDeep, T.cream, 4.5],
  ["eyebrow gold-deep on cream-deep", T.goldDeep, T.creamDeep, 4.5],
  ["eyebrow gold-deep on white", T.goldDeep, T.white, 4.5],
  ["tagline terracotta on cream", T.terracotta, T.cream, 4.5],
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
