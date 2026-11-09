/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — API CLIENT & OFFLINE PWA ENGINE (api.js)
 * Zero-Lag REST Client, HMAC initData Injection,
 * 15 KB Local Offline Cache, and Auto-Sync on Network Restoration.
 * ═══════════════════════════════════════════════════════════════════════
 */

var API_CLIENT = {
  // Configured Apps Script Web App Deployment URL
  // Can be overridden via window.COMMERCE_BACKEND_URL or localStorage
  backendUrl: window.COMMERCE_BACKEND_URL ||
              localStorage.getItem('cg_backend_url') ||
              'https://script.google.com/macros/s/AKfycbywJKoynUbc2fY7caEx9hZ-FARG71J9v1F6uXaL5z7XxBS_NKhwFiKCZIVeaYVJ0QS4jQ/exec',

  /**
   * Reads cached response from localStorage for instant Stale-While-Revalidate UI rendering
   * @param {string} action
   * @return {Object|null}
   */
  getCached: function(action) {
    try {
      var item = localStorage.getItem('cg_cache_' + action);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Sets custom backend URL
   * @param {string} url
   */
  setBackendUrl: function(url) {
    this.backendUrl = url;
    localStorage.setItem('cg_backend_url', url);
  },

  /**
   * Dispatches an authenticated POST API call to the Apps Script microservice
   * @param {string} action
   * @param {Object} [payload={}]
   * @return {Promise<Object>} Response data
   */
  call: async function(action, payload) {
    payload = payload || {};
    var initData = TG_APP.getInitData();

    var requestBody = {
      initData: initData,
      action: action,
      payload: payload
    };

    // Law C-0C: Offline Resilience Check for getDailyQuestion
    if (!navigator.onLine && action === 'getDailyQuestion') {
      var cachedQ = localStorage.getItem('cg_offline_daily_q');
      if (cachedQ) {
        console.warn('📶 Offline: Serving cached questions from 15 KB local storage');
        return JSON.parse(cachedQ);
      }
    }

    try {
      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timeoutMs = (action === 'submitRedPenCopy' || action === 'runRedPenAnalysis' || action === 'askVoiceDoubt') ? 60000 : 25000;
      var timeoutId = controller ? setTimeout(function() {
        if (controller.abort) {
          try {
            controller.abort("Server took longer than 60 seconds");
          } catch (e) {
            controller.abort();
          }
        }
      }, timeoutMs) : null;

      var response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Apps Script handles text/plain POST without CORS preflight blocks
        },
        body: JSON.stringify(requestBody),
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        var errorBody = '';
        try {
          var errJson = await response.json();
          errorBody = errJson.error || JSON.stringify(errJson);
        } catch (e) {
          try {
            errorBody = await response.text();
          } catch (e2) {}
        }
        throw new Error('HTTP Error ' + response.status + (errorBody ? ': ' + errorBody : ''));
      }

      var result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || ('Server error: ' + JSON.stringify(result)));
      }

      // Auto-cache read-only responses for instant 0ms Stale-While-Revalidate loading
      if (result.data && (action === 'getHomeDashboard' || action === 'getNotebook' || action === 'getProgress' || action === 'getFeeDashboard' || action === 'getDailyQuestion' || action === 'triggerExamPanicSOS')) {
        try {
          localStorage.setItem('cg_cache_' + action, JSON.stringify(result.data));
        } catch (cErr) {}
      }

      // Cache today's questions locally for offline resilience (~15 KB)
      if (action === 'getDailyQuestion' && result.data) {
        localStorage.setItem('cg_offline_daily_q', JSON.stringify(result.data));
      }

      return result.data;

    } catch (err) {
      console.error('API call failed (' + action + '):', err);

      if (err.name === 'AbortError' || String(err).includes('aborted') || String(err).includes('longer than 60 seconds')) {
        throw new Error('सर्वर ने 60 सेकंड से ज्यादा समय लिया। कृपया नेटवर्क स्पीड चेक करें और दोबारा प्रयास करें।');
      }

      // Offline answer queuing
      if (action === 'submitAnswer') {
        this.queueOfflineSubmission(payload);
        return {
          isOfflineQueued: true,
          message: '📶 Mobile data dropped. Answer saved locally and will auto-sync when online!'
        };
      }

      // Fallback to local storage for getHomeDashboard
      if (action === 'getHomeDashboard') {
        var cachedHome = localStorage.getItem('cg_offline_home');
        if (cachedHome) return JSON.parse(cachedHome);
      }

      throw err;
    }
  },

  /**
   * Queues an answer submission locally when offline
   * @param {Object} payload
   */
  queueOfflineSubmission: function(payload) {
    var queue = JSON.parse(localStorage.getItem('cg_pending_sync') || '[]');
    queue.push({
      payload: payload,
      timestamp: Date.now()
    });
    localStorage.setItem('cg_pending_sync', JSON.stringify(queue));
    console.log('📦 Queued offline answer submission for QID: ' + payload.qid);
  },

  /**
   * Flushes offline queued answers when internet connection is restored
   */
  syncOfflineQueue: async function() {
    var queue = JSON.parse(localStorage.getItem('cg_pending_sync') || '[]');
    if (queue.length === 0) return;

    console.log('🔄 Syncing ' + queue.length + ' queued submissions...');
    var remaining = [];

    for (var i = 0; i < queue.length; i++) {
      try {
        await this.call('submitAnswer', queue[i].payload);
        console.log('✅ Synced submission for ' + queue[i].payload.qid);
      } catch (e) {
        remaining.push(queue[i]);
      }
    }

    localStorage.setItem('cg_pending_sync', JSON.stringify(remaining));
    if (remaining.length === 0) {
      TG_APP.hapticSuccess();
    }
  }
};

// Auto-sync when device comes online
window.addEventListener('online', function() {
  console.log('🌐 Network restored! Flushing offline queue...');
  API_CLIENT.syncOfflineQueue();
});
