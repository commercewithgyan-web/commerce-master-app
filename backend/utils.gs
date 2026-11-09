/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — BACKEND UTILITIES (utils.gs)
 * Core utility functions: Responses, Logging, Date formatting,
 * Indian currency conversion, and Text chunking.
 * ═══════════════════════════════════════════════════════════════════════
 */

var TIMEZONE_KOLKATA = 'Asia/Kolkata';

/**
 * Resolves the active Gemini model name from Script Properties with fallback to 'gemini-3.5-flash-lite'
 * @return {string}
 */
function getGeminiModel_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
}

/**
 * Builds a JSON HTTP Response output for Web App endpoints
 * @param {Object} data - Response payload object
 * @param {number} [statusCode=200]
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Builds an Error JSON HTTP Response
 * @param {string} message - Error description
 * @param {string} [code='INTERNAL_ERROR']
 * @param {number} [status=500]
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function errorResponse(message, code, status) {
  return jsonResponse({
    ok: false,
    error: message,
    code: code || 'ERROR',
    status: status || 500,
    timestamp: getKolkataTimestamp()
  });
}

/**
 * Logs an error to Sheet 4 (Telegram Delivery) -> Errors tab
 * @param {string} functionName - Function where exception occurred
 * @param {Error|string} error - Caught error or string message
 */
function logError_(functionName, error) {
  try {
    var errorMsg = error.message ? error.message : String(error);
    var stack = error.stack ? error.stack : '';
    Logger.log('❌ ERROR in ' + functionName + ': ' + errorMsg);

    var sheet = getSheet_('SHEET_TG', 'Errors');
    if (sheet) {
      sheet.appendRow([
        getKolkataTimestamp(),
        functionName,
        errorMsg,
        stack,
        '❌'
      ]);
    }
  } catch (e) {
    Logger.log('CRITICAL: Failed to write to Errors tab: ' + e.message);
  }
}

/**
 * Returns formatted timestamp in Asia/Kolkata timezone
 * @param {Date} [d=new Date()]
 * @return {string} Format: dd-MMM-yyyy HH:mm:ss
 */
function getKolkataTimestamp(d) {
  var date = d || new Date();
  return Utilities.formatDate(date, TIMEZONE_KOLKATA, 'dd-MMM-yyyy HH:mm:ss');
}

/**
 * Returns formatted date in Asia/Kolkata timezone
 * @param {Date} [d=new Date()]
 * @return {string} Format: dd-MMM-yyyy
 */
function getKolkataDate(d) {
  var date = d || new Date();
  return Utilities.formatDate(date, TIMEZONE_KOLKATA, 'dd-MMM-yyyy');
}

/**
 * Parses a date or returns current date if invalid
 * @param {string|Date} dateInput
 * @return {Date}
 */
function parseDateOrToday_(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  var parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a number to Indian Rupee representation (e.g. ₹12,50,000)
 * @param {number} amount
 * @return {string}
 */
function formatCurrency_(amount) {
  var val = parseFloat(amount);
  if (isNaN(val)) return '₹0';
  var isNegative = val < 0;
  val = Math.abs(Math.round(val));

  var str = val.toString();
  var lastThree = str.substring(str.length - 3);
  var otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  var res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return (isNegative ? '-₹' : '₹') + res;
}

/**
 * Masks student name for public leaderboards and PDFs (e.g. "Rahul S.")
 * Never exposes full names or Telegram IDs.
 * @param {string} fullName
 * @return {string}
 */
function maskStudentName_(fullName) {
  if (!fullName) return 'Student';
  var parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.';
}

/**
 * Splits text into chunks <= maxLen (default 4000) to adhere to Telegram 4096-char limit
 * @param {string} text
 * @param {number} [maxLen=4000]
 * @return {string[]}
 */
function chunkText_(text, maxLen) {
  maxLen = maxLen || 4000;
  if (!text || text.length <= maxLen) return [text || ''];

  var chunks = [];
  var remaining = text;

  while (remaining.length > maxLen) {
    var splitPos = remaining.lastIndexOf('\n\n', maxLen);
    if (splitPos === -1 || splitPos < maxLen * 0.5) {
      splitPos = remaining.lastIndexOf('\n', maxLen);
    }
    if (splitPos === -1 || splitPos < maxLen * 0.5) {
      splitPos = remaining.lastIndexOf('. ', maxLen);
      if (splitPos !== -1) splitPos += 1;
    }
    if (splitPos === -1 || splitPos < maxLen * 0.3) {
      splitPos = maxLen;
    }

    chunks.push(remaining.substring(0, splitPos).trim());
    remaining = remaining.substring(splitPos).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * Generates an alphanumeric ID with a given prefix (e.g. Q-0042, EXP-0105)
 * @param {string} prefix
 * @param {number} counter
 * @param {number} [padLen=4]
 * @return {string}
 */
function formatId_(prefix, counter, padLen) {
  padLen = padLen || 4;
  var s = counter + '';
  while (s.length < padLen) s = '0' + s;
  return prefix + '-' + s;
}
