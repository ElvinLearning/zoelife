/**
 * Generates the five Squarespace code-block snippets for the Phase 1 preview
 * pages. Run:  node tools/build-squarespace-blocks.mjs
 *
 * Each snippet is self-contained: scoped CSS under .zl-p1 plus a width breakout
 * so it escapes Squarespace's narrow fluid-engine block without needing the
 * grid to be resized by hand. Photography is referenced from Zoe Life's own
 * Squarespace CDN so nothing needs uploading.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "tools", "sqs-blocks");
mkdirSync(OUT, { recursive: true });

const CDN = "https://images.squarespace-cdn.com/content/v1/6a245c8408b375738ac73ffa";
const IMG = {
  study: `${CDN}/533f98d2-1eae-4f0b-bcf2-91d5f686505b/steptodown.com847866.jpg`,
  founders: `${CDN}/84801124-6134-430f-b4e6-c0f3d8bea3ac/ZOE+LIFE+HUB.png`,
  hands: `${CDN}/1784914554707-UHQ94030IAKXUD66WQ64/unsplash-image-lyiKExA4zQA.jpg`,
  coaching: `${CDN}/dcbdeb7f-053a-408b-8125-7420637a6dae/COACHING+ZOE+LIFE.jpg`,
  serve: `${CDN}/ba8f84cc-5a2b-4818-a3ea-6b4f8fbff6f2/who+we+serve.jfif`,
};

const TAGLINE = "Helping People Thrive in Every Season of Life";
const MISSION =
  "Zoe Life equips individuals, couples, families, churches, and organizations with " +
  "biblical truth, practical wisdom, and Christ-centered resources to help them thrive " +
  "in every season of life.";

/* Width breakout is the important part: Squarespace drops a code block into a
   narrow grid cell, so the wrapper escapes it with 100vw rather than relying on
   the fluid-engine resize handles. */
const CSS = `<style>
.sqs-block-code,.sqs-block-content,.fe-block,.fluid-engine,.page-section,.content-wrapper,article,main{overflow:visible !important}
/* Fluid engine puts each block in a grid cell. Span every column rather than
   using a 100vw breakout, which assumes the block is horizontally centred. */
.fluid-engine:has(.zl-p1){display:block !important;padding:0 !important}
.fe-block:has(.zl-p1){grid-area:auto !important;grid-column:1 / -1 !important;width:100% !important;max-width:none !important;position:static !important}
.fe-block:has(.zl-p1) .sqs-block,.fe-block:has(.zl-p1) .sqs-block-content{padding:0 !important;height:auto !important}
.zl-p1{
--cream:#FBF7F0;--cream-deep:#F4ECDF;--sand:#E5D9C3;--white:#fff;--gold:#C9A227;--gold-text:#A38119;--gold-deep:#7A600F;--sage:#6F7D5E;--sage-deep:#4C5840;--terracotta:#9C5227;--ink:#2E2A24;--ink-soft:#5A5248;
--d:'Fraunces',Georgia,serif;--s:'Outfit','Segoe UI',system-ui,sans-serif;
background:var(--cream);color:var(--ink);font-family:var(--s);line-height:1.65;font-size:17px;text-align:left}
.zl-p1 *{box-sizing:border-box}
.zl-p1 .w{width:min(100% - 3rem,68rem);margin-inline:auto}
.zl-p1 section{padding-block:clamp(2.8rem,7vw,6rem)}
.zl-p1 .deep{background:var(--cream-deep)}
.zl-p1 .sage{background:var(--sage-deep);color:#F6F4EE}
.zl-p1 .sage h2,.zl-p1 .sage h3{color:#fff}
.zl-p1 .sage .lede,.zl-p1 .sage li,.zl-p1 .sage p,.zl-p1 .sage .meta{color:#E4DFD4}
.zl-p1 h1,.zl-p1 h2,.zl-p1 h3{font-family:var(--d);font-weight:600;line-height:1.15;margin:0 0 .5em;color:var(--ink);text-wrap:balance}
.zl-p1 h1{font-size:clamp(2.1rem,1.4rem + 3vw,3.6rem);letter-spacing:-.015em}
.zl-p1 h2{font-size:clamp(1.6rem,1.2rem + 1.8vw,2.5rem);letter-spacing:-.01em}
.zl-p1 h3{font-size:clamp(1.1rem,1rem + .5vw,1.4rem)}
.zl-p1 h4{font-family:var(--s);font-size:1rem;font-weight:600;margin:0 0 .2rem;color:var(--ink)}
.zl-p1 p{margin:0 0 1.05em;max-width:64ch}
.zl-p1 ul{padding-left:1.15em;margin:0 0 1em}
.zl-p1 li{margin-bottom:.4em}
.zl-p1 a{color:var(--sage-deep);text-underline-offset:.18em}
.zl-p1 .sage a{color:#EBD79A}
.zl-p1 .eyebrow{font-size:.75rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--gold-deep);margin:0 0 1rem;display:flex;align-items:center;gap:.7rem}
.zl-p1 .eyebrow::after{content:"";flex:1;height:1px;background:var(--sand);max-width:5rem}
.zl-p1 .sage .eyebrow{color:#D9C88A}
.zl-p1 .sage .eyebrow::after{background:rgba(255,255,255,.28)}
.zl-p1 .lede{font-size:clamp(1.02rem,1rem + .35vw,1.25rem);color:var(--ink-soft);line-height:1.6}
.zl-p1 .tagline{font-family:var(--d);font-style:italic;font-size:clamp(1.1rem,1rem + .8vw,1.5rem);color:var(--terracotta);margin:0 0 1.1rem;max-width:36ch}
.zl-p1 .btn{display:inline-flex;align-items:center;justify-content:center;font-family:var(--s);font-size:.98rem;font-weight:500;padding:.8rem 1.5rem;border-radius:4px;border:1.5px solid transparent;text-decoration:none;min-height:48px}
.zl-p1 .btn-p{background:var(--sage-deep);color:#fff;border-color:var(--sage-deep)}
.zl-p1 .btn-s{background:transparent;color:var(--ink);border-color:var(--sand)}
.zl-p1 .sage .btn-s{color:#F6F4EE;border-color:rgba(255,255,255,.4)}
.zl-p1 .btn-off{background:transparent;color:var(--ink-soft);border:1.5px dashed var(--sand);cursor:not-allowed}
.zl-p1 .row{display:flex;flex-wrap:wrap;gap:.7rem;margin-top:1.5rem}
.zl-p1 .grid{display:grid;gap:clamp(1.1rem,2.5vw,1.9rem)}
.zl-p1 .g2{grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))}
.zl-p1 .g3{grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
.zl-p1 .split{display:grid;gap:clamp(1.5rem,3.5vw,3rem);align-items:center;grid-template-columns:1fr}
@media(min-width:52rem){.zl-p1 .split{grid-template-columns:1fr 1fr}}
.zl-p1 .card{background:var(--white);border:1px solid var(--sand);border-radius:4px;padding:clamp(1.1rem,2.5vw,1.7rem)}
.zl-p1 .card p{font-size:.95rem;color:var(--ink-soft)}
.zl-p1 .num{font-family:var(--d);font-size:1.5rem;color:var(--gold-text);line-height:1;display:block;margin-bottom:.45rem}
.zl-p1 .pathway{border-top:3px solid var(--sage)}
.zl-p1 .planned{border-left:4px solid var(--sand);background:var(--cream-deep)}
.zl-p1 .parent{border-left:4px solid var(--gold)}
.zl-p1 .child{border-left:4px solid var(--sage)}
.zl-p1 .pending{display:inline-block;font-size:.66rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--terracotta);background:#FBEDE2;border:1px solid #F0C9A8;border-radius:100px;padding:.2rem .6rem}
.zl-p1 .note{border-left:3px solid var(--gold);background:var(--white);padding:.95rem 1.2rem;margin:1.4rem 0;font-size:.93rem;color:var(--ink-soft)}
.zl-p1 .note b{color:var(--ink)}
.zl-p1 .meta{font-size:.85rem;color:var(--ink-soft)}
.zl-p1 figure{margin:0}
.zl-p1 img{max-width:100%;height:auto;display:block;border-radius:4px}
.zl-p1 .founders{aspect-ratio:1/1;object-fit:cover;object-position:52% 34%;border:1px solid var(--sand)}
.zl-p1 .banner{background:#2E2A24;color:#F6F4EE;padding:.75rem 1.2rem;font-size:.84rem;text-align:center}
.zl-p1 .banner b{color:#E4C86B}
.zl-p1 .chips{display:flex;flex-wrap:wrap;gap:.5rem;list-style:none;margin:0;padding:0}
.zl-p1 .chips li{margin:0}
.zl-p1 .chip{display:inline-flex;align-items:center;gap:.4rem;font-size:.88rem;font-weight:500;padding:.5rem .85rem;min-height:44px;border:1.5px solid var(--sand);border-radius:4px;color:var(--ink);text-decoration:none;background:var(--cream)}
.zl-p1 .chip-off{border-style:dashed;color:var(--ink-soft);cursor:not-allowed}
.zl-p1 .fmt{border:1px solid var(--sand);border-radius:4px;background:var(--white);padding:1rem 1.2rem;margin-bottom:.85rem}
.zl-p1 .cover{border:1px solid var(--sand);border-radius:4px;background:var(--white);box-shadow:0 10px 26px rgba(46,42,36,.08)}
.zl-p1 .cover-x{aspect-ratio:2/3;display:flex;flex-direction:column;gap:.6rem;align-items:center;justify-content:center;text-align:center;border:2px dashed var(--sand);border-radius:4px;background:var(--cream-deep);color:var(--ink-soft);padding:1.2rem;font-size:.88rem}
.zl-p1 .book{display:grid;gap:clamp(1.3rem,3vw,2.5rem);grid-template-columns:1fr;align-items:start}
@media(min-width:48rem){.zl-p1 .book{grid-template-columns:minmax(0,14rem) 1fr}}
.zl-p1 .fld{margin-bottom:1rem}
.zl-p1 .fld label{display:block;font-size:.9rem;font-weight:600;margin-bottom:.3rem}
.zl-p1 .fld .box{border:1.5px solid var(--sand);border-radius:4px;background:var(--cream);min-height:46px;padding:.7rem .85rem;color:var(--ink-soft);font-size:.93rem}
.zl-p1 .fld .box.ta{min-height:6rem}
.zl-p1 .req{color:var(--terracotta)}
.zl-p1 .dl{list-style:none;margin:0;padding:0}
.zl-p1 .dl li{display:flex;flex-wrap:wrap;gap:.3rem 1rem;padding:.65rem 0;border-bottom:1px solid var(--sand);margin:0;font-size:.94rem}
.zl-p1 .sage .dl li{border-bottom-color:rgba(255,255,255,.2)}
.zl-p1 .dl .k{font-weight:600;min-width:10.5rem}
</style>`;

const banner = (label) =>
  `<div class="banner"><b>Phase 1 preview: ${label}.</b> Not the live site. Forms and booking are not connected, and anything Zoe Life has not supplied is marked pending.</div>`;

const ZL = [
  ["Facebook", "https://www.facebook.com/zoelifehub"],
  ["Instagram", "https://www.instagram.com/zoelifehub/"],
  ["TikTok", "https://www.tiktok.com/@zoelifehub1"],
  ["YouTube", "https://www.youtube.com/@zoelifehub1"],
  ["X", "https://x.com/zoelifehub"],
];
const ZFL = [
  ["Facebook", "https://www.facebook.com/zoefamilylife10"],
  ["Instagram", "https://www.instagram.com/zoefamilylife"],
  ["TikTok", "https://www.tiktok.com/@zoefamilylife"],
  ["YouTube", "https://www.youtube.com/@zoefamilylife"],
];
const chips = (list) =>
  `<ul class="chips">${list
    .map(([n, u]) => `<li><a class="chip" href="${u}" target="_blank" rel="noopener noreferrer">${n}</a></li>`)
    .join("")}</ul>`;

const stores = (list) =>
  `<ul class="chips">${list
    .map((s) => `<li><span class="chip chip-off">${s} <span class="pending">Link pending</span></span></li>`)
    .join("")}</ul>`;

/* ---------------------------------------------------------------- pages -- */

const PAGES = {};

PAGES.about = `
${banner("About")}
<section><div class="w">
  <p class="eyebrow">About</p>
  <h1>About Zoe Life</h1>
  <p class="tagline">${TAGLINE}</p>
  <p class="lede">${MISSION}</p>
</div></section>

<section class="deep"><div class="w split">
  <div>
    <p class="eyebrow">The meaning of Zoe</p>
    <h2>Life as God intends it.</h2>
    <p>Zoe comes from the Greek word for life. In Scripture it often refers to the fullness of life that comes from God, not simply being alive but living well, with purpose and hope.</p>
    <p><em>"I have come that they may have life, and that they may have it more abundantly."</em> John 10:10, NKJV</p>
    <p>That abundant life is the heart of this organization. Zoe Life exists to help people experience it, whatever season they are in.</p>
  </div>
  <figure><img src="${IMG.hands}" alt="Two people reaching out to take hold of each other's hands." loading="lazy"></figure>
</div></section>

<section><div class="w grid g2">
  <div>
    <p class="eyebrow">Mission</p>
    <h2>Biblical and practical.</h2>
    <p>${MISSION}</p>
    <p>Zoe Life starts with what Scripture says, then works out what it means in practice, through thoughtful questions, biblically grounded guidance, and practical tools.</p>
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
</div></section>

<section class="deep"><div class="w">
  <p class="eyebrow">Meet the founders</p>
  <div class="split">
    <figure>
      <img class="founders" src="${IMG.founders}" alt="Tayo and Kemi Akinyemi smiling together." loading="lazy">
      <figcaption class="meta" style="margin-top:.55rem">Pastors Tayo and Kemi Akinyemi, founders of Zoe Life.</figcaption>
    </figure>
    <div>
      <h2>Tayo and Kemi Akinyemi</h2>
      <p>Tayo and Kemi Akinyemi are the founders of Zoe Life and pastors of Life Springs Church.</p>
      <p>They are founders, pastors, coaches, mentors, parents, and professionals. Their work brings together ministry experience, professional leadership, teaching, mentoring, coaching, and lifelong learning.</p>
      <p>Their public focus includes relationships, family life, leadership, education, careers, stewardship, and personal growth through Scripture.</p>
      <p><span class="pending">Biography pending</span></p>
    </div>
  </div>
  <div class="note"><b>Content note for Zoe Life.</b> The wording above is drawn from the current public zoelifehub.com pages. The longer "About Zoe Life" and "Meet Tayo &amp; Kemi" copy sent by email has not been supplied to this build, so nothing has been invented to fill the gap. Send that copy and it will replace these sections.</div>
</div></section>

<section><div class="w">
  <p class="eyebrow">What Zoe Life does</p>
  <h2>Ways we serve.</h2>
  <div class="grid g3" style="margin-top:2.2rem">
    <div class="card"><h3>Coaching</h3><p>Personalized guidance rooted in God's Word, for important decisions, relationships, and changing seasons. Areas include marriage, premarital, relationships, parenting and family, academic, career, and leadership.</p></div>
    <div class="card"><h3>Speaking and teaching</h3><p>Serving churches, conferences, ministries, schools, organizations, and community groups. Topics include marriage, parenting, family life, spiritual growth, Christian living, leadership, stewardship, purpose, and discipleship.</p></div>
    <div class="card"><h3>Workshops</h3><p>Marriage enrichment, premarital preparation, parenting, leadership development, Christian living, communication, conflict resolution, stewardship, and personal growth.</p></div>
  </div>
</div></section>

<section class="sage"><div class="w">
  <p class="eyebrow">Where next</p>
  <h2>Take a next step.</h2>
  <p class="lede">Browse the launch resources, send a message, or ask about a complimentary 20 minute consultation.</p>
</div></section>`;

PAGES.books = `
${banner("Books and Resources")}
<section><div class="w">
  <p class="eyebrow">Books and Resources</p>
  <h1>Resources for everyday faith.</h1>
  <p class="lede">Two gratitude resources launch first. More books, workbooks, and guides will be added here as they are published.</p>
  <div class="note"><b>Nothing is on sale yet.</b> Zoe Life has not yet confirmed final covers, prices, or store listings. Buying options below are shown as pending rather than as live links, so nothing on this page is misleading.</div>
</div></section>

<section class="deep"><div class="w book">
  <div><div class="cover-x"><span class="pending">Cover supplied, not yet uploaded</span><span>The final cover for A 7-Day Gratitude Devotional exists and is in the reference build. It still needs uploading to Squarespace.</span></div></div>
  <div>
    <p class="eyebrow">Devotional</p>
    <h2>A 7-Day Gratitude Devotional</h2>
    <p class="lede">Cultivating a Heart of Thanksgiving to God. By Kemi Akinyemi.</p>
    <p><span class="pending">Description pending</span> <span class="pending">Price pending</span></p>
    <h3 style="margin-top:1.8rem">Choose a format</h3>
    <div class="fmt"><h4>Read on Kindle</h4><p class="meta">Kindle edition, read on any Kindle app or device.</p>${stores(["Amazon Kindle"])}</div>
    <div class="fmt"><h4>Digital download</h4><p class="meta">Instant download, read on any device.</p>${stores(["Etsy", "Gumroad", "Selar"])}</div>
    <div class="fmt"><h4>Printed copy</h4><p class="meta">Paperback, shipped to you.</p>${stores(["Zoe Life store", "Amazon"])}</div>
  </div>
</div></section>

<section><div class="w book">
  <div><div class="cover-x"><span class="pending">Cover pending</span><span>The final cover for A 100-Day Gratitude Journal has not been supplied by Zoe Life yet.</span></div></div>
  <div>
    <p class="eyebrow">Journal</p>
    <h2>A 100-Day Gratitude Journal</h2>
    <p class="lede">A companion journal for recording gratitude over 100 days.</p>
    <p><span class="pending">Description pending</span> <span class="pending">Price pending</span></p>
    <h3 style="margin-top:1.8rem">Choose a format</h3>
    <div class="fmt"><h4>Printable PDF</h4><p class="meta">Digital download, print at home or use on a tablet.</p>${stores(["Etsy", "Gumroad", "Selar"])}</div>
    <div class="fmt"><h4>Printed copy</h4><p class="meta">Paperback journal, shipped to you.</p>${stores(["Zoe Life store", "Amazon"])}</div>
    <p class="meta">No Kindle edition is planned for the journal.</p>
  </div>
</div></section>

<section class="deep"><div class="w split">
  <div>
    <p class="eyebrow">Better together</p>
    <h2>How the two work together.</h2>
    <p>The devotional carries you through seven days of reflection on thanksgiving to God. The journal gives you 100 days of space to keep going, recording what you are grateful for well beyond the first week.</p>
    <p>Start with the devotional, then continue in the journal.</p>
    <p><span class="pending">Companion copy pending</span></p>
  </div>
  <div class="card">
    <h3>Also published by Zoe Life</h3>
    <p><b>Questions Every Christian Couple Should Discuss Before Marriage</b><br>A Biblical Conversation Guide for Couples Considering Marriage. Workbook by Tayo and Kemi Akinyemi.</p>
    <p><span class="pending">Availability pending</span></p>
  </div>
</div></section>

<section class="sage"><div class="w">
  <h2>More resources are coming.</h2>
  <p class="lede">This page is built to grow. Future books, workbooks, guides, and course materials will be added in the same format, alongside the resources above.</p>
</div></section>`;

PAGES.family = `
${banner("Family Life and Socials")}
<section><div class="w">
  <p class="eyebrow">Programs and socials</p>
  <h1>One family of work.</h1>
  <p class="lede">Zoe Life is the parent brand. Focused programs sit beneath it, each with its own audience and, where they exist, its own social accounts.</p>
</div></section>

<section><div class="w">
  <p class="eyebrow">The parent brand</p>
  <div class="card parent">
    <h2>Zoe Life</h2>
    <p class="tagline" style="font-size:1.1rem;margin:.4rem 0 .9rem">${TAGLINE}</p>
    <p>${MISSION} Zoe Life covers spiritual growth, relationships, personal development, and academic and professional life. It is not limited to any single one of them.</p>
    ${chips(ZL)}
    <p class="meta" style="margin-top:.9rem">These are the main Zoe Life accounts, also linked in the footer of every page.</p>
  </div>
</div></section>

<section class="deep"><div class="w">
  <p class="eyebrow">Programs under Zoe Life</p>
  <h2>Focused areas.</h2>
  <p class="lede">Zoe Family Life is the first. Others are planned and will appear here as they launch, without changing how this page works.</p>
  <div class="grid" style="margin-top:2.2rem;gap:1.1rem">
    <div class="card child">
      <h3>Zoe Family Life</h3>
      <p>The first focused program under Zoe Life, centred on relationships, marriage, parenting, and family life.</p>
      ${chips(ZFL)}
      <p class="meta" style="margin-top:.9rem">No X account for Zoe Family Life at this time.</p>
    </div>
    <div class="card planned">
      <h3>Academic and Career <span class="pending">Planned</span></h3>
      <p>Support for students, young adults, and professionals across education, careers, leadership, and stewardship. Planned as a later Zoe Life program.</p>
      <p class="meta">Program not yet launched. No accounts to list.</p>
    </div>
    <div class="card planned">
      <h3>Faith and Life Resources <span class="pending">Planned</span></h3>
      <p>Books, devotionals, journals, studies, and courses for spiritual and personal growth. Published today through Books and Resources.</p>
      <p class="meta">Published under the main Zoe Life accounts for now.</p>
    </div>
  </div>
</div></section>

<section><div class="w split">
  <div>
    <p class="eyebrow">Zoe Family Life</p>
    <h2>Relationships, marriage, parenting, family.</h2>
    <p>Zoe Family Life is where Zoe Life focuses specifically on the home: preparing for marriage, strengthening a marriage, raising children, and building family life that lasts.</p>
    <p>It carries its own social accounts so families can follow that conversation directly, while Zoe Life remains the parent brand across everything else.</p>
  </div>
  <figure><img src="${IMG.coaching}" alt="Two people in a supportive one to one coaching conversation." loading="lazy"></figure>
</div></section>`;

PAGES.contact = `
${banner("Contact")}
<section><div class="w">
  <p class="eyebrow">Contact</p>
  <h1>Get in touch.</h1>
  <p class="lede">Send a message, or book a complimentary 20 minute consultation. They are two separate things, so pick whichever fits.</p>
</div></section>

<section class="deep"><div class="w split" style="align-items:start">
  <div>
    <h2>Send us a message</h2>
    <p>The Contact Us form collects the fields below and routes privately to the Zoe Life inbox. Zoe Life aims to reply within three business days.</p>
    <div class="card" style="margin-top:1.2rem">
      <div class="fld"><label>First name <span class="req">*</span></label><div class="box"></div></div>
      <div class="fld"><label>Last name <span class="req">*</span></label><div class="box"></div></div>
      <div class="fld"><label>Email address <span class="req">*</span></label><div class="box"></div></div>
      <div class="fld"><label>Phone number <span class="req">*</span></label><div class="box"></div></div>
      <div class="fld"><label>Reason for contacting <span class="req">*</span></label><div class="box">Coaching / Speaking Engagement / Workshop / Group Session / Academic or Career Support / Books &amp; Resources / Collaboration / Partnership / General Inquiry / Other</div></div>
      <div class="fld"><label>If Other, tell us more</label><div class="box"></div></div>
      <div class="fld"><label>Message <span class="req">*</span></label><div class="box ta"></div></div>
      <span class="btn btn-off">Form not connected yet</span>
    </div>
    <div class="note"><b>This is a layout preview, not a working form.</b> No submission is possible and nothing would be delivered. The real Squarespace Form Block goes in once contact@zoelifehub.com is verified as receiving mail.</div>
  </div>
  <div>
    <div class="card"><h3>Prefer to talk?</h3><p>Book a complimentary 20 minute consultation instead. It is a separate booking, not this form.</p></div>
    <div class="card" style="margin-top:1.1rem"><h3>Follow Zoe Life</h3>${chips(ZL)}</div>
    <div class="note"><b>Message delivery.</b> Messages are sent through FormSubmit for delivery to the Zoe Life team.</div>
  </div>
</div></section>

<section class="sage"><div class="w">
  <p class="eyebrow">Complimentary consultation</p>
  <h2>A free 20 minute conversation.</h2>
  <p class="lede">No cost and no deposit. A short call to understand where you are and whether Zoe Life can help.</p>
  <div class="split" style="margin-top:2.2rem;align-items:start">
    <div>
      <h3>How it works</h3>
      <ul class="dl">
        <li><span class="k">Length</span><span>20 minutes</span></li>
        <li><span class="k">Cost</span><span>Free, no deposit</span></li>
        <li><span class="k">When</span><span>Mondays and Wednesdays, 6:00 to 8:00 PM Central</span></li>
        <li><span class="k">Notice</span><span>At least 24 hours ahead</span></li>
        <li><span class="k">How far ahead</span><span>Up to 30 days</span></li>
        <li><span class="k">Where</span><span>Zoom, link sent on confirmation</span></li>
        <li><span class="k">Reminders</span><span>Confirmation, then 24 hours and 1 hour before</span></li>
      </ul>
    </div>
    <div>
      <h3>What you will be asked</h3>
      <p>Name, email, phone, and a brief description of what you would like to discuss, plus:</p>
      <ul>
        <li><b>Topic:</b> Coaching, Speaking Engagement, Workshop / Group Session, Academic Support, Career Support, Books &amp; Resources, Collaboration / Partnership, or Other / Not Sure</li>
        <li><b>How you heard about Zoe Life:</b> friend or family, church or ministry, Instagram, Facebook, TikTok, YouTube, a Zoe Life resource, search, or other</li>
      </ul>
      <div class="row"><span class="btn btn-off">Booking opens soon</span></div>
      <p class="meta">The scheduling tool is not configured against contact@zoelifehub.com yet, so there is no booking link to publish.</p>
    </div>
  </div>
</div></section>`;

/* Home, rebuilt with the width breakout. */
PAGES.home = `
${banner("Home")}
<section><div class="w">
  <p class="eyebrow">Zoe Life</p>
  <h1>Life, in all its fullness.</h1>
  <p class="tagline">${TAGLINE}</p>
  <p class="lede">${MISSION}</p>
</div></section>

<section class="deep"><div class="w split">
  <div>
    <p class="eyebrow">What is Zoe Life</p>
    <h2>Zoe is the Greek word for life.</h2>
    <p>In Scripture it often points to the fullness of life that comes from God. That idea sits at the centre of everything Zoe Life does.</p>
    <p><em>"I have come that they may have life, and that they may have it more abundantly."</em> John 10:10, NKJV</p>
    <p>Zoe Life is biblical and practical. We start with what Scripture says, then work out what it means for real decisions, real relationships, and real seasons.</p>
  </div>
  <figure><img src="${IMG.study}" alt="A small group of adults studying and discussing an open Bible together around a table." loading="lazy"></figure>
</div></section>

<section><div class="w">
  <p class="eyebrow">Who Zoe Life serves</p>
  <h2>Every season looks different.</h2>
  <p class="lede">Zoe Life works with people across many stages and settings.</p>
  <div class="grid g3" style="margin-top:2.2rem">
    <div class="card"><h3>People</h3><ul>
      <li>Individuals seeking spiritual and personal growth</li>
      <li>Couples preparing for or strengthening marriage</li>
      <li>Parents and families</li>
      <li>Students and young adults</li>
      <li>Professionals and leaders</li></ul></div>
    <div class="card"><h3>Communities</h3><ul>
      <li>Churches and ministries</li>
      <li>Schools and organizations</li>
      <li>Small groups and community groups</li></ul></div>
    <div class="card"><h3>How we help</h3><ul>
      <li><b>Spiritually:</b> growing in Christ and applying God's Word</li>
      <li><b>Relationally:</b> healthy marriages, families, friendships</li>
      <li><b>Personally:</b> wisdom, character, purpose, resilience</li>
      <li><b>Professionally:</b> education, careers, leadership, stewardship</li></ul></div>
  </div>
</div></section>

<section class="deep"><div class="w">
  <p class="eyebrow">Where to start</p>
  <h2>Three pathways.</h2>
  <p class="lede">Zoe Life is the parent brand. Focused programs sit beneath it, and more are planned.</p>
  <div class="grid g3" style="margin-top:2.2rem">
    <div class="card pathway"><span class="num">01</span><h3>Relationships and Family</h3><p>Marriage, premarital preparation, parenting, and family life. Delivered through the Zoe Family Life program.</p></div>
    <div class="card pathway"><span class="num">02</span><h3>Academic and Career</h3><p>Education, careers, leadership, and stewardship for students, young adults, and working professionals.</p></div>
    <div class="card pathway"><span class="num">03</span><h3>Faith and Life Resources</h3><p>Devotionals, journals, and study resources for growing in Christ and applying Scripture to everyday life.</p></div>
  </div>
</div></section>

<section><div class="w">
  <p class="eyebrow">Launch resources</p>
  <h2>Two gratitude resources, built to work together.</h2>
  <div class="grid g2" style="margin-top:2.2rem">
    <div class="card"><h3>A 7-Day Gratitude Devotional</h3><p>Cultivating a Heart of Thanksgiving to God. By Kemi Akinyemi.</p><p><span class="pending">Description pending</span></p></div>
    <div class="card"><h3>A 100-Day Gratitude Journal</h3><p>A companion journal for recording gratitude over 100 days.</p><p><span class="pending">Description pending</span></p></div>
  </div>
  <div class="note"><b>Not yet on sale.</b> Final covers, prices, and store links are still to be confirmed by Zoe Life.</div>
</div></section>

<section class="sage"><div class="w split">
  <div>
    <p class="eyebrow">The founders</p>
    <h2>Tayo and Kemi Akinyemi</h2>
    <p class="lede">Founders of Zoe Life and pastors of Life Springs Church. They combine ministry experience, professional leadership, teaching, mentoring, coaching, and a habit of lifelong learning.</p>
    <p class="lede">Their focus spans relationships, family life, leadership, education, careers, stewardship, and personal growth through Scripture.</p>
  </div>
  <figure><img class="founders" src="${IMG.founders}" alt="Tayo and Kemi Akinyemi smiling together." loading="lazy"></figure>
</div></section>

<section><div class="w">
  <p class="eyebrow">Take a next step</p>
  <h2>Start with a conversation.</h2>
  <p class="lede">A complimentary 20 minute consultation is a simple way to talk through where you are and whether Zoe Life can help. Mondays and Wednesdays, 6:00 to 8:00 PM Central. Free, with no deposit.</p>
  <div class="note"><b>Booking is not connected yet.</b> The scheduling tool still needs to be configured against contact@zoelifehub.com, so there is no booking link to publish on this preview.</div>
</div></section>`;

/* ------------------------------------------------------------------ emit -- */
for (const [name, body] of Object.entries(PAGES)) {
  const html = `<div class="zl-p1">\n${CSS}\n${body}\n</div>`;
  const file = join(OUT, `${name}.html`);
  writeFileSync(file, html, "utf8");
  const risky = /[`]|\$\{|\\/.test(html);
  console.log(`${name.padEnd(8)} ${String(html.length).padStart(6)} bytes  template-safe: ${!risky}`);
}
console.log(`\nWrote ${Object.keys(PAGES).length} snippets to tools/sqs-blocks/`);
