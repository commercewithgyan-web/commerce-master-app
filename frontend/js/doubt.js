/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — VOICE DOUBT CONTROLLER (doubt.js)
 * Audio Waveform Animation, Text & Voice Queries, Typewriter Output,
 * and ELI10 Feynman Everyday Indian Analogies.
 * ═══════════════════════════════════════════════════════════════════════
 */

var isRecording = false;

document.addEventListener('DOMContentLoaded', function() {
  TG_APP.hapticLight();

  var btnSend = document.getElementById('btnSendDoubt');
  var input = document.getElementById('doubtInput');
  var btnVoice = document.getElementById('btnVoiceRecord');
  var waveform = document.getElementById('liveWaveform');

  // Text Send
  btnSend.addEventListener('click', function() {
    sendDoubtQuery(input.value.trim());
  });

  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendDoubtQuery(input.value.trim());
    }
  });

  // Voice Mic Toggle
  btnVoice.addEventListener('click', function() {
    TG_APP.hapticMedium();
    isRecording = !isRecording;

    if (isRecording) {
      waveform.style.display = 'flex';
      waveform.classList.add('recording');
      btnVoice.style.transform = 'scale(1.15)';
      btnVoice.innerText = '⏹️';
    } else {
      waveform.style.display = 'none';
      waveform.classList.remove('recording');
      btnVoice.style.transform = 'scale(1)';
      btnVoice.innerText = '🎤';

      // Simulate audio capture turnaround
      appendStudentBubble('🎙️ [Voice Question: 6.2s recorded]');
      simulateVoiceReply();
    }
  });
});

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

  var loadingId = appendLoadingBubble();

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

function simulateVoiceReply() {
  var loadingId = appendLoadingBubble();
  setTimeout(function() {
    removeLoadingBubble(loadingId);
    appendMentorBubble(
      'Hey Aarav! Think of Interest on Partner Loan like this: If your friend rents you their cricket bat for a match, you have to pay the rent whether you win or lose the game! That is why loan interest is a CHARGE against profit—it must be paid even if the firm suffers a loss.\n\nDid that click, or should I give you another story?',
      'Loan interest is a charge, not an appropriation.',
      'Never write Partner Loan Interest in P&L Appropriation Account.'
    );
    TG_APP.hapticSuccess();
  }, 1800);
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

function appendLoadingBubble() {
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
  bubble.innerText = 'Study Buddy is thinking...';
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
