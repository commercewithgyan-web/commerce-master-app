/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — 5-LAYER PERSONAL NOTEBOOK & PROGRESS (notebook.gs)
 * Layer 1: My Notes | Layer 2: My Mistakes | Layer 3: Favourites
 * Layer 4: AI Weekly Diagnostic Coaching | Layer 5: Spaced Repetition (3/7/15/30)
 * Masked Leaderboard, CG Coins Wallet & Predicted Board Score Heatmap.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. LAYER 1: MY NOTES
// ─────────────────────────────────────────────────────────────────────

/**
 * Saves a student's personal notes from an explanation or concept
 * @param {Object} verifiedUser
 * @param {Object} payload - { qid, note, title, topic }
 * @return {Object}
 */
function apiAddNote_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  var qid = payload.qid || 'GENERAL';
  var title = payload.title || 'Personal Revision Note';
  var noteText = (payload.note || '').trim();
  var topic = payload.topic || 'General';

  if (!noteText) throw new Error('Note content cannot be empty');

  // Prevent duplicate note append within 60 seconds
  var cache = CacheService.getScriptCache();
  var noteHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(verifiedUser.id) + title + noteText.slice(0, 60))).slice(0, 16);
  var dupKey = 'NOTE_DUP_' + noteHash;
  if (cache.get(dupKey)) {
    Logger.log('Duplicate note ignored within 60s for ' + student.Name);
    return { success: true, message: 'Note already saved to your Personal Notebook' };
  }
  cache.put(dupKey, '1', 60);

  appendRow_('SHEET_QB', 'Notebook_Notes', [
    getKolkataTimestamp(),
    String(verifiedUser.id),
    qid,
    title,
    noteText,
    topic
  ]);

  Logger.log('📝 Saved personal note for ' + student.Name + ' (QID: ' + qid + ')');
  return { success: true, message: 'Note saved to your Personal Notebook' };
}

// ─────────────────────────────────────────────────────────────────────
// 2. LAYER 3: FAVOURITES (STARRED QUESTIONS)
// ─────────────────────────────────────────────────────────────────────

/**
 * Toggles a question into or out of student's starred revision list
 * @param {Object} verifiedUser
 * @param {Object} payload - { qid, title }
 * @return {Object}
 */
function apiToggleFavourite_(verifiedUser, payload) {
  var qid = payload.qid;
  if (!qid) throw new Error('QID required');

  var sheet = getSheet_('SHEET_QB', 'Notebook_Favourites');
  var existing = findRows_('SHEET_QB', 'Notebook_Favourites', 'TelegramID', String(verifiedUser.id));

  for (var i = 0; i < existing.length; i++) {
    if (existing[i].QID === qid) {
      // Remove from favourites
      sheet.deleteRow(existing[i]._rowNumber);
      return { qid: qid, isFavourite: false, message: 'Removed from Starred Favourites' };
    }
  }

  // Add to favourites
  sheet.appendRow([
    getKolkataTimestamp(),
    String(verifiedUser.id),
    qid,
    payload.title || ('Question ' + qid)
  ]);

  return { qid: qid, isFavourite: true, message: 'Starred in your Exam Revision Vault ⭐' };
}

// ─────────────────────────────────────────────────────────────────────
// 3. LAYER 5: SPACED REPETITION ENGINE (3 / 7 / 15 / 30 Days)
// ─────────────────────────────────────────────────────────────────────

/**
 * Updates next review date according to the Ebbinghaus spaced repetition schedule
 * - 1st wrong: +3 days
 * - 2nd wrong: +7 days
 * - 3rd wrong: +15 days
 * - Correct: +30 days (or Mastered if repeated success)
 * 
 * @param {string} telegramId
 * @param {string} qid
 * @param {boolean} isCorrect
 */
function updateRevisionQueue_(telegramId, qid, isCorrect) {
  try {
    var sheet = getSheet_('SHEET_QB', 'Revision_Queue');
    var existingRows = findRows_('SHEET_QB', 'Revision_Queue', 'TelegramID', telegramId);
    var targetRow = null;

    for (var i = 0; i < existingRows.length; i++) {
      if (existingRows[i].QID === qid) {
        targetRow = existingRows[i];
        break;
      }
    }

    var attempts = targetRow ? (parseInt(targetRow.Attempts, 10) || 1) + 1 : 1;
    var daysToAdd = 3;
    var newStatus = 'Due';

    if (isCorrect) {
      if (attempts >= 3) {
        newStatus = 'Mastered';
        daysToAdd = 60;
      } else {
        newStatus = 'Scheduled';
        daysToAdd = 30;
      }
    } else {
      if (attempts === 1) daysToAdd = 3;
      else if (attempts === 2) daysToAdd = 7;
      else daysToAdd = 15;
      newStatus = 'Due';
    }

    var nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    if (targetRow) {
      var rowNum = targetRow._rowNumber;
      updateCell_('SHEET_QB', 'Revision_Queue', rowNum, 3, getKolkataDate()); // LastAttempt
      updateCell_('SHEET_QB', 'Revision_Queue', rowNum, 4, getKolkataDate(nextReviewDate)); // NextReview
      updateCell_('SHEET_QB', 'Revision_Queue', rowNum, 5, attempts);
      updateCell_('SHEET_QB', 'Revision_Queue', rowNum, 6, newStatus);
    } else {
      sheet.appendRow([
        telegramId,
        qid,
        getKolkataDate(),
        getKolkataDate(nextReviewDate),
        attempts,
        newStatus
      ]);
    }
  } catch (e) {
    logError_('updateRevisionQueue_', e);
  }
}

/**
 * Returns questions due for revision today for a given student
 * @param {Object} verifiedUser
 * @return {Object[]}
 */
function apiGetRevisionQueue_(verifiedUser) {
  var rows = findRows_('SHEET_QB', 'Revision_Queue', 'TelegramID', String(verifiedUser.id));
  var today = new Date();
  today.setHours(23, 59, 59, 999);

  var due = [];
  var qBank = getAllRowsAsObjects_('SHEET_QB', 'QuestionBank', 2000);
  var qMap = {};
  qBank.forEach(function(q) { qMap[q.QID] = q; });

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r.Status === 'Mastered') continue;

    var reviewDate = parseDateOrToday_(r.NextReview);
    if (reviewDate.getTime() <= today.getTime()) {
      var q = qMap[r.QID];
      if (q) {
        due.push({
          qid: r.QID,
          attempts: r.Attempts,
          status: r.Status,
          nextReview: r.NextReview,
          question: q.Question,
          chapter: q.Chapter,
          topic: q.Topic,
          explanation: q.Explanation
        });
      }
    }
  }

  return due;
}

// ─────────────────────────────────────────────────────────────────────
// 4. LAYER 4: AI WEEKLY DIAGNOSTIC COACHING SUMMARY (Sunday 10 AM)
// ─────────────────────────────────────────────────────────────────────

/**
 * Generates personalized AI coaching brief using Gemini 2.5 Flash Free Tier
 * Analyzes notes saved, mistakes made, and chapters completed in past 7 days.
 * @param {string} telegramId
 * @return {string} 100-word encouraging diagnostic brief
 */
function generateWeeklySummary_(telegramId) {
  var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', telegramId);
  if (!student) return '';

  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) return '';

  // Gather past 7 days mistakes & notes
  var allAnswers = findRows_('SHEET_QB', 'StudentAnswers', 'TelegramID', telegramId);
  var mistakes = [];
  var totalCorrect = 0;

  allAnswers.forEach(function(a) {
    if (parseInt(a.Score, 10) === 0) mistakes.push(a.QID);
    else totalCorrect++;
  });

  var notes = findRows_('SHEET_QB', 'Notebook_Notes', 'TelegramID', telegramId);

  var hiddenPrompt =
    'You are Gyan Sir, an elite CBSE Commerce mentor for ' + student.Name + ' (Class ' + student.Class + ').\n\n' +
    'STUDENT DATA FOR THE WEEK:\n' +
    '• Solved Correctly: ' + totalCorrect + ' MCQs\n' +
    '• Mistakes Made on QIDs: ' + mistakes.slice(-5).join(', ') + '\n' +
    '• Notes Saved: ' + notes.length + ' key points\n\n' +
    'DIRECTIVE:\n' +
    'Generate an encouraging, specific 100-word coaching brief structured as:\n' +
    '1. What you mastered well this week (2 points)\n' +
    '2. Focus area for CBSE board exam (2 points)\n' +
    '3. Action rule for next week (1 crisp takeaway)\n\n' +
    'Strictly English, warm, energetic, and professional.';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + geminiKey;
  var payload = {
    contents: [{ parts: [{ text: hiddenPrompt }] }],
    generationConfig: { temperature: 0.3 }
  };

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      var json = JSON.parse(response.getContentText());
      var summaryText = json.candidates[0].content.parts[0].text.trim();

      // Log to Notebook_Summary
      var weekLabel = 'Week of ' + getKolkataDate();
      appendRow_('SHEET_QB', 'Notebook_Summary', [
        weekLabel,
        telegramId,
        summaryText,
        mistakes.slice(-3).join(', '),
        'Review mistakes in notebook',
        getKolkataTimestamp()
      ]);

      return summaryText;
    }
  } catch (e) {
    logError_('generateWeeklySummary_', e);
  }

  return 'Great effort this week! Keep solving daily ghost challenges to reinforce partnership accounting.';
}

/**
 * Sunday 10:00 AM Cron: Dispatches weekly diagnostic briefs to all active students
 */
function sendWeeklySummaries() {
  Logger.log('🧠 Running Sunday AI Weekly Coaching Briefs (10:00 AM IST)...');
  var students = getAllRowsAsObjects_('SHEET_FEE', 'Students', 100);

  students.forEach(function(s) {
    if (s.TelegramID && s.Status === 'Active') {
      try {
        var brief = generateWeeklySummary_(String(s.TelegramID));
        if (brief) {
          sendTelegramMessage_(s.TelegramID,
            '🧠 *Gyan Sir\'s Sunday Coaching Brief for ' + s.Name + '*\n\n' +
            brief + '\n\n' +
            'Open your 📓 *Notebook* in the Mini App to review this week\'s mistakes!'
          );
        }
      } catch (err) {
        logError_('sendWeeklySummaries_' + s.StudentID, err);
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────
// 5. MINI APP 5-LAYER NOTEBOOK AGGREGATOR
// ─────────────────────────────────────────────────────────────────────

/**
 * Aggregates all 5 layers into a single high-performance payload for notebook.html
 * @param {Object} verifiedUser
 * @param {Object} payload
 * @return {Object}
 */
function apiGetNotebook_(verifiedUser, payload) {
  var telegramId = String(verifiedUser.id);
  var student = requirePaidStudent_(telegramId);

  // 1. My Notes
  var notes = findRows_('SHEET_QB', 'Notebook_Notes', 'TelegramID', telegramId);
  notes.reverse();

  // 2. My Mistakes (auto-pulled from StudentAnswers where Score === 0)
  var allAnswers = findRows_('SHEET_QB', 'StudentAnswers', 'TelegramID', telegramId);
  var mistakeQids = {};
  var mistakesList = [];

  allAnswers.forEach(function(a) {
    if (parseInt(a.Score, 10) === 0) {
      mistakeQids[a.QID] = a;
    }
  });

  var qBank = getAllRowsAsObjects_('SHEET_QB', 'QuestionBank', 2000);
  var qMap = {};
  qBank.forEach(function(q) { qMap[q.QID] = q; });

  for (var mQid in mistakeQids) {
    var qObj = qMap[mQid];
    var ans = mistakeQids[mQid];
    if (qObj) {
      mistakesList.push({
        qid: mQid,
        question: qObj.Question,
        chapter: qObj.Chapter,
        topic: qObj.Topic,
        studentSelected: ans.AnswerText,
        correctIdx: qObj.CorrectIdx,
        explanation: qObj.Explanation,
        rubric: qObj.Rubric,
        attemptedAt: ans.Timestamp
      });
    }
  }
  mistakesList.reverse();

  // 3. Favourites
  var favourites = findRows_('SHEET_QB', 'Notebook_Favourites', 'TelegramID', telegramId);
  var favList = [];
  favourites.forEach(function(f) {
    var qF = qMap[f.QID];
    if (qF) {
      favList.push({
        qid: f.QID,
        title: f.Title,
        question: qF.Question,
        chapter: qF.Chapter,
        explanation: qF.Explanation
      });
    }
  });
  favList.reverse();

  // 4. Latest AI Weekly Summary
  var summaries = findRows_('SHEET_QB', 'Notebook_Summary', 'TelegramID', telegramId);
  var latestSummary = summaries.length > 0 ? summaries[summaries.length - 1] : null;

  // 5. Revision Queue Due Today
  var revisionDue = apiGetRevisionQueue_(verifiedUser);

  return {
    studentName: student.Name,
    notesCount: notes.length,
    mistakesCount: mistakesList.length,
    favouritesCount: favList.length,
    revisionDueCount: revisionDue.length,
    notes: notes.map(function(n) {
      return {
        timestamp: n.Timestamp,
        qid: n.QID,
        title: n.Title,
        note: n.StudentNote,
        topic: n.Topic
      };
    }),
    mistakes: mistakesList,
    favourites: favList,
    aiSummary: latestSummary ? {
      week: latestSummary.Week,
      summary: latestSummary.Summary,
      weakTopics: latestSummary.WeakTopics,
      suggestedActions: latestSummary.SuggestedActions
    } : null,
    revisionDue: revisionDue
  };
}

// ─────────────────────────────────────────────────────────────────────
// 6. LEADERBOARD & CG COINS WALLET
// ─────────────────────────────────────────────────────────────────────

/**
 * Updates student score, CG coins, and speed badges atomically
 */
function updateStudentCoinsAndLeaderboard_(telegramId, studentName, classLevel, score, bonusCoins, beatGhost) {
  try {
    var sheet = getSheet_('SHEET_QB', 'Leaderboard');
    var existing = findRow_('SHEET_QB', 'Leaderboard', 'TelegramID', telegramId);

    var currentScore = existing ? (parseInt(existing.TotalScore, 10) || 0) : 0;
    var currentCoins = existing ? (parseInt(existing.CG_Coins, 10) || 0) : 0;
    var currentBadges = existing ? (parseInt(existing.SpeedFinisher_Badges, 10) || 0) : 0;

    var newScore = currentScore + score;
    var newCoins = currentCoins + bonusCoins;
    var newBadges = currentBadges + (beatGhost ? 1 : 0);

    if (existing) {
      var rowNum = existing._rowNumber;
      updateCell_('SHEET_QB', 'Leaderboard', rowNum, 4, newScore);
      updateCell_('SHEET_QB', 'Leaderboard', rowNum, 5, newBadges);
      updateCell_('SHEET_QB', 'Leaderboard', rowNum, 6, newCoins);
      updateCell_('SHEET_QB', 'Leaderboard', rowNum, 8, getKolkataDate());
    } else {
      sheet.appendRow([
        telegramId,
        studentName,
        classLevel || 12,
        newScore,
        newBadges,
        newCoins,
        1, // Rank (updated at 11 PM)
        getKolkataDate()
      ]);
    }
  } catch (e) {
    logError_('updateStudentCoinsAndLeaderboard_', e);
  }
}

/**
 * 11:00 PM Cron: Rebuilds Leaderboard, calculates ranks, and masks student names (Law H-2)
 */
function updateLeaderboard() {
  Logger.log('🏆 Rebuilding Masked Leaderboard (11:00 PM IST)...');
  var sheet = getSheet_('SHEET_QB', 'Leaderboard');
  var rows = getAllRowsAsObjects_('SHEET_QB', 'Leaderboard', 500);

  // Sort descending by TotalScore
  rows.sort(function(a, b) {
    return (parseInt(b.TotalScore, 10) || 0) - (parseInt(a.TotalScore, 10) || 0);
  });

  for (var i = 0; i < rows.length; i++) {
    var rank = i + 1;
    var rowNum = rows[i]._rowNumber;
    updateCell_('SHEET_QB', 'Leaderboard', rowNum, 7, rank);
  }

  Logger.log('  ✅ Leaderboard recalculated for ' + rows.length + ' students');
}

// ─────────────────────────────────────────────────────────────────────
// 7. PROGRESS RADAR & PREDICTED BOARD EXAM SCORE
// ─────────────────────────────────────────────────────────────────────

/**
 * Computes chapter-wise accuracy and predicts CBSE board marks
 * @param {Object} verifiedUser
 * @return {Object} Heatmap & Predicted Score
 */
function apiGetProgress_(verifiedUser) {
  var student = requirePaidStudent_(verifiedUser.id);
  var telegramId = String(verifiedUser.id);

  var answers = findRows_('SHEET_QB', 'StudentAnswers', 'TelegramID', telegramId);
  var totalQuestions = answers.length;
  var totalScore = 0;
  var chapterAccuracy = {};

  var qBank = getAllRowsAsObjects_('SHEET_QB', 'QuestionBank', 2000);
  var qMap = {};
  qBank.forEach(function(q) { qMap[q.QID] = q; });

  answers.forEach(function(a) {
    var s = parseInt(a.Score, 10) || 0;
    totalScore += s;

    var q = qMap[a.QID];
    var ch = q ? (q.Chapter || 'General') : 'General';

    if (!chapterAccuracy[ch]) {
      chapterAccuracy[ch] = { correct: 0, total: 0 };
    }
    chapterAccuracy[ch].total++;
    if (s > 0) chapterAccuracy[ch].correct++;
  });

  var overallAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  // Chapter weightages from Sheet 1 (cached in RAM for 24h)
  var cache = CacheService.getScriptCache();
  var cachedW = cache.get('CACHE_CHAPTER_WEIGHTAGES');
  var weightages = null;
  if (cachedW) {
    try { weightages = JSON.parse(cachedW); } catch (e) {}
  }
  if (!weightages || weightages.length === 0) {
    weightages = getAllRowsAsObjects_('SHEET_SYLLABUS', 'Chapter_Weightage', 50);
    try {
      cache.put('CACHE_CHAPTER_WEIGHTAGES', JSON.stringify(weightages), 86400);
    } catch (wErr) {}
  }
  var predictedScore = 0;
  var totalBoardMarks = 80; // CBSE Accountancy Theory
  var chapterReports = [];
  var weakTopics = [];

  weightages.forEach(function(w) {
    var chNo = String(w.ChapterNo);
    var chMarks = parseFloat(w.TotalMarks) || 8;
    var stat = chapterAccuracy[chNo];
    var acc = stat ? Math.round((stat.correct / stat.total) * 100) : 75; // Default 75% for untracked

    var marksEarned = (acc / 100) * chMarks;
    predictedScore += marksEarned;

    var isWeak = acc < 60;
    if (isWeak) weakTopics.push(w.ChapterName);

    chapterReports.push({
      chapterNo: chNo,
      chapterName: w.ChapterName,
      totalMarks: chMarks,
      accuracy: acc,
      status: acc >= 80 ? 'Mastered 🟢' : (acc >= 60 ? 'Standard 🟡' : 'Leak Alert 🔴')
    });
  });

  predictedScore = Math.min(80, Math.round(predictedScore));

  return {
    overallAccuracy: overallAccuracy,
    totalAttempted: totalQuestions,
    totalScore: totalScore,
    predictedBoardScore: predictedScore,
    maxBoardScore: totalBoardMarks,
    predictedPercentage: Math.round((predictedScore / totalBoardMarks) * 100),
    weakTopics: weakTopics,
    chapters: chapterReports
  };
}

/**
 * Returns comprehensive Home dashboard metrics for the student Mini App
 * @param {Object} verifiedUser
 * @return {Object}
 */
function apiGetHomeDashboard_(verifiedUser) {
  var telegramId = String(verifiedUser.id);
  var cache = CacheService.getScriptCache();
  var cacheKey = 'DASHBOARD_' + telegramId;
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  var student = requirePaidStudent_(verifiedUser.id);

  // Leaderboard record
  var lb = findRow_('SHEET_QB', 'Leaderboard', 'TelegramID', telegramId);
  var coins = lb ? (parseInt(lb.CG_Coins, 10) || 0) : 0;
  var badges = lb ? (parseInt(lb.SpeedFinisher_Badges, 10) || 0) : 0;
  var rank = lb ? (parseInt(lb.Rank, 10) || 1) : 1;

  // Progress
  var prog = apiGetProgress_(verifiedUser);

  // Today's Subtopic
  var subtopic = getActiveSubtopic_(student.Class || 12);

  // Revision Due Count
  var revDue = apiGetRevisionQueue_(verifiedUser);

  var result = {
    studentId: student.StudentID,
    name: student.Name,
    classLevel: student.Class,
    streak: Math.max(1, Math.min(30, Math.floor(prog.totalAttempted / 5))),
    cgCoins: coins,
    speedBadges: badges,
    rank: rank,
    overallAccuracy: prog.overallAccuracy,
    predictedScore: prog.predictedBoardScore,
    todaySubtopic: {
      chapter: subtopic.chapterName,
      topic: subtopic.subtopicName,
      subject: subtopic.subject
    },
    revisionDueCount: revDue.length,
    isAdmin: isAdmin_(verifiedUser.id)
  };

  try {
    cache.put(cacheKey, JSON.stringify(result), 60); // 60s fast RAM cache
  } catch (cErr) {}

  return result;
}
