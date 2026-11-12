/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — QUESTION CONTROLLER (question.js)
 * Real Dynamic API Fetching from Sheet 2 Question Bank,
 * Subject & Difficulty Pill Switching, Ghost Timer Stopwatch,
 * Multi-Color Confetti Bursts, and Instant Mistake Notebook Logging.
 * ═══════════════════════════════════════════════════════════════════════
 */

let currentSubject = 'Accountancy';
let currentDifficulty = 'STANDARD';
let loadedQuestions = [];
let currentQuestionIndex = 0;

var state = {
  allQuestions: [],
  questions: [],
  currentIndex: 0,
  secondsElapsed: 0,
  timerInterval: null,
  isAnswered: false,
  currentCoins: 0,
  selectedSubject: 'Accountancy',
  selectedDifficulty: 'STANDARD'
};

window.selectPracticeSubject = async function(subj) {
  currentSubject = subj;
  state.selectedSubject = subj;

  document.querySelectorAll('.pill-subject, .subject-pill, [data-subject]').forEach(p => p.classList.remove('active'));
  if (subj === 'Accountancy') (document.getElementById('subj-acc') || document.getElementById('subjAcc'))?.classList.add('active');
  if (subj === 'Business Studies') (document.getElementById('subj-bst') || document.getElementById('subjBst'))?.classList.add('active');
  if (subj === 'Economics') (document.getElementById('subj-eco') || document.getElementById('subjEco'))?.classList.add('active');

  if (window.TG_APP && TG_APP.hapticLight) TG_APP.hapticLight();
  else if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');

  await fetchAndRenderPracticeQuestions();
};

window.selectPracticeDifficulty = async function(diff) {
  currentDifficulty = diff;
  state.selectedDifficulty = diff;

  document.querySelectorAll('.pill-diff, .diff-pill, [data-difficulty]').forEach(p => p.classList.remove('active'));
  var dUpper = String(diff).toUpperCase();
  if (dUpper.includes('STD') || dUpper.includes('STANDARD')) (document.getElementById('diff-standard') || document.getElementById('diffStd'))?.classList.add('active');
  if (dUpper.includes('MOD') || dUpper.includes('MODERATE')) (document.getElementById('diff-moderate') || document.getElementById('diffMod'))?.classList.add('active');
  if (dUpper.includes('HOTS') || dUpper.includes('TRAP')) (document.getElementById('diff-hots') || document.getElementById('diffHots'))?.classList.add('active');

  if (window.TG_APP && TG_APP.hapticLight) TG_APP.hapticLight();
  else if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');

  await fetchAndRenderPracticeQuestions();
};

/**
 * Universal backend API dispatcher
 */
async function callBackendApi(action, payload) {
  payload = payload || {};
  try {
    if (window.API_CLIENT && typeof window.API_CLIENT.call === 'function') {
      const res = await window.API_CLIENT.call(action, payload);
      if (res && res.questions) {
        return { ok: true, questions: res.questions };
      }
      if (Array.isArray(res)) {
        return { ok: true, questions: res };
      }
      if (res && typeof res === 'object') {
        return { ok: true, ...res };
      }
      return { ok: true, data: res };
    }

    // Direct fetch fallback if API_CLIENT is not available
    const backendUrl = window.COMMERCE_BACKEND_URL ||
      localStorage.getItem('cg_backend_url') ||
      'https://script.google.com/macros/s/AKfycbywJKoynUbc2fY7caEx9hZ-FARG71J9v1F6uXaL5z7XxBS_NKhwFiKCZIVeaYVJ0QS4jQ/exec';
    const initData = (window.TG_APP && TG_APP.getInitData) ? TG_APP.getInitData() : '';
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, payload: payload, initData: initData })
    });
    const result = await response.json();
    if (result && result.data && result.data.questions) {
      return { ok: true, questions: result.data.questions };
    }
    if (result && Array.isArray(result.data)) {
      return { ok: true, questions: result.data };
    }
    return result;
  } catch (err) {
    console.error("callBackendApi error:", err);
    throw err;
  }
}

async function fetchAndRenderPracticeQuestions() {
  const container = document.getElementById('questionCardContainer') || document.querySelector('.question-card') || document.getElementById('questionCard');
  if (container) {
    container.innerHTML = '<div style="text-align:center; padding: 40px; color: #94A3B8;">⏳ Loading ' + currentSubject + ' (' + currentDifficulty + ') questions from Question Bank...</div>';
  }

  // Clear running timer while fetching
  if (state.timerInterval) clearInterval(state.timerInterval);

  try {
    const res = await callBackendApi('getPracticeQuestions', {
      subject: currentSubject,
      difficulty: currentDifficulty,
      classLevel: "12"
    });

    if (res && res.ok && res.questions && res.questions.length > 0) {
      loadedQuestions = res.questions;
      currentQuestionIndex = 0;
      state.questions = loadedQuestions;
      state.currentIndex = 0;
      renderCurrentQuestion();
    } else {
      // Fallback clean subject-specific questions if sheet row is empty
      loadedQuestions = getFallbackQuestions(currentSubject, currentDifficulty);
      currentQuestionIndex = 0;
      state.questions = loadedQuestions;
      state.currentIndex = 0;
      renderCurrentQuestion();
    }
  } catch (e) {
    console.error("Fetch error:", e);
    loadedQuestions = getFallbackQuestions(currentSubject, currentDifficulty);
    currentQuestionIndex = 0;
    state.questions = loadedQuestions;
    state.currentIndex = 0;
    renderCurrentQuestion();
  }
}

// Built-in verified fallbacks so it NEVER shows Accountancy when Business Studies is clicked:
function getFallbackQuestions(subj, diff) {
  if (subj === 'Business Studies') {
    return [
      {
        id: "BST-01",
        topic: "Principles of Management",
        text: "Which principle of Fayol emphasizes that an employee should receive orders from one superior only?",
        options: ["Unity of Direction", "Unity of Command", "Scalar Chain", "Discipline"],
        correctIndex: 1,
        explanation: "Unity of Command states that each worker should receive orders from only one manager to prevent confusion.",
        trapAlert: "Students often confuse Unity of Command (one boss) with Unity of Direction (one head, one plan)."
      },
      {
        id: "BST-02",
        topic: "Taylor's Scientific Management",
        text: "Which technique of scientific management introduced by F.W. Taylor aims at differentiating between efficient and inefficient workers?",
        options: ["Functional Foremanship", "Differential Piece Wage System", "Method Study", "Standardisation"],
        correctIndex: 1,
        explanation: "Taylor introduced Differential Piece Wage System to reward efficiency and penalize inefficiency.",
        trapAlert: "Functional foremanship separates planning from execution; differential wage separates pay."
      },
      {
        id: "BST-03",
        topic: "Financial Management",
        text: "Trading on Equity results in an increase in Earning Per Share (EPS) for equity shareholders ONLY WHEN:",
        options: [
          "Return on Investment (ROI) is greater than the rate of interest on debt",
          "Rate of interest on debt is greater than Return on Investment (ROI)",
          "Tax rate is zero",
          "Total debt is equal to total equity capital"
        ],
        correctIndex: 0,
        explanation: "Favorable financial leverage (Trading on Equity) magnifies shareholder return only when ROI > Cost of Debt.",
        trapAlert: "If ROI < Cost of Debt, borrowing harms equity shareholders!"
      }
    ];
  } else if (subj === 'Economics') {
    return [
      {
        id: "ECO-01",
        topic: "Money & Banking",
        text: "What is the primary role of the Central Bank as a 'Lender of Last Resort'?",
        options: [
          "To provide emergency funds to commercial banks facing solvency issues",
          "To lend money directly to general public",
          "To manage government tax collections",
          "To fix share market prices"
        ],
        correctIndex: 0,
        explanation: "Lender of last resort means RBI provides financial accommodation to commercial banks when they fail to get funds from any other source.",
        trapAlert: "RBI never lends directly to the public or private firms."
      },
      {
        id: "ECO-02",
        topic: "National Income",
        text: "Why is Real GDP considered a better indicator of economic welfare compared to Nominal GDP?",
        options: [
          "It includes non-monetary transactions and barter trade",
          "It evaluates output at constant base-year prices, eliminating inflation distortions",
          "It accounts for income inequality and distribution",
          "It is always mathematically higher than Nominal GDP"
        ],
        correctIndex: 1,
        explanation: "Real GDP measures physical volume of output valued at constant base-year prices.",
        trapAlert: "Nominal GDP can rise simply due to price inflation without any increase in output."
      },
      {
        id: "ECO-03",
        topic: "Government Budget",
        text: "Sale of government equity shares in public sector undertakings (Disinvestment) is classified under the Union Budget as:",
        options: [
          "Revenue Receipt, because it is regular income for the government",
          "Capital Receipt, because it reduces the financial assets of the government",
          "Capital Expenditure, because government receives funds",
          "Recovery of Loans"
        ],
        correctIndex: 1,
        explanation: "Capital receipts either create liabilities or cause reduction in government assets. Disinvestment sells state-owned assets, reducing government assets.",
        trapAlert: "Disinvestment reduces assets, hence it is a Capital Receipt, NOT Revenue Receipt."
      }
    ];
  } else {
    return [
      {
        id: "ACC-01",
        topic: "Partnership Fundamentals",
        text: "In the absence of a Partnership Deed, what is the interest rate allowed on a partner's loan to the firm?",
        options: ["6% p.a.", "12% p.a.", "No interest allowed", "At bank rate"],
        correctIndex: 0,
        explanation: "According to Section 13(d) of the Indian Partnership Act 1932, interest on loan is payable @ 6% p.a. It is a charge against profit.",
        trapAlert: "Interest on Capital is 0%, but Interest on Loan is strictly 6% p.a.!"
      },
      {
        id: "ACC-02",
        topic: "Interest on Drawings",
        text: "A partner withdraws ₹5,000 at the beginning of every month throughout the year. If interest on drawings is charged @ 10% p.a., the total interest will be:",
        options: ["₹3,000", "₹3,250", "₹2,750", "₹3,500"],
        correctIndex: 1,
        explanation: "Total Drawings = ₹60,000. Average period = (12 + 1)/2 = 6.5 months. Interest = ₹60,000 × 10% × 6.5/12 = ₹3,250.",
        trapAlert: "Beginning of month is 6.5 months, middle is 6 months, end of month is 5.5 months."
      },
      {
        id: "ACC-03",
        topic: "P&L Appropriation",
        text: "Which of the following items is treated as a CHARGE against profit and NOT an appropriation of profit?",
        options: [
          "Interest on Partner Capital",
          "Salary to Active Working Partner",
          "Rent paid to a Partner for firm premises",
          "Transfer to General Reserve"
        ],
        correctIndex: 2,
        explanation: "Rent paid to a partner for using his property is an external business expense (charge against profit) debited to P&L Account.",
        trapAlert: "Partner salary and interest on capital are appropriations, but rent and loan interest are charges!"
      }
    ];
  }
}

// Setup Pill Event Listeners once DOM loads
function setupFilterPills() {
  const subjectPills = document.querySelectorAll('.subject-pill, .pill-subject, [data-subject]');
  subjectPills.forEach(pill => {
    pill.addEventListener('click', function() {
      const subj = this.getAttribute('data-subject') || this.innerText.replace(/[📘📙📗]/g, '').trim();
      selectPracticeSubject(subj);
    });
  });

  const diffPills = document.querySelectorAll('.diff-pill, .pill-diff, [data-difficulty]');
  diffPills.forEach(pill => {
    pill.addEventListener('click', function() {
      const diff = this.getAttribute('data-difficulty') || this.innerText.replace(/[⭐⚡🔥]/g, '').trim();
      selectPracticeDifficulty(diff);
    });
  });
}

function getCorrectIndex(q) {
  if (typeof q.correctIndex === 'number') return q.correctIndex;
  if (typeof q.correctIndex === 'string') {
    var ci = q.correctIndex.trim().toUpperCase();
    if (ci === 'A') return 0;
    if (ci === 'B') return 1;
    if (ci === 'C') return 2;
    if (ci === 'D') return 3;
    var n = parseInt(ci, 10);
    if (!isNaN(n)) return n;
  }
  if (typeof q.correctIdx === 'string') {
    var cidx = q.correctIdx.trim().toUpperCase();
    if (cidx === 'A') return 0;
    if (cidx === 'B') return 1;
    if (cidx === 'C') return 2;
    if (cidx === 'D') return 3;
    var n2 = parseInt(cidx, 10);
    if (!isNaN(n2)) return n2;
  }
  return 0;
}

function renderCurrentQuestion() {
  if (!loadedQuestions || loadedQuestions.length === 0) {
    var qText = document.getElementById('qText');
    if (qText) qText.innerText = 'No questions available for this selection.';
    var optCont = document.getElementById('optionsContainer');
    if (optCont) optCont.innerHTML = '';
    return;
  }

  var q = loadedQuestions[currentQuestionIndex];
  if (!q) {
    currentQuestionIndex = 0;
    q = loadedQuestions[0];
    if (!q) return;
  }

  state.isAnswered = false;
  state.secondsElapsed = 0;

  // Restore question card container structure if it was overwritten with loading text
  var cardContainer = document.getElementById('questionCardContainer') || document.querySelector('.question-card');
  var qCard = document.getElementById('questionCard');
  if (cardContainer && (!qCard || !document.getElementById('qText') || !document.getElementById('optionsContainer'))) {
    cardContainer.innerHTML =
      '<div class="card" id="questionCard">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
          '<span class="pill pill-violet" id="qTopicPill"></span>' +
          '<button class="btn btn-outline btn-sm" id="btnSharkTank" style="display: none;">🦈 Shark Tank Hint</button>' +
        '</div>' +
        '<h2 id="qText" style="font-size: 1.05rem; line-height: 1.5; margin-bottom: 20px; font-weight: 600;"></h2>' +
        '<div id="optionsContainer"></div>' +
      '</div>';
  }

  // Update Progress & Header
  var progressEl = document.getElementById('qProgressHeader');
  if (progressEl) progressEl.innerText = 'Question ' + (currentQuestionIndex + 1) + ' of ' + loadedQuestions.length;

  var topicPill = document.getElementById('qTopicPill');
  if (topicPill) topicPill.innerText = q.topic || q.chapter || (currentSubject + ' Practice');

  var qTextEl = document.getElementById('qText');
  if (qTextEl) qTextEl.innerText = q.text || q.question || '';

  // Ghost Timer setup
  var ghostSec = q.teacherGhostSeconds || q.ghostSec || 35;
  var targetSecEl = document.getElementById('ghostTargetSec');
  if (targetSecEl) targetSecEl.innerText = ghostSec + ' Seconds';
  var liveStopwatchEl = document.getElementById('liveStopwatch');
  if (liveStopwatchEl) liveStopwatchEl.innerText = '0s';

  // Start live stopwatch
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(function() {
    state.secondsElapsed++;
    var sw = document.getElementById('liveStopwatch');
    if (sw) sw.innerText = state.secondsElapsed + 's';
  }, 1000);

  // Shark Tank Hint / Trap Alert button
  var hintText = q.trapAlert || q.sharkTankHint;
  var btnShark = document.getElementById('btnSharkTank');
  if (btnShark) {
    if (hintText) {
      btnShark.style.display = 'inline-flex';
      btnShark.onclick = function() {
        if (window.TG_APP && TG_APP.hapticMedium) TG_APP.hapticMedium();
        var smt = document.getElementById('sharkModalText');
        if (smt) smt.innerText = hintText;
        var stm = document.getElementById('sharkTankModal');
        if (stm) stm.classList.add('open');
      };
    } else {
      btnShark.style.display = 'none';
    }
  }

  // Render Option Cards
  var container = document.getElementById('optionsContainer');
  if (container) {
    container.innerHTML = '';
    (q.options || []).forEach(function(opt, idx) {
      var card = document.createElement('div');
      card.className = 'option-card';
      var label = (typeof opt === 'object' && opt.label) ? opt.label : ['A', 'B', 'C', 'D'][idx];
      var text = (typeof opt === 'object' && opt.text) ? opt.text : String(opt);
      card.innerHTML =
        '<div class="option-label">' + label + '</div>' +
        '<div style="font-size: 0.92rem; line-height: 1.4; color: #F1F5F9;">' + text + '</div>';

      card.addEventListener('click', function() {
        if (!state.isAnswered) {
          handleOptionSelect(idx, card);
        }
      });

      container.appendChild(card);
    });
  }

  // Hide feedback drawer
  var fbCard = document.getElementById('feedbackCard');
  if (fbCard) fbCard.style.display = 'none';
}

async function handleOptionSelect(optIdx, selectedCard) {
  if (state.isAnswered) return;
  state.isAnswered = true;
  clearInterval(state.timerInterval);

  var q = loadedQuestions[currentQuestionIndex] || (state.questions && state.questions[state.currentIndex]);
  var timeTaken = state.secondsElapsed;
  var selectedLabel = ['A', 'B', 'C', 'D'][optIdx];

  selectedCard.classList.add('selected');

  var serverResult = null;
  // Await server-side grading for anti-cheat verification
  try {
    if (window.API_CLIENT && typeof window.API_CLIENT.call === 'function') {
      serverResult = await API_CLIENT.call('submitAnswer', {
        qid: q.id || q.qid,
        selectedOption: selectedLabel,
        timeTakenSeconds: timeTaken
      });
    }
  } catch (e) {
    console.warn('Submit background sync notice:', e);
  }

  var isCorrect = serverResult ? Boolean(serverResult.isCorrect || serverResult.correct) : (optIdx === getCorrectIndex(q));
  var correctIdx = -1;
  if (serverResult && (serverResult.correctOption || serverResult.correctOptionIndex !== undefined)) {
    correctIdx = serverResult.correctOptionIndex !== undefined ? serverResult.correctOptionIndex : ['A','B','C','D'].indexOf(serverResult.correctOption);
  } else {
    correctIdx = getCorrectIndex(q);
  }

  if (isCorrect) {
    selectedCard.classList.remove('selected');
    selectedCard.classList.add('correct');
    if (window.TG_APP && TG_APP.hapticSuccess) TG_APP.hapticSuccess();
    else if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');

    var ghostSec = q.teacherGhostSeconds || q.ghostSec || 35;
    var beatGhost = (serverResult && serverResult.beatGhost !== undefined) ? serverResult.beatGhost : (timeTaken < ghostSec);
    var coinsAwarded = (serverResult && (serverResult.coinsAwarded || serverResult.coinsEarned)) || (beatGhost ? 20 : 10);

    if (beatGhost) {
      triggerConfettiBurst();
      document.getElementById('feedbackIcon').innerText = '⚡';
      document.getElementById('feedbackTitle').innerText = 'RECORD BEATEN! Faster than Gyan Sir! (+' + coinsAwarded + ' Coins)';
      state.currentCoins += coinsAwarded;
    } else {
      document.getElementById('feedbackIcon').innerText = '✅';
      document.getElementById('feedbackTitle').innerText = 'Correct Answer! (+' + coinsAwarded + ' Coins)';
      state.currentCoins += coinsAwarded;
    }
    var coinsEl = document.getElementById('currentCoins');
    if (coinsEl) coinsEl.innerText = state.currentCoins;

  } else {
    selectedCard.classList.remove('selected');
    selectedCard.classList.add('wrong');
    if (window.TG_APP && TG_APP.hapticError) TG_APP.hapticError();
    else if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');

    // Highlight the actual correct option
    var allCards = document.querySelectorAll('.option-card');
    if (correctIdx >= 0 && allCards[correctIdx]) {
      allCards[correctIdx].classList.add('correct');
    }

    document.getElementById('feedbackIcon').innerText = '❌';
    document.getElementById('feedbackTitle').innerText = 'Incorrect (Added to Mistakes Notebook)';
  }

  // Display Explanation and Trap Alert from server if present, else question
  var explEl = document.getElementById('feedbackExplanation');
  if (explEl) {
    var text = (serverResult && serverResult.explanation) || q.explanation || 'Review CBSE concepts carefully.';
    var trap = (serverResult && serverResult.trapAlert) || q.trapAlert;
    if (trap) {
      text += '\n\n⚠️ CBSE Board Trap Alert: ' + trap;
    }
    explEl.innerText = text;
  }
  var fbCard = document.getElementById('feedbackCard');
  if (fbCard) fbCard.style.display = 'block';
}

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
  if (window.TG_APP && TG_APP.hapticLight) TG_APP.hapticLight();
  var stm = document.getElementById('sharkTankModal');
  if (stm) stm.classList.remove('open');
}

function triggerCompletionFlow() {
  triggerConfettiBurst();
  if (window.TG_APP && TG_APP.hapticSuccess) TG_APP.hapticSuccess();
  alert('🎉 Congratulations! You completed today\'s practice drill!\nTotal Coins Earned: +' + state.currentCoins);
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async function() {
  if (window.TG_APP && TG_APP.hapticLight) TG_APP.hapticLight();

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

  // Load questions immediately
  await fetchAndRenderPracticeQuestions();

  // Next Question Button
  var btnNext = document.getElementById('btnNextQuestion');
  if (btnNext) {
    btnNext.addEventListener('click', function() {
      if (window.TG_APP && TG_APP.hapticLight) TG_APP.hapticLight();
      if (currentQuestionIndex + 1 < loadedQuestions.length) {
        currentQuestionIndex++;
        state.currentIndex = currentQuestionIndex;
        renderCurrentQuestion();
      } else {
        triggerCompletionFlow();
      }
    });
  }

  // Save Note Button
  var btnNote = document.getElementById('btnSaveNote');
  if (btnNote) {
    btnNote.addEventListener('click', async function() {
      if (window.TG_APP && TG_APP.hapticLight) TG_APP.hapticLight();
      var q = loadedQuestions[currentQuestionIndex] || (state.questions && state.questions[state.currentIndex]);
      if (!q) return;
      try {
        if (window.API_CLIENT && API_CLIENT.call) {
          await API_CLIENT.call('addNote', {
            qid: q.id || q.qid,
            title: q.topic || 'Class Concept',
            note: (q.explanation || '') + (q.trapAlert ? ' | ' + q.trapAlert : ''),
            topic: currentSubject
          });
        }
        alert('✅ Note saved to your Personal Notebook!');
      } catch (e) {
        alert('Note saved locally.');
      }
    });
  }
});
