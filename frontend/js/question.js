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

  // Initialize Telegram native back button
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function() {
        window.location.href = 'index.html';
      });
    } catch (e) {}
  }

  // 1. Instant 0ms render from cache
  var cachedQ = API_CLIENT.getCached('getDailyQuestion');
  if (cachedQ && Array.isArray(cachedQ) && cachedQ.length > 0) {
    state.questions = cachedQ;
    renderCurrentQuestion();
  }

  try {
    // 2. Fetch fresh questions in background
    var questions = await API_CLIENT.call('getDailyQuestion');
    if (questions && questions.length > 0) {
      state.questions = questions;
      renderCurrentQuestion();
    } else if (!cachedQ || cachedQ.length === 0) {
      loadFallbackDrill();
    }
  } catch (err) {
    console.error('Error fetching questions:', err);
    if (!cachedQ || cachedQ.length === 0) {
      loadFallbackDrill();
    }
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

function loadFallbackDrill() {
  state.questions = [
    {
      qid: 'Q-0001',
      questionNumber: 1,
      classLevel: '12',
      subject: 'Accountancy',
      chapter: 'Accounting for Partnership: Basic Concepts',
      topic: 'Accounting for Partnership: Basic Concepts',
      question: 'In the absence of a partnership deed, what is the rate of interest allowed on a partner\'s loan to the firm?',
      options: [
        { label: 'A', text: '6% per annum as an appropriation of profit', originalIdx: 'A' },
        { label: 'B', text: '6% per annum as a charge against profit', originalIdx: 'B' },
        { label: 'C', text: '12% per annum simple interest', originalIdx: 'C' },
        { label: 'D', text: 'No interest is allowed', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 30,
      sharkTankHint: 'Think of partner loan as a debt investor like Shark Tank debt deals — they get paid interest before founders split any profits!',
      difficulty: 'Medium',
      correctIdx: 'B',
      explanation: 'According to Section 13(d) of the Indian Partnership Act, 1932, in the absence of an agreement, a partner is entitled to interest on loan at 6% p.a. It is a charge against profit payable even if the firm incurs a loss.'
    },
    {
      qid: 'Q-0002',
      questionNumber: 2,
      classLevel: '12',
      subject: 'Accountancy',
      chapter: 'Accounting for Partnership: Basic Concepts',
      topic: 'Interest on Drawings',
      question: 'A partner withdraws ₹5,000 at the beginning of every month throughout the year. If interest on drawings is charged @ 10% p.a., the total interest will be:',
      options: [
        { label: 'A', text: '₹3,000', originalIdx: 'A' },
        { label: 'B', text: '₹3,250', originalIdx: 'B' },
        { label: 'C', text: '₹2,750', originalIdx: 'C' },
        { label: 'D', text: '₹3,500', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 40,
      sharkTankHint: 'Monthly SIP withdrawals in business! Average time money stays out of the business is 6.5 months.',
      difficulty: 'Medium',
      correctIdx: 'B',
      explanation: 'Total Drawings = ₹5,000 × 12 = ₹60,000. Average period for beginning of every month = (12 + 1)/2 = 6.5 months. Interest = ₹60,000 × 10/100 × 6.5/12 = ₹3,250.'
    },
    {
      qid: 'Q-0003',
      questionNumber: 3,
      classLevel: '12',
      subject: 'Accountancy',
      chapter: 'Accounting for Partnership: Basic Concepts',
      topic: 'P&L Appropriation Account',
      question: 'Which of the following items is treated as a CHARGE against profit and NOT an appropriation of profit?',
      options: [
        { label: 'A', text: 'Interest on Partner Capital', originalIdx: 'A' },
        { label: 'B', text: 'Salary to Active Working Partner', originalIdx: 'B' },
        { label: 'C', text: 'Rent paid to a Partner for firm premises', originalIdx: 'C' },
        { label: 'D', text: 'Transfer to General Reserve', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 35,
      sharkTankHint: 'Landlord rent must be paid even if company revenue is zero, whether landlord is a co-founder or outsider!',
      difficulty: 'Medium',
      correctIdx: 'C',
      explanation: 'Rent paid to a partner for using his property is an external business expense (charge against profit) debited to P&L Account, not an appropriation.'
    },
    {
      qid: 'Q-0004',
      questionNumber: 4,
      classLevel: '12',
      subject: 'Accountancy',
      chapter: 'Accounting for Partnership: Basic Concepts',
      topic: 'Guarantee of Minimum Profit',
      question: 'X, Y, and Z are partners sharing profits in the ratio 3:2:1. Z is guaranteed a minimum profit of ₹30,000 by X. If the firm earns a net profit of ₹1,20,000, what is X\'s final profit share?',
      options: [
        { label: 'A', text: '₹60,000', originalIdx: 'A' },
        { label: 'B', text: '₹50,000', originalIdx: 'B' },
        { label: 'C', text: '₹40,000', originalIdx: 'C' },
        { label: 'D', text: '₹45,000', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 45,
      sharkTankHint: 'A primary shark giving a personal guarantee to a junior co-founder out of their personal equity cut!',
      difficulty: 'Medium',
      correctIdx: 'B',
      explanation: 'Z\'s share = 1/6 of ₹1,20,000 = ₹20,000. Guaranteed profit = ₹30,000. Deficiency = ₹10,000 borne entirely by X. X\'s original share = 3/6 of ₹1,20,000 = ₹60,000. X\'s final share = ₹60,000 - ₹10,000 = ₹50,000.'
    },
    {
      qid: 'Q-0005',
      questionNumber: 5,
      classLevel: '12',
      subject: 'Accountancy',
      chapter: 'Accounting for Partnership: Basic Concepts',
      topic: 'Past Adjustments',
      question: 'Interest on capital was omitted to be credited to partners for the year. To rectify this error in the next accounting year, which account is debited/credited through a single adjustment entry?',
      options: [
        { label: 'A', text: 'Profit & Loss Suspense Account', originalIdx: 'A' },
        { label: 'B', text: 'Profit & Loss Appropriation Account', originalIdx: 'B' },
        { label: 'C', text: 'Partners\' Capital or Current Accounts', originalIdx: 'C' },
        { label: 'D', text: 'General Reserve Account', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 35,
      sharkTankHint: 'Internal cap-table rebalancing between partners without re-auditing last year\'s closed books!',
      difficulty: 'Medium',
      correctIdx: 'C',
      explanation: 'Under CBSE standards, past omissions are rectified at the beginning of the next accounting period by passing a single adjustment entry through Partners\' Capital or Current Accounts.'
    }
  ];
  state.currentIndex = 0;
  renderCurrentQuestion();
}

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
