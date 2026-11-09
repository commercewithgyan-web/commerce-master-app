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
      var response = await fetch(this.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Apps Script handles text/plain POST without CORS preflight blocks
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('HTTP Error ' + response.status);
      }

      var result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Server returned an error');
      }

      // Cache today's questions locally for offline resilience (~15 KB)
      if (action === 'getDailyQuestion' && result.data) {
        localStorage.setItem('cg_offline_daily_q', JSON.stringify(result.data));
      }

      return result.data;

    } catch (err) {
      console.error('API call failed (' + action + '):', err);

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
