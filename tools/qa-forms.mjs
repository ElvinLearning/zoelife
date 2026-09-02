/**
 * Interaction QA: form validation, conditional fields, keyboard access, and the
 * fail-closed provider-rejection path. Run the server first, then:
 * node tools/qa-forms.mjs
 *
 * Network calls are mocked before any page script runs. The critical assertion
 * is that an HTTP 200 with `success: "false"` does NOT report delivery.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.QA_BASE || "http://127.0.0.1:8765";
const PORT = Number(process.env.QA_CDP_PORT || 19334);
const CHROME =
  process.env.CHROME_PATH ||
  [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ].find((p) => existsSync(p)) ||
  "google-chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let msgId = 0;
function cdp(ws, method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id === id) {
        ws.removeEventListener("message", onMsg);
        m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result);
      }
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

let pass = 0;
const fails = [];
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fails.push(name); console.log(`  FAIL ${name}${detail ? ` :: ${detail}` : ""}`); }
};

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--remote-debugging-port=${PORT}`,
  "--user-data-dir=" + join(ROOT, "tools", ".chrome-qa-forms"),
  "about:blank",
], { stdio: "ignore" });
process.on("exit", () => chrome.kill());

let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl; } catch {}
}
if (!wsUrl) { console.error("Chrome not reachable"); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const { targetId } = await cdp(ws, "Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp(ws, "Target.attachToTarget", { targetId, flatten: true });
await cdp(ws, "Page.enable", {}, sessionId);
await cdp(ws, "Runtime.enable", {}, sessionId);
await cdp(ws, "Page.addScriptToEvaluateOnNewDocument", {
  source: `window.fetch = async () => new Response(
    JSON.stringify({ success: "false", message: "QA provider rejection" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );`,
}, sessionId);

const evalJs = async (expression) => {
  const { result, exceptionDetails } = await cdp(ws, "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (exceptionDetails) throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description || ""));
  return result.value;
};

const goto = async (path) => {
  await cdp(ws, "Page.navigate", { url: `${BASE}/${path}` }, sessionId);
  await sleep(600);
};

/* ------------------------------------------------- contact form: empty -- */
console.log("\nContact form: submitting empty");
await goto("contact.html");

let r = await evalJs(`(() => {
  const form = document.querySelector('[data-form="contact"]');
  form.querySelector('button[type=submit]').click();
  const shown = [...form.querySelectorAll('.error.is-shown')].map(e => e.textContent);
  return {
    errorCount: shown.length,
    messages: shown,
    invalid: form.querySelectorAll('[aria-invalid="true"]').length,
    focused: document.activeElement ? document.activeElement.id : null,
    status: (form.querySelector('[data-status]') || {}).textContent || '',
  };
})()`);

check("empty submit shows inline errors", r.errorCount >= 5, `${r.errorCount} shown`);
check("empty submit marks fields aria-invalid", r.invalid >= 5, `${r.invalid}`);
check("focus moves to the first invalid field", r.focused === "c-first", r.focused);
check("empty submit does not report success", !/thank|received|sent successfully/i.test(r.status), r.status);
check("empty submit prompts correction", /correct the highlighted/i.test(r.status), r.status);

/* -------------------------------------------- invalid email + preserved -- */
console.log("\nContact form: invalid email, values preserved");
r = await evalJs(`(() => {
  const form = document.querySelector('[data-form="contact"]');
  const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); };
  set('c-first', 'Ada'); set('c-last', 'Nwosu');
  set('c-email', 'not-an-email'); set('c-phone', '5551234567');
  document.getElementById('c-reason').value = 'Coaching';
  set('c-message', 'I would like to ask about premarital coaching for us.');
  form.querySelector('button[type=submit]').click();
  return {
    emailError: document.getElementById('c-email-error').textContent,
    emailInvalid: document.getElementById('c-email').getAttribute('aria-invalid'),
    firstStillFilled: document.getElementById('c-first').value,
    messageStillFilled: document.getElementById('c-message').value.length,
    focused: document.activeElement.id,
  };
})()`);

check("invalid email produces an error message", /valid email/i.test(r.emailError), r.emailError);
check("invalid email field is marked invalid", r.emailInvalid === "true");
check("other values are preserved after a failed submit", r.firstStillFilled === "Ada" && r.messageStillFilled > 10);
check("focus moves to the invalid email field", r.focused === "c-email", r.focused);

/* ------------------------------------------------- error clears on fix -- */
r = await evalJs(`(() => {
  const el = document.getElementById('c-email');
  el.value = 'ada@example.org';
  el.dispatchEvent(new Event('input', {bubbles:true}));
  return {
    cleared: !document.getElementById('c-email-error').classList.contains('is-shown'),
    invalid: el.getAttribute('aria-invalid'),
  };
})()`);
check("error clears as the field is corrected", r.cleared && !r.invalid);

/* ----------------------------------------------- conditional Other field -- */
console.log("\nContact form: conditional Other field");
r = await evalJs(`(() => {
  const sel = document.getElementById('c-reason');
  const wrap = document.querySelector('[data-reveal="Other"]');
  const input = document.getElementById('c-reason-other');
  const before = wrap.hidden;
  sel.value = 'Other'; sel.dispatchEvent(new Event('change', {bubbles:true}));
  const afterHidden = wrap.hidden, afterRequired = input.required;
  sel.value = 'Coaching'; sel.dispatchEvent(new Event('change', {bubbles:true}));
  return { before, afterHidden, afterRequired, revertHidden: wrap.hidden, revertRequired: input.required };
})()`);
check("Other field is hidden by default", r.before === true);
check("Other field appears when Other is selected", r.afterHidden === false);
check("Other field becomes required while visible", r.afterRequired === true);
check("Other field hides again when deselected", r.revertHidden === true);
check("Other field stops being required when hidden", r.revertRequired === false);

/* ------------------------------------------------ valid submit is honest -- */
console.log("\nContact form: provider rejection must NOT claim success");
r = await evalJs(`(async () => {
  const form = document.querySelector('[data-form="contact"]');
  const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', {bubbles:true})); };
  set('c-first','Ada'); set('c-last','Nwosu'); set('c-email','ada@example.org');
  set('c-phone','5551234567');
  const sel = document.getElementById('c-reason');
  sel.value = 'Coaching'; sel.dispatchEvent(new Event('change', {bubbles:true}));
  set('c-message','I would like to ask about premarital coaching for us.');
  form.querySelector('button[type=submit]').click();
  await new Promise(resolve => setTimeout(resolve, 50));
  const status = form.querySelector('[data-status]');
  return {
    text: status.textContent.trim(),
    remainingErrors: form.querySelectorAll('.error.is-shown').length,
    live: status.getAttribute('aria-live'),
  };
})()`);

check("valid submit passes validation", r.remainingErrors === 0, `${r.remainingErrors} errors`);
check("valid submit does NOT claim the message was sent",
  !/thank you|we have received|message sent|successfully/i.test(r.text), r.text);
check("valid submit states the message was NOT delivered",
  /not been delivered|not delivered|not sent|not connected/i.test(r.text), r.text);
check("status region is announced to screen readers", r.live === "polite");

/* ----------------------------------------------------- subscribe is honest -- */
console.log("\nMailing list: provider rejection must NOT claim subscription");
r = await evalJs(`(async () => {
  const form = document.querySelector('.site-footer [data-form="subscribe"]');
  const email = form.querySelector('input[type=email]');
  const consent = form.querySelector('input[type=checkbox]');
  email.value = 'ada@example.org'; email.dispatchEvent(new Event('input',{bubbles:true}));
  consent.checked = true;
  form.querySelector('button[type=submit]').click();
  await new Promise(resolve => setTimeout(resolve, 50));
  return { text: form.querySelector('[data-status]').textContent.trim() };
})()`);
check("subscribe does NOT claim the person was subscribed",
  !/you are subscribed|thank you|welcome aboard|success/i.test(r.text), r.text);
check("subscribe states they were NOT subscribed",
  /not been subscribed|not delivered|not connected/i.test(r.text), r.text);

/* -------------------------------------------------------------- keyboard -- */
console.log("\nKeyboard and navigation");
await goto("index.html");
r = await evalJs(`(() => {
  const skip = document.querySelector('.skip-link');
  skip.focus();
  const cs = getComputedStyle(skip);
  return {
    skipFocusable: document.activeElement === skip,
    skipVisible: skip.getBoundingClientRect().top >= 0,
    skipTarget: !!document.querySelector(skip.getAttribute('href')),
    focusStyle: cs.outlineWidth,
  };
})()`);
check("skip link is focusable", r.skipFocusable);
check("skip link becomes visible on focus", r.skipVisible);
check("skip link target exists", r.skipTarget);

// Mobile nav disclosure
await cdp(ws, "Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
await goto("index.html");
r = await evalJs(`(() => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  const closed = getComputedStyle(nav).display;
  const initial = btn.getAttribute('aria-expanded');
  btn.click();
  const openState = { expanded: btn.getAttribute('aria-expanded'), display: getComputedStyle(nav).display };
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  return {
    controls: btn.getAttribute('aria-controls'),
    hasTarget: !!document.getElementById(btn.getAttribute('aria-controls')),
    initial, closed, openState,
    afterEscape: btn.getAttribute('aria-expanded'),
    focusReturned: document.activeElement === btn,
  };
})()`);
check("nav toggle points at a real element", r.controls === "site-nav" && r.hasTarget);
check("nav starts collapsed on mobile", r.initial === "false" && r.closed === "none");
check("nav opens on click and updates aria-expanded", r.openState.expanded === "true" && r.openState.display !== "none");
check("Escape closes the nav", r.afterEscape === "false");
check("Escape returns focus to the toggle", r.focusReturned);

/* ------------------------------------------------------- no-JS behaviour -- */
console.log("\nWithout JavaScript");
await cdp(ws, "Emulation.setScriptExecutionDisabled", { value: true }, sessionId);
await goto("contact.html");
r = await evalJs(`1`).catch(() => null);
const noJs = await cdp(ws, "Runtime.evaluate", {
  expression: `(() => {
    const nav = document.getElementById('site-nav');
    const main = document.getElementById('main');
    return {
      navVisible: getComputedStyle(nav).display !== 'none' || window.innerWidth > 992,
      mainVisible: getComputedStyle(main).display !== 'none' && main.textContent.trim().length > 200,
      formPresent: !!document.querySelector('[data-form="contact"]'),
      requiredIntact: document.querySelectorAll('[data-form="contact"] [required]').length,
    };
  })()`, returnByValue: true,
}, sessionId).then((x) => x.result.value);
await cdp(ws, "Emulation.setScriptExecutionDisabled", { value: false }, sessionId);

check("content is readable without JavaScript", noJs.mainVisible);
check("form still renders without JavaScript", noJs.formPresent);
check("native required validation remains without JavaScript", noJs.requiredIntact >= 5, `${noJs.requiredIntact}`);

/* ------------------------------------------------------------------ done -- */
console.log("\n" + "=".repeat(60));
if (fails.length) {
  console.log(`FAILED: ${fails.length} check(s), ${pass} passed`);
  fails.forEach((f) => console.log(`  - ${f}`));
  ws.close(); chrome.kill(); process.exit(1);
}
console.log(`PASSED: all ${pass} interaction checks`);
ws.close(); chrome.kill(); process.exit(0);
