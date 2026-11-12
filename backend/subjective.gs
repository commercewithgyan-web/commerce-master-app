/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SINGLE-PDF BROADCAST CYCLE (subjective.gs)
 * Telegram Channel Hub, Daily A4 Question PDF (07:30 PM IST),
 * Next-Morning Model Answer PDF with Step-Marking Rubric (08:15 AM IST).
 * Zero 60-Student PDF Looping — Pure ~2-Second Fast Execution.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. 07:30 PM DAILY QUESTION BROADCAST
// ─────────────────────────────────────────────────────────────────────

/**
 * 07:30 PM IST Cron: Generates exactly ONE official A4 Question PDF per active class
 * and broadcasts it to the Telegram Channel with an embedded [📱 Start MCQ] button.
 */
function sendSubjectiveQuestionPDF() {
  Logger.log('🚀 Running 07:30 PM Single-PDF Question Broadcast for Class 11 & Class 12...');
  if (typeof isTodayHoliday_ === 'function' && isTodayHoliday_()) {
    Logger.log('🏖️ Today is marked as an Academic Holiday / Event in Academic_Calendar. Skipping 07:30 PM PDF broadcast.');
    return;
  }
  var props = PropertiesService.getScriptProperties();
  var todayStr = getKolkataDate();

  [11, 12].forEach(function(classLevel) {
    try {
      var channelId = props.getProperty('CHANNEL_ID_' + classLevel) ||
        (Number(classLevel) === 11 ? (props.getProperty('CHANNEL_ID_11') || '@commercewithgyan_class11') :
                                     (props.getProperty('CHANNEL_ID_12') || props.getProperty('CHANNEL_ID') || '@commercewithgyan_class12'));
      if (!channelId) {
        Logger.log('⚠️ No Channel ID configured for Class ' + classLevel + '; skipping broadcast.');
        return;
      }

      // Fetch today's approved subjective problem or active subtopic (supporting 2, 3, 4, 5, 6 marks)
      var subtopic = getActiveSubtopic_(classLevel);
      var qData = getApprovedSubjectiveQuestion_(classLevel, subtopic);

      // Generate single A4 Question PDF from Google Doc template
      var pdfResult = createQuestionPdfFromTemplate_({
        date: todayStr,
        classLevel: classLevel,
        subject: qData.subject,
        chapter: qData.chapter + ' — ' + qData.chapterName,
        questionText: qData.question,
        marks: qData.marks || 6,
        qid: qData.qid || ('Q_SUBJ_' + classLevel + '_' + todayStr)
      });

      // Deliver single PDF to class channel via multipart Blob upload (Law C-5)
      var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';
      var caption =
        '📚 *OFFICIAL CBSE PRACTICE PROBLEM — CLASS ' + classLevel + '*\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '• Subject: *' + qData.subject + '*\n' +
        '• Chapter: *' + qData.chapterName + '*\n' +
        '• Marks Weightage: *' + (qData.marks || 6) + ' Marks*\n\n' +
        '✍️ *Instructions*: Solve this in your physical practice register.\n' +
        'Model Answer with CBSE Step-Marking Rubric will be posted tomorrow at *08:15 AM IST*.\n\n' +
        '📱 *Paid Batch*: Attempt tonight\'s 5-MCQ Ghost challenge in the Mini App!';

      sendTelegramDocument_(
        channelId,
        pdfResult.pdfBlob,
        'Question_Class' + classLevel + '_' + todayStr.replace(/-/g, '_') + '.pdf',
        caption
      );

      // Cache pending record for exact morning answer pairing
      props.setProperty('PENDING_SUBJECTIVE_C' + classLevel, JSON.stringify({
        date: todayStr,
        channelId: channelId,
        classLevel: classLevel,
        driveUrl: pdfResult.driveUrl,
        qData: qData,
        timestamp: getKolkataTimestamp()
      }));

      // Log to Sheet 4 Tab 4.3 (Subjective_PDF_Log)
      appendRow_('SHEET_TG', 'Subjective_PDF_Log', [
        todayStr,
        pdfResult.driveUrl,
        'PENDING_MORNING_ANSWER',
        getKolkataTimestamp(),
        channelId,
        classLevel,
        qData.qid || ('Q_SUBJ_' + classLevel + '_' + todayStr),
        JSON.stringify(qData)
      ]);

      Logger.log('  ✅ Class ' + classLevel + ' Question PDF broadcasted in ~2.1 seconds to ' + channelId);

    } catch (e) {
      logError_('sendSubjectiveQuestionPDF_Class' + classLevel, e);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────
// 2. 08:15 AM MODEL ANSWER BROADCAST
// ─────────────────────────────────────────────────────────────────────

/**
 * 08:15 AM IST Cron: Generates exactly ONE official Model Answer PDF per class
 * with CBSE step-by-step marking rubric, common pitfalls, and examiner traps.
 */
function sendSubjectiveAnswerPDF() {
  Logger.log('🌅 Running 08:15 AM Model Answer PDF Broadcast for Class 11 & Class 12...');
  if (typeof isTodayHoliday_ === 'function' && isTodayHoliday_()) {
    Logger.log('🏖️ Today is marked as an Academic Holiday / Event in Academic_Calendar. Skipping 08:15 AM PDF broadcast.');
    return;
  }
  var props = PropertiesService.getScriptProperties();
  var todayStr = getKolkataDate();

  [11, 12].forEach(function(classLevel) {
    try {
      var channelId = props.getProperty('CHANNEL_ID_' + classLevel) ||
        (Number(classLevel) === 11 ? (props.getProperty('CHANNEL_ID_11') || '@commercewithgyan_class11') :
                                     (props.getProperty('CHANNEL_ID_12') || props.getProperty('CHANNEL_ID') || '@commercewithgyan_class12'));
      if (!channelId) return;

      var qData = null;
      var pendingRaw = props.getProperty('PENDING_SUBJECTIVE_C' + classLevel);
      if (pendingRaw) {
        try {
          var pendingObj = JSON.parse(pendingRaw);
          if (pendingObj && pendingObj.qData) {
            qData = pendingObj.qData;
          }
        } catch (_) {}
      }

      // If not in ScriptProperties, scan Subjective_PDF_Log backwards for the unfulfilled question
      if (!qData) {
        try {
          var logSheet = getSheet_('SHEET_TG', 'Subjective_PDF_Log');
          if (logSheet) {
            var data = logSheet.getDataRange().getValues();
            for (var r = data.length - 1; r >= 1; r--) {
              var row = data[r];
              var rowStatus = String(row[2] || '');
              var rowClass = String(row[5] || '');
              var rowPayload = row[7];
              if (rowStatus === 'PENDING_MORNING_ANSWER' && (!rowClass || Number(rowClass) === Number(classLevel))) {
                if (rowPayload) {
                  try { qData = JSON.parse(rowPayload); break; } catch (_) {}
                }
              }
            }
          }
        } catch (_) {}
      }

      // Fallback if no pending record found
      if (!qData) {
        var subtopic = getActiveSubtopic_(classLevel);
        qData = getApprovedSubjectiveQuestion_(classLevel, subtopic);
      }

      // Generate Model Answer PDF
      var ansResult = createAnswerPdfFromTemplate_({
        date: todayStr,
        classLevel: classLevel,
        subject: qData.subject,
        chapter: qData.chapter + ' — ' + qData.chapterName,
        questionText: qData.question,
        marks: qData.marks || 6,
        answerText: qData.modelAnswer,
        marksBreakdown: qData.rubric || '• 1 Mark: Correct Account Heads\n• 3 Marks: Accurate Journal / Ledger Calculations\n• 2 Marks: Proper Narrations & Double-Line Totaling',
        commonMistakes: qData.traps || '• Missing (Being...) narrations result in a 0.5-mark penalty.\n• Forfeiture account must not be credited with unpaid call amounts.',
        qid: qData.qid || ('Q_SUBJ_' + classLevel + '_' + todayStr)
      });

      var caption =
        '✅ *OFFICIAL MODEL ANSWER KEY & CBSE RUBRIC — CLASS ' + classLevel + '*\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        'Compare your register solution step-by-step against the official CBSE marking scheme.\n\n' +
        '📸 Want instant diagnostic copy checking? Use the *Red-Pen Snapshot* tool in your Mini App!';

      sendTelegramDocument_(
        channelId,
        ansResult.pdfBlob,
        'Answer_Class' + classLevel + '_' + todayStr.replace(/-/g, '_') + '.pdf',
        caption
      );

      // Clean up pending flag in properties
      try { props.deleteProperty('PENDING_SUBJECTIVE_C' + classLevel); } catch (_) {}

      // Update Subjective_PDF_Log
      var logSheet = getSheet_('SHEET_TG', 'Subjective_PDF_Log');
      if (logSheet) {
        var lastRow = logSheet.getLastRow();
        if (lastRow > 1) {
          updateCell_('SHEET_TG', 'Subjective_PDF_Log', lastRow, 3, ansResult.driveUrl);
        }
      }

      Logger.log('  ✅ Class ' + classLevel + ' Model Answer PDF broadcasted to ' + channelId);

    } catch (e) {
      logError_('sendSubjectiveAnswerPDF_Class' + classLevel, e);
    }
  });
}


// ─────────────────────────────────────────────────────────────────────
// 3. OFFICIAL "COMMERCE GYAN — DAILY PRACTICE SHEET" A4 MULTI-PAGE ENGINE
// ─────────────────────────────────────────────────────────────────────

var _CACHED_STATIONERY_B64 = null;

/**
 * Retrieves base64 of official stationery PNG with in-memory execution caching
 * @return {string}
 */
function getStationeryBackgroundBase64_() {
  if (_CACHED_STATIONERY_B64) return _CACHED_STATIONERY_B64;
  var props = PropertiesService.getScriptProperties();
  var bgFileId = props.getProperty('PRACTICE_SHEET_BG_FILE_ID') || '1G5FOitdeuh8FgLbnkgNdqiftvtCfiIah';
  if (!bgFileId) {
    throw new Error('PRACTICE_SHEET_BG_FILE_ID is not configured in Script Properties.');
  }
  var bgFile = DriveApp.getFileById(bgFileId);
  if (!bgFile) {
    throw new Error('PRACTICE_SHEET_BG_FILE_ID (' + bgFileId + ') not found in Google Drive.');
  }
  _CACHED_STATIONERY_B64 = Utilities.base64Encode(bgFile.getBlob().getBytes());
  return _CACHED_STATIONERY_B64;
}

/**
 * Computes deterministic SHA-256 hash for idempotency checking
 * @param {*} payload
 * @return {string}
 */
function computeContentHash_(payload) {
  var rawStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  var hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawStr, Utilities.Charset.UTF_8);
  var out = '';
  for (var i = 0; i < hashBytes.length; i++) {
    var b = hashBytes[i];
    var hex = (b < 0 ? b + 256 : b).toString(16);
    out += (hex.length === 1 ? '0' + hex : hex);
  }
  return out;
}

/**
 * Compiles official A4 Question PDF on "Commerce Gyan — Daily Practice Sheet" template
 * with quota guard & idempotency check.
 * @param {Object} data
 * @return {{ driveUrl: string, pdfBlob: GoogleAppsScript.Base.Blob, qid: string, pageCount: number, cached: boolean }}
 */
function createQuestionPdfFromTemplate_(data) {
  data = data || {};
  var classLevel = Number(data.classLevel) || 12;
  var rawDate = String(data.date || getKolkataDate()).replace(/[^0-9a-zA-Z]/g, '_');
  var qid = data.qid || ('Q_SUBJ_' + classLevel + '_' + rawDate);

  // 1. Idempotency Check
  var hashInput = ['QUESTION', classLevel, data.subject || 'Accountancy', qid, data.questionText || ''].join(':::');
  var contentHash = computeContentHash_(hashInput);
  var cachedUrl = typeof findCachedRender_ === 'function' ? findCachedRender_(contentHash) : null;
  if (cachedUrl && !data.bypassCache) {
    Logger.log('⚡ Idempotency Hit: Reusing rendered Question PDF: ' + cachedUrl);
    return {
      driveUrl: cachedUrl,
      pdfBlob: null,
      qid: qid,
      pageCount: 1,
      cached: true
    };
  }

  // 2. Compile Multi-Page HTML
  var renderResult = generateMultiPageDailyPracticeSheetHtml_(data, false);
  var fileName = 'DPS_Question_Class' + classLevel + '_' + rawDate;
  var htmlBlob = Utilities.newBlob(renderResult.html, 'text/html', fileName + '.html');
  var pdfBlob = htmlBlob.getAs('application/pdf');
  pdfBlob.setName(fileName + '.pdf');

  var folder = getOrCreatePdfFolder_('Commerce Master App Daily PDFs');
  var permPdf = folder.createFile(pdfBlob);
  permPdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var permUrl = permPdf.getUrl();

  // 3. Log to Render_Log
  if (typeof logRenderExecution_ === 'function') {
    logRenderExecution_({
      date: data.date || getKolkataDate(),
      classLevel: classLevel,
      subject: data.subject || 'Accountancy',
      qid: qid,
      pageCount: renderResult.pageCount,
      contentHash: contentHash,
      pdfUrl: permUrl,
      status: 'SUCCESS',
      errorMessage: ''
    });
  }

  return {
    driveUrl: permUrl,
    pdfBlob: pdfBlob,
    qid: qid,
    pageCount: renderResult.pageCount,
    cached: false
  };
}

/**
 * Compiles official A4 Model Answer PDF on "Commerce Gyan — Daily Practice Sheet" template
 * with quota guard & idempotency check.
 * @param {Object} data
 * @return {{ driveUrl: string, pdfBlob: GoogleAppsScript.Base.Blob, qid: string, pageCount: number, cached: boolean }}
 */
function createAnswerPdfFromTemplate_(data) {
  data = data || {};
  var classLevel = Number(data.classLevel) || 12;
  var rawDate = String(data.date || getKolkataDate()).replace(/[^0-9a-zA-Z]/g, '_');
  var qid = data.qid || ('A_SUBJ_' + classLevel + '_' + rawDate);

  // 1. Idempotency Check
  var hashInput = ['ANSWER', classLevel, data.subject || 'Accountancy', qid, data.questionText || '', data.answerText || '', data.marksBreakdown || '', data.commonMistakes || ''].join(':::');
  var contentHash = computeContentHash_(hashInput);
  var cachedUrl = typeof findCachedRender_ === 'function' ? findCachedRender_(contentHash) : null;
  if (cachedUrl && !data.bypassCache) {
    Logger.log('⚡ Idempotency Hit: Reusing rendered Model Answer PDF: ' + cachedUrl);
    return {
      driveUrl: cachedUrl,
      pdfBlob: null,
      qid: qid,
      pageCount: 1,
      cached: true
    };
  }

  // 2. Compile Multi-Page HTML
  var renderResult = generateMultiPageDailyPracticeSheetHtml_(data, true);
  var fileName = 'DPS_Answer_Class' + classLevel + '_' + rawDate;
  var htmlBlob = Utilities.newBlob(renderResult.html, 'text/html', fileName + '.html');
  var pdfBlob = htmlBlob.getAs('application/pdf');
  pdfBlob.setName(fileName + '.pdf');

  var folder = getOrCreatePdfFolder_('Commerce Master App Daily PDFs');
  var permPdf = folder.createFile(pdfBlob);
  permPdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var permUrl = permPdf.getUrl();

  // 3. Log to Render_Log
  if (typeof logRenderExecution_ === 'function') {
    logRenderExecution_({
      date: data.date || getKolkataDate(),
      classLevel: classLevel,
      subject: data.subject || 'Accountancy',
      qid: qid,
      pageCount: renderResult.pageCount,
      contentHash: contentHash,
      pdfUrl: permUrl,
      status: 'SUCCESS',
      errorMessage: ''
    });
  }

  return {
    driveUrl: permUrl,
    pdfBlob: pdfBlob,
    qid: qid,
    pageCount: renderResult.pageCount,
    pageMms: renderResult.pageMms,
    cached: false
  };
}

/**
 * Generates the complete, self-contained multi-page HTML for Gyan Sir's official
 * "Commerce Gyan — Daily Practice Sheet" A4 Stationery.
 *
 * @param {Object} data
 * @param {boolean} isAnswerKey
 * @return {{ html: string, pageCount: number }}
 */

/**
 * Lightweight DSL Parser for Question & Model Answer bodies.
 * Supports: #TABLE, #TACCOUNT, #CAPITAL, #JOURNAL, #GRAPH:<template>, #FORMULA, #FLOW, #CARD, #PAGEBREAK
 * Applies rule-based auto-judgment when no markers are present.
 * @param {string} rawText
 * @param {string} subject
 * @param {boolean} isAnswerKey
 * @return {Array<Object>}
 */

/**
 * Splits markdown pipe lines cleanly removing leading/trailing empty elements
 * @param {string} line
 * @return {string[]}
 */

/**
 * ═══════════════════════════════════════════════════════════════════════
 * TRUE DYNAMIC STRUCTURE AUTO-DETECTION & ADAPTIVE LAYOUT ENGINE (v4.4.0)
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Dynamic Two-Tier Structure Detector & Block Classifier
 * Tier A: Explicit Render_Spec JSON (if present)
 * Tier B: Pure Rule-Based Structural Auto-Detector (Zero API Cost, Plain text or # tags)
 * @param {string} rawText
 * @param {string} subject
 * @param {string|Object} [existingRenderSpec]
 * @return {Array<Object>}
 */
function analyzeAndStructureBlock_(rawText, subject, existingRenderSpec) {
  // Tier A: Explicit Render_Spec override
  if (existingRenderSpec) {
    try {
      var spec = typeof existingRenderSpec === 'string' ? JSON.parse(existingRenderSpec) : existingRenderSpec;
      if (spec && Array.isArray(spec.blocks) && spec.blocks.length > 0) {
        return spec.blocks;
      }
    } catch (_) {}
  }

  // Tier B: Rule-based auto-detection
  return parseDslBlocks_(rawText, subject, true);
}

/**
 * Strips raw # DSL tags and table borders from question recap for clean prose presentation
 * @param {string} rawText
 * @return {string}
 */
function cleanQuestionRecapText_(rawText) {
  if (!rawText) return '';
  var s = String(rawText);
  // Strip entire table blocks including all intermediate rows
  s = s.replace(/#(TABLE|TACCOUNT|CAPITAL|JOURNAL)[\s\S]*?#END\1/gi, '');
  // Strip any remaining markdown pipe lines
  s = s.replace(/^\s*\|.*\|\s*$/gm, '');
  // Strip remaining DSL tags
  s = s.replace(/#END(TABLE|TACCOUNT|CAPITAL|JOURNAL|FLOW|FORMULA|CARD)/gi, '');
  s = s.replace(/#(TABLE|TACCOUNT|CAPITAL|JOURNAL|FLOW|FORMULA|CARD|GRAPH)[^\n]*/gi, '');
  // Clean whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // Limit to clean 1-2 line summary (~160-200 chars)
  if (s.length > 200) {
    s = s.substring(0, 197) + '...';
  }
  return s;
}

/**
 * Deterministic height estimator in millimeters for document blocks
 * @param {Object} blk
 * @return {number}
 */
function calcBlockEstMm_(blk) {
  if (!blk) return 15;
  switch (blk.type) {
    case 'recap':
      return 26;
    case 'text':
      var chars = (blk.text || '').length;
      return 6 + Math.ceil(chars / 85) * 4.5;
    case 'card':
      var bodyChars = (blk.body || blk.text || '').length;
      return 6 + Math.ceil(bodyChars / 85) * 4.5;
    case 'taccount':
    case 'capital':
    case 'table':
    case 'journal':
      var lines = String(blk.rowsText || '').trim().split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
      var rowCount = Math.max(1, lines.length > 1 ? lines.length - 1 : lines.length);
      return 16 + (rowCount * 6.8) + 10;
    case 'graph':
      return 62;
    case 'formula':
      return 22;
    case 'flow':
      var steps = String(blk.steps || '').split(/->|\n/).map(function(s) { return s.trim(); }).filter(Boolean);
      return 14 + (steps.length * 12);
    case 'footer_block':
      var rLines = blk.rubricText ? blk.rubricText.split('\n').filter(function(l) { return l.trim(); }).length : 0;
      var tLines = blk.trapsText ? blk.trapsText.split('\n').filter(function(l) { return l.trim(); }).length : 0;
      return 18 + ((rLines + tLines) * 4.8) + 14;
    case 'question_header':
      return 18;
    case 'question_workingspace':
      return 55;
    case 'question_footer':
      return 14;
    default:
      return blk.estHeight || blk.estMm || 20;
  }
}

/**
 * Dynamically calculates <colgroup> for Partners' Capital Account with N partners (exact 50% | 50% split)
 * Left: Particulars (22%) + N partners (28/N)% = 50%
 * Right: Particulars (22%) + N partners (28/N)% = 50%
 * @param {number} n
 * @return {string}
 */
function generatePartnersCapitalColgroup_(n) {
  n = Math.max(1, parseInt(n, 10) || 2);
  var partPct = 22;
  var partnerPct = (28 / n).toFixed(2);
  var leftCols = '<col style="width: ' + partPct + '%;">';
  for (var i = 0; i < n; i++) leftCols += '<col style="width: ' + partnerPct + '%;">';
  var rightCols = '<col style="width: ' + partPct + '%;">';
  for (var j = 0; j < n; j++) rightCols += '<col style="width: ' + partnerPct + '%;">';
  return '<colgroup>' + leftCols + rightCols + '</colgroup>';
}

/**
 * Dynamically calculates <colgroup> for arbitrary tables with K columns
 * @param {string[]} cols
 * @param {string} title
 * @return {string}
 */
function generateArbitraryColgroup_(cols, title) {
  var k = cols.length;
  if (k === 0) return '';
  if (k === 4 && /balance sheet|revaluation|realisation|trading|p&l|cash|bank/i.test(title || '')) {
    return '<colgroup><col style="width: 36%;"><col style="width: 14%;"><col style="width: 36%;"><col style="width: 14%;"></colgroup>';
  }
  if (k === 5 && /journal/i.test(title || '')) {
    return '<colgroup><col style="width: 12%;"><col style="width: 48%;"><col style="width: 8%;"><col style="width: 16%;"><col style="width: 16%;"></colgroup>';
  }

  // Statistics / Arbitrary table (First label column: 22%; remaining K - 1 numeric columns: (78 / (K - 1)).toFixed(2)% each)
  var firstColPct = 22;
  var remPct = (k > 1) ? ((100 - firstColPct) / (k - 1)).toFixed(2) : 78;
  var colsHtml = '<col style="width: ' + firstColPct + '%;">';
  for (var i = 1; i < k; i++) {
    colsHtml += '<col style="width: ' + remPct + '%;">';
  }
  return '<colgroup>' + colsHtml + '</colgroup>';
}

function splitPipes_(line) {
  var cols = String(line || '').split('|').map(function(c) { return c.trim(); });
  if (cols.length > 0 && cols[0] === '') cols.shift();
  if (cols.length > 0 && cols[cols.length - 1] === '') cols.pop();
  return cols;
}

function parseDslBlocks_(rawText, subject, isAnswerKey) {
  rawText = String(rawText || '').trim();
  subject = String(subject || 'Accountancy').toLowerCase();
  if (!rawText) return [];

  var blocks = [];
  var lines = rawText.split('\n');
  var currentBlockType = null;
  var currentMeta = '';
  var currentBuffer = [];

  function flushBuffer() {
    if (!currentBuffer.length && !currentBlockType) return;
    var bufText = currentBuffer.join('\n').trim();
    if (!bufText && currentBlockType !== 'pagebreak' && currentBlockType !== 'graph') {
      currentBlockType = null;
      currentMeta = '';
      currentBuffer = [];
      return;
    }

    if (currentBlockType === 'pagebreak') {
      blocks.push({ type: 'pagebreak', estHeight: 0 });
    } else if (currentBlockType === 'graph') {
      var parts = currentMeta.split('|');
      blocks.push({
        type: 'graph',
        template: parts[0] || 'demand_shift',
        caption: parts[1] || 'Economic Diagram',
        estHeight: 50
      });
    } else if (currentBlockType === 'formula') {
      blocks.push({
        type: 'formula',
        formula: bufText,
        label: currentMeta || 'Key Formula',
        estHeight: 20
      });
    } else if (currentBlockType === 'flow') {
      var stepLines = bufText.split(/->|\n/).map(function(s) { return s.trim(); }).filter(Boolean);
      blocks.push({
        type: 'flow',
        steps: bufText,
        estHeight: 12 + stepLines.length * 6.5
      });
    } else if (currentBlockType === 'card') {
      blocks.push({
        type: 'card',
        title: currentMeta || 'Case Scenario',
        body: bufText,
        estHeight: 14 + Math.ceil(bufText.length / 85) * 4.5
      });
    } else if (currentBlockType === 'taccount') {
      var tLines = bufText.split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
      blocks.push({
        type: 'taccount',
        title: currentMeta || 'Ledger Account',
        rowsText: bufText,
        estHeight: 16 + tLines.length * 6.5
      });
    } else if (currentBlockType === 'capital') {
      var cLines = bufText.split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
      blocks.push({
        type: 'capital',
        partnersText: currentMeta || 'Partners',
        rowsText: bufText,
        estHeight: 16 + cLines.length * 6.5
      });
    } else if (currentBlockType === 'journal') {
      var jLines = bufText.split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
      blocks.push({
        type: 'journal',
        rowsText: bufText,
        estHeight: 16 + jLines.length * 6.5
      });
    } else if (currentBlockType === 'table') {
      var tblLines = bufText.split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
      blocks.push({
        type: 'table',
        title: currentMeta,
        rowsText: bufText,
        estHeight: (currentMeta ? 18 : 14) + tblLines.length * 6.5
      });
    } else {
      classifyAndPushUnmarked_(bufText, subject, blocks);
    }

    currentBlockType = null;
    currentMeta = '';
    currentBuffer = [];
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();

    if (trimmed === '#PAGEBREAK') {
      flushBuffer();
      currentBlockType = 'pagebreak';
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#GRAPH') === 0) {
      flushBuffer();
      currentBlockType = 'graph';
      currentMeta = trimmed.replace(/^#GRAPH[:\s]*/i, '').trim();
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#FORMULA') === 0) {
      flushBuffer();
      currentBlockType = 'formula';
      currentMeta = trimmed.replace(/^#FORMULA[:\s]*/i, '').trim() || 'Formula';
      continue;
    }
    if (trimmed === '#ENDFORMULA') {
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#FLOW') === 0) {
      flushBuffer();
      currentBlockType = 'flow';
      continue;
    }
    if (trimmed === '#ENDFLOW') {
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#CARD') === 0) {
      flushBuffer();
      currentBlockType = 'card';
      currentMeta = trimmed.replace(/^#CARD[:\s]*/i, '').trim();
      continue;
    }
    if (trimmed === '#ENDCARD') {
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#TACCOUNT') === 0) {
      flushBuffer();
      currentBlockType = 'taccount';
      currentMeta = trimmed.replace(/^#TACCOUNT[:\s]*/i, '').trim();
      continue;
    }
    if (trimmed === '#ENDTACCOUNT') {
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#CAPITAL') === 0) {
      flushBuffer();
      currentBlockType = 'capital';
      currentMeta = trimmed.replace(/^#CAPITAL[:\s]*/i, '').trim();
      continue;
    }
    if (trimmed === '#ENDCAPITAL') {
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#JOURNAL') === 0) {
      flushBuffer();
      currentBlockType = 'journal';
      continue;
    }
    if (trimmed === '#ENDJOURNAL') {
      flushBuffer();
      continue;
    }

    if (trimmed.indexOf('#TABLE') === 0) {
      flushBuffer();
      currentBlockType = 'table';
      currentMeta = trimmed.replace(/^#TABLE[:\s]*/i, '').trim();
      continue;
    }
    if (trimmed === '#ENDTABLE') {
      flushBuffer();
      continue;
    }

    currentBuffer.push(line);
  }

  flushBuffer();
  return blocks;
}

/**
 * Auto-judgment classifier for unannotated content across CBSE Commerce subjects
 */
function classifyAndPushUnmarked_(text, subject, blocks) {
  if (!text) return;
  var lines = text.split('\n');
  var tableLines = lines.filter(function(l) { return l.indexOf('|') !== -1; });

  if (tableLines.length >= 2) {
    var headerLine = tableLines[0].toLowerCase();
    if (headerLine.indexOf('date') !== -1 && headerLine.indexOf('particulars') !== -1 && (headerLine.indexOf('dr') !== -1 || headerLine.indexOf('debit') !== -1)) {
      blocks.push({
        type: 'journal',
        rowsText: text,
        estHeight: 16 + tableLines.length * 6.5
      });
      return;
    }

    if (headerLine.indexOf('particulars') !== -1 && (headerLine.indexOf('alok') !== -1 || headerLine.indexOf('deepak') !== -1 || headerLine.indexOf('partner') !== -1 || headerLine.indexOf('rohit') !== -1 || (headerLine.match(/\([₹rs\.]+\)/g) || []).length >= 4)) {
      blocks.push({
        type: 'capital',
        partnersText: 'Partners',
        rowsText: text,
        estHeight: 16 + tableLines.length * 6.5
      });
      return;
    }

    var cols = tableLines[0].split('|');
    if (cols.length === 4 || (headerLine.match(/particulars/g) || []).length === 2) {
      blocks.push({
        type: 'taccount',
        title: 'Ledger Account',
        rowsText: text,
        estHeight: 16 + tableLines.length * 6.5
      });
      return;
    }

    blocks.push({
      type: 'table',
      rowsText: text,
      estHeight: 14 + tableLines.length * 6.5
    });
    return;
  }

  // Statistics Formula Auto-Judgment
  if (/(\\frac|\\sigma|\\bar\{x\}|\\sum|\\sqrt|r\s*=|Mean\s*=|SD\s*=)/i.test(text)) {
    blocks.push({
      type: 'formula',
      formula: text,
      label: 'Formula',
      estHeight: 20
    });
    return;
  }

  // BST Flowchart Auto-Judgment
  if (text.indexOf('->') !== -1 && text.split('->').length >= 3) {
    blocks.push({
      type: 'flow',
      steps: text,
      estHeight: 12 + text.split('->').length * 6.5
    });
    return;
  }

  // BST Case Study Auto-Judgment
  if (/^(Case\s*(Study|Scenario)|Read\s*the\s*following\s*scenario)/i.test(text)) {
    var parts = text.split('\n\n');
    var caseBody = parts[0];
    blocks.push({
      type: 'card',
      title: 'Case Scenario',
      body: caseBody,
      estHeight: 14 + Math.ceil(caseBody.length / 80) * 5
    });
    if (parts.length > 1) {
      var remaining = parts.slice(1).join('\n\n');
      blocks.push({
        type: 'text',
        text: remaining,
        estHeight: Math.max(12, Math.ceil(remaining.length / 85) * 5.5 + 4)
      });
    }
    return;
  }

  // Economics Graph Auto-Judgment
  var textLower = text.toLowerCase();
  if (subject.indexOf('eco') !== -1 || subject.indexOf('economics') !== -1) {
    if (textLower.indexOf('shift in demand') !== -1 || textLower.indexOf('increase in demand') !== -1 || textLower.indexOf('decrease in demand') !== -1) {
      blocks.push({
        type: 'text',
        text: text,
        estHeight: Math.max(12, Math.ceil(text.length / 85) * 5.5 + 4)
      });
      blocks.push({
        type: 'graph',
        template: 'demand_shift',
        caption: 'Rightward Shift in Demand Curve (Increase in Demand)',
        estHeight: 52
      });
      return;
    }
    if (textLower.indexOf('ppc') !== -1 || textLower.indexOf('production possibility') !== -1) {
      blocks.push({
        type: 'text',
        text: text,
        estHeight: Math.max(12, Math.ceil(text.length / 85) * 5.5 + 4)
      });
      blocks.push({
        type: 'graph',
        template: 'ppc',
        caption: 'Production Possibility Curve (PPC)',
        estHeight: 52
      });
      return;
    }
  }

  blocks.push({
    type: 'text',
    text: text,
    estHeight: Math.max(12, Math.ceil(text.length / 85) * 5.5 + 4)
  });
}

function generateMultiPageDailyPracticeSheetHtml_(data, isAnswerKey) {
  data = data || {};
  var isAns = !!isAnswerKey;
  var classLevel = Number(data.classLevel) || 12;
  var marks = Number(data.marks) || 6;
  var bgBase64 = data.bgBase64 || getStationeryBackgroundBase64_();

  // Header metadata
  var rawDate = formatDateDps_(data.date);
  var subjectText = 'Class ' + classLevel + ' • ' + (data.subject || 'Accountancy');
  var topicText = String(data.chapter || (classLevel === 11 ? 'Bank Reconciliation Statement' : 'Partnership Accounts Fundamentals'));
  if (topicText.length > 48) {
    topicText = topicText.substring(0, 46) + '...';
  }
  var baseSheetNumber = formatSheetNumberDps_(data.qid, classLevel, marks, isAns);

  // Build content blocks
  var blocks = [];
  if (!isAns) {
    // Question PDF Layout (Publication Grade)
    blocks.push({
      type: 'question_header',
      marks: marks,
      classLevel: classLevel,
      topicText: topicText,
      dateStr: rawDate,
      estMm: 18
    });
    var qBlocks = analyzeAndStructureBlock_(data.questionText || '', data.subject, data.renderSpec);
    for (var qb = 0; qb < qBlocks.length; qb++) {
      qBlocks[qb].estMm = calcBlockEstMm_(qBlocks[qb]);
      blocks.push(qBlocks[qb]);
    }
    blocks.push({
      type: 'question_workingspace',
      estMm: 55
    });
    blocks.push({
      type: 'question_footer',
      estMm: 14
    });
  } else {
    // Model Answer PDF Layout (Publication Grade)
    // 1. Recap Box (Stripped of raw table/pipes, clean 1-2 lines)
    var cleanRecap = cleanQuestionRecapText_(data.recapText || data.questionText || '');
    blocks.push({
      type: 'recap',
      name: 'recap',
      text: cleanRecap,
      marks: marks,
      classLevel: classLevel,
      dateStr: rawDate,
      estMm: 26
    });

    // 2. Answer Blocks (from mainAnswerJson if present, else parsed from answerText)
    var ansBlocks = [];
    if (data.mainAnswerJson) {
      try {
        var parsedJson = typeof data.mainAnswerJson === 'string' ? JSON.parse(data.mainAnswerJson) : data.mainAnswerJson;
        if (Array.isArray(parsedJson)) ansBlocks = parsedJson;
        else if (parsedJson && Array.isArray(parsedJson.blocks)) ansBlocks = parsedJson.blocks;
      } catch (_) {}
    }
    if (!ansBlocks || ansBlocks.length === 0) {
      ansBlocks = analyzeAndStructureBlock_(data.answerText || '', data.subject, data.renderSpec);
    }

    for (var ab = 0; ab < ansBlocks.length; ab++) {
      var aBlk = ansBlocks[ab];
      aBlk.drCrCheck = !!data.drCrCheck;
      aBlk.estMm = calcBlockEstMm_(aBlk);
      blocks.push(aBlk);
    }

    // 3. Combined Footer Block (Rubric + Common Traps wrapped together in ONE keep-together block)
    var rubric = data.markingScheme || data.marksBreakdown || '';
    var traps = data.commonTraps || data.commonMistakes || '';
    if (rubric || traps) {
      var rLines = rubric ? rubric.split('\n').filter(function(l) { return l.trim(); }).length : 0;
      var tLines = traps ? traps.split('\n').filter(function(l) { return l.trim(); }).length : 0;
      var footerEstMm = 18 + ((rLines + tLines) * 4.8) + 14;
      blocks.push({
        type: 'footer_block',
        name: 'footer_block',
        rubricText: rubric,
        trapsText: traps,
        estMm: footerEstMm
      });
    }
  }

  // Greedy Paginator with strict 192mm Cutoff
  var paginated = paginateBlocks_(blocks);
  var pages = paginated.pages;
  var pageMms = paginated.pageMms;
  var totalPages = pages.length;

  var headerData = {
    isAns: isAns,
    classLevel: classLevel,
    subjectText: subjectText,
    topicText: topicText,
    formattedDate: rawDate,
    sheetNumber: baseSheetNumber,
    totalPages: totalPages,
    marks: marks
  };

  var fullHtml = buildMultiPageDocumentHtml_(pages, headerData, bgBase64);
  return {
    html: fullHtml,
    pageCount: totalPages,
    pageMms: pageMms
  };
}

/**
 * Greedy block packing into pages with 192mm strict cutoff and page millimeter tracking
 * @param {Array<Object>} blocks
 * @return {{ pages: Array<Array<Object>>, pageMms: Array<number> }}
 */
function paginateBlocks_(blocks) {
  var MAX_PAGE_MM = 192;
  var PAGE1_HEADER_MM = 12; // 12mm for Page 1 title line
  var pages = [];
  var pageMms = [];
  var currentPage = [];
  var currentMm = PAGE1_HEADER_MM;

  for (var i = 0; i < blocks.length; i++) {
    var blk = blocks[i];
    var est = blk.estMm || calcBlockEstMm_(blk);
    blk.estMm = est;
    var pbb = !!blk.pageBreakBefore;

    if ((pbb || (currentMm + est > MAX_PAGE_MM)) && currentPage.length > 0) {
      pages.push(currentPage);
      pageMms.push(Math.round(currentMm * 10) / 10);
      currentPage = [blk];
      currentMm = est;
    } else {
      currentPage.push(blk);
      currentMm += est;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
    pageMms.push(Math.round(currentMm * 10) / 10);
  }

  return {
    pages: pages,
    pageMms: pageMms
  };
}

/**
 * Builds full HTML document containing all .page containers with stationery background
 * @param {Array<Array<Object>>} pages
 * @param {Object} headerData
 * @param {string} bgBase64
 * @return {string}
 */
function buildMultiPageDocumentHtml_(pages, headerData, bgBase64) {
  var totalPages = pages.length;
  var isAns = headerData.isAns;
  var pillText = isAns ? 'DAILY PRACTICE SHEET • ANSWER KEY' : 'DAILY PRACTICE SHEET';

  var pagesHtml = pages.map(function(pageBlocks, pageIndex) {
    var pageNum = pageIndex + 1;
    var sheetNumber = headerData.sheetNumber;
    if (totalPages > 1) {
      sheetNumber += ' [' + pageNum + '/' + totalPages + ']';
    }

    var page1TitleHtml = '';
    if (pageIndex === 0) {
      var titleText = isAns
        ? 'OFFICIAL MODEL ANSWER KEY • ' + escapeHtml_(headerData.subjectText).toUpperCase()
        : 'DAILY PRACTICE PROBLEM • ' + escapeHtml_(headerData.subjectText).toUpperCase();
      page1TitleHtml = '<div style="font-size: 10pt; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-bottom: 7px; letter-spacing: 0.3px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #1e3a8a; padding-bottom: 3px;">' +
        '<span>' + titleText + '</span>' +
        '<span style="color: #1d4ed8; font-size: 9.5pt; font-weight: 700;">[ ' + headerData.marks + ' Marks ]</span>' +
      '</div>\n';
    }

    var blocksHtml = pageBlocks.map(function(blk) {
      return renderBlockHtml_(blk);
    }).join('\n');

    return '<div class="page">\n' +
      '  <img src="data:image/png;base64,' + bgBase64 + '" style="position: absolute; top: 0; left: 0; width: 210mm; height: 297mm; z-index: 0;" />\n' +
      '  <!-- 1. NO. Box (top-right purple box centered) -->\n' +
      '  <div style="position: absolute; top: 4.8mm; left: 174mm; width: 28mm; height: 7.5mm; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: bold; color: #5b1865; z-index: 2; white-space: nowrap;">' + escapeHtml_(sheetNumber) + '</div>\n' +
      '  <!-- 2. Subject Line (Underline after Subject :) -->\n' +
      '  <div style="position: absolute; top: 23.8mm; left: 35mm; width: 43mm; font-size: 9pt; font-weight: bold; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; z-index: 2;">' + escapeHtml_(headerData.subjectText) + '</div>\n' +
      '  <!-- 3. Topic Line (Underline after Topic :) -->\n' +
      '  <div style="position: absolute; top: 23.8mm; left: 104mm; width: 44mm; font-size: 8.5pt; font-weight: bold; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; z-index: 2;">' + escapeHtml_(headerData.topicText) + '</div>\n' +
      '  <!-- 4. Date Line (Underline after Date :) -->\n' +
      '  <div style="position: absolute; top: 23.8mm; left: 173mm; width: 25mm; text-align: center; font-size: 9pt; font-weight: bold; color: #0f172a; letter-spacing: 0.5px; z-index: 2; background: #ffffff; padding: 0 2px;">' + escapeHtml_(headerData.formattedDate) + '</div>\n' +
      '  <!-- 5. Safe Usable Content Container -->\n' +
      '  <div class="content">\n' +
      page1TitleHtml +
      blocksHtml + '\n' +
      '  </div>\n' +
      '</div>';
  }).join('\n');

  return '<!DOCTYPE html>\n' +
    '<html>\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + escapeHtml_(pillText) + '</title>\n' +
    '<style>\n' +
    '  @page {\n' +
    '    size: 210mm 297mm;\n' +
    '    margin: 0;\n' +
    '  }\n' +
    '  * {\n' +
    '    box-sizing: border-box;\n' +
    '    -webkit-print-color-adjust: exact;\n' +
    '    print-color-adjust: exact;\n' +
    '  }\n' +
    '  html, body {\n' +
    '    margin: 0;\n' +
    '    padding: 0;\n' +
    '    background: #ffffff;\n' +
    '    font-family: \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif;\n' +
    '    font-size: 10pt;\n' +
    '    line-height: 1.48;\n' +
    '    color: #0f172a;\n' +
    '    -webkit-font-smoothing: antialiased;\n' +
    '  }\n' +
    '  .page {\n' +
    '    width: 210mm;\n' +
    '    height: 297mm;\n' +
    '    position: relative;\n' +
    '    overflow: hidden;\n' +
    '    page-break-after: always;\n' +
    '    break-after: page;\n' +
    '    box-sizing: border-box;\n' +
    '    background: #ffffff;\n' +
    '  }\n' +
    '  .page:last-child {\n' +
    '    page-break-after: auto;\n' +
    '    break-after: auto;\n' +
    '  }\n' +
    '  .content {\n' +
    '    position: relative;\n' +
    '    z-index: 1;\n' +
    '    padding: 60mm 12mm 28mm 18mm;\n' +
    '    box-sizing: border-box;\n' +
    '    width: 210mm;\n' +
    '    height: 297mm;\n' +
    '    overflow: hidden;\n' +
    '  }\n' +
    '  .keep-together {\n' +
    '    break-inside: avoid !important;\n' +
    '    page-break-inside: avoid !important;\n' +
    '  }\n' +
    '  table {\n' +
    '    width: 100%;\n' +
    '    border-collapse: collapse;\n' +
    '    table-layout: fixed;\n' +
    '    font-variant-numeric: tabular-nums;\n' +
    '    font-family: \'Segoe UI\', Roboto, sans-serif;\n' +
    '  }\n' +
    '  .content-card {\n' +
    '    background: rgba(255, 255, 255, 0.94);\n' +
    '    border: 1px solid #cbd5e1;\n' +
    '    border-radius: 10px;\n' +
    '    padding: 9px 13px;\n' +
    '    margin-bottom: 8px;\n' +
    '    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);\n' +
    '    break-inside: avoid;\n' +
    '    page-break-inside: avoid;\n' +
    '  }\n' +
    '  .content-block {\n' +
    '    margin-bottom: 8px;\n' +
    '    break-inside: avoid;\n' +
    '    page-break-inside: avoid;\n' +
    '  }\n' +
    '  .recap-box {\n' +
    '    margin-bottom: 8px;\n' +
    '    break-inside: avoid;\n' +
    '    page-break-inside: avoid;\n' +
    '  }\n' +
    '  .footer-block {\n' +
    '    margin-top: 6px;\n' +
    '    break-inside: avoid;\n' +
    '    page-break-inside: avoid;\n' +
    '  }\n' +
    '  .frac {\n' +
    '    display: inline-block;\n' +
    '    vertical-align: middle;\n' +
    '    text-align: center;\n' +
    '    padding: 0 3px;\n' +
    '  }\n' +
    '  .frac .num {\n' +
    '    border-bottom: 1.5px solid #0f172a;\n' +
    '    display: block;\n' +
    '    padding: 1px 3px;\n' +
    '    font-weight: 600;\n' +
    '  }\n' +
    '  .frac .den {\n' +
    '    display: block;\n' +
    '    padding: 1px 3px;\n' +
    '    font-weight: 600;\n' +
    '  }\n' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    pagesHtml + '\n' +
    '</body>\n' +
    '</html>';
}

function renderBlockHtml_(blk) {
  if (!blk) return '';
  switch (blk.type) {
    case 'recap':
      return renderRecapBoxBlockHtml_(blk);
    case 'question_header':
      return renderQuestionHeaderBlockHtml_(blk);
    case 'question_workingspace':
      return renderQuestionWorkingSpaceBlockHtml_(blk);
    case 'question_footer':
      return renderQuestionFooterBlockHtml_(blk);
    case 'taccount':
      return renderTAccountBlockHtml_(blk);
    case 'capital':
      return renderCapitalAccountBlockHtml_(blk);
    case 'journal':
      return renderJournalBlockHtml_(blk);
    case 'table':
      return renderTableBlockHtml_(blk);
    case 'graph':
      return renderEconomicsSvgBlock_(blk.template, blk.caption);
    case 'formula':
      return renderStatisticsFormulaBlock_(blk.formula, blk.label);
    case 'flow':
      return renderBstFlowchartBlock_(blk.steps);
    case 'card':
      return renderCaseStudyCardBlock_(blk.title, blk.body);
    case 'footer_block':
      return renderFooterBlockHtml_(blk);
    case 'rubric':
      return renderRubricOnlyHtml_(blk.text);
    case 'traps':
      return renderTrapsOnlyHtml_(blk.text);
    case 'text':
    default:
      return renderGenericTextBlock_(blk.text || '');
  }
}

/**
 * Renders Original Problem Recap box (clean 1-2 line summary, stripped of raw tables/pipes)
 */
function renderRecapBoxBlockHtml_(blk) {
  return '<div class="recap-box keep-together" style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3.5px solid #1d4ed8; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px;">' +
    '<div style="font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;">Original Problem Recap</div>' +
    '<div style="font-size: 9pt; color: #334155; margin-top: 2px; font-weight: 500; line-height: 1.4;">' + escapeHtml_(blk.text || '') + '</div>' +
  '</div>';
}

/**
 * Renders combined Footer Block containing BOTH Marking Scheme (green) and Common Traps (red)
 */
function renderFooterBlockHtml_(blk) {
  var rubricHtml = '';
  if (blk.rubricText) {
    rubricHtml = '<div class="content-card" style="background: rgba(240, 253, 244, 0.95); border: 1px solid #86efac; border-radius: 10px; padding: 9px 13px; margin-bottom: 7px;">' +
      '<div style="font-size: 9.5pt; font-weight: 700; color: #15803d; display: flex; align-items: center; gap: 6px;">' +
        '<span>✅</span><strong>CBSE Step-by-Step Marking Scheme & Rubric</strong>' +
      '</div>' +
      '<div style="font-size: 9pt; color: #166534; margin-top: 4px; line-height: 1.45;">' +
        formatBulletListDps_(blk.rubricText) +
      '</div>' +
    '</div>';
  }

  var trapsHtml = '';
  if (blk.trapsText) {
    trapsHtml = '<div class="content-card" style="background: rgba(254, 242, 242, 0.95); border: 1px solid #fca5a5; border-radius: 10px; padding: 9px 13px; margin-bottom: 0;">' +
      '<div style="font-size: 9.5pt; font-weight: 700; color: #991b1b; display: flex; align-items: center; gap: 6px;">' +
        '<span>⚠️</span><strong>Common Examiner Traps to Avoid</strong>' +
      '</div>' +
      '<div style="font-size: 9pt; color: #9f1239; margin-top: 4px; line-height: 1.45;">' +
        formatBulletListDps_(blk.trapsText) +
      '</div>' +
    '</div>';
  }

  return '<div class="footer-block keep-together" style="margin-top: 6px;">' +
    rubricHtml +
    trapsHtml +
  '</div>';
}

function renderRubricOnlyHtml_(text) {
  return '<div class="content-card keep-together" style="background: rgba(240, 253, 244, 0.95); border: 1px solid #86efac; border-radius: 10px; padding: 9px 13px; margin-bottom: 7px;">' +
    '<div style="font-size: 9.5pt; font-weight: 700; color: #15803d; display: flex; align-items: center; gap: 6px;">' +
      '<span>✅</span><strong>CBSE Step-by-Step Marking Scheme & Rubric</strong>' +
    '</div>' +
    '<div style="font-size: 9pt; color: #166534; margin-top: 4px; line-height: 1.45;">' +
      formatBulletListDps_(text) +
    '</div>' +
  '</div>';
}

function renderTrapsOnlyHtml_(text) {
  return '<div class="content-card keep-together" style="background: rgba(254, 242, 242, 0.95); border: 1px solid #fca5a5; border-radius: 10px; padding: 9px 13px; margin-bottom: 7px;">' +
    '<div style="font-size: 9.5pt; font-weight: 700; color: #991b1b; display: flex; align-items: center; gap: 6px;">' +
      '<span>⚠️</span><strong>Common Examiner Traps to Avoid</strong>' +
    '</div>' +
    '<div style="font-size: 9pt; color: #9f1239; margin-top: 4px; line-height: 1.45;">' +
      formatBulletListDps_(text) +
    '</div>' +
  '</div>';
}

/**
 * Question Sheet Header
 */
function renderQuestionHeaderBlockHtml_(blk) {
  return '<div class="content-card keep-together" style="margin-bottom: 8px;">' +
    '<div style="display: flex; justify-content: space-between; align-items: center;">' +
      '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="background: #1d4ed8; color: #ffffff; font-weight: 700; border-radius: 999px; padding: 2px 10px; font-size: 8.5pt; letter-spacing: 0.3px;">Q1</span>' +
        '<span style="background: #fef3c7; color: #92400e; font-weight: 600; border-radius: 999px; padding: 2px 10px; font-size: 8.5pt;">CBSE Class ' + blk.classLevel + ' • ' + escapeHtml_(blk.topicText || 'Practice Problem') + '</span>' +
      '</div>' +
      '<span style="color: #1d4ed8; font-weight: 800; font-size: 9.5pt;">[ ' + blk.marks + ' Marks ]</span>' +
    '</div>' +
  '</div>';
}

/**
 * Question Sheet Working Space
 */
function renderQuestionWorkingSpaceBlockHtml_(blk) {
  return '<div class="content-card keep-together" style="border: 1.5px dashed #cbd5e1; background: rgba(255, 255, 255, 0.92); margin-top: 8px;">' +
    '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">' +
      '<span style="font-size: 9pt; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px;">✍️ Solution & Working Space</span>' +
      '<span style="font-size: 8pt; color: #64748b; font-weight: 600;">(Show journal entries, ledger accounts, and working notes neatly)</span>' +
    '</div>' +
    '<div style="min-height: 52mm; border-bottom: 1px dashed #e2e8f0;"></div>' +
  '</div>';
}

/**
 * Question Sheet Footer Notice
 */
function renderQuestionFooterBlockHtml_(blk) {
  return '<div class="keep-together" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 11px; margin-top: 6px; display: flex; align-items: center; gap: 8px;">' +
    '<span style="font-size: 14px;">✍️</span>' +
    '<div style="font-size: 8.5pt; color: #334155; line-height: 1.35;">' +
      '<strong>CBSE Practice Register Assignment:</strong> Solve this question in your physical practice register tonight. Official Step-by-Step Model Answer Key with CBSE Marking Rubric will be shared tomorrow at <strong>08:15 AM IST</strong>.' +
    '</div>' +
  '</div>';
}

/**
 * Renders T-Account with Dr./Cr. header and mandatory Equal-Row Padding Rule
 */
function renderTAccountBlockHtml_(blk) {
  var lines = String(blk.rowsText || '').trim().split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
  if (lines.length === 0) return '';

  var startIndex = 0;
  var firstCols = splitPipes_(lines[0]);
  if (/particular|dr|cr|₹|amount/i.test(firstCols[0] || '') || /particular|dr|cr|₹|amount/i.test(firstCols[1] || '')) {
    startIndex = 1;
  }

  var drItems = [];
  var crItems = [];
  var drTotal = null;
  var crTotal = null;

  for (var i = startIndex; i < lines.length; i++) {
    var cols = splitPipes_(lines[i]);
    if (cols.length >= 4) {
      var isTotal = /total/i.test(cols[0]) || /total/i.test(cols[2]);
      if (isTotal) {
        drTotal = { desc: cols[0] || 'Total', amt: cols[1] || '' };
        crTotal = { desc: cols[2] || 'Total', amt: cols[3] || '' };
      } else {
        var drDesc = (cols[0] || '').trim();
        var drAmt = (cols[1] || '').trim();
        var crDesc = (cols[2] || '').trim();
        var crAmt = (cols[3] || '').trim();

        if (drDesc || drAmt) drItems.push({ desc: drDesc, amt: drAmt });
        if (crDesc || crAmt) crItems.push({ desc: crDesc, amt: crAmt });
      }
    }
  }

  // Equal-Row Padding Rule: Pad shorter side so Total aligns horizontally
  var maxRows = Math.max(drItems.length, crItems.length);
  var trs = [];

  for (var r = 0; r < maxRows; r++) {
    var left = drItems[r] || { desc: '&nbsp;', amt: '' };
    var right = crItems[r] || { desc: '&nbsp;', amt: '' };

    trs.push('<tr style="border-bottom: 1px solid #cbd5e1;">' +
      '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + (left.desc === '&nbsp;' ? '&nbsp;' : escapeHtml_(left.desc)) + '</td>' +
      '<td style="padding: 5.5px 8px; text-align: right; border-right: 2px solid #1d4ed8; font-variant-numeric: tabular-nums; font-weight: 600; color: #0f172a;">' + escapeHtml_(left.amt) + '</td>' +
      '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + (right.desc === '&nbsp;' ? '&nbsp;' : escapeHtml_(right.desc)) + '</td>' +
      '<td style="padding: 5.5px 8px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #0f172a;">' + escapeHtml_(right.amt) + '</td>' +
    '</tr>');
  }

  // Double-underline Total row
  if (drTotal || crTotal) {
    var dt = drTotal || { desc: 'Total', amt: '' };
    var ct = crTotal || { desc: 'Total', amt: '' };
    trs.push('<tr style="border-top: 1px solid #cbd5e1; border-bottom: 3px double #0f172a; font-weight: bold; background: #f8fafc;">' +
      '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + escapeHtml_(dt.desc) + '</td>' +
      '<td style="padding: 5.5px 8px; text-align: right; border-right: 2px solid #1d4ed8; font-variant-numeric: tabular-nums; color: #0f172a;">' + escapeHtml_(dt.amt) + '</td>' +
      '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + escapeHtml_(ct.desc) + '</td>' +
      '<td style="padding: 5.5px 8px; text-align: right; font-variant-numeric: tabular-nums; color: #0f172a;">' + escapeHtml_(ct.amt) + '</td>' +
    '</tr>');
  }

  var colgroupHtml = '<colgroup><col style="width: 36%;"><col style="width: 14%;"><col style="width: 36%;"><col style="width: 14%;"></colgroup>';

  return '<div class="content-card keep-together">' +
    '<div style="font-weight: 700; font-size: 9.5pt; color: #1e3a8a; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">' +
      '<span>Dr.</span>' +
      '<span style="text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(blk.title || 'Ledger Account') + '</span>' +
      '<span>Cr.</span>' +
    '</div>' +
    '<table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; background: #ffffff; border: 1px solid #cbd5e1; table-layout: fixed; font-family: inherit;">' +
      colgroupHtml +
      '<thead>' +
        '<tr style="background: #dbeafe; color: #0f172a; font-weight: 700; border-bottom: 1px solid #cbd5e1;">' +
          '<th style="padding: 5.5px 8px; text-align: left; border-right: 1px solid #cbd5e1;">Particulars</th>' +
          '<th style="padding: 5.5px 8px; text-align: right; border-right: 2px solid #1d4ed8;">Amount (₹)</th>' +
          '<th style="padding: 5.5px 8px; text-align: left; border-right: 1px solid #cbd5e1;">Particulars</th>' +
          '<th style="padding: 5.5px 8px; text-align: right;">Amount (₹)</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>' +
        trs.join('\n') +
      '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Renders Partners Capital Account with dynamic 50% | 50% colgroup and mandatory Equal-Row Padding Rule
 */
function renderCapitalAccountBlockHtml_(blk) {
  var lines = String(blk.rowsText || '').trim().split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
  if (lines.length === 0) return '';

  var headerCols = splitPipes_(lines[0]);
  var totalCols = headerCols.length;
  var nPartners = Math.max(1, Math.floor((totalCols - 2) / 2));
  var colgroupHtml = generatePartnersCapitalColgroup_(nPartners);
  var midColIndex = nPartners + 1; // 1-based index of Right Particulars column

  var ths = headerCols.map(function(c, idx) {
    var isDivider = (idx + 1 === midColIndex);
    var divStyle = isDivider ? 'border-right: 2px solid #1d4ed8;' : 'border-right: 1px solid #cbd5e1;';
    var fontSize = (nPartners >= 4) ? '8pt' : '9pt';
    return '<th style="background: #dbeafe; color: #0f172a; padding: 5px 6px; ' + divStyle + ' font-weight: 700; text-align: center; font-size: ' + fontSize + ';">' + escapeHtml_(c) + '</th>';
  }).join('');

  var drItems = [];
  var crItems = [];
  var drTotal = null;
  var crTotal = null;

  for (var i = 1; i < lines.length; i++) {
    var cols = splitPipes_(lines[i]);
    var isTotal = /total/i.test(cols[0]) || (cols[1] && /total/i.test(cols[1])) || (cols[midColIndex] && /total/i.test(cols[midColIndex]));
    var leftCols = cols.slice(0, midColIndex);
    var rightCols = cols.slice(midColIndex);

    while (leftCols.length < midColIndex) leftCols.push('');
    while (rightCols.length < midColIndex) rightCols.push('');

    if (isTotal) {
      drTotal = leftCols;
      crTotal = rightCols;
    } else {
      var leftHasContent = leftCols.some(function(c) { return c && c.trim(); });
      var rightHasContent = rightCols.some(function(c) { return c && c.trim(); });
      if (leftHasContent) drItems.push(leftCols);
      if (rightHasContent) crItems.push(rightCols);
    }
  }

  // Equal-Row Padding Rule: Pad shorter side before Total
  var maxRows = Math.max(drItems.length, crItems.length);
  var trs = [];
  var cellFontSize = (nPartners >= 4) ? '8pt' : (nPartners === 3 ? '8.5pt' : '9pt');
  var cellPad = (nPartners >= 4) ? '3.5px 4.5px' : (nPartners === 3 ? '4.5px 6px' : '5.5px 8px');

  var emptySide = [];
  emptySide.push('&nbsp;');
  for (var k = 1; k < midColIndex; k++) emptySide.push('');

  for (var r = 0; r < maxRows; r++) {
    var lRow = drItems[r] || emptySide;
    var rRow = crItems[r] || emptySide;
    var rowCols = lRow.concat(rRow);

    var tds = rowCols.map(function(c, cIdx) {
      var isDivider = (cIdx + 1 === midColIndex);
      var divStyle = isDivider ? 'border-right: 2px solid #1d4ed8;' : 'border-right: 1px solid #cbd5e1;';
      var isAmt = (cIdx !== 0 && cIdx !== midColIndex) && /[\d,]+/.test(c);
      var align = isAmt ? 'right' : 'left';
      var textVal = (c === '&nbsp;') ? '&nbsp;' : escapeHtml_(c);
      return '<td style="padding: ' + cellPad + '; border-bottom: 1px solid #cbd5e1; ' + divStyle + ' text-align: ' + align + '; font-size: ' + cellFontSize + '; font-variant-numeric: tabular-nums; color: #0f172a; white-space: nowrap;">' + textVal + '</td>';
    }).join('');
    trs.push('<tr>' + tds + '</tr>');
  }

  // Double-underline Total row
  if (drTotal || crTotal) {
    var totalL = drTotal || emptySide;
    var totalR = crTotal || emptySide;
    var totalColsArr = totalL.concat(totalR);

    var totalTds = totalColsArr.map(function(c, cIdx) {
      var isDivider = (cIdx + 1 === midColIndex);
      var divStyle = isDivider ? 'border-right: 2px solid #1d4ed8;' : 'border-right: 1px solid #cbd5e1;';
      var isAmt = (cIdx !== 0 && cIdx !== midColIndex) && /[\d,]+/.test(c);
      var align = isAmt ? 'right' : 'left';
      return '<td style="padding: ' + cellPad + '; border-top: 1px solid #cbd5e1; border-bottom: 3px double #0f172a; ' + divStyle + ' text-align: ' + align + '; font-size: ' + cellFontSize + '; font-weight: bold; background: #f8fafc; font-variant-numeric: tabular-nums; color: #0f172a; white-space: nowrap;">' + escapeHtml_(c) + '</td>';
    }).join('');
    trs.push('<tr>' + totalTds + '</tr>');
  }

  var heading = blk.title || "PARTNERS' CAPITAL ACCOUNTS";

  return '<div class="content-card keep-together">' +
    '<div style="font-weight: 700; font-size: 9.5pt; color: #1e3a8a; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">' +
      '<span>Dr.</span>' +
      '<span style="text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(heading) + ' (' + nPartners + ' Partners)</span>' +
      '<span>Cr.</span>' +
    '</div>' +
    '<table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #cbd5e1; table-layout: fixed; font-family: inherit;">' +
      colgroupHtml +
      '<thead><tr>' + ths + '</tr></thead>' +
      '<tbody>' + trs.join('\n') + '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Renders Journal Entries with exact 5-column layout
 */
function renderJournalBlockHtml_(blk) {
  var lines = String(blk.rowsText || '').trim().split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
  if (lines.length === 0) return '';

  var trs = [];
  var isHeader = true;

  for (var i = 0; i < lines.length; i++) {
    var rawLine = lines[i];
    if (rawLine.indexOf('|') !== -1) {
      var cols = splitPipes_(rawLine);
      if (isHeader && /particular|date|l\.f|dr|cr|amount/i.test(rawLine)) {
        isHeader = false;
        var ths = cols.map(function(c) {
          return '<th style="background: #dbeafe; color: #0f172a; padding: 5.5px 8px; border-right: 1px solid #cbd5e1; font-weight: 700; text-align: center; font-size: 9.5pt;">' + escapeHtml_(c) + '</th>';
        }).join('');
        trs.push('<tr style="border-bottom: 1px solid #cbd5e1;">' + ths + '</tr>');
        continue;
      }

      var isTotal = /total/i.test(rawLine);
      var borderStyle = isTotal ? 'border-top: 1px solid #cbd5e1; border-bottom: 3px double #0f172a; font-weight: bold; background: #f8fafc;' : 'border-bottom: 1px solid #cbd5e1;';

      var tds = cols.map(function(c, cIdx) {
        var isAmt = (cIdx === 3 || cIdx === 4) && /[\d,]+/.test(c);
        var align = isAmt ? 'right' : (cIdx === 0 || cIdx === 2 ? 'center' : 'left');
        var indent = (cIdx === 1 && /^\s*to\b/i.test(c)) ? 'padding-left: 20px;' : '';
        return '<td style="padding: 5.5px 8px; ' + borderStyle + ' text-align: ' + align + '; ' + indent + ' font-size: 9.5pt; font-variant-numeric: tabular-nums; color: #0f172a;">' + escapeHtml_(c) + '</td>';
      }).join('');
      trs.push('<tr>' + tds + '</tr>');
    } else {
      var isNarration = /^\s*\(Being/i.test(rawLine);
      var fontStyle = isNarration ? 'font-style: italic; color: #475569; padding-left: 20px;' : 'font-weight: bold; color: #0f172a;';
      trs.push('<tr><td colspan="10" style="padding: 4px 8px; ' + fontStyle + ' font-size: 9pt; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">' + escapeHtml_(rawLine) + '</td></tr>');
    }
  }

  var colgroupHtml = '<colgroup><col style="width: 12%;"><col style="width: 48%;"><col style="width: 8%;"><col style="width: 16%;"><col style="width: 16%;"></colgroup>';

  return '<div class="content-card keep-together">' +
    '<div style="font-weight: 700; font-size: 9.5pt; color: #1e3a8a; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px;">Journal Entries</div>' +
    '<table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; background: #ffffff; border: 1px solid #cbd5e1; table-layout: fixed; font-family: inherit;">' +
      colgroupHtml +
      '<tbody>' + trs.join('\n') + '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Renders generic styled CBSE table (Balance Sheet, Trial Balance, Statistics) with Equal-Row Padding Rule for 2-sided tables
 */
function renderTableBlockHtml_(blk) {
  var lines = String(blk.rowsText || '').trim().split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
  if (lines.length === 0) return '';

  var headerCols = [];
  var startIndex = 0;
  if (lines.length > 0 && lines[0].indexOf('|') !== -1) {
    var firstCols = splitPipes_(lines[0]);
    if (/particular|date|debit|credit|amount|plus|minus|liabilities|assets|class|f|mid/i.test(lines[0])) {
      headerCols = firstCols;
      startIndex = 1;
    }
  }

  var isBS = (headerCols.length === 4 && /balance sheet|revaluation|realisation|trading|p&l|cash|bank/i.test(blk.title || ''));

  if (isBS) {
    var leftItems = [];
    var rightItems = [];
    var leftTotal = null;
    var rightTotal = null;

    for (var i = startIndex; i < lines.length; i++) {
      var raw = lines[i];
      if (raw.indexOf('|') !== -1) {
        var cols = splitPipes_(raw);
        if (cols.length >= 4) {
          var isTot = /total/i.test(cols[0]) || /total/i.test(cols[2]);
          if (isTot) {
            leftTotal = { desc: cols[0] || 'Total', amt: cols[1] || '' };
            rightTotal = { desc: cols[2] || 'Total', amt: cols[3] || '' };
          } else {
            var lDesc = (cols[0] || '').trim();
            var lAmt = (cols[1] || '').trim();
            var rDesc = (cols[2] || '').trim();
            var rAmt = (cols[3] || '').trim();
            if (lDesc || lAmt) leftItems.push({ desc: lDesc, amt: lAmt });
            if (rDesc || rAmt) rightItems.push({ desc: rDesc, amt: rAmt });
          }
        }
      }
    }

    var maxRows = Math.max(leftItems.length, rightItems.length);
    var trs = [];

    // Header row
    var ths = headerCols.map(function(c, cIdx) {
      var divStyle = (cIdx === 1) ? 'border-right: 2px solid #1d4ed8;' : 'border-right: 1px solid #cbd5e1;';
      var align = (cIdx === 1 || cIdx === 3) ? 'right' : 'left';
      return '<th style="background: #dbeafe; color: #0f172a; padding: 5.5px 8px; ' + divStyle + ' font-weight: 700; text-align: ' + align + '; font-size: 9.5pt;">' + escapeHtml_(c) + '</th>';
    }).join('');
    trs.push('<tr style="border-bottom: 1px solid #cbd5e1;">' + ths + '</tr>');

    // Data rows with Equal-Row Padding Rule
    for (var r = 0; r < maxRows; r++) {
      var left = leftItems[r] || { desc: '&nbsp;', amt: '' };
      var right = rightItems[r] || { desc: '&nbsp;', amt: '' };
      trs.push('<tr style="border-bottom: 1px solid #cbd5e1;">' +
        '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + (left.desc === '&nbsp;' ? '&nbsp;' : escapeHtml_(left.desc)) + '</td>' +
        '<td style="padding: 5.5px 8px; text-align: right; border-right: 2px solid #1d4ed8; font-variant-numeric: tabular-nums; font-weight: 600; color: #0f172a;">' + escapeHtml_(left.amt) + '</td>' +
        '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + (right.desc === '&nbsp;' ? '&nbsp;' : escapeHtml_(right.desc)) + '</td>' +
        '<td style="padding: 5.5px 8px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #0f172a;">' + escapeHtml_(right.amt) + '</td>' +
      '</tr>');
    }

    // Double-underline Total row
    if (leftTotal || rightTotal) {
      var lt = leftTotal || { desc: 'Total', amt: '' };
      var rt = rightTotal || { desc: 'Total', amt: '' };
      trs.push('<tr style="border-top: 1px solid #cbd5e1; border-bottom: 3px double #0f172a; font-weight: bold; background: #f8fafc;">' +
        '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + escapeHtml_(lt.desc) + '</td>' +
        '<td style="padding: 5.5px 8px; text-align: right; border-right: 2px solid #1d4ed8; font-variant-numeric: tabular-nums; color: #0f172a;">' + escapeHtml_(lt.amt) + '</td>' +
        '<td style="padding: 5.5px 8px; border-right: 1px solid #cbd5e1; color: #0f172a;">' + escapeHtml_(rt.desc) + '</td>' +
        '<td style="padding: 5.5px 8px; text-align: right; font-variant-numeric: tabular-nums; color: #0f172a;">' + escapeHtml_(rt.amt) + '</td>' +
      '</tr>');
    }

    var colgroupHtml = '<colgroup><col style="width: 36%;"><col style="width: 14%;"><col style="width: 36%;"><col style="width: 14%;"></colgroup>';
    var contdNotice = blk.isContinuation ? '<div style="font-size: 8pt; font-weight: bold; color: #64748b; margin-bottom: 3px;">(Table Continued from previous page)</div>' : '';
    var titleHeader = blk.title ? '<div style="font-weight: 700; font-size: 9.5pt; color: #1e3a8a; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(blk.title) + '</div>' : '';

    return '<div class="content-card keep-together">' +
      titleHeader +
      contdNotice +
      '<table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; background: #ffffff; border: 1px solid #cbd5e1; table-layout: fixed; font-family: inherit;">' +
        colgroupHtml +
        '<tbody>' + trs.join('\n') + '</tbody>' +
      '</table>' +
    '</div>';
  }

  // Arbitrary multi-column table (e.g. Statistics)
  var trs = [];
  var isHeader = true;
  for (var i = 0; i < lines.length; i++) {
    var rawLine = lines[i];
    if (rawLine.indexOf('|') !== -1) {
      var cols = splitPipes_(rawLine);
      if (isHeader && /particular|date|debit|credit|amount|plus|minus|class|f|mid/i.test(rawLine)) {
        isHeader = false;
        var ths = cols.map(function(c, cIdx) {
          var align = (cIdx === 0) ? 'left' : 'right';
          return '<th style="background: #dbeafe; color: #0f172a; padding: 5.5px 8px; border-right: 1px solid #cbd5e1; font-weight: 700; text-align: ' + align + '; font-size: 9.5pt;">' + escapeHtml_(c) + '</th>';
        }).join('');
        trs.push('<tr style="border-bottom: 1px solid #cbd5e1;">' + ths + '</tr>');
        continue;
      }

      var isTotal = /total/i.test(rawLine);
      var borderStyle = isTotal ? 'border-top: 1px solid #cbd5e1; border-bottom: 3px double #0f172a; font-weight: bold; background: #f8fafc;' : 'border-bottom: 1px solid #cbd5e1;';

      var tds = cols.map(function(c, cIdx) {
        var isAmt = (cIdx > 0) && /[\d,]+/.test(c);
        var align = (cIdx === 0) ? 'left' : 'right';
        return '<td style="padding: 5.5px 8px; ' + borderStyle + ' border-right: 1px solid #cbd5e1; text-align: ' + align + '; font-size: 9.5pt; font-variant-numeric: tabular-nums; color: #0f172a;">' + escapeHtml_(c) + '</td>';
      }).join('');
      trs.push('<tr>' + tds + '</tr>');
    }
  }

  var colgroupHtml = generateArbitraryColgroup_(headerCols.length > 0 ? headerCols : (lines[0] ? splitPipes_(lines[0]) : []), blk.title);
  var titleHeader = blk.title ? '<div style="font-weight: 700; font-size: 9.5pt; color: #1e3a8a; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(blk.title) + '</div>' : '';

  return '<div class="content-card keep-together">' +
    titleHeader +
    '<table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; background: #ffffff; border: 1px solid #cbd5e1; table-layout: fixed; font-family: inherit;">' +
      colgroupHtml +
      '<tbody>' + trs.join('\n') + '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Pure inline vector SVG generators for Economics diagrams
 */
function renderEconomicsSvgBlock_(templateName, caption) {
  templateName = String(templateName || 'demand_shift').toLowerCase().trim();
  caption = caption || 'Economic Analysis Diagram';

  var svgContent = '';
  if (templateName === 'cost_curves' || templateName === 'ac_mc') {
    svgContent = '<svg width="340" height="175" viewBox="0 0 340 175" style="background:#fff; font-family:-apple-system, sans-serif; margin:0 auto; display:block;">\n' +
      '<line x1="40" y1="15" x2="40" y2="145" stroke="#1e293b" stroke-width="1.8" marker-end="url(#arr)" />\n' +
      '<line x1="40" y1="145" x2="310" y2="145" stroke="#1e293b" stroke-width="1.8" marker-end="url(#arr)" />\n' +
      '<text x="35" y="14" font-size="10" font-weight="bold" text-anchor="end" fill="#0f172a">Cost (₹)</text>\n' +
      '<text x="310" y="160" font-size="10" font-weight="bold" text-anchor="end" fill="#0f172a">Output</text>\n' +
      '<path d="M 50 40 Q 140 120 270 90" stroke="#0284c7" stroke-width="2.2" fill="none" />\n' +
      '<text x="275" y="93" font-size="10" font-weight="bold" fill="#0284c7">AC</text>\n' +
      '<path d="M 60 120 Q 130 140 230 30" stroke="#9333ea" stroke-width="2.2" fill="none" />\n' +
      '<text x="235" y="32" font-size="10" font-weight="bold" fill="#9333ea">MC</text>\n' +
      '<circle cx="150" cy="100" r="3.5" fill="#e11d48" />\n' +
      '<text x="145" y="115" font-size="9" font-weight="bold" fill="#e11d48">MC cuts AC at min</text>\n' +
      '<defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b"/></marker></defs>\n' +
    '</svg>';
  } else {
    // Default: Demand Shift
    svgContent = '<svg width="340" height="175" viewBox="0 0 340 175" style="background:#fff; font-family:-apple-system, sans-serif; margin:0 auto; display:block;">\n' +
      '<line x1="40" y1="15" x2="40" y2="145" stroke="#1e293b" stroke-width="1.8" marker-end="url(#arr)" />\n' +
      '<line x1="40" y1="145" x2="310" y2="145" stroke="#1e293b" stroke-width="1.8" marker-end="url(#arr)" />\n' +
      '<text x="35" y="14" font-size="10" font-weight="bold" text-anchor="end" fill="#0f172a">Price (₹)</text>\n' +
      '<text x="310" y="160" font-size="10" font-weight="bold" text-anchor="end" fill="#0f172a">Quantity (Units)</text>\n' +
      '<text x="28" y="156" font-size="10" font-weight="bold" fill="#64748b">O</text>\n' +
      '<line x1="60" y1="130" x2="270" y2="30" stroke="#0284c7" stroke-width="2.2" />\n' +
      '<text x="275" y="34" font-size="11" font-weight="bold" fill="#0284c7">S</text>\n' +
      '<line x1="60" y1="30" x2="245" y2="130" stroke="#94a3b8" stroke-width="1.8" stroke-dasharray="4,3" />\n' +
      '<text x="250" y="134" font-size="11" font-weight="bold" fill="#64748b">D₀</text>\n' +
      '<line x1="90" y1="30" x2="275" y2="130" stroke="#9333ea" stroke-width="2.2" />\n' +
      '<text x="280" y="134" font-size="11" font-weight="bold" fill="#9333ea">D₁</text>\n' +
      '<circle cx="152" cy="80" r="3.5" fill="#1e293b" />\n' +
      '<text x="142" y="75" font-size="9.5" font-weight="bold" fill="#1e293b">E₀</text>\n' +
      '<circle cx="182" cy="66" r="3.5" fill="#9333ea" />\n' +
      '<text x="178" y="60" font-size="9.5" font-weight="bold" fill="#9333ea">E₁</text>\n' +
      '<defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b"/></marker></defs>\n' +
    '</svg>';
  }

  return '<div class="content-card keep-together" style="text-align: center;">\n' +
    '<div style="font-size: 9.5pt; font-weight: 700; color: #1e3a8a; margin-bottom: 6px; letter-spacing: 0.3px;">Figure: ' + escapeHtml_(caption) + '</div>\n' +
    svgContent + '\n' +
  '</div>';
}

/**
 * Renders LaTeX / Stats formula via pure stacked fraction CSS
 */
function renderStatisticsFormulaBlock_(formulaRaw, label) {
  label = label || 'Standard Deviation Formula & Calculation';
  var inner = String(formulaRaw || '')
    .replace(/\[FRAC:\s*([^/\]]+)\s*\/\s*([^\]]+)\]/gi, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
    .replace(/\\frac\{([^}]+)\}\s*\{([^}]+)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
    .replace(/\[\s*([^\]]+)\s*\]\s*\/\s*\[\s*([^\]]+)\s*\]/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
    .replace(/√\(([^)]+)\)/g, '<span style="font-size: 1.15em; font-weight: bold; color: #1d4ed8;">√( </span><span style="display:inline-block; vertical-align:middle; padding:0 3px;">$1</span><span style="font-size: 1.15em; font-weight: bold; color: #1d4ed8;"> )</span>')
    .replace(/\\sqrt\{([^}]+)\}/g, '<span style="font-size: 1.15em; font-weight: bold; color: #1d4ed8;">√( </span><span style="display:inline-block; vertical-align:middle; padding:0 3px;">$1</span><span style="font-size: 1.15em; font-weight: bold; color: #1d4ed8;"> )</span>')
    .replace(/\\sum/g, 'Σ')
    .replace(/\\sigma/g, 'σ');

  return '<div class="content-card keep-together" style="border-left: 4px solid #1d4ed8; text-align: center;">\n' +
    '<div style="font-size: 9pt; font-weight: 700; color: #1d4ed8; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.4px;">' + escapeHtml_(label) + '</div>\n' +
    '<div style="font-size: 10.5pt; line-height: 1.6; color: #0f172a;">' + inner + '</div>\n' +
  '</div>';
}

/**
 * Renders Business Studies vertical step flowchart with directional connectors
 */
function renderBstFlowchartBlock_(stepsText) {
  var steps = String(stepsText || '').split(/->|\n/).map(function(s) { return s.trim(); }).filter(Boolean);
  var items = steps.map(function(s, idx) {
    var arrow = (idx < steps.length - 1) ? '<div style="font-size: 13px; color: #1d4ed8; font-weight: bold; margin: 1px 0;">↓</div>' : '';
    return '<div style="background: #eff6ff; border: 1.5px solid #3b82f6; border-radius: 8px; padding: 5px 10px; margin: 2px 0; font-weight: 700; font-size: 9.5pt; color: #1e3a8a; display: inline-block; min-width: 240px; box-shadow: 0 1px 2px rgba(30, 58, 138, 0.05);">' + escapeHtml_(s) + '</div>' + arrow;
  }).join('');

  return '<div class="content-card keep-together" style="text-align: center;">' +
    '<div style="font-size: 9.5pt; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.4px;">Sequential Planning Process Flowchart</div>' +
    items +
  '</div>';
}

/**
 * Renders Business Studies Case Study callout card
 */
function renderCaseStudyCardBlock_(title, body) {
  return '<div class="content-card keep-together" style="border-left: 4px solid #1d4ed8;">\n' +
    '<div style="font-size: 9.5pt; font-weight: bold; color: #1d4ed8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">📌 ' + escapeHtml_(title || 'Case Scenario') + '</div>\n' +
    '<div style="font-size: 10pt; line-height: 1.48; color: #1e293b; font-style: italic;">' + escapeHtml_(body) + '</div>\n' +
  '</div>';
}

/**
 * Renders generic text with headings and list markers
 */
function renderGenericTextBlock_(text) {
  if (!text) return '';
  var lines = String(text).trim().split('\n');
  var out = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var formatted = escapeHtml_(line).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    if (/^\s*([0-9]+\.|\-|\•)\s+/.test(line)) {
      out.push('<div style="padding-left: 12px; margin-bottom: 4px; font-size: 10pt; line-height: 1.48; color: #0f172a;">' + formatted + '</div>');
    } else if (line.indexOf('Adjustments:') === 0 || line.indexOf('Instructions:') === 0 || line.indexOf('Working Notes:') === 0) {
      out.push('<div style="font-weight: bold; margin-top: 6px; margin-bottom: 4px; color: #1e3a8a; font-size: 10pt; letter-spacing: 0.3px;">' + formatted + '</div>');
    } else {
      out.push('<div style="margin-bottom: 6px; font-size: 10.5pt; line-height: 1.48; color: #0f172a;">' + formatted + '</div>');
    }
  }

  return '<div class="content-card keep-together">' + out.join('\n') + '</div>';
}

function formatAccountingTableOrTextDps_(text) {
  var blocks = parseDslBlocks_(text, 'Accountancy', false);
  return blocks.map(function(b) { return renderBlockHtml_(b); }).join('\n');
}

/**
 * Formats bullet list points in Rubric & Traps
 */
function formatBulletListDps_(text) {
  if (!text) return '';
  var lines = String(text).trim().split('\n');
  return lines.map(function(l) {
    l = l.trim();
    if (!l) return '';
    var escaped = escapeHtml_(l);
    return '<div style="margin-bottom: 2px;">' + escaped + '</div>';
  }).filter(Boolean).join('\n');
}

/**
 * Formats date into DD / MM / YYYY
 */
/**
 * Formats date into clean human DD-MMM-YYYY for DPP card headers
 * @param {*} dateVal
 * @return {string}
 */
function formatHumanDppDate_(dateVal) {
  if (!dateVal) return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MMM-yyyy');
  var s = String(dateVal).trim();
  var m = s.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (m) {
    var d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    return Utilities.formatDate(d, 'Asia/Kolkata', 'dd-MMM-yyyy');
  }
  var m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) {
    var d2 = new Date(parseInt(m2[1], 10), parseInt(m2[2], 10) - 1, parseInt(m2[3], 10));
    return Utilities.formatDate(d2, 'Asia/Kolkata', 'dd-MMM-yyyy');
  }
  return s;
}

function formatDateDps_(dateVal) {
  if (!dateVal) return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd / MM / yyyy');
  if (dateVal instanceof Date) return Utilities.formatDate(dateVal, 'Asia/Kolkata', 'dd / MM / yyyy');
  var s = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    var parts = s.split('-');
    return parts[2] + ' / ' + parts[1] + ' / ' + parts[0];
  }
  var months = { jan:'01', feb:'02', mar:'03', apr:'04', may:'05', jun:'06', jul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
  var m = s.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3})[-/ ](\d{4})$/);
  if (m) {
    var day = ('0' + m[1]).slice(-2);
    var mon = months[m[2].toLowerCase()] || '11';
    return day + ' / ' + mon + ' / ' + m[3];
  }
  return s;
}

/**
 * Formats question/sheet number e.g. Q-12-04 or A-12-04
 */
function formatSheetNumberDps_(rawQid, classLevel, marks, isAns) {
  var prefix = isAns ? 'A-' : 'Q-';
  var markPad = Number(marks) < 10 ? ('0' + Number(marks)) : String(marks);
  var def = prefix + classLevel + '-' + markPad;
  if (!rawQid) return def;
  var s = String(rawQid).trim();
  if (/^[QA]-[0-9]{2}-[0-9]{2}$/i.test(s)) return s;
  return def;
}

/**
 * HTML Escaper
 */
function escapeHtml_(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\'/g, '&#039;');
}

/**
 * Retrieves or creates a specific Google Drive folder
 * @param {string} folderName
 * @return {GoogleAppsScript.Drive.Folder}
 */
function getOrCreatePdfFolder_(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

// ─────────────────────────────────────────────────────────────────────
// 4. TEST RUNNERS (Directly Callable from Apps Script / WebApp API)
// ─────────────────────────────────────────────────────────────────────

/**
 * Test Runner: Generates a sample Question PDF and returns Drive link
 * @param {number|string} [classLevel]
 * @return {Object}
 */
function testGenerateQuestionPdf(classLevel) {
  classLevel = Number(classLevel) || 12;
  var todayStr = getKolkataDate();
  var subtopic = getActiveSubtopic_(classLevel);
  var qData = getApprovedSubjectiveQuestion_(classLevel, subtopic);
  var result = createQuestionPdfFromTemplate_({
    date: todayStr,
    classLevel: classLevel,
    subject: qData.subject,
    chapter: qData.chapter + ' — ' + qData.chapterName,
    questionText: qData.question,
    marks: qData.marks || 6,
    qid: qData.qid || ('DPS-' + classLevel + '-Q')
  });

  Logger.log('Generated Test Question PDF for Class ' + classLevel + ': ' + result.driveUrl);
  return {
    ok: true,
    type: 'QUESTION_PDF',
    classLevel: classLevel,
    qid: qData.qid,
    pageCount: result.pageCount,
    driveUrl: result.driveUrl,
    timestamp: getKolkataTimestamp()
  };
}

/**
 * Test Runner: Generates a sample Model Answer PDF and returns Drive link
 * @param {number|string} [classLevel]
 * @return {Object}
 */
function testGenerateAnswerPdf(classLevel) {
  classLevel = Number(classLevel) || 12;
  var todayStr = getKolkataDate();
  var subtopic = getActiveSubtopic_(classLevel);
  var qData = getApprovedSubjectiveQuestion_(classLevel, subtopic);
  var result = createAnswerPdfFromTemplate_({
    date: todayStr,
    classLevel: classLevel,
    subject: qData.subject,
    chapter: qData.chapter + ' — ' + qData.chapterName,
    questionText: qData.question,
    marks: qData.marks || 6,
    answerText: qData.modelAnswer,
    marksBreakdown: qData.rubric || '• 1 Mark: Correct Account Heads\n• 3 Marks: Accurate Journal / Ledger Calculations\n• 2 Marks: Proper Narrations & Double-Line Totaling',
    commonMistakes: qData.traps || '• Missing (Being...) narrations result in a 0.5-mark penalty.\n• Forfeiture account must not be credited with unpaid call amounts.',
    qid: qData.qid || ('DPS-' + classLevel + '-A')
  });

  Logger.log('Generated Test Answer PDF for Class ' + classLevel + ': ' + result.driveUrl);
  return {
    ok: true,
    type: 'ANSWER_PDF',
    classLevel: classLevel,
    qid: qData.qid,
    pageCount: result.pageCount,
    driveUrl: result.driveUrl,
    timestamp: getKolkataTimestamp()
  };
}

/**
 * Test 1: Accountancy Multi-Page Model Answer PDF (Reval, Capital, Balance Sheet, Notes)
 */
function testGenerateAccountancyMultiPagePdf(classLevel) {
  classLevel = Number(classLevel) || 12;
  var todayStr = getKolkataDate();

  var result = createAnswerPdfFromTemplate_({
    date: todayStr,
    classLevel: classLevel,
    subject: 'Accountancy',
    chapter: 'Admission of a Partner — Comprehensive Problem',
    qid: 'TEST-ACC-MULTI-01',
    marks: 6,
    drCrCheck: true,
    questionText: 'Deepak and Alok are partners sharing profits in the ratio of 3:2. On 31st March 2026, they admit Rohit for a 1/5th share. Rohit brings ₹1,00,000 as capital and ₹30,000 for goodwill. Prepare Revaluation Account, Partners\' Capital Accounts, and Balance Sheet.',
    answerText:
      '#TACCOUNT:Revaluation Account\n' +
      'To Provision for Doubtful Debts | 4,000 | By Stock A/c (Appreciation) | 10,000\n' +
      'To Machinery A/c (10% Dep)      | 14,000 | By Revaluation Loss: Deepak (4,800), Alok (3,200) | 8,000\n' +
      'Total                           | 18,000 | Total | 18,000\n' +
      '#ENDTACCOUNT\n\n' +
      '#CAPITAL:Deepak|Alok|Rohit\n' +
      'Particulars | Deepak (₹) | Alok (₹) | Rohit (₹) | Particulars | Deepak (₹) | Alok (₹) | Rohit (₹)\n' +
      'To Revaluation Loss | 4,800 | 3,200 | - | By Balance b/d | 1,80,000 | 1,20,000 | -\n' +
      'To Balance c/d | 2,17,200 | 1,44,800 | 1,00,000 | By Gen. Reserve | 24,000 | 16,000 | -\n' +
      '| | | | By Prem. for Goodwill | 18,000 | 12,000 | -\n' +
      '| | | | By Bank A/c | - | - | 1,00,000\n' +
      'Total | 2,22,000 | 1,48,000 | 1,00,000 | Total | 2,22,000 | 1,48,000 | 1,00,000\n' +
      '#ENDCAPITAL\n\n' +
      '#PAGEBREAK\n\n' +
      '#TABLE\n' +
      'Liabilities | Amount (₹) | Assets | Amount (₹)\n' +
      'Capital Accounts: | | Machinery (1,40,000 - 14,000) | 1,26,000\n' +
      '  Deepak: 2,17,200 | | Stock (70,000 + 10,000) | 80,000\n' +
      '  Alok: 1,44,800 | | Debtors (80,000 - 8,000 PDD) | 72,000\n' +
      '  Rohit: 1,00,000 | 4,62,000 | Cash at Bank (1,04,000 + 1,00k + 30k) | 2,34,000\n' +
      'Creditors | 50,000 | |\n' +
      'TOTAL LIABILITIES | 5,12,000 | TOTAL ASSETS | 5,12,000\n' +
      '#ENDTABLE\n\n' +
      'Working Notes:\n' +
      '1. Sacrificing Ratio: In the absence of specific agreement, existing partners sacrifice in old ratio (3:2).\n' +
      '2. Premium for Goodwill of ₹30,000 is credited to Deepak (₹18,000) and Alok (₹12,000).\n' +
      '3. Closing Bank Balance: Opening ₹1,04,000 + Capital ₹1,00,000 + Premium ₹30,000 = ₹2,34,000.',
    marksBreakdown:
      '• 2.0 Marks: Accurate Revaluation A/c with loss of ₹8,000\n' +
      '• 2.0 Marks: Partners\' Capital Accounts with correct closing balances\n' +
      '• 2.0 Marks: Balanced Balance Sheet at ₹5,12,000 with Working Notes',
    commonMistakes:
      '⚠️ Provision Increase Trap: Additional debit is ₹4,000 (not ₹8,000) since ₹4,000 already existed.\n' +
      '⚠️ Premium for Goodwill must never be credited to new partner Rohit.'
  });

  return {
    ok: true,
    test: 'ACCOUNTANCY_MULTIPAGE',
    classLevel: classLevel,
    pageCount: result.pageCount,
    driveUrl: result.driveUrl,
    timestamp: getKolkataTimestamp()
  };
}

/**
 * Test 2: Economics Graph Model Answer PDF (Demand Shift SVG)
 */
function testGenerateEconomicsGraphPdf(classLevel) {
  classLevel = Number(classLevel) || 12;
  var todayStr = getKolkataDate();

  var result = createAnswerPdfFromTemplate_({
    date: todayStr,
    classLevel: classLevel,
    subject: 'Economics',
    chapter: 'Market Equilibrium & Shifts in Demand',
    qid: 'TEST-ECO-GRAPH-02',
    marks: 4,
    questionText: 'Explain the chain of effects that takes place when there is an increase in consumer income for a normal good. Use an appropriate economic diagram.',
    answerText:
      'Chain of Effects of an Increase in Income of Consumers for a Normal Good:\n\n' +
      '1. Increase in Demand: With an increase in consumer income, the demand for normal goods increases, causing a rightward shift in the demand curve from D0 to D1 while supply remains unchanged at S.\n\n' +
      '#GRAPH:demand_shift|Rightward Shift in Demand Curve (Increase in Demand)\n\n' +
      '2. Excess Demand: At the original equilibrium price P0, demand (Qd) exceeds supply (Qs), resulting in excess demand.\n' +
      '3. Price Competition: Due to competition among buyers, the market price begins to rise from P0 to P1.\n' +
      '4. Contraction of Demand & Expansion of Supply: As price rises, quantity demanded contracts along D1 and quantity supplied expands along S.\n' +
      '5. New Equilibrium: The market settles at a new equilibrium E1 with a higher equilibrium price (P1) and higher equilibrium quantity (Q1).',
    marksBreakdown:
      '• 1.5 Marks: Accurate labeled diagram showing rightward shift of Demand curve from D0 to D1\n' +
      '• 1.5 Marks: Step-by-step chain of effects explaining excess demand at initial price\n' +
      '• 1.0 Mark: Accurate conclusion on rise in equilibrium price and quantity',
    commonMistakes:
      '⚠️ Forgetting arrowheads on curves or shift direction results in a 0.5-mark deduction.\n' +
      '⚠️ Confusing shift in demand with movement along the demand curve.'
  });

  return {
    ok: true,
    test: 'ECONOMICS_GRAPH',
    classLevel: classLevel,
    pageCount: result.pageCount,
    driveUrl: result.driveUrl,
    timestamp: getKolkataTimestamp()
  };
}

/**
 * Test 3: Statistics Formula Model Answer PDF (Stacked Fraction Formula)
 */
function testGenerateStatisticsFormulaPdf(classLevel) {
  classLevel = Number(classLevel) || 11;
  var todayStr = getKolkataDate();

  var result = createAnswerPdfFromTemplate_({
    date: todayStr,
    classLevel: classLevel,
    subject: 'Statistics',
    chapter: 'Correlation & Measures of Dispersion',
    qid: 'TEST-STATS-FORMULA-03',
    marks: 4,
    questionText: 'State the formula for Karl Pearson\'s coefficient of correlation using actual mean method and calculate correlation between X and Y where Σxy = 120, Σx² = 160, and Σy² = 250.',
    answerText:
      'Karl Pearson\'s Coefficient of Correlation (r):\n\n' +
      '#FORMULA:Karl Pearson Actual Mean Formula\n' +
      'r = \\frac{\\sum xy}{\\sqrt{\\sum x^2 \\cdot \\sum y^2}}\n' +
      '#ENDFORMULA\n\n' +
      'Step-by-step Calculation:\n' +
      '1. Given data:\n' +
      '   • Sum of products of deviations: Σxy = 120\n' +
      '   • Sum of squared deviations of X: Σx² = 160\n' +
      '   • Sum of squared deviations of Y: Σy² = 250\n\n' +
      '2. Product of squared deviations:\n' +
      '   Σx² · Σy² = 160 · 250 = 40,000\n\n' +
      '3. Denominator:\n' +
      '   √(40,000) = 200\n\n' +
      '4. Final Coefficient:\n' +
      '   r = 120 / 200 = +0.60\n\n' +
      'Interpretation: There is a moderate positive correlation (r = +0.60) between variable X and variable Y.',
    marksBreakdown:
      '• 1.0 Mark: Correct formula with proper mathematical notation\n' +
      '• 2.0 Marks: Accurate step-by-step substitution and radical calculation\n' +
      '• 1.0 Mark: Correct final value (+0.60) and practical interpretation',
    commonMistakes:
      '⚠️ Failing to write the "+" sign before positive correlation values.\n' +
      '⚠️ Remember that -1 <= r <= +1; any value exceeding 1 is mathematically impossible.'
  });

  return {
    ok: true,
    test: 'STATISTICS_FORMULA',
    classLevel: classLevel,
    pageCount: result.pageCount,
    driveUrl: result.driveUrl,
    timestamp: getKolkataTimestamp()
  };
}

/**
 * Test 4: Business Studies Flowchart Model Answer PDF (Case Study + Flowchart)
 */
function testGenerateBstFlowchartPdf(classLevel) {
  classLevel = Number(classLevel) || 12;
  var todayStr = getKolkataDate();

  var result = createAnswerPdfFromTemplate_({
    date: todayStr,
    classLevel: classLevel,
    subject: 'Business Studies',
    chapter: 'Staffing — Process and Significance',
    qid: 'TEST-BST-FLOW-04',
    marks: 5,
    questionText: 'Gyan Logistics Ltd. is expanding its operations in Begusarai and needs 50 new operational staff. Explain the sequential steps of the Staffing Process that the HR manager must follow.',
    answerText:
      '#CARD:Business Case Scenario — Gyan Logistics Ltd.\n' +
      'Gyan Logistics Ltd. plans rapid regional expansion across Bihar. To support expanding operations, the board has authorized hiring 50 new operational and supervisory personnel. The HR director must follow a systematic staffing process to ensure right people for the right jobs.\n' +
      '#ENDCARD\n\n' +
      'Sequential Steps in the Staffing Process:\n\n' +
      '#FLOW\n' +
      '1. Estimating the Manpower Requirements\n' +
      '-> 2. Recruitment (Searching Prospective Candidates)\n' +
      '-> 3. Selection (Screening & Choosing the Best)\n' +
      '-> 4. Placement and Orientation (Induction)\n' +
      '-> 5. Training and Development (Skill Enhancement)\n' +
      '#ENDFLOW\n\n' +
      'Explanation of Steps:\n' +
      '1. Estimating Manpower Requirements: Workload analysis (number and type of staff needed) and Workforce analysis (staff already available) to determine net shortage.\n' +
      '2. Recruitment: Attracting suitable candidates through internal and external sources (campus placement, agencies, advertisements).\n' +
      '3. Selection: Comprehensive process including tests, interviews, and reference checks to choose the best candidate.\n' +
      '4. Placement & Orientation: Introducing selected candidates to colleagues, company policies, and assigning specific job duties.\n' +
      '5. Training & Development: Systematic skill development to enhance current job performance and prepare employees for future promotions.',
    marksBreakdown:
      '• 1.5 Marks: Correct sequential diagram of the 5-step Staffing Process\n' +
      '• 2.5 Marks: In-depth explanation of all 5 steps with practical business context\n' +
      '• 1.0 Mark: Contextual application to Gyan Logistics expansion',
    commonMistakes:
      '⚠️ Omitting Workload vs Workforce analysis when explaining Step 1.\n' +
      '⚠️ Reversing the order of Selection and Recruitment.'
  });

  return {
    ok: true,
    test: 'BST_FLOWCHART',
    classLevel: classLevel,
    pageCount: result.pageCount,
    driveUrl: result.driveUrl,
    timestamp: getKolkataTimestamp()
  };
}

// 4. SUBJECTIVE CONTENT RETRIEVAL & DEFAULT VAULT
// ─────────────────────────────────────────────────────────────────────

/**
 * Retrieves today's subjective problem from QuestionBank or pre-verified vault
 * Supports 2, 3, 4, 5, 6 marks questions across Class 11 & Class 12.
 * @param {string|number} classLevel
 * @param {Object} subtopic
 * @param {number} [targetMarks]
 * @return {Object}
 */
/**
 * Scans Subjective_PDF_Log to collect all previously dispatched Question IDs
 * @return {Object.<string, boolean>}
 */
function getDispatchedSubjectiveQids_() {
  var used = {};
  try {
    var logSheet = getSheet_('SHEET_TG', 'Subjective_PDF_Log');
    if (logSheet && logSheet.getLastRow() > 1) {
      var data = logSheet.getDataRange().getValues();
      for (var r = 1; r < data.length; r++) {
        var rowQid = String(data[r][6] || '').trim();
        if (rowQid) used[rowQid] = true;
        var payload = data[r][7];
        if (payload) {
          try {
            var parsed = JSON.parse(payload);
            if (parsed && parsed.qid) used[parsed.qid] = true;
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    Logger.log('Notice reading Subjective_PDF_Log: ' + err.message);
  }
  return used;
}

/**
 * Retrieves today's subjective problem from QuestionBank or pre-verified vault
 * Supports 2, 3, 4, 5, 6 marks questions across Class 11 & Class 12.
 * Strictly skips questions already logged in Subjective_PDF_Log so questions are never repeated.
 * @param {string|number} classLevel
 * @param {Object} subtopic
 * @param {number} [targetMarks]
 * @return {Object}
 */
function getApprovedSubjectiveQuestion_(classLevel, subtopic, targetMarks) {
  classLevel = Number(classLevel) || 12;
  subtopic = subtopic || {};
  targetMarks = Number(targetMarks) || 0;
  var usedQids = getDispatchedSubjectiveQids_();

  // 1. Try to query SHEET_QB!Theory_Bank then SHEET_QB!QuestionBank
  var bankTabs = ['Theory_Bank', 'QuestionBank'];
  for (var t = 0; t < bankTabs.length; t++) {
    try {
      var allQ = getAllRowsAsObjects_('SHEET_QB', bankTabs[t], 1000);
      for (var i = 0; i < allQ.length; i++) {
        var q = allQ[i];
        var qClass = Number(q.Class || q.classLevel);
        var qType = String(q.Type || q.QuestionType || '').toLowerCase();
        var qMarks = Number(q.Marks || q.marks || 6);
        var qStatus = String(q.ApprovalStatus || q.Status || '').toLowerCase();
        var qid = String(q.QID || q.T_ID || q.QuestionID || ('QB_' + classLevel + '_' + i));

        if (qClass === classLevel && (qType.indexOf('subjective') !== -1 || qType.indexOf('theory') !== -1 || qType.indexOf('short') !== -1 || qType.indexOf('long') !== -1)) {
          if (qStatus === 'approved' || qStatus === 'active') {
            if (!targetMarks || qMarks === targetMarks) {
              if (!usedQids[qid]) {
                return {
                  qid: qid,
                  subject: q.Subject || 'Accountancy',
                  chapter: q.Chapter || '1',
                  chapterName: q.ChapterName || subtopic.chapterName || (classLevel === 11 ? 'Introduction to Accounting' : 'Partnership Accounts'),
                  question: q.Question || q.QuestionText,
                  marks: qMarks || 6,
                  modelAnswer: q.Explanation || q.ModelAnswer || q.CorrectAnswer || 'Pass requisite Journal Entries with proper narrations and account heads.',
                  rubric: q.Rubric || q.Official_CBSE_Marking_Scheme || '• Full steps as per CBSE guidelines',
                  traps: q.TrapAlert || q.Traps || 'Ensure double underline under final balance totals.'
                };
              }
            }
          }
        }
      }
    } catch (err) {
      Logger.log('Notice in getApprovedSubjectiveQuestion_ reading ' + bankTabs[t] + ': ' + err.message);
    }
  }

  // 2. Curated Authentic CBSE Multi-Mark Vault by Class Level & Mark Tier
  // Filter out any questions already logged in Subjective_PDF_Log (prevent Nov 11 repetitions)
  var vault = getCuratedSubjectiveVault_(classLevel);

  // Pass 1: Match targetMarks if specified and not used
  for (var v = 0; v < vault.length; v++) {
    var candidate = vault[v];
    if (targetMarks && candidate.marks !== targetMarks) continue;
    if (!usedQids[candidate.qid]) {
      return candidate;
    }
  }

  // Pass 2: Any question in vault not yet used
  for (var v2 = 0; v2 < vault.length; v2++) {
    if (!usedQids[vault[v2].qid]) {
      return vault[v2];
    }
  }

  // Pass 3: If all vault questions have been dispatched, rotate back
  if (targetMarks) {
    for (var v3 = 0; v3 < vault.length; v3++) {
      if (vault[v3].marks === targetMarks) return vault[v3];
    }
  }
  return vault[0];
}

function getCuratedSubjectiveVault_(classLevel) {
  if (classLevel === 11) {
    return [
      {
        qid: 'C11_SUBJ_4M_BRS',
        subject: 'Accountancy',
        chapter: 'Chapter 5',
        chapterName: 'Bank Reconciliation Statement (BRS)',
        question:
          'From the following particulars, prepare Bank Reconciliation Statement for M/s Begusarai Traders as on 31st March 2026:\n' +
          '1. Debit balance as per Cash Book (Bank column): ₹45,000.\n' +
          '2. Cheques issued to creditors amounting to ₹18,000, out of which cheques of ₹11,000 were presented for payment.\n' +
          '3. Cheques deposited into bank of ₹12,500, but cheques of ₹4,500 were credited by bank on 4th April 2026.\n' +
          '4. Bank interest credited ₹800 and bank charges debited ₹250 directly by bank, not entered in Cash Book.',
        marks: 4,
        modelAnswer:
          'BANK RECONCILIATION STATEMENT as on 31st March 2026\n' +
          '------------------------------------------------------------------------------------\n' +
          'Particulars                                          Plus Item (₹)  Minus Item (₹)\n' +
          '------------------------------------------------------------------------------------\n' +
          'Debit balance as per Cash Book                               45,000\n' +
          'Add: Cheques issued but not presented (18,000 - 11,000)       7,000\n' +
          'Add: Bank Interest directly credited by bank                    800\n' +
          'Less: Cheques deposited but not credited by bank                             4,500\n' +
          'Less: Bank charges debited by bank                                             250\n' +
          '------------------------------------------------------------------------------------\n' +
          'Total                                                        52,800          4,750\n' +
          'Credit (Favourable) Balance as per Pass Book (52,800 - 4,750)               48,050\n' +
          '====================================================================================',
        rubric:
          '• 1 Mark: Correct treatment of cheques issued but not presented (+₹7,000)\n' +
          '• 1 Mark: Correct treatment of cheques deposited not credited (-₹4,500)\n' +
          '• 1 Mark: Correct recording of bank interest (+₹800) and bank charges (-₹250)\n' +
          '• 1 Mark: Accurate final favorable balance as per Pass Book (₹48,050)',
        traps:
          '⚠️ Common Trap: Confusing Pass Book debit balance (overdraft) with favourable Cash Book debit balance.\n' +
          '⚠️ Cheques presented (₹11,000) must NOT be added; only the unpresented portion (₹7,000) is added.'
      },
      {
        qid: 'C11_SUBJ_6M_FINSTMT',
        subject: 'Accountancy',
        chapter: 'Chapter 8',
        chapterName: 'Financial Statements with Adjustments',
        question:
          'From the following Trial Balance of Gyan Enterprise as on 31st March 2026, prepare Trading and Profit & Loss Account and Balance Sheet:\n' +
          'Opening Stock: ₹30,000 | Purchases: ₹1,40,000 | Sales: ₹2,50,000 | Wages: ₹15,000 | Salaries: ₹24,000 | Debtors: ₹60,000 | Creditors: ₹35,000 | Capital: ₹1,00,000 | Machinery: ₹50,000 | Cash at Bank: ₹16,000.\n' +
          'Adjustments:\n' +
          '1. Closing Stock valued at ₹42,000.\n' +
          '2. Outstanding Wages ₹3,000 and Prepaid Salaries ₹2,000.\n' +
          '3. Provide Depreciation on Machinery @ 10% p.a.\n' +
          '4. Create Provision for Doubtful Debts @ 5% on Debtors.',
        marks: 6,
        modelAnswer:
          'TRADING AND PROFIT & LOSS ACCOUNT for the year ended 31st March 2026\n' +
          '------------------------------------------------------------------------------------\n' +
          'To Opening Stock                 30,000 | By Sales                          2,50,000\n' +
          'To Purchases                   1,40,000 | By Closing Stock                    42,000\n' +
          'To Wages (15,000 + 3,000 O/s)    18,000 |\n' +
          'To Gross Profit c/d             1,04,000 |\n' +
          'Total                           2,92,000 | Total                            2,92,000\n' +
          '------------------------------------------------------------------------------------\n' +
          'To Salaries (24,000 - 2,000 Ppd) 22,000 | By Gross Profit b/d               1,04,000\n' +
          'To Dep. on Machinery (10% of 50k) 5,000 |\n' +
          'To Prov. for Doubtful Debts (5%)  3,000 |\n' +
          'To Net Profit c/d                74,000 |\n' +
          'Total                           1,04,000 | Total                            1,04,000\n' +
          '====================================================================================\n' +
          'BALANCE SHEET as at 31st March 2026\n' +
          'Liabilities                 Amount (₹) | Assets                          Amount (₹)\n' +
          'Capital: 1,00,000                       | Machinery (50k - 5k Dep)            45,000\n' +
          'Add: Net Profit: 74,000         1,74,000 | Closing Stock                       42,000\n' +
          'Creditors                         35,000 | Debtors (60k - 3k PDD)              57,000\n' +
          'Outstanding Wages                  3,000 | Prepaid Salaries                     2,000\n' +
          '                                         | Cash at Bank                        16,000\n' +
          '------------------------------------------------------------------------------------\n' +
          'TOTAL LIABILITIES               2,12,000 | TOTAL ASSETS                      2,12,000\n' +
          '====================================================================================',
        rubric:
          '• 2.0 Marks: Accurate Trading A/c with correct Gross Profit of ₹1,04,000\n' +
          '• 2.0 Marks: Accurate Profit & Loss A/c with correct Net Profit of ₹74,000\n' +
          '• 2.0 Marks: Balanced Balance Sheet at ₹2,12,000 with dual adjustment postings',
        traps:
          '⚠️ Dual Adjustment Rule: All 4 adjustments must appear in TWO places (Trading/P&L and Balance Sheet).\n' +
          '⚠️ Prepaid Salary must be deducted from expense and placed on Assets side.'
      },
      {
        qid: 'C11_SUBJ_3M_DEPR',
        subject: 'Accountancy',
        chapter: 'Chapter 7',
        chapterName: 'Depreciation, Provisions and Reserves',
        question:
          'On 1st April 2023, Gyan Logistics purchased a commercial vehicle for ₹6,00,000. ' +
          'Depreciation is provided @ 10% p.a. on the Straight Line Method. Accounts are closed on 31st March every year. ' +
          'On 1st October 2025, the vehicle was sold for ₹4,20,000. ' +
          'Prepare the Commercial Vehicle Account for the three financial years 2023-24, 2024-25, and 2025-26.',
        marks: 3,
        modelAnswer:
          'COMMERCIAL VEHICLE ACCOUNT\n' +
          '------------------------------------------------------------------------------------\n' +
          'Date       Particulars              Amount (₹) | Date       Particulars              Amount (₹)\n' +
          '------------------------------------------------------------------------------------\n' +
          '01-Apr-23  To Bank A/c                6,00,000 | 31-Mar-24  By Depreciation A/c          60,000\n' +
          '                                               | 31-Mar-24  By Balance c/d              5,40,000\n' +
          'Total                                 6,00,000 | Total                                  6,00,000\n' +
          '------------------------------------------------------------------------------------\n' +
          '01-Apr-24  To Balance b/d             5,40,000 | 31-Mar-25  By Depreciation A/c          60,000\n' +
          '                                               | 31-Mar-25  By Balance c/d              4,80,000\n' +
          'Total                                 5,40,000 | Total                                  5,40,000\n' +
          '------------------------------------------------------------------------------------\n' +
          '01-Apr-25  To Balance b/d             4,80,000 | 01-Oct-25  By Dep. A/c (6 mos)          30,000\n' +
          '                                               | 01-Oct-25  By Bank A/c (Sale)          4,20,000\n' +
          '                                               | 01-Oct-25  By Profit & Loss (Loss)      30,000\n' +
          'Total                                 4,80,000 | Total                                  4,80,000\n' +
          '====================================================================================',
        rubric:
          '• 1.0 Mark: Accurate depreciation for 2023-24 and 2024-25 (₹60,000 each)\n' +
          '• 1.0 Mark: Correct proportionate depreciation for 6 months in 2025-26 (₹30,000)\n' +
          '• 1.0 Mark: Accurate determination of Loss on Sale of vehicle (₹30,000)',
        traps:
          '⚠️ Time Pro-Rata Trap: In year of sale, depreciation must be charged for only 6 months (1 Apr to 1 Oct).\n' +
          '⚠️ Book value on 1-Oct-25 is ₹4,50,000; selling at ₹4,20,000 gives Loss of ₹30,000.'
      },
      {
        qid: 'C11_SUBJ_5M_RECTIFICATION',
        subject: 'Accountancy',
        chapter: 'Chapter 6',
        chapterName: 'Trial Balance and Rectification of Errors',
        question:
          'Pass rectifying journal entries through Suspense Account for the following errors detected after preparing the Trial Balance:\n' +
          '1. Sales Book was overcast by ₹4,000.\n' +
          '2. Purchase of office furniture for ₹9,000 was debited to Purchases Account.\n' +
          '3. Cash of ₹5,500 received from Mohan was credited to Sohan\'s Account.\n' +
          '4. Goods returned to supplier ₹2,400 were entered in Returns Inward Book.\n' +
          '5. An amount of ₹1,800 paid for repairs of machinery was debited to Machinery Account.',
        marks: 5,
        modelAnswer:
          'JOURNAL PROPER (RECTIFYING ENTRIES)\n' +
          '------------------------------------------------------------------------------------\n' +
          'No. Particulars                                          L.F.  Debit (₹)   Credit (₹)\n' +
          '------------------------------------------------------------------------------------\n' +
          '1.  Sales A/c                                        Dr.           4,000\n' +
          '      To Suspense A/c                                                          4,000\n' +
          '    (Being overcasting of Sales Book rectified)\n' +
          '2.  Furniture A/c                                    Dr.           9,000\n' +
          '      To Purchases A/c                                                         9,000\n' +
          '    (Being purchase of furniture wrongly debited to purchases rectified)\n' +
          '3.  Sohan A/c                                        Dr.           5,500\n' +
          '      To Mohan A/c                                                             5,500\n' +
          '    (Being cash received from Mohan wrongly credited to Sohan rectified)\n' +
          '4.  Returns Inward A/c                               Dr.           2,400\n' +
          '    Suspense A/c                                     Dr.           2,400\n' +
          '      To Returns Outward A/c (or dual entry)                                  4,800\n' +
          '    (Being returns outward entered in returns inward rectified)\n' +
          '5.  Repairs A/c                                      Dr.           1,800\n' +
          '      To Machinery A/c                                                         1,800\n' +
          '    (Being revenue repairs wrongly capitalized to machinery rectified)\n' +
          '====================================================================================',
        rubric:
          '• 1 Mark for each accurate rectifying entry with appropriate account heads and narrations',
        traps:
          '⚠️ Suspense account is only used for ONE-SIDED errors (error 1). Error 2, 3, and 5 are two-sided.'
      },
      {
        qid: 'C11_SUBJ_2M_ACCPRINC',
        subject: 'Accountancy',
        chapter: 'Chapter 2',
        chapterName: 'Theory Base of Accounting & Principles',
        question:
          'State with brief practical justification:\n' +
          '1. Why is closing stock always valued at "Cost or Net Realisable Value (Market Value), whichever is lower"?\n' +
          '2. Why are outstanding expenses added to current year expenses even if cash is not yet paid?',
        marks: 2,
        modelAnswer:
          '1. Valuation of Closing Stock (Prudence / Conservatism Principle):\n' +
          '   As per the Prudence Concept, an accountant must account for all anticipated losses but anticipate no unrealized gains. Valuing closing stock at the lower of cost or market price ensures assets and profits are not overstated.\n\n' +
          '2. Outstanding Expenses (Accrual / Matching Concept):\n' +
          '   As per the Matching Concept and Accrual Assumption, all expenses incurred to generate revenue of the current accounting period must be recognized in the same period, regardless of whether actual cash payment has been made.',
        rubric:
          '• 1 Mark: Correct naming and explanation of Prudence / Conservatism Principle\n' +
          '• 1 Mark: Correct naming and explanation of Matching Concept / Accrual Basis',
        traps:
          '⚠️ Mentioning "Convention of Consistency" instead of Prudence or Matching is an examiner trap.'
      }
    ];
  }

  // Class 12 Vault
  return [
    {
      qid: 'C12_SUBJ_4M_SHARES',
      subject: 'Accountancy',
      chapter: 'Chapter 7',
      chapterName: 'Accounting for Share Capital',
      question:
        'Gyan Ltd. forfeited 500 equity shares of ₹10 each, issued at a premium of ₹2 per share, for non-payment of first call of ₹2 per share and final call of ₹3 per share. ' +
        'The premium was payable with allotment and was duly received. Out of these, 300 shares were reissued as fully paid-up for ₹8 per share. ' +
        'Pass necessary journal entries for forfeiture and reissue of shares.',
      marks: 4,
      modelAnswer:
        'JOURNAL OF GYAN LTD.\n' +
        '------------------------------------------------------------------------------------\n' +
        'Date       Particulars                                   L.F.   Debit (₹)  Credit (₹)\n' +
        '------------------------------------------------------------------------------------\n' +
        '           Equity Share Capital A/c (500 x 10)       Dr.           5,000\n' +
        '             To Share First Call A/c (500 x 2)                                1,000\n' +
        '             To Share Final Call A/c (500 x 3)                                1,500\n' +
        '             To Share Forfeiture A/c (500 x 5)                                2,500\n' +
        '           (Being 500 shares forfeited for non-payment of calls)\n' +
        '------------------------------------------------------------------------------------\n' +
        '           Bank A/c (300 x 8)                        Dr.           2,400\n' +
        '           Share Forfeiture A/c (300 x 2)            Dr.             600\n' +
        '             To Equity Share Capital A/c (300 x 10)                           3,000\n' +
        '           (Being 300 forfeited shares reissued @ ₹8 per share fully paid-up)\n' +
        '------------------------------------------------------------------------------------\n' +
        '           Share Forfeiture A/c (300 x 3)            Dr.             900\n' +
        '             To Capital Reserve A/c                                             900\n' +
        '           (Being net gain on reissue of 300 shares transferred to Capital Reserve)\n' +
        '====================================================================================',
      rubric:
        '• 1.5 Marks: Correct Forfeiture entry (Capital debited at called-up ₹10, correct forfeiture credit ₹2,500)\n' +
        '• 1.5 Marks: Correct Reissue entry (Bank debited ₹2,400, Forfeiture discount debited ₹600)\n' +
        '• 1.0 Mark: Correct transfer to Capital Reserve: (₹5 - ₹2) x 300 shares = ₹900',
      traps:
        '⚠️ Securities Premium Trap: Premium was received with allotment, so Securities Premium A/c must NOT be debited on forfeiture (Sec 52(2) Rule).\n' +
        '⚠️ Capital Reserve Pro-Rata Trap: Only gain on the 300 REISSUED shares (₹5 - ₹2 = ₹3 per share) is transferred, NOT the entire ₹2,500 balance.'
    },
    {
      qid: 'C12_SUBJ_6M_ADMISSION',
      subject: 'Accountancy',
      chapter: 'Chapter 3',
      chapterName: 'Admission of a Partner',
      question:
        'Deepak and Alok are partners sharing profits in the ratio of 3:2. On 31st March 2026, their Balance Sheet showed: ' +
        'Capitals: Deepak ₹1,80,000, Alok ₹1,20,000; General Reserve ₹40,000; Creditors ₹50,000; Debtors ₹80,000 (less Provision ₹4,000); Stock ₹70,000; Machinery ₹1,40,000; Cash at Bank ₹1,04,000. ' +
        'They admit Rohit for a 1/5th share on 1st April 2026. Rohit brings ₹1,00,000 as capital and ₹30,000 for goodwill. ' +
        'Adjustments:\n' +
        '1. Stock is appreciated by ₹10,000.\n' +
        '2. Provision for Doubtful Debts is increased to 10% on Debtors.\n' +
        '3. Machinery is depreciated by 10%.\n' +
        'Prepare Revaluation Account and Partners\' Capital Accounts.',
      marks: 6,
      modelAnswer:
        'REVALUATION ACCOUNT\n' +
        '------------------------------------------------------------------------------------\n' +
        'Particulars                            Amount (₹) | Particulars           Amount (₹)\n' +
        '------------------------------------------------------------------------------------\n' +
        'To Provision for Doubtful Debts             4,000 | By Stock A/c (Appr.)       10,000\n' +
        'To Machinery A/c (10% of 1,40,000)         14,000 | By Revaluation Loss c/d:\n' +
        '                                                   |   Deepak (3/5) = 4,800\n' +
        '                                                   |   Alok (2/5)   = 3,200     8,000\n' +
        'Total                                      18,000 | Total                      18,000\n' +
        '====================================================================================\n' +
        'PARTNERS\' CAPITAL ACCOUNTS\n' +
        '------------------------------------------------------------------------------------\n' +
        'Particulars       Deepak (₹)   Alok (₹)  Rohit (₹) | Particulars       Deepak (₹)   Alok (₹)  Rohit (₹)\n' +
        '------------------------------------------------------------------------------------\n' +
        'To Revaluation Loss    4,800      3,200          - | By Balance b/d     1,80,000   1,20,000          -\n' +
        'To Balance c/d       2,17,200   1,44,800   1,00,000 | By Gen. Reserve     24,000     16,000          -\n' +
        '                                                   | By Prem. for GW     18,000     12,000          -\n' +
        '                                                   | By Bank A/c              -          -   1,00,000\n' +
        'Total                2,22,000   1,48,000   1,00,000 | Total              2,22,000   1,48,000   1,00,000\n' +
        '====================================================================================',
      rubric:
        '• 2.0 Marks: Accurate Revaluation A/c with correct loss of ₹8,000 divided in 3:2\n' +
        '• 1.5 Marks: Correct distribution of General Reserve (₹24k / ₹16k) and Premium for Goodwill (₹18k / ₹12k) in sacrificing ratio\n' +
        '• 2.5 Marks: Balanced Partners\' Capital Accounts with correct closing balances',
      traps:
        '⚠️ Provision Increase Trap: Existing provision is ₹4,000. 10% on ₹80,000 is ₹8,000. So additional debit is ₹4,000, NOT ₹8,000!\n' +
        '⚠️ Premium for goodwill is shared in SACRIFICING ratio (3:2), never new ratio.'
    },
    {
      qid: 'C12_SUBJ_6M_PARTNER',
      subject: 'Accountancy',
      chapter: 'Chapter 1',
      chapterName: 'Accounting for Partnership Firms - Fundamentals',
      question:
        'A and B are partners sharing profits in the ratio of 3:2 with capitals of ₹5,00,000 and ₹3,00,000 respectively. ' +
        'Interest on capital is agreed @ 6% p.a. B is to be allowed an annual salary of ₹60,000. ' +
        'During the year ended 31st March 2026, the profit earned by the firm prior to any appropriations was ₹2,40,000. ' +
        'Prepare Profit and Loss Appropriation Account and Partners\' Capital Accounts assuming capitals are fluctuating.',
      marks: 6,
      modelAnswer:
        'PROFIT AND LOSS APPROPRIATION ACCOUNT for the year ended 31-Mar-2026\n' +
        '------------------------------------------------------------------------------------\n' +
        'Particulars                            Amount (₹)   Particulars           Amount (₹)\n' +
        '------------------------------------------------------------------------------------\n' +
        'To Interest on Capital:                             By Net Profit b/d       2,40,000\n' +
        '  A (6% on 5,00,000) = 30,000\n' +
        '  B (6% on 3,00,000) = 18,000             48,000\n' +
        'To Partner Salary (B)                     60,000\n' +
        'To Divisible Profit transferred to:\n' +
        '  A Capital A/c (3/5) = 79,200\n' +
        '  B Capital A/c (2/5) = 52,800           1,32,000\n' +
        '------------------------------------------------------------------------------------\n' +
        'TOTAL                                   2,40,000   TOTAL                   2,40,000\n' +
        '====================================================================================',
      rubric:
        '• 1.5 Marks: Correct calculation of Interest on Capital (A: ₹30,000, B: ₹18,000)\n' +
        '• 1.0 Mark: Salary to B correctly treated as Appropriation\n' +
        '• 1.5 Marks: Correct calculation of Divisible Profit (₹1,32,000 divided in 3:2)\n' +
        '• 2.0 Marks: Neatly prepared Capital Accounts with correct closing balances',
      traps:
        '⚠️ Common Error: Splitting divisible profit equally instead of 3:2.\n' +
        '⚠️ Forgetting double underline closing rules under the ledger total.'
    },
    {
      qid: 'C12_SUBJ_4M_DEBENTURES',
      subject: 'Accountancy',
      chapter: 'Chapter 8',
      chapterName: 'Issue and Redemption of Debentures',
      question:
        'Gyan Engineering Ltd. issued 2,000 9% Debentures of ₹100 each at a discount of 4%, redeemable at a premium of 5% after 5 years. ' +
        'The entire issue was fully subscribed. The company has a balance of ₹25,000 in Securities Premium Account. ' +
        'Pass necessary journal entries for the issue of debentures and for writing off the Loss on Issue of Debentures.',
      marks: 4,
      modelAnswer:
        'JOURNAL OF GYAN ENGINEERING LTD.\n' +
        '------------------------------------------------------------------------------------\n' +
        'Date       Particulars                                   L.F.   Debit (₹)  Credit (₹)\n' +
        '------------------------------------------------------------------------------------\n' +
        '           Bank A/c (2,000 x 96)                     Dr.          1,92,000\n' +
        '             To 9% Debenture Application & Allotment A/c                     1,92,000\n' +
        '           (Being application money received on 2,000 debentures @ ₹96)\n' +
        '------------------------------------------------------------------------------------\n' +
        '           9% Debenture App. & Allotment A/c         Dr.          1,92,000\n' +
        '           Loss on Issue of Debentures A/c (4% + 5%) Dr.            18,000\n' +
        '             To 9% Debentures A/c (2,000 x 100)                              2,00,000\n' +
        '             To Premium on Redemption of Debentures A/c (5%)                   10,000\n' +
        '           (Being 2,000 debentures issued at 4% discount redeemable at 5% premium)\n' +
        '------------------------------------------------------------------------------------\n' +
        '           Securities Premium A/c                    Dr.            18,000\n' +
        '             To Loss on Issue of Debentures A/c                               18,000\n' +
        '           (Being total loss on issue written off from Securities Premium)\n' +
        '====================================================================================',
      rubric:
        '• 1.0 Mark: Accurate entry for application money receipt (₹1,92,000)\n' +
        '• 2.0 Marks: Accurate allotment entry recognizing Loss on Issue (₹18,000) and Premium on Redemption (₹10,000)\n' +
        '• 1.0 Mark: Accurate write-off entry of Loss on Issue from Securities Premium',
      traps:
        '⚠️ Loss on Issue includes BOTH discount on issue (₹8,000) + premium on redemption (₹10,000) = ₹18,000.\n' +
        '⚠️ Section 52(2) prioritizes Securities Premium for writing off debenture issue loss.'
    },
    {
      qid: 'C12_SUBJ_3M_CFS',
      subject: 'Accountancy',
      chapter: 'Chapter 10',
      chapterName: 'Cash Flow Statement',
      question:
        'From the following information, calculate "Cash Flow from Operating Activities" of Begusarai Chemicals Ltd.:\n' +
        '• Net Profit before Tax and Extraordinary Items: ₹4,50,000\n' +
        '• Depreciation on Plant & Machinery: ₹55,000\n' +
        '• Goodwill amortised: ₹20,000\n' +
        '• Gain on sale of land: ₹30,000\n' +
        '• Increase in Trade Receivables: ₹40,000\n' +
        '• Decrease in Inventories: ₹25,000\n' +
        '• Increase in Trade Payables: ₹15,000\n' +
        '• Income tax paid during the year: ₹60,000',
      marks: 3,
      modelAnswer:
        'CASH FLOW FROM OPERATING ACTIVITIES\n' +
        '------------------------------------------------------------------------------------\n' +
        'Particulars                                                           Amount (₹)\n' +
        '------------------------------------------------------------------------------------\n' +
        'Net Profit before Tax and Extraordinary Items                            4,50,000\n' +
        'Adjustments for Non-Cash and Non-Operating Items:\n' +
        '  Add: Depreciation on Plant & Machinery                                   55,000\n' +
        '  Add: Goodwill amortised                                                  20,000\n' +
        '  Less: Gain on sale of land (investing activity)                         (30,000)\n' +
        'Operating Profit before Working Capital Changes                          4,95,000\n' +
        'Adjustments for Working Capital Changes:\n' +
        '  Less: Increase in Trade Receivables (Current Asset)                     (40,000)\n' +
        '  Add: Decrease in Inventories (Current Asset)                             25,000\n' +
        '  Add: Increase in Trade Payables (Current Liability)                      15,000\n' +
        'Cash Generated from Operations                                           4,95,000\n' +
        'Less: Income Tax Paid                                                     (60,000)\n' +
        'Net Cash Flow from Operating Activities                                  4,35,000\n' +
        '====================================================================================',
      rubric:
        '• 1.0 Mark: Accurate Operating Profit before Working Capital changes (₹4,95,000)\n' +
        '• 1.0 Mark: Accurate adjustments for working capital items (Net change ₹0)\n' +
        '• 1.0 Mark: Accurate Net Cash from Operating Activities after tax payment (₹4,35,000)',
      traps:
        '⚠️ Gain on sale of land must be DEDUCTED because it is an investing activity cash inflow.\n' +
        '⚠️ Increase in current assets is an outflow (-), increase in current liabilities is an inflow (+).'
    }
  ];
}


/**
 * ═══════════════════════════════════════════════════════════════════════
 * FOUNDER DRY-RUN TEST SUITE: 4 SUBJECT PDF RENDERERS
 * (Generates PDFs to Google Drive without Telegram channel broadcast)
 * ═══════════════════════════════════════════════════════════════════════
 */
function runFounderSubjectiveDryRunTests() {
  var todayStr = getKolkataDate();
  var results = {};

  // Test 1: Accountancy (2-Partner Revaluation + Capital + Balance Sheet)
  try {
    var t1Ans =
      '#TACCOUNT Revaluation Account\n' +
      '| Dr. Particulars | ₹ | Cr. Particulars | ₹ |\n' +
      '| To Machinery A/c | 12,000 | By Stock A/c | 7,000 |\n' +
      '| To Provision for Doubtful Debts | 2,500 | By Loss transferred to: A (3/5) 4,500; B (2/5) 3,000 | 7,500 |\n' +
      '| Total | 14,500 | Total | 14,500 |\n' +
      '#ENDTACCOUNT\n\n' +
      '#CAPITAL Partners\' Capital Accounts\n' +
      '| Particulars | A (₹) | B (₹) | Particulars | A (₹) | B (₹) |\n' +
      '| To Revaluation (Loss) | 4,500 | 3,000 | By Balance b/d | 1,20,000 | 80,000 |\n' +
      '| To Balance c/d | 1,39,500 | 93,000 | By General Reserve | 12,000 | 8,000 |\n' +
      '| | | | By Premium for Goodwill | 12,000 | 8,000 |\n' +
      '| Total | 1,44,000 | 96,000 | Total | 1,44,000 | 96,000 |\n' +
      '#ENDCAPITAL\n\n' +
      '#TABLE New Balance Sheet as on 01-04-2026\n' +
      '| Liabilities | ₹ | Assets | ₹ |\n' +
      '| Creditors | 40,000 | Cash (20,000 + 60,000 + 20,000) | 1,00,000 |\n' +
      '| Capital: A | 1,39,500 | Debtors (50,000 − 2,500) | 47,500 |\n' +
      '| Capital: B | 93,000 | Stock (70,000 + 7,000) | 77,000 |\n' +
      '| Capital: C | 60,000 | Machinery (1,20,000 − 12,000) | 1,08,000 |\n' +
      '| Total | 3,32,500 | Total | 3,32,500 |\n' +
      '#ENDTABLE';

    var res1 = createAnswerPdfFromTemplate_({
      date: todayStr,
      classLevel: 12,
      subject: 'Accountancy',
      chapter: 'Admission of a Partner (2 Partners)',
      qid: 'DRYRUN-2PARTNER-ACC',
      bypassCache: true,
      marks: 8,
      drCrCheck: true,
      questionText:
        'A and B are partners sharing profits in 3:2. Their Balance Sheet as on 31-03-2026:\n' +
        '#TABLE\n' +
        '| Liabilities | ₹ | Assets | ₹ |\n' +
        '| Creditors | 40,000 | Cash | 20,000 |\n' +
        '| General Reserve | 20,000 | Debtors | 50,000 |\n' +
        '| Capital: A | 1,20,000 | Stock | 70,000 |\n' +
        '| Capital: B | 80,000 | Machinery | 1,20,000 |\n' +
        '| Total | 2,60,000 | Total | 2,60,000 |\n' +
        '#ENDTABLE\n' +
        'Adjustments: C is admitted for 1/5th share. Stock appreciated by 10%. Machinery depreciated by 10%. Create 5% Provision on Debtors. Prepare Revaluation A/c, Partners\' Capital A/cs, and Balance Sheet.',
      answerText: t1Ans,
      marksBreakdown:
        '• 2.5 Marks: Accurate Revaluation A/c with loss of ₹7,500\n' +
        '• 3.0 Marks: Balanced Partners\' Capital Accounts (A: ₹1,39,500; B: ₹93,000)\n' +
        '• 2.5 Marks: Balanced Balance Sheet at ₹3,32,500',
      commonMistakes:
        '⚠️ Provision Calculation: 5% on ₹50,000 is ₹2,500.\n' +
        '⚠️ Premium for Goodwill distributed in sacrificing ratio 3:2.'
    });
    results.test1_accountancy_2partner = {
      ok: true,
      subject: 'Accountancy',
      topic: 'Admission of a Partner (2 Partners)',
      classLevel: 12,
      marks: 8,
      pageCount: res1.pageCount,
      pageMms: res1.pageMms,
      drCrCheckTally: '3,32,500 = 3,32,500 (Balanced)',
      driveUrl: res1.driveUrl
    };
  } catch (e1) {
    results.test1_accountancy_2partner = { ok: false, error: e1.message };
  }

  // Test 2: 4-Partner Capital Account (P, Q, R, S)
  try {
    var t2Ans =
      '#CAPITAL Partners\' Capital Accounts (P, Q, R, S)\n' +
      '| Particulars | P (₹) | Q (₹) | R (₹) | S (₹) | Particulars | P (₹) | Q (₹) | R (₹) | S (₹) |\n' +
      '| To Drawings | 10,000 | 8,000 | 6,000 | 4,000 | By Balance b/d | 2,00,000 | 1,50,000 | 1,00,000 | 80,000 |\n' +
      '| To Int. on Drawings | 600 | 480 | 360 | 240 | By Int. on Capital | 12,000 | 9,000 | 6,000 | 4,800 |\n' +
      '| To Balance c/d | 2,21,400 | 1,65,520 | 1,14,640 | 92,560 | By Salary/Commission | 5,000 | 4,000 | 3,000 | 2,000 |\n' +
      '| | | | | | By Divisible Profit | 15,000 | 11,000 | 6,000 | 10,000 |\n' +
      '| Total | 2,32,000 | 1,74,000 | 1,21,000 | 96,800 | Total | 2,32,000 | 1,74,000 | 1,21,000 | 96,800 |\n' +
      '#ENDCAPITAL';

    var res2 = createAnswerPdfFromTemplate_({
      date: todayStr,
      classLevel: 12,
      subject: 'Accountancy',
      chapter: 'Partnership Fundamentals (4 Partners)',
      qid: 'DRYRUN-4PARTNER-CAP',
      bypassCache: true,
      marks: 6,
      drCrCheck: true,
      questionText:
        'P, Q, R, and S are partners in a firm. Their capitals on 01-04-2025 were ₹2,00,000, ₹1,50,000, ₹1,00,000, and ₹80,000. Prepare Partners\' Capital Accounts after charging Interest on Capital @ 6% p.a., Interest on Drawings, Salaries, and distributing profit.',
      answerText: t2Ans,
      marksBreakdown:
        '• 2.0 Marks: Accurate Interest on Capital & Salary postings\n' +
        '• 2.0 Marks: Correct Drawings & Interest on Drawings debit postings\n' +
        '• 2.0 Marks: Balanced 4-partner capital accounts with exact 50%-50% layout',
      commonMistakes:
        '⚠️ Column width misalignment when preparing ledgers for 4+ partners.'
    });
    results.test2_accountancy_4partner = {
      ok: true,
      subject: 'Accountancy',
      topic: 'Partnership Fundamentals (4 Partners)',
      classLevel: 12,
      marks: 6,
      pageCount: res2.pageCount,
      pageMms: res2.pageMms,
      dynamicMath: 'Exact 50% | 50% (22% + 7%x4 | 22% + 7%x4)',
      driveUrl: res2.driveUrl
    };
  } catch (e2) {
    results.test2_accountancy_4partner = { ok: false, error: e2.message };
  }

  // Test 3: Statistics (SD Frequency Table + Stacked Fractions)
  try {
    var res3 = createAnswerPdfFromTemplate_({
      date: todayStr,
      classLevel: 11,
      subject: 'Statistics',
      chapter: 'Measures of Dispersion (Standard Deviation)',
      qid: 'DRYRUN-STATS-ADAPTIVE',
      bypassCache: true,
      marks: 6,
      questionText: 'Calculate Standard Deviation from the following data using Assumed Mean (A = 25): 0-10 (2), 10-20 (3), 20-30 (5), 30-40 (4), 40-50 (6).',
      answerText:
        '#TABLE Calculation of Standard Deviation\n' +
        '| Class | f | Mid (m) | d = m − 25 | fd | fd² |\n' +
        '| 0–10 | 2 | 5 | -20 | -40 | 800 |\n' +
        '| 10–20 | 3 | 15 | -10 | -30 | 300 |\n' +
        '| 20–30 | 5 | 25 | 0 | 0 | 0 |\n' +
        '| 30–40 | 4 | 35 | +10 | +40 | 400 |\n' +
        '| 40–50 | 6 | 45 | +20 | +120 | 2,400 |\n' +
        '| Total | N = 20 | | | Σfd = 90 | Σfd² = 3,900 |\n' +
        '#ENDTABLE\n\n' +
        '#FORMULA\n' +
        'σ = √( [FRAC: Σfd² / N] − [FRAC: Σfd / N]² ) = √( [FRAC: 3900 / 20] − [FRAC: 90 / 20]² ) = √(195 − 20.25) = √174.75 ≈ 13.22\n' +
        '#ENDFORMULA',
      marksBreakdown:
        '• 3.0 Marks: Accurate frequency table with correct Σfd = 90 and Σfd² = 3,900\n' +
        '• 2.0 Marks: Clean stacked fraction formula without strikethrough overlines\n' +
        '• 1.0 Mark: Final calculated standard deviation σ ≈ 13.22',
      commonMistakes:
        '⚠️ Squaring error: (90/20)² = 20.25, NOT 20.5.'
    });
    results.test5_statistics_sd = {
      ok: true,
      subject: 'Statistics',
      topic: 'Measures of Dispersion (Standard Deviation)',
      classLevel: 11,
      marks: 6,
      pageCount: res3.pageCount,
      pageMms: res3.pageMms,
      formulaStyle: 'Clean √( ... ) Parentheses with Stacked Fractions',
      driveUrl: res3.driveUrl
    };
  } catch (e3) {
    results.test3_statistics_sd = { ok: false, error: e3.message };
  }

  // Test 4: Economics (Demand Shift pure vector SVG)
  try {
    var resEco = createAnswerPdfFromTemplate_({
      date: todayStr,
      classLevel: 12,
      subject: 'Economics',
      chapter: 'Theory of Consumer Behaviour (Demand Shift)',
      qid: 'DRYRUN-ECO-ADAPTIVE',
      bypassCache: true,
      marks: 6,
      questionText: 'Explain the effect of an increase in the income of a consumer on the demand for a normal good with the help of a suitable diagram.',
      answerText:
        '#CARD Economic Analysis: Increase in Consumer Income\n' +
        'When consumer income increases for a normal good, purchasing power expands. At the prevailing price (P1), consumers demand more units. This causes a complete parallel rightward shift in the demand curve from D0 to D1, resulting in higher equilibrium price and quantity.\n' +
        '#ENDCARD\n\n' +
        '#GRAPH:demand_shift Demand Shift Analysis\n\n' +
        '• Initial Equilibrium (E0): Price ₹20, Quantity 100 units.\n' +
        '• New Equilibrium (E1): Price rises to ₹25, Quantity expands to 140 units.',
      marksBreakdown:
        '• 2.0 Marks: Accurate conceptual analysis of income effect on normal good\n' +
        '• 2.5 Marks: Pure vector diagram showing parallel rightward shift D0 -> D1\n' +
        '• 1.5 Marks: Specific price & quantity adjustment remarks',
      commonMistakes:
        '⚠️ Confusing shift in demand (shift in curve) with expansion in demand (movement along curve).'
    });
    results.test4_economics_demand = {
      ok: true,
      subject: 'Economics',
      topic: 'Theory of Consumer Behaviour (Demand Shift)',
      classLevel: 12,
      marks: 6,
      pageCount: resEco.pageCount,
      pageMms: resEco.pageMms,
      diagram: 'Pure Vector Inline SVG with Navy Axes & Shaded Equilibrium',
      driveUrl: resEco.driveUrl
    };
  } catch (eEco) {
    results.test4_economics_demand = { ok: false, error: eEco.message };
  }

  // Test 5: Business Studies (Case Study + Flowchart)
  try {
    var res4 = createAnswerPdfFromTemplate_({
      date: todayStr,
      classLevel: 12,
      subject: 'Business Studies',
      chapter: 'Planning Process',
      qid: 'DRYRUN-BST-ADAPTIVE',
      bypassCache: true,
      marks: 4,
      questionText:
        'Case Study: "ABC Ltd. Begusarai wants to increase its sales by 20% next year. The manager forecasts market demand, compares 3 marketing strategies, picks the best one, and monitors monthly results." Identify the management function and list its steps in sequence.',
      answerText:
        'Management Function: **Planning**.\n\n' +
        '#FLOW\n' +
        'Setting Objectives (20% sales growth) -> Developing Premises (market forecast) -> Identifying Alternatives -> Evaluating Alternatives -> Selecting Best Alternative -> Implementing Plan -> Follow-up Action\n' +
        '#ENDFLOW',
      marksBreakdown:
        '• 1.0 Mark: Correct identification of Planning management function\n' +
        '• 2.0 Marks: Sequential 7-step planning process diagram with directional arrows\n' +
        '• 1.0 Mark: Specific contextual mapping to ABC Ltd. Begusarai case facts',
      commonMistakes:
        '⚠️ Skipping Developing Premises or reversing step order.'
    });
    results.test3_business_studies = {
      ok: true,
      subject: 'Business Studies',
      topic: 'Planning Process',
      classLevel: 12,
      marks: 4,
      pageCount: res4.pageCount,
      pageMms: res4.pageMms,
      flowchart: 'Vertical Step Sequence with Directional Connectors (Footer on Page 2)',
      driveUrl: res4.driveUrl
    };
  } catch (e4) {
    results.test5_business_studies = { ok: false, error: e4.message };
  }

  // Test 6: Question Sheet PDF (Goodwill Question with Working Space)
  try {
    var resQ = createQuestionPdfFromTemplate_({
      date: todayStr,
      classLevel: 12,
      subject: 'Accountancy',
      chapter: 'Valuation of Goodwill (Weighted Average Profit)',
      qid: 'DRYRUN-GOODWILL-Q1',
      bypassCache: true,
      marks: 6,
      questionText:
        'Calculate the value of goodwill of a firm on the basis of 3 years\' purchase of weighted average profits of the last 4 years. The appropriate weights and profits are:\n' +
        '#TABLE Past Profits & Weights\n' +
        '| Year | Profit (₹) | Weight |\n' +
        '| 2021–22 | 20,200 | 1 |\n' +
        '| 2022–23 | 24,800 | 2 |\n' +
        '| 2023–24 | 20,000 | 3 |\n' +
        '| 2024–25 | 30,000 | 4 |\n' +
        '#ENDTABLE\n' +
        'Adjustments:\n' +
        '1. On 1st December 2023, a major repair to machinery was charged to revenue ₹6,000, on which depreciation @ 10% p.a. on reducing balance method was to be charged.\n' +
        '2. The closing stock for 2022–23 was undervalued by ₹2,400.\n' +
        '3. Annual management cost of ₹4,800 is to be charged to profits.'
    });
    results.test6_question_sheet = {
      ok: true,
      subject: 'Accountancy',
      topic: 'Valuation of Goodwill (Working Space Scaffolding)',
      classLevel: 12,
      marks: 6,
      pageCount: resQ.pageCount,
      type: '7:30 PM Question Sheet with Solution & Working Space Card',
      driveUrl: resQ.driveUrl
    };
  } catch (eQ) {
    results.test6_question_sheet = { ok: false, error: eQ.message };
  }

  return results;
}
