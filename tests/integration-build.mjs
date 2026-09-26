import {mkdtempSync, cpSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('..', import.meta.url));
const temp=mkdtempSync(join(tmpdir(),'zoe-build-'));
try {
 cpSync(root,temp,{recursive:true,filter:src=>!relative(root,src).split(sep).some(part=>part==='.git'||part==='node_modules')});
 const env={...process.env,ZOE_FORM_ENDPOINT:'https://script.google.com/macros/s/test/exec',ZOE_NEWSLETTER_ENDPOINT:'https://script.google.com/macros/s/test/exec',ZOE_GOOGLE_CALENDAR_BOOKING_URL:'https://calendar.app.google/Uj9v44HE72kJrKz8A',ZOE_PAID_BOOKING_URL:'https://calendar.google.com/calendar/appointments/schedules/test',ZOE_AMAZON_DEVOTIONAL_URL:'https://www.amazon.com/dp/TEST',ZOE_GUMROAD_JOURNAL_URL:'https://example.gumroad.com/l/test'};
 let run=spawnSync(process.execPath,['tools/build.mjs','--staging'],{cwd:temp,env,encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 run=spawnSync(process.execPath,['tests/check-site.mjs'],{cwd:temp,env,encoding:'utf8'});
 assert.equal(run.status,0,run.stdout+run.stderr);
 assert.match(readFileSync(join(temp,'consult.html'),'utf8'),/href="https:\/\/calendar.google.com\/calendar\/appointments\/schedules\/test"/);
 assert.match(readFileSync(join(temp,'books.html'),'utf8'),/Buy on Amazon/);
 assert.match(readFileSync(join(temp,'books.html'),'utf8'),/Buy on Gumroad/);
 assert.match(readFileSync(join(temp,'contact.html'),'utf8'),/Google Workspace/);
 run=spawnSync(process.execPath,['tools/build.mjs'],{cwd:temp,env:{...env,ZOE_PAID_BOOKING_URL:'javascript:alert(1)'},encoding:'utf8'});
 assert.notEqual(run.status,0);
 console.log('Passed: Workspace configuration, paid booking, storefront links, all static checks with integrations configured, unsafe URL rejection.');
} finally {rmSync(temp,{recursive:true,force:true});}
