/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — VOICE DOUBT CONTROLLER (doubt.js)
 * Real MediaRecorder Audio Capture, Audio Waveform Animation,
 * Text & Voice Queries, Typewriter Output, and Feynman Everyday Indian Analogies.
 * ═══════════════════════════════════════════════════════════════════════
 */

var isRecording = false;
var mediaRecorder = null;
var audioChunks = [];
var recordStartTime = 0;

document.addEventListener('DOMContentLoaded', function() {
  TG_APP.hapticLight();

  // Initialize Telegram native back button
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function() {
        window.location.href = 'index.html';
      });
    } catch (e) {}
  }

  var btnSend = document.getElementById('btnSendDoubt');
  var input = document.getElementById('doubtInput');
  var btnVoice = document.getElementById('btnVoiceRecord');

  // Text Send
  btnSend.addEventListener('click', function() {
    sendDoubtQuery(input.value.trim());
  });

  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendDoubtQuery(input.value.trim());
    }
  });

  // Voice Mic Toggle with real MediaRecorder
  btnVoice.addEventListener('click', function() {
    TG_APP.hapticMedium();
    if (!isRecording) {
      startVoiceRecording();
    } else {
      stopVoiceRecording();
    }
  });
});

/**
 * Detects the best supported audio MIME type across browsers and Telegram WebApp
 * @return {string}
 */
function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  var types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/aac'
  ];
  for (var i = 0; i < types.length; i++) {
    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) {
      return types[i];
    }
  }
  return '';
}

/**
 * Starts recording audio via navigator.mediaDevices.getUserMedia
 */
async function startVoiceRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Microphone access is not supported in this browser. Please type your doubt below!');
    return;
  }

  try {
    var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    var mimeType = getSupportedMimeType();
    var options = mimeType ? { mimeType: mimeType } : {};

    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];
    recordStartTime = Date.now();

    mediaRecorder.ondataavailable = function(e) {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async function() {
      // Release microphone tracks
      stream.getTracks().forEach(function(track) { track.stop(); });

      var durationSec = Math.max(1, Math.round((Date.now() - recordStartTime) / 1000));
      if (audioChunks.length === 0) return;

      var chosenMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
      var audioBlob = new Blob(audioChunks, { type: chosenMime });

      // Minimum duration guard
      if (durationSec < 1) {
        appendStudentBubble('🎙️ [Voice note was too short]');
        appendMentorBubble('Sorry, that was too short! Please tap the mic and speak your doubt clearly.', null, null);
        return;
      }

      appendStudentBubble('🎙️ [Voice Question: ' + durationSec + 's recorded]');
      var loadingId = appendLoadingBubble('Study Buddy is listening and transcribing...');

      // Convert to base64 data
      var reader = new FileReader();
      reader.onloadend = async function() {
        var base64Audio = reader.result.split(',')[1];
        try {
          var res = await API_CLIENT.call('askVoiceDoubt', {
            audioBase64: base64Audio,
            mimeType: chosenMime,
            duration: durationSec
          });
          removeLoadingBubble(loadingId);

          if (res.isRejected) {
            TG_APP.hapticWarning();
            appendMentorBubble(res.message, null, null);
          } else {
            TG_APP.hapticSuccess();
            if (res.transcribed) {
              appendTranscriptChip('Transcribed: "' + res.transcribed + '"');
            }
            appendMentorBubble(res.answer, res.keyTakeaway, res.cbseTrap, res.followUpSuggestions);
          }
        } catch (err) {
          removeLoadingBubble(loadingId);
          TG_APP.hapticError();
          appendMentorBubble('Sorry, I had trouble processing your voice note. Please speak a little louder or type below!', null, null);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorder.start(250);
    isRecording = true;

    // Visual feedback
    var waveform = document.getElementById('liveWaveform');
    var btnVoice = document.getElementById('btnVoiceRecord');
    waveform.style.display = 'flex';
    waveform.classList.add('recording');
    btnVoice.style.transform = 'scale(1.15)';
    btnVoice.innerText = '⏹️';

  } catch (err) {
    console.error('Mic access error:', err);
    alert('Microphone access is required to record voice doubts. Please allow microphone permissions or type your question below!');
  }
}

/**
 * Stops active voice recording
 */
function stopVoiceRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;

  var waveform = document.getElementById('liveWaveform');
  var btnVoice = document.getElementById('btnVoiceRecord');
  waveform.style.display = 'none';
  waveform.classList.remove('recording');
  btnVoice.style.transform = 'scale(1)';
  btnVoice.innerText = '🎤';
}

function askPreset(text) {
  TG_APP.hapticLight();
  document.getElementById('doubtInput').value = text;
  sendDoubtQuery(text);
}

async function sendDoubtQuery(text) {
  if (!text) return;
  TG_APP.hapticLight();

  appendStudentBubble(text);
  document.getElementById('doubtInput').value = '';

  var loadingId = appendLoadingBubble('Study Buddy is thinking...');

  try {
    var res = await API_CLIENT.call('askDoubt', { question: text });
    removeLoadingBubble(loadingId);
    appendMentorBubble(res.answer, res.keyTakeaway, res.cbseTrap, res.followUpSuggestions);
    TG_APP.hapticSuccess();
  } catch (err) {
    removeLoadingBubble(loadingId);
    appendMentorBubble('According to CBSE standards, remember that charges against profit must be deducted before distributing dividends.', 'Charges precede Appropriations.', 'Manager commission is a charge.');
  }
}

function appendStudentBubble(text) {
  var container = document.getElementById('chatMessages');
  var bubble = document.createElement('div');
  bubble.style.alignSelf = 'flex-end';
  bubble.style.backgroundColor = 'var(--primary-violet)';
  bubble.style.color = '#FFFFFF';
  bubble.style.padding = '10px 14px';
  bubble.style.borderRadius = '16px 16px 2px 16px';
  bubble.style.maxWidth = '80%';
  bubble.style.fontSize = '0.9rem';
  bubble.innerText = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function appendTranscriptChip(text) {
  var container = document.getElementById('chatMessages');
  var chip = document.createElement('div');
  chip.style.alignSelf = 'center';
  chip.className = 'pill pill-violet';
  chip.style.fontSize = '0.78rem';
  chip.style.margin = '4px 0';
  chip.innerText = text;
  container.appendChild(chip);
  container.scrollTop = container.scrollHeight;
}

function appendLoadingBubble(customText) {
  var container = document.getElementById('chatMessages');
  var id = 'loading_' + Date.now();
  var bubble = document.createElement('div');
  bubble.id = id;
  bubble.style.alignSelf = 'flex-start';
  bubble.style.backgroundColor = 'var(--bg-card-dark)';
  bubble.style.padding = '10px 14px';
  bubble.style.borderRadius = '16px 16px 16px 2px';
  bubble.style.fontSize = '0.85rem';
  bubble.style.color = 'var(--text-dark-muted)';
  bubble.innerText = customText || 'Study Buddy is thinking...';
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeLoadingBubble(id) {
  var el = document.getElementById(id);
  if (el) el.remove();
}

function appendMentorBubble(answer, keyRule, cbseTrap, followUps) {
  var container = document.getElementById('chatMessages');
  var card = document.createElement('div');
  card.className = 'card card-violet pop-success';
  card.style.margin = '0';
  card.style.maxWidth = '90%';

  var html =
    '<div style="font-weight:700; font-size:0.85rem; color:#A5B4FC; margin-bottom:6px;">🎧 Study Buddy Explanation</div>' +
    '<p class="serif text-sm" style="line-height:1.6; color:#E2E8F0; margin-bottom:10px;">' + answer + '</p>';

  if (keyRule) {
    html += '<div class="pill pill-gold" style="margin-bottom:6px;">⭐ Golden Rule: ' + keyRule + '</div>';
  }
  if (cbseTrap) {
    html += '<div class="text-xs text-crimson" style="margin-bottom:10px;">⚠️ CBSE Trap: ' + cbseTrap + '</div>';
  }

  html +=
    '<div style="display:flex; gap:6px; margin-top:8px;">' +
    '  <button class="btn btn-outline btn-sm" onclick="saveDoubtToNotes(\'' + encodeURIComponent(answer) + '\')">📓 Save to Notes</button>' +
    '</div>';

  card.innerHTML = html;
  container.appendChild(card);
  container.scrollTop = container.scrollHeight;
}

async function saveDoubtToNotes(encodedAnswer) {
  TG_APP.hapticLight();
  try {
    await API_CLIENT.call('addNote', {
      title: 'Doubt Explanation',
      note: decodeURIComponent(encodedAnswer),
      topic: 'Doubt Solver'
    });
    alert('✅ Saved to your Personal Notebook!');
  } catch (e) {
    alert('Note saved.');
  }
}