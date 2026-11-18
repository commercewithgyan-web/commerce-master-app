#!/usr/bin/env node
/** Class session tests. Run: node tests/sessions/sessions.test.js  (fake Sheets, no deploy needed) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
let passes = 0, failures = 0;
function check(name, cond, detail) { if (cond) { passes++; return; } failures++; console.log('FAIL ' + name + (detail ? ' -> ' + detail : '')); }

function fakeSheet(rows) {
  return {
    rows,
    getDataRange() { return { getValues: () => rows.map(r => r.slice()) }; },
    getLastRow() { return rows.length; },
    appendRow(r) { rows.push(r.slice()); },
    getRange(r, c) { return { setValue: v => { while (rows[r - 1].length < c) rows[r - 1].push(''); rows[r - 1][c - 1] = v; } }; }
  };
}
const TABLES = {
  Master_Syllabus: fakeSheet([
    ['Canonical_Topic_ID', 'Class', 'Subject', 'ChapterNo', 'Topic_Name', 'Status'],
    ['ACC-11-1', 'Class 11', 'Accountancy', '1', 'Intro', 'Not Started'],
    ['ACC-12-1', 'Class 12', 'Accountancy', '1', 'Partnership', 'Not Started']
  ]),
  Attendance_Logs: fakeSheet([
    ['Date', 'Batch_ID', 'Roll_No', 'Student_Name', 'Status', 'Class'],
    ['2026-11-18', 'C11_AFT', 'CG-11-001', 'A', 'A', '11'],
    ['2026-11-18', 'C11_AFT', 'CG-11-002', 'B', 'L', '11'],
    ['2026-11-18', 'C11_AFT', 'CG-11-003', 'C', 'P', '11'],
    ['2026-11-18', 'C12_AFT', 'CG-12-001', 'D', 'A', '12'],
    ['2026-11-17', 'C11_AFT', 'CG-11-004', 'E', 'A', '11']
  ])
};
const ss = { getSheetByName: n => TABLES[n] || null, insertSheet: n => (TABLES[n] = fakeSheet([])) };
const calls = [], audits = [], sends = [];
let today = '2026-11-18';
const ctx = {
  Logger: { log() {} },
  SpreadsheetApp: { openById: () => ss },
  Utilities: { formatDate: (d) => (typeof d === 'string' ? d : (d.__d || today)), getUuid: () => 'U' + Math.random().toString(36).slice(2, 8) },
  withWriteLock_: fn => fn(),
  getActiveSheetIds: () => ({ MASTER_ERP: 'E', SYLLABUS: 'S', TELEGRAM: 'T' }),
  normalizeClassLevel_: raw => { const s = String(raw).toUpperCase(); return /(^|\D)12(\D|$)/.test(s) ? '12' : /(^|\D)11(\D|$)/.test(s) ? '11' : ''; },
  setActiveSubtopic: p => { calls.push(p); return { ok: true }; },
  recordAuditLog_: (...a) => audits.push(a),
  sheetToObjects: sh => { const d = sh.getDataRange().getValues(); const h = d[0]; return d.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]))); },
  ScriptApp: {}, new_Date: null,
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => '' }) },
  sendTelegramMessage_: (chatId, text, markup) => { sends.push({ chatId: String(chatId), text, markup }); return true; }
};
vm.createContext(ctx);
let loaded = true;
try { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'backend', 'class_sessions.gs'), 'utf8'), ctx); }
catch (e) { loaded = false; console.log('LOAD FAIL ' + e.message); }
check('class_sessions.gs loads', loaded);
if (loaded) {
  ctx.__todayOverride = () => today;
  const s1 = ctx.startClassSession({ subtopicId: 'ACC-11-1', deliveryMode: 'Offline' });
  check('start ok', s1.ok && s1.sessionId, JSON.stringify(s1));
  check('start used In Progress', calls[0] && calls[0].status === 'In Progress' && calls[0].subtopicId === 'ACC-11-1');
  const s2 = ctx.startClassSession({ subtopicId: 'ACC-11-1' });
  check('double start rejected', s2.error && !s2.ok, JSON.stringify(s2));
  check('only one session row', TABLES.Class_Sessions.rows.length === 2);
  const s3 = ctx.startClassSession({ subtopicId: 'ACC-12-1' });
  check('class 12 same subject allowed', s3.ok, JSON.stringify(s3));
  const live = ctx.getLiveSession();
  check('live lists both', live.live && live.sessions.length === 2, JSON.stringify(live));
  check('unknown topic rejected', ctx.startClassSession({ subtopicId: 'NOPE' }).error);
  const before = calls.length;
  const e1 = ctx.endClassSession({ sessionId: s1.sessionId, outcome: 'Partly', notesMode: 'Pending' });
  check('end ok', e1.ok, JSON.stringify(e1));
  check('partly does not call Completed', calls.length === before);
  check('notice summary counts', e1.noticeSummary.absent === 1 && e1.noticeSummary.late === 1, JSON.stringify(e1.noticeSummary));
  const row = TABLES.Class_Sessions.rows[1];
  check('row Ended/Partly', row[7] === 'Ended' && row[8] === 'Partly' && row[9] === 'Pending', JSON.stringify(row));
  check('end twice errors', ctx.endClassSession({ sessionId: s1.sessionId, outcome: 'Completed' }).error);
  const e2 = ctx.endClassSession({ sessionId: s3.sessionId, outcome: 'Completed', notesMode: 'Skipped' });
  check('completed calls Completed', calls[calls.length - 1].status === 'Completed' && calls[calls.length - 1].subtopicId === 'ACC-12-1');
  check('end no session errors', ctx.endClassSession({ sessionId: 'ZZZ', outcome: 'Completed' }).error);
  check('bad outcome errors', ctx.endClassSession({ sessionId: s3.sessionId, outcome: 'Whatever' }).error);
  // stale close
  const s4 = ctx.startClassSession({ subtopicId: 'ACC-11-1' });
  const n = calls.length;
  today = '2026-11-19';
  const closed = ctx.closeStaleSessions();
  check('stale closed as Abandoned', closed === 1 && TABLES.Class_Sessions.rows[TABLES.Class_Sessions.rows.length - 1][7] === 'Abandoned');
  check('abandoned does not touch topic', calls.length === n);
  check('no live after close', ctx.getLiveSession().live === false);

  // Task 5: next topic carry-over
  const SY = TABLES.Master_Syllabus.rows;
  const H = SY[0]; SY.length = 1;
  const add = (id, cls, subj, st) => SY.push([id, cls, subj, '1', id, st]);
  add('E-1', 'Class 11', 'Economics', 'Completed'); add('E-2', 'Class 11', 'Economics', 'Completed');
  add('E-3', 'Class 11', 'Economics', 'In Progress'); add('E-4', 'Class 11', 'Economics', 'Not Started');
  let r = ctx.getNextTopicForClass({ class: '11', subject: 'Economics' });
  check('partly wins', r.topicId === 'E-3' && r.state === 'Partly', JSON.stringify(r));
  SY.length = 1;
  add('B-1', 'Class 11', 'BST', 'Completed'); add('B-2', 'Class 11', 'BST', 'Completed'); add('B-3', 'Class 11', 'BST', 'Not Started'); add('B-4', 'Class 11', 'BST', 'Not Started');
  add('B-9', 'Class 12', 'BST', 'Not Started');
  r = ctx.getNextTopicForClass({ class: '11', subject: 'BST' });
  check('first not started', r.topicId === 'B-3' && r.state === 'Next', JSON.stringify(r));
  r = ctx.getNextTopicForClass({ class: '11', subject: 'Nothing' });
  check('empty none', r.topicId === '' && r.state === 'None', JSON.stringify(r));
  r = ctx.getNextTopicForClass({ class: '12', subject: 'BST' });
  check('class 12 separate', r.topicId === 'B-9', JSON.stringify(r));

  // Task 6: missed classes + notices
  const CSH = TABLES.Class_Sessions.rows; CSH.length = 1;
  CSH.push(['SES-A', '2026-11-10', '11', 'Accountancy', 'ACC-11-1', 't', 't', 'Ended', 'Completed', 'Skipped', '']);
  CSH.push(['SES-B', '2026-11-11', '11', 'Economics', 'E-3', 't', 't', 'Abandoned', '', 'Pending', '']);
  CSH.push(['SES-C', '2026-11-12', '11', 'BST', 'B-3', 't', '', 'Live', '', '', '']);
  SY.length = 1; add('ACC-11-1', 'Class 11', 'Accountancy', 'Completed'); add('E-3', 'Class 11', 'Economics', 'In Progress'); add('B-3', 'Class 11', 'BST', 'Not Started');
  const AT = TABLES.Attendance_Logs.rows; AT.length = 1;
  AT.push(['2026-11-10', 'C11_AFT', 'CG-11-001', 'A', 'A', '11']);
  AT.push(['2026-11-10', 'C11_AFT', 'CG-11-002', 'B', 'L', '11']);
  AT.push(['2026-11-10', 'C11_AFT', 'CG-11-003', 'C', 'P', '11']);
  AT.push(['2026-11-11', 'C11_AFT', 'CG-11-001', 'A', 'A', '11']);
  AT.push(['2026-11-12', 'C11_AFT', 'CG-11-001', 'A', 'A', '11']);
  AT.push(['2026-11-10', 'C12_AFT', 'CG-12-001', 'D', 'A', '12']);
  TABLES.Students_Master = fakeSheet([['Roll_No', 'Student_Name', 'Telegram_ID'], ['CG-11-001', 'A', '1001'], ['CG-11-002', 'B', '1002'], ['CG-11-003', 'C', '1003']]);
  TABLES.Daily_Class_Recordings = fakeSheet([['Date', 'Class', 'Subject', 'Topic', 'YouTube_Unlisted_URL', 'Drive_File_ID', 'Updated_At']]);
  today = '2026-11-12';
  check('no send before confirm', sends.length === 0);
  let m = ctx.getMissedClasses({}, { id: 1001 });
  check('missed: 2 rows (live excluded), by subject then date', Array.isArray(m) && m.length === 2 && m[0].subject === 'Accountancy' && m[1].subject === 'Economics', JSON.stringify(m));
  check('missed: topic name + not available + not watched', m[0].topic === 'ACC-11-1' && m[0].recordingAvailable === false && m[0].watched === false && m[0].date === '2026-11-10', JSON.stringify(m[0]));
  check('skipped notes still listed', m[0].subject === 'Accountancy');
  m = ctx.getMissedClasses({}, { id: 1002 });
  check('late student included', m.length === 1 && m[0].status === 'L', JSON.stringify(m));
  m = ctx.getMissedClasses({ studentId: 'CG-11-001' }, { id: 1002 });
  check('non-admin cannot read another student', m.length === 1 && m[0].status === 'L', JSON.stringify(m));
  m = ctx.getMissedClasses({ studentId: 'CG-11-001' }, { id: 999, is_admin: true });
  check('admin can view-as', m.length === 2, JSON.stringify(m));
  check('unknown telegram id errors', ctx.getMissedClasses({}, { id: 5 }).error);
  TABLES.Daily_Class_Recordings.rows.push(['2026-11-10', 'Class 11', 'Accountancy', 't', 'https://y', 'd', 'x']);
  m = ctx.getMissedClasses({}, { id: 1001 });
  check('recording row flips recordingAvailable', m[0].recordingAvailable === true && m[1].recordingAvailable === false, JSON.stringify(m));
  // D0 notices
  const nA = ctx.sendClassMissedNotices({ sessionId: 'SES-A' });
  check('D0 sent to absent+late', nA.ok && nA.sent === 2 && sends.length === 2, JSON.stringify(nA));
  const sA = sends.find(x => x.chatId === '1001'), sL = sends.find(x => x.chatId === '1002');
  check('absent text', /Accountancy/.test(sA.text) && /मिस/.test(sA.text), sA.text);
  check('late text', /late/i.test(sL.text) && /Accountancy/.test(sL.text), sL.text);
  check('no video link in text', !/https?:/.test(sA.text + sL.text));
  check('mini app button #missed', sA.markup.inline_keyboard[0][0].web_app.url.slice(-7) === '#missed', JSON.stringify(sA.markup));
  check('D0 idempotent', ctx.sendClassMissedNotices({ sessionId: 'SES-A' }).sent === 0 && sends.length === 2);
  check('notice for live session rejected', ctx.sendClassMissedNotices({ sessionId: 'SES-C' }).error);
  check('notice unknown session rejected', ctx.sendClassMissedNotices({ sessionId: 'NOPE' }).error);
  ctx.sendClassMissedNotices({ sessionId: 'SES-B' });
  check('second session D0 to 001', sends.length === 3 && sends[2].chatId === '1001');
  // D3
  today = '2026-11-13';
  let n0 = sends.length; ctx.sendMissedClassReminders();
  check('D3: 001 and 002 one msg each (only 11-10 aged 3)', sends.length === n0 + 2, String(sends.length - n0));
  n0 = sends.length; ctx.sendMissedClassReminders();
  check('reminders idempotent same day', sends.length === n0);
  // watched stops further messages
  check('markMissedWatched ok', ctx.markMissedWatched({ date: '2026-11-10', subject: 'Accountancy' }, { id: 1001 }).ok);
  check('watched reflected', ctx.getMissedClasses({}, { id: 1001 })[0].watched === true);
  // D7
  today = '2026-11-18';
  n0 = sends.length; ctx.sendMissedClassReminders();
  const d7 = sends.slice(n0);
  check('D7 combined: one msg per student', d7.length === 2 && d7.filter(x => x.chatId === '1001').length === 1, JSON.stringify(d7.map(x => x.chatId)));
  const d7a = d7.find(x => x.chatId === '1001'), d7b = d7.find(x => x.chatId === '1002');
  check('watched class dropped from reminder', !/Accountancy/.test(d7a.text) && /Economics/.test(d7a.text), d7a.text);
  check('002 still gets Accountancy', /Accountancy/.test(d7b.text));
  n0 = sends.length; ctx.sendMissedClassReminders();
  check('max 3 per class: no more after D7', sends.length === n0);
  // Task 4: recording link attaches to the newest Ended+Pending session of that class/subject
  const rows4 = TABLES.Class_Sessions.rows;
  rows4.push(['ATT-1','2026-11-18','11','Accountancy','ACC-11-1','','','Ended','Completed','Pending','']);
  rows4.push(['ATT-2','2026-11-18','11','Accountancy','ACC-11-1','','','Ended','Completed','Skipped','']);
  rows4.push(['ATT-3','2026-11-18','12','Accountancy','ACC-12-1','','','Ended','Completed','Pending','']);
  check('attach returns count 1', ctx.csAttachRecording_('Class 11', 'Accountancy', 'https://youtu.be/x') === 1);
  const rA = rows4.find(r => r[0] === 'ATT-1'), rB = rows4.find(r => r[0] === 'ATT-2'), rC = rows4.find(r => r[0] === 'ATT-3');
  check('attach filled class 11 pending only', rA[10] === 'https://youtu.be/x' && rB[10] === '' && rC[10] === '', JSON.stringify([rA[10], rB[10], rC[10]]));
  check('attach not overwritten twice', ctx.csAttachRecording_('11', 'Accountancy', 'https://youtu.be/y') === 0 && rA[10] === 'https://youtu.be/x');
  check('attach unknown class ignored', ctx.csAttachRecording_('', 'Accountancy', 'u') === 0);

  // ===== Final-review fix pass =====
  // (1)+(6) public trigger handler names, stale-close runs after midnight
  const trig = [];
  ctx.ScriptApp = { getProjectTriggers: () => [], newTrigger: h => { const t = { h, hour: null }; trig.push(t); const b = { timeBased: () => b, everyDays: () => b, atHour: n => { t.hour = n; return b; }, nearMinute: () => b, inTimezone: () => b, create: () => t }; return b; } };
  ctx.installSessionTriggers();
  const tStale = trig.find(t => t.h === 'closeStaleSessions'), tRem = trig.find(t => t.h === 'sendMissedClassReminders');
  check('fix6: stale trigger uses public name', !!tStale, JSON.stringify(trig.map(t => t.h)));
  check('fix6: reminder trigger uses public name', !!tRem);
  check('fix6: no trailing-underscore handler', trig.every(t => !/_$/.test(t.h)));
  check('fix1: stale-close runs just after midnight (hour 0)', !!tStale && tStale.hour === 0, String(tStale && tStale.hour));
  TABLES.Class_Sessions.rows.push(['STALE-Y', '2026-11-17', '11', 'BST', 'B-3', 't', '', 'Live', '', '', '']);
  today = '2026-11-18';
  ctx.closeStaleSessions();
  check('fix1: yesterday Live closed after midnight', TABLES.Class_Sessions.rows.find(r => r[0] === 'STALE-Y')[7] === 'Abandoned');

  // (2) one blocked student must not stop the rest
  AT.push(['2026-11-19', 'C11_AFT', 'CG-11-001', 'A', 'A', '11']);
  AT.push(['2026-11-19', 'C11_AFT', 'CG-11-002', 'B', 'L', '11']);
  TABLES.Class_Sessions.rows.push(['SES-N', '2026-11-19', '11', 'Accountancy', 'ACC-11-1', 't', 't', 'Ended', 'Completed', 'Skipped', '']);
  const realSend = ctx.sendTelegramMessage_;
  ctx.sendTelegramMessage_ = (chat, text, markup) => { if (String(chat) === '1001') throw new Error('Forbidden: bot was blocked'); return realSend(chat, text, markup); };
  let rN; let threw = false;
  try { rN = ctx.sendClassMissedNotices({ sessionId: 'SES-N' }); } catch (e) { threw = true; }
  check('fix2: blocked student does not abort D0', !threw && rN && rN.ok && rN.sent === 1, threw ? 'threw' : JSON.stringify(rN));
  ctx.sendTelegramMessage_ = realSend;
  const rN2 = ctx.sendClassMissedNotices({ sessionId: 'SES-N' });
  check('fix2: failed send is retryable (D0 not stuck)', rN2.sent === 1, JSON.stringify(rN2));
  today = '2026-11-22';
  ctx.sendTelegramMessage_ = (chat, text, markup) => { if (String(chat) === '1001') throw new Error('Forbidden'); return realSend(chat, text, markup); };
  const nR = sends.length; threw = false;
  try { ctx.sendMissedClassReminders(); } catch (e) { threw = true; }
  check('fix2: blocked student does not abort reminders', !threw && sends.length > nR, threw ? 'threw' : String(sends.length - nR));
  ctx.sendTelegramMessage_ = realSend;

  // (3) double-tap: a second call arriving while the first is mid-send must send nothing
  AT.push(['2026-11-20', 'C11_AFT', 'CG-11-001', 'A', 'A', '11']);
  TABLES.Class_Sessions.rows.push(['SES-R', '2026-11-20', '11', 'Accountancy', 'ACC-11-1', 't', 't', 'Ended', 'Completed', 'Skipped', '']);
  let inner = null, depth = 0;
  ctx.sendTelegramMessage_ = (chat, text, markup) => { if (depth === 0) { depth++; inner = ctx.sendClassMissedNotices({ sessionId: 'SES-R' }); } return realSend(chat, text, markup); };
  const outer = ctx.sendClassMissedNotices({ sessionId: 'SES-R' });
  ctx.sendTelegramMessage_ = realSend;
  check('fix3: concurrent second tap sends 0', inner && inner.sent === 0 && outer.sent === 1, JSON.stringify([inner, outer]));

  // (5) getNextTopicForClass resolves class+subject from topicId
  const SYL = TABLES.Master_Syllabus.rows; SYL.length = 1;
  SYL.push(['ACC-11-1', 'Class 11', 'Accountancy', '1', 'Intro', 'Completed']);
  SYL.push(['ACC-11-2', 'Class 11', 'Accountancy', '2', 'Next', 'Not Started']);
  SYL.push(['ACC-12-1', 'Class 12', 'Accountancy', '1', 'Partnership', 'Not Started']);
  let rT = ctx.getNextTopicForClass({ topicId: 'ACC-11-1' });
  check('fix5: topicId resolves class/subject', rT.topicId === 'ACC-11-2' && rT.state === 'Next', JSON.stringify(rT));
  rT = ctx.getNextTopicForClass({ topicId: 'ACC-12-1' });
  check('fix5: class 12 kept separate by topicId', rT.topicId === 'ACC-12-1', JSON.stringify(rT));
  rT = ctx.getNextTopicForClass({ topicId: 'NOPE-1' });
  check('fix5: unknown topicId -> None', rT.topicId === '' && rT.state === 'None', JSON.stringify(rT));

  // (11) attach: date check + case-insensitive subject
  const r11 = TABLES.Class_Sessions.rows;
  r11.push(['ATT-4', '2026-11-15', '11', 'Economics', 'E-3', '', '', 'Ended', 'Completed', 'Pending', '']);
  r11.push(['ATT-5', '2026-11-16', '11', 'Economics', 'E-3', '', '', 'Ended', 'Completed', 'Pending', '']);
  check('fix11: date picks the matching session, case-insensitive subject', ctx.csAttachRecording_('Class 11', 'economics', 'https://youtu.be/e', '2026-11-15') === 1
    && r11.find(r => r[0] === 'ATT-4')[10] === 'https://youtu.be/e' && r11.find(r => r[0] === 'ATT-5')[10] === '');
  check('fix11: wrong date attaches nothing', ctx.csAttachRecording_('Class 11', 'Economics', 'u', '2026-11-01') === 0);
}
console.log(failures ? failures + ' FAILED, ' + passes + ' passed' : 'ALL PASS (' + passes + ')');
process.exit(failures ? 1 : 0);
