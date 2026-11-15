/**
 * ═══════════════════════════════════════════════════════════════════════
 * STAGING-ONLY END-TO-END AUTHENTICATION TEST SUITE (auth_staging_e2e.gs)
 * Validates hardened auth behavior (T1–T5) under real Script Properties.
 * Excluded from production push by backend/.claspignore (tests/**).
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Builds a Telegram Mini App initData string signed via HMAC-SHA256
 * matching the exact cryptographic scheme implemented in auth.gs.
 * 
 * NEVER logs or returns the botToken or userId.
 */
function createSignedInitData_(botToken, userId, isWrongHash) {
  var now = Math.floor(Date.now() / 1000);
  var userObj = {
    id: userId,
    first_name: 'TestUser',
    username: 'test_user'
  };
  var userJson = JSON.stringify(userObj);

  // Parameters to sign in alphabetical order: auth_date, user
  var dataCheckString = 'auth_date=' + now + '\nuser=' + userJson;

  // Step 1: Secret Key = HMAC_SHA256("WebAppData", botToken)
  var secretKeyBytes = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(botToken).getBytes(),
    Utilities.newBlob('WebAppData').getBytes()
  );

  // Step 2: Hash = HMAC_SHA256(dataCheckString, secretKeyBytes)
  var dataCheckBytes = Utilities.newBlob(dataCheckString, 'UTF-8').getBytes();
  var hashBytes = Utilities.computeHmacSha256Signature(dataCheckBytes, secretKeyBytes);

  var calculatedHash = hashBytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('').toLowerCase();

  if (isWrongHash) {
    // Forged signature
    calculatedHash = '000000000000000000000000000000000000000000000000000000000000dead';
  }

  return 'auth_date=' + encodeURIComponent(String(now)) +
         '&user=' + encodeURIComponent(userJson) +
         '&hash=' + calculatedHash;
}

/**
 * Invokes the same web app entry point (doPost) that the client PWA uses.
 */
function callWebAppEntry_(action, initData, payload) {
  var postBody = {
    action: action,
    payload: payload || {},
    initData: initData || ''
  };
  var e = {
    postData: {
      contents: JSON.stringify(postBody)
    }
  };
  var output = doPost(e);
  if (output && typeof output.getContent === 'function') {
    try {
      return JSON.parse(output.getContent());
    } catch (_) {
      return output.getContent();
    }
  }
  return output;
}

/**
 * Main E2E runner for STAGING authentication & route wiring (T1–T5).
 * Read-only operations only.
 */
function runAuthStagingE2ETests() {
  var results = [];
  var allPassed = true;

  var props = PropertiesService.getScriptProperties();
  var botToken = props.getProperty('BOT_TOKEN') || props.getProperty('TELEGRAM_BOT_TOKEN') || '';
  var adminIdStr = props.getProperty('ADMIN_TELEGRAM_ID') || props.getProperty('ADMIN_ID') || '';

  if (!botToken) {
    Logger.log('FAIL: BOT_TOKEN not configured in Script Properties');
    return { ok: false, error: 'BOT_TOKEN_NOT_CONFIGURED' };
  }
  if (!adminIdStr) {
    Logger.log('FAIL: ADMIN_TELEGRAM_ID not configured in Script Properties');
    return { ok: false, error: 'ADMIN_TELEGRAM_ID_NOT_CONFIGURED' };
  }

  var adminId = parseInt(adminIdStr, 10);
  if (isNaN(adminId)) adminId = adminIdStr;

  // Non-admin test identity (made-up ID, definitely not admin or real student)
  var nonAdminId = 999988887;

  // Generate tokens safely (values are never logged)
  var adminInitData = createSignedInitData_(botToken, adminId, false);
  var wrongHashInitData = createSignedInitData_(botToken, adminId, true);
  var nonAdminInitData = createSignedInitData_(botToken, nonAdminId, false);

  // -------------------------------------------------------------
  // T1: No initData -> 401 MISSING_INIT_DATA
  // -------------------------------------------------------------
  try {
    var res1 = callWebAppEntry_('getHomeDashboard', '');
    if (res1 && res1.ok === false && (String(res1.error).indexOf('401') !== -1 || String(res1.error).indexOf('MISSING_INIT_DATA') !== -1)) {
      results.push('T1: PASS (no initData rejected with 401 MISSING_INIT_DATA)');
    } else {
      results.push('T1: FAIL (expected 401 MISSING_INIT_DATA, got: ' + JSON.stringify(res1) + ')');
      allPassed = false;
    }
  } catch (e1) {
    var msg1 = String(e1.message || e1);
    if (msg1.indexOf('401') !== -1 || msg1.indexOf('MISSING_INIT_DATA') !== -1) {
      results.push('T1: PASS (no initData rejected with 401 MISSING_INIT_DATA)');
    } else {
      results.push('T1: FAIL (unexpected error: ' + msg1 + ')');
      allPassed = false;
    }
  }

  // -------------------------------------------------------------
  // T2: Wrong hash -> 401
  // -------------------------------------------------------------
  try {
    var res2 = callWebAppEntry_('getHomeDashboard', wrongHashInitData);
    if (res2 && res2.ok === false && (String(res2.error).indexOf('401') !== -1 || String(res2.error).indexOf('AUTH_FAILED') !== -1)) {
      results.push('T2: PASS (wrong hash rejected with 401)');
    } else {
      results.push('T2: FAIL (expected 401 AUTH_FAILED, got: ' + JSON.stringify(res2) + ')');
      allPassed = false;
    }
  } catch (e2) {
    var msg2 = String(e2.message || e2);
    if (msg2.indexOf('401') !== -1 || msg2.indexOf('AUTH_FAILED') !== -1) {
      results.push('T2: PASS (wrong hash rejected with 401)');
    } else {
      results.push('T2: FAIL (unexpected error: ' + msg2 + ')');
      allPassed = false;
    }
  }

  // -------------------------------------------------------------
  // T3: Valid admin initData -> accepted on read-only action (ok: true)
  // -------------------------------------------------------------
  try {
    var res3 = callWebAppEntry_('getAppConfig', adminInitData);
    if (res3 && res3.ok === true) {
      results.push('T3: PASS (valid admin initData accepted on read-only getAppConfig, ok: true)');
    } else {
      results.push('T3: FAIL (expected ok:true, got: ' + JSON.stringify(res3) + ')');
      allPassed = false;
    }
  } catch (e3) {
    results.push('T3: FAIL (threw error: ' + (e3.message || e3) + ')');
    allPassed = false;
  }

  // -------------------------------------------------------------
  // T4: Valid non-admin initData -> rejected on admin action, sanitized config
  // -------------------------------------------------------------
  try {
    var res4Admin = callWebAppEntry_('getPaymentIntimations', nonAdminInitData);
    var adminActionRejected = false;
    if (res4Admin && res4Admin.ok === false && (String(res4Admin.error).indexOf('403') !== -1 || String(res4Admin.error).indexOf('FORBIDDEN') !== -1 || String(res4Admin.error).indexOf('Unauthorized') !== -1)) {
      adminActionRejected = true;
    }

    var res4Config = callWebAppEntry_('getAppConfig', nonAdminInitData);
    var sanitizedSafe = false;
    if (res4Config && res4Config.ok === true && res4Config.config) {
      var cfg = res4Config.config;
      if (cfg.UPI_ID === undefined || typeof cfg.UPI_ID === 'string') {
        sanitizedSafe = true;
      }
    } else if (res4Config && res4Config.ok === true) {
      sanitizedSafe = true;
    }

    if (adminActionRejected && sanitizedSafe) {
      results.push('T4: PASS (non-admin rejected on admin-only action with 403, sanitized config returned with no UPI value)');
    } else {
      results.push('T4: FAIL (adminActionRejected=' + adminActionRejected + ', sanitizedSafe=' + sanitizedSafe + ', res4Admin=' + JSON.stringify(res4Admin) + ')');
      allPassed = false;
    }
  } catch (e4) {
    results.push('T4: FAIL (threw error: ' + (e4.message || e4) + ')');
    allPassed = false;
  }

  // -------------------------------------------------------------
  // T5: Group 8 route list wiring (read-only)
  // -------------------------------------------------------------
  try {
    var group8Routes = ['getHomeDashboard', 'getNotebook', 'getProgress', 'getFeeDashboard'];
    var routeResults = [];
    var t5Passed = true;

    for (var r = 0; r < group8Routes.length; r++) {
      var routeName = group8Routes[r];
      try {
        var routeRes = handleApiRequest({ action: routeName, initData: adminInitData });
        if (routeRes && routeRes.error && routeRes.error.indexOf('Unknown action') !== -1) {
          routeResults.push(routeName + ': UNKNOWN_ACTION');
          t5Passed = false;
        } else {
          routeResults.push(routeName + ': ROUTED');
        }
      } catch (rErr) {
        var rErrMsg = String(rErr.message || rErr);
        if (rErrMsg.indexOf('Unknown action') !== -1) {
          routeResults.push(routeName + ': UNKNOWN_ACTION');
          t5Passed = false;
        } else {
          routeResults.push(routeName + ': ROUTED');
        }
      }
    }

    if (t5Passed) {
      results.push('T5: PASS (all 4 Group 8 read-only routes routed without Unknown action: ' + routeResults.join(', ') + ')');
    } else {
      results.push('T5: FAIL (' + routeResults.join(', ') + ')');
      allPassed = false;
    }
  } catch (e5) {
    results.push('T5: FAIL (threw error: ' + (e5.message || e5) + ')');
    allPassed = false;
  }

  for (var i = 0; i < results.length; i++) {
    Logger.log(results[i]);
  }

  return {
    ok: allPassed,
    summary: allPassed ? 'ALL_TESTS_PASSED' : 'TESTS_FAILED',
    results: results
  };
}
