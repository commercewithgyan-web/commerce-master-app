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
const calls = [], audits = [];
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
  ScriptApp: {}, new_Date: null
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
  const closed = ctx.closeStaleSessions_();
  check('stale closed as Abandoned', closed === 1 && TABLES.Class_Sessions.rows[TABLES.Class_Sessions.rows.length - 1][7] === 'Abandoned');
  check('abandoned does not touch topic', calls.length === n);
  check('no live after close', ctx.getLiveSession().live === false);
}
console.log(failures ? failures + ' FAILED, ' + passes + ' passed' : 'ALL PASS (' + passes + ')');
process.exit(failures ? 1 : 0);
