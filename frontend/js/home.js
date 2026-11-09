/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — HOME DASHBOARD CONTROLLER (home.js)
 * Loads real-time student stats, predicted score, active 70/30 subtopic,
 * 60-Sec Board Trap Real Audio Player, and 2:00 AM Exam Panic SOS Drawer.
 * ═══════════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  // Hide Telegram native back button on Home
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try { window.Telegram.WebApp.BackButton.hide(); } catch (e) {}
  }

  // Load user preview from Telegram
  var userPreview = TG_APP.getUserPreview();
  var userNameEl = document.getElementById('userName');
  var userAvatarEl = document.getElementById('userAvatar');

  if (userPreview.first_name) {
    userNameEl.innerText = userPreview.first_name;
    userAvatarEl.innerText = userPreview.first_name.charAt(0).toUpperCase();
  }

  // Hook SOS Trigger Button to open dedicated SOS Drawer Modal
  var btnSos = document.getElementById('btnSosTrigger');
  if (btnSos) {
    btnSos.addEventListener('click', function(e) {
      e.preventDefault();
      openSosModal();
    });
  }

  // Close SOS modal on clicking background overlay
  var sosOverlay = document.getElementById('sosModalOverlay');
  if (sosOverlay) {
    sosOverlay.addEventListener('click', function(e) {
      if (e.target === sosOverlay) {
        closeSosModal();
      }
    });
  }

  // Check URL hash for direct #sos trigger
  if (window.location.hash === '#sos') {
    openSosModal();
  }

  // 1. Instant 0ms render from client-side cache
  var cachedHome = API_CLIENT.getCached('getHomeDashboard');
  if (cachedHome) {
    renderHomeDashboard(cachedHome);
  }

  try {
    // 2. Fetch fresh live dashboard metrics in background and revalidate
    var data = await API_CLIENT.call('getHomeDashboard');
    renderHomeDashboard(data);
  } catch (err) {
    console.warn('Dashboard fetch notice:', err);
    if (!cachedHome) {
      // Graceful offline fallback bound to student single source of truth
      document.getElementById('coinCount').innerText = localStorage.getItem('cg_coins') || '0';
      document.getElementById('streakDisplay').innerText = '🔥 ' + (localStorage.getItem('cg_streak') || '1') + ' Day';
      document.getElementById('accuracyDisplay').innerText = (localStorage.getItem('cg_accuracy') || '85') + '%';
      document.getElementById('predictedScoreDisplay').innerText = (localStorage.getItem('cg_predicted') || '68') + '/80';
    }
  }
});

function renderHomeDashboard(data) {
  if (!data) return;

  // Persist single source of truth to localStorage
  if (data.cgCoins !== undefined) localStorage.setItem('cg_coins', data.cgCoins);
  if (data.streak !== undefined) localStorage.setItem('cg_streak', data.streak);
  if (data.overallAccuracy !== undefined) localStorage.setItem('cg_accuracy', data.overallAccuracy);
  if (data.predictedScore !== undefined) localStorage.setItem('cg_predicted', data.predictedScore);

  // Header & Coins
  if (data.name) {
    document.getElementById('userName').innerText = data.name;
    document.getElementById('userAvatar').innerText = data.name.charAt(0).toUpperCase();
  }
  document.getElementById('coinCount').innerText = data.cgCoins || 0;
  document.getElementById('streakDisplay').innerText = '🔥 ' + (data.streak || 1) + ' Days';
  document.getElementById('accuracyDisplay').innerText = (data.overallAccuracy || 75) + '%';
  document.getElementById('predictedScoreDisplay').innerText = (data.predictedScore || 65) + '/80';

  // Today's Subtopic Card
  if (data.todaySubtopic) {
    document.getElementById('todayChapterName').innerText = data.todaySubtopic.chapter;
    document.getElementById('todaySubtopicName').innerText = data.todaySubtopic.topic;
  }

  // Admin / Founder Console Banner (Strict Role-Gating: Gyan Sir 552858970 ONLY)
  var adminBanner = document.getElementById('adminPanelBanner');
  if (adminBanner) {
    var isGyanSir = false;
    try {
      var tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) || {};
      if (String(tgUser.id) === '552858970' || (data.isAdmin === true && String(data.studentId) === 'ADMIN-01' && String(tgUser.id) === '552858970')) {
        isGyanSir = true;
      }
    } catch (e) {}
    adminBanner.style.display = isGyanSir ? 'block' : 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────
// 2:00 AM EXAM PANIC SOS DRAWER CONTROLLER
// ─────────────────────────────────────────────────────────────────────
async function openSosModal() {
  TG_APP.hapticMedium();

  var overlay = document.getElementById('sosModalOverlay');
  if (!overlay) return;

  overlay.classList.add('open');

  var loadingEl = document.getElementById('sosLoadingState');
  var contentEl = document.getElementById('sosContentState');

  if (loadingEl) loadingEl.style.display = 'block';
  if (contentEl) contentEl.style.display = 'none';

  // Check cached SOS diagnosis first for 0ms load
  var cachedSos = API_CLIENT.getCached('triggerExamPanicSOS');
  if (cachedSos) {
    renderSosData(cachedSos);
    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  }

  try {
    var data = await API_CLIENT.call('triggerExamPanicSOS');
    if (data) {
      renderSosData(data);
      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';
      TG_APP.hapticSuccess();
    }
  } catch (err) {
    console.warn('SOS call notice:', err);
    if (!cachedSos) {
      // Fallback default formula card
      renderSosData({
        studentName: 'Gyan Sir',
        totalSolved: 12,
        strongestAccuracy: 85,
        strongestChapter: 'Partnership',
        weakChapter: 'Partnership Fundamentals',
        boosterMessage: 'Take a deep breath! You have consistently solved questions and your core foundation is strong. What you feel right now is natural pre-exam adrenaline, not lack of preparation. Trust your preparation and sleep well!',
        formulaCard: {
          title: 'Partnership Fundamentals',
          ruleText: '1. Interest on Partner Loan @ 6% p.a. is a CHARGE (debit P&L, NOT Appr.)\n2. Rent to Partner is a CHARGE (debit P&L)\n3. Drawings: 1st day = 6.5 months; middle = 6.0 months; end = 5.5 months',
          cbseTrap: 'Never write Manager Commission or Partner Loan Interest in P&L Appropriation Account. They belong in the main Profit & Loss Account!'
        },
        sleepAdvice: '7 hours of sleep consolidates memory 40% better than late-night cramming. Put your phone away, rest your eyes, and trust your hard work!'
      });
      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';
    }
  }
}

function renderSosData(data) {
  if (!data) return;

  // 1. Student Name
  var nameEl = document.getElementById('sosStudentName');
  if (nameEl) {
    nameEl.innerText = data.studentName || 'Champion';
  }

  // 2. Metrics Bar (Accuracy, Solved Count, Strong Chapter)
  var accEl = document.getElementById('sosAccuracyMetric');
  if (accEl) {
    var accVal = data.strongestAccuracy || 85;
    accEl.innerText = accVal + '%';
  }

  var solvedEl = document.getElementById('sosSolvedMetric');
  if (solvedEl) {
    var countVal = data.totalSolved || 12;
    solvedEl.innerText = countVal + (countVal >= 10 ? '+' : '');
  }

  var strongEl = document.getElementById('sosStrongChapter');
  if (strongEl) {
    var chName = data.strongestChapter || 'Partnership';
    chName = chName.replace(/Chapter\s*\d+\s*:?\s*/i, '').trim();
    if (chName.length > 13) chName = chName.substring(0, 12) + '…';
    strongEl.innerText = chName;
  }

  // 3. Gyan Sir's Personal Mentor Reassurance
  var boosterEl = document.getElementById('sosBoosterMessage');
  if (boosterEl) {
    var msg = data.boosterMessage || '';
    if (msg.length > 100) {
      // Clean up duplicate intros if backend concatenated raw strings
      msg = msg.replace(/^Take a deep breath[^\n]*\n+/i, '').trim();
      msg = msg.replace(/^Look at your real numbers:?\s*/i, '').trim();
    }
    if (!msg || msg.length < 20) {
      msg = 'Take a deep breath! You have consistently solved questions and your core foundation is strong. What you feel right now is natural pre-exam adrenaline, not lack of preparation. Trust your preparation and sleep well!';
    }
    boosterEl.innerText = msg;
  }

  // 4. Formula Card Title
  var formTitle = document.getElementById('sosFormulaTitle');
  if (formTitle) {
    var title = (data.formulaCard && data.formulaCard.title) || data.weakChapter || 'Golden Formula';
    formTitle.innerText = title;
  }

  // 5. Formula Rules List (Transform each rule into high-contrast structured item with badge)
  var ruleListEl = document.getElementById('sosFormulaList');
  if (ruleListEl) {
    ruleListEl.innerHTML = '';
    var ruleRaw = (data.formulaCard && data.formulaCard.ruleText) || '';
    var lines = ruleRaw.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });

    if (lines.length === 0) {
      lines = [
        'Interest on Partner Loan @ 6% p.a. is a CHARGE (debit P&L, NOT Appr.)',
        'Rent to Partner is a CHARGE (debit P&L)',
        'Drawings: 1st day = 6.5 months; middle = 6.0 months; end = 5.5 months'
      ];
    }

    lines.forEach(function(line, idx) {
      // Strip leading digits "1. ", "2. ", etc.
      var cleanLine = line.replace(/^\d+[\.\)]\s*/, '');

      // Highlight keywords with high contrast
      var formatted = cleanLine
        .replace(/\b(CHARGE)\b/g, '<span class="sos-rule-highlight">CHARGE</span>')
        .replace(/\b(debit P&L)\b/gi, '<strong style="color: #F8FAFC; text-decoration: underline;">debit P&L</strong>')
        .replace(/\b(NOT Appr\.?)\b/gi, '<span style="color: #FCA5A5; font-weight: 700;">NOT Appr.</span>')
        .replace(/\b(Capital Reserve)\b/gi, '<span class="sos-rule-highlight">Capital Reserve</span>')
        .replace(/\b(Operating|Investing|Financing)\b/g, '<strong style="color: #67E8F9;">$1</strong>')
        .replace(/(\d+(\.\d+)?\s*months?)/gi, '<strong style="color: #FBBF24;">$1</strong>');

      var item = document.createElement('div');
      item.className = 'sos-rule-item';
      item.innerHTML =
        '<span class="sos-rule-num">' + (idx + 1) + '</span>' +
        '<div class="sos-rule-content">' + formatted + '</div>';
      ruleListEl.appendChild(item);
    });
  }

  // 6. CBSE Examiner Trap
  var trapEl = document.getElementById('sosCbseTrap');
  if (trapEl) {
    trapEl.innerText = (data.formulaCard && data.formulaCard.cbseTrap) ||
      'Never write Manager Commission or Partner Loan Interest in P&L Appropriation Account. They belong in the main Profit & Loss Account!';
  }

  // 7. Sleep Prescription Advice
  var sleepEl = document.getElementById('sosSleepAdvice');
  if (sleepEl) {
    var sleepText = data.sleepAdvice || '7 hours of sleep consolidates memory 40% better than late-night cramming. Put your phone away, rest your eyes, and trust your hard work!';
    sleepText = sleepText.replace(/^🌙\s*/, '').trim();
    sleepEl.innerText = sleepText;
  }
}

function closeSosModal() {
  TG_APP.hapticLight();
  var overlay = document.getElementById('sosModalOverlay');
  if (overlay) overlay.classList.remove('open');
  if (window.location.hash === '#sos') {
    history.replaceState(null, null, 'index.html');
  }
}
