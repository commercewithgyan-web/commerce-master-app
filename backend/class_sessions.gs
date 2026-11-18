/**
 * Class sessions (Start Class / End Class).
 * Start sends NOTHING to anyone. End returns a notice summary; messages go out only
 * after the teacher's confirmation (sendClassMissedNotices, Task 6).
 * Sessions are keyed by Class+Subject, never global.
 */
var CS_HEADERS_ = ['Session_ID', 'Date', 'Class', 'Subject', 'Topic_ID', 'Start_Time', 'End_Time', 'Status', 'Outcome', 'Notes_Mode', 'Youtube_URL'];

function csTz_() { return (typeof TIMEZONE_KOLKATA !== 'undefined') ? TIMEZONE_KOLKATA : 'Asia/Kolkata'; }
function csToday_() { return Utilities.formatDate(new Date(), csTz_(), 'yyyy-MM-dd'); }
function csDateStr_(v) {
  if (typeof v === 'string') return v.slice(0, 10);
  return Utilities.formatDate(v, csTz_(), 'yyyy-MM-dd');
}
function csNow_() { return Utilities.formatDate(new Date(), csTz_(), "yyyy-MM-dd'T'HH:mm:ss"); }

function csGetSheet_() {
  const ss = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
  let sh = ss.getSheetByName('Class_Sessions');
  if (!sh) sh = ss.insertSheet('Class_Sessions');
  if (sh.getLastRow() === 0) sh.appendRow(CS_HEADERS_);
  return sh;
}

function csFindSyllabusRow_(topicId) {
  const ss = SpreadsheetApp.openById(getActiveSheetIds().SYLLABUS);
  const sh = ss.getSheetByName('Master_Syllabus') || ss.getSheetByName('01_Master_Syllabus');
  if (!sh) return null;
  const rows = sheetToObjects(sh);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (String(r.Canonical_Topic_ID || r.Topic_ID || '').trim() === String(topicId)) {
      const cls = normalizeClassLevel_(r.Class || '');
      if (!cls) return null;
      return { classLevel: cls, subject: String(r.Subject || '').trim(), topicId: String(topicId) };
    }
  }
  return null;
}

function csAudit_(action, target, details) {
  try { recordAuditLog_('system', 'admin', action, target, details); } catch (e) { /* audit is best-effort */ }
}

function startClassSession(payload) {
  const p = payload || {};
  const topicId = String(p.subtopicId || '').trim();
  if (!topicId) return { error: 'subtopicId required' };
  const info = csFindSyllabusRow_(topicId);
  if (!info) return { error: 'Topic not found in syllabus (class/subject cannot be determined)' };
  const sh = csGetSheet_();
  const sessionId = 'CS-' + Utilities.getUuid().slice(0, 8);
  const startedAt = csNow_();
  const res = withWriteLock_(function () {
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][7]) === 'Live' && String(data[i][2]) === info.classLevel && String(data[i][3]) === info.subject) {
        return { error: 'Class ' + info.classLevel + ' ' + info.subject + ' is already Live. End it first.' };
      }
    }
    sh.appendRow([sessionId, csToday_(), info.classLevel, info.subject, topicId, startedAt, '', 'Live', '', '', '']);
    return { ok: true };
  });
  if (res.error) return res;
  // setActiveSubtopic takes the lock itself: must be called outside withWriteLock_.
  setActiveSubtopic({ subtopicId: topicId, deliveryMode: p.deliveryMode, status: 'In Progress' });
  csAudit_('CLASS_SESSION_START', sessionId, info.classLevel + ' ' + info.subject + ' ' + topicId);
  return { ok: true, sessionId: sessionId, startedAt: startedAt, class: info.classLevel, subject: info.subject };
}

function csNoticeSummary_(date, classLevel) {
  const ss = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
  const rows = sheetToObjects(ss.getSheetByName('Attendance_Logs'));
  const absent = {}, late = {};
  rows.forEach(function (r) {
    if (csDateStr_(r.Date) !== date) return;
    if (normalizeClassLevel_(r.Class || r.Batch_ID || '') !== classLevel) return;
    const st = String(r.Status || '').trim().toUpperCase();
    if (st === 'A') absent[r.Roll_No] = 1;
    else if (st === 'L') late[r.Roll_No] = 1;
  });
  return { absent: Object.keys(absent).length, late: Object.keys(late).length };
}

function endClassSession(payload) {
  const p = payload || {};
  const outcome = String(p.outcome || '');
  if (['Completed', 'Partly', 'NotTaught'].indexOf(outcome) === -1) return { error: 'outcome must be Completed, Partly or NotTaught' };
  const notesMode = p.notesMode ? String(p.notesMode) : 'Pending';
  if (['Attached', 'Pending', 'Skipped'].indexOf(notesMode) === -1) return { error: 'notesMode must be Attached, Pending or Skipped' };
  const sh = csGetSheet_();
  const res = withWriteLock_(function () {
    const data = sh.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(p.sessionId)) continue;
      if (String(data[i][7]) !== 'Live') return { error: 'Session is not Live' };
      sh.getRange(i + 1, 7).setValue(csNow_());
      sh.getRange(i + 1, 8).setValue('Ended');
      sh.getRange(i + 1, 9).setValue(outcome);
      sh.getRange(i + 1, 10).setValue(notesMode);
      return { ok: true, date: csDateStr_(data[i][1]), classLevel: String(data[i][2]), topicId: String(data[i][4]) };
    }
    return { error: 'No such session' };
  });
  if (res.error) return res;
  if (outcome === 'Completed') setActiveSubtopic({ subtopicId: res.topicId, status: 'Completed' });
  // Partly / NotTaught: topic stays In Progress so the next Start Class offers it first.
  csAudit_('CLASS_SESSION_END', String(p.sessionId), outcome + '/' + notesMode);
  return { ok: true, noticeSummary: csNoticeSummary_(res.date, res.classLevel) };
}

function getLiveSession() {
  const sh = csGetSheet_();
  const data = sh.getDataRange().getValues();
  const sessions = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][7]) !== 'Live') continue;
    sessions.push({ sessionId: data[i][0], class: String(data[i][2]), subject: data[i][3], topicId: data[i][4], startedAt: data[i][5] });
  }
  const first = sessions[0] || {};
  return { live: sessions.length > 0, sessionId: first.sessionId || '', class: first.class || '', subject: first.subject || '', topicId: first.topicId || '', startedAt: first.startedAt || '', sessions: sessions };
}

/** Daily 23:59 trigger: sessions still Live from an earlier day become Abandoned; topic status untouched. */
function closeStaleSessions_() {
  const sh = csGetSheet_();
  const today = csToday_();
  return withWriteLock_(function () {
    const data = sh.getDataRange().getValues();
    let n = 0;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][7]) === 'Live' && csDateStr_(data[i][1]) < today) {
        sh.getRange(i + 1, 8).setValue('Abandoned');
        sh.getRange(i + 1, 7).setValue(csNow_());
        n++;
      }
    }
    return n;
  });
}

/** Run once from the Apps Script editor. Idempotent. */
function installSessionTriggers_() {
  const have = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'closeStaleSessions_'; });
  if (!have) ScriptApp.newTrigger('closeStaleSessions_').timeBased().everyDays(1).atHour(23).nearMinute(59).inTimezone(csTz_()).create();
  const haveRem = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'sendMissedClassReminders_'; });
  if (!haveRem) ScriptApp.newTrigger('sendMissedClassReminders_').timeBased().everyDays(1).atHour(10).inTimezone(csTz_()).create();
  return { ok: true, installed: !have, remindersInstalled: !haveRem };
}

/** Next topic to teach for a class+subject: last Partly (In Progress) topic, else first not-completed after the last Completed. */
function getNextTopicForClass(payload) {
  const cls = normalizeClassLevel_((payload && payload.class) || '');
  const subject = String((payload && payload.subject) || '').trim().toLowerCase();
  const none = { topicId: '', state: 'None' };
  if (!cls || !subject) return none;
  const ss = SpreadsheetApp.openById(getActiveSheetIds().SYLLABUS);
  const sh = ss.getSheetByName('Master_Syllabus') || ss.getSheetByName('01_Master_Syllabus');
  if (!sh) return none;
  const rows = sheetToObjects(sh).filter(function (r) {
    return normalizeClassLevel_(r.Class || '') === cls && String(r.Subject || '').trim().toLowerCase() === subject;
  });
  if (!rows.length) return none;
  const st = function (r) { return String(r.Status || '').trim().toLowerCase(); };
  let lastPartly = -1, lastDone = -1;
  rows.forEach(function (r, i) {
    if (st(r) === 'in progress' || st(r) === 'partly') lastPartly = i;
    if (st(r) === 'completed') lastDone = i;
  });
  const id = function (r) { return String(r.Canonical_Topic_ID || r.Topic_ID || ''); };
  if (lastPartly >= 0) return { topicId: id(rows[lastPartly]), state: 'Partly' };
  for (let i = lastDone + 1; i < rows.length; i++) {
    if (st(rows[i]) !== 'completed') return { topicId: id(rows[i]), state: 'Next' };
  }
  return none;
}


// ---------- Task 6: missed classes (student list + confirmed notices) ----------
var CS_NOTICE_HEADERS_ = ['Roll_No', 'Date', 'Class', 'Subject', 'Notified_D0', 'Notified_D3', 'Notified_D7', 'Watched'];

function csMiniAppUrl_() {
  var u = '';
  try { u = PropertiesService.getScriptProperties().getProperty('MINI_APP_URL') || ''; } catch (e) { u = ''; }
  return u || 'https://commercewithgyan-web.github.io/commerce-master-app/index.html';
}
function csNoticeSheet_() {
  const ss = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
  let sh = ss.getSheetByName('Missed_Class_Notices');
  if (!sh) sh = ss.insertSheet('Missed_Class_Notices');
  if (sh.getLastRow() === 0) sh.appendRow(CS_NOTICE_HEADERS_);
  return sh;
}
function csNoticeKey_(roll, date, subject) { return String(roll).trim() + '|' + csDateStr_(date) + '|' + String(subject).trim().toLowerCase(); }
// map key -> {row (1-based), D0, D3, D7, Watched}
function csNoticeMap_(sh) {
  const d = sh.getDataRange().getValues(), map = {};
  for (let i = 1; i < d.length; i++) {
    const r = d[i];
    map[csNoticeKey_(r[0], r[1], r[3])] = { row: i + 1, roll: r[0], date: csDateStr_(r[1]), cls: r[2], subject: r[3], D0: r[4], D3: r[5], D7: r[6], Watched: r[7] };
  }
  return map;
}
function csNoticeSet_(sh, map, roll, date, cls, subject, fields) {
  const key = csNoticeKey_(roll, date, subject);
  const cols = { D0: 5, D3: 6, D7: 7, Watched: 8 };
  let rec = map[key];
  if (!rec) {
    sh.appendRow([roll, csDateStr_(date), cls, subject, '', '', '', '']);
    rec = map[key] = { row: sh.getLastRow(), roll: roll, date: csDateStr_(date), cls: cls, subject: subject, D0: '', D3: '', D7: '', Watched: '' };
  }
  Object.keys(fields).forEach(function (k) { sh.getRange(rec.row, cols[k]).setValue(fields[k]); rec[k] = fields[k]; });
  return rec;
}
function csTgIdOf_(r) {
  const keys = ['Telegram_ID', 'TelegramID', 'TelegramId', 'telegramId', 'Telegram_Chat_ID'];
  for (let i = 0; i < keys.length; i++) { if (r[keys[i]] !== undefined && String(r[keys[i]]).trim() !== '') return String(r[keys[i]]).trim(); }
  return '';
}
function csStudents_() {
  const ss = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
  const sh = ss.getSheetByName('Students_Master');
  return sh ? sheetToObjects(sh) : [];
}
function csTopicNames_() {
  const ss = SpreadsheetApp.openById(getActiveSheetIds().SYLLABUS);
  const sh = ss.getSheetByName('Master_Syllabus') || ss.getSheetByName('01_Master_Syllabus');
  const m = {};
  if (!sh) return m;
  sheetToObjects(sh).forEach(function (r) { m[String(r.Canonical_Topic_ID || r.Topic_ID || '').trim()] = String(r.Topic_Name || '').trim(); });
  return m;
}
function csDayAge_(dateStr, todayStr) {
  const a = String(dateStr).split('-'), b = String(todayStr).split('-');
  return Math.round((Date.UTC(+b[0], +b[1] - 1, +b[2]) - Date.UTC(+a[0], +a[1] - 1, +a[2])) / 86400000);
}
function csSessionsDone_() {
  return sheetToObjects(csGetSheet_()).filter(function (s) { return String(s.Status) !== 'Live' && String(s.Session_ID || '') !== ''; });
}

function getMissedClasses(payload, verifiedUser) {
  payload = payload || {}; verifiedUser = verifiedUser || {};
  const students = csStudents_();
  let roll = '';
  if (verifiedUser.is_admin && payload.studentId) roll = String(payload.studentId).trim();
  else {
    const me = students.filter(function (s) { return csTgIdOf_(s) === String(verifiedUser.id); })[0];
    if (me) roll = String(me.Roll_No).trim();
  }
  if (!roll) return { error: 'Student not found' };
  const ss = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
  const att = sheetToObjects(ss.getSheetByName('Attendance_Logs')).filter(function (r) {
    const st = String(r.Status || '').trim().toUpperCase();
    return String(r.Roll_No).trim() === roll && (st === 'A' || st === 'L');
  });
  const sessions = csSessionsDone_();
  const topics = csTopicNames_();
  const recSh = ss.getSheetByName('Daily_Class_Recordings');
  const recs = recSh ? sheetToObjects(recSh) : [];
  const notes = csNoticeMap_(csNoticeSheet_());
  const out = [], seen = {};
  att.forEach(function (a) {
    const date = csDateStr_(a.Date), cls = normalizeClassLevel_(a.Class || a.Batch_ID || '');
    const st = String(a.Status).trim().toUpperCase();
    sessions.forEach(function (s) {
      if (csDateStr_(s.Date) !== date || normalizeClassLevel_(s.Class) !== cls) return;
      const k = date + '|' + String(s.Subject).toLowerCase();
      if (seen[k]) return;
      seen[k] = 1;
      const hasRec = recs.some(function (r) {
        return csDateStr_(r.Date) === date && normalizeClassLevel_(r.Class) === cls && String(r.Subject).trim().toLowerCase() === String(s.Subject).trim().toLowerCase();
      });
      const n = notes[csNoticeKey_(roll, date, s.Subject)];
      const topic = topics[String(s.Topic_ID).trim()] || '';
      out.push({ date: date, class: cls, subject: String(s.Subject), topic: topic, subtopic: topic, status: st, recordingAvailable: hasRec, watched: !!(n && n.Watched) });
    });
  });
  out.sort(function (x, y) { return x.subject < y.subject ? -1 : x.subject > y.subject ? 1 : (x.date < y.date ? -1 : x.date > y.date ? 1 : 0); });
  return out;
}

function markMissedWatched(payload, verifiedUser) {
  payload = payload || {}; verifiedUser = verifiedUser || {};
  if (!payload.date || !payload.subject) return { error: 'date and subject required' };
  const me = csStudents_().filter(function (s) { return csTgIdOf_(s) === String(verifiedUser.id); })[0];
  const roll = me ? String(me.Roll_No).trim() : (verifiedUser.is_admin && payload.studentId ? String(payload.studentId).trim() : '');
  if (!roll) return { error: 'Student not found' };
  return withWriteLock_(function () {
    const sh = csNoticeSheet_();
    csNoticeSet_(sh, csNoticeMap_(sh), roll, payload.date, '', payload.subject, { Watched: 'Y' });
    return { ok: true };
  });
}

function csMissedLine_(subject, topic, date) { return date + ' — ' + subject + (topic ? ': ' + topic : ''); }

function sendClassMissedNotices(payload) {
  payload = payload || {};
  const sess = csSessionsDone_().filter(function (s) { return String(s.Session_ID) === String(payload.sessionId); })[0];
  if (!sess) return { error: 'Session not found or still Live' };
  const date = csDateStr_(sess.Date), cls = normalizeClassLevel_(sess.Class);
  const topic = csTopicNames_()[String(sess.Topic_ID).trim()] || '';
  const ss = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
  const att = sheetToObjects(ss.getSheetByName('Attendance_Logs'));
  const students = csStudents_();
  const url = csMiniAppUrl_() + '#missed';
  const markup = { inline_keyboard: [[{ text: 'Missed Classes देखें', web_app: { url: url } }]] };
  let sent = 0;
  const targets = {};
  att.forEach(function (a) {
    if (csDateStr_(a.Date) !== date || normalizeClassLevel_(a.Class || a.Batch_ID || '') !== cls) return;
    const st = String(a.Status || '').trim().toUpperCase();
    if (st === 'A' || st === 'L') targets[String(a.Roll_No).trim()] = st;
  });
  const sh = csNoticeSheet_();
  const map = csNoticeMap_(sh);
  Object.keys(targets).forEach(function (roll) {
    const key = csNoticeKey_(roll, date, sess.Subject);
    if (map[key] && map[key].D0) return;
    const stu = students.filter(function (s) { return String(s.Roll_No).trim() === roll; })[0];
    const chat = stu ? csTgIdOf_(stu) : '';
    if (!chat) return;
    const text = targets[roll] === 'A'
      ? 'आपने आज की ' + sess.Subject + ' की क्लास मिस की: ' + topic + '. Recording Commerce Gyan app में आने पर यहीं दिखेगी'
      : 'You were late today in ' + sess.Subject + ': ' + topic + '. Kindly view your complete class.';
    if (sendTelegramMessage_(chat, text, markup)) {
      csNoticeSet_(sh, map, roll, date, cls, sess.Subject, { D0: csNow_() });
      sent++;
    }
  });
  csAudit_('SEND_MISSED_NOTICES', String(sess.Session_ID), 'sent=' + sent);
  return { ok: true, sent: sent };
}

function sendMissedClassReminders_() {
  const today = csToday_();
  const sh = csNoticeSheet_();
  const map = csNoticeMap_(sh);
  const students = csStudents_();
  const topics = csTopicNames_();
  const sessions = csSessionsDone_();
  const perRoll = {};
  Object.keys(map).forEach(function (k) {
    const n = map[k];
    if (!n.D0 || n.Watched) return;
    const age = csDayAge_(n.date, today);
    let due = '';
    if (age >= 7 && !n.D7) due = 'D7';
    else if (age >= 3 && age < 7 && !n.D3) due = 'D3';
    if (!due) return;
    (perRoll[n.roll] = perRoll[n.roll] || []).push({ n: n, due: due });
  });
  const markup = { inline_keyboard: [[{ text: 'Missed Classes देखें', web_app: { url: csMiniAppUrl_() + '#missed' } }]] };
  let sent = 0;
  Object.keys(perRoll).forEach(function (roll) {
    const stu = students.filter(function (s) { return String(s.Roll_No).trim() === roll; })[0];
    const chat = stu ? csTgIdOf_(stu) : '';
    if (!chat) return;
    const lines = perRoll[roll].map(function (it) {
      const s = sessions.filter(function (x) { return csDateStr_(x.Date) === it.n.date && String(x.Subject).trim().toLowerCase() === String(it.n.subject).trim().toLowerCase(); })[0];
      return '• ' + csMissedLine_(it.n.subject, s ? (topics[String(s.Topic_ID).trim()] || '') : '', it.n.date);
    });
    const text = 'याद दिलाना: ये क्लास अभी तक नहीं देखीं (Commerce Gyan app → Missed Classes):\n' + lines.join('\n');
    if (sendTelegramMessage_(chat, text, markup)) {
      sent++;
      perRoll[roll].forEach(function (it) {
        const f = { D3: csNow_() };
        if (it.due === 'D7') f.D7 = csNow_();
        csNoticeSet_(sh, map, it.n.roll, it.n.date, it.n.cls, it.n.subject, f);
      });
    }
  });
  return { ok: true, sent: sent };
}

/** Uploader webhook hook: fill Youtube_URL on the newest Ended session of this class+subject
 *  whose Notes_Mode is 'Pending' and which has no link yet. Returns rows updated (0 or 1). */
function csAttachRecording_(classRaw, subject, url) {
  const cls = normalizeClassLevel_(classRaw || '');
  const subj = String(subject || '').trim();
  if (!cls || !subj || !url) return 0;
  const sh = csGetSheet_();
  return withWriteLock_(function () {
    const data = sh.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      const r = data[i];
      if (String(r[7]) === 'Ended' && String(r[9]) === 'Pending' && !String(r[10] || '') &&
          String(r[2]) === cls && String(r[3]) === subj) {
        sh.getRange(i + 1, 11).setValue(url);
        csAudit_('CLASS_SESSION_RECORDING_ATTACHED', String(r[0]), subj);
        return 1;
      }
    }
    return 0;
  });
}
