/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — QUESTION BANK & GHOST CHALLENGES (questions.gs)
 * Pre-Class Subtopic Dispatcher, 70/30 Cumulative Pacing, Gemini Question
 * Generator with Human Approval Gate, Ghost Timer Speed Challenges (+20 CG Coins),
 * Fisher-Yates Anti-Cheating Shuffler, and 15-Minute Edit Lock.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. PRE-CLASS SUBTOPIC DISPATCHER (/settopic)
// ─────────────────────────────────────────────────────────────────────

/**
 * Sets today's active subtopic for the 7:30 PM test package
 * @param {string|number} classLevel - 11 or 12
 * @param {string} subject - Accountancy | Business Studies | Economics
 * @param {string|number} chapterNo
 * @param {string|number} subtopicId
 * @return {Object} Locked topic details
 */
function setActiveSubtopic_(classLevel, subject, chapterNo, subtopicId) {
  var syllabus = getAllRowsAsObjects_('SHEET_SYLLABUS', 'Master_Syllabus', 1000);
  var matchedSubtopic = null;

  for (var i = 0; i < syllabus.length; i++) {
    var row = syllabus[i];
    if (String(row.Class) === String(classLevel) &&
        String(row.Subject).toLowerCase() === String(subject).toLowerCase() &&
        String(row.ChapterNo) === String(chapterNo)) {

      if (row.Canonical_Topic_ID === subtopicId ||
          String(row.Subtopic).toLowerCase().indexOf(String(subtopicId).toLowerCase()) !== -1 ||
          String(row._rowNumber) === String(subtopicId)) {
        matchedSubtopic = row;
        break;
      }
    }
  }

  var canonicalId = matchedSubtopic ?
    (matchedSubtopic.Canonical_Topic_ID || (classLevel + '_' + subject.substring(0, 3).toUpperCase() + '_CH' + chapterNo + '_ST1')) :
    (classLevel + '_' + subject.substring(0, 3).toUpperCase() + '_CH' + chapterNo + '_ST1');

  var topicName = matchedSubtopic ? matchedSubtopic.Subtopic : ('Chapter ' + chapterNo + ' Focus');
  var chapterName = matchedSubtopic ? matchedSubtopic.ChapterName : ('Chapter ' + chapterNo);

  // Store in CacheService and Settings tab
  var cache = CacheService.getScriptCache();
  var lockData = {
    classLevel: classLevel,
    subject: subject,
    chapterNo: chapterNo,
    canonicalId: canonicalId,
    chapterName: chapterName,
    subtopicName: topicName,
    lockedAt: getKolkataTimestamp()
  };

  cache.put('ACTIVE_SUBTOPIC_' + classLevel, JSON.stringify(lockData), 86400); // 24-hr cache

  // Update Settings tab for persistence
  updateRowByColValue_('SHEET_TG', 'Settings', 'Key', 'ACTIVE_SUBTOPIC_' + classLevel, {
    Value: JSON.stringify(lockData)
  });

  Logger.log('🔒 Active Subtopic Locked for Class ' + classLevel + ': ' + canonicalId + ' (' + topicName + ')');
  return lockData;
}

/**
 * Gets the current active subtopic for tonight's delivery
 * @param {string|number} classLevel
 * @return {Object}
 */
function getActiveSubtopic_(classLevel) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('ACTIVE_SUBTOPIC_' + classLevel);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  var setting = findRow_('SHEET_TG', 'Settings', 'Key', 'ACTIVE_SUBTOPIC_' + classLevel);
  if (setting && setting.Value) {
    try {
      var parsed = JSON.parse(setting.Value);
      cache.put('ACTIVE_SUBTOPIC_' + classLevel, setting.Value, 86400);
      return parsed;
    } catch (e) {}
  }

  // Fallback defaults
  return {
    classLevel: classLevel,
    subject: 'Accountancy',
    chapterNo: '1',
    canonicalId: '12_ACC_CH1_ST1',
    chapterName: 'Accounting for Partnership Firms - Fundamentals',
    subtopicName: 'Profit and Loss Appropriation & Interest on Capital'
  };
}

// ─────────────────────────────────────────────────────────────────────
// 2. 70/30 CUMULATIVE PACING & DAILY PACKAGE ASSEMBLER
// ─────────────────────────────────────────────────────────────────────

/**
 * Assembles today's 5-question drill based on 70/30 cumulative pacing:
 * - 70% Fresh Focus (3-4 questions from today's active subtopic)
 * - 30% Cumulative Retention (1-2 questions from prior subtopics of this chapter)
 * 
 * Only Approved questions are served to students (Law H-1).
 * 
 * @param {string|number} classLevel - 11 or 12
 * @param {string} [subject]
 * @return {Object[]} Array of 5 approved questions
 */
function assembleDailyQuestions_(classLevel, subject) {
  var subtopicInfo = getActiveSubtopic_(classLevel);
  var targetSubject = subject || subtopicInfo.subject || 'Accountancy';

  var allQuestions = getAllRowsAsObjects_('SHEET_QB', 'QuestionBank', 2000);

  // Filter only Approved questions for this class and subject
  var approvedPool = allQuestions.filter(function(q) {
    return String(q.Class) === String(classLevel) &&
           String(q.Subject).toLowerCase() === String(targetSubject).toLowerCase() &&
           String(q.ApprovalStatus || '').trim().toLowerCase() === 'approved';
  });

  // Separate into Today's Fresh Subtopic vs Cumulative Prior Subtopics
  var freshPool = [];
  var cumulativePool = [];

  var currentChapter = String(subtopicInfo.chapterNo || '1');
  var currentTopic = String(subtopicInfo.subtopicName || '').toLowerCase();

  approvedPool.forEach(function(q) {
    var qChapter = String(q.Chapter || '');
    var qTopic = String(q.Topic || '').toLowerCase();

    if (qChapter === currentChapter && (qTopic.indexOf(currentTopic) !== -1 || currentTopic.indexOf(qTopic) !== -1)) {
      freshPool.push(q);
    } else {
      cumulativePool.push(q);
    }
  });

  var selected = [];

  // Pick up to 3-4 questions (70%) from freshPool
  freshPool = shuffleArray_(freshPool);
  var freshCount = Math.min(3, freshPool.length);
  for (var i = 0; i < freshCount; i++) {
    selected.push(freshPool[i]);
  }

  // Backfill 1-2 questions (30%) from cumulativePool
  cumulativePool = shuffleArray_(cumulativePool);
  var needed = 5 - selected.length;
  for (var j = 0; j < needed && j < cumulativePool.length; j++) {
    selected.push(cumulativePool[j]);
  }

  // If pool is still short of 5, fallback to remaining approved pool
  if (selected.length < 5) {
    for (var k = 0; k < approvedPool.length && selected.length < 5; k++) {
      if (selected.indexOf(approvedPool[k]) === -1) {
        selected.push(approvedPool[k]);
      }
    }
  }

  // If still completely empty (initial setup), return built-in curriculum seed questions
  if (selected.length === 0) {
    selected = getEmergencySeedQuestions_(classLevel, targetSubject);
  }

  return selected;
}

/**
 * 6:00 AM Cron: Fills DailyQuestions tab for today and pre-warms RAM cache
 */
function fillDailyQuestions() {
  Logger.log('🌅 Running 06:00 AM Daily Questions Assembler...');
  var todayStr = getKolkataDate();

  [11, 12].forEach(function(classLevel) {
    try {
      var questions = assembleDailyQuestions_(classLevel, 'Accountancy');
      var sheet = getSheet_('SHEET_QB', 'DailyQuestions');

      questions.forEach(function(q) {
        sheet.appendRow([
          todayStr,
          q.QID,
          classLevel,
          q.Subject || 'Accountancy',
          q.Type || 'MCQ',
          q.Teacher_Ghost_Seconds || 35
        ]);
      });

      // Pre-warm CacheService (Law 11.2.3)
      var cache = CacheService.getScriptCache();
      cache.put('DAILY_QUESTIONS_C' + classLevel + '_' + todayStr, JSON.stringify(questions), 86400);

      Logger.log('  ✅ Assembled & Cached ' + questions.length + ' questions for Class ' + classLevel);
    } catch (e) {
      logError_('fillDailyQuestions_Class' + classLevel, e);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────
// 3. GEMINI 2.5 FLASH QUESTION GENERATOR (with Human Approval Gate)
// ─────────────────────────────────────────────────────────────────────

/**
 * Generates an exam-standard CBSE Commerce MCQ using Gemini 2.5 Flash Free Tier
 * Questions are saved strictly with ApprovalStatus = "AI_Draft" (Law H-1).
 * Never automatically served without human review.
 * 
 * @param {string|number} classLevel
 * @param {string} subject
 * @param {string} chapter
 * @param {string} topic
 * @param {string} [difficulty='Medium']
 * @return {Object} Generated draft question object
 */
function generateQuestionWithGemini_(classLevel, subject, chapter, topic, difficulty) {
  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) throw new Error('GEMINI_KEY is missing');

  difficulty = difficulty || 'Medium';

  var hiddenPrompt =
    'You are Gyan Sir, a world-class CBSE Commerce teacher. Generate exactly ONE exam-standard CBSE Class ' + classLevel + ' ' + subject + ' question.\n' +
    'Chapter: ' + chapter + '\n' +
    'Subtopic: ' + topic + '\n' +
    'Difficulty Tier: ' + difficulty + '\n\n' +
    'REQUIREMENTS:\n' +
    '1. Strictly follow NCERT and CBSE 2025-26 official marking scheme.\n' +
    '2. For Accountancy: include realistic partnership or share figures, exact rupee calculations, and CBSE traps.\n' +
    '3. Provide 4 crisp options (A, B, C, D) with exactly one correct option.\n' +
    '4. Provide teacher ghost solve time (e.g. 35 seconds for typical MCQ, 45 seconds for calculations).\n' +
    '5. Shark Tank / Real-world insight hint for pop-culture demystification.\n' +
    '6. Return STRICT valid JSON with zero surrounding markdown:\n' +
    '{\n' +
    '  "question": "question text",\n' +
    '  "optA": "Option A text",\n' +
    '  "optB": "Option B text",\n' +
    '  "optC": "Option C text",\n' +
    '  "optD": "Option D text",\n' +
    '  "correctIdx": "A",\n' +
    '  "explanation": "Clear step-by-step CBSE explanation",\n' +
    '  "rubric": "Step marks breakdown",\n' +
    '  "sharkTankHint": "Everyday or business analogy",\n' +
    '  "teacherGhostSeconds": 35\n' +
    '}';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + geminiKey;
  var payload = {
    contents: [{ parts: [{ text: hiddenPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  // 3 Retries with exponential backoff
  var resData = null;
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        var json = JSON.parse(response.getContentText());
        var rawText = json.candidates[0].content.parts[0].text;
        resData = JSON.parse(rawText);
        break;
      }
    } catch (e) {
      if (attempt === 3) throw e;
      Utilities.sleep(1000 * attempt);
    }
  }

  if (!resData) throw new Error('Gemini failed to generate question after 3 attempts');

  // Next QID
  var qid = getNextId_('SHEET_QB', 'QuestionBank', 1, 'Q', 4);

  var newRow = [
    qid,
    getKolkataDate(),
    classLevel,
    subject,
    chapter,
    topic,
    'MCQ',
    resData.question,
    resData.optA,
    resData.optB,
    resData.optC,
    resData.optD,
    resData.correctIdx || 'A',
    resData.rubric || '1 mark for correct selection',
    resData.explanation,
    resData.sharkTankHint || '',
    resData.teacherGhostSeconds || 35,
    'Gemini',
    'AI_Draft', // Law H-1: Must be AI_Draft pending admin approval
    'high',
    difficulty
  ];

  appendRow_('SHEET_QB', 'QuestionBank', newRow);
  Logger.log('✨ Generated Draft Question: ' + qid + ' (AI_Draft, awaits approval)');

  return {
    qid: qid,
    question: resData.question,
    status: 'AI_Draft'
  };
}

/**
 * Approves an AI_Draft question into the active rotation vault
 * @param {string} qid
 */
function approveQuestion_(qid) {
  var success = updateRowByColValue_('SHEET_QB', 'QuestionBank', 'QID', qid, {
    ApprovalStatus: 'Approved'
  });
  if (!success) throw new Error('Question ' + qid + ' not found');
  Logger.log('✅ Approved Question: ' + qid);
  return { qid: qid, status: 'Approved' };
}

/**
 * Rejects an AI_Draft question
 * @param {string} qid
 */
function rejectQuestion_(qid) {
  var success = updateRowByColValue_('SHEET_QB', 'QuestionBank', 'QID', qid, {
    ApprovalStatus: 'Rejected'
  });
  if (!success) throw new Error('Question ' + qid + ' not found');
  Logger.log('❌ Rejected Question: ' + qid);
  return { qid: qid, status: 'Rejected' };
}

// ─────────────────────────────────────────────────────────────────────
// 4. ANTI-CHEATING SHUFFLE & GHOST CHALLENGE ENGINE
// ─────────────────────────────────────────────────────────────────────

/**
 * Serves daily questions to a student with Fisher-Yates option & question shuffling.
 * Renders WhatsApp answer-sharing ("1-B, 2-C") completely impossible.
 * 
 * @param {Object} verifiedUser
 * @param {Object} payload - { classLevel, subject }
 * @return {Object[]} Array of student-specific randomized questions
 */
function apiGetDailyQuestion_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  var classLevel = payload.classLevel || student.Class || 12;
  var todayStr = getKolkataDate();

  // Check cache first
  var cache = CacheService.getScriptCache();
  var cacheKey = 'DAILY_QUESTIONS_C' + classLevel + '_' + todayStr;
  var cached = cache.get(cacheKey);
  var questions = [];

  if (cached) {
    try { questions = JSON.parse(cached); } catch (e) {}
  }

  if (questions.length === 0) {
    questions = assembleDailyQuestions_(classLevel, payload.subject);
    if (questions && questions.length > 0) {
      try {
        cache.put(cacheKey, JSON.stringify(questions), 21600); // 6 hours cache
      } catch (cErr) {}
    }
  }

  // Shuffle question sequence per student using their Telegram ID as seed
  var studentQuestions = shuffleArrayWithSeed_(questions, verifiedUser.id + '_' + todayStr);

  // Check which questions this student has already answered today
  var existingAnswers = findRows_('SHEET_QB', 'StudentAnswers', 'TelegramID', String(verifiedUser.id));
  var answeredMap = {};
  existingAnswers.forEach(function(a) {
    answeredMap[a.QID] = a;
  });

  return studentQuestions.map(function(q, qIdx) {
    // Fisher-Yates Option Shuffling per question per student
    var shuffled = shuffleOptionsForStudent_(q, verifiedUser.id);
    var previousAnswer = answeredMap[q.QID];

    return {
      qid: q.QID,
      questionNumber: qIdx + 1,
      classLevel: q.Class,
      subject: q.Subject,
      chapter: q.Chapter,
      topic: q.Topic,
      question: q.Question,
      options: shuffled.options, // [{ label: 'A', text: '...', originalIdx: 'C' }]
      teacherGhostSeconds: parseInt(q.Teacher_Ghost_Seconds, 10) || 35,
      sharkTankHint: q.SharkTank_Hint || null,
      difficulty: q.Difficulty || 'Medium',
      hasAnswered: !!previousAnswer,
      previousScore: previousAnswer ? previousAnswer.Score : null,
      previousAnswerText: previousAnswer ? previousAnswer.AnswerText : null
    };
  });
}

/**
 * Shuffles options A, B, C, D using Fisher-Yates with student seed
 * @param {Object} q
 * @param {string|number} seed
 * @return {{ options: Object[], correctDisplayIdx: string }}
 */
function shuffleOptionsForStudent_(q, seed) {
  var rawOptions = [
    { origKey: 'A', text: q.OptA },
    { origKey: 'B', text: q.OptB },
    { origKey: 'C', text: q.OptC },
    { origKey: 'D', text: q.OptD }
  ];

  var shuffled = shuffleArrayWithSeed_(rawOptions, seed + '_' + q.QID);
  var displayLabels = ['A', 'B', 'C', 'D'];
  var mappedOptions = [];
  var correctDisplayIdx = 'A';

  for (var i = 0; i < shuffled.length; i++) {
    var label = displayLabels[i];
    mappedOptions.push({
      label: label,
      text: shuffled[i].text,
      originalKey: shuffled[i].origKey
    });

    if (shuffled[i].origKey === String(q.CorrectIdx).trim().toUpperCase()) {
      correctDisplayIdx = label;
    }
  }

  return {
    options: mappedOptions,
    correctDisplayIdx: correctDisplayIdx
  };
}

// ─────────────────────────────────────────────────────────────────────
// 5. ANSWER SUBMISSION & GHOST CHALLENGE REWARD ENGINE
// ─────────────────────────────────────────────────────────────────────

/**
 * Submits student answer with Ghost Timer comparison, 15-minute edit window,
 * spaced repetition queue updating, and +20 CG Coin bonus on beating Gyan Sir's record.
 * 
 * @param {Object} verifiedUser
 * @param {Object} payload - { qid, selectedOption, timeTakenSeconds }
 * @return {Object} Submission result with coins, confetti trigger, and explanation
 */
function apiSubmitAnswer_(verifiedUser, payload) {
  return withLock_('submitAnswer_' + verifiedUser.id + '_' + payload.qid, 20000, function() {
    var student = requirePaidStudent_(verifiedUser.id);
    var qid = payload.qid;
    var timeTakenSeconds = parseInt(payload.timeTakenSeconds, 10) || 45;

    // Fetch question from QuestionBank
    var q = findRow_('SHEET_QB', 'QuestionBank', 'QID', qid);
    if (!q) throw new Error('Question "' + qid + '" not found');

    // 15-Minute Edit Window Check
    var answersSheet = getSheet_('SHEET_QB', 'StudentAnswers');
    var existingAnswers = findRows_('SHEET_QB', 'StudentAnswers', 'TelegramID', String(verifiedUser.id));
    var existingRecord = null;

    for (var i = 0; i < existingAnswers.length; i++) {
      if (existingAnswers[i].QID === qid) {
        existingRecord = existingAnswers[i];
        break;
      }
    }

    if (existingRecord) {
      var answerTime = parseDateOrToday_(existingRecord.Timestamp);
      var elapsedMs = Date.now() - answerTime.getTime();
      if (elapsedMs > 15 * 60 * 1000) {
        throw new Error('SUBMISSION_LOCKED: The 15-minute answer edit window has expired for this question.');
      }
    }

    // Un-shuffle to check against original CorrectIdx
    var shuffled = shuffleOptionsForStudent_(q, verifiedUser.id);
    var chosenOriginalKey = null;

    for (var j = 0; j < shuffled.options.length; j++) {
      if (shuffled.options[j].label === payload.selectedOption) {
        chosenOriginalKey = shuffled.options[j].originalKey;
        break;
      }
    }

    var isCorrect = (chosenOriginalKey === String(q.CorrectIdx).trim().toUpperCase());
    var score = isCorrect ? 1 : 0;
    var teacherGhostSec = parseInt(q.Teacher_Ghost_Seconds, 10) || 35;

    // Ghost Timer Evaluation
    var beatGhostStatus = 'SLOW';
    var bonusCoins = 0;
    var triggerConfetti = false;

    if (isCorrect) {
      if (timeTakenSeconds <= teacherGhostSec) {
        beatGhostStatus = 'BEAT_RECORD';
        bonusCoins = 10; // +5 base + 5 speed bonus
        triggerConfetti = true;
      } else {
        beatGhostStatus = 'REGULAR';
        bonusCoins = 5; // +5 base coins
      }
    }

    var status = existingRecord ? 'Edited' : 'Submitted';

    if (existingRecord) {
      // Update existing row
      var rowNum = existingRecord._rowNumber;
      updateCell_('SHEET_QB', 'StudentAnswers', rowNum, 5, payload.selectedOption);
      updateCell_('SHEET_QB', 'StudentAnswers', rowNum, 7, score);
      updateCell_('SHEET_QB', 'StudentAnswers', rowNum, 8, timeTakenSeconds);
      updateCell_('SHEET_QB', 'StudentAnswers', rowNum, 9, beatGhostStatus);
      updateCell_('SHEET_QB', 'StudentAnswers', rowNum, 10, 'Edited');
    } else {
      // Append new submission
      answersSheet.appendRow([
        getKolkataTimestamp(),
        String(verifiedUser.id),
        student.Name,
        qid,
        payload.selectedOption,
        1, // WordCount (MCQ)
        score,
        timeTakenSeconds,
        beatGhostStatus,
        status
      ]);
    }

    // Update Spaced Repetition Revision Queue (notebook.gs)
    updateRevisionQueue_(String(verifiedUser.id), qid, isCorrect);

    // Update Leaderboard & Coins (notebook.gs)
    updateStudentCoinsAndLeaderboard_(String(verifiedUser.id), student.Name, student.Class, score, bonusCoins, beatGhostStatus === 'BEAT_RECORD');

    // Invalidate cached dashboard so fresh coins/accuracy show immediately
    try {
      CacheService.getScriptCache().remove('DASHBOARD_' + verifiedUser.id);
    } catch (cErr) {}

    return {
      qid: qid,
      isCorrect: isCorrect,
      score: score,
      correctOption: shuffled.correctDisplayIdx,
      explanation: q.Explanation,
      rubric: q.Rubric,
      beatGhostStatus: beatGhostStatus,
      teacherGhostSeconds: teacherGhostSec,
      studentSeconds: timeTakenSeconds,
      bonusCoinsAwarded: bonusCoins,
      triggerConfetti: triggerConfetti,
      message: beatGhostStatus === 'BEAT_RECORD' ?
        '⚡ RECORD BEATEN! You solved this in ' + timeTakenSeconds + 's (Gyan Sir: ' + teacherGhostSec + 's). +20 CG Coins awarded!' :
        (isCorrect ? '✅ Correct Answer! +10 CG Coins' : '❌ Incorrect. Automatically added to your Mistakes Notebook.')
    };
  });
}

// ─────────────────────────────────────────────────────────────────────
// 6. HELPER SEED QUESTIONS (Initial Fail-Safe)
// ─────────────────────────────────────────────────────────────────────

function getEmergencySeedQuestions_(classLevel, subject) {
  return [
    {
      QID: 'Q-0001',
      Class: classLevel,
      Subject: subject,
      Chapter: '1',
      Topic: 'Interest on Capital',
      Question: 'In the absence of a Partnership Deed, interest on loan provided by a partner is allowed at what rate?',
      OptA: '6% per annum',
      OptB: '12% per annum',
      OptC: 'No interest is allowed',
      OptD: 'Equal to bank rate',
      CorrectIdx: 'A',
      Teacher_Ghost_Seconds: 25,
      Explanation: 'Section 13(d) of the Indian Partnership Act, 1932 provides for interest on loan @ 6% p.a. in the absence of an agreement. It is a charge against profits.',
      Rubric: '1 mark for Option A with Section 13(d) citation',
      SharkTank_Hint: 'Like debt lenders earning guaranteed interest before founders take profit distributions.'
    },
    {
      QID: 'Q-0002',
      Class: classLevel,
      Subject: subject,
      Chapter: '1',
      Topic: 'P&L Appropriation Account',
      Question: 'Which of the following is an appropriation of profit and NOT a charge against profit?',
      OptA: 'Rent to partner',
      OptB: 'Interest on partner loan',
      OptC: 'Salary to partner',
      OptD: 'Manager commission',
      CorrectIdx: 'C',
      Teacher_Ghost_Seconds: 30,
      Explanation: 'Salary to partner is payable only if there are profits, making it an appropriation. Rent, loan interest, and manager commission are charges.',
      Rubric: '1 mark for Option C',
      SharkTank_Hint: 'Appropriation is splitting the cake; charges are the cost of flour and sugar.'
    }
  ];
}

/** Standard Fisher-Yates shuffle */
function shuffleArray_(arr) {
  var copy = arr.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/** Deterministic pseudo-random shuffle seeded per student per day */
function shuffleArrayWithSeed_(arr, seedStr) {
  if (!arr || arr.length <= 1) return arr ? arr.slice() : [];
  var copy = arr.slice();
  var seedNum = 0;
  var s = String(seedStr || 'default_seed');
  for (var k = 0; k < s.length; k++) {
    seedNum = ((seedNum << 5) - seedNum + s.charCodeAt(k)) | 0;
  }
  seedNum = Math.abs(seedNum);

  function seededRandom() {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return Math.abs(seedNum) / 233280;
  }

  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(seededRandom() * (i + 1));
    j = Math.max(0, Math.min(i, j));
    var temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Seeds 5 verified CBSE Class 12 Accountancy MCQs into QuestionBank and DailyQuestions for today
 * Ensures question.html loads real questions instead of failing with 'Could not load today\'s drill'.
 * @return {number} Count of seeded questions
 */
function seedInitialQuestionBankData() {
  var props = PropertiesService.getScriptProperties();
  var sheetQbId = props.getProperty('SHEET_QB');
  if (!sheetQbId) throw new Error('SHEET_QB property is not configured');

  var ss = SpreadsheetApp.openById(sheetQbId);
  var qbSheet = ss.getSheetByName('QuestionBank');
  var dqSheet = ss.getSheetByName('DailyQuestions');
  if (!qbSheet || !dqSheet) throw new Error('QuestionBank or DailyQuestions tab missing in Sheet 2');

  var todayDateStr = getKolkataDate();

  var verifiedQuestions = [
    {
      qid: 'Q-0001',
      classLevel: '12',
      subject: 'Accountancy',
      chapter: '1',
      topic: 'Accounting for Partnership: Basic Concepts',
      type: 'MCQ',
      question: 'In the absence of a partnership deed, what is the rate of interest allowed on a partner\'s loan to the firm?',
      optA: '6% per annum as an appropriation of profit',
      optB: '6% per annum as a charge against profit',
      optC: '12% per annum simple interest',
      optD: 'No interest is allowed',
      correctIdx: 'B',
      rubric: '1 mark for selecting 6% p.a. as a charge against profit.',
      explanation: 'According to Section 13(d) of the Indian Partnership Act, 1932, in the absence of an agreement, a partner is entitled to interest on loan at 6% p.a. It is a charge against profit payable even if the firm incurs a loss.',
      sharkTankHint: 'Think of partner loan as a debt investor like Shark Tank debt deals — they get paid interest before founders split any profits!',
      ghostSec: 30
    },
    {
      qid: 'Q-0002',
      classLevel: '12',
      subject: 'Accountancy',
      chapter: '1',
      topic: 'Interest on Drawings',
      type: 'MCQ',
      question: 'A partner withdraws ₹5,000 at the beginning of every month throughout the year. If interest on drawings is charged @ 10% p.a., the total interest will be:',
      optA: '₹3,000',
      optB: '₹3,250',
      optC: '₹2,750',
      optD: '₹3,500',
      correctIdx: 'B',
      rubric: '1 mark for correct calculation using 6.5 months average period.',
      explanation: 'Total Drawings = ₹5,000 × 12 = ₹60,000. Average period for beginning of every month = (12 + 1)/2 = 6.5 months. Interest = ₹60,000 × 10/100 × 6.5/12 = ₹3,250.',
      sharkTankHint: 'Monthly SIP withdrawals in business! Average time money stays out of the business is 6.5 months.',
      ghostSec: 40
    },
    {
      qid: 'Q-0003',
      classLevel: '12',
      subject: 'Accountancy',
      chapter: '1',
      topic: 'P&L Appropriation Account',
      type: 'MCQ',
      question: 'Which of the following items is treated as a CHARGE against profit and NOT an appropriation of profit?',
      optA: 'Interest on Partner Capital',
      optB: 'Salary to Active Working Partner',
      optC: 'Rent paid to a Partner for firm premises',
      optD: 'Transfer to General Reserve',
      correctIdx: 'C',
      rubric: '1 mark for identifying rent to partner as charge against profit.',
      explanation: 'Rent paid to a partner for using his property is an external business expense (charge against profit) debited to P&L Account, not an appropriation.',
      sharkTankHint: 'Landlord rent must be paid even if company revenue is zero, whether landlord is a co-founder or outsider!',
      ghostSec: 35
    },
    {
      qid: 'Q-0004',
      classLevel: '12',
      subject: 'Accountancy',
      chapter: '1',
      topic: 'Guarantee of Minimum Profit',
      type: 'MCQ',
      question: 'X, Y, and Z are partners sharing profits in the ratio 3:2:1. Z is guaranteed a minimum profit of ₹30,000 by X. If the firm earns a net profit of ₹1,20,000, what is X\'s final profit share?',
      optA: '₹60,000',
      optB: '₹50,000',
      optC: '₹40,000',
      optD: '₹45,000',
      correctIdx: 'B',
      rubric: '1 mark for deducting Z\'s ₹10,000 deficiency from X\'s share.',
      explanation: 'Z\'s share = 1/6 of ₹1,20,000 = ₹20,000. Guaranteed profit = ₹30,000. Deficiency = ₹10,000 borne entirely by X. X\'s original share = 3/6 of ₹1,20,000 = ₹60,000. X\'s final share = ₹60,000 - ₹10,000 = ₹50,000.',
      sharkTankHint: 'A primary shark giving a personal guarantee to a junior co-founder out of their personal equity cut!',
      ghostSec: 45
    },
    {
      qid: 'Q-0005',
      classLevel: '12',
      subject: 'Accountancy',
      chapter: '1',
      topic: 'Past Adjustments',
      type: 'MCQ',
      question: 'Interest on capital was omitted to be credited to partners for the year. To rectify this error in the next accounting year, which account is debited/credited through a single adjustment entry?',
      optA: 'Profit & Loss Suspense Account',
      optB: 'Profit & Loss Appropriation Account',
      optC: 'Partners\' Capital or Current Accounts',
      optD: 'General Reserve Account',
      correctIdx: 'C',
      rubric: '1 mark for identifying Partner Capital/Current accounts for single rectifying entry.',
      explanation: 'Under CBSE standards, past omissions are rectified at the beginning of the next accounting period by passing a single adjustment entry through Partners\' Capital or Current Accounts.',
      sharkTankHint: 'Internal cap-table rebalancing between partners without re-auditing last year\'s closed books!',
      ghostSec: 35
    },
    {
      qid: 'Q-0006',
      classLevel: '12',
      subject: 'Business Studies',
      chapter: '2',
      topic: 'Principles of Management',
      type: 'MCQ',
      question: 'Which principle of management emphasized by Henri Fayol states that an employee should receive orders from only one superior to prevent confusion and conflict?',
      optA: 'Unity of Direction',
      optB: 'Unity of Command',
      optC: 'Scalar Chain',
      optD: 'Order',
      correctIdx: 'B',
      rubric: '1 mark for selecting Unity of Command.',
      explanation: 'Unity of Command states that an employee should receive instructions and be accountable to only one superior, preventing dual subordination.',
      sharkTankHint: 'One captain per ship to avoid conflicting orders and operational chaos!',
      ghostSec: 30
    },
    {
      qid: 'Q-0007',
      classLevel: '12',
      subject: 'Business Studies',
      chapter: '5',
      topic: 'Organising Process',
      type: 'MCQ',
      question: 'Which step in the organizing process involves allocating work among employees and grouping similar activities into departments?',
      optA: 'Identification and division of work',
      optB: 'Departmentalisation',
      optC: 'Assignment of duties',
      optD: 'Establishing reporting relationships',
      correctIdx: 'B',
      rubric: '1 mark for identifying Departmentalisation.',
      explanation: 'Once work is divided, similar activities are grouped together into departments or divisions, known as Departmentalisation.',
      sharkTankHint: 'Grouping marketing folks together and coders together so teams run efficiently!',
      ghostSec: 35
    }
  ];

  // 1. Check existing in QuestionBank
  var existingQb = qbSheet.getDataRange().getValues();
  var existingQids = {};
  for (var i = 1; i < existingQb.length; i++) {
    existingQids[String(existingQb[i][0])] = true;
  }

  verifiedQuestions.forEach(function(q) {
    if (!existingQids[q.qid]) {
      qbSheet.appendRow([
        q.qid,
        todayDateStr,
        q.classLevel,
        q.subject,
        q.chapter,
        q.topic,
        q.type,
        q.question,
        q.optA,
        q.optB,
        q.optC,
        q.optD,
        q.correctIdx,
        q.rubric,
        q.explanation,
        q.sharkTankHint,
        q.ghostSec,
        'Manual',
        'Approved',
        'high',
        'Medium'
      ]);
      existingQids[q.qid] = true;
    }
  });

  // 2. Check existing in DailyQuestions for today
  var existingDq = dqSheet.getDataRange().getValues();
  var todaySeeded = false;
  for (var j = 1; j < existingDq.length; j++) {
    var dqDate = String(existingDq[j][0]);
    if (dqDate.indexOf(todayDateStr) !== -1 || dqDate === todayDateStr) {
      todaySeeded = true;
      break;
    }
  }

  if (!todaySeeded) {
    verifiedQuestions.forEach(function(q) {
      dqSheet.appendRow([
        todayDateStr,
        q.qid,
        q.classLevel,
        q.subject,
        q.type,
        q.ghostSec
      ]);
    });
  }

  // Clear stale cache
  var cache = CacheService.getScriptCache();
  cache.remove('DAILY_QUESTIONS_C12_' + todayDateStr);

  Logger.log('✅ Seeded ' + verifiedQuestions.length + ' Class 12 Accountancy questions successfully into QuestionBank and DailyQuestions.');
  return verifiedQuestions.length;
}

/**
 * ─────────────────────────────────────────────────────────────────────
 * PRACTICE QUESTIONS API HANDLER
 * ─────────────────────────────────────────────────────────────────────
 */
function handleGetPracticeQuestions_(data) {
  var subject = (data && data.subject) || "Accountancy";
  var diff = (data && data.difficulty) || "STANDARD";

  try {
    var ss = SpreadsheetApp.openById("1VI89cSIa0PcL2rHzEmiEgc1lgpmvWLgyIXZ7Pb5I2bs"); // Sheet 2: Question Bank
    var sheet = ss.getSheetByName("QuestionBank");
    if (!sheet) return { ok: false, error: "QuestionBank sheet not found" };

    var rows = sheet.getDataRange().getValues();
    if (!rows || rows.length <= 1) return { ok: true, questions: [] };

    var headers = rows[0].map(function(h) { return String(h).trim().toLowerCase(); });
    var subjCol = headers.indexOf('subject');
    var topicCol = headers.indexOf('topic');
    var questionCol = headers.indexOf('question');
    if (questionCol === -1) questionCol = headers.indexOf('text');
    var optACol = headers.indexOf('opta');
    var optBCol = headers.indexOf('optb');
    var optCCol = headers.indexOf('optc');
    var optDCol = headers.indexOf('optd');
    var correctCol = headers.indexOf('correctidx');
    if (correctCol === -1) correctCol = headers.indexOf('correctindex');
    var explCol = headers.indexOf('explanation');
    var trapCol = headers.indexOf('sharktank_hint');
    if (trapCol === -1) trapCol = headers.indexOf('trapalert');

    // Default column indices if headers missing
    if (subjCol === -1) subjCol = 1; // Col B
    if (topicCol === -1) topicCol = 2;
    if (questionCol === -1) questionCol = 3;
    if (optACol === -1) optACol = 4;
    if (optBCol === -1) optBCol = 5;
    if (optCCol === -1) optCCol = 6;
    if (optDCol === -1) optDCol = 7;
    if (correctCol === -1) correctCol = 8;
    if (explCol === -1) explCol = 9;
    if (trapCol === -1) trapCol = 10;

    var filtered = [];

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      // Match Col B, Col D, or detected subject column
      var rowSubj = String(r[subjCol] || r[3] || r[1] || '').trim().toLowerCase();
      var targetSubj = subject.trim().toLowerCase();

      if (rowSubj === targetSubj || (rowSubj && targetSubj && (rowSubj.indexOf(targetSubj) !== -1 || targetSubj.indexOf(rowSubj) !== -1))) {
        var correctVal = r[correctCol];
        var correctIdxNum = 0;
        if (typeof correctVal === 'number') {
          correctIdxNum = correctVal;
        } else if (typeof correctVal === 'string') {
          var cStr = correctVal.trim().toUpperCase();
          if (cStr === 'A') correctIdxNum = 0;
          else if (cStr === 'B') correctIdxNum = 1;
          else if (cStr === 'C') correctIdxNum = 2;
          else if (cStr === 'D') correctIdxNum = 3;
          else correctIdxNum = parseInt(cStr, 10) || 0;
        }

        filtered.push({
          id: String(r[0] || ('Q-' + i)),
          subject: String(r[subjCol] || subject),
          topic: String(r[topicCol] || 'Core Concept'),
          text: String(r[questionCol] || r[7] || r[3] || ''),
          options: [
            String(r[optACol] !== undefined && r[optACol] !== '' ? r[optACol] : (r[8] || 'Option A')),
            String(r[optBCol] !== undefined && r[optBCol] !== '' ? r[optBCol] : (r[9] || 'Option B')),
            String(r[optCCol] !== undefined && r[optCCol] !== '' ? r[optCCol] : (r[10] || 'Option C')),
            String(r[optDCol] !== undefined && r[optDCol] !== '' ? r[optDCol] : (r[11] || 'Option D'))
          ],
          correctIndex: correctIdxNum,
          explanation: String(r[explCol] !== undefined && r[explCol] !== '' ? r[explCol] : (r[14] || r[9] || 'Remember NCERT core definitions.')),
          trapAlert: String(r[trapCol] !== undefined && r[trapCol] !== '' ? r[trapCol] : (r[15] || r[10] || 'Remember NCERT core definitions.'))
        });
      }
      if (filtered.length >= 5) break;
    }

    return { ok: true, questions: filtered };
  } catch (err) {
    Logger.log('handleGetPracticeQuestions_ error: ' + err.toString());
    return { ok: false, error: err.toString() };
  }
}
