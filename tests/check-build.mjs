/**
 * Build-time integration tests for Zoe Life.
 *   node tests/check-build.mjs
 *
 * Ordinary rebuilds keep the Apps Script and Google Calendar URLs.
 * FormSubmit is never preserved. Marketplace, giving, and course links stay
 * null until an https URL is supplied.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LIVE_BOOKING_URL,
  LIVE_DEFAULTS,
  LIVE_FORM_ENDPOINT,
  escapeAttr,
  httpsOnly,
  isFormSubmit,
  resolveIntegrations,
} from "../tools/site-config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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

function zoeEnv(extra = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("ZOE_")) delete env[key];
  }
  Object.assign(env, extra);
  return env;
}

function emptyPayments() {
  return {
    devotional: { amazon: null, etsy: null, gumroad: null, stripe: null, paypal: null },
    journal: { amazon: null, etsy: null, gumroad: null, stripe: null, paypal: null },
  };
}

const PRESERVED = {
  formEndpoint: LIVE_FORM_ENDPOINT,
  newsletterEndpoint: LIVE_FORM_ENDPOINT,
  bookingUrl: LIVE_BOOKING_URL,
  paidBookingUrl: null,
  coursesUrl: null,
  giving: { stripe: null, paypal: null },
  payments: emptyPayments(),
};

group("HTTPS validation");

check("httpsOnly accepts an https URL", httpsOnly("https://example.com/ok", "test") === "https://example.com/ok");
check("httpsOnly treats empty as null", httpsOnly("  ", "test") === null && httpsOnly(null, "test") === null);
check("Live form default is Apps Script", LIVE_DEFAULTS.formEndpoint === LIVE_FORM_ENDPOINT && !isFormSubmit(LIVE_FORM_ENDPOINT));
check("Live booking default is the Google Calendar link", LIVE_DEFAULTS.bookingUrl === LIVE_BOOKING_URL);

for (const bad of ["http://example.com/nope", "javascript:alert(1)", "ftp://example.com/file"]) {
  let threw = false;
  try {
    httpsOnly(bad, "ZOE_AMAZON_DEVOTIONAL_URL");
  } catch (err) {
    threw = /https/i.test(err.message);
  }
  check(`httpsOnly rejects ${bad}`, threw);
}

check(
  "Attribute escaping encodes quotes and markup",
  escapeAttr('https://example.com/?q="x"&y=<script>').includes("&quot;") &&
    escapeAttr('https://example.com/?q="x"&y=<script>').includes("&amp;") &&
    !escapeAttr("<script>").includes("<script>")
);

group("Resolve without env");

const preserved = resolveIntegrations({ env: {}, existing: PRESERVED, staging: false });
check("Ordinary build keeps the Apps Script form endpoint", preserved.formEndpoint === LIVE_FORM_ENDPOINT);
check("Ordinary build keeps the Apps Script newsletter endpoint", preserved.newsletterEndpoint === LIVE_FORM_ENDPOINT);
check("Ordinary build keeps the Google Calendar booking URL", preserved.bookingUrl === LIVE_BOOKING_URL);

const stagedExisting = resolveIntegrations({ env: {}, existing: PRESERVED, staging: true });
check("Staging still preserves an existing Apps Script endpoint", stagedExisting.formEndpoint === LIVE_FORM_ENDPOINT);

const stagedEmpty = resolveIntegrations({ env: {}, existing: {}, staging: true });
check("Staging fail-closes form when nothing to preserve", stagedEmpty.formEndpoint === null);
check("Staging fail-closes newsletter when nothing to preserve", stagedEmpty.newsletterEndpoint === null);
check("Staging fail-closes booking when nothing to preserve", stagedEmpty.bookingUrl === null);

const ordinaryEmpty = resolveIntegrations({ env: {}, existing: {}, staging: false });
check("Ordinary empty config falls back to Apps Script", ordinaryEmpty.formEndpoint === LIVE_FORM_ENDPOINT);
check("Ordinary empty config falls back to the live booking URL", ordinaryEmpty.bookingUrl === LIVE_BOOKING_URL);
check("Empty defaults are not FormSubmit", !isFormSubmit(ordinaryEmpty.formEndpoint) && !isFormSubmit(ordinaryEmpty.newsletterEndpoint));

const formSubmitExisting = resolveIntegrations({
  env: {},
  existing: {
    formEndpoint: "https://formsubmit.co/ajax/contact@zoelifehub.com",
    newsletterEndpoint: "https://formsubmit.co/ajax/contact@zoelifehub.com",
    bookingUrl: LIVE_BOOKING_URL,
  },
  staging: false,
});
check("FormSubmit form endpoint is replaced with Apps Script", formSubmitExisting.formEndpoint === LIVE_FORM_ENDPOINT);
check("FormSubmit newsletter endpoint is replaced with Apps Script", formSubmitExisting.newsletterEndpoint === LIVE_FORM_ENDPOINT);
check("Replacing FormSubmit still keeps the calendar URL", formSubmitExisting.bookingUrl === LIVE_BOOKING_URL);

let formSubmitEnvThrew = false;
try {
  resolveIntegrations({
    env: { ZOE_FORM_ENDPOINT: "https://formsubmit.co/ajax/contact@zoelifehub.com" },
    existing: PRESERVED,
    staging: false,
  });
} catch (err) {
  formSubmitEnvThrew = /FormSubmit/i.test(err.message);
}
check("A FormSubmit env override is rejected", formSubmitEnvThrew);

const overridden = resolveIntegrations({
  env: { ZOE_FORM_ENDPOINT: "https://script.google.com/macros/s/override/exec" },
  existing: PRESERVED,
  staging: false,
});
check("Env overrides an existing form endpoint", overridden.formEndpoint === "https://script.google.com/macros/s/override/exec");
check("Env override leaves the existing booking URL", overridden.bookingUrl === LIVE_BOOKING_URL);

check("Marketplace links stay null until provided", preserved.payments.devotional.amazon === null);
check("Giving links stay null until provided", preserved.giving.stripe === null && preserved.giving.paypal === null);
check("Course URL stays null until provided", preserved.coursesUrl === null);
check(
  "Course payment slots stay null until provided",
  preserved.courses.singleDating === null &&
    preserved.courses.committed === null &&
    preserved.courses.engagedFirstYear === null &&
    preserved.courses.couplesBundle === null &&
    preserved.courses.claimEndpoint === null
);
check("YouTube playlist ids are always configured", preserved.resources.playlists.length === 5);

const marketOk = resolveIntegrations({
  env: {
    ZOE_AMAZON_DEVOTIONAL_URL: "https://example.com/devotional",
    ZOE_GIVING_PAYPAL_URL: "https://www.paypal.com/give/example",
    ZOE_COURSE_SINGLE_DATING_URL: "https://buy.stripe.com/b/premarital",
  },
  existing: PRESERVED,
  staging: false,
});
check("https marketplace env is accepted", marketOk.payments.devotional.amazon === "https://example.com/devotional");
check("https giving env is accepted", marketOk.giving.paypal === "https://www.paypal.com/give/example");
check("https course payment env is accepted", marketOk.courses.singleDating === "https://buy.stripe.com/b/premarital");
check("Unset course payment slots stay null", marketOk.courses.committed === null && marketOk.courses.claimEndpoint === null);
check("Unset giving sibling stays null", marketOk.giving.stripe === null);

let marketThrew = false;
try {
  resolveIntegrations({
    env: { ZOE_GUMROAD_DEVOTIONAL_URL: "javascript:alert(1)" },
    existing: PRESERVED,
  });
} catch (err) {
  marketThrew = /https/i.test(err.message);
}
check("javascript: marketplace env is rejected", marketThrew);

group("Rebuild preserves committed endpoints");

const temp = mkdtempSync(join(tmpdir(), "zoe-preserve-"));
try {
  mkdirSync(join(temp, "tools"), { recursive: true });
  mkdirSync(join(temp, "js"), { recursive: true });
  cpSync(join(ROOT, "tools/build.mjs"), join(temp, "tools/build.mjs"));
  cpSync(join(ROOT, "tools/site-config.mjs"), join(temp, "tools/site-config.mjs"));
  cpSync(join(ROOT, "tools/site-content.mjs"), join(temp, "tools/site-content.mjs"));
  const seeded = {
    ...PRESERVED,
    payments: {
      ...emptyPayments(),
      journal: { ...emptyPayments().journal, gumroad: "https://example.gumroad.com/l/journal" },
    },
  };
  writeFileSync(
    join(temp, "js/config.js"),
    `/* Generated by tools/build.mjs. Do not edit by hand. */\nwindow.ZOE_CONFIG = ${JSON.stringify(seeded, null, 2)};\n`
  );
  const run = spawnSync(process.execPath, [join(temp, "tools/build.mjs")], {
    cwd: temp,
    env: zoeEnv(),
    encoding: "utf8",
  });
  check("Preserve rebuild exits cleanly", run.status === 0, run.stderr);
  const built = JSON.parse(readFileSync(join(temp, "js/config.js"), "utf8").slice(
    readFileSync(join(temp, "js/config.js"), "utf8").indexOf("{"),
    readFileSync(join(temp, "js/config.js"), "utf8").lastIndexOf("}") + 1
  ));
  check("Rebuilt config keeps the Apps Script form URL", built.formEndpoint === LIVE_FORM_ENDPOINT);
  check("Rebuilt config keeps the Apps Script newsletter URL", built.newsletterEndpoint === LIVE_FORM_ENDPOINT);
  check("Rebuilt config keeps the booking URL", built.bookingUrl === LIVE_BOOKING_URL);
  check("Rebuilt config keeps an existing Gumroad URL", built.payments.journal.gumroad === "https://example.gumroad.com/l/journal");
  check("Rebuilt config does not contain FormSubmit", !/formsubmit/i.test(JSON.stringify(built)));
  const books = readFileSync(join(temp, "books.html"), "utf8");
  check("Preserved Gumroad URL is escaped into the book page", books.includes("https://example.gumroad.com/l/journal"));
  check("Giving buttons stay out of the partner page", !/Partner through Stripe|Partner through PayPal/.test(readFileSync(join(temp, "partner.html"), "utf8")));
  const coursesHtml = readFileSync(join(temp, "courses.html"), "utf8");
  check("Courses page has no dead Teachable link", !/View courses on Teachable|teachable\.com/i.test(coursesHtml));
  check("Null course slots do not render buy links", !/buy\.stripe\.com|Buy this track|Buy the couples bundle/.test(coursesHtml));
  check("Null course slots say enrollment opens soon", /Enrollment opens soon/.test(coursesHtml));
  check("Rebuilt course slots stay null", built.courses.singleDating === null && built.courses.couplesBundle === null && built.courses.claimEndpoint === null);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

const committed = readFileSync(join(ROOT, "js/config.js"), "utf8");
check("Committed config.js uses the live Apps Script URL", committed.includes(LIVE_FORM_ENDPOINT));
check("Committed config.js uses the live booking URL", committed.includes(LIVE_BOOKING_URL));
check("Committed config.js does not use FormSubmit", !/formsubmit/i.test(committed));

if (failures.length) {
  console.error(`\n${failures.length} failed, ${pass} passed`);
  process.exit(1);
}
console.log(`\n${pass} passed`);
