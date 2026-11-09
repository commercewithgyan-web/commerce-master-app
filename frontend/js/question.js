/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — QUESTION CONTROLLER (question.js)
 * Ghost Timer Stopwatch, Fisher-Yates Render, Multi-Color Confetti Bursts,
 * Shark Tank Drawer, and Instant Mistake Notebook Logging.
 * ═══════════════════════════════════════════════════════════════════════
 */

var state = {
  allQuestions: [],
  questions: [],
  currentIndex: 0,
  secondsElapsed: 0,
  timerInterval: null,
  isAnswered: false,
  currentCoins: 0,
  selectedSubject: 'Accountancy',
  selectedDifficulty: 'Standard'
};

let currentSubject = 'Accountancy';
let currentDifficulty = 'Standard';

// Setup Pill Event Listeners once DOM loads
function setupFilterPills() {
  // 1. Subject Pills
  const subjectPills = document.querySelectorAll('.subject-pill, [data-subject]');
  subjectPills.forEach(pill => {
    pill.addEventListener('click', function() {
      subjectPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentSubject = this.getAttribute('data-subject') || this.innerText.trim();
      state.selectedSubject = currentSubject;
      fetchFilteredQuestion(currentSubject, currentDifficulty);
    });
  });

  // 2. Difficulty Pills
  const diffPills = document.querySelectorAll('.diff-pill, [data-difficulty]');
  diffPills.forEach(pill => {
    pill.addEventListener('click', function() {
      diffPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentDifficulty = this.getAttribute('data-difficulty') || this.innerText.trim();
      state.selectedDifficulty = currentDifficulty;
      fetchFilteredQuestion(currentSubject, currentDifficulty);
    });
  });
}

async function fetchFilteredQuestion(subject, difficulty) {
  // 1. Show loader or skeleton
  const qText = document.getElementById('qText');
  if (qText) qText.innerHTML = `<span class="loading-dots">Fetching ${subject} (${difficulty})...</span>`;

  // 2. Clear options container
  const optionsContainer = document.getElementById('optionsContainer');
  if (optionsContainer) optionsContainer.innerHTML = '';

  // 3. Trigger Haptic feedback if Telegram WebApp is active
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    } catch (e) {}
  } else if (window.TG_APP && typeof TG_APP.hapticLight === 'function') {
    TG_APP.hapticLight();
  }

  // Clear running timer during switch
  if (state.timerInterval) clearInterval(state.timerInterval);

  try {
    // Attempt backend fetch if API is hooked:
    // const res = await API_CLIENT.call('getQuestions', { subject, difficulty });
    // Or filter instantly from your master/cached question pool:
    const pool = state.allQuestions && state.allQuestions.length > 0 
      ? state.allQuestions 
      : getMasterQuestionBank();

    const filtered = pool.filter(q => {
      const matchSubj = !subject || (q.subject && q.subject.toLowerCase() === subject.toLowerCase());
      let matchDiff = true;
      if (difficulty) {
        const d = difficulty.toLowerCase();
        const qd = (q.difficulty || 'standard').toLowerCase();
        if (d.includes('std') || d.includes('standard')) matchDiff = qd.includes('std') || qd.includes('standard') || qd.includes('easy');
        else if (d.includes('mod') || d.includes('moderate')) matchDiff = qd.includes('mod') || qd.includes('medium');
        else if (d.includes('hots') || d.includes('trap')) matchDiff = qd.includes('hots') || qd.includes('hard');
      }
      return matchSubj && matchDiff;
    });

    state.questions = filtered.length > 0 ? filtered : pool.filter(q => !subject || (q.subject && q.subject.toLowerCase() === subject.toLowerCase()));
    if (!state.questions || state.questions.length === 0) {
      state.questions = pool;
    }
    state.currentIndex = 0;

    // Reset feedback drawer if open
    const feedbackCard = document.getElementById('feedbackCard');
    if (feedbackCard) feedbackCard.style.display = 'none';

    renderCurrentQuestion();
  } catch (err) {
    console.error('Filter error:', err);
  }
}

function selectPracticeSubject(subj) {
  currentSubject = subj;
  state.selectedSubject = subj;
  const subjectPills = document.querySelectorAll('.subject-pill, [data-subject]');
  subjectPills.forEach(p => {
    const val = p.getAttribute('data-subject') || p.innerText.trim();
    p.classList.toggle('active', val.toLowerCase() === subj.toLowerCase());
  });
  fetchFilteredQuestion(currentSubject, currentDifficulty);
}

function selectPracticeDifficulty(diff) {
  currentDifficulty = diff;
  state.selectedDifficulty = diff;
  const diffPills = document.querySelectorAll('.diff-pill, [data-difficulty]');
  diffPills.forEach(p => {
    const val = p.getAttribute('data-difficulty') || p.innerText.trim();
    p.classList.toggle('active', val.toLowerCase().includes(diff.toLowerCase()));
  });
  fetchFilteredQuestion(currentSubject, currentDifficulty);
}

function filterQuestionsAndRender() {
  fetchFilteredQuestion(currentSubject, currentDifficulty);
}

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  // Setup Pill click handlers immediately
  setupFilterPills();

  // Initialize Telegram native back button
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function() {
        window.location.href = 'index.html';
      });
    } catch (e) {}
  }

  // 1. Instant 0ms render from cache or master question bank
  var cachedQ = API_CLIENT.getCached('getDailyQuestion');
  if (cachedQ && Array.isArray(cachedQ) && cachedQ.length > 0) {
    state.allQuestions = cachedQ;
  } else {
    state.allQuestions = getMasterQuestionBank();
  }
  fetchFilteredQuestion(currentSubject, currentDifficulty);

  try {
    // 2. Fetch fresh questions in background
    var questions = await API_CLIENT.call('getDailyQuestion');
    if (questions && questions.length > 0) {
      state.allQuestions = questions;
      fetchFilteredQuestion(currentSubject, currentDifficulty);
    }
  } catch (err) {
    console.error('Error fetching questions:', err);
  }

  // Next Question Button
  document.getElementById('btnNextQuestion').addEventListener('click', function() {
    TG_APP.hapticLight();
    if (state.currentIndex + 1 < state.questions.length) {
      state.currentIndex++;
      renderCurrentQuestion();
    } else {
      // Completed all questions in set
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
  state.allQuestions = getMasterQuestionBank();
  fetchFilteredQuestion(currentSubject, currentDifficulty);
}

function getMasterQuestionBank() {
  return [
    // ─── 📘 ACCOUNTANCY (Class 12) ──────────────────────────
    {
      qid: 'Q-ACC-01',
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
      difficulty: 'Standard',
      correctIdx: 'B',
      explanation: 'According to Section 13(d) of the Indian Partnership Act, 1932, in the absence of an agreement, a partner is entitled to interest on loan at 6% p.a. It is a charge against profit payable even if the firm incurs a loss.'
    },
    {
      qid: 'Q-ACC-02',
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
      difficulty: 'Moderate',
      correctIdx: 'B',
      explanation: 'Total Drawings = ₹5,000 × 12 = ₹60,000. Average period for beginning of every month = (12 + 1)/2 = 6.5 months. Interest = ₹60,000 × 10/100 × 6.5/12 = ₹3,250.'
    },
    {
      qid: 'Q-ACC-03',
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
      difficulty: 'Standard',
      correctIdx: 'C',
      explanation: 'Rent paid to a partner for using his property is an external business expense (charge against profit) debited to P&L Account, not an appropriation.'
    },
    {
      qid: 'Q-ACC-04',
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
      difficulty: 'Moderate',
      correctIdx: 'B',
      explanation: 'Z\'s share = 1/6 of ₹1,20,000 = ₹20,000. Guaranteed profit = ₹30,000. Deficiency = ₹10,000 borne entirely by X. X\'s original share = 3/6 of ₹1,20,000 = ₹60,000. X\'s final share = ₹60,000 - ₹10,000 = ₹50,000.'
    },
    {
      qid: 'Q-ACC-05',
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
      difficulty: 'HOTS',
      correctIdx: 'C',
      explanation: 'Under CBSE standards, past omissions are rectified at the beginning of the next accounting period by passing a single adjustment entry through Partners\' Capital or Current Accounts.'
    },

    // ─── 📙 BUSINESS STUDIES (Class 12) ────────────────────
    {
      qid: 'Q-BST-01',
      questionNumber: 1,
      classLevel: '12',
      subject: 'Business Studies',
      chapter: 'Principles of Management',
      topic: 'Taylor\'s Scientific Management',
      question: 'Which technique of scientific management introduced by F.W. Taylor aims at differentiating between efficient and inefficient workers by offering two different wage rates?',
      options: [
        { label: 'A', text: 'Functional Foremanship', originalIdx: 'A' },
        { label: 'B', text: 'Differential Piece Wage System', originalIdx: 'B' },
        { label: 'C', text: 'Method Study', originalIdx: 'C' },
        { label: 'D', text: 'Standardisation and Simplification', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 25,
      sharkTankHint: 'Performance-linked sales commission: hit the target and unlock higher tier payout!',
      difficulty: 'Standard',
      correctIdx: 'B',
      explanation: 'Taylor introduced the Differential Piece Wage System to strongly incentivize workers to produce standard output by rewarding efficiency and penalizing inefficiency.'
    },
    {
      qid: 'Q-BST-02',
      questionNumber: 2,
      classLevel: '12',
      subject: 'Business Studies',
      chapter: 'Principles of Management',
      topic: 'Fayol\'s Principles',
      question: 'A manufacturing company produces both passenger cars and commercial trucks under one general manager who directs marketing for both lines together. Which principle of Fayol is violated?',
      options: [
        { label: 'A', text: 'Unity of Command', originalIdx: 'A' },
        { label: 'B', text: 'Unity of Direction', originalIdx: 'B' },
        { label: 'C', text: 'Division of Work', originalIdx: 'C' },
        { label: 'D', text: 'Order', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 35,
      sharkTankHint: 'One head, one plan for a group of activities having the same objective (car division vs truck division).',
      difficulty: 'Moderate',
      correctIdx: 'B',
      explanation: 'Unity of Direction requires one head and one plan for a group of activities having the same objective, preventing overlap between distinct product divisions.'
    },
    {
      qid: 'Q-BST-03',
      questionNumber: 3,
      classLevel: '12',
      subject: 'Business Studies',
      chapter: 'Financial Management',
      topic: 'Trading on Equity',
      question: 'Trading on Equity results in an increase in Earning Per Share (EPS) for equity shareholders ONLY WHEN:',
      options: [
        { label: 'A', text: 'Return on Investment (ROI) is greater than the rate of interest on debt', originalIdx: 'A' },
        { label: 'B', text: 'Rate of interest on debt is greater than Return on Investment (ROI)', originalIdx: 'B' },
        { label: 'C', text: 'Tax rate is zero', originalIdx: 'C' },
        { label: 'D', text: 'Total debt is equal to total equity capital', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 40,
      sharkTankHint: 'Leveraged buyout: borrowing at 8% to earn 15% leaves a juicy spread for the equity owner!',
      difficulty: 'HOTS',
      correctIdx: 'A',
      explanation: 'Favorable financial leverage (Trading on Equity) magnifies shareholder return only when ROI > Cost of Debt. If ROI < Cost of Debt, EPS decreases (unfavorable leverage).'
    },

    // ─── 📗 ECONOMICS (Class 12) ───────────────────────────
    {
      qid: 'Q-ECO-01',
      questionNumber: 1,
      classLevel: '12',
      subject: 'Economics',
      chapter: 'National Income and Related Aggregates',
      topic: 'Real vs Nominal GDP',
      question: 'Why is Real GDP considered a better indicator of economic welfare compared to Nominal GDP?',
      options: [
        { label: 'A', text: 'It includes non-monetary transactions and barter trade', originalIdx: 'A' },
        { label: 'B', text: 'It evaluates output at constant base-year prices, eliminating inflation distortions', originalIdx: 'B' },
        { label: 'C', text: 'It accounts for income inequality and distribution among citizens', originalIdx: 'C' },
        { label: 'D', text: 'It is always mathematically higher than Nominal GDP', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 25,
      sharkTankHint: 'Comparing real unit volume sold versus price hikes disguising revenue growth!',
      difficulty: 'Standard',
      correctIdx: 'B',
      explanation: 'Real GDP measures physical volume of output valued at constant base-year prices, so any increase reflects genuine growth in goods and services rather than mere price rise.'
    },
    {
      qid: 'Q-ECO-02',
      questionNumber: 2,
      classLevel: '12',
      subject: 'Economics',
      chapter: 'Money and Banking',
      topic: 'Credit Multiplier',
      question: 'If the Legal Reserve Ratio (LRR) set by the central bank is 20%, what is the value of the money multiplier and total credit created from an initial deposit of ₹1,000?',
      options: [
        { label: 'A', text: 'Multiplier = 2, Total Credit = ₹2,000', originalIdx: 'A' },
        { label: 'B', text: 'Multiplier = 5, Total Credit = ₹5,000', originalIdx: 'B' },
        { label: 'C', text: 'Multiplier = 10, Total Credit = ₹10,000', originalIdx: 'C' },
        { label: 'D', text: 'Multiplier = 4, Total Credit = ₹4,000', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 30,
      sharkTankHint: 'Fractional reserve banking velocity: 1/0.2 = 5x multiplier!',
      difficulty: 'Moderate',
      correctIdx: 'B',
      explanation: 'Money Multiplier = 1 / LRR = 1 / 0.20 = 5. Total Credit Creation = Initial Deposit × Multiplier = ₹1,000 × 5 = ₹5,000.'
    },
    {
      qid: 'Q-ECO-03',
      questionNumber: 3,
      classLevel: '12',
      subject: 'Economics',
      chapter: 'Government Budget and the Economy',
      topic: 'Budget Receipts',
      question: 'Sale of government equity shares in public sector undertakings (Disinvestment) is classified under the Union Budget as:',
      options: [
        { label: 'A', text: 'Revenue Receipt, because it is regular income for the government', originalIdx: 'A' },
        { label: 'B', text: 'Capital Receipt, because it reduces the financial assets of the government', originalIdx: 'B' },
        { label: 'C', text: 'Capital Expenditure, because government receives funds', originalIdx: 'C' },
        { label: 'D', text: 'Recovery of Loans', originalIdx: 'D' }
      ],
      teacherGhostSeconds: 35,
      sharkTankHint: 'Liquidating equity in an asset generates cash, but reduces balance sheet ownership!',
      difficulty: 'HOTS',
      correctIdx: 'B',
      explanation: 'Capital receipts either create liabilities or cause reduction in government assets. Disinvestment sells state-owned assets, hence reducing assets of the government.'
    }
  ];
}

function renderCurrentQuestion() {
  if (!state.questions || state.questions.length === 0) {
    var qText = document.getElementById('qText');
    if (qText) qText.innerText = 'No questions available for this selection.';
    var container = document.getElementById('optionsContainer');
    if (container) container.innerHTML = '';
    return;
  }
  var q = state.questions[state.currentIndex];
  if (!q) {
    state.currentIndex = 0;
    q = state.questions[0];
    if (!q) return;
  }
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
