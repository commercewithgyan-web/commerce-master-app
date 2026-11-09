/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — MAIN ENTRY & ROUTER (Code.gs)
 * Webhook Router, Idempotency Cache, Mini App API Dispatcher,
 * and Top-Level Error Boundary.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Health check endpoint (GET) — Law C-2: GET performs zero state mutations
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.setupSecret === 'CG_SETUP_TOKEN_Begusarai_2026') {
    var props = PropertiesService.getScriptProperties();
    return jsonResponse({
      ok: true,
      keys: props.getKeys(),
      timestamp: getKolkataTimestamp()
    });
  }

  return jsonResponse({
    status: 'ok',
    service: 'Commerce Master App Microservices',
    version: '2.3',
    board: 'CBSE Class 11 & 12 Commerce',
    institution: 'Commerce Gyan',
    timestamp: getKolkataTimestamp()
  });
}

/**
 * Primary API & Webhook Dispatcher (POST)
 * Routes either Telegram Webhook updates, Mini App authenticated requests,
 * or secure system setup requests.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse('Empty request body', 'BAD_REQUEST', 400);
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return errorResponse('Invalid JSON format', 'MALFORMED_JSON', 400);
    }

    // ─────────────────────────────────────────────────────────────────
    // ROUTE 0: SECURE SYSTEM SETUP DISPATCHER
    // ─────────────────────────────────────────────────────────────────
    if (body.setupSecret === 'CG_SETUP_TOKEN_Begusarai_2026' && body.action === 'setScriptProperties') {
      var props = PropertiesService.getScriptProperties();
      if (body.properties && typeof body.properties === 'object') {
        for (var k in body.properties) {
          props.setProperty(k, String(body.properties[k]));
        }
      }
      return jsonResponse({
        ok: true,
        savedKeys: Object.keys(body.properties || {}),
        allKeys: props.getKeys()
      });
    }

    // ─────────────────────────────────────────────────────────────────
    // ROUTE 1: TELEGRAM BOT WEBHOOK (update_id present)
    // ─────────────────────────────────────────────────────────────────
    if (body.update_id) {
      return handleTelegramWebhook_(body);
    }

    // ─────────────────────────────────────────────────────────────────
    // ROUTE 2: TELEGRAM MINI APP API (initData present)
    // ─────────────────────────────────────────────────────────────────
    if (body.initData && body.action) {
      return handleMiniAppRequest_(body);
    }

    // Unrecognized payload structure
    return errorResponse('Unrecognized request format. Expected Telegram update or Mini App action.', 'BAD_REQUEST', 400);

  } catch (err) {
    logError_('doPost', err);
    return errorResponse(err.message || 'Internal Server Error', 'INTERNAL_ERROR', 500);
  }
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
  cache.put(cacheKey, 'processed', 600); // 10-minute cache TTL

  try {
    // Route to telegram.gs update handler
    handleTelegramUpdate_(update);
  } catch (e) {
    logError_('handleTelegramWebhook_[Update ' + updateId + ']', e);
  }

  // Telegram expects direct 200 OK without ContentService redirect
  return HtmlService.createHtmlOutput('OK');
}

/**
 * Handles authenticated API calls from Telegram Mini App
 * @param {Object} req - { initData, action, payload }
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function handleMiniAppRequest_(req) {
  var initData = req.initData;
  var action = req.action;
  var payload = req.payload || {};

  // 1. Verify Telegram initData via HMAC-SHA256 (Law C-1)
  var verifiedUser = verifyTelegramInitData_(initData);
  var telegramId = verifiedUser.id;

  Logger.log('📱 Mini App API Call: ' + action + ' by User: ' + telegramId + ' (' + verifiedUser.first_name + ')');

  // 2. Dispatch to specific module handlers
  var result;
  switch (action) {

    // ── DASHBOARD & HOME ──
    case 'getHomeDashboard':
      result = apiGetHomeDashboard_(verifiedUser);
      break;

    // ── QUESTION & GHOST CHALLENGE (MCQ) ──
    case 'getDailyQuestion':
      result = apiGetDailyQuestion_(verifiedUser, payload);
      break;

    case 'submitAnswer':
      result = apiSubmitAnswer_(verifiedUser, payload);
      break;

    // ── PERSONAL NOTEBOOK (5 LAYERS) ──
    case 'getNotebook':
      result = apiGetNotebook_(verifiedUser, payload);
      break;

    case 'addNote':
      result = apiAddNote_(verifiedUser, payload);
      break;

    case 'toggleFavourite':
      result = apiToggleFavourite_(verifiedUser, payload);
      break;

    case 'getRevisionQueue':
      result = apiGetRevisionQueue_(verifiedUser);
      break;

    // ── PROGRESS & HEATMAP ──
    case 'getProgress':
      result = apiGetProgress_(verifiedUser);
      break;

    // ── FEE MANAGEMENT (STUDENT PORTAL) ──
    case 'getFeeDashboard':
      result = apiGetFeeDashboard_(verifiedUser);
      break;

    case 'getReceipt':
      result = apiGetReceipt_(verifiedUser, payload);
      break;

    // ── AI DOUBT SOLVER ──
    case 'askDoubt':
      result = apiAskDoubt_(verifiedUser, payload);
      break;

    case 'askVoiceDoubt':
      result = apiAskVoiceDoubt_(verifiedUser, payload);
      break;

    // ── WOW DELIGHT MODULES ──
    case 'triggerExamPanicSOS':
      result = apiTriggerExamPanicSOS_(verifiedUser);
      break;

    case 'getMystery':
      result = apiGetMystery_(verifiedUser);
      break;

    case 'submitMysteryVerdict':
      result = apiSubmitMysteryVerdict_(verifiedUser, payload);
      break;

    case 'submitRedPenCopy':
      result = apiSubmitRedPenCopy_(verifiedUser, payload);
      break;

    // ── ADMIN: BOOKS & EXPENSES ──
    case 'getBooksDashboard':
      requireAdmin_(telegramId);
      result = apiGetBooksDashboard_();
      break;

    case 'recordExpense':
      requireAdmin_(telegramId);
      result = apiRecordExpense_(payload);
      break;

    case 'getMonthlyPL':
      requireAdmin_(telegramId);
      result = apiGetMonthlyPL_(payload);
      break;

    case 'getBalanceSheet':
      requireAdmin_(telegramId);
      result = apiGetBalanceSheet_(payload);
      break;

    case 'getRatios':
      requireAdmin_(telegramId);
      result = apiGetRatios_(payload);
      break;

    case 'getCashDrawerBalance':
      requireAdmin_(telegramId);
      result = apiGetCashDrawerBalance_();
      break;

    default:
      return errorResponse('Unknown API action: ' + action, 'ACTION_NOT_FOUND', 404);
  }

  return jsonResponse({
    ok: true,
    data: result,
    timestamp: getKolkataTimestamp()
  });
}
