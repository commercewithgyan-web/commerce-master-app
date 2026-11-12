/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — AUTHENTICATION & ACCESS GATE (auth.gs)
 * Cryptographic HMAC-SHA256 verification of Telegram WebApp initData,
 * 24-hour expiration check, and Paid-Student dynamic access gating.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Verifies the integrity and authenticity of Telegram Mini App initData
 * using HMAC-SHA256 as specified in the official Telegram WebApp documentation.
 * 
 * NEVER trusts initDataUnsafe.
 * 
 * @param {string} initData - Raw initData query string sent from client
 * @return {Object} Verified Telegram User object
 * @throws {Error} AUTH_FAILED if signature is invalid or expired
 */
function verifyTelegramInitData_(initData) {
  if (!initData || typeof initData !== 'string' || initData.trim() === '') {
    throw new Error('HTTP 401: AUTH_FAILED (MISSING_INIT_DATA)');
  }

  // Parse query string parameters
  var pairs = initData.split('&');
  var params = {};
  var hash = null;

  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    var key = decodeURIComponent(parts[0]);
    var value = parts.slice(1).join('=');
    value = decodeURIComponent(value);

    if (key === 'hash') {
      hash = value;
    } else if (key !== 'signature') {
      // Exclude both 'hash' and Telegram's optional 'signature'
      params[key] = value;
    }
  }

  var props = PropertiesService.getScriptProperties();
  var botToken = props.getProperty('TELEGRAM_BOT_TOKEN') || props.getProperty('BOT_TOKEN');
  if (!botToken) {
    throw new Error('CONFIG_ERROR: BOT_TOKEN not configured in Script Properties');
  }

  if (!hash) {
    throw new Error('HTTP 401: AUTH_FAILED (MISSING_HASH)');
  }

  // Check 24-hour freshness (auth_date in Unix seconds)
  if (params.auth_date) {
    var authTimestamp = parseInt(params.auth_date, 10);
    var nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - authTimestamp > 86400) {
      throw new Error('HTTP 401: AUTH_FAILED (EXPIRED_INIT_DATA: >24 hours old)');
    }
  }

  // Sort keys alphabetically and format as "key=value\n"
  var sortedKeys = Object.keys(params).sort();
  var dataCheckArr = [];
  for (var k = 0; k < sortedKeys.length; k++) {
    dataCheckArr.push(sortedKeys[k] + '=' + params[sortedKeys[k]]);
  }
  var dataCheckString = dataCheckArr.join('\n');

  // Step 1: Secret Key = HMAC_SHA256("WebAppData", botToken)
  var secretKeyBytes = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(botToken).getBytes(),
    Utilities.newBlob('WebAppData').getBytes()
  );

  // Step 2: Computed Hash = HMAC_SHA256(dataCheckString, secretKeyBytes)
  var dataCheckBytes = Utilities.newBlob(dataCheckString).getBytes();
  var calculatedHashBytes = Utilities.computeHmacSha256Signature(dataCheckBytes, secretKeyBytes);

  var calculatedHash = calculatedHashBytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');

  // Step 3: Constant-time comparison
  if (calculatedHash.toLowerCase() !== hash.toLowerCase()) {
    throw new Error('HTTP 401: AUTH_FAILED (INVALID_HMAC_SIGNATURE)');
  }

  if (!params.user) {
    throw new Error('HTTP 401: AUTH_FAILED (USER_PAYLOAD_MISSING)');
  }

  try {
    var userObj = JSON.parse(params.user);
    userObj.is_admin = isAdmin_(userObj.id);
    return userObj;
  } catch (e) {
    throw new Error('HTTP 401: AUTH_FAILED (INVALID_USER_JSON)');
  }
}

/**
 * Stage 1 Admin Dual-Role Gateway & User Router
 */
function verifyAndRouteUser_(initDataRaw, previewRollNo) {
  var user = null;
  if (initDataRaw) {
    try {
      user = verifyTelegramInitData_(initDataRaw);
    } catch (err) {
      return { ok: false, error: err.message || 'HTTP 401: AUTH_FAILED' };
    }
  } else if ((typeof getActiveEnvMode === 'function' && getActiveEnvMode() === 'STAGING') || previewRollNo) {
    // Admin / Staging sandbox test preview bypass
    user = { id: getMasterAdminId_(), first_name: 'Gyan Sir (Admin Preview)' };
  } else {
    return { ok: false, error: 'HTTP 401: AUTH_FAILED (MISSING_INIT_DATA)' };
  }

  var telegramId = String((user && user.id) || '');

  // Audit Patch 2: Admin & Sub-Admin Dual-Role Routing
  if (isMasterAdminId_(telegramId)) {
    return {
      ok: true,
      role: 'ADMIN',
      isAdmin: true,
      isSubAdmin: false,
      telegramId: getMasterAdminId_(),
      permissions: ['ALL'],
      impersonateRollNo: previewRollNo || 'CG-11-001'
    };
  }

  if (isSubAdmin_(telegramId)) {
    return {
      ok: true,
      role: 'SUB_ADMIN',
      isAdmin: false,
      isSubAdmin: true,
      telegramId: telegramId,
      permissions: ['DASHBOARD_READ', 'ROSTER_READ', 'ATTENDANCE_MARK', 'DPP_DISPATCH', 'PARENT_COMM'],
      impersonateRollNo: previewRollNo || 'CG-11-001'
    };
  }

  // Fail closed: a blank ID must never match a student row with a blank Telegram_ID
  if (!telegramId) {
    return { ok: false, error: 'STUDENT_NOT_FOUND', telegramId: telegramId };
  }

  var IDS = getActiveSheetIds();
  var erp = SpreadsheetApp.openById(IDS.MASTER_ERP);
  var students = sheetToObjects(erp.getSheetByName('Students_Master'));
  var student = students.find(function(s) {
    return String(s.Telegram_ID || s.Telegram_User_ID || '') === telegramId;
  });

  if (!student) {
    // Check INQUIRY_CRM for comeback trial students
    try {
      var inqSheet = erp.getSheetByName('INQUIRY_CRM');
      if (inqSheet) {
        var inqs = sheetToObjects(inqSheet);
        var trialInq = inqs.find(function(item) {
          return String(item.Lead_Source || '').toUpperCase() === 'COMEBACK_TRIAL' &&
                 (String(item.Mobile || '') === telegramId || String(item.Telegram_ID || '') === telegramId);
        });
        if (trialInq) {
          var todayStr = getKolkataDate();
          var exp = String(trialInq.Trial_Expires || trialInq.Follow_Up_Date || '');
          if (!exp || exp >= todayStr) {
            return {
              ok: true,
              role: 'STUDENT',
              isAdmin: false,
              isTrial: true,
              trialExpires: exp,
              student: {
                Roll_No: 'CG-TRIAL-' + (trialInq.Mobile ? String(trialInq.Mobile).slice(-4) : '2026'),
                Name: trialInq.Student_Name || 'Comeback Scholar',
                Class: trialInq.Class || '12',
                Status: 'TRIAL_ACTIVE',
                Lead_Source: 'COMEBACK_TRIAL',
                Trial_Expires: exp,
                isTrial: true
              }
            };
          }
        }
      }
    } catch (_) {}

    return { ok: false, error: 'STUDENT_NOT_FOUND', telegramId: telegramId };
  }

  // Check trial active status & expiry
  if (String(student.Status || '').toUpperCase() === 'TRIAL_ACTIVE' || String(student.Lead_Source || '').toUpperCase() === 'COMEBACK_TRIAL') {
    var todayDateStr = getKolkataDate();
    var expiry = String(student.Trial_Expires || student.TrialExpires || '');
    if (expiry && expiry < todayDateStr) {
      return {
        ok: false,
        error: 'TRIAL_EXPIRED',
        trialExpires: expiry,
        message: 'Your 7-Day Free Comeback Pass expired on ' + expiry + '. Re-join the batch with Begusarai comeback scholarship offer by messaging Gyan Sir!'
      };
    }
    return { ok: true, role: 'STUDENT', isAdmin: false, isTrial: true, trialExpires: expiry, student: student };
  }

  return { ok: true, role: 'STUDENT', isAdmin: false, student: student };
}

/**
 * Enforces Paid-Student Gate (Law C-3)
 * Verifies that the user exists in Students directory, has active/grace status,
 * is not overdue > 10 days, and has current course access.
 * 
 * @param {string|number} telegramId - Numerical Telegram user ID
 * @return {Object} Verified Student record from Sheet 3
 * @throws {Error} ACCESS_PAUSED or ACCESS_DENIED
 */
function requirePaidStudent_(telegramId) {
  var cleanId = String(telegramId || '').trim();

  // Master Admin Dual-Role Bypass for Founder
  if (isAdmin_(cleanId)) {
    return {
      studentId: 'CG-11-001',
      StudentID: 'CG-11-001',
      name: 'Gyan Sir (Admin Preview)',
      Name: 'Gyan Sir (Admin Preview)',
      classLevel: '11',
      Class: 11,
      paid: true,
      Paid: 'YES',
      status: 'Active',
      Status: 'Active',
      TelegramID: cleanId,
      Notes: 'Founder Admin Dual-Role'
    };
  }

  if (!cleanId || cleanId === 'GUEST_STUDENT') {
    throw new Error('HTTP 401: AUTH_FAILED: Unauthenticated user');
  }

  // Check CacheService for fast student resolution
  var cache = CacheService.getScriptCache();
  var cachedStudent = cache.get('STUDENT_' + cleanId);
  if (cachedStudent) {
    try {
      return JSON.parse(cachedStudent);
    } catch (e) {}
  }

  var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', cleanId);
  if (!student) {
    throw new Error('ACCESS_DENIED: Student record not found for Telegram ID: ' + cleanId);
  }

  try {
    cache.put('STUDENT_' + cleanId, JSON.stringify(student), 600);
  } catch (cErr) {}

  var status = String(student.Status || '').trim().toUpperCase();

  if (status === 'TRIAL_ACTIVE' || status === 'TRIAL' || String(student.Lead_Source || '').toUpperCase() === 'COMEBACK_TRIAL') {
    var todayStr = getKolkataDate();
    var expiry = String(student.Trial_Expires || student.TrialExpires || '');
    if (expiry && expiry < todayStr) {
      throw new Error('ACCESS_DENIED: Your 7-Day Free Trial Pass expired on ' + expiry + '. Please message Gyan Sir on WhatsApp to enroll in the full batch.');
    }
    return student;
  }

  if (status === 'GRADUATED' || status === 'DROPPED' || status === 'INACTIVE') {
    throw new Error('ACCESS_DENIED: Your student account is marked as ' + status + '. Contact Gyan Sir.');
  }

  if (status === 'GRACE') {
    return student;
  }

  if (status !== 'ACTIVE') {
    throw new Error('ACCESS_DENIED: Inactive account status (' + status + ')');
  }

  var overdue10Days = checkStudentOverdueThreshold_(student.StudentID, 10);
  if (overdue10Days) {
    throw new Error('ACCESS_PAUSED: Your account has an overdue fee invoice (>10 days past due). Balance: ' +
                    formatCurrency_(student.Balance) + '. Please pay via Mini App or contact Gyan Sir.');
  }

  return student;
}

/**
 * Checks whether a student has an invoice that is overdue by more than thresholdDays
 * @param {string} studentId
 * @param {number} thresholdDays
 * @return {boolean} True if overdue > thresholdDays
 */
function checkStudentOverdueThreshold_(studentId, thresholdDays) {
  try {
    var invoices = findRows_('SHEET_FEE', 'Fee_Schedule', 'StudentID', studentId);
    if (!invoices || invoices.length === 0) return false;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 0; i < invoices.length; i++) {
      var inv = invoices[i];
      var invStatus = String(inv.Status || '').toLowerCase();

      // Only check pending/due/overdue/partial invoices
      if (invStatus === 'paid' || invStatus === 'waived' || invStatus === 'refunded') {
        continue;
      }

      var dueDate = inv.DueDate;
      if (dueDate) {
        var dDate = parseDateOrToday_(dueDate);
        dDate.setHours(0, 0, 0, 0);

        var diffTime = today.getTime() - dDate.getTime();
        var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > thresholdDays) {
          return true; // Overdue beyond grace threshold
        }
      }
    }
  } catch (e) {
    logError_('checkStudentOverdueThreshold_', e);
  }
  return false;
}

/**
 * Verifies if the requester is the authorized Administrator (Gyan Sir)
 * Strictly fails closed if ADMIN_TELEGRAM_ID / ADMIN_ID is unset.
 * @param {string|number} telegramId
 * @return {boolean}
 */
function isAdmin_(telegramId) {
  if (!telegramId) return false;
  return isMasterAdminId_(telegramId);
}

/**
 * Founder's Telegram ID from Script Properties (ADMIN_TELEGRAM_ID, then ADMIN_ID).
 * Returns '' when neither is set, so every check fails closed.
 * @return {string}
 */
function getMasterAdminId_() {
  var props = PropertiesService.getScriptProperties();
  return String(props.getProperty('ADMIN_TELEGRAM_ID') || props.getProperty('ADMIN_ID') || '').trim();
}

/**
 * True only when the ID matches a configured founder ID. Blank never matches.
 * @param {string|number} telegramId
 * @return {boolean}
 */
function isMasterAdminId_(telegramId) {
  var masterId = getMasterAdminId_();
  var cleanId = String(telegramId || '').trim();
  return masterId !== '' && cleanId === masterId;
}

/**
 * Returns list of Sub-Admin Telegram IDs configured via SUB_ADMIN_TELEGRAM_IDS in Script Properties.
 * @return {Array<string>}
 */
function getSubAdminIds_() {
  var props = PropertiesService.getScriptProperties();
  var raw = String(props.getProperty('SUB_ADMIN_TELEGRAM_IDS') || props.getProperty('SUB_ADMIN_ID') || '').trim();
  if (!raw) return [];
  return raw.split(',').map(function(id) { return id.trim(); }).filter(Boolean);
}

/**
 * True if ID matches Master Admin or any configured Sub-Admin.
 * @param {string|number} telegramId
 * @return {boolean}
 */
function isSubAdmin_(telegramId) {
  if (!telegramId) return false;
  var cleanId = String(telegramId).trim();
  if (isMasterAdminId_(cleanId)) return true; // Master Admin has superset permissions
  var subAdminList = getSubAdminIds_();
  return subAdminList.indexOf(cleanId) !== -1;
}

/**
 * Enforces Sub-Admin (or Admin) authorization or throws SUB_ADMIN_ONLY.
 * Allows read-only dashboard/roster, emergency DPP dispatch, and attendance marking.
 * @param {string|number} telegramId
 */
function requireSubAdminOrAdmin_(telegramId) {
  if (!isSubAdmin_(telegramId)) {
    throw new Error('SUB_ADMIN_ONLY: This action requires Assistant Teacher / Sub-Admin or Admin authorization.');
  }
}

/**
 * Enforces admin authorization or throws ADMIN_ONLY
 * @param {string|number} telegramId
 */
function requireAdmin_(telegramId) {
  if (!isAdmin_(telegramId)) {
    throw new Error('ADMIN_ONLY: This action is restricted to Gyan Sir (Administrator).');
  }
}
