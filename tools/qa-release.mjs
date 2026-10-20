/** All public pages at the release widths. Requires Playwright and Chromium.
 * QA_BASE defaults to the local server. No form is sent to a live endpoint.
 * PLAYWRIGHT_MODULE and CHROME_PATH optionally select an installed runtime.
 */
import {createRequire} from 'node:module';
import {readdirSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = resolve(new URL('..', import.meta.url).pathname);
const out = resolve(root, 'docs/qa/pre-release');
mkdirSync(`${out}/screenshots`, {recursive:true});
const pages = [...readdirSync(root).filter(f=>f.endsWith('.html')),
  ...['blog','courses'].flatMap(dir=>readdirSync(`${root}/${dir}`).filter(f=>f.endsWith('.html')).map(f=>`${dir}/${f}`))];
const base = process.env.QA_BASE || 'http://127.0.0.1:8765';
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || undefined,
  args:JSON.parse(process.env.QA_BROWSER_ARGS || '[]')});
const results = {pages:[], interactions:[], links:[], errors:[], network:[]};
const check = (name, ok, detail='') => results.interactions.push({name,pass:!!ok,detail});
const context = await browser.newContext({reducedMotion:'reduce'});
await context.route('**/www.googletagmanager.com/**', r=>r.fulfill({status:200,body:''}));
// Intercept form POSTs before loading any page. Never sends mail or creates subscriptions.
let mock = {success:true, state:'received'}, sends=0;
await context.route('https://script.google.com/**', async r=>{
  sends++; await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mock)});
});
const page = await context.newPage();
let current='';
page.on('pageerror', e=>results.errors.push({page:current,error:e.message}));
page.on('requestfailed', r=>results.network.push({page:current,url:r.url(),error:r.failure()?.errorText}));
const urls = new Set();
for (const width of [375,414,1280]) {
  await page.setViewportSize({width,height:900});
  for (const file of pages) {
    current=`${file}@${width}`;
    await page.goto(`${base}/${file}`,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts.ready);
    // Trigger all below-fold lazy images before capturing the full page.
    await page.evaluate(async()=>{
      for(const img of document.images) {img.loading='eager';}
      await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
    });
    await page.evaluate(()=>{window.scrollTo(0,0);});
    await page.waitForTimeout(80);
    const audit = await page.evaluate(()=>{
      const visible=e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
      const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      const links=[...document.querySelectorAll('a[href]')].map(a=>({href:a.getAttribute('href'),url:a.href,external:a.href.startsWith('https:'),target:a.target,rel:a.rel}));
      const headings=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(e=>({level:+e.tagName[1],text:e.textContent}));
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        overflowing:[...document.body.querySelectorAll('*')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1 && r.width>2 && !e.closest('[aria-hidden="true"]');}).map(e=>e.tagName+'.'+e.className).slice(0,12),
        duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),headings,
        images:[...document.images].map(e=>({src:e.getAttribute('src'),alt:e.getAttribute('alt'),ok:e.complete&&e.naturalWidth>0})),
        smallTargets:[...document.querySelectorAll('button,a,input[type="checkbox"]')].filter(visible).filter(e=>!e.disabled&&!e.closest('p:not(.card-link):not(.clip-source):not(.breadcrumb)')&&!e.closest('.post-card')).filter(e=>{const r=(e.type==='checkbox'?e.closest('label'):e).getBoundingClientRect();return r.width<43.5||r.height<43.5;}).map(e=>e.textContent.trim().slice(0,90)||e.id),
        links,title:document.title,description:document.querySelector('meta[name="description"]')?.content,
        canonical:document.querySelector('link[rel="canonical"]')?.href,
        og:document.querySelector('meta[property="og:image"]')?.content};
    });
    for(const link of audit.links) {
      urls.add(link.url);
      if(link.external) check(`${current}: external link opens safely: ${link.href}`,link.target==='_blank'&&/noopener/.test(link.rel)&&/noreferrer/.test(link.rel));
    }
    delete audit.links;
    const screenshot=`screenshots/${file.replaceAll('/','--').replace('.html','')}-${width}.jpg`;
    // Tile long pages: a single GPU surface can repeat pixels beyond 16,384px.
    const height=await page.evaluate(()=>document.documentElement.scrollHeight);
    const tiles=[];
    for(let top=0;top<height;top+=6000) {
      const input=await page.screenshot({fullPage:true,clip:{x:0,y:top,width,height:Math.min(6000,height-top)},type:'png',animations:'disabled'});
      tiles.push({input,left:0,top});
    }
    await sharp({create:{width,height,channels:3,background:'#F8F4ED'}}).composite(tiles).jpeg({quality:65}).toFile(`${out}/${screenshot}`);
    results.pages.push({file,width,screenshot,...audit});
    if(file!=='subscription.html') {
      if(width<1024) {
        await page.locator('.nav-toggle').click();
        check(`${current}: mobile menu opens`,await page.locator('#site-nav').isVisible());
        await page.keyboard.press('Escape');
        check(`${current}: Escape closes menu`,!(await page.locator('#site-nav').isVisible()));
      } else for(const menu of ['resources','connect']) {
        const trigger=page.locator(`[aria-controls="nav-${menu}"]`);
        await trigger.focus(); await page.keyboard.press('Enter');
        check(`${current}: ${menu} keyboard menu opens`,await page.locator(`#nav-${menu}`).isVisible());
        await page.keyboard.press('Escape');
      }
    }
    if(file==='about.html') {
      const disclosure=page.locator('.faith-disclosure');
      check(`${current}: faith starts collapsed`,!(await disclosure.getAttribute('open')) && !(await disclosure.evaluate(e=>e.open)));
      await disclosure.locator('summary').click();
      check(`${current}: all ten faith statements readable`,await disclosure.locator('li').count()===10 && await disclosure.locator('li').first().isVisible());
    }
    if(file==='books.html') {
      const pending=await page.evaluate(()=>Object.values(window.ZOE_CONFIG.payments).reduce((n,p)=>n+['amazon','lulu','gumroad','etsy'].filter(k=>!p[k]).length,0));
      check(`${current}: unconfigured purchase controls are disabled`,await page.locator('.buy-area button:disabled').count()===pending);
    }
    // Exercise every newsletter form, in its own page context.
    const signup=page.locator('[data-form="subscribe"]');
    if(await signup.count()) {
      await signup.locator('button').click();
      check(`${current}: empty signup rejected`,await signup.locator('[aria-invalid="true"]').count()===2);
      await signup.locator('[type=email]').fill('release-qa@example.org');
      await signup.locator('[type=checkbox]').check();
      mock={success:true,state:'confirmation_required'};
      await signup.locator('button').click();
      await signup.locator('.status-sent').waitFor();
      check(`${current}: signup requires confirmation`,(await signup.locator('[data-status]').textContent()).includes('Check your email'));
    }
    console.log(current);
  }
}
// Check every unique internal URL and anchor as a browser request.
for(const href of urls) {
  const u=new URL(href);
  if(u.origin!==new URL(base).origin) continue;
  const res=await context.request.get(u.href);
  const body=await res.text();
  results.links.push({url:u.pathname+u.hash,status:res.status(),anchor:!u.hash||body.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`)});
}
// The assembled artifact exposes both .html and trailing-slash aliases.
if(process.env.QA_ROOT) for(const file of pages.filter(f=>!['index.html','404.html'].includes(f))) {
  const path=file.replace(/\.html$/,'');
  await page.goto(`${base}/${path}`,{waitUntil:'domcontentloaded'});
  check(`${path}: alias renders styled`,await page.locator('link[rel=stylesheet]').evaluate(async e=>(await fetch(e.href)).ok));
  const links=await page.locator('a[href]').evaluateAll(es=>es.map(e=>e.href).filter(src=>new URL(src).origin===location.origin));
  for(const href of new Set(links)) {const r=await context.request.get(href);const u=new URL(href);check(`${path}: link ${u.pathname+u.hash}`,r.ok()&&(!u.hash||(await r.text()).includes(`id="${decodeURIComponent(u.hash.slice(1))}"`)));}
  const assets=await page.locator('img[src],script[src]').evaluateAll(es=>es.map(e=>e.src).filter(src=>new URL(src).origin===location.origin));
  for(const src of assets) check(`${path}: ${new URL(src).pathname}`, (await context.request.get(src)).ok());
}
await page.goto(`${base}/contact.html`);
const contact=page.locator('[data-form=contact]');
await contact.locator('button').click();
check('contact: six empty required fields rejected',await contact.locator('[aria-invalid=true]').count()===6);
await contact.locator('[name=firstName]').fill('Release');await contact.locator('[name=lastName]').fill('QA');
await contact.locator('[name=email]').fill('release-qa@example.org');await contact.locator('[name=phone]').fill('5551234567');
await contact.locator('select').selectOption('Other');
check('contact: Other becomes required',await contact.locator('[name=reasonOther]').getAttribute('required')!==null);
await contact.locator('[name=reasonOther]').fill('Local intercepted QA only');
await contact.locator('textarea').fill('This test never leaves the local browser.');
mock={success:'false'};await contact.locator('button').click();await contact.locator('.status-blocked').waitFor();
check('contact: HTTP 200 rejection is not success',!(await contact.locator('.status-sent').count()) && await contact.locator('textarea').inputValue()!=='');
mock={success:true};await contact.locator('button').click();await contact.locator('.status-sent').waitFor();
check('contact: approved success message', (await contact.locator('.status-sent').textContent()).includes('Thank you for contacting Zoe Life. Please expect a reply within three business days.'));
// Confirmation/unsubscribe are POST-only and need an explicit action.
for(const action of ['confirm','unsubscribe']) {
  const before=sends;
  await page.goto(`${base}/subscription.html?action=${action}&token=${'a'.repeat(72)}`);
  check(`${action}: no automatic submission`,sends===before);
  check(`${action}: token removed from URL`,!page.url().includes('token'));
  mock={success:true,state:action==='confirm'?'subscribed':'unsubscribed'};
  await page.locator('#subscription-button').click();
  await page.locator('#subscription-form').waitFor({state:'hidden'});
  check(`${action}: confirmed state shown`,(await page.locator('#status').textContent()).includes(action==='confirm'?'confirmed':'unsubscribed'));
}
await page.goto(`${base}/resources.html`);
const clips=page.locator('.clip');
for(let i=0;i<await clips.count();i++) {
  const clip=clips.nth(i);await clip.locator('button').click();
  await page.waitForTimeout(150);
  const state=await clip.locator('video').evaluate(v=>({src:v.currentSrc,error:v.error?.message,playing:!v.paused}));
  check(`clip ${i+1}: playback starts`,state.playing,JSON.stringify(state));
  await clip.locator('video').evaluate(v=>v.pause());
}
results.summary={pageRenders:results.pages.length,interactions:results.interactions.length,
  failedInteractions:results.interactions.filter(x=>!x.pass),
  layoutFailures:results.pages.filter(x=>x.scrollWidth>x.width+1||x.duplicateIds.length||x.images.some(i=>!i.ok)||x.smallTargets.length).map(x=>({file:x.file,width:x.width,overflow:x.overflowing,small:x.smallTargets,images:x.images.filter(i=>!i.ok)})),
  brokenInternal:results.links.filter(x=>x.status!==200||!x.anchor),pageErrors:results.errors};
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results.summary,null,2));
await browser.close();
if(results.summary.failedInteractions.length || results.summary.layoutFailures.length || results.summary.brokenInternal.length || results.summary.pageErrors.length) process.exitCode=1;
