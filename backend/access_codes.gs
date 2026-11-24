/**
 * access_codes.gs — Post-trial access via one-time CODE bound to a Telegram ID.
 *
 * Policy (Gyan Sir): everyone gets 7 days free (Telegram_Visitors trial, auth.gs).
 * After that, only students given a CODE can use the system. A code binds to the
 * FIRST Telegram ID that redeems it and can never be used from another ID.
 *
 * Sheet (MASTER_ERP) Access_Codes:
 *   A Code | B Roll_No | C Status (UNUSED/USED/REVOKED) | D Created_At |
 *   E Bound_Telegram_ID | F Bound_At | G Note
 * Redeem appends [tgId, roll, now, 'ACTIVE'] to Telegram_Bindings, which
 * findStudentByTelegramId_ (auth.gs) already honours, so no auth change is needed.
 *
 * Telegram commands (wired in telegram.gs):
 *   student: /code CG-XXXXXX      admin: /newcode <Roll_No> [note]
 *   admin:   /revokecode CG-XXXXXX   (also deactivates the Telegram_Bindings row)
 */

var ACCESS_CODE_SHEET_ = 'Access_Codes';
var ACCESS_CODE_HEADERS_ = ['Code', 'Roll_No', 'Status', 'Created_At', 'Bound_Telegram_ID', 'Bound_At', 'Note'];

function getAccessCodeSheet_(erp) {
  var sh = erp.getSheetByName(ACCESS_CODE_SHEET_);
  if (!sh) {
    sh = erp.insertSheet(ACCESS_CODE_SHEET_);
    sh.getRange(1, 1, 1, ACCESS_CODE_HEADERS_.length).setValues([ACCESS_CODE_HEADERS_]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function normalizeAccessCode_(raw) {
  return String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
}

function randomAccessCode_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  var s = '';
  for (var i = 0; i < 6; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return 'CG-' + s;
}

/** Admin: create a code for a registered student. Returns {ok, code} or {ok:false,error}. */
function generateAccessCode(rollNo, note) {
  rollNo = String(rollNo || '').trim();
  if (!rollNo) return { ok: false, error: 'MISSING_ROLL_NO' };
  return withWriteLock_(function() {
    var erp = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
    var students = sheetToObjects(erp.getSheetByName('Students_Master'));
    if (!students.some(function(s) { return String(s.Roll_No || '').trim() === rollNo; })) {
      return { ok: false, error: 'ROLL_NOT_FOUND' };
    }
    var sh = getAccessCodeSheet_(erp);
    var existing = {};
    var last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, 1).getValues().forEach(function(r) { existing[String(r[0])] = true; });
    var code = randomAccessCode_();
    while (existing[code]) code = randomAccessCode_();
    var now = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    sh.appendRow([code, rollNo, 'UNUSED', now, '', '', note || '']);
    return { ok: true, code: code, rollNo: rollNo };
  });
}

/** Student: bind code to this Telegram ID. One code -> one Telegram ID, forever. */
function redeemAccessCode(rawCode, telegramId) {
  var code = normalizeAccessCode_(rawCode);
  var tgId = String(telegramId || '').trim();
  if (!code || !tgId) return { ok: false, error: 'MISSING_CODE_OR_TG_ID' };
  return withWriteLock_(function() {
    var erp = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
    var sh = getAccessCodeSheet_(erp);
    var last = sh.getLastRow();
    if (last < 2) return { ok: false, error: 'INVALID_CODE' };
    var rows = sh.getRange(2, 1, last - 1, ACCESS_CODE_HEADERS_.length).getValues();
    var idx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (normalizeAccessCode_(rows[i][0]) === code) { idx = i; break; }
    }
    if (idx < 0) return { ok: false, error: 'INVALID_CODE' };
    var row = rows[idx];
    var status = String(row[2] || '').toUpperCase();
    var roll = String(row[1] || '').trim();
    var boundTo = String(row[4] || '').trim();
    if (status === 'REVOKED') return { ok: false, error: 'CODE_REVOKED' };
    if (status === 'USED') {
      if (boundTo === tgId) return { ok: true, already: true, rollNo: roll };
      return { ok: false, error: 'CODE_ALREADY_USED' };
    }
    var now = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    var sheetRow = idx + 2;
    sh.getRange(sheetRow, 3, 1, 4).setValues([['USED', row[3], tgId, now]]);
    var bind = erp.getSheetByName('Telegram_Bindings');
    if (!bind) {
      bind = erp.insertSheet('Telegram_Bindings');
      bind.getRange(1, 1, 1, 4).setValues([['Telegram_User_ID', 'Roll_No', 'Bound_At', 'Status']]);
    }
    bind.appendRow([tgId, roll, now, 'ACTIVE']);
    return { ok: true, rollNo: roll };
  });
}

/** Admin: revoke a code and deactivate its Telegram_Bindings row (frees nothing: code is dead). */
function revokeAccessCode(rawCode) {
  var code = normalizeAccessCode_(rawCode);
  if (!code) return { ok: false, error: 'MISSING_CODE' };
  return withWriteLock_(function() {
    var erp = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
    var sh = getAccessCodeSheet_(erp);
    var last = sh.getLastRow();
    if (last < 2) return { ok: false, error: 'INVALID_CODE' };
    var rows = sh.getRange(2, 1, last - 1, ACCESS_CODE_HEADERS_.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (normalizeAccessCode_(rows[i][0]) !== code) continue;
      var tgId = String(rows[i][4] || '').trim();
      var roll = String(rows[i][1] || '').trim();
      sh.getRange(i + 2, 3).setValue('REVOKED');
      if (tgId) {
        var bind = erp.getSheetByName('Telegram_Bindings');
        if (bind && bind.getLastRow() > 1) {
          var b = bind.getRange(2, 1, bind.getLastRow() - 1, 4).getValues();
          for (var j = 0; j < b.length; j++) {
            if (String(b[j][0]) === tgId && String(b[j][1]) === roll && String(b[j][3]).toUpperCase() === 'ACTIVE') {
              bind.getRange(j + 2, 4).setValue('REVOKED');
            }
          }
        }
      }
      return { ok: true, code: code, wasBoundTo: tgId };
    }
    return { ok: false, error: 'INVALID_CODE' };
  });
}

var ACCESS_CODE_ERRORS_ = {
  INVALID_CODE: '❌ Yeh code galat hai. Dobara check karein.',
  CODE_REVOKED: '❌ Yeh code band (revoke) kar diya gaya hai. Gyan Sir se baat karein.',
  CODE_ALREADY_USED: '❌ Yeh code kisi aur Telegram ID se use ho chuka hai. Naya code ke liye Gyan Sir se baat karein.',
  MISSING_CODE_OR_TG_ID: '❌ Code likhiye, jaise: /code CG-ABC234'
};

function handleCodeCommand_(chatId, text) {
  var parts = String(text || '').trim().split(/\s+/);
  var res;
  try { res = redeemAccessCode(parts[1], chatId); } catch (e) { Logger.log('redeemAccessCode failed: ' + e.message); res = { ok: false, error: 'SERVER_ERROR' }; }
  if (res.ok) {
    sendTelegramMessage_(chatId, '✅ *Access active!* Aapka code is Telegram ID se jud gaya hai (Roll ' + res.rollNo + '). App kholne ke liye /start dabayein.');
  } else {
    sendTelegramMessage_(chatId, ACCESS_CODE_ERRORS_[res.error] || '⚠️ Abhi code verify nahi ho paya. Thodi der baad try karein.');
  }
}

function handleAdminNewCodeCommand_(chatId, text) {
  var parts = String(text || '').trim().split(/\s+/);
  var res = generateAccessCode(parts[1], parts.slice(2).join(' '));
  if (res.ok) {
    sendTelegramMessage_(chatId, '🔑 Code for Roll ' + res.rollNo + ': `' + res.code + '`\nStudent ko bolein: Telegram bot mein `/code ' + res.code + '` bhejein.');
  } else {
    sendTelegramMessage_(chatId, '❌ ' + (res.error === 'ROLL_NOT_FOUND' ? 'Roll No Students_Master mein nahi mila.' : 'Usage: /newcode <Roll_No> [note]'));
  }
}

function handleAdminRevokeCodeCommand_(chatId, text) {
  var parts = String(text || '').trim().split(/\s+/);
  var res = revokeAccessCode(parts[1]);
  sendTelegramMessage_(chatId, res.ok ? '🚫 Code ' + res.code + ' revoked.' + (res.wasBoundTo ? ' Binding deactivated.' : '') : '❌ Code nahi mila. Usage: /revokecode <CODE>');
}
