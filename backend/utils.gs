/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — BACKEND UTILITIES (utils.gs)
 * Core utility functions: Responses, Logging, Date formatting,
 * Indian currency conversion, and Text chunking.
 * ═══════════════════════════════════════════════════════════════════════
 */

var TIMEZONE_KOLKATA = 'Asia/Kolkata';

/**
 * Resolves the active Gemini model name from Script Properties with fallback to 'gemini-3.0-flash'
 * @return {string}
 */
function getGeminiModel_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('GEMINI_MODEL') || 'gemini-1.5-flash';
}

/**
 * Returns the model names (without "models/" prefix) that support generateContent,
 * from the Gemini models.list API. Cached 6 h. Returns [] if the list cannot be fetched.
 * @param {string} apiKey
 * @return {string[]}
 */
function getVerifiedGeminiModels_(apiKey) {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'CG_VERIFIED_GEMINI_MODELS_V1';
  try {
    var hit = cache.get(cacheKey);
    if (hit) return JSON.parse(hit);
  } catch (_) {}
  var names = [];
  try {
    var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=' + apiKey, {
      method: 'get',
      muteHttpExceptions: true
    });
    if (res.getResponseCode() === 200) {
      var list = (JSON.parse(res.getContentText()).models) || [];
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        var methods = m.supportedGenerationMethods || [];
        if (methods.indexOf('generateContent') !== -1) {
          names.push(String(m.name || '').replace(/^models\//, ''));
        }
      }
    }
  } catch (e) {
    Logger.log('getVerifiedGeminiModels_ failed: ' + e.message);
  }
  if (names.length) {
    try { cache.put(cacheKey, JSON.stringify(names), 21600); } catch (_) {}
  }
  return names;
}

/** Clears the cached verified-model list (run manually after changing models). */
function clearGeminiModelCache_() {
  CacheService.getScriptCache().remove('CG_VERIFIED_GEMINI_MODELS_V1');
}

/**
 * Returns a copy of payload; adds thinkingBudget:0 only for models known to accept it
 * (gemini-2.5-flash / flash-lite). Pro and unknown models are left untouched.
 */
function geminiPayloadForModel_(payload, model, withThinkingOff) {
  var copy = JSON.parse(JSON.stringify(payload));
  if (withThinkingOff && /^gemini-2\.5-flash/.test(model)) {
    copy.generationConfig = copy.generationConfig || {};
    copy.generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }
  return copy;
}

/**
 * Executes a Gemini API generateContent call across candidate models with fallback.
 * UrlFetchApp has no per-call timeout, so the budget is checked between attempts and
 * the attempt count is kept small. Fast models first; pro models only if opts.allowPro.
 *
 * @param {Object} payload - Gemini request payload { contents: [...], generationConfig: {...} }
 * @param {Object} [opts] - { maxAttempts (default 2), budgetMs (default 16000), allowPro (default false) }
 * @return {Object} Parsed JSON response from Gemini API
 */
function callGeminiGenerateContent_(payload, opts) {
  opts = opts || {};
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty("GEMINI_KEY") || props.getProperty("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_KEY missing in Script Properties");

  var MAX_ATTEMPTS = opts.maxAttempts || 2;
  var BUDGET_MS = opts.budgetMs || 16000;
  var startedAt = Date.now();

  var preferred = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
  ];
  var proModels = ["gemini-2.5-pro", "gemini-pro-latest"];
  var customModel = props.getProperty("GEMINI_MODEL");

  var ordered = [];
  if (customModel) ordered.push(customModel);
  preferred.forEach(function (m) { if (ordered.indexOf(m) === -1) ordered.push(m); });
  if (opts.allowPro) proModels.forEach(function (m) { if (ordered.indexOf(m) === -1) ordered.push(m); });

  // Keep only models the API really lists (if the list is unavailable, try them as-is).
  var verified = getVerifiedGeminiModels_(apiKey);
  var candidateModels = ordered;
  if (verified.length) {
    candidateModels = ordered.filter(function (m) { return verified.indexOf(m) !== -1; });
    if (!candidateModels.length) candidateModels = ordered;
  }

  var errorLogs = [];
  for (var i = 0; i < candidateModels.length; i++) {
    if (i >= MAX_ATTEMPTS || (Date.now() - startedAt) > BUDGET_MS) {
      errorLogs.push("Gemini time budget exceeded after " + Math.round((Date.now() - startedAt) / 1000) + "s (" + i + " attempts)");
      break;
    }
    var model = candidateModels[i];
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
    var thinkingOff = true;
    for (var pass = 0; pass < 2; pass++) {
      try {
        var response = UrlFetchApp.fetch(url, {
          method: "POST",
          contentType: "application/json",
          payload: JSON.stringify(geminiPayloadForModel_(payload, model, thinkingOff)),
          muteHttpExceptions: true
        });
        var resCode = response.getResponseCode();
        var resText = response.getContentText();

        if (resCode === 200) {
          return JSON.parse(resText);
        }
        // thinkingConfig rejected -> retry the same model once without it
        if (resCode === 400 && thinkingOff && /thinking/i.test(resText)) {
          thinkingOff = false;
          continue;
        }
        errorLogs.push("Model " + model + " error " + resCode + ": " + resText.slice(0, 160));
        if (resCode === 429 || resCode === 503) Utilities.sleep(800);
      } catch (e) {
        errorLogs.push("Model " + model + " exception: " + e.message);
      }
      break;
    }
  }
  throw new Error("Gemini API failed across candidate models:\n" + errorLogs.join("\n"));
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
 * Safely parses any date string, Google Sheets serial number, or Date instance into Date
 * Robustly parses Indian 'dd/MM/yyyy', 'dd-MM-yyyy', and ISO formats.
 * @param {string|number|Date} dateInput
 * @return {Date}
 */
function parseDateOrToday_(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  // Handle Google Sheets numeric serial dates (e.g. 46334)
  if (typeof dateInput === 'number' && !isNaN(dateInput)) {
    return new Date((dateInput - 25569) * 86400 * 1000);
  }

  var str = String(dateInput).trim();
  if (!str) return new Date();

  // Handle dd/MM/yyyy or dd-MM-yyyy format
  var dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    var day = parseInt(dmyMatch[1], 10);
    var month = parseInt(dmyMatch[2], 10) - 1;
    var year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }

  // Handle yyyy-MM-dd format
  var ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    var y = parseInt(ymdMatch[1], 10);
    var m = parseInt(ymdMatch[2], 10) - 1;
    var d = parseInt(ymdMatch[3], 10);
    return new Date(y, m, d);
  }

  var parsed = new Date(str);
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
