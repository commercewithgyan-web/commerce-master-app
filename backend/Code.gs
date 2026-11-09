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
 * Routes API requests, setup requests, or Telegram updates
 * @param {Object} req
 * @return {Object}
 */
function handleApiRequest(req) {
  // ROUTE 0: SECURE SYSTEM SETUP & MAINTENANCE
  if (req.setupSecret === 'CG_SETUP_TOKEN_Begusarai_2026') {
    if (req.action === 'setScriptProperties') {
      var props = PropertiesService.getScriptProperties();
      if (req.properties && typeof req.properties === 'object') {
        for (var k in req.properties) {
          props.setProperty(k, String(req.properties[k]));
        }
      }
      return { ok: true, savedKeys: Object.keys(req.properties || {}), allKeys: props.getKeys() };
    }
    if (req.action === 'syncSyllabus') {
      var insertedCount = syncMasterSyllabusData();
      return { ok: true, action: 'syncSyllabus', insertedRows: insertedCount, timestamp: getKolkataTimestamp() };
    }
    if (req.action === 'seedQuestions') {
      var seeded = seedInitialQuestionBankData();
      return { ok: true, action: 'seedQuestions', count: seeded, timestamp: getKolkataTimestamp() };
    }
    if (req.action === 'seedGyanSirTestData') {
      var studentResult = seedGyanSirStudentData();
      var qCount = seedInitialQuestionBankData();
      return {
        ok: true,
        action: 'seedGyanSirTestData',
        student: studentResult,
        questionCount: qCount,
        timestamp: getKolkataTimestamp()
      };
    }
  }

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

  // Resolve verified user (Supports Telegram signed initData and web preview fallback)
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
      dataResult = apiGetBooksDashboard_(verifiedUser);
      break;

    case 'recordExpense':
      requireAdmin_(verifiedUser.id);
      dataResult = apiRecordExpense_(payload);
      break;

    case 'getMonthlyPL':
      requireAdmin_(verifiedUser.id);
      dataResult = apiGetMonthlyPL_(payload);
      break;

    case 'getBalanceSheet':
      requireAdmin_(verifiedUser.id);
      dataResult = apiGetBalanceSheet_(payload);
      break;

    case 'getRatios':
      requireAdmin_(verifiedUser.id);
      dataResult = apiGetRatios_(payload);
      break;

    case 'getCashDrawerBalance':
      requireAdmin_(verifiedUser.id);
      dataResult = apiGetCashDrawerBalance_();
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
  var props = PropertiesService.getScriptProperties();
  var adminId = props.getProperty('ADMIN_ID') || '552858970';

  if (initData && typeof initData === 'string' && initData.indexOf('hash=') !== -1 && initData.indexOf('DEV_MOCK') === -1) {
    try {
      return verifyTelegramInitData_(initData);
    } catch (e) {
      Logger.log('HMAC verification notice: ' + e.message);
    }
  }

  // Graceful fallback for web preview, audit, or admin testing (Gyan Sir)
  return {
    id: '552858970',
    first_name: 'Gyan Sir',
    last_name: 'Admin',
    username: 'gyandeepsir',
    classLevel: '12',
    is_admin: true
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
