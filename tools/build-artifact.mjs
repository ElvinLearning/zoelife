/**
 * Builds the single-file shareable demo from the REAL built pages, so the demo
 * can never drift from the repo. Images are downscaled and inlined as data URIs
 * because the Artifact CSP blocks every external host.
 *
 *   node tools/serve.mjs 8765   (in another terminal)
 *   node tools/build-artifact.mjs
 */

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromePath, chromeFlags } from "./chrome.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2] || join(ROOT, "tools", "zoe-life-demo.html");
const PORT = 9335;
const BASE = "http://127.0.0.1:8765";
const CHROME = chromePath();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = [
  ["index.html", "Home"],
  ["about.html", "About"],
  ["books.html", "Books & Resources"],
  ["family-life.html", "Family Life"],
  ["contact.html", "Contact"],
];

/* Target widths tuned to how large each image ever renders. */
const IMAGES = {
  "assets/brand/zoe-life-logo.png": { w: 120, type: "image/png" },
  "assets/books/gratitude-devotional-cover.jpg": { w: 420, type: "image/jpeg", q: 0.82 },
  "assets/photos/founders-tayo-kemi.jpg": { w: 700, type: "image/jpeg", q: 0.82 },
  "assets/photos/small-group-study.jpg": { w: 760, type: "image/jpeg", q: 0.78 },
  "assets/photos/hands-reaching.jpg": { w: 620, type: "image/jpeg", q: 0.78 },
  "assets/photos/coaching-conversation.jpg": { w: 760, type: "image/jpeg", q: 0.78 },
  "assets/photos/cream-plaster-texture.jpg": { w: 900, type: "image/jpeg", q: 0.6 },
};

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

const chrome = spawn(CHROME, [
  ...chromeFlags(PORT, join(ROOT, "tools", ".chrome-artifact")),
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
const { targetId } = await cdp(ws, "Target.createTarget", { url: `${BASE}/index.html` });
const { sessionId } = await cdp(ws, "Target.attachToTarget", { targetId, flatten: true });
await cdp(ws, "Page.enable", {}, sessionId);
await cdp(ws, "Runtime.enable", {}, sessionId);
await sleep(800);

/* --------------------------------------------------- downscale to data URI -- */
console.log("Encoding images...");
const dataUris = {};
for (const [path, cfg] of Object.entries(IMAGES)) {
  const { result } = await cdp(ws, "Runtime.evaluate", {
    expression: `(async () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = ${JSON.stringify(`${BASE}/${path}`)};
      await img.decode();
      const scale = Math.min(1, ${cfg.w} / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL(${JSON.stringify(cfg.type)}${cfg.q ? `, ${cfg.q}` : ""});
    })()`,
    awaitPromise: true, returnByValue: true,
  }, sessionId);

  dataUris[path] = result.value;
  const before = statSync(join(ROOT, path)).size;
  const after = Math.round((result.value.length * 3) / 4);
  console.log(`  ${path.padEnd(48)} ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
}

ws.close();
chrome.kill();

/* ------------------------------------------------------------- assemble -- */
console.log("\nAssembling...");

let css = readFileSync(join(ROOT, "css/style.css"), "utf8");
const js = readFileSync(join(ROOT, "js/main.js"), "utf8");

// Fonts must be inlined too: the CSP blocks font files as much as any other host.
css = css.replace(/url\(\.\.\/fonts\/([^)]+)\)/g, (_, f) => {
  const b64 = readFileSync(join(ROOT, "fonts", f)).toString("base64");
  return `url(data:font/woff2;base64,${b64})`;
});
css = css.replace(/url\(\.\.\/(assets\/[^)]+)\)/g, (_, p) => `url(${dataUris[p] || ""})`);

// Scope the site CSS under .site so the demo chrome is unaffected by it.
const scoped = css
  .replace(/^(\s*)(body)\s*\{/gm, "$1.site {")
  .replace(/(^|\})\s*html\s*\{[^}]*\}/g, "$1");

const bodies = PAGES.map(([file]) => {
  let doc = readFileSync(join(ROOT, file), "utf8");
  for (const [p, uri] of Object.entries(dataUris)) doc = doc.split(p).join(uri);
  const main = doc.slice(doc.indexOf("<main id=\"main\">"), doc.indexOf("</main>") + 7);
  const footer = doc.slice(doc.indexOf('<footer class="site-footer">'), doc.indexOf("</footer>") + 9);
  const header = doc.slice(doc.indexOf('<header class="site-header">'), doc.indexOf("</header>") + 9);
  return { file, header, main, footer };
});

// Panel ids must be unique, and in-page links must target the visible panel.
const panels = bodies.map(({ file, header, main, footer }, i) => {
  const slug = file.replace(".html", "");
  let block = header + main + footer;
  // Turn cross-page links into panel switches.
  block = block.replace(/href="([a-z-]+\.html)(#[a-z-]+)?"/g,
    (_, f, hash) => `href="#" data-goto="${f.replace(".html", "")}"${hash ? ` data-hash="${hash.slice(1)}"` : ""}`);
  // Namespace ids so five copies of the chrome cannot collide.
  block = block.replace(/\bid="([^"]+)"/g, `id="${slug}--$1"`)
               .replace(/\bfor="([^"]+)"/g, `for="${slug}--$1"`)
               .replace(/aria-describedby="([^"]+)"/g,
                 (_, v) => `aria-describedby="${v.split(/\s+/).map((x) => `${slug}--${x}`).join(" ")}"`)
               .replace(/aria-controls="([^"]+)"/g, `aria-controls="${slug}--$1"`)
               .replace(/href="#([^"]+)"/g, (m, h) => (h === "" ? m : `href="#${slug}--${h}"`));
  return `<div class="site panel${i === 0 ? " is-active" : ""}" id="panel-${slug}" role="tabpanel" aria-labelledby="tab-${slug}"${i === 0 ? "" : " hidden"}>${block}</div>`;
}).join("\n");

const tabs = PAGES.map(([file, label], i) => {
  const slug = file.replace(".html", "");
  return `<button role="tab" id="tab-${slug}" class="tab${i === 0 ? " is-active" : ""}" data-panel="${slug}" aria-selected="${i === 0}" aria-controls="panel-${slug}">${label}</button>`;
}).join("");

const html = `<title>Zoe Life Phase 1</title>
<style>
/* ---- demo chrome. Deliberately cool and neutral so it reads as tooling,
       never as part of the warm Zoe Life site rendered beneath it. ---- */
:root{
  --chrome-bg:#20242A; --chrome-line:#333A43; --chrome-fg:#EEF1F4;
  --chrome-mute:#9AA6B2; --chrome-accent:#C9A227;
}
*{box-sizing:border-box}
body{margin:0;background:var(--chrome-bg);color:var(--chrome-fg);
  font:400 15px/1.6 "Outfit",system-ui,-apple-system,sans-serif}
.bar{position:sticky;top:0;z-index:500;background:var(--chrome-bg);
  border-bottom:1px solid var(--chrome-line)}
.bar-in{max-width:1400px;margin:0 auto;padding:.85rem clamp(1rem,3vw,1.75rem);
  display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center}
.mark{display:flex;flex-direction:column;gap:.15rem;margin-right:auto}
.mark b{font-size:.95rem;font-weight:600;letter-spacing:.01em}
.mark span{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--chrome-mute)}
.flag{display:inline-flex;align-items:center;gap:.4rem;font-size:.68rem;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:#0F1114;background:var(--chrome-accent);
  padding:.25rem .6rem;border-radius:2px}
.tabs{display:flex;flex-wrap:wrap;gap:.25rem;width:100%;border-top:1px solid var(--chrome-line);
  padding:.5rem clamp(1rem,3vw,1.75rem);max-width:1400px;margin:0 auto}
.tab{appearance:none;background:transparent;border:1px solid transparent;color:var(--chrome-mute);
  font:500 .88rem/1 inherit;padding:.6rem .9rem;border-radius:3px;cursor:pointer;min-height:40px}
.tab:hover{color:var(--chrome-fg);background:#2A2F36}
.tab.is-active{color:#0F1114;background:var(--chrome-accent);font-weight:600}
.tab:focus-visible,.note-x:focus-visible{outline:2px solid var(--chrome-accent);outline-offset:2px}
.strip{max-width:1400px;margin:0 auto;padding:.9rem clamp(1rem,3vw,1.75rem) 1.1rem;
  font-size:.85rem;color:var(--chrome-mute);border-top:1px solid var(--chrome-line)}
.strip b{color:var(--chrome-fg);font-weight:600}
.strip code{background:#2A2F36;padding:.1rem .35rem;border-radius:2px;font-size:.85em;color:#E4C86B}
.frame{max-width:1400px;margin:0 auto;padding:0 clamp(0rem,2vw,1.75rem) clamp(1rem,3vw,2rem)}
.panel{background:#FBF7F0;border:1px solid var(--chrome-line);border-radius:0 0 4px 4px;overflow:hidden}
.panel[hidden]{display:none}
/* the site's own sticky header must stick inside its panel, not the viewport */
.panel .site-header{position:relative}
@media (max-width:40rem){ .mark{margin-right:0;width:100%} }

/* ---- the Zoe Life site itself, scoped ---- */
${scoped}
</style>

<header class="bar">
  <div class="bar-in">
    <span class="mark"><b>Zoe Life Phase 1</b><span>Cozy Digital reference build</span></span>
    <span class="flag">Not published</span>
  </div>
  <div class="tabs" role="tablist" aria-label="Site pages">${tabs}</div>
  <p class="strip"><b>This is a review build, not the live site.</b> Forms validate but deliberately
    refuse to send, because no inbox is connected yet. Anything Zoe Life has not supplied
    (prices, store links, the journal cover, the long About copy) is marked
    <code>pending</code> rather than invented. Every page is <code>noindex</code>.</p>
</header>

<div class="frame">
${panels}
</div>

<script>
${js}
</script>
<script>
/* Panel switching for the demo. Replaces cross-page navigation, since all five
   pages live in one document here. */
(function(){
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var panels = [].slice.call(document.querySelectorAll('.panel'));

  function show(slug, hash){
    tabs.forEach(function(t){
      var on = t.dataset.panel === slug;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });
    panels.forEach(function(p){
      var on = p.id === 'panel-' + slug;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    var target = hash && document.getElementById(slug + '--' + hash);
    (target || document.querySelector('.bar')).scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: target ? 'start' : 'start'
    });
  }

  tabs.forEach(function(t){
    t.addEventListener('click', function(){ show(t.dataset.panel); });
  });

  // Roving arrow-key movement across the tablist.
  document.querySelector('.tabs').addEventListener('keydown', function(e){
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    var t = tabs[(next + tabs.length) % tabs.length];
    t.focus(); t.click();
  });

  document.addEventListener('click', function(e){
    var a = e.target.closest('[data-goto]');
    if (!a) return;
    e.preventDefault();
    show(a.dataset.goto, a.dataset.hash);
  });
})();
</script>
`;

writeFileSync(OUT, html, "utf8");
console.log(`\nWrote ${OUT}`);
console.log(`Size: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB (limit 16 MB)`);
