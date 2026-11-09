/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — TELEGRAM SDK & HAPTICS (telegram.js)
 * Native Telegram WebApp SDK initialization, Tactile Haptics,
 * and Theme Synchronization.
 * ═══════════════════════════════════════════════════════════════════════
 */

var TG_APP = {
  tg: (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null,

  init: function() {
    if (this.tg) {
      try {
        this.tg.ready();
        this.tg.expand();
        this.tg.enableClosingConfirmation();

        // Match Deep Obsidian (#0B0C10)
        if (this.tg.setHeaderColor) {
          this.tg.setHeaderColor('#0B0C10');
        }
        if (this.tg.setBackgroundColor) {
          this.tg.setBackgroundColor('#0B0C10');
        }

        // Apply dark/light theme class to body
        if (this.tg.colorScheme === 'light') {
          document.body.classList.add('light-theme');
        }

        Logger.log('Telegram WebApp initialized. User ID: ' + (this.tg.initDataUnsafe && this.tg.initDataUnsafe.user ? this.tg.initDataUnsafe.user.id : 'Anonymous'));
      } catch (e) {
        console.warn('Telegram WebApp init error:', e);
      }
    }
  },

  /**
   * Retrieves full signed initData string for backend HMAC-SHA256 verification (Law C-1)
   * @return {string}
   */
  getInitData: function() {
    if (this.tg && this.tg.initData) {
      return this.tg.initData;
    }
    // Local development fallback token
    return 'query_id=DEV_MOCK&user=%7B%22id%22%3A12345678%2C%22first_name%22%3A%22Aarav%22%2C%22last_name%22%3A%22Kumar%22%2C%22username%22%3A%22aarav%22%7D&auth_date=1731110400&hash=mock_dev_hash';
  },

  /**
   * Client-side preview user details (used ONLY for initial placeholder rendering, NOT auth)
   */
  getUserPreview: function() {
    if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
      return this.tg.initDataUnsafe.user;
    }
    return { id: 12345678, first_name: 'Aarav', last_name: 'Kumar' };
  },

  // ─────────────────────────────────────────────────────────────────
  // TACTILE HAPTIC FEEDBACK (Telegram WebApp Native SDK)
  // ─────────────────────────────────────────────────────────────────

  hapticLight: function() {
    if (this.tg && this.tg.HapticFeedback) {
      try { this.tg.HapticFeedback.impactOccurred('light'); } catch (e) {}
    }
  },

  hapticMedium: function() {
    if (this.tg && this.tg.HapticFeedback) {
      try { this.tg.HapticFeedback.impactOccurred('medium'); } catch (e) {}
    }
  },

  hapticSuccess: function() {
    if (this.tg && this.tg.HapticFeedback) {
      try { this.tg.HapticFeedback.notificationOccurred('success'); } catch (e) {}
    }
  },

  hapticError: function() {
    if (this.tg && this.tg.HapticFeedback) {
      try { this.tg.HapticFeedback.notificationOccurred('error'); } catch (e) {}
    }
  },

  hapticWarning: function() {
    if (this.tg && this.tg.HapticFeedback) {
      try { this.tg.HapticFeedback.notificationOccurred('warning'); } catch (e) {}
    }
  }
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', function() {
  TG_APP.init();
});
