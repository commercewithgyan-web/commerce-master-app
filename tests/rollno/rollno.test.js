#!/usr/bin/env node
/**
 * Roll-number binding tests. Run: node tests/rollno/rollno.test.js
 * Loads backend/auth.gs + Code.gs + doubts.gs into a sandbox with fake Sheets, so no
 * Drive or deploy is needed. Lives outside backend/ so clasp never pushes it.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BACKEND = path.join(__dirname, '..', '..', 'backend');
let passes = 0, failures = 0;
function check(name, cond, detail) {
  if (cond) { passes++; return; }
  failures++;
  console.log('FAIL ' + name + (detail ? '  → ' + detail : ''));
}
function throwsWith(fn, re) {
  try { fn(); return false; } catch (e) { return re.test(String(e.message || e)); }
}

// Fake Master ERP: one registered student, one bound via Telegram_Bindings.
const TABLES = {
  Students_Master: [
    { Roll_No: 'CG-12-007', Student_Name: 'Test Student A', Telegram_ID: '111', Status: 'ACTIVE' },
    { Roll_No: 'CG-11-001', Student_Name: 'Test Student B', Telegram_ID: '', Status: 'ACTIVE' },
    { Roll_No: 'CG-11-020', Student_Name: 'Test Student C', Telegram_ID: '', Status: 'ACTIVE' }
  ],
  Telegram_Bindings: [{ Telegram_User_ID: '222', Roll_No: 'CG-11-020', Status: 'ACTIVE' }]
};
const sheet = (name) => (TABLES[name] ? { __name: name } : null);

function makeSandbox() {
  const logs = [];
  const sb = {
    console,
    logs,
    Logger: { log: (m) => logs.push(String(m)) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: sheet }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => '', setProperty() {}, setProperties() {} }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { formatDate: () => '2026-11-15', computeDigest: () => [], DigestAlgorithm: {}, Charset: {} },
    ContentService: { createTextOutput: () => ({ setMimeType() { return this; } }), MimeType: {} },
    HtmlService: {}
  };
  vm.createContext(sb);
  for (const f of ['auth.gs', 'Code.gs', 'doubts.gs']) {
    vm.runInContext(fs.readFileSync(path.join(BACKEND, f), 'utf8'), sb, { filename: f });
  }
  sb.getActiveSheetIds = () => ({ MASTER_ERP: 'erp', QUESTION_BANK: 'qb', TELEGRAM: 'tg' });
  sb.sheetToObjects = (s) => JSON.parse(JSON.stringify(TABLES[s.__name] || []));
  return sb;
}

const sb = makeSandbox();
const student = (id) => ({ id, first_name: 'X', is_admin: false });
const admin = { id: '999', first_name: 'Admin', is_admin: true };

// ── resolveCallerRollNo_ ──────────────────────────────────────────────
check('student gets own roll', sb.resolveCallerRollNo_(student('111'), {}) === 'CG-12-007');
check('student cannot write as another roll', sb.resolveCallerRollNo_(student('111'), { rollNo: 'CG-11-001' }) === 'CG-12-007');
check('picker default CG-1201 is ignored', sb.resolveCallerRollNo_(student('111'), { rollNo: 'CG-1201' }) === 'CG-12-007');
check('Telegram_Bindings student resolved', sb.resolveCallerRollNo_(student('222'), {}) === 'CG-11-020');
check('unknown user gets guest roll, never CG-11-001', sb.resolveCallerRollNo_(student('5554321'), { rollNo: 'CG-11-001' }) === 'CG-GUEST-4321');
check('admin may name a roll', sb.resolveCallerRollNo_(admin, { rollNo: 'CG-11-001' }) === 'CG-11-001');
check('admin without roll is rejected', throwsWith(() => sb.resolveCallerRollNo_(admin, {}), /MANDATORY_FIELD_MISSING/));
check('no verified user is rejected', throwsWith(() => sb.resolveCallerRollNo_(null, { rollNo: 'CG-11-001' }), /AUTH_FAILED/));
check('verifyAndRouteUser_ still uses the shared lookup', typeof sb.findStudentByTelegramId_ === 'function' &&
  sb.findStudentByTelegramId_({ getSheetByName: sheet }, '222').Roll_No === 'CG-11-020');

// ── submitStudentQuizAttempt / saveStudentNotebookItem use the verified roll ──
function captureRoll(fnName, payload, user) {
  let seen = null;
  const realLock = sb.withWriteLock_;
  const realOpen = sb.SpreadsheetApp.openById;
  // Stop right after the roll is resolved: the first Sheets open inside the function.
  sb.withWriteLock_ = () => { throw new Error('STOP'); };
  sb.SpreadsheetApp.openById = (id) => { if (id === 'qb') throw new Error('STOP'); return realOpen(id); };
  const realResolve = sb.resolveCallerRollNo_;
  sb.resolveCallerRollNo_ = (u, p) => (seen = realResolve(u, p));
  try { sb[fnName](payload, user); } catch (e) { if (!/STOP/.test(e.message)) seen = 'ERR ' + e.message; }
  sb.withWriteLock_ = realLock; sb.SpreadsheetApp.openById = realOpen; sb.resolveCallerRollNo_ = realResolve;
  return seen;
}
check('quiz attempt records under own roll', captureRoll('submitStudentQuizAttempt', { rollNo: 'CG-11-001', qid: 'Q1' }, student('111')) === 'CG-12-007');
check('notebook item saves under own roll', captureRoll('saveStudentNotebookItem', { rollNo: 'CG-11-001' }, student('111')) === 'CG-12-007');

// ── Admin-only actions no longer invent a roll ─────────────────────────
check('fee receipt needs a roll', throwsWith(() => sb.generatePrintableFeeReceipt({ receiptNo: 'R1' }), /rollNo is required/));
sb.requireAdmin_ = () => true;
check('notebook reconcile needs a roll', throwsWith(() => sb.reconcileNotebookRegistry_(admin, {}), /rollNo is required/));

// ── No CG-11-001 fallback left in write paths ──────────────────────────
const src = ['Code.gs', 'questions.gs'].map((f) => fs.readFileSync(path.join(BACKEND, f), 'utf8')).join('\n');
const leftovers = src.split('\n').filter((l) => /'CG-11-001'/.test(l) && !/impersonateRollNo/.test(l));
check('only the admin preview default still names CG-11-001', leftovers.length === 0, leftovers.join(' | '));

// ── Doubts read Student_Name (Students_Master column) ──────────────────
const doubts = fs.readFileSync(path.join(BACKEND, 'doubts.gs'), 'utf8');
check('doubts read Student_Name first', (doubts.match(/student\.Student_Name \|\| student\.Name/g) || []).length === 2);
check('doubts no longer read only student.Name', !/var studentName = student\.Name \|\|/.test(doubts));

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
