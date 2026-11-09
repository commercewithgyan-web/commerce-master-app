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
      // Graceful offline fallback
      document.getElementById('coinCount').innerText = '120';
      document.getElementById('streakDisplay').innerText = '🔥 7 Days';
      document.getElementById('accuracyDisplay').innerText = '82%';
      document.getElementById('predictedScoreDisplay').innerText = '66/80';
    }
  }
});

function renderHomeDashboard(data) {
  if (!data) return;

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

  // Admin / Founder Console Banner
  if (data.isAdmin) {
    var adminBanner = document.getElementById('adminPanelBanner');
    if (adminBanner) adminBanner.style.display = 'block';
  }
}

// ─────────────────────────────────────────────────────────────────────
// 60-SECOND MORNING BOARD TRAP AUDIO PLAYER (Real Audio + Web Speech API)
// ─────────────────────────────────────────────────────────────────────
var isAudioPillPlaying = false;
var audioPillAudio = null;
var audioPillInterval = null;

function toggleAudioPill() {
  if (isAudioPillPlaying) {
    stopAudioPill();
  } else {
    playAudioPill();
  }
}

function stopAudioPill() {
  isAudioPillPlaying = false;
  TG_APP.hapticLight();

  if (audioPillAudio) {
    try {
      audioPillAudio.pause();
      audioPillAudio.currentTime = 0;
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }

  if (audioPillInterval) {
    clearInterval(audioPillInterval);
    audioPillInterval = null;
  }

  var btn = document.getElementById('btnPlayAudioPill');
  if (btn) {
    btn.innerHTML = '▶ Play';
    btn.classList.remove('btn-crimson');
    btn.classList.add('btn-outline');
  }

  var icon = document.getElementById('audioPillIcon');
  if (icon) {
    icon.innerHTML = '🎧';
    icon.style.transform = 'scale(1)';
  }

  var bar = document.getElementById('audioPillProgressBar');
  if (bar) bar.style.width = '0%';
}

function playAudioPill() {
  isAudioPillPlaying = true;
  TG_APP.hapticMedium();

  var btn = document.getElementById('btnPlayAudioPill');
  if (btn) {
    btn.innerHTML = '⏹ Stop';
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-crimson');
  }

  var icon = document.getElementById('audioPillIcon');
  if (icon) {
    icon.innerHTML = '🔊';
    icon.style.transform = 'scale(1.1)';
  }

  var playerBar = document.getElementById('audioPillPlayerBar');
  if (playerBar) {
    playerBar.style.display = 'block';
  }

  var progressBar = document.getElementById('audioPillProgressBar');
  var timerEl = document.getElementById('audioPillTimer');
  var durationSec = 22;

  try {
    if (!audioPillAudio) {
      audioPillAudio = new Audio('audio/board_trap.mp3');

      audioPillAudio.addEventListener('ended', function() {
        stopAudioPill();
      });

      audioPillAudio.addEventListener('timeupdate', function() {
        if (!audioPillAudio || !isAudioPillPlaying) return;
        var cur = Math.floor(audioPillAudio.currentTime);
        var dur = Math.floor(audioPillAudio.duration) || durationSec;
        var pct = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0;
        if (progressBar) progressBar.style.width = pct + '%';
        if (timerEl) {
          var min = Math.floor(cur / 60);
          var sec = cur % 60;
          timerEl.innerText = (min + ':' + (sec < 10 ? '0' : '') + sec) + ' / 0:' + (dur < 10 ? '0' : '') + dur;
        }
      });

      audioPillAudio.addEventListener('error', function(e) {
        console.warn('MP3 playback failed, trying native speech synthesis fallback:', e);
        speakBoardTrapNative();
      });
    }

    audioPillAudio.currentTime = 0;
    var playPromise = audioPillAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(function(err) {
        console.warn('Audio play() promise rejected:', err);
        speakBoardTrapNative();
      });
    }
  } catch (e) {
    console.warn('Audio playback exception, falling back to speech synthesis:', e);
    speakBoardTrapNative();
  }
}

function speakBoardTrapNative() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    var trapScript = "Good morning Champions! Today's 60-second CBSE Board Trap: Interest on a Partner's Loan is a Charge against profit, not an appropriation! Even if the partnership firm suffers a net loss, you must compulsorily pay 6 percent interest per annum and debit it to the Profit and Loss Account, never to the Profit and Loss Appropriation Account!";
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(trapScript);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = function() {
      stopAudioPill();
    };
    utterance.onerror = function(e) {
      console.warn('SpeechSynthesis error:', e);
      stopAudioPill();
    };
    window.speechSynthesis.speak(utterance);
  } else {
    // If neither works, simulate timer and stop
    var startTime = Date.now();
    if (audioPillInterval) clearInterval(audioPillInterval);
    audioPillInterval = setInterval(function() {
      var elapsed = Math.floor((Date.now() - startTime) / 1000);
      var pct = Math.min(100, Math.round((elapsed / 22) * 100));
      var bar = document.getElementById('audioPillProgressBar');
      var timer = document.getElementById('audioPillTimer');
      if (bar) bar.style.width = pct + '%';
      if (timer) timer.innerText = '0:' + (elapsed < 10 ? '0' : '') + elapsed + ' / 0:22';
      if (elapsed >= 22) {
        stopAudioPill();
      }
    }, 250);
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
        studentName: 'Champion',
        boosterMessage: 'Take a deep breath! You have consistently practiced your concepts and your core foundation is strong. Close your books, hydrate, and sleep. You are ready for the board exam!',
        strongestChapter: 'Partnership Fundamentals',
        strongestAccuracy: 85,
        weakChapter: 'Partnership Fundamentals',
        formulaCard: {
          title: 'Partnership Fundamentals',
          ruleText: '1. Interest on Partner Loan @ 6% p.a. is a CHARGE (debit P&L, NOT Appr.)\n2. Rent to Partner is a CHARGE (debit P&L)\n3. Drawings on 1st day of month = 6.5 months; middle = 6.0; end = 5.5 months',
          cbseTrap: 'Never write Manager Commission or Partner Loan Interest in P&L Appropriation Account. They belong in the main Profit & Loss Account!'
        },
        sleepAdvice: '🌙 Science-backed rule: 7 hours of sleep consolidates memory 40% better than late-night cramming. Sleep now, conquer tomorrow!'
      });
      if (loadingEl) loadingEl.style.display = 'none';
      if (contentEl) contentEl.style.display = 'block';
    }
  }
}

function renderSosData(data) {
  var boosterEl = document.getElementById('sosBoosterMessage');
  if (boosterEl) boosterEl.innerText = data.boosterMessage || '';

  var formTitle = document.getElementById('sosFormulaTitle');
  if (formTitle) formTitle.innerText = (data.formulaCard && data.formulaCard.title) || data.weakChapter || 'Golden Formula';

  var formText = document.getElementById('sosFormulaText');
  if (formText) formText.innerText = (data.formulaCard && data.formulaCard.ruleText) || '';

  var trapEl = document.getElementById('sosCbseTrap');
  if (trapEl) trapEl.innerText = (data.formulaCard && data.formulaCard.cbseTrap) || '';

  var sleepEl = document.getElementById('sosSleepAdvice');
  if (sleepEl && data.sleepAdvice) sleepEl.innerText = data.sleepAdvice;
}

function closeSosModal() {
  TG_APP.hapticLight();
  var overlay = document.getElementById('sosModalOverlay');
  if (overlay) overlay.classList.remove('open');
  if (window.location.hash === '#sos') {
    history.replaceState(null, null, 'index.html');
  }
}
