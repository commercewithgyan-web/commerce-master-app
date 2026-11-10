/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — MAIN ENTRY & ROUTER (Code.gs)
 * Webhook Router, Idempotency Cache, Mini App API Dispatcher,
 * and Top-Level Error Boundary.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Health check endpoint (GET) — Pure status probe, zero parameter inspection, zero key leaks
 */
function doGet(e) {
  return jsonResponse({
    status: 'online',
    service: 'Commerce Gyan Microservices',
    version: '2.0',
    board: 'CBSE Class 11 & 12 Commerce',
    institution: 'Commerce Gyan, Begusarai',
    timestamp: getKolkataTimestamp()
  });
}

/**
 * Primary API & Webhook Dispatcher (POST)
 * Routes either Telegram Webhook updates or Mini App authenticated requests.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Empty request body' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Invalid JSON format: ' + parseErr.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Direct 200 OK for Telegram Webhook (prevents 302 redirect loops & infinite 11-minute retries)
    if (requestData && requestData.update_id) {
      return handleTelegramWebhook_(requestData);
    }

    var result = handleApiRequest(requestData);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logError_('doPost', err);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Routes API requests or Telegram updates
 * @param {Object} req
 * @return {Object}
 */
function handleApiRequest(req) {
  // ROUTE 1: TELEGRAM BOT WEBHOOK (update_id present)
  if (req.update_id) {
    handleTelegramWebhook_(req);
    return { ok: true, status: 'processed_webhook' };
  }

  // ROUTE 2: MINI APP / WEB APP ACTIONS
  var action = req.action;
  if (!action) {
    return { ok: false, error: 'Missing action parameter in request' };
  }

  // Resolve verified user (Supports Telegram signed initData and guest fallback)
  var verifiedUser = resolveVerifiedUser_(req.initData);

  var payload = req.payload || {};
  // Support both nested req.payload and top-level request parameters
  for (var pKey in req) {
    if (pKey !== 'action' && pKey !== 'initData' && pKey !== 'payload' && pKey !== 'setupSecret') {
      if (payload[pKey] === undefined) {
        payload[pKey] = req[pKey];
      }
    }
  }
  var dataResult;

  switch (action) {
    case 'getHomeDashboard':
      dataResult = apiGetHomeDashboard_(verifiedUser);
      break;

    case 'getDailyQuestion':
      dataResult = apiGetDailyQuestion_(verifiedUser, payload);
      break;

    case 'getPracticeQuestions':
      dataResult = handleGetPracticeQuestions_(payload);
      break;

    case 'submitAnswer':
      dataResult = apiSubmitAnswer_(verifiedUser, payload);
      break;

    case 'getNotebook':
      dataResult = apiGetNotebook_(verifiedUser, payload);
      break;

    case 'addNote':
      dataResult = apiAddNote_(verifiedUser, payload);
      break;

    case 'toggleFavourite':
      dataResult = apiToggleFavourite_(verifiedUser, payload);
      break;

    case 'getRevisionQueue':
      dataResult = apiGetRevisionQueue_(verifiedUser);
      break;

    case 'getProgress':
      dataResult = apiGetProgress_(verifiedUser);
      break;

    case 'getFeeDashboard':
      dataResult = apiGetFeeDashboard_(verifiedUser);
      break;

    case 'getReceipt':
      dataResult = apiGetReceipt_(verifiedUser, payload);
      break;

    case 'askDoubt':
      dataResult = apiAskDoubt_(verifiedUser, payload);
      break;

    case 'askVoiceDoubt':
      dataResult = apiAskVoiceDoubt_(verifiedUser, payload);
      break;

    case 'triggerExamPanicSOS':
      dataResult = apiTriggerExamPanicSOS_(verifiedUser);
      break;

    case 'getMystery':
      dataResult = apiGetMystery_(verifiedUser);
      break;

    case 'submitMysteryVerdict':
      dataResult = apiSubmitMysteryVerdict_(verifiedUser, payload);
      break;

    case 'submitRedPenCopy':
    case 'runRedPenAnalysis':
      dataResult = apiSubmitRedPenCopy_(verifiedUser, payload);
      break;

    case 'getBooksDashboard':
      requireAdmin_(verifiedUser && verifiedUser.id);
      dataResult = apiGetBooksDashboard_(verifiedUser);
      break;

    case 'recordExpense':
      requireAdmin_(verifiedUser && verifiedUser.id);
      dataResult = apiRecordExpense_(verifiedUser, payload);
      break;

    case 'getMonthlyPL':
      requireAdmin_(verifiedUser && verifiedUser.id);
      dataResult = apiGetMonthlyPL_(verifiedUser, payload);
      break;

    case 'getBalanceSheet':
      requireAdmin_(verifiedUser && verifiedUser.id);
      dataResult = apiGetBalanceSheet_(verifiedUser, payload);
      break;

    case 'getRatios':
      requireAdmin_(verifiedUser && verifiedUser.id);
      dataResult = apiGetRatios_(verifiedUser, payload);
      break;

    case 'getCashDrawerBalance':
      requireAdmin_(verifiedUser && verifiedUser.id);
      dataResult = apiGetCashDrawerBalance_(verifiedUser);
      break;

    default:
      return { ok: false, error: 'Unknown action: ' + action };
  }

  return {
    ok: true,
    data: dataResult,
    timestamp: getKolkataTimestamp()
  };
}

/**
 * Resolves verified Telegram user object from initData or provides admin fallback
 * @param {string} initData
 * @return {Object} Verified user object
 */
function resolveVerifiedUser_(initData) {
  if (initData && typeof initData === 'string' && initData.indexOf('hash=') !== -1 && initData.indexOf('DEV_MOCK') === -1) {
    try {
      return verifyTelegramInitData_(initData);
    } catch (e) {
      Logger.log('HMAC verification notice: ' + e.message);
    }
  }

  // Fallback for guest student (NEVER admin, NEVER Gyan Sir)
  return {
    id: 'GUEST_STUDENT',
    first_name: 'Student',
    last_name: '',
    username: '',
    classLevel: '12',
    is_admin: false
  };
}

/**
 * Handles Telegram Bot webhook events with deduplication / idempotency
 * @param {Object} update - Telegram Update object
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function handleTelegramWebhook_(update) {
  var updateId = update.update_id;
  var cache = CacheService.getScriptCache();
  var cacheKey = 'tg_update_' + updateId;

  // Law C-6: Webhook Idempotency (prevent duplicate executions on Telegram network retries)
  if (cache.get(cacheKey)) {
    Logger.log('🔁 Duplicate update skipped: ' + updateId);
    return HtmlService.createHtmlOutput('OK');
  }
  cache.put(cacheKey, 'processed', 86400); // 24-HOUR cache TTL (prevents 11-min expiration retry loops!)

  try {
    // Route to telegram.gs update handler
    handleTelegramUpdate_(update);
  } catch (e) {
    logError_('handleTelegramWebhook_[Update ' + updateId + ']', e);
  }

  // Telegram expects direct 200 OK without ContentService redirect
  return HtmlService.createHtmlOutput('OK');
}
