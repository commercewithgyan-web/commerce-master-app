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

        // Theme Initialization: Default to Light / Lilac & Blush Premium Theme (G1)
        var savedTheme = localStorage.getItem('cg_theme');
        if (savedTheme === 'dark') {
          document.body.classList.add('dark-theme');
          document.body.classList.remove('light-theme');
          if (this.tg.setHeaderColor) this.tg.setHeaderColor('#0B0C10');
          if (this.tg.setBackgroundColor) this.tg.setBackgroundColor('#0B0C10');
        } else {
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
          if (this.tg.setHeaderColor) this.tg.setHeaderColor('#FAF8FC');
          if (this.tg.setBackgroundColor) this.tg.setBackgroundColor('#FAF8FC');
        }

        Logger.log('Telegram WebApp initialized. User ID: ' + (this.tg.initDataUnsafe && this.tg.initDataUnsafe.user ? this.tg.initDataUnsafe.user.id : 'Anonymous'));
      } catch (e) {
        console.warn('Telegram WebApp init error:', e);
      }
    } else {
      // Browser preview theme setup
      var saved = localStorage.getItem('cg_theme');
      if (saved === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
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
    return '';
  },

  /**
   * Client-side preview user details (used ONLY for initial placeholder rendering, NOT auth)
   */
  getUserPreview: function() {
    if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
      return this.tg.initDataUnsafe.user;
    }
    return { id: 'GUEST_STUDENT', first_name: 'Student', last_name: '' };
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

window.toggleTheme = function() {
  var isDark = document.body.classList.contains('dark-theme');
  if (isDark) {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    localStorage.setItem('cg_theme', 'light');
    if (TG_APP.tg && TG_APP.tg.setHeaderColor) TG_APP.tg.setHeaderColor('#FAF8FC');
    if (TG_APP.tg && TG_APP.tg.setBackgroundColor) TG_APP.tg.setBackgroundColor('#FAF8FC');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    localStorage.setItem('cg_theme', 'dark');
    if (TG_APP.tg && TG_APP.tg.setHeaderColor) TG_APP.tg.setHeaderColor('#0B0C10');
    if (TG_APP.tg && TG_APP.tg.setBackgroundColor) TG_APP.tg.setBackgroundColor('#0B0C10');
  }
  TG_APP.hapticLight();
  var btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerText = isDark ? '🌙' : '☀️';
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', function() {
  TG_APP.init();
});
