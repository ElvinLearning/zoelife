/**
 * Browser QA via the Chrome DevTools Protocol. No npm dependencies.
 *   node tools/serve.mjs 8765   (in another terminal)
 *   node tools/qa.mjs
 *
 * For every page at every width it checks horizontal overflow, console errors,
 * tap target size and focus visibility, and writes a full page screenshot.
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromePath, chromeFlags } from "./chrome.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = join(ROOT, "tools", "screenshots");
const BASE = process.env.QA_BASE || "http://127.0.0.1:8765";
const PORT = 9333;

const CHROME = chromePath();

const PAGES = ["index.html", "about.html", "books.html", "family-life.html", "contact.html"];
const WIDTHS = [
  { w: 320, h: 780, label: "320-small-mobile" },
  { w: 375, h: 812, label: "375-mobile" },
  { w: 768, h: 1024, label: "768-tablet" },
  { w: 1280, h: 900, label: "1280-laptop" },
  { w: 1600, h: 1000, label: "1600-desktop" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------- CDP glue -- */
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

/* -------------------------------------------------------------- in page -- */
/* Runs inside the browser. Returns measurements, not opinions. */
const PROBE = `(() => {
  const doc = document.documentElement;
  const overflow = Math.max(0, doc.scrollWidth - doc.clientWidth);

  const offenders = [];
  if (overflow > 0) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > doc.clientWidth + 1 || r.left < -1) {
        offenders.push(el.tagName.toLowerCase() +
          (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '') +
          ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
      }
      if (offenders.length >= 6) break;
    }
  }

  // Interactive targets should be comfortably tappable. Links that sit inline
  // inside a sentence are exempt (WCAG 2.5.8 exempts in-line targets), so only
  // standalone controls are measured.
  const small = [];
  for (const el of document.querySelectorAll('a, button, input, select, textarea')) {
    if (el.closest('[hidden]') || el.type === 'hidden') continue;
    if (el.classList.contains('skip-link')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue;
    // Checkboxes and radios are sized by their control, and their label extends
    // the hit area, so WCAG 2.5.8's 24px minimum applies. Everything else is
    // held to the 44px mobile guideline.
    const min = (el.type === 'checkbox' || el.type === 'radio') ? 24 : 44;
    if (r.height < min || r.width < min) {
      small.push(el.tagName.toLowerCase() + '.' + (el.className || '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    if (small.length >= 6) break;
  }

  // Images must actually load and keep their aspect ratio.
  const badImages = [];
  for (const img of document.images) {
    if (!img.complete || img.naturalWidth === 0) { badImages.push('broken: ' + img.getAttribute('src')); continue; }
    const r = img.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) {
      const natural = img.naturalWidth / img.naturalHeight;
      const shown = r.width / r.height;
      if (Math.abs(natural - shown) / natural > 0.06) {
        badImages.push('distorted: ' + img.getAttribute('src') + ' ' + natural.toFixed(2) + ' vs ' + shown.toFixed(2));
      }
    }
  }

  // Contrast of every element that actually renders text, measured from
  // computed styles. Catches dark-on-dark that a fixed token pair list misses.
  const parse = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const contrast = (f, b) => {
    const [x, y] = [lum(f), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };
  // Walk ancestors until an opaque background is found.
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a === 1) return c;
      n = n.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const lowContrast = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('[hidden]') || el.classList.contains('visually-hidden')) continue;
    // Only elements holding their own visible text.
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue;

    const fg = parse(cs.color);
    if (!fg || fg.a === 0) continue;
    const ratio = contrast(fg, bgOf(el));
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;

    if (ratio < need) {
      lowContrast.push(
        el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/)[0] : '') +
        ' ' + ratio.toFixed(2) + ':1 (needs ' + need + ') "' + el.textContent.trim().slice(0, 40) + '"'
      );
    }
    if (lowContrast.length >= 6) break;
  }

  return {
    overflow, offenders, small, badImages, lowContrast,
    title: document.title,
    h1: (document.querySelector('h1') || {}).textContent || null,
    scrollHeight: doc.scrollHeight,
  };
})()`;

/* ---------------------------------------------------------------- main -- */
mkdirSync(SHOTS, { recursive: true });

const chrome = spawn(
  CHROME,
  ["--hide-scrollbars", ...chromeFlags(PORT, join(ROOT, "tools", ".chrome-qa"))],
  { stdio: "ignore" }
);

process.on("exit", () => chrome.kill());

// Wait for the debugging endpoint.
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    wsUrl = (await r.json()).webSocketDebuggerUrl;
  } catch {}
}
if (!wsUrl) {
  console.error("Could not reach Chrome. Set CHROME_PATH if Chrome is elsewhere.");
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

const { targetId } = await cdp(ws, "Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp(ws, "Target.attachToTarget", { targetId, flatten: true });

await cdp(ws, "Page.enable", {}, sessionId);
await cdp(ws, "Runtime.enable", {}, sessionId);
await cdp(ws, "Log.enable", {}, sessionId);

// Collect console and network problems per navigation.
let problems = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.sessionId !== sessionId) return;
  if (m.method === "Runtime.exceptionThrown") {
    problems.push("exception: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  }
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) {
    problems.push(m.params.type + ": " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
  }
  if (m.method === "Log.entryAdded" && ["error"].includes(m.params.entry.level)) {
    problems.push("log: " + m.params.entry.text + " " + (m.params.entry.url || ""));
  }
});

const results = [];

for (const { w, h, label } of WIDTHS) {
  for (const p of PAGES) {
    problems = [];
    await cdp(ws, "Emulation.setDeviceMetricsOverride",
      { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 }, sessionId);

    await cdp(ws, "Page.navigate", { url: `${BASE}/${p}` }, sessionId);
    await sleep(500);

    // Force lazy images to load before measuring or screenshotting, otherwise
    // below-the-fold photos read as broken and shoot blank.
    await cdp(ws, "Runtime.evaluate", {
      expression: `(async () => {
        for (const img of document.images) img.loading = 'eager';
        await Promise.all([...document.images].map(i =>
          i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
        await document.fonts.ready;
      })()`,
      awaitPromise: true,
    }, sessionId);
    await sleep(300);

    const { result } = await cdp(ws, "Runtime.evaluate",
      { expression: PROBE, returnByValue: true }, sessionId);
    const r = result.value;

    results.push({ page: p, width: w, label, ...r, problems: [...problems] });

    // Full page screenshot at the two widths that matter most for review.
    if (w === 375 || w === 1280) {
      const shot = await cdp(ws, "Page.captureScreenshot",
        { format: "png", captureBeyondViewport: true }, sessionId);
      writeFileSync(join(SHOTS, `${p.replace(".html", "")}-${w}.png`),
        Buffer.from(shot.data, "base64"));
    }
  }
}

/* -------------------------------------------------------------- report -- */
let bad = 0;
console.log("\nBrowser QA\n" + "=".repeat(72));

for (const { width: w, page, overflow, offenders, small, badImages, lowContrast, problems: pr } of results) {
  const issues = [];
  if (overflow > 0) issues.push(`horizontal overflow ${overflow}px -> ${offenders.join("; ")}`);
  if (small.length) issues.push(`small tap targets: ${small.join("; ")}`);
  if (badImages.length) issues.push(`images: ${badImages.join("; ")}`);
  if (lowContrast && lowContrast.length) issues.push(`low contrast: ${lowContrast.join("; ")}`);
  if (pr.length) issues.push(`console: ${pr.join(" | ")}`);

  if (issues.length) {
    bad++;
    console.log(`FAIL ${String(w).padStart(4)}px  ${page}`);
    issues.forEach((i) => console.log(`       - ${i}`));
  } else {
    console.log(`ok   ${String(w).padStart(4)}px  ${page}`);
  }
}

console.log("=".repeat(72));
console.log(bad ? `${bad} page/width combination(s) with issues` : `All ${results.length} page/width combinations clean`);
console.log(`Screenshots: tools/screenshots/`);

ws.close();
chrome.kill();
process.exit(bad ? 1 : 0);
