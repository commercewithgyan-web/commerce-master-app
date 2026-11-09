/**
 * redpen.gs - Universal CBSE Red-Pen Engine (Commerce, Class 11-12, All 8 Subjects)
 * Flow: Gatekeeper & Value-Point Extraction -> Evaluate -> Validate & Score in Code.
 */

var CANDIDATE_MODELS = [
  'gemini-3.0-flash',
  'gemini-flash-latest',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

var RULE_CONFIG = {
  ownFigureRule: true,
  narrationCarriesMarks: false,
  spellingAffectsMarks: false,
  wordLimitAffectsMarks: false
};

var WORD_LIMITS = {
  ACCOUNTS: { 3: null, 4: null, 6: null },
  BST:      { 3: [50, 75], 4: [100, 125], 6: [150, 200] },
  ECON:     { 3: [50, 75], 4: [100, 125], 6: [150, 200] },
  STATS:    { 3: null, 4: null, 6: null }
};

var SUBJECT_PACKS = {
  ACC11: { vertical: 'ACCOUNTS', name: 'Accountancy (Class 11)' },
  ACC12: { vertical: 'ACCOUNTS', name: 'Accountancy (Class 12)' },
  BST11: { vertical: 'BST', name: 'Business Studies (Class 11)' },
  BST12: { vertical: 'BST', name: 'Business Studies (Class 12)' },
  ECO11_MICRO: { vertical: 'ECON', name: 'Micro Economics (Class 11)' },
  ECO12_MACRO: { vertical: 'ECON', name: 'Macro Economics (Class 12)' },
  IED12: { vertical: 'ECON', name: 'Indian Economic Development (Class 12)' },
  STAT11: { vertical: 'STATS', name: 'Statistics for Economics (Class 11)' }
};

var VERTICAL_RULES = {
  ACCOUNTS:
    'LENS: stepwise marking. Journal entry = accounts + Dr/Cr + amount. Ledger/statement = format judged separately from figures. ' +
    'Working notes, formulas and headings earn marks only if the value points list them.\n' +
    'MARKS-AFFECTING: wrong account, wrong amount, wrong Dr/Cr, missing entry, wrong head/sub-head, wrong formula, missing item that has its own value point.\n' +
    'ALERT ONLY: missing ruling, blank L.F., missing date, abbreviated but identifiable account name, missing rupee sign, narration (unless a value point lists it), rounding inside tolerance.',
  BST:
    'LENS: keyword-led value points (point + explanation). For case-based questions the concept must be identified AND justified from the case text.\n' +
    'MARKS-AFFECTING: wrong or missing concept/principle/function, point irrelevant to the question, one concept confused with another, required case justification missing.\n' +
    'ALERT ONLY: spelling that keeps the term recognisable, extra correct points, word limit exceeded, handwriting, heading style.',
  ECON:
    'LENS: numericals = formula, steps, answer with unit. Diagrams = labelled axes, correct curves, equilibrium/shift, scored separately from explanation. ' +
    'True/False or Agree/Disagree = verdict plus reason; a wrong verdict earns nothing for the reason.\n' +
    'MARKS-AFFECTING: wrong formula or step, wrong curve shape or shift direction, unlabelled axes if a value point lists them, wrong verdict, factual anchor (year/plan/policy) that a value point lists.\n' +
    'ALERT ONLY: diagram neatness, missing title or arrowheads, unlisted factual slips that do not change meaning, spelling, word limit.',
  STATS:
    'LENS: formula, table construction (mid-points, f*x, cumulative frequency), result, unit. Graphs = scale, axis labels, plotting accuracy, curve/bars.\n' +
    'MARKS-AFFECTING: wrong formula, wrong table values, wrong plotting, wrong scale, missing axis labels if a value point lists them.\n' +
    'ALERT ONLY: acceptable rounding differences, graph neatness, spelling.'
};

/* ---------- GATEKEEPER + VALUE POINT BUILDER ---------- */

function runGatekeeperAndBuildCtx_(imageBase64, confirmedStudentText) {
  var system = 'You are the CBSE Gatekeeper for Gyan Sir\'s Commerce Vault. ' +
    'Inspect the uploaded handwritten page and construct the official CBSE Value Points breakdown for the attempted question.';

  var prompt = [
    'Analyze this handwritten page and return JSON:',
    '1. If it is NOT a handwritten commerce answer (e.g. screenshot/blank), set isHandwritten=false.',
    '2. Identify subjectCode from: ACC11, ACC12, BST11, BST12, ECO11_MICRO, ECO12_MACRO, IED12, STAT11.',
    '3. Transcribe the student text verbatim (do NOT fix spelling or numbers).',
    '4. Construct the CBSE Value Points (VP1, VP2, VP3...) whose marks sum up to maxMarks (default 3 if not visible).'
  ].join('\n');

  var schema = {
    type: 'OBJECT',
    required: ['isHandwritten', 'rejectionReason', 'subjectCode', 'questionType', 'maxMarks', 'questionText', 'studentText', 'valuePoints'],
    properties: {
      isHandwritten: { type: 'BOOLEAN' },
      rejectionReason: { type: 'STRING' },
      subjectCode: { type: 'STRING', enum: ['ACC11', 'ACC12', 'BST11', 'BST12', 'ECO11_MICRO', 'ECO12_MACRO', 'IED12', 'STAT11'] },
      questionType: { type: 'STRING', enum: ['1M', 'SA1', 'SA2', 'LA', 'NUM', 'CASE'] },
      maxMarks: { type: 'NUMBER' },
      questionText: { type: 'STRING' },
      studentText: { type: 'STRING' },
      valuePoints: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          required: ['id', 'label', 'marks', 'type', 'keywords'],
          properties: {
            id: { type: 'STRING' },
            label: { type: 'STRING' },
            marks: { type: 'NUMBER' },
            type: { type: 'STRING' },
            keywords: { type: 'ARRAY', items: { type: 'STRING' } }
          }
        }
      }
    }
  };

  var cleanBase64 = String(imageBase64 || '').replace(/^data:image\/[a-zA-Z0-9\.\-\+]+;base64,/, '').trim();

  var raw = JSON.parse(callGemini_(system, [
    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
    { text: prompt }
  ], schema));

  if (confirmedStudentText) {
    raw.studentText = confirmedStudentText;
  }
  raw.schemeStatus = 'OFFICIAL';
  return raw;
}

/* ---------- CLAUDE'S EVALUATION PROMPT & VALIDATOR ---------- */

function buildEvaluatePrompt(ctx) {
  var pack = SUBJECT_PACKS[ctx.subjectCode] || SUBJECT_PACKS['BST12'];

  var system = [
    'You are a senior CBSE Class 11-12 Commerce examiner AND a warm mentor writing in the voice of "Gyan Sir" of Commerce Gyan. You review one handwritten answer at a time.',
    '',
    '## SOURCE OF TRUTH',
    '1. VALUE_POINTS below are the ONLY source of marks-affecting criteria. Never invent a criterion, a marks split, a keyword, a date, a figure or an NCERT fact that is not in VALUE_POINTS, QUESTION or STUDENT_TEXT.',
    '2. CBSE awards marks for value points EARNED. You never "deduct". For each value point give status earned / partial / missed and marks_awarded between 0 and that point\'s max.',
    '3. Credit correct answers in the student\'s own words and any correct alternative that meets the same competency. Do not require the exact wording of the scheme.',
    '',
    '## ALERTS NEVER CHANGE MARKS',
    '4. Spelling slips, handwriting, missing ruling/underlines, minor phrasing, word-limit overrun and extra correct points go in "alerts" with ZERO effect on marks.',
    '   Spelling: if the intended keyword is recognisable from context (e.g. a homophone like principal vs principle), the value point is earned and the slip is an alert.',
    '5. Own-figure rule = ' + RULE_CONFIG.ownFigureRule + '. If true: a wrong earlier figure loses only its own step; later steps that are correct on that figure still earn their marks.',
    '',
    '## SUBJECT LENS: ' + pack.name,
    VERTICAL_RULES[pack.vertical],
    '',
    '## EVIDENCE RULE',
    '6. evidence_quote and student_line must be copied VERBATIM from STUDENT_TEXT. Use "" for a missed point. Never quote text the student did not write.',
    '',
    '## STEP RULES',
    'Step 1: verdict_hi starts with what the student got RIGHT (1 sentence). did_right_hi lists 1-3 real strengths. Include every value point in value_point_results exactly once.',
    'Step 2: issues = only marks-affecting findings, each linked to a vp_id, explained for a 17-year-old. Do not speculate about what the student was thinking: describe what the line says and why it does not match the value point.',
    'Step 3: at most 3 upgrades. Each must change meaning-bearing content (keyword, concept, structure). NEVER a spelling-only fix. why_hi is one line from the examiner\'s point of view.',
    'Step 4: model answer = one point per relevant value point, built only from VALUE_POINTS and the question. Plain text; list the NCERT/scheme keywords in keywords[] (each must appear in text). No markdown asterisks, no HTML.',
    'Step 5: line_hi = one short memorable Hinglish line (max 12 words, e.g., "Sahi NCERT Keyword = Pakke Board Marks!"). one_action_hi = ONE concrete action in crisp English for the next answer.',
    '',
    '## LANGUAGE AND TONE (GEN-Z CBSE ENGLISH + HINGLISH TOUCH)',
    '1. NO HEAVY HINDI: Never use difficult Hindi words like निष्कर्ष, मुआवजा, सिद्धांत, औपचारिक, स्पष्ट उल्लेख. Students are English-medium Gen-Z learners.',
    '2. 90% CRISP ENGLISH: Write all value_point_results (reason_hi), did_right_hi, step2_issues (explain_hi, note_hi), and step3_upgrades (why_hi) in clear, sharp, easy-to-scan English.',
    '3. 10% HINGLISH FOR PERSONAL IMPACT ONLY (2 places):',
    '   - In step1_earned.verdict_hi: Use natural Roman Hinglish + English (e.g., "Solid attempt! Tumne case study ka core logic aur Utmost Good Faith bilkul sahi pakda hai!").',
    '   - In step5_mentor.line_hi: A punchy 1-line Hinglish mantra (e.g., "Sahi NCERT Keyword = Pakke Board Marks!").',
    '   - In step5_mentor.one_action_hi: Crisp English with a personal touch (e.g., "Next time, underline keywords like Uberrimae Fidei so the examiner spots them in 2 seconds.").'
  ].join('\n');

  var vpLines = ctx.valuePoints.map(function (v) {
    return '- ' + v.id + ' [' + (v.type || 'point') + ', max ' + v.marks + ' mark(s)]: ' + v.label +
      (v.keywords && v.keywords.length ? ' | keywords: ' + v.keywords.join('; ') : '');
  }).join('\n');

  var user = [
    'SCHEME_STATUS: ' + ctx.schemeStatus,
    'SUBJECT: ' + ctx.subjectCode + ' | QUESTION_TYPE: ' + ctx.questionType + ' | MAX_MARKS: ' + ctx.maxMarks,
    '',
    'QUESTION:',
    ctx.questionText,
    '',
    'VALUE_POINTS:',
    vpLines,
    '',
    'STUDENT_TEXT:',
    ctx.studentText
  ].join('\n');

  return { system: system, user: user };
}

function redpenResponseSchema() {
  var S = { type: 'STRING' };
  var arrS = { type: 'ARRAY', items: S };
  return {
    type: 'OBJECT',
    required: ['step1_earned', 'step2_issues', 'step3_upgrades', 'step4_model_answer', 'step5_mentor'],
    properties: {
      step1_earned: {
        type: 'OBJECT',
        required: ['verdict_hi', 'did_right_hi', 'value_point_results'],
        properties: {
          verdict_hi: S,
          did_right_hi: arrS,
          value_point_results: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['vp_id', 'status', 'marks_awarded', 'evidence_quote', 'reason_hi'],
              properties: {
                vp_id: S,
                status: { type: 'STRING', enum: ['earned', 'partial', 'missed'] },
                marks_awarded: { type: 'NUMBER' },
                evidence_quote: S,
                reason_hi: S
              }
            }
          }
        }
      },
      step2_issues: {
        type: 'OBJECT',
        required: ['issues', 'alerts'],
        properties: {
          issues: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['vp_id', 'issue_type', 'student_line', 'explain_hi', 'ncert_keyword'],
              properties: {
                vp_id: S,
                issue_type: { type: 'STRING', enum: ['conceptual', 'missing_keyword', 'calculation', 'format_marked', 'omission'] },
                student_line: S, explain_hi: S, ncert_keyword: S
              }
            }
          },
          alerts: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['type', 'student_line', 'note_hi'],
              properties: {
                type: { type: 'STRING', enum: ['spelling', 'handwriting', 'ruling', 'phrasing', 'word_limit', 'narration', 'other'] },
                student_line: S, note_hi: S
              }
            }
          }
        }
      },
      step3_upgrades: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          required: ['student_line', 'better_line', 'why_hi', 'vp_id'],
          properties: { student_line: S, better_line: S, why_hi: S, vp_id: S }
        }
      },
      step4_model_answer: {
        type: 'OBJECT',
        required: ['points'],
        properties: {
          points: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              required: ['vp_id', 'heading', 'text', 'keywords'],
              properties: { vp_id: S, heading: S, text: S, keywords: arrS }
            }
          }
        }
      },
      step5_mentor: {
        type: 'OBJECT',
        required: ['line_hi', 'one_action_hi'],
        properties: { line_hi: S, one_action_hi: S }
      }
    }
  };
}

function stripMarkup_(s) {
  return String(s == null ? '' : s).replace(/\*\*/g, '').replace(/<[^>]*>/g, '').replace(/^#+\s*/gm, '');
}

function sanitizeDeep_(o) {
  if (typeof o === 'string') return stripMarkup_(o);
  if (Array.isArray(o)) return o.map(sanitizeDeep_);
  if (o && typeof o === 'object') {
    var out = {};
    Object.keys(o).forEach(function (k) { out[k] = sanitizeDeep_(o[k]); });
    return out;
  }
  return o;
}

function countWords_(s) {
  var t = String(s || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

function validateAndScore(raw, ctx) {
  var errors = [], warnings = [];
  var r = sanitizeDeep_(raw);
  var vpMap = {};
  ctx.valuePoints.forEach(function (v) { vpMap[v.id] = v; });

  var results = (r.step1_earned && r.step1_earned.value_point_results) || [];
  var seen = {};
  var earned = 0;

  results.forEach(function (x) {
    var vp = vpMap[x.vp_id];
    if (!vp) { errors.push('Unknown vp_id: ' + x.vp_id); return; }
    seen[x.vp_id] = true;
    var m = Number(x.marks_awarded);
    if (isNaN(m) || m < 0 || m > vp.marks) { m = Math.max(0, Math.min(vp.marks, isNaN(m) ? 0 : m)); }
    x.marks_awarded = m;
    x.marks_max = vp.marks;
    x.label = vp.label;
    earned += m;
  });

  var pack = SUBJECT_PACKS[ctx.subjectCode] || SUBJECT_PACKS['BST12'];
  r.meta = {
    subject_code: ctx.subjectCode,
    subject_name: pack.name,
    question_type: ctx.questionType,
    max_marks: ctx.maxMarks,
    scheme_status: ctx.schemeStatus,
    student_text: ctx.studentText,
    question_text: ctx.questionText
  };
  r.computed = {
    marks_earned: Math.round(earned * 10) / 10,
    marks_lost: Math.round(Math.max(0, ctx.maxMarks - earned) * 10) / 10,
    word_check: wordCheck_(ctx)
  };

  return { ok: errors.length === 0, errors: errors, warnings: warnings, result: r };
}

function wordCheck_(ctx) {
  var pack = SUBJECT_PACKS[ctx.subjectCode] || SUBJECT_PACKS['BST12'];
  var limit = WORD_LIMITS[pack.vertical] && WORD_LIMITS[pack.vertical][ctx.maxMarks];
  var n = countWords_(ctx.studentText);
  if (!limit) return { count: n, limit: null, status: 'not_checked' };
  var status = n < limit[0] ? 'short' : (n > limit[1] ? 'long' : 'ok');
  return { count: n, limit: limit, status: status };
}

function cleanJsonResponseText_(text) {
  if (!text) return '{}';
  var cleaned = String(text).trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    var firstBrace = cleaned.indexOf('{');
    var firstBracket = cleaned.indexOf('[');
    var startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }
    if (startIdx !== -1) {
      var lastBrace = cleaned.lastIndexOf('}');
      var lastBracket = cleaned.lastIndexOf(']');
      var endIdx = Math.max(lastBrace, lastBracket);
      if (endIdx > startIdx) {
        cleaned = cleaned.slice(startIdx, endIdx + 1);
      }
    }
  }
  return cleaned;
}

function callGemini_(system, userParts, schema) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('GEMINI_KEY') || props.getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_KEY missing in Script Properties');

  var models = CANDIDATE_MODELS.slice();
  var customModel = props.getProperty('GEMINI_MODEL');
  if (customModel && models.indexOf(customModel) === -1) {
    models.unshift(customModel);
  }

  var errorLogs = [];

  for (var i = 0; i < models.length; i++) {
    var model = models[i];
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key;

    var gen = { temperature: 0.1 };
    if (schema) {
      gen.responseMimeType = 'application/json';
      gen.responseSchema = schema;
    }
    var payload = {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: userParts }],
      generationConfig: gen
    };

    try {
      var res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      var code = res.getResponseCode();
      var text = res.getContentText();

      if (code === 200) {
        var body = JSON.parse(text);
        if (body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts) {
          return cleanJsonResponseText_(body.candidates[0].content.parts[0].text);
        }
      }

      // If schema causes HTTP 400 (e.g. INVALID_ARGUMENT due to schema syntax in v1beta), fallback to json mode without schema
      if (code === 400 && schema) {
        var fallbackGen = { temperature: 0.1, responseMimeType: 'application/json' };
        var schemaInstruction = '\n\nIMPORTANT: Return strictly valid JSON conforming to this specification:\n' + JSON.stringify(schema);
        var fallbackPayload = {
          systemInstruction: { parts: [{ text: system + schemaInstruction }] },
          contents: [{ role: 'user', parts: userParts }],
          generationConfig: fallbackGen
        };

        var fallbackRes = UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(fallbackPayload),
          muteHttpExceptions: true
        });
        var fallbackCode = fallbackRes.getResponseCode();
        var fallbackText = fallbackRes.getContentText();

        if (fallbackCode === 200) {
          var fbBody = JSON.parse(fallbackText);
          if (fbBody.candidates && fbBody.candidates[0] && fbBody.candidates[0].content && fbBody.candidates[0].content.parts) {
            return cleanJsonResponseText_(fbBody.candidates[0].content.parts[0].text);
          }
        }
        errorLogs.push('[' + model + ' (schema-fallback)]: HTTP ' + fallbackCode + ': ' + fallbackText.slice(0, 160));
      } else {
        errorLogs.push('[' + model + ']: HTTP ' + code + ': ' + text.slice(0, 160));
      }
    } catch (e) {
      errorLogs.push('[' + model + ']: Exception: ' + e.message);
    }
  }

  throw new Error('Gemini API failed across candidate models:\n' + errorLogs.join('\n'));
}

/** Main Endpoint Handler */
function handleRunRedPenAnalysis(data) {
  var imageBase64 = data.imageBase64 || data.image || (data.pagesBase64 && data.pagesBase64[0]);
  var confirmedText = data.confirmedText || null;
  var telegramId = data.telegramId || '552858970';
  var studentName = data.studentName || 'Champion';

  if (!imageBase64) return { ok: false, error: 'No image received' };

  var ctx = runGatekeeperAndBuildCtx_(imageBase64, confirmedText);
  if (!ctx.isHandwritten) {
    return {
      ok: true,
      isValid: false,
      rejectionReason: ctx.rejectionReason || 'Please upload a clear photo of your handwritten notebook answer.'
    };
  }

  var prompt = buildEvaluatePrompt(ctx);
  var schema = redpenResponseSchema();
  var raw = JSON.parse(callGemini_(prompt.system, [{ text: prompt.user }], schema));
  var scored = validateAndScore(raw, ctx);

  // Background logging & drive save
  try {
    var driveUrl = saveRedPenImageToDrive_(imageBase64, telegramId);
    var subId = 'RP-' + Date.now();
    appendRow_('SHEET_QB', 'RedPen_Submissions', [
      subId,
      getKolkataTimestamp(),
      String(telegramId),
      studentName,
      ctx.subjectCode || 'BST12',
      ctx.questionText || '',
      driveUrl,
      scored.result.computed.marks_earned + ' / ' + scored.result.meta.max_marks + ' Marks',
      (scored.result.step2_issues.issues || []).map(function(iss) { return iss.explain_hi; }).join('; '),
      scored.result.step5_mentor.line_hi || '',
      '',
      'Evaluated'
    ]);
  } catch (e) {
    Logger.log('Drive/Sheet note: ' + e.message);
  }

  return {
    ok: true,
    isValid: true,
    data: scored.result
  };
}

/**
 * API bridge for Code.gs dispatch
 */
function apiSubmitRedPenCopy_(verifiedUser, payload) {
  payload = payload || {};
  payload.telegramId = String((verifiedUser && verifiedUser.id) || '552858970');
  payload.studentName = (verifiedUser && verifiedUser.first_name) || 'Champion';
  return handleRunRedPenAnalysis(payload);
}

/**
 * Saves uploaded compressed image to Google Drive folder
 */
function saveRedPenImageToDrive_(base64Data, studentId) {
  try {
    var folderName = 'Commerce Master App RedPen';
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    var cleanBase64 = String(base64Data).replace(/^data:image\/[a-zA-Z0-9\.\-\+]+;base64,/, '').trim();
    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, 'image/jpeg', 'RedPen_' + studentId + '_' + Date.now() + '.jpg');

    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return 'DRIVE_SAVE_FAILED';
  }
}

/**
 * Handles Telegram /redpen bot command
 */
function handleRedPenCommand_(chatId) {
  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  sendTelegramMessage_(chatId,
    '📸 *RED-PEN SNAPSHOT: UNIVERSAL CBSE COPY EVALUATOR*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Evaluate your handwritten solution against Gyan Sir\'s CBSE Value Points & Marking Schemes:\n\n' +
    '• 🎯 CBSE Value-Point Step-Check\n' +
    '• ⏱️ Word Limit & Presentation Audit\n' +
    '• 🔴 Marks-Affecting Conceptual Issues vs ⚠️ Zero-Mark Alerts\n' +
    '• 💡 Sentence Upgrades with Teacher "क्यों?"\n' +
    '• 🏆 100/100 Collapsible Model Solution\n\n' +
    'Tap below to open camera or upload from gallery:',
    {
      inline_keyboard: [
        [{ text: '📸 Open Red-Pen Evaluator', web_app: { url: miniAppUrl + '/redpen.html' } }]
      ]
    }
  );
}
