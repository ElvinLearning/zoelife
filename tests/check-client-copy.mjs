// Compare shipped pages with the client's supplied copy, not paraphrases.
// Optional SITE_BASE_URL verifies the actual published site using the same fixture.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/client-copy.json'), 'utf8'));
const normalize = value => value.replace(/\s+/g, ' ').trim();
const text = html => normalize(html
  .replace(/<!--[^]*?-->/g, '')
  .replace(/<(script|style)\b[^>]*>[^]*?<\/\1>/gi, '')
  .replace(/<\/(?:p|h[1-6]|li|a|span|div|section|label)>/gi, '$& ')
  .replace(/<[^>]*>/g, '')
  .replace(/&(amp|lt|gt|quot|apos|nbsp|copy);/g, (_, name) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',copy:'©'}[name]))
  .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === 'x' ? parseInt(n.slice(1),16) : Number(n))));
const cache = new Map();
async function read(page) {
  if (!cache.has(page)) {
    if (process.env.SITE_BASE_URL) {
      const response = await fetch(new URL(page, process.env.SITE_BASE_URL), {cache:'no-store'});
      assert.equal(response.status, 200, `${page}: public page must load`);
      cache.set(page, await response.text());
    } else cache.set(page, readFileSync(resolve(root,page),'utf8'));
  }
  return cache.get(page);
}
let count = 0;
for (const section of fixture.sections) {
  const html = await read(section.page);
  const body = html.match(/<main\b[^>]*>([^]*?)<\/main>/)?.[1] || '';
  const footer = html.match(/<footer\b[^>]*>([^]*?)<\/footer>/)?.[1] || '';
  const copy = text(body + footer);
  for (const expected of section.copy) {
    assert.ok(copy.includes(normalize(expected)), `${section.page} does not match ${section.source}: ${expected}`);
    count++;
  }
}
const home = await read('index.html');
const hero = home.match(/<section class="hero-home">([^]*?)<\/section>/)[1];
const heroCopy = text(hero.match(/<p class="lede">([^]*?)<\/p>/)[1]);
assert.equal(heroCopy, fixture.sections[0].copy[1], 'Hero must use the entire exact client paragraph without additions');
const links = [...hero.matchAll(/<a class="btn ([^"]+)" href="([^"]+)">([^]*?)<\/a>/g)].map(m=>[m[1],m[2],text(m[3])]);
assert.deepEqual(links, [
  ['btn-primary','about.html#about-zoe-life','Explore Zoe Life'],
  ['btn-secondary','resources-overview.html','Explore Resources'],
  ['btn-secondary','contact.html#message','Send a Message'],
], 'Hero button labels, order and destinations must follow client instructions');
for (const [label,href] of [['Get to Know Zoe Life','about.html#about-zoe-life'],['Get to Know Us','about.html#meet']]) {
  assert.ok(home.includes(`href="${href}">${label}</a>`), `${label}: correct About section`);
}
assert.ok(!home.includes('We share what Scripture teaches about everyday life'), 'Do not publish the superseded homepage');
console.log(`PASS: ${count} client-supplied passages across ${cache.size} pages; exact hero and button destinations verified${process.env.SITE_BASE_URL ? ' on '+process.env.SITE_BASE_URL : ''}.`);
