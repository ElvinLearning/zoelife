/**
 * Zoe Life course access. NOT DEPLOYED.
 *
 * Separate project from integrations/google-workspace/Code.gs.
 * Do not merge these functions into the forms web app.
 *
 * Script properties (see config.example.json). Never commit the values:
 *   SPREADSHEET_ID
 *   STRIPE_RESTRICTED_KEY   read-only Checkout Sessions key, set in the editor
 *   WELCOME_FROM            contact@zoelifehub.com
 *   SUPPORT_CONTACT         address Kemi supplies
 *   COURSE_TRACKS           JSON: payment link id -> { trackIds, folderIds }
 *
 * The welcome page on the site does not call this script until
 * ZOE_COURSE_CLAIM_ENDPOINT is set on a later deploy.
 */

var PURCHASE_HEADERS = ['Session ID', 'Created UTC', 'Tracks', 'Buyer email', 'Google email', 'Amount', 'Status', 'Granted UTC', 'Revoked UTC', 'Notes'];

function courseSettings_() {
  var props = PropertiesService.getScriptProperties();
  var tracksRaw = props.getProperty('COURSE_TRACKS') || '';
  var settings = {
    sheet: props.getProperty('SPREADSHEET_ID'),
    key: props.getProperty('STRIPE_RESTRICTED_KEY'),
    from: props.getProperty('WELCOME_FROM'),
    support: props.getProperty('SUPPORT_CONTACT'),
    tracks: tracksRaw ? JSON.parse(tracksRaw) : null
  };
  if (!settings.sheet || !settings.key || settings.from !== 'contact@zoelifehub.com' || !settings.support || !settings.tracks) {
    throw new Error('Course script setup incomplete');
  }
  return settings;
}

function purchaseSheet_() {
  var book = SpreadsheetApp.openById(courseSettings_().sheet);
  var sheet = book.getSheetByName('Course purchases') || book.insertSheet('Course purchases');
  if (!sheet.getLastRow()) {
    sheet.appendRow(PURCHASE_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function cell_(value) {
  return /^[=+\-@\t\r\n]/.test(String(value)) ? "'" + value : value;
}

function stripeGet_(path) {
  var key = courseSettings_().key;
  var response = UrlFetchApp.fetch('https://api.stripe.com' + path, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + key },
    muteHttpExceptions: true
  });
  var body = JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() >= 400) throw new Error('Stripe read failed');
  return body;
}

function googleEmail_(session) {
  var fields = session.custom_fields || [];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var text = field.text && field.text.value;
    if (text && /google/i.test(field.key || field.label || '')) return String(text).trim().toLowerCase();
  }
  var email = session.customer_details && session.customer_details.email;
  return email ? String(email).trim().toLowerCase() : '';
}

function findPurchase_(sheet, sessionId) {
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === cell_(sessionId)) return i + 1;
  }
  return 0;
}

function grantFolders_(email, folderIds) {
  folderIds.forEach(function (folderId) {
    if (!folderId) return;
    Drive.Permissions.create({ type: 'user', role: 'reader', emailAddress: email }, folderId, { sendNotificationEmail: false });
  });
}

function welcomeMail_(email, trackIds) {
  var settings = courseSettings_();
  MailApp.sendEmail({
    to: email,
    name: 'Zoe Life',
    replyTo: settings.support,
    subject: 'Your Zoe Life course access',
    body: 'Your access for ' + trackIds.join(', ') + ' is ready. Sign in to Google with this email address, then open the course page on zoelifehub.com. If you cannot get in, write to ' + settings.support + '.'
  });
}

function recordGrant_(session) {
  var settings = courseSettings_();
  var linkId = session.payment_link;
  if (linkId && linkId.id) linkId = linkId.id;
  var track = settings.tracks[linkId];
  if (!track) throw new Error('Unknown payment link');
  if (session.payment_status !== 'paid') throw new Error('Checkout is not paid');
  var email = googleEmail_(session);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Missing Google email');
  var sheet = purchaseSheet_();
  if (findPurchase_(sheet, session.id)) return { ok: true, duplicate: true };
  grantFolders_(email, track.folderIds || []);
  var amount = session.amount_total == null ? '' : String(session.amount_total);
  sheet.appendRow([
    cell_(session.id),
    new Date().toISOString(),
    cell_((track.trackIds || []).join(',')),
    cell_((session.customer_details && session.customer_details.email) || ''),
    cell_(email),
    cell_(amount),
    'granted',
    new Date().toISOString(),
    '',
    ''
  ]);
  welcomeMail_(email, track.trackIds || []);
  return { ok: true, duplicate: false };
}

function claimCourse_(sessionId) {
  if (!/^cs_[A-Za-z0-9]+$/.test(sessionId || '')) throw new Error('Bad session');
  var session = stripeGet_('/v1/checkout/sessions/' + encodeURIComponent(sessionId));
  return recordGrant_(session);
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action !== 'claim_course') return json_({ success: false });
    return json_(claimCourse_(String(body.sessionId || '')));
  } catch (err) {
    return json_({ success: false });
  }
}

/** Editor helper. Pass the buyer Google email and a track id from COURSE_TRACKS. */
function grantManual(email, trackId) {
  var settings = courseSettings_();
  var match = null;
  Object.keys(settings.tracks).forEach(function (key) {
    var item = settings.tracks[key];
    if ((item.trackIds || []).indexOf(trackId) !== -1) match = item;
  });
  if (!match) throw new Error('Unknown track');
  grantFolders_(String(email || '').trim().toLowerCase(), match.folderIds || []);
}

/** Time-driven, every 10 minutes, after the script is deployed. Not installed from this repo. */
function syncRecent() {
  var listed = stripeGet_('/v1/checkout/sessions?limit=20&status=complete');
  (listed.data || []).forEach(function (session) {
    try { recordGrant_(session); } catch (err) { /* leave the row for a person to review */ }
  });
}

function setupCourseSheet() {
  purchaseSheet_();
}
