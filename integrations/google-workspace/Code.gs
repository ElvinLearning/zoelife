/** Zoe Life forms: deploy in Zoe Life's Workspace, never a personal account.
 * See docs/integrations-setup.md. Secrets belong in Script Properties only.
 */
var CONTACT_HEADERS = ['Request ID', 'Received UTC', 'First name', 'Last name', 'Email', 'Phone', 'Reason', 'Other reason', 'Message', 'Notification'];
var SUB_HEADERS = ['Email', 'Status', 'Requested UTC', 'Confirmed UTC', 'Unsubscribed UTC', 'Consent version', 'Token', 'Unsubscribe URL'];

function settings_() {
  var p = PropertiesService.getScriptProperties();
  var c = { sheet: p.getProperty('SPREADSHEET_ID'), inbox: p.getProperty('CONTACT_EMAIL'), url: p.getProperty('WEB_APP_URL') };
  if (!c.sheet || c.inbox !== 'contact@zoelifehub.com' || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(c.url || '')) throw new Error('Setup incomplete');
  return c;
}
function sheet_(name, headers) {
  var book = SpreadsheetApp.openById(settings_().sheet);
  var sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (!sheet.getLastRow()) { sheet.appendRow(headers); sheet.setFrozenRows(1); }
  var actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (actual.join('|') !== headers.join('|')) throw new Error('Unexpected sheet headers');
  return sheet;
}
// Run once from the editor after setting Script Properties. Sends no mail.
function setup() {
  sheet_('Contact submissions', CONTACT_HEADERS);
  sheet_('Subscribers', SUB_HEADERS);
}
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function clean_(value, max) {
  var s = String(value || '').trim();
  if (s.length > max) throw new Error('Field too long');
  return s;
}
function cell_(value) { return /^[=+\-@\t\r\n]/.test(String(value)) ? "'" + value : value; }
function email_(value) {
  var s = clean_(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error('Invalid email');
  return s;
}
function row_(sheet, emailOrId) {
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) if (rows[i][0] === cell_(emailOrId)) return { index: i + 1, values: rows[i] };
  return null;
}
function budget_() {
  // Persistent daily cap, in addition to Google's quota, bounds public-form abuse.
  var p = PropertiesService.getScriptProperties(), day = new Date().toISOString().slice(0, 10);
  var count = p.getProperty('MAIL_DAY') === day ? Number(p.getProperty('MAIL_COUNT') || 0) : 0;
  if (count >= 50 || MailApp.getRemainingDailyQuota() < 5) throw new Error('Please try again later');
  p.setProperty('MAIL_DAY', day); p.setProperty('MAIL_COUNT', String(count + 1));
}
function send_(message) { budget_(); MailApp.sendEmail(message); }
function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({success:false});
  try {
    var p = (e && e.parameter) || {};
    if (p.action) return changeSubscription_(p);
    if (p._honey) return json_({success:false});
    settings_();
    var email = email_(p.email);
    var properties = PropertiesService.getScriptProperties(), day = new Date().toISOString().slice(0, 10);
    var count = properties.getProperty('SUBMISSION_DAY') === day ? Number(properties.getProperty('SUBMISSION_COUNT') || 0) : 0;
    if (count >= 100) throw new Error('Daily submission limit');
    properties.setProperty('SUBMISSION_DAY', day); properties.setProperty('SUBMISSION_COUNT', String(count + 1));
    if (p.form_type === 'Contact message') return contact_(p, email);
    if (p.form_type === 'Mailing list signup') return subscribe_(p, email);
    return json_({success:false});
  } catch (error) {
    // Do not return/log submissions, recipient details or infrastructure errors.
    return json_({success:false});
  } finally { lock.releaseLock(); }
}
function contact_(p, email) {
  var id = clean_(p.request_id, 80);
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(id)) throw new Error('Invalid request ID');
  var first = clean_(p.firstName, 100), last = clean_(p.lastName, 100), message = clean_(p.message, 10000), reason = clean_(p.reason, 200);
  if (!first || !last || !message || !reason) throw new Error('Required field');
  var sheet = sheet_('Contact submissions', CONTACT_HEADERS), old = row_(sheet, id);
  if (old) return json_({success:true, state:'saved'});
  var recent = sheet.getDataRange().getValues().slice(1).some(function(r) { return r[4] === cell_(email) && Date.now() - Date.parse(r[1]) < 60000; });
  if (recent) throw new Error('Please wait');
  var values = [id, new Date().toISOString(), first, last, email, clean_(p.phone, 80), reason, clean_(p.reasonOther, 500), message, 'pending'];
  sheet.appendRow(values.map(cell_));
  SpreadsheetApp.flush(); // Never acknowledge a message before persistence.
  var index = sheet.getLastRow();
  try {
    send_({to:settings_().inbox, replyTo:email, subject:'New Zoe Life website message', name:'Zoe Life', body:values.slice(1, 9).join('\n\n')});
    sheet.getRange(index, 10).setValue('sent');
  } catch (error) { /* Saved submissions remain available even if mail is down. */ }
  return json_({success:true, state:'saved'});
}
function subscribe_(p, email) {
  if (p.consent !== 'on' && p.consent !== 'true') throw new Error('Consent required');
  var sheet = sheet_('Subscribers', SUB_HEADERS), old = row_(sheet, email), now = new Date().toISOString();
  // Do not disclose subscription status or repeatedly email active subscribers.
  if (old && old.values[1] === 'subscribed') return json_({success:true, state:'confirmation_required'});
  if (old && Date.now() - Date.parse(old.values[2]) < 60000) throw new Error('Please wait');
  var token = Utilities.getUuid() + Utilities.getUuid();
  var url = settings_().url, unsubscribe = url + '?action=unsubscribe&token=' + encodeURIComponent(token);
  var values = [email, 'pending', now, '', '', '2026-09-26', token, unsubscribe];
  if (old) sheet.getRange(old.index, 1, 1, values.length).setValues([values.map(cell_)]); else sheet.appendRow(values.map(cell_));
  SpreadsheetApp.flush();
  // A failed send returns failure. A retry issues a new token after one minute.
  send_({to:email, subject:'Confirm your Zoe Life subscription', name:'Zoe Life', body:'Please confirm that you want encouragement, updates, and resources from Zoe Life.\n\n' + url + '?action=confirm&token=' + encodeURIComponent(token) + '\n\nThis confirmation expires in 48 hours. If you did not request this, ignore this email.\n\nManage this request: ' + unsubscribe});
  return json_({success:true, state:'confirmation_required'});
}
function escape_(s) { return String(s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function page_(body) { return HtmlService.createHtmlOutput('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Zoe Life mailing list</title></head><body style="font-family:system-ui;max-width:38rem;margin:4rem auto;padding:1rem"><h1>Zoe Life mailing list</h1>' + body + '</body></html>'); }
function subscription_(p) {
  if (!/^(confirm|unsubscribe)$/.test(p.action || '') || !/^[a-f0-9-]{72}$/.test(p.token || '')) throw new Error('Invalid link');
  var sheet = sheet_('Subscribers', SUB_HEADERS), rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) if (rows[i][6] === p.token) return {sheet:sheet, index:i + 1, values:rows[i]};
  throw new Error('Invalid link');
}
// GET only renders a confirmation form: link scanners cannot subscribe/unsubscribe.
function doGet(e) {
  try {
    var p = e.parameter || {}; subscription_(p);
    var label = p.action === 'confirm' ? 'Confirm subscription' : 'Unsubscribe';
    return page_('<p>Select the button below to ' + label.toLowerCase() + '.</p><form method="post" action="' + escape_(settings_().url) + '"><input type="hidden" name="action" value="' + p.action + '"><input type="hidden" name="token" value="' + escape_(p.token) + '"><button type="submit">' + label + '</button></form>');
  } catch (error) { return page_('<p>This link is unavailable. Please return to the website to request a new signup.</p>'); }
}
function changeSubscription_(p) {
  var entry = subscription_(p), values = entry.values;
  if (p.action === 'confirm') {
    if (values[1] === 'unsubscribed' || Date.now() - Date.parse(values[2]) > 48 * 3600000) return page_('<p>This confirmation has expired. Please sign up again on the website.</p>');
    values[1] = 'subscribed'; values[3] = values[3] || new Date().toISOString();
  } else { values[1] = 'unsubscribed'; values[4] = new Date().toISOString(); }
  entry.sheet.getRange(entry.index, 1, 1, values.length).setValues([values]);
  SpreadsheetApp.flush();
  return page_('<p>' + (p.action === 'confirm' ? 'Your subscription is confirmed. Thank you for joining Zoe Life.' : 'You are unsubscribed from Zoe Life updates.') + '</p>');
}
