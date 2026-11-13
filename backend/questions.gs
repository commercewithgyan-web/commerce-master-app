/**
 * ============================================================================
 * COMMERCE MASTER APP v2.4 — QUESTION BANK & GHOST CHALLENGES (questions.gs)
 * Pre-Class Subtopic Dispatcher, 70/30 Cumulative Pacing, Master Question
 * Repository Vault Reader (AA6:AT across all 8 Subject Tabs), Topic-Sharded
 * CacheService Pre-Warming (<100KB safe), Fisher-Yates Anti-Cheating Shuffler,
 * and Ghost Timer Speed Challenges (+20 CG Coins).
 * ============================================================================
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

  cache.put('ACTIVE_SUBTOPIC_' + classLevel, JSON.stringify(lockData), 86400);

  updateRowByColValue_('SHEET_TG', 'Settings', 'Key', 'ACTIVE_SUBTOPIC_' + classLevel, {
    Value: JSON.stringify(lockData)
  });

  Logger.log('🔒 Active Subtopic Locked for Class ' + classLevel + ': ' + canonicalId + ' (' + topicName + ')');
  return lockData;
}

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

  return {
    classLevel: classLevel,
    subject: classLevel == 12 ? 'Business Studies' : 'Accountancy',
    chapterNo: 1,
    canonicalId: classLevel == 12 ? 'C12-BST-B1-CH01-T01-S01' : 'C11-ACC-B1-CH01-T01-S01',
    chapterName: 'Chapter 1',
    subtopicName: 'General Fundamentals',
    lockedAt: getKolkataTimestamp()
  };
}

const MASTER_REPO_ID = '1FMk5KBCaEBLj7rwmGI9lIEpM02aGWrC-6tD8GXApDCY';
const MASTER_VAULT_START_ROW = 6;
const MASTER_VAULT_START_COL = 27; // Column AA
const MASTER_VAULT_NUM_COLS = 20;  // Columns AA..AT
const MASTER_VAULT_READ_COLS = 21; // AA..AU (AU = QA_Audit_Status gatekeeper, read-only)

function getMasterRepoSheetName_(subject, classLevel) {
  var cls = String(classLevel || '12');
  var isClass11 = cls.indexOf('11') !== -1;
  var subj = String(subject || '').toLowerCase();

  if (subj.indexOf('business') !== -1 || subj.indexOf('bst') !== -1) {
    return isClass11 ? '11_BST' : '12_BST';
  }
  if (subj.indexOf('account') !== -1 || subj.indexOf('acc') !== -1) {
    return isClass11 ? '11_ACC' : '12_ACC';
  }
  if (subj.indexOf('stat') !== -1) {
    return '11_STAT';
  }
  if (subj.indexOf('indian') !== -1 || subj.indexOf('ied') !== -1 || subj.indexOf('development') !== -1) {
    return '12_ECO_IED';
  }
  if (subj.indexOf('micro') !== -1) {
    return '11_ECO_MICRO';
  }
  if (subj.indexOf('macro') !== -1) {
    return '12_ECO_MACRO';
  }
  if (subj.indexOf('eco') !== -1) {
    return isClass11 ? '11_ECO_MICRO' : '12_ECO_MACRO';
  }

  return isClass11 ? '11_ACC' : '12_ACC';
}

function getMasterVaultQuestionsByTab_(targetSheetName, includeAllStatuses) {
  var cache = CacheService.getScriptCache();
  var cacheKey = 'MV_TAB_V4_' + targetSheetName + (includeAllStatuses ? '_ALL' : '_APP');
  var cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  var parsedQuestions = [];
  try {
    var props = PropertiesService.getScriptProperties();
    var repoId = props.getProperty('SHEET_MASTER_REPO') || MASTER_REPO_ID;
    if (repoId === '1FMk5KBCaEBLj7rwmGI9lIEpM02aGWrc-6tD8GXApDCY') {
      repoId = MASTER_REPO_ID;
    }

    var masterSs = SpreadsheetApp.openById(repoId);
    var targetSheet = masterSs ? masterSs.getSheetByName(targetSheetName) : null;
    if (!targetSheet) return [];

    var maxRows = targetSheet.getMaxRows();
    if (maxRows < MASTER_VAULT_START_ROW) return [];

    var numRowsToScan = Math.min(maxRows - MASTER_VAULT_START_ROW + 1, 1500);
    var vaultRows = targetSheet.getRange(MASTER_VAULT_START_ROW, MASTER_VAULT_START_COL, numRowsToScan, MASTER_VAULT_READ_COLS).getValues();

    var isClass11 = targetSheetName.indexOf('11_') === 0;
    var defaultClass = isClass11 ? '11' : '12';

    for (var i = 0; i < vaultRows.length; i++) {
      var r = vaultRows[i];
      var qid = String(r[0] || '').trim();
      var qText = String(r[9] || '').trim();
      if (!qid && !qText) continue;
      if (qid.toLowerCase() === 'qid' || qText.toLowerCase() === 'questiontext') continue;

      var status = String(r[19] || '').trim().toLowerCase();
      // Only teacher-reviewed rows are live. 'Active' was the old AI-insert default and is NOT reviewed.
      // v2.5: the QA Gatekeeper (AU) must ALSO say READY TO APPROVE.
      var qaReady = String(r[20] || '').toUpperCase().indexOf('READY TO APPROVE') !== -1;
      var isApproved = (status === 'approved') && qaReady;
      if (!includeAllStatuses && !isApproved) continue;

      var qType = String(r[6] || 'MCQ').trim();
      var marks = Number(r[7]) || (qType.toUpperCase().indexOf('MCQ') !== -1 ? 1 : 4);
      var difficulty = String(r[8] || 'Standard').trim();
      var optA = String(r[10] || '').trim();
      var optB = String(r[11] || '').trim();
      var optC = String(r[12] || '').trim();
      var optD = String(r[13] || '').trim();
      var correctRaw = String(r[14] || '').trim();

      var correctLetter = 'A';
      var correctIndex = 0;
      var cUpper = correctRaw.toUpperCase();
      if (cUpper === 'A' || cUpper.indexOf('(A)') === 0 || cUpper === '0') {
        correctLetter = 'A';
        correctIndex = 0;
      } else if (cUpper === 'B' || cUpper.indexOf('(B)') === 0 || cUpper === '1') {
        correctLetter = 'B';
        correctIndex = 1;
      } else if (cUpper === 'C' || cUpper.indexOf('(C)') === 0 || cUpper === '2') {
        correctLetter = 'C';
        correctIndex = 2;
      } else if (cUpper === 'D' || cUpper.indexOf('(D)') === 0 || cUpper === '3') {
        correctLetter = 'D';
        correctIndex = 3;
      }

      var diffUpper = difficulty.toUpperCase();
      var ghostSeconds = (diffUpper.indexOf('HOTS') !== -1 || diffUpper.indexOf('HARD') !== -1) ? 45 : 35;

      parsedQuestions.push({
        QID: qid || (targetSheetName + '-' + (i + 1)),
        CanonicalSubtopicID: String(r[1] || '').trim(),
        Class: defaultClass,
        Subject: targetSheetName,
        Chapter: String(r[2] || '').trim(),
        ChapterName: String(r[3] || '').trim(),
        Topic: String(r[4] || '').trim(),
        Subtopic: String(r[5] || '').trim(),
        QuestionType: qType,
        Marks: marks,
        Difficulty: difficulty,
        Question: qText,
        OptionA: optA,
        OptionB: optB,
        OptionC: optC,
        OptionD: optD,
        CorrectIndex: correctLetter,
        CorrectIndexNum: correctIndex,
        CorrectAnswerText: correctRaw,
        Rubric: String(r[15] || '1 mark').trim(),
        Explanation: String(r[16] || r[15] || 'Remember NCERT core definitions.').trim(),
        TrapAlert: String(r[17] || '').trim(),
        SharkTankHint: String(r[18] || '').trim(),
        ApprovalStatus: isApproved ? 'Approved' : String(r[19] || 'Draft').trim(),
        TeacherGhostSeconds: ghostSeconds
      });
    }

    var serialized = JSON.stringify(parsedQuestions);
    if (serialized.length < 90000) {
      cache.put(cacheKey, serialized, 900);
    }
  } catch (err) {
    Logger.log('Error in getMasterVaultQuestionsByTab_(' + targetSheetName + '): ' + err);
  }

  return parsedQuestions;
}

function handleGetPracticeQuestions_(data) {
  var subject = (data && data.subject) || 'Accountancy';
  var diff = String((data && data.difficulty) || 'ALL').toUpperCase();
  var classLevel = (data && data.classLevel) || '12';
  var targetSheetName = getMasterRepoSheetName_(subject, classLevel);

  var vaultRows = getMasterVaultQuestionsByTab_(targetSheetName, false);
  var questions = [];

  for (var i = 0; i < vaultRows.length; i++) {
    var q = vaultRows[i];
    var isMcq = q.QuestionType.toUpperCase().indexOf('MCQ') !== -1 ||
                (q.OptionA && q.OptionA !== '-' && q.OptionB && q.OptionB !== '-');
    if (!isMcq) continue;

    if (diff !== 'ALL' && diff !== 'STANDARD' && q.Difficulty.toUpperCase().indexOf(diff) === -1) {
      continue;
    }

    questions.push({
      id: q.QID,
      canonicalTopicId: q.CanonicalSubtopicID,
      subject: subject,
      chapterNo: q.Chapter,
      chapterName: q.ChapterName,
      topic: q.Topic || q.Subtopic || q.ChapterName || 'Core Concept',
      subtopic: q.Subtopic,
      difficulty: q.Difficulty,
      text: q.Question,
      options: [q.OptionA, q.OptionB, q.OptionC || 'Option C', q.OptionD || 'Option D'],
      correctIndex: q.CorrectIndexNum,
      markingScheme: q.Rubric,
      explanation: q.Explanation,
      trapAlert: q.TrapAlert || q.SharkTankHint || 'Watch out for CBSE conceptual traps.',
      sharkTankHint: q.SharkTankHint,
      teacherGhostSeconds: q.TeacherGhostSeconds
    });
  }

  // No draft fallback: unreviewed rows must never reach students.
  // An empty list lets the Mini App show its built-in practice set.
  return questions;
}

function assembleDailyQuestions_(classLevel, subject) {
  var active = getActiveSubtopic_(classLevel);
  var targetSheetName = getMasterRepoSheetName_(subject || active.subject, classLevel);

  var vaultMcqs = getMasterVaultQuestionsByTab_(targetSheetName, false).filter(function(q) {
    return q.QuestionType.toUpperCase().indexOf('MCQ') !== -1 ||
           (q.OptionA && q.OptionA !== '-' && q.OptionB && q.OptionB !== '-');
  });

  // v2.5: vault only. Legacy QuestionBank rows carry no QA Gatekeeper (AU) column.
  var size = Number(PropertiesService.getScriptProperties().getProperty('DPP_SIZE')) || 5;
  var picked = pickDppSet_(vaultMcqs, {
    activeId: active.canonicalId,
    activeChapterNo: active.chapterNo,
    activeName: active.subtopicName,
    completed: getCompletedTopicDates_(classLevel),
    size: size,
    shuffle: shuffleArray_
  });
  _lastDppMeta = picked.meta;
  if (picked.meta.shortfall > 0) {
    Logger.log('INSUFFICIENT_QUESTIONS ' + targetSheetName + ' ' + active.canonicalId + ': short by ' + picked.meta.shortfall);
  }
  return picked.questions;
}

function fillDailyQuestions(classLevel, subject) {
  classLevel = classLevel || 12;
  subject = subject || 'Accountancy';
  var questions = assembleDailyQuestions_(classLevel, subject);
  if (questions.length === 0) return 'No questions found';

  var todayStr = getKolkataDate();
  var sheet = getSheet_('SHEET_QB', 'DailyPackage');

  questions.forEach(function(q, idx) {
    sheet.appendRow([
      todayStr,
      classLevel,
      subject,
      idx + 1,
      q.QID,
      q.Question,
      q.OptionA,
      q.OptionB,
      q.OptionC,
      q.OptionD,
      q.CorrectIndex,
      q.Rubric || '1 mark',
      q.Explanation,
      q.SharkTankHint || q.TrapAlert || '',
      q.TeacherGhostSeconds || 35
    ]);
  });

  var cacheKey = 'DAILY_PKG_' + todayStr + '_' + classLevel;
  CacheService.getScriptCache().put(cacheKey, JSON.stringify(questions), 21600);

  return 'Populated ' + questions.length + ' questions for ' + todayStr;
}

function getSecret_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function generateQuestionWithGemini_(classLevel, subject, chapter, topic, difficulty) {
  var apiKey = getSecret_('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY non-existent in Script Properties');

  difficulty = difficulty || 'Standard';

  var promptText =
    'You are a senior CBSE Commerce content author for Commerce Gyan. Generate 1 high-quality Multiple Choice Question (MCQ) for CBSE Class ' + classLevel + ' ' + subject + '.\n' +
    'Chapter: ' + chapter + '\n' +
    'Subtopic: ' + topic + '\n' +
    'Difficulty level: ' + difficulty + '\n\n' +
    'Return JSON STRICTLY matching this schema with no markdown code fences:\n' +
    '{\n' +
    '  "question": "Question text here",\n' +
    '  "optA": "Option A",\n' +
    '  "optB": "Option B",\n' +
    '  "optC": "Option C",\n' +
    '  "optD": "Option D",\n' +
    '  "correctIdx": "A",\n' +
    '  "rubric": "1 mark for correct selection",\n' +
    '  "explanation": "Detailed step-by-step NCERT conceptual explanation",\n' +
    '  "trapAlert": "Specific CBSE board exam trap to avoid",\n' +
    '  "sharkTankHint": "Punchy real-world Indian business insight",\n' +
    '  "teacherGhostSeconds": 35\n' +
    '}';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
  var payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { responseMimeType: 'application/json' }
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var resData = null;
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      var response = UrlFetchApp.fetch(url, options);
      var json = JSON.parse(response.getContentText());
      var rawText = json.candidates[0].content.parts[0].text;
      resData = JSON.parse(rawText);
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      Utilities.sleep(1000 * attempt);
    }
  }

  if (!resData) throw new Error('Gemini failed to generate question after 3 attempts');

  var targetTab = getMasterRepoSheetName_(subject, classLevel);
  var qid = targetTab.replace('_', '') + '-AI-' + Math.floor(1000 + Math.random() * 9000);

  try {
    var masterSs = SpreadsheetApp.openById(MASTER_REPO_ID);
    var sheet = masterSs.getSheetByName(targetTab);
    if (sheet) {
      var maxRows = Math.max(sheet.getMaxRows(), MASTER_VAULT_START_ROW);
      var aaVals = sheet.getRange(MASTER_VAULT_START_ROW, MASTER_VAULT_START_COL, maxRows - MASTER_VAULT_START_ROW + 1, 1).getValues();
      var lastOffset = -1;
      for (var rIdx = aaVals.length - 1; rIdx >= 0; rIdx--) {
        if (String(aaVals[rIdx][0] || '').trim() !== '') {
          lastOffset = rIdx;
          break;
        }
      }
      var nextVaultRow = MASTER_VAULT_START_ROW + lastOffset + 1;
      var vaultRowData = [[
        qid,
        targetTab + '_AUTO',
        parseInt(chapter, 10) || 1,
        String(chapter),
        String(topic),
        String(topic),
        'MCQ',
        1,
        difficulty,
        resData.question || '',
        resData.optA || '',
        resData.optB || '',
        resData.optC || '',
        resData.optD || '',
        resData.correctIdx || 'A',
        resData.rubric || '1 mark for selecting Option ' + (resData.correctIdx || 'A') + '.',
        resData.explanation || '',
        resData.trapAlert || 'Read NCERT keywords carefully before selecting.',
        resData.sharkTankHint || '',
        'Draft'
      ]];
      sheet.getRange(nextVaultRow, MASTER_VAULT_START_COL, 1, MASTER_VAULT_NUM_COLS).setValues(vaultRowData);
    }
  } catch (repoErr) {
    Logger.log('Master Repo write fallback notice: ' + repoErr);
  }

  try {
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
      'AI_Draft',
      'high',
      difficulty
    ];
    appendRow_('SHEET_QB', 'QuestionBank', newRow);
  } catch (legacyErr) {}

  Logger.log('✨ Generated Draft Question: ' + qid + ' (Draft, awaits approval)');

  return {
    qid: qid,
    question: resData.question,
    status: 'Draft'
  };
}

function approveQuestion_(qid) {
  var updatedInMaster = updateMasterVaultStatusByQid_(qid, 'Approved');
  var updatedInLegacy = false;
  try {
    updatedInLegacy = updateRowByColValue_('SHEET_QB', 'QuestionBank', 'QID', qid, {
      ApprovalStatus: 'Approved'
    });
  } catch (e) {}

  if (!updatedInMaster && !updatedInLegacy) {
    throw new Error('Question ' + qid + ' not found');
  }
  Logger.log('✅ Approved Question: ' + qid);
  return { qid: qid, status: 'Approved' };
}

function rejectQuestion_(qid) {
  var updatedInMaster = updateMasterVaultStatusByQid_(qid, 'Retired');
  var updatedInLegacy = false;
  try {
    updatedInLegacy = updateRowByColValue_('SHEET_QB', 'QuestionBank', 'QID', qid, {
      ApprovalStatus: 'Rejected'
    });
  } catch (e) {}

  if (!updatedInMaster && !updatedInLegacy) {
    throw new Error('Question ' + qid + ' not found');
  }
  Logger.log('❌ Rejected Question: ' + qid);
  return { qid: qid, status: 'Rejected' };
}

function updateMasterVaultStatusByQid_(qid, newStatus) {
  var allTabs = ['11_ACC', '11_BST', '11_ECO_MICRO', '11_STAT', '12_ACC', '12_BST', '12_ECO_MACRO', '12_ECO_IED'];
  try {
    var masterSs = SpreadsheetApp.openById(MASTER_REPO_ID);
    for (var t = 0; t < allTabs.length; t++) {
      var tabName = allTabs[t];
      var sheet = masterSs.getSheetByName(tabName);
      if (!sheet) continue;
      var maxRows = sheet.getMaxRows();
      if (maxRows < MASTER_VAULT_START_ROW) continue;
      var qids = sheet.getRange(MASTER_VAULT_START_ROW, MASTER_VAULT_START_COL, maxRows - MASTER_VAULT_START_ROW + 1, 1).getValues();
      for (var i = 0; i < qids.length; i++) {
        if (String(qids[i][0] || '').trim() === String(qid).trim()) {
          sheet.getRange(MASTER_VAULT_START_ROW + i, 46).setValue(newStatus);
          var cache = CacheService.getScriptCache();
          cache.remove('MV_TAB_V4_' + tabName + '_APP');
          cache.remove('MV_TAB_V4_' + tabName + '_ALL');
          return true;
        }
      }
    }
  } catch (e) {
    Logger.log('Error in updateMasterVaultStatusByQid_: ' + e);
  }
  return false;
}

function apiGetDailyQuestion_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  var classLevel = (payload && payload.classLevel) || student.Class || 12;
  var todayStr = getKolkataDate();

  var cache = CacheService.getScriptCache();
  var cacheKey = 'DAILY_PKG_' + todayStr + '_' + classLevel;
  var todayQuestions = [];

  var cachedPkg = cache.get(cacheKey);
  if (cachedPkg) {
    try { todayQuestions = JSON.parse(cachedPkg); } catch (e) {}
  }

  if (!todayQuestions || todayQuestions.length === 0) {
    try {
      var dailySheet = getSheetData_('SHEET_QB', 'DailyPackage');
      todayQuestions = dailySheet.filter(function(row) {
        return String(row.Date) === todayStr && String(row.Class) === String(classLevel);
      });
    } catch (e) {}
  }

  if (!todayQuestions || todayQuestions.length === 0) {
    var rawAssembled = assembleDailyQuestions_(classLevel, (payload && payload.subject) || 'Accountancy');
    todayQuestions = rawAssembled.map(function(q) {
      return {
        QID: q.QID,
        Question: q.Question,
        OptionA: q.OptionA,
        OptionB: q.OptionB,
        OptionC: q.OptionC,
        OptionD: q.OptionD,
        CorrectIndex: q.CorrectIndex,
        Rubric: q.Rubric || '1 mark',
        Explanation: q.Explanation,
        SharkTankHint: q.SharkTankHint || q.TrapAlert || '',
        TeacherGhostSeconds: q.TeacherGhostSeconds || 35
      };
    });
    if (todayQuestions.length > 0) {
      cache.put(cacheKey, JSON.stringify(todayQuestions), 21600);
    }
  }

  var shuffledQuestions = shuffleArray_(todayQuestions);

  return shuffledQuestions.map(function(q) {
    var shuffledOpts = shuffleOptionsForStudent_(q);
    return {
      qid: q.QID,
      question: q.Question,
      options: shuffledOpts.options,
      optionMap: shuffledOpts.optionMap,
      rubric: q.Rubric,
      sharkTankHint: q.SharkTankHint,
      teacherGhostSeconds: q.TeacherGhostSeconds
    };
  });
}

function shuffleOptionsForStudent_(q) {
  var original = [
    { key: 'A', text: q.OptionA },
    { key: 'B', text: q.OptionB },
    { key: 'C', text: q.OptionC },
    { key: 'D', text: q.OptionD }
  ];

  var shuffled = shuffleArray_(original);
  var optionsText = [];
  var optionMap = {};

  shuffled.forEach(function(opt, index) {
    optionsText.push(opt.text);
    optionMap[opt.key] = index;
  });

  return {
    options: optionsText,
    optionMap: optionMap
  };
}

function shuffleArray_(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  }
  return a;
}

function shuffleArrayWithSeed_(arr, seedStr) {
  var a = arr.slice();
  var seed = 0;
  for (var k = 0; k < seedStr.length; k++) {
    seed = ((seed << 5) - seed) + seedStr.charCodeAt(k);
    seed |= 0;
  }
  seed = Math.abs(seed);

  for (var i = a.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    var rnd = seed / 233280;
    var j = Math.floor(rnd * (i + 1));
    var temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  }
  return a;
}

function apiSubmitAnswer_(verifiedUser, payload) {
  var qid = payload.qid;
  var selectedIndex = payload.selectedIndex;
  var optionMap = payload.optionMap;
  var timeTakenSeconds = payload.timeTakenSeconds || 0;

  var q = findQuestionAcrossVaults_(qid);
  if (!q) throw new Error('Question QID ' + qid + ' not found');

  var correctKey = q.CorrectIndex;
  var expectedIndex = optionMap ? optionMap[correctKey] : q.CorrectIndexNum;
  var isCorrect = (selectedIndex === expectedIndex);

  var ghostTime = q.TeacherGhostSeconds || 35;
  var ghostBeaten = isCorrect && (timeTakenSeconds < ghostTime);
  var coinsEarned = isCorrect ? 10 : 0;
  if (ghostBeaten) coinsEarned += 20;

  if (payload && (payload.dryRun === true || payload.isSandbox === true || payload.preview === true)) {
    return {
      qid: qid,
      isCorrect: isCorrect,
      correctOptionIndex: expectedIndex,
      explanation: q.Explanation,
      trapAlert: q.TrapAlert || '',
      ghostBeaten: ghostBeaten,
      coinsEarned: coinsEarned,
      dryRun: true,
      message: 'Admin Preview Sandbox: Answer verified without mutating live sheet records.'
    };
  }

  var student = requirePaidStudent_(verifiedUser.id);
  var todayStr = getKolkataDate();
  var timestamp = new Date().toISOString();

  // Log to Student_MCQ_Attempts
  try {
    var rollNo = student.StudentID || (student.Roll_No || 'CG-11-001');
    var selectedOpt = String.fromCharCode(65 + Number(selectedIndex));
    appendRow_('SHEET_QB', 'Student_MCQ_Attempts', [
      timestamp,
      rollNo,
      qid,
      selectedOpt,
      isCorrect,
      payload.subject || q.Subject || 'Accountancy',
      payload.chapter || q.Chapter || '',
      payload.topic || q.Topic || '',
      payload.subtopic || q.Subtopic || '',
      payload.mode || 'DAILY_MCQ',
      timeTakenSeconds
    ]);

    if (!isCorrect) {
      appendRow_('SHEET_CORE', 'Student_Weakness_Heatmap', [
        rollNo,
        payload.subject || q.Subject || 'Accountancy',
        payload.chapter || q.Chapter || '',
        payload.topic || q.Topic || '',
        payload.subtopic || q.Subtopic || '',
        1,
        timestamp
      ]);
    }
  } catch (errMCQ) {
    Logger.log('Student_MCQ_Attempts logging notice: ' + errMCQ);
  }

  appendRow_('SHEET_QB', 'Submissions', [
    student.StudentID,
    todayStr,
    qid,
    selectedIndex,
    isCorrect ? 'PASS' : 'FAIL',
    timeTakenSeconds,
    ghostBeaten ? 'YES' : 'NO',
    coinsEarned,
    timestamp
  ]);

  if (coinsEarned > 0) {
    var currentCoins = Number(student.CGCoins || 0);
    updateRowByColValue_('SHEET_CORE', 'Students', 'StudentID', student.StudentID, {
      CGCoins: currentCoins + coinsEarned
    });
  }

  return {
    qid: qid,
    isCorrect: isCorrect,
    correctOptionIndex: expectedIndex,
    explanation: q.Explanation,
    trapAlert: q.TrapAlert || '',
    ghostBeaten: ghostBeaten,
    coinsEarned: coinsEarned
  };
}

function findQuestionAcrossVaults_(qid) {
  var qidStr = String(qid || '').trim();
  var prefixMap = {
    '11ACC': '11_ACC',
    '11BST': '11_BST',
    '11ECO': '11_ECO_MICRO',
    '11STAT': '11_STAT',
    '12ACC': '12_ACC',
    '12BST': '12_BST',
    '12MAC': '12_ECO_MACRO',
    '12IED': '12_ECO_IED'
  };

  var prefix = qidStr.split('-')[0].toUpperCase();
  if (prefixMap[prefix]) {
    var tabQuestions = getMasterVaultQuestionsByTab_(prefixMap[prefix], true);
    for (var i = 0; i < tabQuestions.length; i++) {
      if (tabQuestions[i].QID === qidStr) return tabQuestions[i];
    }
  }

  var allTabs = ['11_ACC', '11_BST', '11_ECO_MICRO', '11_STAT', '12_ACC', '12_BST', '12_ECO_MACRO', '12_ECO_IED'];
  for (var t = 0; t < allTabs.length; t++) {
    var qs = getMasterVaultQuestionsByTab_(allTabs[t], true);
    for (var j = 0; j < qs.length; j++) {
      if (qs[j].QID === qidStr) return qs[j];
    }
  }

  try {
    var qbData = getSheetData_('SHEET_QB', 'QuestionBank');
    return qbData.find(function(row) { return row.QID === qidStr; }) || null;
  } catch (e) {
    return null;
  }
}
