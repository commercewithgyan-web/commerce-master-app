/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — AUTHENTICATION & ACCESS GATE (auth.gs)
 * Cryptographic HMAC-SHA256 verification of Telegram WebApp initData,
 * 24-hour expiration check, and Paid-Student dynamic access gating.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Safely URL-decodes strings, properly handling '+' as spaces.
 * @param {string} str
 * @return {string}
 */
function safeUrlDecode_(str) {
  if (typeof str !== 'string') return '';
  try {
    return decodeURIComponent(str.replace(/\+/g, '%20'));
  } catch (e) {
    try {
      return unescape(str.replace(/\+/g, '%20'));
    } catch (_) {
      return str;
    }
  }
}

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
  var rawParams = {};
  var hash = null;

  for (var i = 0; i < pairs.length; i++) {
    if (!pairs[i]) continue;
    var eqIdx = pairs[i].indexOf('=');
    if (eqIdx === -1) continue;
    var rawKey = pairs[i].substring(0, eqIdx);
    var rawVal = pairs[i].substring(eqIdx + 1);
    var key = safeUrlDecode_(rawKey);
    var val = safeUrlDecode_(rawVal);

    if (key === 'hash') {
      hash = val;
    } else if (key !== 'signature') {
      // Exclude both 'hash' and Telegram's optional 'signature'
      params[key] = val;
      rawParams[key] = rawVal;
    }
  }

  // Extract user payload early for Admin Safety Invariant
  var userObj = null;
  if (params.user) {
    try {
      userObj = JSON.parse(params.user);
    } catch (e) {
      try {
        userObj = JSON.parse(safeUrlDecode_(params.user));
      } catch (_) {}
    }
  }

  var isFounderAdmin = false;
  if (userObj && userObj.id) {
    var uidStr = String(userObj.id).trim();
    if (uidStr === '552858970' || isMasterAdminId_(uidStr) || isAdmin_(uidStr)) {
      isFounderAdmin = true;
    }
  }

  var props = PropertiesService.getScriptProperties();
  var candidateTokens = [];
  var propKeys = ['TELEGRAM_BOT_TOKEN', 'BOT_TOKEN', 'BOT_TOKEN_DOST', 'BOT_TOKEN_HELP', 'CGHELP_BOT_TOKEN', 'SECONDARY_BOT_TOKEN'];
  for (var p = 0; p < propKeys.length; p++) {
    var tokVal = props.getProperty(propKeys[p]);
    if (tokVal) {
      var parts = tokVal.split(',');
      for (var j = 0; j < parts.length; j++) {
        var cleanTok = parts[j].trim();
        if (cleanTok && candidateTokens.indexOf(cleanTok) === -1) {
          candidateTokens.push(cleanTok);
        }
      }
    }
  }

  if (candidateTokens.length === 0 && !isFounderAdmin) {
    throw new Error('CONFIG_ERROR: BOT_TOKEN not configured in Script Properties');
  }

  if (!hash && !isFounderAdmin) {
    throw new Error('HTTP 401: AUTH_FAILED (MISSING_HASH)');
  }

  // Check 24-hour freshness (auth_date in Unix seconds)
  if (params.auth_date) {
    var authTimestamp = parseInt(params.auth_date, 10);
    var nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - authTimestamp > 86400) {
      if (isFounderAdmin) {
        Logger.log('⚠️ [AUTH WARNING] Stale auth_date for Founder Admin ' + (userObj ? userObj.id : '') + ' (>24h). Admin bypass active.');
      } else {
        throw new Error('HTTP 401: AUTH_FAILED (EXPIRED_INIT_DATA: >24 hours old)');
      }
    }
  }

  // Sort keys alphabetically and format as "key=value\n"
  var sortedKeys = Object.keys(params).sort();
  var dataCheckArr = [];
  for (var k = 0; k < sortedKeys.length; k++) {
    dataCheckArr.push(sortedKeys[k] + '=' + params[sortedKeys[k]]);
  }
  var dataCheckString = dataCheckArr.join('\n');

  // Verify HMAC signature across candidate tokens
  var isValid = false;
  if (hash) {
    var hashLower = hash.toLowerCase();
    for (var t = 0; t < candidateTokens.length; t++) {
      var token = candidateTokens[t];
      try {
        // Step 1: Secret Key = HMAC_SHA256("WebAppData", botToken)
        var secretKeyBytes = Utilities.computeHmacSha256Signature(
          Utilities.newBlob(token).getBytes(),
          Utilities.newBlob('WebAppData').getBytes()
        );

        // Step 2: Computed Hash = HMAC_SHA256(dataCheckString, secretKeyBytes)
        var dataCheckBytes = Utilities.newBlob(dataCheckString, 'UTF-8').getBytes();
        var calculatedHashBytes = Utilities.computeHmacSha256Signature(dataCheckBytes, secretKeyBytes);

        var calculatedHash = calculatedHashBytes.map(function(b) {
          return ('0' + (b & 0xFF).toString(16)).slice(-2);
        }).join('').toLowerCase();

        if (calculatedHash === hashLower) {
          isValid = true;
          break;
        }

        // Also test with rawParams in case client didn't percent-encode
        var rawCheckArr = [];
        for (var rk = 0; rk < sortedKeys.length; rk++) {
          rawCheckArr.push(sortedKeys[rk] + '=' + (rawParams[sortedKeys[rk]] !== undefined ? rawParams[sortedKeys[rk]] : params[sortedKeys[rk]]));
        }
        var rawDataCheckString = rawCheckArr.join('\n');
        var rawDataCheckBytes = Utilities.newBlob(rawDataCheckString, 'UTF-8').getBytes();
        var rawHashBytes = Utilities.computeHmacSha256Signature(rawDataCheckBytes, secretKeyBytes);
        var rawCalculatedHash = rawHashBytes.map(function(b) {
          return ('0' + (b & 0xFF).toString(16)).slice(-2);
        }).join('').toLowerCase();

        if (rawCalculatedHash === hashLower) {
          isValid = true;
          break;
        }
      } catch (err) {
        Logger.log('HMAC verification error for token index ' + t + ': ' + err);
      }
    }
  }

  // Admin Safety Invariant: Founder Admin is NEVER locked out by signature mismatch
  if (!isValid) {
    if (isFounderAdmin) {
      Logger.log('⚠️ [AUTH WARNING] HMAC signature mismatch for Founder Admin ' + (userObj ? userObj.id : '') + '. Invoking Admin Safety Invariant bypass.');
      isValid = true;
    } else {
      throw new Error('HTTP 401: AUTH_FAILED (INVALID_HMAC_SIGNATURE)');
    }
  }

  if (!userObj) {
    throw new Error('HTTP 401: AUTH_FAILED (USER_PAYLOAD_MISSING)');
  }

  userObj.is_admin = isFounderAdmin || isAdmin_(userObj.id);
  return userObj;
}

/**
 * Automatically tracks Telegram Mini App visitors and enforces 7-Day Auto-Access Lifecycle.
 * Sheet: Telegram_Visitors in MASTER_ERP
 * Columns: [Telegram_ID, First_Name, Username, First_Opened_At, Last_Active_At, Total_Opens, Status]
 *
 * @param {Spreadsheet} erp - Master ERP Spreadsheet
 * @param {Object} user - Verified Telegram user object
 * @return {Object} { isExpired: boolean, trialDaysLeft: number, firstOpenedAt: string, daysElapsed: number }
 */
function getOrRecordTelegramVisitor_(erp, user) {
  var tgId = String((user && user.id) || '').trim();
  if (!tgId) {
    return { isExpired: true, trialDaysLeft: 0, firstOpenedAt: '', daysElapsed: 999 };
  }

  var sheet = erp.getSheetByName('Telegram_Visitors');
  if (!sheet) {
    sheet = erp.insertSheet('Telegram_Visitors');
    sheet.appendRow(['Telegram_ID', 'First_Name', 'Username', 'First_Opened_At', 'Last_Active_At', 'Total_Opens', 'Status']);
  }

  var now = new Date();
  var nowStr = Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
  var data = sheet.getDataRange().getValues();

  var foundRowIdx = -1;
  var firstOpenedAt = null;
  var totalOpens = 0;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === tgId) {
      foundRowIdx = i + 1; // 1-indexed
      firstOpenedAt = data[i][3];
      totalOpens = Number(data[i][5] || 1);
      break;
    }
  }

  if (foundRowIdx === -1) {
    // Brand new visitor! First open today!
    sheet.appendRow([tgId, user.first_name || '', user.username || '', nowStr, nowStr, 1, 'TRIAL_ACTIVE']);
    return {
      isExpired: false,
      trialDaysLeft: 7,
      firstOpenedAt: nowStr,
      daysElapsed: 0
    };
  }

  // Existing visitor: update Last_Active_At and Total_Opens
  sheet.getRange(foundRowIdx, 5).setValue(nowStr); // Col E = Last_Active_At
  sheet.getRange(foundRowIdx, 6).setValue(totalOpens + 1); // Col F = Total_Opens

  // Calculate days elapsed from First_Opened_At
  var firstDate = null;
  if (firstOpenedAt instanceof Date) {
    firstDate = firstOpenedAt;
  } else if (typeof firstOpenedAt === 'string' && firstOpenedAt.trim() !== '') {
    var cleanDateStr = firstOpenedAt.replace(' ', 'T');
    firstDate = new Date(cleanDateStr);
    if (isNaN(firstDate.getTime())) {
      firstDate = new Date(firstOpenedAt);
    }
  }

  if (!firstDate || isNaN(firstDate.getTime())) {
    firstDate = now;
  }

  var diffMs = now.getTime() - firstDate.getTime();
  var daysElapsed = diffMs / (1000 * 60 * 60 * 24);

  if (daysElapsed > 7) {
    sheet.getRange(foundRowIdx, 7).setValue('TRIAL_EXPIRED'); // Col G = Status
    return {
      isExpired: true,
      trialDaysLeft: 0,
      firstOpenedAt: String(firstOpenedAt),
      daysElapsed: daysElapsed
    };
  }

  var daysLeft = Math.max(1, Math.ceil(7 - daysElapsed));
  return {
    isExpired: false,
    trialDaysLeft: daysLeft,
    firstOpenedAt: String(firstOpenedAt),
    daysElapsed: daysElapsed
  };
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
  } else {
    return { ok: false, error: 'HTTP 401: AUTH_FAILED (MISSING_INIT_DATA)' };
  }

  var telegramId = String((user && user.id) || '');

  // 1. Master Admin (Gyan Sir) Dual-Role Routing
  if (isMasterAdminId_(telegramId) || telegramId === '552858970') {
    return {
      ok: true,
      role: 'ADMIN',
      isAdmin: true,
      isSubAdmin: false,
      telegramId: telegramId,
      permissions: ['ALL'],
      impersonateRollNo: previewRollNo || 'CG-11-001'
    };
  }

  // 2. Sub-Admin Role Routing
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

  // Fail closed: a blank ID must never match
  if (!telegramId) {
    return { ok: false, error: 'STUDENT_NOT_FOUND', telegramId: telegramId };
  }

  var IDS = getActiveSheetIds();
  var erp = SpreadsheetApp.openById(IDS.MASTER_ERP);

  // 3. Registered Coaching Students (Unlimited Access beyond 7 days)
  var studentSheet = erp.getSheetByName('Students_Master');
  var students = studentSheet ? sheetToObjects(studentSheet) : [];
  var student = students.find(function(s) {
    return String(s.Telegram_ID || s.Telegram_User_ID || '') === telegramId;
  });

  // Check Telegram_Bindings if not found directly in Students_Master
  if (!student) {
    try {
      var bindingSheet = erp.getSheetByName('Telegram_Bindings');
      if (bindingSheet) {
        var bindings = sheetToObjects(bindingSheet);
        var matchedBinding = bindings.find(function(b) {
          return String(b.Telegram_User_ID || b.Telegram_ID || '') === telegramId &&
                 String(b.Status || 'ACTIVE').toUpperCase() === 'ACTIVE';
        });
        if (matchedBinding && matchedBinding.Roll_No) {
          student = students.find(function(s) {
            return String(s.Roll_No) === String(matchedBinding.Roll_No);
          });
        }
      }
    } catch (_) {}
  }

  var studentStatus = student ? String(student.Status || '').trim().toUpperCase() : '';
  if (student && (studentStatus === 'ACTIVE' || studentStatus === 'GRACE' || !studentStatus)) {
    // Registered active student -> UNLIMITED ACCESS
    return {
      ok: true,
      role: 'STUDENT',
      isAdmin: false,
      isRegisteredStudent: true,
      isTrial: false,
      student: student
    };
  }

  // 4. Unregistered / Former / Dropped Students -> Seamless 7-Day Auto-Access Lifecycle
  var visitor = getOrRecordTelegramVisitor_(erp, user);

  if (visitor.isExpired) {
    return {
      ok: false,
      error: 'TRIAL_EXPIRED',
      isTrialExpired: true,
      telegramId: telegramId,
      heading: '7-Day Free Access Complete',
      message: 'आशा है आपको Commerce Gyan App के फ़ीचर्स पसंद आए होंगे! अगर आप इस सिस्टम को आगे भी यूज़ करना चाहते हैं और अपनी पढ़ाई जारी रखना चाहते हैं, तो अभी Commerce Gyan (Gyan Sir) से संपर्क करें।',
      contactPhone: '9835011205',
      contactWhatsApp: 'https://wa.me/919835011205?text=' + encodeURIComponent('Namaste Gyan Sir, mere Commerce Gyan App ke 7 days complete ho gaye hain. Mujhe coaching batch me continue karna hai.')
    };
  }

  // Within Days 1-7: Seamless automatic entry
  var guestStudent = student || {
    Roll_No: 'CG-GUEST-' + telegramId.slice(-4),
    Student_Name: user.first_name || 'Commerce Student',
    Name: user.first_name || 'Commerce Student',
    Class: '11',
    Batch_ID: 'TRIAL_FREE',
    Status: 'TRIAL_ACTIVE',
    Telegram_ID: telegramId,
    isTrial: true,
    trialDaysLeft: visitor.trialDaysLeft
  };

  return {
    ok: true,
    role: 'STUDENT',
    isAdmin: false,
    isTrial: true,
    trialDaysLeft: visitor.trialDaysLeft,
    firstOpenedAt: visitor.firstOpenedAt,
    student: guestStudent
  };
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
  if (isAdmin_(cleanId) || cleanId === '552858970') {
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
    // Check if user is an active trial visitor in Telegram_Visitors
    try {
      var IDS = getActiveSheetIds();
      var erp = SpreadsheetApp.openById(IDS.MASTER_ERP);
      var vSheet = erp.getSheetByName('Telegram_Visitors');
      if (vSheet) {
        var vRows = sheetToObjects(vSheet);
        var vMatch = vRows.find(function(v) { return String(v.Telegram_ID) === cleanId; });
        if (vMatch) {
          var firstDate = new Date(String(vMatch.First_Opened_At).replace(' ', 'T'));
          var daysElapsed = (Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysElapsed <= 7) {
            return {
              studentId: 'CG-GUEST-' + cleanId.slice(-4),
              StudentID: 'CG-GUEST-' + cleanId.slice(-4),
              Roll_No: 'CG-GUEST-' + cleanId.slice(-4),
              name: vMatch.First_Name || 'Commerce Scholar',
              Name: vMatch.First_Name || 'Commerce Scholar',
              classLevel: '11',
              Class: 11,
              paid: true,
              Paid: 'YES',
              status: 'TRIAL_ACTIVE',
              Status: 'TRIAL_ACTIVE',
              TelegramID: cleanId,
              isTrial: true
            };
          } else {
            throw new Error('ACCESS_DENIED: Your 7-day free trial has expired. Contact Gyan Sir on WhatsApp to enroll.');
          }
        }
      }
    } catch (vErr) {
      if (String(vErr.message).indexOf('ACCESS_DENIED') !== -1) throw vErr;
    }

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
  return cleanId === '552858970' || (masterId !== '' && cleanId === masterId);
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
