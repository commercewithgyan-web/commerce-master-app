/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.5 — TEACHER STUDIO BRIDGE (studio.gs)
 * Role session for the single-file Studio SPA, Teacher_Master completion
 * upsert (Final Syllabus Planner), active-subtopic lock, lesson plans,
 * and the 70/30 DPP picker.
 *
 * Every function here is reached through handleApiRequest() in Code.gs,
 * AFTER initData has been HMAC-verified. Nothing here trusts the client's
 * idea of who it is.
 * ═══════════════════════════════════════════════════════════════════════
 */

var STUDIO_PLANNER_FALLBACK_ID = '1TzmB1Ehyb7JwdY0phx-LzB4t-Kq2Z-Tw1m8YPrguCa4';
var STUDIO_PLANNER_TAB = 'Teacher_Master';
var STUDIO_LESSON_TAB = 'Lesson_Plans';
var STUDIO_LESSON_HEADERS = ['LessonID', 'Subject', 'Canonical_Topic_ID', 'Title', 'Unit', 'Body', 'UpdatedAt'];
var STUDIO_TOPIC_ID_RE = /^C1[12]-[A-Z]{3}-B\d+-CH[A-Z0-9]+-T\d+-S\d+$/;
var STUDIO_ALLOWED_STATUS = { 'Completed': true, 'Upcoming': true };

// ─────────────────────────────────────────────────────────────────────
// 1. SESSION / ROLE
// ─────────────────────────────────────────────────────────────────────

/**
 * Tells the SPA who is on the other end. Role is decided here, from the
 * verified Telegram ID, never from anything the page sends.
 * @param {Object} verifiedUser - result of resolveVerifiedUser_()
 * @return {{role:string, user:Object, student:Object, access:string, message:string, active:Object}}
 */
function apiGetSession_(verifiedUser) {
  var id = verifiedUser && verifiedUser.id;
  var out = {
    role: 'guest',
    access: 'none',
    message: '',
    user: { id: String(id || ''), firstName: (verifiedUser && verifiedUser.first_name) || '' },
    student: null,
    active: null
  };

  if (!id || id === 'GUEST_STUDENT') {
    out.message = 'Open this app from the Commerce Gyan bot inside Telegram.';
    return out;
  }

  if (isAdmin_(id)) {
    out.role = 'teacher';
    out.access = 'full';
    out.active = { '11': getActiveSubtopic_(11), '12': getActiveSubtopic_(12) };
    return out;
  }

  var student;
  try {
    student = requirePaidStudent_(id);
  } catch (e) {
    out.role = 'student';
    out.access = 'paused';
    out.message = String(e.message || e);
    return out;
  }

  if (String(student.StudentID || '').indexOf('GUEST') === 0) {
    out.message = 'You are not on the Commerce Gyan roll yet. Send your Telegram ID to Gyan Sir to get added.';
    return out;
  }

  var cls = String(student.Class || student.classLevel || '12').replace(/\D/g, '') || '12';
  var active = getActiveSubtopic_(cls);
  out.role = 'student';
  out.access = 'full';
  out.student = {
    studentId: student.StudentID,
    name: student.Name,
    classLevel: cls,
    board: student.Board || '',
    coins: Number(student.CGCoins || 0)
  };
  out.active = { subject: active.subject, chapterName: active.chapterName, subtopicName: active.subtopicName };
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// 2. TEACHER_MASTER (Final Syllabus Planner) — READ + UPSERT BY TOPIC ID
// ─────────────────────────────────────────────────────────────────────

/**
 * One batch read of Teacher_Master with header lookup by name.
 * @return {{sheet:GoogleAppsScript.Spreadsheet.Sheet, values:Array<Array<*>>, col:Object}}
 */
function readTeacherMaster_() {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_PLANNER') || STUDIO_PLANNER_FALLBACK_ID);
  var sheet = ss.getSheetByName(STUDIO_PLANNER_TAB);
  if (!sheet) throw new Error('CONFIG_ERROR: tab ' + STUDIO_PLANNER_TAB + ' not found in Final Syllabus Planner');

  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(h) { return String(h).trim(); });
  var need = ['Topic ID', 'Class', 'Subject', 'Chapter No', 'Chapter Name', 'Topic Name', 'Subtopic', 'Status', 'Date Completed', 'Mode of Class', 'Last Updated'];
  var col = {};
  need.forEach(function(name) {
    var i = headers.indexOf(name);
    if (i === -1) throw new Error('CONFIG_ERROR: column "' + name + '" missing in ' + STUDIO_PLANNER_TAB);
    col[name] = i;
  });
  return { sheet: sheet, values: values, col: col };
}

/** Maps a Teacher_Master (Class, Subject) pair to the Studio's 8 subject codes. */
function studioSubjectCode_(cls, subject) {
  var s = String(subject || '').toLowerCase();
  var code = 'ACC';
  if (s.indexOf('business') !== -1) code = 'BST';
  else if (s.indexOf('micro') !== -1) code = 'MIC';
  else if (s.indexOf('macro') !== -1) code = 'MAC';
  else if (s.indexOf('stat') !== -1) code = 'STA';
  else if (s.indexOf('indian') !== -1) code = 'IED';
  return code + '-' + String(cls).replace(/\D/g, '');
}

function studioDateMs_(v) {
  if (!v) return 0;
  if (Object.prototype.toString.call(v) === '[object Date]') return v.getTime();
  var t = Date.parse(String(v));
  return isNaN(t) ? 0 : t;
}

function studioDateLabel_(v) {
  var ms = studioDateMs_(v);
  return ms ? Utilities.formatDate(new Date(ms), 'Asia/Kolkata', 'dd MMM yyyy') : '';
}

/**
 * Admin: the whole 797-row tracker, compact, for the Curriculum tab.
 * @return {Array<Object>}
 */
function apiGetCurriculum_(verifiedUser) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  var tm = readTeacherMaster_();
  var c = tm.col;
  var rows = [];
  for (var i = 1; i < tm.values.length; i++) {
    var r = tm.values[i];
    var id = String(r[c['Topic ID']] || '').trim();
    if (!id) continue;
    var rawMedium = String(r[c['Mode of Class']] || 'Offline').trim();
    var medium = (rawMedium === 'CG App' || rawMedium === 'CG_App') ? 'CG_App' : ((rawMedium.indexOf('YouTube') !== -1) ? 'YouTube' : 'Offline');
    rows.push({
      id: id,
      subject: studioSubjectCode_(r[c['Class']], r[c['Subject']]),
      chapter: String(r[c['Chapter Name']] || '').trim(),
      topic: String(r[c['Topic Name']] || '').trim(),
      status: String(r[c['Status']] || 'Upcoming').trim(),
      medium: medium,
      date: studioDateLabel_(r[c['Date Completed']])
    });
  }
  return rows;
}

/**
 * Completed topics for a class: { canonicalId: completedAtMs }.
 * Used by the DPP picker for the 30% retention slice.
 */
function getCompletedTopicDates_(classLevel) {
  var out = {};
  try {
    var tm = readTeacherMaster_();
    var c = tm.col;
    var cls = String(classLevel).replace(/\D/g, '');
    for (var i = 1; i < tm.values.length; i++) {
      var r = tm.values[i];
      if (String(r[c['Class']]).replace(/\D/g, '') !== cls) continue;
      if (String(r[c['Status']] || '').trim().toLowerCase() !== 'completed') continue;
      var id = String(r[c['Topic ID']] || '').trim();
      if (id) out[id] = studioDateMs_(r[c['Date Completed']]) || 1;
    }
  } catch (e) {
    logError_('getCompletedTopicDates_', e);
  }
  return out;
}

/**
 * Admin: mark a topic Completed (or back to Upcoming) by exact Topic ID.
 * Completed also locks it as tonight's active subtopic and rebuilds the DPP.
 * Unknown IDs are rejected, never matched by title (Automation_Contract).
 *
 * @param {Object} payload - { topicId, status: 'Completed'|'Upcoming', mode? }
 */
function apiSetTopicStatus_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  var topicId = String((payload && payload.topicId) || '').trim();
  var status = String((payload && payload.status) || 'Completed').trim();
  if (!STUDIO_TOPIC_ID_RE.test(topicId)) throw new Error('BAD_TOPIC_ID: ' + topicId);
  if (!STUDIO_ALLOWED_STATUS[status]) throw new Error('BAD_STATUS: ' + status);

  return withLock_('studio_topic_status', 20000, function() {
    var tm = readTeacherMaster_();
    var c = tm.col;
    var rowIdx = -1;
    for (var i = 1; i < tm.values.length; i++) {
      if (String(tm.values[i][c['Topic ID']] || '').trim() === topicId) { rowIdx = i; break; }
    }
    if (rowIdx === -1) {
      logError_('apiSetTopicStatus_', 'UNKNOWN_TOPIC_ID ' + topicId);
      throw new Error('UNKNOWN_TOPIC_ID: ' + topicId + ' is not in Teacher_Master');
    }

    var row = tm.values[rowIdx];
    var now = new Date();
    var dateLabel = status === 'Completed' ? Utilities.formatDate(now, 'Asia/Kolkata', 'dd MMM yyyy') : '';
    var sheetRow = rowIdx + 1;

    tm.sheet.getRange(sheetRow, c['Status'] + 1).setValue(status);
    tm.sheet.getRange(sheetRow, c['Date Completed'] + 1).setValue(dateLabel);
    tm.sheet.getRange(sheetRow, c['Last Updated'] + 1).setValue(Utilities.formatDate(now, 'Asia/Kolkata', 'dd MMM yyyy HH:mm'));
    if (payload && payload.mode) {
      tm.sheet.getRange(sheetRow, c['Mode of Class'] + 1).setValue(String(payload.mode));
    }
    SpreadsheetApp.flush();

    var result = { topicId: topicId, status: status, date: dateLabel, active: null, dpp: null };
    if (status !== 'Completed') return result;

    var cls = String(row[c['Class']]).replace(/\D/g, '');
    var lock = {
      classLevel: cls,
      subject: String(row[c['Subject']] || '').trim(),
      chapterNo: String(row[c['Chapter No']] || '').trim(),
      canonicalId: topicId,
      chapterName: String(row[c['Chapter Name']] || '').replace(/^\s*\d+\.\s*/, '').trim(),
      subtopicName: String(row[c['Topic Name']] || '').trim(),
      lockedAt: getKolkataTimestamp()
    };
    var json = JSON.stringify(lock);
    CacheService.getScriptCache().put('ACTIVE_SUBTOPIC_' + cls, json, 86400);
    upsertSetting_('ACTIVE_SUBTOPIC_' + cls, json);

    result.active = lock;
    result.dpp = buildAndCacheDailyPackage_(cls);
    return result;
  });
}

/**
 * Writes Key/Value into '4. Telegram Delivery' → Settings, appending the
 * row when the key does not exist yet. Never addresses a fixed cell:
 * Settings is a Key/Value list and B2 belongs to GROUP_ID_11.
 */
function upsertSetting_(key, value) {
  var sheet = getSheet_('SHEET_TG', 'Settings');
  var last = sheet.getLastRow();
  var keys = last > 0 ? sheet.getRange(1, 1, last, 1).getValues() : [];
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      invalidateSheetCache_('SHEET_TG', 'Settings');
      return i + 1;
    }
  }
  sheet.appendRow([key, value]);
  invalidateSheetCache_('SHEET_TG', 'Settings');
  return sheet.getLastRow();
}

// ─────────────────────────────────────────────────────────────────────
// 3. LESSON PLANS
// ─────────────────────────────────────────────────────────────────────

/**
 * Admin: upsert one lesson plan by LessonID into Lesson_Plans
 * (created in '4. Telegram Delivery' on first save).
 * @param {Object} payload - { lessonId, subject, topicId, title, unit, body }
 */
function apiSaveLessonPlan_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  var lessonId = String((payload && payload.lessonId) || '').trim();
  if (!lessonId) throw new Error('BAD_LESSON: lessonId missing');
  var body = String((payload && payload.body) || '');
  if (body.length > 45000) throw new Error('BAD_LESSON: body too long for one cell (max 45,000 characters)');

  var rowData = [
    lessonId,
    String(payload.subject || ''),
    String(payload.topicId || ''),
    String(payload.title || ''),
    String(payload.unit || ''),
    body,
    getKolkataTimestamp()
  ];

  return withLock_('studio_lesson', 20000, function() {
    var ss = openSpreadsheet_('SHEET_TG');
    var sheet = ss.getSheetByName(STUDIO_LESSON_TAB);
    if (!sheet) {
      sheet = ss.insertSheet(STUDIO_LESSON_TAB);
      sheet.getRange(1, 1, 1, STUDIO_LESSON_HEADERS.length).setValues([STUDIO_LESSON_HEADERS]);
      sheet.setFrozenRows(1);
    }
    var last = sheet.getLastRow();
    var ids = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues() : [];
    var target = last + 1;
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]).trim() === lessonId) { target = i + 2; break; }
    }
    sheet.getRange(target, 1, 1, rowData.length).setValues([rowData]);
    return { lessonId: lessonId, row: target, savedAt: rowData[6] };
  });
}

// ─────────────────────────────────────────────────────────────────────
// 4. 70/30 DPP PICKER
// ─────────────────────────────────────────────────────────────────────

/**
 * Pure selection: 70% fresh + 30% retention, no sheet access.
 *
 * Fresh widens only inside the same chapter (exact subtopic → same topic →
 * same chapter). Retention comes only from topics already Completed, most
 * recent first. If the bank is too thin the set comes back SHORT with a
 * shortfall count; it is never padded with untaught topics.
 *
 * @param {Object[]} pool - gated questions with QID, CanonicalSubtopicID, Chapter
 * @param {Object} opts - { activeId, activeChapterNo, activeName, completed:{id:ms}, size, shuffle:function }
 * @return {{questions:Object[], meta:Object}}
 */
function pickDppSet_(pool, opts) {
  var size = Math.max(1, Number(opts.size) || 5);
  var shuffle = opts.shuffle || function(a) { return a.slice(); };
  var activeId = String(opts.activeId || '');
  var completed = opts.completed || {};
  var name = String(opts.activeName || '').toLowerCase();
  var topicPrefix = activeId.replace(/-S\d+$/, '');
  var chapterPrefix = activeId.replace(/-T\d+-S\d+$/, '');

  function idOf(q) { return String(q.CanonicalSubtopicID || ''); }
  function starts(id, prefix) { return prefix && id.indexOf(prefix + '-') === 0; }

  var tiers = [
    function(q) {
      var id = idOf(q);
      if (id) return id === activeId;
      return !!name && (String(q.Topic || '').toLowerCase() === name || String(q.Subtopic || '').toLowerCase() === name);
    },
    function(q) { return starts(idOf(q), topicPrefix); },
    function(q) { return starts(idOf(q), chapterPrefix); }
  ];
  var tierNames = ['exact-subtopic', 'same-topic', 'same-chapter'];

  var freshTarget = Math.min(size, Math.round(size * 0.7));
  var used = {};
  var fresh = [];
  var freshTier = 'none';
  for (var t = 0; t < tiers.length && fresh.length < freshTarget; t++) {
    var cand = shuffle(pool.filter(function(q) { return !used[q.QID] && tiers[t](q); }));
    for (var i = 0; i < cand.length && fresh.length < freshTarget; i++) {
      fresh.push(cand[i]);
      used[cand[i].QID] = true;
      if (freshTier === 'none') freshTier = tierNames[t];
    }
  }

  var retentionPool = pool.filter(function(q) {
    if (used[q.QID]) return false;
    var id = idOf(q);
    if (id) return id !== activeId && !!completed[id];
    return String(q.Chapter) === String(opts.activeChapterNo);
  });
  retentionPool = shuffle(retentionPool).sort(function(a, b) {
    return (completed[idOf(b)] || 0) - (completed[idOf(a)] || 0);
  });

  var retention = retentionPool.slice(0, size - fresh.length);
  retention.forEach(function(q) { used[q.QID] = true; });

  // Retention ran dry: top up with more of today's chapter, still nothing untaught.
  var questions = fresh.concat(retention);
  if (questions.length < size) {
    var more = shuffle(pool.filter(function(q) {
      return !used[q.QID] && (tiers[0](q) || tiers[1](q) || tiers[2](q));
    })).slice(0, size - questions.length);
    fresh = fresh.concat(more);
    questions = fresh.concat(retention);
  }

  return {
    questions: questions,
    meta: {
      activeId: activeId,
      size: size,
      total: questions.length,
      fresh: fresh.length,
      retention: retention.length,
      freshTier: freshTier,
      shortfall: size - questions.length
    }
  };
}

/** Meta of the most recent assembleDailyQuestions_() call in this execution. */
var _lastDppMeta = null;

/**
 * Assembles tonight's set for one class and puts it under the cache key
 * apiGetDailyQuestion_() reads first, so students get exactly this set.
 * @return {Object} picker meta (+ subject / subtopic labels)
 */
function buildAndCacheDailyPackage_(classLevel) {
  var cls = String(classLevel).replace(/\D/g, '');
  var active = getActiveSubtopic_(cls);
  _lastDppMeta = null;
  var raw = assembleDailyQuestions_(cls, active.subject);
  var pkg = raw.map(function(q) {
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

  var cache = CacheService.getScriptCache();
  var key = 'DAILY_PKG_' + getKolkataDate() + '_' + cls;
  if (pkg.length > 0) cache.put(key, JSON.stringify(pkg), 21600);
  else cache.remove(key);

  var meta = _lastDppMeta || { total: pkg.length, fresh: 0, retention: 0, freshTier: 'none', shortfall: 0 };
  meta.classLevel = cls;
  meta.subject = active.subject;
  meta.subtopicName = active.subtopicName;
  meta.activeId = active.canonicalId;
  return meta;
}

/**
 * Admin: rebuild tonight's set now and report what students will get.
 * Does not broadcast: the 07:30 PM single-PDF cron stays the only channel post.
 * @param {Object} payload - { classLevel? } (omit for both classes)
 */
function apiDispatchDpp_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  var classes = (payload && payload.classLevel) ? [payload.classLevel] : [11, 12];
  return classes.map(function(cls) { return buildAndCacheDailyPackage_(cls); });
}


/**
 * Generates an AI lesson plan using Gemini API (or structured NCERT fallback)
 * @param {Object} verifiedUser
 * @param {Object} payload - { subject, topicId, title, unit }
 * @return {Object} { ok: true, lessonPlan: { title, unit, body } }
 */
function apiGenerateLessonPlan_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  var subject = (payload && payload.subject) || 'ACC-12';
  var topicId = (payload && payload.topicId) || 'ACC12-CH03-T02';
  var title = (payload && payload.title) || 'Admission of a Partner: Hidden Goodwill';
  var unit = (payload && payload.unit) || 'Ch 3: Reconstitution of Partnership Firm';

  var systemPrompt =
    'You are Gyan Sir, founder of Commerce Gyan (Begusarai, Bihar) and premier CBSE Commerce mentor.\n' +
    'Generate a high-impact, classroom-ready lesson plan for:\n' +
    'SUBJECT: ' + subject + '\n' +
    'TOPIC: ' + title + ' (' + unit + ')\n\n' +
    'Include exactly 4 sections:\n' +
    '1. LEARNING OBJECTIVES (CBSE & BSEB Board Alignment)\n' +
    '2. BOARD EXAM TRAP RADAR (Mistakes students make)\n' +
    '3. STEP-BY-STEP WORKING NOTE (Exact numerical/conceptual presentation)\n' +
    '4. BEGUSARAI / INDIAN BUSINESS REAL-WORLD HOOK (e.g. Barauni Refinery, Tata, local Kirana)';

  var body = '';
  try {
    if (typeof callGeminiGenerateContent_ === 'function') {
      var geminiRes = callGeminiGenerateContent_({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
      });
      if (geminiRes && geminiRes.candidates && geminiRes.candidates[0].content && geminiRes.candidates[0].content.parts) {
        body = geminiRes.candidates[0].content.parts[0].text;
      }
    }
  } catch (err) {
    Logger.log('Gemini lesson plan warning: ' + err.message);
  }

  if (!body) {
    body = '1. LEARNING OBJECTIVES (CBSE & BSEB Board Alignment):\n' +
      '- Master key conceptual definitions and NCERT accounting principles.\n' +
      '- Prepare journal entries with complete narrations and ledger accounts.\n' +
      '- Calculate ratios and adjustments accurately in exam conditions.\n\n' +
      '2. BOARD EXAM TRAP RADAR:\n' +
      '- Watch out for date factors, pro-rata share limits, and old vs new partner distinctions.\n' +
      '- Never omit working notes: CBSE assigns up to 40% of marks to working notes.\n\n' +
      '3. STEP-BY-STEP WORKING NOTE:\n' +
      '- Step 1: Identify given parameters and apply the fundamental formula.\n' +
      '- Step 2: Set up journal entries / T-accounts with proper column headings.\n' +
      '- Step 3: Verify debit total equals credit total before concluding.\n\n' +
      '4. BEGUSARAI REAL-WORLD HOOK:\n' +
      '- Anchor this concept to local commercial transactions in Begusarai markets and Barauni industrial units.';
  }

  return {
    ok: true,
    lessonPlan: {
      id: 'LES-' + Date.now(),
      subject: subject,
      code: topicId,
      title: title,
      unit: unit,
      body: body
    }
  };
}
