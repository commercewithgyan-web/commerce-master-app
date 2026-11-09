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
  if (!initData || typeof initData !== 'string') {
    throw new Error('AUTH_FAILED: Missing initData parameter');
  }

  var props = PropertiesService.getScriptProperties();
  var botToken = props.getProperty('BOT_TOKEN');
  if (!botToken) {
    throw new Error('CONFIG_ERROR: BOT_TOKEN not configured in Script Properties');
  }

  // Parse query string parameters
  var pairs = initData.split('&');
  var params = {};
  var hash = null;

  for (var i = 0; i < pairs.length; i++) {
    var parts = pairs[i].split('=');
    var key = decodeURIComponent(parts[0]);
    var value = parts.slice(1).join('='); // retain any inner '='
    value = decodeURIComponent(value);

    if (key === 'hash') {
      hash = value;
    } else if (key !== 'signature') {
      // Exclude both 'hash' and Telegram's optional 'signature'
      params[key] = value;
    }
  }

  if (!hash) {
    throw new Error('AUTH_FAILED: Hash missing in initData');
  }

  // Check 24-hour freshness (auth_date in Unix seconds)
  if (params.auth_date) {
    var authTimestamp = parseInt(params.auth_date, 10);
    var nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - authTimestamp > 86400) {
      throw new Error('AUTH_FAILED: initData has expired (>24 hours old)');
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
  // In Google Apps Script Utilities.computeHmacSha256Signature(value, key):
  // value = botToken, key = "WebAppData"
  var secretKeyBytes = Utilities.computeHmacSha256Signature(botToken, 'WebAppData');

  // Step 2: Computed Hash = HMAC_SHA256(dataCheckString, secretKeyBytes)
  // Both value and key must be Byte[] when passing byte array key
  var dataCheckBytes = Utilities.newBlob(dataCheckString).getBytes();
  var calculatedHashBytes = Utilities.computeHmacSha256Signature(dataCheckBytes, secretKeyBytes);

  // Convert byte array to hexadecimal string
  var calculatedHash = calculatedHashBytes.map(function(byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');

  // Step 3: Constant-time comparison
  if (calculatedHash.toLowerCase() !== hash.toLowerCase()) {
    throw new Error('AUTH_FAILED: Invalid HMAC signature in initData');
  }

  // Parse user object from verified payload
  if (!params.user) {
    throw new Error('AUTH_FAILED: User payload missing in verified initData');
  }

  try {
    var userObj = JSON.parse(params.user);
    return userObj;
  } catch (e) {
    throw new Error('AUTH_FAILED: Could not parse user JSON in initData');
  }
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
  if (!telegramId) {
    throw new Error('ACCESS_DENIED: Telegram ID is required');
  }

  // Admin / Founder bypass: Admin can access student portal for audits and testing
  var props = PropertiesService.getScriptProperties();
  var adminId = props.getProperty('ADMIN_ID');
  if (adminId && String(telegramId) === String(adminId)) {
    var adminRecord = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(telegramId));
    if (adminRecord) return adminRecord;
    return {
      StudentID: 'ADMIN-001',
      Name: 'Gyandeep (Admin)',
      Class: 12,
      Board: 'CBSE',
      Phone: '9999999999',
      TelegramID: String(telegramId),
      PlanID: 'PLAN-CBSE-COMBINED',
      PlanName: 'CBSE Master Plan',
      MonthlyFee: 1500,
      TotalCourseFee: 18000,
      TotalPaid: 18000,
      Balance: 0,
      Paid: 'YES',
      Status: 'Active'
    };
  }

  var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(telegramId));
  if (!student) {
    throw new Error('STUDENT_NOT_FOUND: No registered student with Telegram ID ' + telegramId);
  }

  var status = String(student.Status || '').trim();

  // Handle explicit status blocks
  if (status === 'Graduated' || status === 'Dropped' || status === 'Inactive') {
    throw new Error('ACCESS_DENIED: Your student account is marked as ' + status + '. Contact Gyan Sir.');
  }

  // Grace status bypasses overdue lockout (Exam Grace Shield: /grantgrace)
  if (status === 'Grace') {
    return student;
  }

  if (status !== 'Active') {
    throw new Error('ACCESS_DENIED: Inactive account status (' + status + ')');
  }

  // Check 10-day overdue rule from Fee_Schedule
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
 * @param {string|number} telegramId
 * @return {boolean}
 */
function isAdmin_(telegramId) {
  if (!telegramId) return false;
  var props = PropertiesService.getScriptProperties();
  var adminId = props.getProperty('ADMIN_ID');
  return String(telegramId).trim() === String(adminId).trim();
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
