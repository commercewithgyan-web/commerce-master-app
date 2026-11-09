/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — MULTI-SUBJECT & MULTI-LENS DOUBT CONTROLLER
 * Subject Selector (Accountancy / BST / Economics),
 * Real MediaRecorder Voice Capture, Pulsating Audio Waveform,
 * Multi-Lens Response Tabs (💡 Simple Story | 📝 Exam Notes | 🏢 Real Example).
 * ═══════════════════════════════════════════════════════════════════════
 */

var activeSubject = 'Accountancy';
var isRecording = false;
var mediaRecorder = null;
var audioChunks = [];
var recordStartTime = 0;
var doubtMessagesMap = {}; // Registry of all rendered doubts and their multi-lens states

var PRESETS_BY_SUBJECT = {
  'Accountancy': [
    { label: 'Partner Loan Interest?', q: 'Why is Interest on Partner Loan a Charge and not an Appropriation?' },
    { label: 'Gaining Ratio?', q: 'How do I calculate Gaining Ratio on Partner Retirement?' },
    { label: 'Share Forfeiture?', q: 'How is Capital Reserve calculated on Reissue of Forfeited Shares?' }
  ],
  'Business Studies': [
    { label: 'Unity of Command?', q: 'Explain Fayol\'s Unity of Command vs Unity of Direction in Business Studies' },
    { label: 'Planning vs Controlling?', q: 'Explain the relationship between Planning and Controlling in Business Studies' },
    { label: 'Marketing Mix?', q: 'What are the 4 Ps of Marketing Mix in Business Studies?' }
  ],
  'Economics': [
    { label: 'Price Elasticity?', q: 'Explain Price Elasticity of Demand with practical schedule and formula' },
    { label: 'RBI Repo Rate?', q: 'How does RBI use Repo Rate to control Inflation in the economy?' },
    { label: 'BOP vs BOT?', q: 'What is the difference between Balance of Trade and Balance of Payments?' }
  ]
};

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

  // Render initial preset chips for default subject (Accountancy)
  renderPresetChips();

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
 * Changes active subject from the top selector bar
 * @param {string} subject - 'Accountancy' | 'Business Studies' | 'Economics'
 */
function selectSubject(subject) {
  if (activeSubject === subject) return;
  activeSubject = subject;
  TG_APP.hapticLight();

  // Update pill active classes
  var pillAcc = document.getElementById('pillAccountancy');
  var pillBST = document.getElementById('pillBST');
  var pillEco = document.getElementById('pillEconomics');

  if (pillAcc) pillAcc.classList.toggle('active', subject === 'Accountancy');
  if (pillBST) pillBST.classList.toggle('active', subject === 'Business Studies');
  if (pillEco) pillEco.classList.toggle('active', subject === 'Economics');

  // Update input placeholder
  var input = document.getElementById('doubtInput');
  if (input) {
    input.placeholder = 'Ask your ' + subject + ' doubt...';
  }

  // Re-render presets
  renderPresetChips();
}

/**
 * Renders dynamic preset question chips based on activeSubject
 */
function renderPresetChips() {
  var container = document.getElementById('presetChipsContainer');
  if (!container) return;

  var presets = PRESETS_BY_SUBJECT[activeSubject] || PRESETS_BY_SUBJECT['Accountancy'];
  container.innerHTML = '';

  presets.forEach(function(item) {
    var btn = document.createElement('button');
    btn.className = 'pill pill-violet';
    btn.innerText = item.label;
    btn.onclick = function() {
      askPreset(item.q);
    };
    container.appendChild(btn);
  });
}

/**
 * Detects the best supported audio MIME type across browsers and Telegram WebApp
 * @return {string}
 */
function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return 'audio/webm';
  return MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : (MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg');
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
        appendErrorBubble('Sorry, your voice was not clear. Please speak closer to the mic and ask again!');
        return;
      }

      appendStudentBubble('🎙️ [' + activeSubject + ' Voice Question: ' + durationSec + 's recorded]');
      var loadingId = appendLoadingBubble('Listening to your doubt...');

      // Convert to base64 data
      var reader = new FileReader();
      reader.onloadend = async function() {
        var base64Audio = reader.result.split(',')[1];
        try {
          var res = await API_CLIENT.call('askVoiceDoubt', {
            audioBase64: base64Audio,
            mimeType: chosenMime,
            duration: durationSec,
            subject: activeSubject
          });
          removeLoadingBubble(loadingId);

          if (res.isRejected) {
            TG_APP.hapticWarning();
            appendErrorBubble(res.message || 'Sorry, your voice was not clear. Please speak closer to the mic and ask again!');
          } else {
            TG_APP.hapticSuccess();
            if (res.transcribed) {
              appendTranscriptChip('Transcribed: "' + res.transcribed + '"');
            }
            renderMultiLensCard(res, res.transcribed || 'Voice Question');
          }
        } catch (err) {
          removeLoadingBubble(loadingId);
          TG_APP.hapticError();
          appendErrorBubble('Unable to connect to the study server. Please check your internet connection and try again!');
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorder.start(250);
    isRecording = true;

    // Visual feedback
    var waveform = document.getElementById('liveWaveform');
    var btnVoice = document.getElementById('btnVoiceRecord');
    var micIcon = document.getElementById('micIcon');
    var micLabel = document.getElementById('micLabel');
    var statusText = document.getElementById('recordingStatusText');

    if (waveform) {
      waveform.style.display = 'flex';
      waveform.classList.add('recording');
    }
    if (btnVoice) {
      btnVoice.classList.add('recording');
    }
    if (micIcon) micIcon.innerText = '⏹️';
    if (micLabel) micLabel.innerText = 'Stop Recording';
    if (statusText) statusText.innerText = 'Listening to your ' + activeSubject + ' doubt...';

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
  var micIcon = document.getElementById('micIcon');
  var micLabel = document.getElementById('micLabel');

  if (waveform) {
    waveform.style.display = 'none';
    waveform.classList.remove('recording');
  }
  if (btnVoice) {
    btnVoice.classList.remove('recording');
  }
  if (micIcon) micIcon.innerText = '🎤';
  if (micLabel) micLabel.innerText = 'Tap to Speak';
}

function askPreset(text) {
  TG_APP.hapticLight();
  var input = document.getElementById('doubtInput');
  if (input) input.value = text;
  sendDoubtQuery(text);
}

/**
 * Submits text doubt query to the backend
 * @param {string} text
 */
async function sendDoubtQuery(text) {
  if (!text) return;
  TG_APP.hapticLight();

  appendStudentBubble(text);
  document.getElementById('doubtInput').value = '';

  var loadingId = appendLoadingBubble('Consulting Gyan Sir\'s Knowledge Vault...');

  try {
    var res = await API_CLIENT.call('askDoubt', {
      question: text,
      subject: activeSubject,
      lens: 'ALL'
    });
    removeLoadingBubble(loadingId);
    renderMultiLensCard(res, text);
    TG_APP.hapticSuccess();
  } catch (err) {
    removeLoadingBubble(loadingId);
    TG_APP.hapticError();
    // Honest, truthful error handling with ZERO fake mock answers
    appendErrorBubble('Unable to connect to the study server. Please check your internet connection and try again!');
  }
}

/**
 * Appends student message bubble to the chat container
 * @param {string} text
 */
function appendStudentBubble(text) {
  var container = document.getElementById('chatMessages');
  var bubble = document.createElement('div');
  bubble.style.alignSelf = 'flex-end';
  bubble.style.backgroundColor = 'var(--primary-violet)';
  bubble.style.color = '#FFFFFF';
  bubble.style.padding = '10px 14px';
  bubble.style.borderRadius = '16px 16px 2px 16px';
  bubble.style.maxWidth = '82%';
  bubble.style.fontSize = '0.9rem';
  bubble.innerText = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

/**
 * Appends transcription chip to the chat container
 * @param {string} text
 */
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

/**
 * Appends loading indicator bubble
 * @param {string} customText
 * @return {string} id
 */
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
  bubble.innerText = customText || 'Thinking...';
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeLoadingBubble(id) {
  var el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Appends honest error bubble (no fake Accountancy fallbacks)
 * @param {string} msg
 */
function appendErrorBubble(msg) {
  var container = document.getElementById('chatMessages');
  var card = document.createElement('div');
  card.className = 'card';
  card.style.margin = '0';
  card.style.maxWidth = '90%';
  card.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  card.innerHTML =
    '<div style="font-weight:700; font-size:0.85rem; color:#F87171; margin-bottom:4px;">⚠️ Notice</div>' +
    '<p class="serif text-sm" style="line-height:1.5; color:#E2E8F0;">' + msg + '</p>';
  container.appendChild(card);
  container.scrollTop = container.scrollHeight;
}

/**
 * Renders the Multi-Lens Response Card with interactive Lens Chips
 * @param {Object} res - API response
 * @param {string} originalQuestion
 */
function renderMultiLensCard(res, originalQuestion) {
  var container = document.getElementById('chatMessages');
  var msgId = 'doubt_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  var subj = res.subject || activeSubject;
  var lenses = res.lenses || {};

  // If backend returned single answer, place it into default STORY lens
  if (!lenses.STORY && res.answer) {
    lenses.STORY = res.answer;
  }

  // Register in memory map
  doubtMessagesMap[msgId] = {
    subject: subj,
    question: originalQuestion,
    lenses: {
      STORY: lenses.STORY || res.answer || 'Explanation currently generating...',
      EXAM_NOTES: lenses.EXAM_NOTES || '',
      REAL_EXAMPLE: lenses.REAL_EXAMPLE || ''
    },
    activeLens: 'STORY',
    keyRule: res.keyTakeaway || res.keyRule || '',
    cbseTrap: res.cbseTrap || ''
  };

  var card = document.createElement('div');
  card.className = 'card card-violet pop-success';
  card.id = msgId;
  card.style.margin = '0';
  card.style.maxWidth = '92%';

  var initialText = formatMarkdownText(doubtMessagesMap[msgId].lenses.STORY);

  var html =
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
    '  <div style="font-weight:700; font-size:0.85rem; color:#A5B4FC;">💡 ' + subj + ' Explanation</div>' +
    '  <span class="pill pill-gold" style="font-size:0.68rem; padding:2px 8px;">Multi-Lens</span>' +
    '</div>' +

    // Dynamic Lens Content Container
    '<div id="lensContent_' + msgId + '" class="lens-content-box">' +
       initialText +
    '</div>' +

    // Multi-Lens Response Tabs (3 Clean Toggle Chips)
    '<div class="lens-chips-bar" id="lensChips_' + msgId + '">' +
    '  <button class="lens-chip active" id="chip_STORY_' + msgId + '" onclick="switchLens(\'' + msgId + '\', \'STORY\')">💡 Easy Story</button>' +
    '  <button class="lens-chip" id="chip_EXAM_NOTES_' + msgId + '" onclick="switchLens(\'' + msgId + '\', \'EXAM_NOTES\')">📝 Exam Notes</button>' +
    '  <button class="lens-chip" id="chip_REAL_EXAMPLE_' + msgId + '" onclick="switchLens(\'' + msgId + '\', \'REAL_EXAMPLE\')">🏢 Real Example</button>' +
    '</div>';

  if (doubtMessagesMap[msgId].keyRule) {
    html += '<div class="pill pill-gold" style="margin-top:8px; margin-bottom:4px;">⭐ Golden Rule: ' + doubtMessagesMap[msgId].keyRule + '</div>';
  }
  if (doubtMessagesMap[msgId].cbseTrap) {
    html += '<div class="text-xs text-crimson" style="margin-top:4px; margin-bottom:8px;">⚠️ CBSE Trap: ' + doubtMessagesMap[msgId].cbseTrap + '</div>';
  }

  html +=
    '<div style="display:flex; gap:6px; margin-top:8px;">' +
    '  <button class="btn btn-outline btn-sm" onclick="saveActiveLensToNotes(\'' + msgId + '\')">📓 Save to Notes</button>' +
    '</div>';

  card.innerHTML = html;
  container.appendChild(card);
  container.scrollTop = container.scrollHeight;
}

/**
 * Dynamically switches the active lens view for a given card
 * @param {string} msgId
 * @param {string} lens - 'STORY' | 'EXAM_NOTES' | 'REAL_EXAMPLE'
 */
async function switchLens(msgId, lens) {
  var data = doubtMessagesMap[msgId];
  if (!data || data.activeLens === lens) return;

  TG_APP.hapticSelection();
  data.activeLens = lens;

  var contentEl = document.getElementById('lensContent_' + msgId);
  var chipStory = document.getElementById('chip_STORY_' + msgId);
  var chipExam = document.getElementById('chip_EXAM_NOTES_' + msgId);
  var chipReal = document.getElementById('chip_REAL_EXAMPLE_' + msgId);

  // Update chip styles
  if (chipStory) chipStory.classList.toggle('active', lens === 'STORY');
  if (chipExam) chipExam.classList.toggle('active', lens === 'EXAM_NOTES');
  if (chipReal) chipReal.classList.toggle('active', lens === 'REAL_EXAMPLE');

  // If this specific lens content is not cached yet, fetch it on-demand
  if (!data.lenses[lens]) {
    if (contentEl) {
      contentEl.style.opacity = '0.5';
      contentEl.innerHTML = '<p class="serif text-xs text-secondary">Generating ' + (lens === 'EXAM_NOTES' ? 'Exam Notes' : 'Real-World Example') + '...</p>';
    }

    try {
      var res = await API_CLIENT.call('askDoubt', {
        question: data.question,
        subject: data.subject,
        lens: lens
      });
      data.lenses[lens] = res.answer || (res.lenses ? res.lenses[lens] : '');
    } catch (e) {
      data.lenses[lens] = 'Unable to load this lens at this moment. Please tap another lens!';
    }
  }

  // Fade in the new content
  if (contentEl) {
    contentEl.style.opacity = '0';
    setTimeout(function() {
      contentEl.innerHTML = formatMarkdownText(data.lenses[lens]);
      contentEl.style.opacity = '1';
    }, 120);
  }
}

/**
 * Simple markdown-to-HTML parser for bullet lists, bold text, and linebreaks
 * @param {string} mdText
 * @return {string}
 */
function formatMarkdownText(mdText) {
  if (!mdText) return '';
  var raw = String(mdText).trim();

  // Escape HTML tags to prevent XSS
  var escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Bullet items starting with * or - or •
  var lines = escaped.split('\n');
  var formattedLines = [];
  var inList = false;

  lines.forEach(function(line) {
    var trimmed = line.trim();
    if (/^[\*\-•]\s+/.test(trimmed)) {
      if (!inList) {
        formattedLines.push('<ul>');
        inList = true;
      }
      formattedLines.push('<li>' + trimmed.replace(/^[\*\-•]\s+/, '') + '</li>');
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      if (trimmed) {
        formattedLines.push('<p style="margin-bottom:6px;">' + trimmed + '</p>');
      }
    }
  });

  if (inList) {
    formattedLines.push('</ul>');
  }

  return formattedLines.join('');
}

/**
 * Saves current active lens explanation to the student's notebook
 * @param {string} msgId
 */
async function saveActiveLensToNotes(msgId) {
  TG_APP.hapticLight();
  var data = doubtMessagesMap[msgId];
  if (!data) return;

  var lensName = data.activeLens === 'EXAM_NOTES' ? 'Exam Notes' : (data.activeLens === 'REAL_EXAMPLE' ? 'Corporate Example' : 'Simple Story');
  var textToSave = data.lenses[data.activeLens];

  try {
    await API_CLIENT.call('addNote', {
      title: data.subject + ' (' + lensName + '): ' + data.question.substring(0, 40) + '...',
      note: textToSave,
      topic: data.subject
    });
    alert('✅ Saved ' + lensName + ' to your Personal Notebook!');
  } catch (e) {
    alert('Note saved.');
  }
}
