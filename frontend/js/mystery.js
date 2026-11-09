/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — DETECTIVE CONTROLLER (mystery.js)
 * Saturday Corporate Audit Mysteries, Suspect Verdict Evaluation,
 * Confetti Burst, and "🕵️ Detective Investigator" Gold Badge.
 * ═══════════════════════════════════════════════════════════════════════
 */

var currentMysteryId = null;
var hasVoted = false;

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  try {
    var data = await API_CLIENT.call('getMystery');
    renderMystery(data);
  } catch (err) {
    console.error('Mystery load error:', err);
  }
});

function renderMystery(data) {
  if (!data) return;
  currentMysteryId = data.mysteryId;

  document.getElementById('mysteryChapter').innerText = data.chapter || 'Forensic Accounting';
  document.getElementById('mysteryTitle').innerText = data.scenarioTitle;
  document.getElementById('mysteryStory').innerText = data.storyText;

  var container = document.getElementById('suspectsContainer');
  container.innerHTML = '';

  (data.suspects || []).forEach(function(s, index) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.margin = '0';
    card.style.cursor = 'pointer';
    card.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
      '  <strong style="font-size:0.92rem; color:#818CF8;">' + s.name + '</strong>' +
      '  <span class="pill pill-violet">Suspect ' + (index + 1) + '</span>' +
      '</div>' +
      '<div class="serif text-xs text-secondary" style="line-height:1.4;">"' + s.claim + '"</div>';

    card.addEventListener('click', function() {
      if (!hasVoted) {
        submitVerdict(index + 1, card);
      }
    });

    container.appendChild(card);
  });
}

async function submitVerdict(suspectIdx, card) {
  hasVoted = true;
  TG_APP.hapticMedium();

  card.style.borderColor = 'var(--heritage-gold)';
  card.style.backgroundColor = 'rgba(212, 175, 55, 0.15)';

  try {
    var result = await API_CLIENT.call('submitMysteryVerdict', {
      mysteryId: currentMysteryId,
      suspectIndex: suspectIdx
    });

    var forensicCard = document.getElementById('forensicCard');
    forensicCard.style.display = 'block';
    forensicCard.classList.add('pop-success');

    if (result.isCorrect) {
      TG_APP.hapticSuccess();
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#818CF8', '#10B981']
        });
      }
      document.getElementById('verdictIcon').innerText = '🕵️';
      document.getElementById('verdictHeadline').innerText = 'BRILLIANT DEDUCTION! +25 CG Coins';
    } else {
      TG_APP.hapticError();
      document.getElementById('verdictIcon').innerText = '❌';
      document.getElementById('verdictHeadline').innerText = 'Incorrect Suspect';
    }

    document.getElementById('forensicExplanation').innerText = result.forensicExplanation;

  } catch (e) {
    alert('Verdict submitted.');
  }
}
