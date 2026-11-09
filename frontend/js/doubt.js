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
var speechRecognizer = null;
var liveSpokenTranscript = '';
var autoStopTimer = null;
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
 * and concurrently runs Web Speech Recognition for real-time transcription.
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
    liveSpokenTranscript = '';

    // Hybrid Web Speech API real-time listener (Chrome, Android, iOS Safari)
    var SpeechRecClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecClass) {
      try {
        speechRecognizer = new SpeechRecClass();
        speechRecognizer.lang = 'en-IN';
        speechRecognizer.continuous = true;
        speechRecognizer.interimResults = true;
        speechRecognizer.maxAlternatives = 1;

        speechRecognizer.onresult = function(event) {
          var interim = '';
          var final = '';
          for (var i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          liveSpokenTranscript = (final || interim).trim();
          var statusText = document.getElementById('recordingStatusText');
          if (statusText && liveSpokenTranscript) {
            statusText.innerText = 'Hearing: "' + liveSpokenTranscript + '"';
          }
        };

        speechRecognizer.onerror = function(event) {
          console.warn('SpeechRecognition notice:', event.error);
        };

        speechRecognizer.start();
      } catch (e) {
        console.warn('SpeechRecognition start failed, fallback to audio only:', e);
      }
    }

    mediaRecorder.ondataavailable = function(e) {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async function() {
      if (autoStopTimer) clearTimeout(autoStopTimer);
      // Release microphone tracks
      stream.getTracks().forEach(function(track) { track.stop(); });

      var durationSec = Math.max(1, Math.round((Date.now() - recordStartTime) / 1000));
      if (audioChunks.length === 0) return;

      var chosenMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
      var audioBlob = new Blob(audioChunks, { type: chosenMime });

      var spokenText = (liveSpokenTranscript || '').trim();

      // Show real spoken words in user bubble
      if (spokenText) {
        appendStudentBubble('🎙️ "' + spokenText + '"');
      } else {
        appendStudentBubble('🎙️ [' + activeSubject + ' Voice Question: ' + durationSec + 's recorded]');
      }

      var loadingId = appendLoadingBubble('Thinking and crafting 3-lens explanation...');

      async function processVoiceQuery(base64Data) {
        try {
          var res = await API_CLIENT.call('askDoubt', {
            subject: activeSubject,
            question: spokenText,
            audioBase64: base64Data || '',
            mimeType: chosenMime,
            duration: durationSec,
            lens: 'ALL'
          });

          removeLoadingBubble(loadingId);

          if (res.isRejected) {
            TG_APP.hapticWarning();
            appendErrorBubble(res.message || 'Sorry, your voice was not clear. Please speak closer to the mic and ask again!');
          } else {
            TG_APP.hapticSuccess();
            renderMultiLensCard(res, spokenText || res.transcribed || 'Voice Question');
          }
        } catch (err) {
          removeLoadingBubble(loadingId);
          TG_APP.hapticError();
          appendErrorBubble('Unable to connect: ' + (err.message || JSON.stringify(err)));
        }
      }

      // If spoken words were captured, dispatch immediately without waiting for Base64 conversion!
      if (spokenText) {
        processVoiceQuery('');
      } else {
        var reader = new FileReader();
        reader.onloadend = function() {
          var base64Audio = reader.result.split(',')[1];
          processVoiceQuery(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
      }
    };

    mediaRecorder.start(250);
    isRecording = true;

    // Auto-stop after 6 seconds of recording
    if (autoStopTimer) clearTimeout(autoStopTimer);
    autoStopTimer = setTimeout(function() {
      if (isRecording) {
        stopVoiceRecording();
      }
    }, 6000);

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
  if (autoStopTimer) clearTimeout(autoStopTimer);
  if (speechRecognizer) {
    try { speechRecognizer.stop(); } catch (e) {}
  }
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
  var statusText = document.getElementById('recordingStatusText');
  if (statusText) statusText.innerText = 'Tap to speak your doubt aloud';
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
    // Honest, truthful diagnostic error display
    appendErrorBubble('Unable to connect: ' + (err.message || JSON.stringify(err)));
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
  card.className = 'card card-violet pop-success doubt-response-card';
  card.id = msgId;

  // Normalize lens data
  var lensData = {
    story: res.story || (res.lenses ? res.lenses.STORY : '') || res.answer || '',
    exam_notes: res.exam_notes || (res.lenses ? res.lenses.EXAM_NOTES : '') || '',
    real_example: res.real_example || (res.lenses ? res.lenses.REAL_EXAMPLE : '') || '',
    golden_rule: res.golden_rule || res.keyRule || res.keyTakeaway || '',
    cbse_trap: res.cbse_trap || res.cbseTrap || '',
    subject: subj,
    question: originalQuestion
  };

  card.dataset.lenses = JSON.stringify(lensData);
  card.dataset.activeLens = 'story';
  doubtMessagesMap[msgId] = lensData;

  var initialHtml = formatMarkdown(lensData.story);

  var html =
    // Card Title Row
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
    '  <div style="font-weight:700; font-size:0.88rem; color:#A5B4FC;">💡 ' + subj + ' Explanation</div>' +
    '  <span class="pill pill-gold" style="font-size:0.68rem; padding:2px 8px;">Multi-Lens</span>' +
    '</div>' +

    // Top Lens Switcher Tabs (Strict 3-Column Grid right below title)
    '<div class="lens-tabs" id="lensTabs_' + msgId + '">' +
    '  <button class="lens-tab active" id="tab_story_' + msgId + '" onclick="switchLensTab(\'' + msgId + '\', \'story\')">💡 Story</button>' +
    '  <button class="lens-tab" id="tab_exam_notes_' + msgId + '" onclick="switchLensTab(\'' + msgId + '\', \'exam_notes\')">📝 Exam Notes</button>' +
    '  <button class="lens-tab" id="tab_real_example_' + msgId + '" onclick="switchLensTab(\'' + msgId + '\', \'real_example\')">🏢 Real Example</button>' +
    '</div>' +

    // Dynamic Lens Content Container
    '<div id="lensBody_' + msgId + '" class="lens-content-box" style="margin-top:10px;">' +
       initialHtml +
    '</div>';

  if (lensData.golden_rule) {
    html += '<div class="pill pill-gold" style="margin-top:10px; margin-bottom:4px; font-size:0.75rem;">⭐ Golden Rule: ' + formatMarkdown(lensData.golden_rule) + '</div>';
  }
  if (lensData.cbse_trap) {
    html += '<div class="text-xs text-crimson" style="margin-top:4px; margin-bottom:8px; font-size:0.75rem;">⚠️ CBSE Trap: ' + formatMarkdown(lensData.cbse_trap) + '</div>';
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
 * Instantly switches active lens mode from card.dataset.lenses with ZERO lag
 * @param {string} msgId
 * @param {string} lensKey - 'story' | 'exam_notes' | 'real_example'
 */
function switchLensTab(msgId, lensKey) {
  var card = document.getElementById(msgId);
  if (!card) return;

  // 1. Tactile haptic feedback on tab switch!
  TG_APP.hapticLight();

  // 2. Read stored JSON object from card dataset
  var data = {};
  try {
    data = JSON.parse(card.dataset.lenses || '{}');
  } catch (e) {
    data = doubtMessagesMap[msgId] || {};
  }

  card.dataset.activeLens = lensKey;

  // 3. Update tab active styles
  var tabStory = document.getElementById('tab_story_' + msgId);
  var tabNotes = document.getElementById('tab_exam_notes_' + msgId);
  var tabReal = document.getElementById('tab_real_example_' + msgId);

  if (tabStory) tabStory.classList.toggle('active', lensKey === 'story');
  if (tabNotes) tabNotes.classList.toggle('active', lensKey === 'exam_notes');
  if (tabReal) tabReal.classList.toggle('active', lensKey === 'real_example');

  // 4. Instant switch without any network lag
  var bodyEl = document.getElementById('lensBody_' + msgId);
  if (bodyEl) {
    var rawText = data[lensKey] || 'Explanation for this perspective is being generated...';
    bodyEl.innerHTML = formatMarkdown(rawText);
  }
}

// Backward compatibility alias for any caller using switchLens
function switchLens(msgId, lens) {
  var mapKey = (lens === 'EXAM_NOTES' ? 'exam_notes' : (lens === 'REAL_EXAMPLE' ? 'real_example' : 'story'));
  switchLensTab(msgId, mapKey);
}

/**
 * Clean markdown-to-HTML formatter parsing **bold**, *italic*, numbered lists, and bullets
 * @param {string} text
 * @return {string}
 */
function formatMarkdown(text) {
  if (!text) return '';
  var str = String(text).trim();

  // Bold **text** -> <strong>text</strong>
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic *text* -> <em>text</em>
  str = str.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');

  // Numbered points e.g. 1. **Nature of Item**: ...
  str = str.replace(/^[\t ]*(\d+)\.[\t ]+(.+)$/gm, '<div style="margin-left: 4px; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 8px;"><span style="color: #A5B4FC; font-weight: 700;">$1.</span><span>$2</span></div>');

  // Bullet items e.g. • or - or *
  str = str.replace(/^[\t ]*[\-\•][\t ]+(.+)$/gm, '<div style="margin-left: 4px; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 8px;"><span style="color: #D4AF37; font-weight: bold;">•</span><span>$1</span></div>');

  // Convert newlines to breaks
  str = str.replace(/\n\n+/g, '<br><br>');
  str = str.replace(/\n/g, '<br>');

  return str;
}

// Backward compatibility alias for formatMarkdownText
function formatMarkdownText(text) {
  return formatMarkdown(text);
}

/**
 * Saves current active lens explanation to the student's notebook
 * @param {string} msgId
 */
async function saveActiveLensToNotes(msgId) {
  TG_APP.hapticLight();
  var card = document.getElementById(msgId);
  var data = {};
  try {
    data = JSON.parse((card && card.dataset.lenses) || '{}');
  } catch (e) {
    data = doubtMessagesMap[msgId] || {};
  }

  var activeLens = (card && card.dataset.activeLens) || 'story';
  var lensName = activeLens === 'exam_notes' ? 'Exam Notes' : (activeLens === 'real_example' ? 'Real Example' : 'Story');
  var textToSave = data[activeLens] || '';

  var questionText = data.question || 'Doubt';
  if (questionText.length > 70) questionText = questionText.substring(0, 68) + '…';
  var noteTitle = '(' + lensName + '): ' + questionText;

  try {
    await API_CLIENT.call('addNote', {
      title: noteTitle,
      note: textToSave,
      topic: data.subject || activeSubject
    });
    alert('✅ Saved ' + lensName + ' to your Personal Notebook!');
  } catch (e) {
    alert('Note saved.');
  }
}
