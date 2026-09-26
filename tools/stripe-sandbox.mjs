// Build a separate preview with the saved Stripe sandbox links. No API keys needed.
import {cpSync, mkdirSync, readdirSync} from 'node:fs';
import {join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const output = join(root, '.stripe-sandbox');
const excluded = new Set(['.git', '.stripe-sandbox', 'node_modules', 'screenshots', '.chrome-qa', '.chrome-qa-forms', '.chrome-verify', '.chrome-artifact']);
mkdirSync(output, {recursive:true});
for (const entry of readdirSync(root)) {
  if (excluded.has(entry)) continue;
  cpSync(join(root, entry), join(output, entry), {
    recursive:true,
    filter:src => !relative(root, src).split(sep).some(part => excluded.has(part)),
  });
}
const env = {...process.env,
  ZOE_FORM_ENDPOINT:'https://formsubmit.co/ajax/contact@zoelifehub.com',
  ZOE_NEWSLETTER_ENDPOINT:'https://formsubmit.co/ajax/contact@zoelifehub.com',
  ZOE_GOOGLE_CALENDAR_BOOKING_URL:'https://calendar.app.google/Uj9v44HE72kJrKz8A',
};
for (const args of [['tools/build.mjs', '--staging', '--stripe-sandbox'], ['tests/check-site.mjs']]) {
  const run = spawnSync(process.execPath, args, {cwd:output, env, stdio:'inherit'});
  if (run.error) throw run.error;
  if (run.status !== 0) process.exit(run.status || 1);
}
console.log('\nSandbox preview ready. Run: node .stripe-sandbox/tools/serve.mjs 8766');
