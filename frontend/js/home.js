/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — HOME DASHBOARD CONTROLLER (home.js)
 * Loads real-time student stats, predicted score, active 70/30 subtopic,
 * and founder console visibility.
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

  // Hook SOS Button
  var btnSos = document.getElementById('btnSosTrigger');
  if (btnSos) {
    btnSos.addEventListener('click', function() {
      TG_APP.hapticMedium();
      window.location.href = 'question.html#sos';
    });
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
// 60-SECOND MORNING BOARD TRAP AUDIO PLAYER (SpeechSynthesis / MP3)
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

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (audioPillAudio) {
    audioPillAudio.pause();
    audioPillAudio.currentTime = 0;
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

function playAudioPill(audioUrl) {
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
  var startTime = Date.now();
  var durationSec = 30;

  if (audioPillInterval) clearInterval(audioPillInterval);
  audioPillInterval = setInterval(function() {
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var pct = Math.min(100, Math.round((elapsed / durationSec) * 100));
    if (progressBar) progressBar.style.width = pct + '%';
    if (timerEl) {
      var min = Math.floor(elapsed / 60);
      var sec = elapsed % 60;
      timerEl.innerText = (min + ':' + (sec < 10 ? '0' : '') + sec) + ' / 0:30';
    }
    if (elapsed >= durationSec) {
      stopAudioPill();
    }
  }, 250);

  if (audioUrl) {
    try {
      audioPillAudio = new Audio(audioUrl);
      audioPillAudio.onended = function() { stopAudioPill(); };
      audioPillAudio.onerror = function() { speakBoardTrapNative(); };
      audioPillAudio.play();
      return;
    } catch (e) {
      console.warn('Audio URL playback error, falling back to speech synthesis:', e);
    }
  }

  speakBoardTrapNative();
}

function speakBoardTrapNative() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const trapScript = "Good morning Champions! Today's 60-second CBSE Board Trap: Interest on a Partner's Loan is a Charge against profit, not an appropriation! Even if the partnership firm suffers a net loss, you must compulsorily pay 6 percent interest per annum and debit it to the Profit and Loss Account, never to the Profit and Loss Appropriation Account!";
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trapScript);
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
    console.warn('SpeechSynthesis not supported on this device');
  }
}
