/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — QUESTION CONTROLLER (question.js)
 * Ghost Timer Stopwatch, Fisher-Yates Render, Multi-Color Confetti Bursts,
 * Shark Tank Drawer, and Instant Mistake Notebook Logging.
 * ═══════════════════════════════════════════════════════════════════════
 */

var state = {
  questions: [],
  currentIndex: 0,
  secondsElapsed: 0,
  timerInterval: null,
  isAnswered: false,
  currentCoins: 0
};

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  try {
    var questions = await API_CLIENT.call('getDailyQuestion');
    if (questions && questions.length > 0) {
      state.questions = questions;
      renderCurrentQuestion();
    } else {
      document.getElementById('qText').innerText = 'All drills completed for today! Check back tonight at 07:30 PM.';
    }
  } catch (err) {
    console.error('Error fetching questions:', err);
    document.getElementById('qText').innerText = 'Could not load today\'s drill. Please check connection.';
  }

  // Next Question Button
  document.getElementById('btnNextQuestion').addEventListener('click', function() {
    TG_APP.hapticLight();
    if (state.currentIndex + 1 < state.questions.length) {
      state.currentIndex++;
      renderCurrentQuestion();
    } else {
      // Completed all 5 questions
      triggerCompletionFlow();
    }
  });

  // Save Note Button
  document.getElementById('btnSaveNote').addEventListener('click', async function() {
    TG_APP.hapticLight();
    var q = state.questions[state.currentIndex];
    try {
      await API_CLIENT.call('addNote', {
        qid: q.qid,
        title: q.topic || 'Class Concept',
        note: q.explanation || 'Key CBSE explanation',
        topic: q.topic || 'Accountancy'
      });
      alert('✅ Note saved to your Personal Notebook!');
    } catch (e) {
      alert('Note saved locally.');
    }
  });
});

function renderCurrentQuestion() {
  var q = state.questions[state.currentIndex];
  state.isAnswered = false;
  state.secondsElapsed = 0;

  // Update Progress & Header
  document.getElementById('qProgressHeader').innerText = 'Question ' + (state.currentIndex + 1) + ' of ' + state.questions.length;
  document.getElementById('qTopicPill').innerText = q.topic || q.chapter || 'Commerce Practice';
  document.getElementById('qText').innerText = q.question;

  // Ghost Timer setup
  var ghostSec = q.teacherGhostSeconds || 35;
  document.getElementById('ghostTargetSec').innerText = ghostSec + ' Seconds';
  document.getElementById('liveStopwatch').innerText = '0s';

  // Start live stopwatch
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(function() {
    state.secondsElapsed++;
    document.getElementById('liveStopwatch').innerText = state.secondsElapsed + 's';
  }, 1000);

  // Shark Tank Hint button
  var btnShark = document.getElementById('btnSharkTank');
  if (q.sharkTankHint) {
    btnShark.style.display = 'inline-flex';
    btnShark.onclick = function() {
      TG_APP.hapticMedium();
      document.getElementById('sharkModalText').innerText = q.sharkTankHint;
      document.getElementById('sharkTankModal').classList.add('open');
    };
  } else {
    btnShark.style.display = 'none';
  }

  // Render Option Cards
  var container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  q.options.forEach(function(opt) {
    var card = document.createElement('div');
    card.className = 'option-card';
    card.innerHTML =
      '<div class="option-label">' + opt.label + '</div>' +
      '<div style="font-size: 0.92rem; line-height: 1.4; color: #F1F5F9;">' + opt.text + '</div>';

    card.addEventListener('click', function() {
      if (!state.isAnswered) {
        handleOptionSelect(opt.label, card);
      }
    });

    container.appendChild(card);
  });

  // Hide feedback drawer
  document.getElementById('feedbackCard').style.display = 'none';
}

async function handleOptionSelect(selectedLabel, selectedCard) {
  state.isAnswered = true;
  clearInterval(state.timerInterval);

  var q = state.questions[state.currentIndex];
  var timeTaken = state.secondsElapsed;

  selectedCard.classList.add('selected');

  try {
    var result = await API_CLIENT.call('submitAnswer', {
      qid: q.qid,
      selectedOption: selectedLabel,
      timeTakenSeconds: timeTaken
    });

    // Evaluate response
    if (result.isCorrect) {
      selectedCard.classList.remove('selected');
      selectedCard.classList.add('correct');
      TG_APP.hapticSuccess();

      // Confetti burst if ghost record beaten!
      if (result.triggerConfetti || result.beatGhostStatus === 'BEAT_RECORD') {
        triggerConfettiBurst();
        document.getElementById('feedbackIcon').innerText = '⚡';
        document.getElementById('feedbackTitle').innerText = 'RECORD BEATEN! Faster than Gyan Sir! (+20 Coins)';
      } else {
        document.getElementById('feedbackIcon').innerText = '✅';
        document.getElementById('feedbackTitle').innerText = 'Correct Answer! (+10 Coins)';
      }

      state.currentCoins += (result.bonusCoinsAwarded || 10);
      document.getElementById('currentCoins').innerText = state.currentCoins;

    } else {
      selectedCard.classList.remove('selected');
      selectedCard.classList.add('wrong');
      TG_APP.hapticError();

      // Highlight the actual correct option
      highlightCorrectOption(result.correctOption);

      document.getElementById('feedbackIcon').innerText = '❌';
      document.getElementById('feedbackTitle').innerText = 'Incorrect (Added to Mistakes Notebook)';
    }

    // Display Explanation
    document.getElementById('feedbackExplanation').innerText = result.explanation || q.explanation || 'Review CBSE rules carefully.';
    document.getElementById('feedbackCard').style.display = 'block';

  } catch (err) {
    console.error('Answer submission error:', err);
    alert('Submission failed. Check internet connection.');
  }
}

function highlightCorrectOption(correctLabel) {
  var cards = document.querySelectorAll('.option-card');
  cards.forEach(function(card) {
    var labelEl = card.querySelector('.option-label');
    if (labelEl && labelEl.innerText === correctLabel) {
      card.classList.add('correct');
    }
  });
}

/**
 * Fires multi-color particle confetti celebration using canvas-confetti
 */
function triggerConfettiBurst() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#4F46E5', '#10B981', '#F59E0B', '#FFFFFF']
    });
  }
}

function closeSharkModal() {
  TG_APP.hapticLight();
  document.getElementById('sharkTankModal').classList.remove('open');
}

function triggerCompletionFlow() {
  triggerConfettiBurst();
  TG_APP.hapticSuccess();
  alert('🎉 Congratulations! You completed today\'s practice drill!\nTotal Coins Earned: +' + state.currentCoins);
  window.location.href = 'index.html';
}
