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
  var cached = cache.get('DAILY_QUESTIONS_C' + classLevel + '_' + todayStr);
  var questions = [];

  if (cached) {
    try { questions = JSON.parse(cached); } catch (e) {}
  }

  if (questions.length === 0) {
    questions = assembleDailyQuestions_(classLevel, payload.subject);
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
        bonusCoins = 20; // +20 bonus CG coins
        triggerConfetti = true;
      } else {
        beatGhostStatus = 'REGULAR';
        bonusCoins = 10;
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
  var copy = arr.slice();
  var seedNum = 0;
  for (var k = 0; k < seedStr.length; k++) {
    seedNum = (seedNum * 31 + seedStr.charCodeAt(k)) & 0xFFFFFFFF;
  }

  function seededRandom() {
    seedNum = (seedNum * 9301 + 49297) % 233280;
    return seedNum / 233280;
  }

  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(seededRandom() * (i + 1));
    var temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}
