/**
 * ============================================================================
 * DAILY CONTROL + HEALTH CHECK  (teacher-friendly, Hindi)
 *
 * Daily_Control tab (in the Telegram sheet): ek row = ek din + ek class.
 *   Teacher: Date, Class, Subject, ChapterNo, Subtopic bharta hai.
 *   setupDailyControl()    -> tab + drop-down banata hai (sirf ek baar, safe to re-run)
 *   previewDailyControl()  -> har row ke saamne dikhata hai kaun sa MCQ tab / kitne approved sawal
 *   applyDailyControl()    -> AAJ ki date wali rows ko live lagata hai (ACTIVE_SUBTOPIC + cache flush)
 *   runHealthCheck()       -> Master Vault / DPP log / Syllabus / Students ki galtiyan Hindi me
 *                             "Health_Report" tab me likhta hai (sheet, tab, row ke saath)
 *
 * Kuch bhi apne aap nahi chalta. Apps Script editor se ya trigger se chalaiye.
 * ============================================================================
 */

var DC_TAB = 'Daily_Control';
var DC_HEADERS = ['Date', 'Class', 'Subject', 'ChapterNo', 'Subtopic (naam ya ID)', 'Status', 'Preview (kaun sa MCQ / kitne sawal)'];
var DC_SUBJECTS = ['Accountancy', 'Business Studies', 'Statistics', 'Micro Economics', 'Macro Economics', 'Indian Economic Development'];

function setupDailyControl() {
  var ss = openSpreadsheet_('SHEET_TG');
  var sheet = createOrGetSheet_(ss, DC_TAB);
  formatHeaders_(sheet, DC_HEADERS, '#FFF2CC');
  var n = 500;
  sheet.getRange(2, 1, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireDate().setAllowInvalid(false).setHelpText('Sahi date likhiye, jaise 2026-11-18').build()).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(2, 2, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['11', '12'], true).setAllowInvalid(false).build());
  sheet.getRange(2, 3, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(DC_SUBJECTS, true).setAllowInvalid(false).build());
  sheet.getRange(2, 4, n, 1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 30).setAllowInvalid(false).setHelpText('Chapter number (1-30)').build());
  sheet.setColumnWidths(1, 4, 110);
  sheet.setColumnWidth(5, 260);
  sheet.setColumnWidth(6, 260);
  sheet.setColumnWidth(7, 340);
  return { ok: true, message: 'Daily_Control tab taiyaar hai.' };
}

/** Reads Daily_Control rows with a Hindi problem text when a row is unusable. */
function readDailyControlRows_() {
  var sheet = getSheet_('SHEET_TG', DC_TAB);
  if (!sheet || sheet.getLastRow() < 2) return { sheet: sheet, rows: [] };
  var vals = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  var rows = [];
  for (var i = 0; i < vals.length; i++) {
    var v = vals[i];
    if (!v[0] && !v[1] && !v[2] && !v[3] && !v[4]) continue;
    var cls = normalizeClassLevel_(v[1]);
    var subject = String(v[2] || '').trim();
    var ch = String(v[3] || '').trim();
    var date = v[0] instanceof Date ? getKolkataDate(v[0]) : String(v[0] || '').trim();
    var tab = cls ? getMasterRepoSheetName_(subject, cls) : '';
    var problem = '';
    if (!date) problem = 'Date khali hai';
    else if (!cls) problem = 'Class khali ya galat hai (11 ya 12)';
    else if (!subject) problem = 'Subject khali hai';
    else if (!ch) problem = 'ChapterNo khali hai';
    else if (!tab) problem = 'Class ' + cls + ' me ' + subject + ' subject nahi hota';
    rows.push({ rowNum: i + 2, date: date, cls: cls, subject: subject, ch: ch,
                sub: String(v[4] || '').trim(), tab: tab, problem: problem });
  }
  return { sheet: sheet, rows: rows };
}

function previewDailyControl() {
  var res = readDailyControlRows_();
  if (!res.sheet) return { ok: false, message: 'Pehle setupDailyControl() chalaiye.' };
  var cache = {};
  res.rows.forEach(function(r) {
    var text;
    if (r.problem) {
      text = '❌ ' + r.problem;
    } else {
      if (!cache[r.tab]) cache[r.tab] = getMasterVaultQuestionsByTab_(r.tab, false);
      var live = cache[r.tab].filter(function(q) {
        return String(q.Chapter).replace(/\D/g, '') === String(r.ch).replace(/\D/g, '');
      });
      text = 'Class ' + r.cls + ' → tab ' + r.tab + ' | is chapter ke approved sawal: ' + live.length +
        (live.length < 5 ? ' ⚠️ kam hain (kam se kam 5 chahiye)' : ' ✅') +
        ' | DPP PDF 19:30 / Answer 20:15 (English)';
    }
    res.sheet.getRange(r.rowNum, 7).setValue(text);
  });
  return { ok: true, rows: res.rows.length };
}

function applyDailyControl() {
  var res = readDailyControlRows_();
  if (!res.sheet) return { ok: false, message: 'Pehle setupDailyControl() chalaiye.' };
  var today = getKolkataDate();
  var applied = 0;
  withLock_('DAILY_CONTROL_APPLY', 20000, function() {
    res.rows.forEach(function(r) {
      if (r.date !== today) return;
      var msg;
      if (r.problem) {
        msg = '❌ Lagaya nahi: ' + r.problem;
      } else {
        try {
          setActiveSubtopic_(r.cls, r.subject, r.ch, r.sub || r.ch);
          CacheService.getScriptCache().remove('DAILY_PKG_' + today + '_' + r.cls);
          msg = '✅ Aaj ke liye lag gaya (' + getKolkataTimestamp() + ')';
          applied++;
        } catch (e) {
          msg = '❌ Error: ' + e.message;
        }
      }
      res.sheet.getRange(r.rowNum, 6).setValue(msg);
    });
  });
  return { ok: true, applied: applied, date: today };
}

/* ------------------------------ HEALTH CHECK ------------------------------ */

var HC_TABS = ['11_ACC', '12_ACC', '11_BST', '12_BST', '11_STAT', '12_ECO_IED', '11_ECO_MICRO', '12_ECO_MACRO'];

function runHealthCheck() {
  var issues = [];
  function add(sheet, tab, row, msg) { issues.push([sheet, tab, row, msg]); }

  // 1) Master Vault (MCQ bank)
  try {
    var vault = SpreadsheetApp.openById(getSheetIdByKey_('SHEET_MASTER_REPO'));
    var seen = {};
    HC_TABS.forEach(function(tab) {
      var sh = vault.getSheetByName(tab);
      if (!sh) { add('Master Vault', tab, '-', 'Ye tab sheet me hai hi nahi. Naam check kijiye.'); return; }
      var n = sh.getMaxRows() - MASTER_VAULT_START_ROW + 1;
      if (n < 1) return;
      var data = sh.getRange(MASTER_VAULT_START_ROW, MASTER_VAULT_START_COL, Math.min(n, 1500), MASTER_VAULT_READ_COLS).getValues();
      var tabClass = tab.substring(0, 2);
      data.forEach(function(r, i) {
        var row = MASTER_VAULT_START_ROW + i;
        var qid = String(r[0] || '').trim();
        var q = String(r[9] || '').trim();
        if (!qid && !q) return;
        if (!qid) { add('Master Vault', tab, row, 'QID (column AA) khali hai.'); return; }
        if (qid.substring(0, 2) !== tabClass) add('Master Vault', tab, row, 'QID "' + qid + '" Class ' + qid.substring(0, 2) + ' ka lagta hai, par ye tab Class ' + tabClass + ' ka hai. Sawal galat tab me hai.');
        if (seen[qid]) add('Master Vault', tab, row, 'QID "' + qid + '" dobara aaya (pehle ' + seen[qid] + '). Ek hata dijiye ya QID badaliye.');
        else seen[qid] = tab + ' row ' + row;
        if (!q) add('Master Vault', tab, row, 'Question text (column AI) khali hai.');
        var isMcq = String(r[6] || 'MCQ').toUpperCase().indexOf('MCQ') !== -1;
        if (isMcq) {
          if (!r[10] || !r[11] || !r[12] || !r[13]) add('Master Vault', tab, row, 'Option A/B/C/D me se koi khali hai.');
          if (!/^\(?[ABCD]\)?/i.test(String(r[14] || '').trim())) add('Master Vault', tab, row, 'Sahi answer (column AO) A, B, C ya D hona chahiye.');
        }
        if (!String(r[1] || '').trim()) add('Master Vault', tab, row, 'Canonical Subtopic ID (column AB) khali hai — ye sawal topic se judega nahi.');
        var st = String(r[19] || '').trim().toLowerCase();
        var qa = String(r[20] || '').toUpperCase().indexOf('READY TO APPROVE') !== -1;
        if (st === 'approved' && !qa) add('Master Vault', tab, row, 'Status Approved hai par QA (column AU) "READY TO APPROVE" nahi — bachchon ko ye sawal nahi dikhega.');
      });
    });
  } catch (e) { add('Master Vault', '-', '-', 'Khul nahi paya: ' + e.message); }

  // 2) Subjective DPP log
  try {
    var logs = getAllRowsAsObjects_('SHEET_TG', 'Subjective_PDF_Log', 2000);
    logs.forEach(function(r) {
      if (!r.QID) return;
      var c = normalizeClassLevel_(r.Class);
      if (!c) add('Telegram sheet', 'Subjective_PDF_Log', r._rowNumber, 'Class khali hai. (Ye QID dono classes ke liye "use ho chuka" maana jayega.)');
      else if (String(r.QID).substring(0, 2) !== c) add('Telegram sheet', 'Subjective_PDF_Log', r._rowNumber, 'QID ' + r.QID + ' aur Class ' + c + ' match nahi karte.');
    });
  } catch (e) { add('Telegram sheet', 'Subjective_PDF_Log', '-', 'Padh nahi paya: ' + e.message); }

  // 3) Syllabus class
  try {
    getAllRowsAsObjects_('SHEET_SYLLABUS', 'Master_Syllabus', 2000).forEach(function(r) {
      if (!normalizeClassLevel_(r.Class)) add('Syllabus sheet', 'Master_Syllabus', r._rowNumber, 'Class khali ya galat hai (11 ya 12 likhiye).');
    });
  } catch (e) { add('Syllabus sheet', 'Master_Syllabus', '-', 'Padh nahi paya: ' + e.message); }

  // 4) Students: blank/wrong class => student ko CLASS_MISSING dikhega
  try {
    getAllRowsAsObjects_('SHEET_MASTER_ERP', 'Students_Master', 3000).forEach(function(r) {
      var st = String(r.Status || '').toUpperCase();
      if (st === 'DROPPED' || st === 'INACTIVE' || st === 'GRADUATED') return;
      if (!r.Roll_No && !r.Telegram_ID) return;
      if (!normalizeClassLevel_(r.Class)) add('Master ERP', 'Students_Master', r._rowNumber, 'Student ' + (r.Roll_No || '') + ' ki Class khali ya galat hai — app me "Class missing" dikhega.');
    });
  } catch (e) { add('Master ERP', 'Students_Master', '-', 'Padh nahi paya: ' + e.message); }

  // Report tab
  var out = openSpreadsheet_('SHEET_TG');
  var rep = createOrGetSheet_(out, 'Health_Report');
  rep.clear();
  formatHeaders_(rep, ['Kaun si Sheet', 'Tab', 'Row', 'Kya galat hai (aur kya karna hai)'], '#F4CCCC');
  if (issues.length) {
    rep.getRange(2, 1, issues.length, 4).setValues(issues);
  } else {
    rep.getRange(2, 1).setValue('✅ Koi galti nahi mili.');
  }
  rep.getRange(1, 6).setValue('Chala: ' + getKolkataTimestamp() + ' | Galtiyan: ' + issues.length);
  return { ok: true, issues: issues.length };
}
