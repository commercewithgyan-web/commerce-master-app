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
  return { ok: true, installed: !have };
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
