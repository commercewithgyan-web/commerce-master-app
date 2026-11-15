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
  var hashInput = ['DPP_DESIGN_V2', 'QUESTION', classLevel, data.subject || 'Accountancy', qid, data.questionText || ''].join(':::');
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
  var hashInput = ['DPP_DESIGN_V2', 'ANSWER', classLevel, data.subject || 'Accountancy', qid, data.questionText || '', data.answerText || '', data.marksBreakdown || '', data.commonMistakes || ''].join(':::');
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
        return expandSpecBlocks_(spec.blocks);
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
  if (!rawText) return "";
  var s = String(rawText);
  // Strip entire table blocks including all intermediate rows
  s = s.replace(/#(TABLE|TACCOUNT|CAPITAL|JOURNAL)[\s\S]*?#END\1/gi, "");
  // Strip any remaining markdown pipe lines
  s = s.replace(/^\s*\|.*\|\s*$/gm, "");
  // Strip remaining DSL tags
  s = s.replace(/#END(TABLE|TACCOUNT|CAPITAL|JOURNAL|FLOW|FORMULA|CARD)/gi, "");
  s = s.replace(/#(TABLE|TACCOUNT|CAPITAL|JOURNAL|FLOW|FORMULA|CARD|GRAPH)[^\n]*/gi, "");
  // Clean whitespace
  s = s.replace(/\s+/g, " ").trim();
  // Cut only at sentence boundaries, never mid-word or mid-number (PA5)
  if (s.length > 250) {
    var sentenceEndRegex = /([.?!])\s+/g;
    var match;
    var cutIndex = -1;
    while ((match = sentenceEndRegex.exec(s)) !== null) {
      var endPos = match.index + 1;
      if (endPos >= 140 && endPos <= 260) {
        cutIndex = endPos;
      } else if (endPos > 260) {
        if (cutIndex === -1 && endPos <= 290) {
          cutIndex = endPos;
        }
        break;
      }
    }
    if (cutIndex !== -1 && cutIndex < s.length) {
      s = s.substring(0, cutIndex).trim() + " …";
    } else if (s.length > 260) {
      var lastSpace = s.lastIndexOf(" ", 240);
      if (lastSpace > 100) {
        s = s.substring(0, lastSpace).replace(/[\s,₹;:\-]+$/, "").trim() + " …";
      }
    }
  }
  return s;
}

/**
 * Deterministic height estimator in millimeters for document blocks
 * @param {Object} blk
 * @return {number}
 */
/**
 * Height of a Rubric / Traps box (9.5pt bullets, ~100 characters per printed line, 4.6 mm per line).
 * Calibrated against Drive PDFs: title + padding + gap is about 11 mm.
 * @param {string} text
 * @return {number}
 */
function estBulletBoxMm_(text) {
  var mm = 11;
  String(text || '').split('\n').forEach(function(l) {
    l = l.trim();
    if (l) mm += Math.max(1, Math.ceil(l.length / 100)) * 4.6;
  });
  return mm;
}

function calcBlockEstMm_(blk) {
  if (!blk) return 15;
  switch (blk.type) {
    case 'recap':
      return 33;
    case 'text':
      var chars = (blk.text || '').length;
      // Calibrated on Chrome renders at 11pt: ~92 characters per printed line, 6 mm per line, 2 mm between items.
      var tLinesArr = (blk.text || '').split('\n').filter(function(l) { return l.trim(); });
      var tMm = 0;
      tLinesArr.forEach(function(l) { tMm += Math.max(1, Math.ceil(l.trim().length / 92)) * 6 + 2; });
      return 8 + Math.max(tMm, Math.ceil(chars / 92) * 6);
    case 'card':
      var bodyChars = (blk.body || blk.text || '').length;
      return 8 + Math.ceil(bodyChars / 76) * 5.2;
    case 'preformatted':
      var pLines = String(blk.text || '').split('\n').length;
      return 8 + pLines * 4.7;
    case 'taccount':
    case 'capital':
    case 'table':
    case 'journal':
      var lines = String(blk.rowsText || '').trim().split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
      if (blk.kind === 'comparison' || blk.kind === 'generic') {
        // Text-heavy cells wrap: estimate wrapped lines per row (~45 chars per line per cell).
        var wrapped = 0;
        lines.slice(1).forEach(function(l) {
          var longest = Math.max.apply(null, l.split('|').map(function(c) { return c.trim().length; }).concat([1]));
          wrapped += Math.max(1, Math.ceil(longest / 40));
        });
        return 20 + wrapped * 6.2;
      }
      var rowCount = Math.max(1, lines.length > 1 ? lines.length - 1 : lines.length);
      // Long particulars / narrations wrap onto a second line at the 10.5pt table font.
      var wraps = lines.filter(function(l) { return Math.max.apply(null, l.split('|').map(function(c) { return c.trim().length; })) > 48; }).length;
      var titleMm = (blk.type === 'taccount' || blk.type === 'capital') && String(blk.title || '').length > 45 ? 5 : 0;
      // Calibrated on Drive PDFs with 3px cell padding: ~6.8 mm per row, ~22 mm for title, header and gap.
      // Capital accounts with 3+ partners have narrow amount columns: "Deepak (₹)" wraps the header onto two lines.
      var headCells = (lines[0] || '').split('|').map(function(c) { return c.trim(); });
      var headWrapMm = (blk.type === 'capital' && headCells.length >= 8 && headCells.some(function(c) { return c.length > 9; })) ? 4.5 : 0;
      return 22 + (rowCount * 6.8) + (wraps * 4.6) + titleMm + headWrapMm + (blk.type === 'taccount' ? 3 : 0);
    case 'graph':
      return 68;
    case 'formula':
      return 34;
    case 'flow':
      var steps = String(blk.steps || '').split(/->|\n/).map(function(s) { return s.trim(); }).filter(Boolean);
      return 16 + (steps.length * 13.5);
    case 'footer_block':
      var rLines = blk.rubricText ? blk.rubricText.split('\n').filter(function(l) { return l.trim(); }).length : 0;
      var tLines = blk.trapsText ? blk.trapsText.split('\n').filter(function(l) { return l.trim(); }).length : 0;
      return 18 + ((rLines + tLines) * 4.8) + 14;
    case 'question_header':
    case 'answer_header':
      return 12;
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
  // Kept for backwards compatibility; widths now come from DPP_LAYOUT_PROFILES_ (dpp_decider.gs).
  var k = cols.length;
  if (k === 0) return '';
  var kind = 'stats';
  if (k === 4 && /balance sheet|revaluation|realisation|trading|p&l|cash|bank/i.test(title || '')) kind = 'balance_sheet';
  else if (k === 5 && /journal/i.test(title || '')) kind = 'journal';
  return colgroupFromWidths_(getProfileWidths_(kind, k));
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
  // An explicit #GRAPH anywhere means the author placed the diagram: never auto-insert another.
  blocks.hasExplicitGraph = /^\s*#GRAPH/m.test(rawText);
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
        kind: 'ledger',
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
        kind: 'journal',
        title: currentMeta || '',
        rowsText: bufText,
        estHeight: 16 + jLines.length * 6.5
      });
    } else if (currentBlockType === 'pre') {
      blocks.push({ type: 'preformatted', title: currentMeta || '', text: bufText });
    } else if (currentBlockType === 'table') {
      var tblLines = bufText.split('\n').filter(function(l) { return l.trim() && !/^[\-\=]+$/.test(l); });
      // Explicit sub-kind tags (#TRIALBALANCE, #BALANCESHEET …) narrow the decider;
      // plain #TABLE lets it choose among table kinds.
      var allowedKinds = currentTableKinds || ['trial_balance', 'balance_sheet', 'bs_schedule3', 'computation', 'comparison', 'stats', 'generic', 'ledger', 'journal', 'capital'];
      var tHeader = tblLines.length && tblLines[0].indexOf('|') !== -1 ? splitPipesToWidth_(tblLines[0], 0) : [];
      var tDecision = decideTableKind_(tHeader, tblLines.slice(1), currentMeta, subject, allowedKinds);
      var tBlk = {
        type: 'table',
        kind: tDecision.kind,
        title: currentMeta,
        rowsText: bufText,
        decision: tDecision,
        estHeight: (currentMeta ? 18 : 14) + tblLines.length * 6.5
      };
      if (tDecision.kind === 'journal') tBlk.type = 'journal';
      else if (tDecision.kind === 'ledger') tBlk.type = 'taccount';
      else if (tDecision.kind === 'capital') tBlk.type = 'capital';
      blocks.push(tBlk);
    } else {
      classifyAndPushUnmarked_(bufText, subject, blocks);
    }

    currentBlockType = null;
    currentMeta = '';
    currentBuffer = [];
    currentTableKinds = null;
  }

  // Typed table tags → which kinds the decider may pick.
  var TYPED_TABLE_TAGS = {
    TRIALBALANCE: ['trial_balance'],
    BALANCESHEET: ['balance_sheet', 'bs_schedule3'],
    COMPUTATION: ['computation'],
    COMPARE: ['comparison'],
    STATS: ['stats']
  };
  var currentTableKinds = null;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var trimmed = line.trim();

    var typedTag = trimmed.match(/^#(TRIALBALANCE|BALANCESHEET|COMPUTATION|COMPARE|STATS|PRE)\b[:\s]*(.*)$/i);
    if (typedTag) {
      flushBuffer();
      var tagName = typedTag[1].toUpperCase();
      currentBlockType = tagName === 'PRE' ? 'pre' : 'table';
      currentMeta = typedTag[2].trim();
      currentTableKinds = TYPED_TABLE_TAGS[tagName] || null;
      continue;
    }
    if (/^#END(TRIALBALANCE|BALANCESHEET|COMPUTATION|COMPARE|STATS|PRE)$/i.test(trimmed)) {
      flushBuffer();
      continue;
    }

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
      currentMeta = trimmed.replace(/^#JOURNAL[:\s]*/i, '').trim();
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

  // Consolidate orphan heading cards into following blocks (PB1)
  var mergedBlocks = [];
  for (var bi = 0; bi < blocks.length; bi++) {
    var cur = blocks[bi];
    var nxt = (bi + 1 < blocks.length) ? blocks[bi + 1] : null;
    if (cur.type === "text" && cur.text && nxt) {
      var tLines = cur.text.trim().split("\n").filter(function(l) { return l.trim(); });
      if (tLines.length === 1 && tLines[0].length <= 80 && (/:$/.test(tLines[0].trim()) || /^(sequential steps|karl pearson|step-by-step|working notes|calculation|flowchart)/i.test(tLines[0].trim()))) {
        var cleanTitle = tLines[0].trim().replace(/:$/, "");
        if (nxt.type === "formula") {
          nxt.label = cleanTitle;
          continue;
        } else if (nxt.type === "flow") {
          nxt.title = cleanTitle;
          continue;
        } else if (nxt.type === "table" || nxt.type === "taccount" || nxt.type === "capital") {
          if (!nxt.title) nxt.title = cleanTitle;
          continue;
        } else if (nxt.type === "calculation") {
          nxt.title = cleanTitle;
          continue;
        }
      }
    }
    mergedBlocks.push(cur);
  }
  return mergedBlocks;
}

/**
 * Auto-judgment classifier for unannotated content across CBSE Commerce subjects
 */
function classifyAndPushUnmarked_(text, subject, blocks) {
  if (!text) return;
  var lines = text.split("\n");
  var tableLines = lines.filter(function(l) { return l.indexOf("|") !== -1; });

  // 0. Hand-aligned (fixed-width) text: keep the author's spacing in monospace.
  //    Guessing columns out of spaces is what broke TB / BS / Journal before.
  if (looksFixedWidth_(text)) {
    blocks.push(flagNeedsReview_({ type: "preformatted", text: text }, "hand-aligned text kept in monospace: " + String(lines[0] || '').trim().slice(0, 60)));
    return;
  }

  // 1. Pipe tables: the decider scores every kind (journal, ledger, capital,
  //    trial balance, balance sheet, computation, comparison, statistics).
  if (tableLines.length >= 2) {
    var decided = buildDecidedTableBlock_(text, subject, '', null);
    if (decided) {
      if (decided.leadText) blocks.push({ type: "text", text: decided.leadText });
      var d = decided.decision;
      if (decided.shapeBad) {
        blocks.push(flagNeedsReview_({ type: "preformatted", text: text }, "pipe rows do not match the header width"));
        return;
      }
      var kind = d.kind;
      if (d.confidence < 0.4) {
        flagNeedsReview_(decided, "low decider confidence (" + d.confidence + ") for " + kind + "; rendered as plain table");
        kind = "generic";
      }
      decided.kind = kind;
      if (kind === "journal") decided.type = "journal";
      else if (kind === "ledger") { decided.type = "taccount"; if (!decided.title) decided.title = "Ledger Account"; }
      else if (kind === "capital") { decided.type = "capital"; decided.partnersText = "Partners"; }
      blocks.push(decided);
      return;
    }
  }

  // 1. Step-by-step Calculation Auto-Judgment (PA2)
  if (/Step-by-step Calculation/i.test(text) || (/^\s*1\.\s+/m.test(text) && /\b(Given data|Product|Denominator|Coefficient|Calculation)\b/i.test(text))) {
    blocks.push({
      type: "calculation",
      title: "STEP-BY-STEP CALCULATION",
      text: text,
      estHeight: 18 + lines.length * 5.5
    });
    return;
  }

  // 2. Statistics Formula Auto-Judgment (PA1) - only short isolated expressions
  if (lines.length <= 4 && /(\\frac|\\sigma|\\bar\{x\}|\\sum|\\sqrt|r\s*=|Mean\s*=|SD\s*=)/i.test(text)) {
    blocks.push({
      type: "formula",
      formula: text,
      label: "Formula",
      estHeight: 20
    });
    return;
  }

  // 3. BST Flowchart Auto-Judgment
  if (text.indexOf("->") !== -1 && text.split("->").length >= 3) {
    blocks.push({
      type: "flow",
      steps: text,
      estHeight: 12 + text.split("->").length * 6.5
    });
    return;
  }

  // 4. BST Case Study Auto-Judgment
  if (/^(Case\s*(Study|Scenario)|Read\s*the\s*following\s*scenario)/i.test(text)) {
    var parts = text.split("\n\n");
    var caseBody = parts[0];
    blocks.push({
      type: "card",
      title: "Case Scenario",
      body: caseBody,
      estHeight: 14 + Math.ceil(caseBody.length / 80) * 5
    });
    if (parts.length > 1) {
      var remaining = parts.slice(1).join("\n\n");
      blocks.push({
        type: "text",
        text: remaining,
        estHeight: Math.max(12, Math.ceil(remaining.length / 85) * 5.5 + 4)
      });
    }
    return;
  }

  // 5. Economics Graph Auto-Judgment (PA3 - Prevent duplicate graph if graph block already present)
  var textLower = text.toLowerCase();
  var hasGraphAlready = !!blocks.hasExplicitGraph;
  for (var bi = 0; bi < blocks.length; bi++) {
    if (blocks[bi].type === "graph") { hasGraphAlready = true; break; }
  }
  if (!hasGraphAlready && (subject.indexOf("eco") !== -1 || subject.indexOf("economics") !== -1)) {
    if (textLower.indexOf("shift in demand") !== -1 || textLower.indexOf("increase in demand") !== -1 || textLower.indexOf("decrease in demand") !== -1) {
      blocks.push({
        type: "text",
        text: text,
        estHeight: Math.max(12, Math.ceil(text.length / 85) * 5.5 + 4)
      });
      blocks.push({
        type: "graph",
        template: "demand_shift",
        caption: "Rightward Shift in Demand Curve (Increase in Demand)",
        estHeight: 52
      });
      return;
    }
  }

  blocks.push({
    type: "text",
    text: text,
    estHeight: Math.max(12, Math.ceil(text.length / 85) * 5.5 + 4)
  });
}

function generateMultiPageDailyPracticeSheetHtml_(data, isAnswerKey) {
  data = data || {};
  var isAns = !!isAnswerKey;
  var classLevel = Number(data.classLevel) || 12;
  var marks = Number(data.marks) || 6;

  // Header metadata
  var rawDate = formatDateDps_(data.date);
  var subjectOnly = String(data.subject || 'Accountancy').trim();
  var subjectText = 'Class ' + classLevel + ' • ' + subjectOnly;
  var topicText = String(data.chapter || (classLevel === 11 ? 'Bank Reconciliation Statement' : 'Partnership Accounts Fundamentals')).trim();
  var baseSheetNumber = data.sheetNo || data.sheetNumber || formatSheetNumberDps_(data.qid, classLevel, marks, isAns);

  // Build content blocks
  var blocks = [];
  var validationReport = [];
  var reviewReport = [];
  if (!isAns) {
    // Question PDF Layout (Publication Grade - Compact C1: badge & marks on top line of first card)
    var qBlocks = analyzeAndStructureBlock_(data.questionText || '', data.subject, data.renderSpec);
    if (qBlocks.length > 0) {
      qBlocks[0].isFirstQuestionBlock = true;
      qBlocks[0].marks = marks;
      qBlocks[0].qBadge = 'Q1';
    }
    for (var qb = 0; qb < qBlocks.length; qb++) {
      qBlocks[qb].estMm = calcBlockEstMm_(qBlocks[qb]);
      blocks.push(qBlocks[qb]);
    }
  } else {
    // Model Answer PDF Layout (Publication Grade - Compact C1: badge & marks on top line of recap box)
    var cleanRecap = cleanQuestionRecapText_(data.recapText || data.questionText || '');
    blocks.push({
      type: 'recap',
      name: 'recap',
      text: cleanRecap,
      marks: marks,
      classLevel: classLevel,
      dateStr: rawDate,
      estMm: 33
    });

    var ansBlocks = [];
    if (data.mainAnswerJson) {
      try {
        var parsedJson = typeof data.mainAnswerJson === 'string' ? JSON.parse(data.mainAnswerJson) : data.mainAnswerJson;
        if (Array.isArray(parsedJson)) ansBlocks = parsedJson;
        else if (parsedJson && Array.isArray(parsedJson.blocks)) ansBlocks = parsedJson.blocks;
      } catch (_) {}
    }
    if (ansBlocks && ansBlocks.length) {
      ansBlocks = expandSpecBlocks_(ansBlocks);
    }
    if (!ansBlocks || ansBlocks.length === 0) {
      ansBlocks = analyzeAndStructureBlock_(data.answerText || '', data.subject, data.renderSpec);
    }

    // Accounting consistency checks (Dr = Cr, totals, balance sheet tally).
    // Problems are logged for the teacher; the PDF is still produced.
    validationReport = validateBlocks_(ansBlocks);
    reviewReport = ansBlocks.filter(function(b) { return b.needsReview; }).map(function(b) { return b.reviewReason; });
    if (validationReport.length || reviewReport.length) {
      try {
        Logger.log('DPP CHECK ' + (data.qid || '') + ': ' + JSON.stringify({ validation: validationReport, needsReview: reviewReport }));
      } catch (_) {}
    }

    for (var ab = 0; ab < ansBlocks.length; ab++) {
      var aBlk = ansBlocks[ab];
      aBlk.isAnswer = true;
      aBlk.drCrCheck = !!data.drCrCheck;
      aBlk.estMm = calcBlockEstMm_(aBlk);
      blocks.push(aBlk);
    }

    // Separate Rubric and Traps blocks so they can paginate naturally across pages (B1)
    var rubric = data.markingScheme || data.marksBreakdown || '';
    var traps = data.commonTraps || data.commonMistakes || '';
    if (rubric) {
      blocks.push({
        type: 'rubric',
        name: 'rubric',
        text: rubric,
        estMm: estBulletBoxMm_(rubric)
      });
    }
    if (traps) {
      blocks.push({
        type: 'traps',
        name: 'traps',
        text: traps,
        estMm: estBulletBoxMm_(traps)
      });
    }
  }

  // Greedy Paginator with strict Cutoff per page
  var paginated = paginateBlocks_(blocks);
  var pages = paginated.pages;
  var pageMms = paginated.pageMms;
  var totalPages = pages.length;

  var headerData = {
    isAns: isAns,
    classLevel: classLevel,
    subjectOnly: subjectOnly,
    subjectText: subjectText,
    topicText: topicText,
    formattedDate: rawDate,
    sheetNumber: baseSheetNumber,
    totalPages: totalPages,
    marks: marks
  };

  var fullHtml = buildMultiPageDocumentHtml_(pages, headerData);
  return {
    html: fullHtml,
    pageCount: totalPages,
    pageMms: pageMms,
    validation: validationReport,
    needsReview: reviewReport
  };
}

/**
 * Greedy block packing into pages with 205mm strict cutoff and page millimeter tracking
 * @param {Array<Object>} blocks
 * @return {{ pages: Array<Array<Object>>, pageMms: Array<number> }}
 */
function paginateBlocks_(blocks) {
  var MAX_PAGE_1_MM = 200; // Page 1: measured 205 mm between instructions and footer, minus safety margin
  var MAX_PAGE_N_MM = 210; // Page 2+: measured 218 mm (no instructions box), minus safety margin
  var pages = [];
  var pageMms = [];
  var currentPage = [];
  var currentMm = 0;
  var isPage1 = true;

  for (var i = 0; i < blocks.length; i++) {
    var blk = blocks[i];
    var est = blk.estMm || calcBlockEstMm_(blk);
    blk.estMm = est;
    var pbb = !!blk.pageBreakBefore;
    var maxForPage = isPage1 ? MAX_PAGE_1_MM : MAX_PAGE_N_MM;
    // The closing Traps box may use the 3 mm safety slack: estimates run at or above real height
    // (checked on Drive PDFs), and this avoids a page 2 that holds nothing but Traps.
    if (blk.type === 'traps' && i === blocks.length - 1) maxForPage += 3;

    if ((pbb || (currentMm + est > maxForPage)) && currentPage.length > 0) {
      pages.push(currentPage);
      pageMms.push(Math.round(currentMm * 10) / 10);
      currentPage = [blk];
      currentMm = est;
      isPage1 = false;
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
 * Builds full HTML document containing all .page containers with branded Header, Instructions, and Footer
 * @param {Array<Array<Object>>} pages
 * @param {Object} headerData
 * @return {string}
 */
function buildMultiPageDocumentHtml_(pages, headerData) {
  var totalPages = pages.length;
  var isAns = headerData.isAns;
  var docTitle = isAns ? 'Commerce with Gyan DPP Answer Key' : 'Commerce with Gyan DPP';

  var logoBase64 = typeof getDppLogoBase64_ === 'function' ? getDppLogoBase64_() : '';
  var photoBase64 = typeof getDppPhotoBase64_ === 'function' ? getDppPhotoBase64_() : '';
  // Pre-faded watermark (fade baked into pixels) so visibility never depends on CSS opacity.
  var watermarkIsFaded = typeof getDppWatermarkFadedBase64_ === 'function';
  var watermarkBase64 = watermarkIsFaded ? getDppWatermarkFadedBase64_() : (typeof getDppWatermarkBase64_ === 'function' ? getDppWatermarkBase64_() : '');
  var watermarkOpacity = watermarkIsFaded ? 1 : 0.06;

  var headerBgColor = isAns ? '#08060F' : '#1E0063';
  var headerGradient = isAns
    ? 'linear-gradient(120deg, #08060F 0%, #160A33 60%, #2B0F66 100%)'
    : 'linear-gradient(120deg, #1E0063 0%, #4A12A8 55%, #7C30E0 100%)';
  var kickerText = isAns
    ? ('ANSWER KEY · DPP NO. ' + escapeHtml_(headerData.sheetNumber))
    : ('DAILY PRACTICE PAPER · NO. ' + escapeHtml_(headerData.sheetNumber));

  var instructionsText = isAns
    ? 'Check your register answer and correct any mistakes in red pen.'
    : 'Solve this question in your practice register. The model answer will be shared tomorrow at 08:15 AM IST.';

  var pagesHtml = pages.map(function(pageBlocks, pageIndex) {
    var pageNum = pageIndex + 1;

    // Header HTML: 50mm, rounded corners, table-based, robust across all engines
    var headerHtml = '<div class="hd" style="position: relative; z-index: 1; height: 50mm; border-radius: 6mm; background-color: ' + headerBgColor + '; background: -webkit-' + headerGradient + '; background: ' + headerGradient + '; color: #ffffff; overflow: hidden; margin-bottom: 3.5mm;">\n' +
      '  <table style="width: 100%; height: 50mm; border-collapse: collapse; table-layout: fixed;">\n' +
      '    <tr>\n' +
      '      <td style="vertical-align: middle; padding: 4.5mm 6mm; text-align: left;">\n' +
      '        <div style="display: inline-block; background: #ffffff; border-radius: 2.5mm; padding: 1.6mm 2.6mm; margin-bottom: 2mm; line-height: 0;">\n' +
      '          <img src="data:image/jpeg;base64,' + logoBase64 + '" style="height: 14mm; display: block; border: 0;" alt="Commerce with Gyan" />\n' +
      '        </div>\n' +
      '        <div style="font-size: 8pt; font-weight: 700; letter-spacing: 0.16em; color: #FFC88F; text-transform: uppercase; margin-bottom: 1.2mm;">' + escapeHtml_(kickerText) + '</div>\n' +
      '        <div style="font-size: ' + (headerData.topicText.length > 38 ? '15pt' : (headerData.topicText.length > 28 ? '16.5pt' : '18.5pt')) + '; font-weight: 700; line-height: 1.18; color: #ffffff; margin-bottom: 2mm; max-height: 13.5mm; overflow: hidden;">' + escapeHtml_(headerData.topicText) + '</div>\n' +
      '        <div>\n' +
      '          <span style="display: inline-block; border: 0.3mm solid rgba(255,255,255,0.45); border-radius: 4mm; padding: 0.6mm 3mm; font-size: 9.5pt; color: #ffffff; margin-right: 2mm;">Class ' + headerData.classLevel + '</span>\n' +
      '          <span style="display: inline-block; border: 0.3mm solid rgba(255,255,255,0.45); border-radius: 4mm; padding: 0.6mm 3mm; font-size: 9.5pt; color: #ffffff; margin-right: 2mm;">' + escapeHtml_(headerData.subjectOnly) + '</span>\n' +
      '          <span style="display: inline-block; background: #F87800; border: 0.3mm solid #F87800; border-radius: 4mm; padding: 0.6mm 3mm; font-size: 9.5pt; color: #ffffff; font-weight: 700;">' + escapeHtml_(headerData.formattedDate) + '</span>\n' +
      '        </div>\n' +
      '      </td>\n' +
      '      <td style="width: 48mm; text-align: center; vertical-align: middle; padding-right: 2mm;">\n' +
      '        <div style="width: 38mm; height: 38mm; border-radius: 50%; padding: 1mm; background: #F87800; display: inline-block; box-sizing: border-box; overflow: hidden;">\n' +
      '          <img src="data:image/jpeg;base64,' + photoBase64 + '" style="width: 36mm; height: 36mm; border-radius: 50%; display: block; object-fit: cover;" alt="Gyan Sir" />\n' +
      '        </div>\n' +
      '      </td>\n' +
      '    </tr>\n' +
      '  </table>\n' +
      '</div>\n';

    // Page 1 only: Single-line Instructions box
    var instructionsHtml = '';
    if (pageIndex === 0) {
      instructionsHtml = '<div style="border: 0.3mm solid #E6DDF7; border-radius: 2.5mm; background: #ffffff; padding: 2mm 3.5mm; margin-bottom: 3.5mm;">\n' +
        '  <table style="width: 100%; border-collapse: collapse;">\n' +
        '    <tr>\n' +
        '      <td style="width: 26mm; font-size: 7.5pt; font-weight: 700; letter-spacing: 0.14em; color: #6B6485; vertical-align: middle; white-space: nowrap;">INSTRUCTIONS</td>\n' +
        '      <td style="font-size: 9pt; color: #1B1530; vertical-align: middle;">' + escapeHtml_(instructionsText) + '</td>\n' +
        '    </tr>\n' +
        '  </table>\n' +
        '</div>\n';
    }

    var blocksHtml = pageBlocks.map(function(blk) {
      return renderBlockHtml_(blk);
    }).join('\n');

    // Footer on EVERY page: 17mm, orange top border, social icons, page circle, no Play Store
    var footerHtml = '<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 17mm; box-sizing: border-box; background-color: ' + headerBgColor + '; border-top: 1mm solid #F87800; z-index: 10;">\n' +
      '  <table style="width: 100%; height: 16mm; border-collapse: collapse; table-layout: fixed; margin: 0; padding: 0;">\n' +
      '    <tr>\n' +
      '      <td style="vertical-align: top; padding-top: 2.8mm; padding-left: 10mm; white-space: nowrap; line-height: 1.25;">\n' +
      '        <div style="font-size: 6.5pt; letter-spacing: 0.16em; color: #FFC88F; font-weight: 700; text-transform: uppercase;">OFFLINE COACHING</div>\n' +
      '        <div style="font-size: 10.5pt; font-weight: 700; color: #ffffff;">Commerce Gyan</div>\n' +
      '        <div style="font-size: 7.5pt; color: #ffffff; opacity: 0.9;">Behind G.D. College, 2nd Floor, Begusarai · 9278569860</div>\n' +
      '      </td>\n' +
      '      <td style="width: 1mm; vertical-align: top; padding-top: 3.5mm; text-align: center; padding-left: 3mm; padding-right: 3mm;">\n' +
      '        <div style="width: 0.3mm; height: 9mm; background: rgba(255,255,255,0.3); margin: 0 auto;"></div>\n' +
      '      </td>\n' +
      '      <td style="vertical-align: top; padding-top: 2.8mm; white-space: nowrap; line-height: 1.25;">\n' +
      '        <div style="font-size: 6.5pt; letter-spacing: 0.16em; color: #FFC88F; font-weight: 700; text-transform: uppercase;">ONLINE CLASSES</div>\n' +
      '        <div style="font-size: 10.5pt; font-weight: 700; color: #ffffff;">Commerce with Gyan</div>\n' +
      '        <div style="font-size: 7.5pt; color: #ffffff; opacity: 0.9;">\n' +
      '          <span style="display: inline-block; vertical-align: middle; line-height: 0; margin-right: 1.2mm;">\n' +
      '            <svg style="width: 3.6mm; height: 3.6mm; vertical-align: middle;" viewBox="0 0 24 24"><rect x="1" y="5" width="22" height="14" rx="4" fill="#FF0000"/><path d="M10 9l5 3-5 3z" fill="#fff"/></svg>\n' +
      '            <svg style="width: 3.6mm; height: 3.6mm; vertical-align: middle; margin-left: 1mm;" viewBox="0 0 24 24"><defs><linearGradient id="ig_' + pageNum + '" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FDB022"/><stop offset=".5" stop-color="#E1306C"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig_' + pageNum + ')"/><circle cx="12" cy="12" r="4.3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="#fff"/></svg>\n' +
      '            <svg style="width: 3.6mm; height: 3.6mm; vertical-align: middle; margin-left: 1mm;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#29A9EB"/><path d="M5.5 11.6l11-4.3c.5-.2 1 .1.8.9l-1.9 8.8c-.1.6-.5.8-1 .5l-2.9-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-3 5.4-4.9c.2-.2 0-.3-.3-.1l-6.7 4.2-2.9-.9c-.6-.2-.6-.6.1-.9z" fill="#fff"/></svg>\n' +
      '          </span>\n' +
      '          <span style="font-style: normal; font-weight: 600; vertical-align: middle;">@CommerceWithGyan</span>\n' +
      '        </div>\n' +
      '      </td>\n' +
      '      <td style="width: 20mm; vertical-align: top; padding-top: 4.5mm; text-align: right; padding-right: 10mm;">\n' +
      '        <div style="width: 7mm; height: 7mm; border-radius: 50%; background: #ffffff; color: ' + headerBgColor + '; font-weight: 800; font-size: 8.5pt; text-align: center; line-height: 7mm; display: inline-block;">' + pageNum + '</div>\n' +
      '      </td>\n' +
      '    </tr>\n' +
      '  </table>\n' +
      '</div>\n';

    var watermarkHtml = watermarkBase64
      ? ('  <div class="watermark" style="position: absolute; left: 45mm; top: 88.5mm; width: 120mm; height: 120mm; opacity: ' + watermarkOpacity + '; z-index: 0; pointer-events: none; text-align: center; line-height: 0;">\n' +
         '    <img src="data:image/png;base64,' + watermarkBase64 + '" style="width: 120mm; height: 120mm; display: block; border: 0;" alt="" />\n' +
         '  </div>\n')
      : '';

    return '<div class="page">\n' +
      watermarkHtml +
      headerHtml +
      instructionsHtml +
      '  <div class="content-flow">\n' +
      blocksHtml + '\n' +
      '  </div>\n' +
      footerHtml +
      '</div>';
  }).join('\n');

  return '<!DOCTYPE html>\n' +
    '<html>\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>' + escapeHtml_(docTitle) + '</title>\n' +
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
    '    font-size: 11pt;\n' +
    '    line-height: 1.48;\n' +
    '    color: #1B1530;\n' +
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
    '    padding: 8mm 10mm 0;\n' +
    '  }\n' +
    '  .page:last-child {\n' +
    '    page-break-after: auto;\n' +
    '    break-after: auto;\n' +
    '  }\n' +
    '  .content-flow {\n' +
    '    position: relative;\n' +
    '    z-index: 1;\n' +
    '    box-sizing: border-box;\n' +
    '    width: 100%;\n' +
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
    // No white box behind content: answers print straight onto the page, so the
    // watermark shows through and nothing looks pasted on.
    '  .content-card {\n' +
    '    background: transparent;\n' +
    '    border: 0;\n' +
    '    padding: 0.6mm 0;\n' +
    '    margin-bottom: 3mm;\n' +
    '    break-inside: avoid;\n' +
    '    page-break-inside: avoid;\n' +
    '  }\n' +
    '  .content-block {\n' +
    '    margin-bottom: 2.6mm;\n' +
    '    break-inside: avoid;\n' +
    '    page-break-inside: avoid;\n' +
    '  }\n' +
    '  .recap-box {\n' +
    '    margin-bottom: 2.6mm;\n' +
    '    break-inside: avoid;\n' +
    '    page-break-inside: avoid;\n' +
    '  }\n' +
    '  .footer-block {\n' +
    '    margin-top: 2.6mm;\n' +
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
    '  .watermark {\n' +
    '    position: absolute;\n' +
    '    left: 45mm;\n' +
    '    top: 88.5mm;\n' +
    '    width: 120mm;\n' +
    '    height: 120mm;\n' +
    '    z-index: 0;\n' +
    '    pointer-events: none;\n' +
    '  }\n' +
    '  .d2-item {\n' +
    '    box-sizing: border-box;\n' +
    '  }\n' +
    '  .d2-lvl-1 { margin-left: 0mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 2mm; font-size: 11pt; line-height: 1.48; color: #1B1530; }\n' +
    '  .d2-lvl-2 { margin-left: 5mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 1.5mm; font-size: 10.5pt; line-height: 1.45; color: #1B1530; }\n' +
    '  .d2-lvl-3 { margin-left: 10mm; padding-left: 7.5mm; text-indent: -7.5mm; margin-bottom: 1.5mm; font-size: 10.5pt; line-height: 1.45; color: #1B1530; }\n' +
    '  .d2-lvl-4 { margin-left: 15mm; padding-left: 7mm; text-indent: -7mm; margin-bottom: 1.5mm; font-size: 10pt; line-height: 1.45; color: #1B1530; }\n' +
    '  .d2-lvl-5 { margin-left: 20mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 1.5mm; font-size: 10pt; line-height: 1.45; color: #1B1530; }\n' +
    '  .d2-lvl-6 { margin-left: 25mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 1.5mm; font-size: 9.5pt; line-height: 1.45; color: #1B1530; }\n' +
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
    case 'answer_header':
      return renderAnswerHeaderBlockHtml_(blk);
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
    case 'calculation':
      return renderCalculationBlock_(blk.text, blk.title);
    case 'formula':
      return renderStatisticsFormulaBlock_(blk.formula, blk.label);
    case 'flow':
      return renderBstFlowchartBlock_(blk.steps, blk.title);
    case 'card':
      return renderCaseStudyCardBlock_(blk.title, blk.body);
    case 'footer_block':
      return renderFooterBlockHtml_(blk);
    case 'rubric':
      return renderRubricOnlyHtml_(blk.text);
    case 'traps':
      return renderTrapsOnlyHtml_(blk.text);
    case 'preformatted':
      return renderPreformattedBlockHtml_(blk);
    case 'text':
    default:
      return renderGenericTextBlock_(blk.text || '', blk);
  }
}

/**
 * Renders Original Problem Recap box (clean 1-2 line summary, stripped of raw tables/pipes)
 */
function renderRecapBoxBlockHtml_(blk) {
  var marks = blk.marks || 6;
  return '<div class="recap-box keep-together" style="background: #F4EEFF; border: 0.3mm solid #E6DDF7; border-left: 1.2mm solid #7C30E0; border-radius: 2.5mm; padding: 2.4mm 3.5mm; margin-bottom: 2.6mm;">' +
    '<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5mm;">' +
      '<tr>' +
        '<td style="vertical-align: middle; text-align: left;">' +
          '<span style="display: inline-block; width: 7.5mm; height: 7.5mm; border-radius: 2mm; background: #FFEEDD; color: #C25E00; font-weight: 800; font-size: 11pt; text-align: center; line-height: 7.5mm; margin-right: 2.5mm; vertical-align: middle;">A1</span>' +
          '<span style="font-size: 7.5pt; font-weight: 700; color: #7C30E0; text-transform: uppercase; letter-spacing: 0.12em; vertical-align: middle;">ORIGINAL PROBLEM RECAP</span>' +
        '</td>' +
        '<td style="vertical-align: middle; text-align: right;">' +
          '<span style="display: inline-block; color: #F87800; font-weight: 700; border: 0.3mm solid #FFD2A8; border-radius: 3mm; padding: 0.5mm 3mm; font-size: 9.5pt;">' + marks + ' Marks</span>' +
        '</td>' +
      '</tr>' +
    '</table>' +
    '<div style="font-size: 10pt; color: #1E0063; font-weight: 500; line-height: 1.4;">' + escapeHtml_(blk.text || '') + '</div>' +
  '</div>';
}

/**
 * Renders combined Footer Block containing BOTH Marking Scheme (purple tint) and Common Traps (orange tint)
 */
function renderFooterBlockHtml_(blk) {
  var rubricHtml = '';
  if (blk.rubricText) {
    rubricHtml = '<div class="content-card" style="background: #F4EEFF; border: 0.3mm solid #E6DDF7; border-left: 1.2mm solid #7C30E0; border-radius: 2.5mm; padding: 2.4mm 3.5mm; margin-bottom: 2.6mm;">' +
      '<div style="font-size: 10pt; font-weight: 700; color: #1E0063; margin-bottom: 1.5mm;">' +
        'CBSE Step-by-Step Marking Scheme & Rubric' +
      '</div>' +
      '<div style="font-size: 10pt; color: #1E0063; line-height: 1.45;">' +
        formatBulletListDps_(blk.rubricText) +
      '</div>' +
    '</div>';
  }

  var trapsHtml = '';
  if (blk.trapsText) {
    trapsHtml = '<div class="content-card" style="background: #FFF4EA; border: 0.3mm solid #FFD2A8; border-left: 1.2mm solid #F87800; border-radius: 2.5mm; padding: 2.4mm 3.5mm; margin-bottom: 0;">' +
      '<div style="font-size: 10pt; font-weight: 700; color: #C25E00; margin-bottom: 1.5mm;">' +
        'Common Examiner Traps to Avoid' +
      '</div>' +
      '<div style="font-size: 10pt; color: #C25E00; line-height: 1.45;">' +
        formatBulletListDps_(blk.trapsText) +
      '</div>' +
    '</div>';
  }

  return '<div class="footer-block keep-together" style="margin-top: 2.6mm;">' +
    rubricHtml +
    trapsHtml +
  '</div>';
}

function renderRubricOnlyHtml_(text) {
  return '<div class="content-card keep-together" style="background: #F4EEFF; border: 0.3mm solid #E6DDF7; border-left: 1.2mm solid #7C30E0; border-radius: 2.5mm; padding: 1.8mm 3.2mm; margin-bottom: 2mm;">' +
    '<div style="font-size: 10pt; font-weight: 700; color: #1E0063; margin-bottom: 0.8mm;">' +
      'CBSE Step-by-Step Marking Scheme & Rubric' +
    '</div>' +
    '<div style="font-size: 9.5pt; color: #1E0063; line-height: 1.35;">' +
      formatBulletListDps_(text) +
    '</div>' +
  '</div>';
}

function renderTrapsOnlyHtml_(text) {
  return '<div class="content-card keep-together" style="background: #FFF4EA; border: 0.3mm solid #FFD2A8; border-left: 1.2mm solid #F87800; border-radius: 2.5mm; padding: 1.8mm 3.2mm; margin-bottom: 2mm;">' +
    '<div style="font-size: 10pt; font-weight: 700; color: #C25E00; margin-bottom: 0.8mm;">' +
      'Common Examiner Traps to Avoid' +
    '</div>' +
    '<div style="font-size: 9.5pt; color: #C25E00; line-height: 1.35;">' +
      formatBulletListDps_(text) +
    '</div>' +
  '</div>';
}

/**
 * Question Sheet Header Card: purple number badge ("Q1"), orange marks tag ("6 Marks")
 */
function renderQuestionHeaderBlockHtml_(blk) {
  return '';
}

/**
 * Answer Sheet Header Card (Compact C1: embedded directly inside recap box)
 */
function renderAnswerHeaderBlockHtml_(blk) {
  return '';
}

/**
 * Unused legacy Question Working Space (kept harmless for backwards compatibility)
 */
function renderQuestionWorkingSpaceBlockHtml_(blk) {
  return '';
}

/**
 * Unused legacy Question Footer Notice (kept harmless for backwards compatibility)
 */
function renderQuestionFooterBlockHtml_(blk) {
  return '';
}

function renderTAccountBlockHtml_(blk) {
  var lines = dppTableLines_(blk);
  if (lines.length === 0) return '';

  // Header: first row when it names columns; otherwise default 4-column ledger header.
  var first = splitPipesToWidth_(lines[0], 0);
  var hasHeader = /particular|date|amount|j\.?\s?f|₹/i.test(first.join(' ')) && !first.some(function(c) { return /^(to|by)\s/i.test(c); });
  var header = hasHeader ? first : ['Particulars', 'Amount (₹)', 'Particulars', 'Amount (₹)'];
  var n = header.length;
  if (n % 2 !== 0) { header.push(''); n++; }
  var half = n / 2;
  var body = hasHeader ? lines.slice(1) : lines;
  var widths = getProfileWidths_('ledger', n);
  var isAmtCol = header.map(function(h, i) { return /amount|₹|\brs\b/i.test(h) || (half === 2 && (i === 1 || i === 3)); });
  var isCenterCol = header.map(function(h) { return /^(date|j\.?\s?f\.?|l\.?\s?f\.?)$/i.test(h.trim()); });

  // Rows are grouped into segments; each "Total" row closes one (e.g. year-wise ledgers, Trading then P&L).
  var segments = [], cur = { dr: [], cr: [], drTotal: null, crTotal: null };
  body.forEach(function(l) {
    if (l.indexOf('|') === -1) return;
    var raw = splitPipesToWidth_(l, n, true);
    var c = raw.map(function(x) { return x.trim(); });
    var left = c.slice(0, half), right = c.slice(half);
    // Indentation = leading spaces the author typed. The very first cell has no pipe before it;
    // every other cell drops the one conventional space after "|".
    var unpipe = function(x) { return String(x).replace(/^ /, ''); };
    var leftRaw = raw.slice(0, half).map(function(x, i) { return i === 0 ? x : unpipe(x); });
    var rightRaw = raw.slice(half).map(unpipe);
    var isTotal = /total/i.test(left.join(' ')) || /total/i.test(right.join(' '));
    if (isTotal) {
      cur.drTotal = left; cur.crTotal = right;
      segments.push(cur);
      cur = { dr: [], cr: [], drTotal: null, crTotal: null };
      return;
    }
    if (left.some(Boolean)) cur.dr.push({ cells: left, raw: leftRaw });
    if (right.some(Boolean)) cur.cr.push({ cells: right, raw: rightRaw });
  });
  if (cur.dr.length || cur.cr.length) segments.push(cur);

  function sideTds(side, isLast, bold) {
    return side.cells.map(function(c, i) {
      var colIdx = i;
      var align = isCenterCol[colIdx] ? 'center' : (isAmtCol[colIdx] ? 'right' : 'left');
      var style = DPP_TD_BASE_ + ' text-align: ' + align + ';';
      if (isAmtCol[colIdx]) style += ' white-space: nowrap;';
      if (isCenterCol[colIdx]) style += ' white-space: nowrap; font-size: 9.5pt; padding-left: 3px; padding-right: 3px;';
      if (!isAmtCol[colIdx] && !isCenterCol[colIdx] && side.raw) {
        var lead = (String(side.raw[i] || '').match(/^(\s*)/) || ['', ''])[1].length;
        var lvl = Math.min(3, Math.floor(lead / 2));
        if (lvl > 0) style += ' padding-left: ' + (2 + lvl * 4) + 'mm;';
      }
      if (isLast) style += ' border-right: 2px solid #7C30E0;';
      if (bold) style += ' font-weight: 700;';
      return '<td style="' + style + '">' + (c ? escapeHtml_(c) : '&nbsp;') + '</td>';
    });
  }

  var empty = { cells: header.slice(0, half).map(function() { return ''; }), raw: null };
  var trs = [];
  segments.forEach(function(seg) {
    // Equal-Row Padding Rule: pad the shorter side so totals align.
    var max = Math.max(seg.dr.length, seg.cr.length);
    for (var r = 0; r < max; r++) {
      var L = seg.dr[r] || empty, R = seg.cr[r] || empty;
      var lt = sideTds(L, false, false), rt = sideTds(R, false, false);
      lt[half - 1] = lt[half - 1].replace('style="', 'style="border-right: 2px solid #7C30E0; ');
      trs.push('<tr style="border-bottom: 1px solid #F0EAFB;">' + lt.join('') + rt.join('') + '</tr>');
    }
    if (seg.drTotal || seg.crTotal) {
      var lT = sideTds({ cells: seg.drTotal || empty.cells, raw: null }, false, true);
      var rT = sideTds({ cells: seg.crTotal || empty.cells, raw: null }, false, true);
      lT[half - 1] = lT[half - 1].replace('style="', 'style="border-right: 2px solid #7C30E0; ');
      trs.push('<tr style="' + DPP_TOTAL_ROW_ + '">' + lT.join('') + rT.join('') + '</tr>');
    }
  });

  var ths = header.map(function(h, i) {
    var align = isCenterCol[i] ? 'center' : (isAmtCol[i] ? 'right' : 'left');
    var extra = (i === half - 1) ? ' border-right: 2px solid #7C30E0;' : '';
    return '<th style="' + DPP_TH_STYLE_ + ' text-align: ' + align + ';' + extra + '">' + escapeHtml_(h) + '</th>';
  }).join('');

  return '<div class="content-card keep-together" data-kind="ledger">' +
    '<table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;"><tr>' +
      '<td style="width: 15%; font-weight: 700; font-size: 10.5pt; color: #1E0063; text-align: left;">Dr.</td>' +
      '<td style="font-weight: 700; font-size: 10.5pt; color: #1E0063; text-align: center; text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(blk.title || 'Ledger Account') + '</td>' +
      '<td style="width: 15%; font-weight: 700; font-size: 10.5pt; color: #1E0063; text-align: right;">Cr.</td>' +
    '</tr></table>' +
    '<table style="' + DPP_TABLE_STYLE_ + '">' + colgroupFromWidths_(widths) +
      '<thead><tr>' + ths + '</tr></thead>' +
      '<tbody>' + trs.join('\n') + '</tbody>' +
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
    var divStyle = isDivider ? 'border-right: 2px solid #7C30E0;' : 'border-right: 1px solid #E6DDF7;';
    var fontSize = (nPartners >= 4) ? '8pt' : '9pt';
    return '<th style="background: #F4EEFF; color: #0f172a; padding: 5px 6px; ' + divStyle + ' font-weight: 700; text-align: center; font-size: ' + fontSize + ';">' + escapeHtml_(c) + '</th>';
  }).join('');

  var drItems = [];
  var crItems = [];
  var drTotal = null;
  var crTotal = null;

  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    var rawTokens = line.split('|').map(function(s) { return s.trim(); });
    if (rawTokens.length > 0 && rawTokens[0] === '' && rawTokens[rawTokens.length - 1] === '') {
      rawTokens.shift();
      rawTokens.pop();
    }

    var byIdx = -1;
    for (var k = 0; k < rawTokens.length; k++) {
      if (/^by\s/i.test(rawTokens[k])) {
        byIdx = k;
        break;
      }
    }

    var leftCols, rightCols;
    var isTotal = /total/i.test(rawTokens[0]) || /total/i.test(rawTokens[midColIndex]);

    if (isTotal) {
      if (rawTokens.length > 0 && rawTokens[0] === '') rawTokens.shift();
      leftCols = rawTokens.slice(0, midColIndex);
      rightCols = rawTokens.slice(midColIndex);
      while (leftCols.length < midColIndex) leftCols.push('');
      while (rightCols.length < midColIndex) rightCols.push('');
      drTotal = leftCols;
      crTotal = rightCols;
      continue;
    }

    if (byIdx !== -1) {
      var rawLeft = rawTokens.slice(0, byIdx);
      var rawRight = rawTokens.slice(byIdx);
      while (rawRight.length < midColIndex) rawRight.push('');
      rightCols = rawRight.slice(0, midColIndex);

      var leftNonEmpty = rawLeft.filter(function(s) { return s.trim() !== ''; });
      if (leftNonEmpty.length === 0) {
        leftCols = [];
        for (var p = 0; p < midColIndex; p++) leftCols.push('');
      } else {
        while (rawLeft.length < midColIndex) rawLeft.push('');
        leftCols = rawLeft.slice(0, midColIndex);
      }
    } else {
      leftCols = rawTokens.slice(0, midColIndex);
      while (leftCols.length < midColIndex) leftCols.push('');
      rightCols = [];
      for (var p2 = 0; p2 < midColIndex; p2++) rightCols.push('');
    }

    var leftHasContent = leftCols.some(function(c) { return c && c.trim(); });
    var rightHasContent = rightCols.some(function(c) { return c && c.trim(); });
    if (leftHasContent) drItems.push(leftCols);
    if (rightHasContent) crItems.push(rightCols);
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
      var divStyle = isDivider ? 'border-right: 2px solid #7C30E0;' : 'border-right: 1px solid #E6DDF7;';
      var isAmt = (cIdx !== 0 && cIdx !== midColIndex) && /[\d,]+|^-$/.test(c);
      var align = isAmt ? 'right' : 'left';
      var textVal = (c === '&nbsp;') ? '&nbsp;' : escapeHtml_(c);
      return '<td style="padding: ' + cellPad + '; border-bottom: 1px solid #E6DDF7; ' + divStyle + ' text-align: ' + align + '; font-size: ' + cellFontSize + '; font-variant-numeric: tabular-nums; color: #0f172a; white-space: nowrap;">' + textVal + '</td>';
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
      var divStyle = isDivider ? 'border-right: 2px solid #7C30E0;' : 'border-right: 1px solid #E6DDF7;';
      var isAmt = (cIdx !== 0 && cIdx !== midColIndex) && /[\d,]+|^-$/.test(c);
      var align = isAmt ? 'right' : 'left';
      return '<td style="padding: ' + cellPad + '; border-top: 1px solid #E6DDF7; border-bottom: 3px double #1E0063; ' + divStyle + ' text-align: ' + align + '; font-size: ' + cellFontSize + '; font-weight: bold; background: #f8fafc; font-variant-numeric: tabular-nums; color: #0f172a; white-space: nowrap;">' + escapeHtml_(c) + '</td>';
    }).join('');
    trs.push('<tr>' + totalTds + '</tr>');
  }

  var heading = blk.title || "PARTNERS' CAPITAL ACCOUNTS";

  return '<div class="content-card keep-together">' +
    '<div style="font-weight: 700; font-size: 10.5pt; color: #1E0063; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">' +
      '<span>Dr.</span>' +
      '<span style="text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(heading) + ' (' + nPartners + ' Partners)</span>' +
      '<span>Cr.</span>' +
    '</div>' +
    '<table style="width: 100%; border-collapse: collapse; border: 1px solid #E6DDF7; table-layout: fixed; font-family: inherit;">' +
      colgroupHtml +
      '<thead><tr>' + ths + '</tr></thead>' +
      '<tbody>' + trs.join('\n') + '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Renders Journal Entries (CBSE format, widths from the 'journal' layout profile):
 * Debit line flush left with "Dr." at the right edge of Particulars,
 * "To …" credit lines indented, "(Being …)" narration italic under Particulars.
 */
function renderJournalBlockHtml_(blk) {
  var lines = dppTableLines_(blk);
  if (lines.length === 0) return '';
  var prof = DPP_LAYOUT_PROFILES_.journal;

  var firstPipe = lines[0].indexOf('|') !== -1 ? splitPipesToWidth_(lines[0], 0) : [];
  var hasHeader = firstPipe.length >= 3 && /particular|date|l\.?\s?f|debit|credit|\bdr\b|\bcr\b|amount|no\./i.test(firstPipe.join(' ')) && !firstPipe.some(function(c) { return parseAmount_(c) !== null; });
  var header = hasHeader ? firstPipe : ['Date', 'Particulars', 'L.F.', 'Dr. (₹)', 'Cr. (₹)'];
  var n = header.length;
  var body = hasHeader ? lines.slice(1) : lines;
  var widths = getProfileWidths_('journal', n);
  var pIdx = 0;
  header.forEach(function(h, i) { if (/particular/i.test(h)) pIdx = i; });
  if (!/particular/i.test(header[pIdx])) pIdx = n >= 5 ? 1 : 0;
  var drIdx = n - 2, crIdx = n - 1;

  function td(content, align, extra) {
    return '<td style="' + DPP_TD_BASE_ + ' text-align: ' + align + ';' + (extra || '') + '">' + content + '</td>';
  }
  function emptyRowExcept(colIdx, html, extra) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(i === colIdx ? td(html, 'left', extra) : td('', 'left'));
    return out.join('');
  }

  var trs = [];
  body.forEach(function(raw) {
    if (raw.indexOf('|') === -1) {
      var t = raw.trim();
      if (/^\(?being\b/i.test(t)) {
        trs.push('<tr style="border-bottom: 1px solid #CFC3EA;">' + emptyRowExcept(pIdx, escapeHtml_(t), ' padding-left: ' + (2 + prof.narrationIndentMm) + 'mm; font-style: italic; color: #475569; font-size: 10pt;') + '</tr>');
      } else {
        trs.push('<tr><td colspan="' + n + '" style="' + DPP_TD_BASE_ + ' font-weight: 700; color: #1E0063;">' + escapeHtml_(t) + '</td></tr>');
      }
      return;
    }
    var c = splitPipesToWidth_(raw, n);
    var isTotal = /^total$/i.test(c[pIdx]) || /^total$/i.test(c[0]);
    var cells = c.map(function(val, i) {
      if (i === pIdx) {
        var p = val;
        var isCredit = /^to\s/i.test(p);
        var hasDr = /\bdr\.?\s*$/i.test(p);
        var text = escapeHtml_(hasDr ? p.replace(/\s*\bdr\.?\s*$/i, '') : p);
        var indent = 2 + (isCredit ? prof.toIndentMm : prof.drIndentMm);
        var drTag = hasDr ? '<span style="float: right; font-weight: 600; color: #1E0063; padding-left: 2mm;">Dr.</span>' : '';
        return td(drTag + text, 'left', ' padding-left: ' + indent + 'mm;' + (isTotal ? ' font-weight: 700;' : ''));
      }
      if (i === drIdx || i === crIdx) return td(escapeHtml_(val), 'right', ' white-space: nowrap;' + (isTotal ? ' font-weight: 700;' : ''));
      return td(escapeHtml_(val), 'center', ' font-size: 10pt;');
    }).join('');
    trs.push('<tr' + (isTotal ? ' style="' + DPP_TOTAL_ROW_ + '"' : '') + '>' + cells + '</tr>');
  });

  var ths = header.map(function(h, i) {
    var align = (i === drIdx || i === crIdx) ? 'right' : (i === pIdx ? 'left' : 'center');
    return '<th style="' + DPP_TH_STYLE_ + ' text-align: ' + align + ';">' + escapeHtml_(h) + '</th>';
  }).join('');

  return '<div class="content-card keep-together" data-kind="journal">' +
    dppTableTitleHtml_(blk.title || 'Journal Entries') +
    '<table style="' + DPP_TABLE_STYLE_ + '">' + colgroupFromWidths_(widths) +
      '<thead><tr>' + ths + '</tr></thead>' +
      '<tbody>' + trs.join('\n') + '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Routes a table to the renderer of its decided kind. Horizontal Balance Sheet
 * is drawn here; every other kind uses its own layout profile.
 */
function renderTableBlockHtml_(blk) {
  var lines = dppTableLines_(blk);
  if (lines.length === 0) return '';

  var kind = blk.kind;
  if (!kind) {
    var hdr = lines[0].indexOf('|') !== -1 ? splitPipesToWidth_(lines[0], 0) : [];
    kind = decideTableKind_(hdr, lines.slice(1), blk.title, '', null).kind;
  }
  if (kind === 'journal') return renderJournalBlockHtml_(blk);
  if (kind === 'ledger') return renderTAccountBlockHtml_(blk);
  if (kind === 'capital') return renderCapitalAccountBlockHtml_(blk);
  if (kind !== 'balance_sheet') return renderProfiledTableHtml_(blk, kind);

  // Horizontal Balance Sheet: Liabilities | Amount | Assets | Amount
  var header = splitPipesToWidth_(lines[0], 4);
  var leftItems = [], rightItems = [], leftTotal = null, rightTotal = null;
  for (var i = 1; i < lines.length; i++) {
    if (lines[i].indexOf('|') === -1) continue;
    var raw = splitPipesToWidth_(lines[i], 4, true);
    var cols = raw.map(function(x) { return x.trim(); });
    if (/total/i.test(cols[0]) || /total/i.test(cols[2])) {
      leftTotal = { desc: cols[0] || 'Total', amt: cols[1] };
      rightTotal = { desc: cols[2] || 'Total', amt: cols[3] };
      continue;
    }
    if (cols[0] || cols[1]) leftItems.push({ desc: cols[0], amt: cols[1], lvl: dppIndentLevel_(raw[0]) });
    if (cols[2] || cols[3]) rightItems.push({ desc: cols[2], amt: cols[3], lvl: Math.max(0, dppIndentLevel_(String(raw[2]).replace(/^ /, ''))) });
  }

  function cellPair(it, divider, bold) {
    var pad = 2 + ((it && it.lvl) ? it.lvl * 4 : 0);
    return '<td style="' + DPP_TD_BASE_ + ' text-align: left; padding-left: ' + pad + 'mm;' + (bold ? ' font-weight: 700;' : '') + '">' + (it && it.desc ? escapeHtml_(it.desc) : '&nbsp;') + '</td>' +
      '<td style="' + DPP_TD_BASE_ + ' text-align: right; white-space: nowrap;' + (divider ? ' border-right: 2px solid #7C30E0;' : '') + (bold ? ' font-weight: 700;' : '') + '">' + (it && it.amt ? escapeHtml_(it.amt) : '') + '</td>';
  }

  var trs = [];
  var maxRows = Math.max(leftItems.length, rightItems.length);
  for (var r = 0; r < maxRows; r++) {
    trs.push('<tr style="border-bottom: 1px solid #F0EAFB;">' + cellPair(leftItems[r], true, false) + cellPair(rightItems[r], false, false) + '</tr>');
  }
  if (leftTotal || rightTotal) {
    trs.push('<tr style="' + DPP_TOTAL_ROW_ + '">' + cellPair(leftTotal || { desc: 'Total' }, true, true) + cellPair(rightTotal || { desc: 'Total' }, false, true) + '</tr>');
  }

  var ths = header.map(function(c, cIdx) {
    var align = (cIdx === 1 || cIdx === 3) ? 'right' : 'left';
    var div = cIdx === 1 ? ' border-right: 2px solid #7C30E0;' : '';
    return '<th style="' + DPP_TH_STYLE_ + ' text-align: ' + align + ';' + div + '">' + escapeHtml_(c) + '</th>';
  }).join('');
  var contdNotice = blk.isContinuation ? '<div style="font-size: 9pt; font-weight: bold; color: #64748b; margin-bottom: 3px;">(Table Continued from previous page)</div>' : '';

  return '<div class="content-card keep-together" data-kind="balance_sheet">' +
    dppTableTitleHtml_(blk.title) +
    contdNotice +
    '<table style="' + DPP_TABLE_STYLE_ + '">' + colgroupFromWidths_(getProfileWidths_('balance_sheet', 4)) +
      '<thead><tr>' + ths + '</tr></thead>' +
      '<tbody>' + trs.join('\n') + '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Pure inline vector SVG generators for Economics diagrams
 */
function renderEconomicsSvgBlock_(templateName, caption) {
  templateName = String(templateName || "demand_shift").toLowerCase().trim();
  caption = caption || "Economic Analysis Diagram";

  var svgContent = "";
  if (templateName === "cost_curves" || templateName === "ac_mc") {
    svgContent = '<svg width="360" height="195" viewBox="0 0 360 195" style="background:transparent; font-family:-apple-system, sans-serif; margin:0 auto; display:block;">\n' +
      '<defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1E0063"/></marker></defs>\n' +
      '<line x1="60" y1="20" x2="60" y2="160" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr)" />\n' +
      '<line x1="60" y1="160" x2="330" y2="160" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr)" />\n' +
      '<text x="55" y="18" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Cost (₹)</text>\n' +
      '<text x="330" y="178" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Output (Units)</text>\n' +
      '<text x="48" y="172" font-size="10" font-weight="bold" fill="#64748b">O</text>\n' +
      '<path d="M 75 50 Q 160 135 290 105" stroke="#7C30E0" stroke-width="2.2" fill="none" />\n' +
      '<text x="295" y="108" font-size="11" font-weight="bold" fill="#7C30E0">AC</text>\n' +
      '<path d="M 85 135 Q 150 155 250 40" stroke="#1E0063" stroke-width="2.2" fill="none" />\n' +
      '<text x="255" y="42" font-size="11" font-weight="bold" fill="#1E0063">MC</text>\n' +
      '<circle cx="170" cy="115" r="3.5" fill="#F87800" />\n' +
      '<text x="165" y="130" font-size="9" font-weight="bold" fill="#F87800">MC cuts AC at min</text>\n' +
    '</svg>';
  } else if (templateName === "supply_shift") {
    // D: (90,50)-(290,150); S0: (90,150)-(310,40) → E0 (190,100); S1: (115,162.5)-(335,52.5) → E1 (215,112.5)
    svgContent = '<svg width="370" height="205" viewBox="0 0 370 205" style="background:transparent; font-family:-apple-system, sans-serif; margin:0 auto; display:block;">\n' +
      '<defs><marker id="arr-axis-s" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1E0063"/></marker>' +
      '<marker id="arr-orange-s" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#F87800"/></marker></defs>\n' +
      '<line x1="65" y1="20" x2="65" y2="170" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr-axis-s)" />\n' +
      '<line x1="65" y1="170" x2="350" y2="170" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr-axis-s)" />\n' +
      '<text x="60" y="18" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Price (₹)</text>\n' +
      '<text x="350" y="190" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Quantity (Units)</text>\n' +
      '<text x="52" y="182" font-size="10.5" font-weight="bold" fill="#64748b">O</text>\n' +
      '<line x1="65" y1="100" x2="190" y2="100" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<line x1="190" y1="100" x2="190" y2="170" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<text x="58" y="104" font-size="10" font-weight="bold" text-anchor="end" fill="#1E0063">P₀</text>\n' +
      '<text x="190" y="184" font-size="10" font-weight="bold" text-anchor="middle" fill="#1E0063">Q₀</text>\n' +
      '<line x1="65" y1="112.5" x2="215" y2="112.5" stroke="#F87800" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<line x1="215" y1="112.5" x2="215" y2="170" stroke="#F87800" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<text x="58" y="116.5" font-size="10" font-weight="bold" text-anchor="end" fill="#F87800">P₁</text>\n' +
      '<text x="215" y="184" font-size="10" font-weight="bold" text-anchor="middle" fill="#F87800">Q₁</text>\n' +
      '<line x1="90" y1="50" x2="290" y2="150" stroke="#1E0063" stroke-width="2.2" />\n' +
      '<text x="295" y="154" font-size="11.5" font-weight="bold" fill="#1E0063">D</text>\n' +
      '<line x1="90" y1="150" x2="310" y2="40" stroke="#64748b" stroke-width="1.8" stroke-dasharray="4,3" />\n' +
      '<text x="314" y="38" font-size="11.5" font-weight="bold" fill="#64748b">S₀</text>\n' +
      '<line x1="115" y1="162.5" x2="335" y2="52.5" stroke="#7C30E0" stroke-width="2.2" />\n' +
      '<text x="339" y="50" font-size="11.5" font-weight="bold" fill="#7C30E0">S₁</text>\n' +
      '<line x1="255" y1="70" x2="280" y2="70" stroke="#F87800" stroke-width="2" marker-end="url(#arr-orange-s)" />\n' +
      '<circle cx="190" cy="100" r="3.5" fill="#1E0063" />\n' +
      '<text x="176" y="95" font-size="10" font-weight="bold" fill="#1E0063">E₀</text>\n' +
      '<circle cx="215" cy="112.5" r="3.5" fill="#F87800" />\n' +
      '<text x="222" y="126" font-size="10" font-weight="bold" fill="#F87800">E₁</text>\n' +
    '</svg>';
  } else if (templateName === "ppc" || templateName === "ppf") {
    // Concave PPC from (65,40) to (300,170); A inside (under-utilisation), B on curve, C outside (unattainable).
    svgContent = '<svg width="370" height="205" viewBox="0 0 370 205" style="background:transparent; font-family:-apple-system, sans-serif; margin:0 auto; display:block;">\n' +
      '<defs><marker id="arr-axis-p" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1E0063"/></marker></defs>\n' +
      '<line x1="65" y1="20" x2="65" y2="170" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr-axis-p)" />\n' +
      '<line x1="65" y1="170" x2="350" y2="170" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr-axis-p)" />\n' +
      '<text x="60" y="18" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Good Y</text>\n' +
      '<text x="350" y="190" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Good X</text>\n' +
      '<text x="52" y="182" font-size="10.5" font-weight="bold" fill="#64748b">O</text>\n' +
      '<path d="M 65 40 Q 265 45 300 170" stroke="#7C30E0" stroke-width="2.4" fill="none" />\n' +
      '<text x="285" y="78" font-size="11" font-weight="bold" fill="#7C30E0">PPC</text>\n' +
      '<circle cx="150" cy="120" r="3.5" fill="#64748b" /><text x="140" y="135" font-size="10" font-weight="bold" fill="#64748b">A</text>\n' +
      '<circle cx="224" cy="75" r="3.5" fill="#1E0063" /><text x="208" y="70" font-size="10" font-weight="bold" fill="#1E0063">B</text>\n' +
      '<circle cx="290" cy="45" r="3.5" fill="#F87800" /><text x="297" y="44" font-size="10" font-weight="bold" fill="#F87800">C</text>\n' +
    '</svg>';
  } else {
    // Demand Shift: exact line intersection coordinates & markers (PA4)
    // S line: (90, 150) to (310, 40)
    // D0 line: (90, 50) to (290, 150) -> E0 = (190, 100)
    // D1 line: (115, 37.5) to (315, 137.5) -> E1 = (215, 87.5)
    svgContent = '<svg width="370" height="205" viewBox="0 0 370 205" style="background:transparent; font-family:-apple-system, sans-serif; margin:0 auto; display:block;">\n' +
      '<defs>\n' +
      '  <marker id="arr-axis" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1E0063"/></marker>\n' +
      '  <marker id="arr-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#F87800"/></marker>\n' +
      '</defs>\n' +
      '<line x1="65" y1="20" x2="65" y2="170" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr-axis)" />\n' +
      '<line x1="65" y1="170" x2="350" y2="170" stroke="#1E0063" stroke-width="1.8" marker-end="url(#arr-axis)" />\n' +
      '<text x="60" y="18" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Price (₹)</text>\n' +
      '<text x="350" y="190" font-size="10.5" font-weight="bold" text-anchor="end" fill="#1E0063">Quantity (Units)</text>\n' +
      '<text x="52" y="182" font-size="10.5" font-weight="bold" fill="#64748b">O</text>\n' +
      '<line x1="65" y1="100" x2="190" y2="100" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<line x1="190" y1="100" x2="190" y2="170" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<text x="58" y="104" font-size="10" font-weight="bold" text-anchor="end" fill="#1E0063">P₀</text>\n' +
      '<text x="190" y="184" font-size="10" font-weight="bold" text-anchor="middle" fill="#1E0063">Q₀</text>\n' +
      '<line x1="65" y1="87.5" x2="215" y2="87.5" stroke="#F87800" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<line x1="215" y1="87.5" x2="215" y2="170" stroke="#F87800" stroke-width="1.2" stroke-dasharray="3,3" />\n' +
      '<text x="58" y="91.5" font-size="10" font-weight="bold" text-anchor="end" fill="#F87800">P₁</text>\n' +
      '<text x="215" y="184" font-size="10" font-weight="bold" text-anchor="middle" fill="#F87800">Q₁</text>\n' +
      '<line x1="90" y1="150" x2="310" y2="40" stroke="#1E0063" stroke-width="2.2" />\n' +
      '<text x="315" y="38" font-size="11.5" font-weight="bold" fill="#1E0063">S</text>\n' +
      '<line x1="90" y1="50" x2="290" y2="150" stroke="#64748b" stroke-width="1.8" stroke-dasharray="4,3" />\n' +
      '<text x="295" y="154" font-size="11.5" font-weight="bold" fill="#64748b">D₀</text>\n' +
      '<line x1="115" y1="37.5" x2="315" y2="137.5" stroke="#7C30E0" stroke-width="2.2" />\n' +
      '<text x="320" y="142" font-size="11.5" font-weight="bold" fill="#7C30E0">D₁</text>\n' +
      '<line x1="140" y1="75" x2="165" y2="75" stroke="#F87800" stroke-width="2" marker-end="url(#arr-orange)" />\n' +
      '<circle cx="190" cy="100" r="3.5" fill="#1E0063" />\n' +
      '<text x="175" y="96" font-size="10" font-weight="bold" fill="#1E0063">E₀</text>\n' +
      '<circle cx="215" cy="87.5" r="3.5" fill="#F87800" />\n' +
      '<text x="225" y="84" font-size="10" font-weight="bold" fill="#F87800">E₁</text>\n' +
    '</svg>';
  }

  return '<div class="content-card keep-together" style="text-align: center;">\n' +
    '<div style="font-size: 10.5pt; font-weight: 700; color: #1E0063; margin-bottom: 6px; letter-spacing: 0.3px;">Figure: ' + escapeHtml_(caption) + '</div>\n' +
    svgContent + '\n' +
  '</div>';
}

/**
 * Renders LaTeX / Stats formula via pure stacked fraction CSS
 */
function renderStatisticsFormulaBlock_(formulaRaw, label) {
  label = label || "Karl Pearson's Coefficient of Correlation (r)";
  var raw = String(formulaRaw || "").trim();

  // Parse r = \frac{\sum xy}{\sqrt{\sum x^2 \cdot \sum y^2}}
  var fracMatch = raw.match(/r\s*=\s*\\frac\{([^}]+)\}\s*\{([\s\S]*)\}/i);
  var innerHtml = "";
  if (fracMatch) {
    var num = fracMatch[1].replace(/\\sum/g, "Σ").replace(/\\cdot/g, " · ").trim();
    var den = fracMatch[2].trim();
    var radicand = den;
    if (/^\\sqrt\{/i.test(den)) {
      radicand = den.replace(/^\\sqrt\{/i, "").replace(/\}$/, "");
    }
    radicand = radicand.replace(/\\sum/g, "Σ").replace(/x\^2/g, "x²").replace(/y\^2/g, "y²").replace(/\\cdot/g, " · ").trim();

    var denHtml = '<span style="display:inline-flex; align-items:baseline;"><span style="font-size:1.25em; line-height:1; vertical-align:-1px;">&radic;</span><span style="border-top:1.5px solid currentColor; padding-top:1px; margin-left:-1px; display:inline-block;">' + escapeHtml_(radicand) + '</span></span>';

    innerHtml = '<div style="display: inline-flex; align-items: center; gap: 8px; font-size: 12pt; font-weight: 600; color: #1E0063;">' +
      '<span>r =</span>' +
      '<span class="frac" style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; padding: 0 4px;">' +
        '<span class="num" style="border-bottom: 1.5px solid #1E0063; padding-bottom: 2px;">' + escapeHtml_(num) + '</span>' +
        '<span class="den" style="padding-top: 2px;">' + denHtml + '</span>' +
      '</span>' +
    '</div>';
  } else {
    var cleaned = raw
      .replace(/\\frac\{([^}]+)\}\s*\{([^}]+)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
      .replace(/\\cdot/g, " · ")
      .replace(/x\^2/g, "x²").replace(/y\^2/g, "y²")
      .replace(/\\sum/g, "Σ").replace(/\\sigma/g, "σ")
      .replace(/\\sqrt\{([^}]+)\}/g, '<span style="display:inline-flex; align-items:baseline;"><span style="font-size:1.2em;">&radic;</span><span style="border-top:1.5px solid currentColor; padding-top:1px; margin-left:-1px;">$1</span></span>')
      .replace(/√\(([^)]+)\)/g, '<span style="display:inline-flex; align-items:baseline;"><span style="font-size:1.2em;">&radic;</span><span style="border-top:1.5px solid currentColor; padding-top:1px; margin-left:-1px;">$1</span></span>');
    innerHtml = '<div style="font-size: 12pt; line-height: 1.6; color: #1E0063;">' + cleaned + '</div>';
  }

  return '<div class="content-card keep-together" style="border-left: 1.2mm solid #7C30E0; text-align: center; padding: 3mm 4mm;">\n' +
    '<div style="font-size: 10pt; font-weight: 700; color: #1E0063; text-transform: uppercase; margin-bottom: 3mm; letter-spacing: 0.4px;">' + escapeHtml_(label) + '</div>\n' +
    innerHtml + '\n' +
  '</div>';
}

function renderCalculationBlock_(text, title) {
  title = title || "STEP-BY-STEP CALCULATION";
  var rawLines = String(text || "").split("\n");
  var renderedHtml = [];

  for (var i = 0; i < rawLines.length; i++) {
    var line = rawLines[i].trim();
    if (!line) continue;
    if (/^Step-by-step Calculation:?$/i.test(line)) continue;

    var stepMatch = line.match(/^(\d+\.\s+[^:]+:?)/);
    if (stepMatch) {
      var stepHeading = stepMatch[1];
      var rest = line.substring(stepHeading.length).trim();
      var cleanHeading = formatMathSnippet_(stepHeading);
      var lineOut = '<div style="font-weight: 700; color: #1E0063; margin-top: 2.2mm; margin-bottom: 0.8mm; font-size: 10.5pt;">' + cleanHeading + '</div>';
      if (rest) {
        lineOut += '<div style="margin-left: 5mm; margin-bottom: 0.8mm; color: #1B1530; font-size: 10.5pt;">' + formatMathSnippet_(rest) + '</div>';
      }
      renderedHtml.push(lineOut);
      continue;
    }

    if (/^[•\-\*]\s*/.test(line)) {
      var bText = line.replace(/^[•\-\*]\s*/, "");
      renderedHtml.push('<div style="margin-left: 5mm; margin-bottom: 0.8mm; color: #1B1530; font-size: 10.5pt;">• ' + formatMathSnippet_(bText) + '</div>');
      continue;
    }

    var interpMatch = line.match(/^Interpretation:\s*(.*)/i);
    if (interpMatch) {
      renderedHtml.push('<div style="margin-top: 2.5mm; font-weight: 500; color: #1E0063; font-size: 10.5pt; padding: 1.5mm 2.5mm; background: #F4EEFF; border-radius: 1.5mm; border-left: 0.8mm solid #7C30E0;"><span style="font-weight: 700; color: #7C30E0;">Interpretation: </span>' + escapeHtml_(interpMatch[1]) + '</div>');
      continue;
    }

    renderedHtml.push('<div style="margin-left: 5mm; margin-bottom: 0.8mm; color: #1B1530; font-size: 10.5pt; font-family: inherit;">' + formatMathSnippet_(line) + '</div>');
  }

  return '<div class="content-card keep-together" style="border-left: 1.2mm solid #7C30E0; text-align: left; padding: 3mm 4mm;">\n' +
    '<div style="font-size: 10pt; font-weight: 700; color: #1E0063; text-transform: uppercase; margin-bottom: 2mm; letter-spacing: 0.4px;">' + escapeHtml_(title) + '</div>\n' +
    renderedHtml.join("\n") + "\n" +
  '</div>';
}

function formatMathSnippet_(str) {
  if (!str) return "";
  var s = String(str);
  s = s.replace(/\\cdot/g, " · ");
  s = s.replace(/x\^2/g, "x²").replace(/y\^2/g, "y²");
  s = s.replace(/\\sum/g, "Σ").replace(/\\sigma/g, "σ");
  s = s.replace(/√\(\s*([\d,]+)\s*\)/g, "√$1");
  s = s.replace(/\\sqrt\{\s*([\d,]+)\s*\}/g, "√$1");
  return escapeHtml_(s);
}

/**
 * Renders Business Studies vertical step flowchart with directional connectors
 */
function renderBstFlowchartBlock_(stepsText, title) {
  var steps = String(stepsText || "").split(/->|\n/).map(function(s) { return s.trim(); }).filter(Boolean);
  var headerTitle = title || "Staffing Process Flowchart";
  var items = steps.map(function(s, idx) {
    var arrow = (idx < steps.length - 1) ? '<div style="font-size: 13px; color: #7C30E0; font-weight: bold; margin: 1px 0;">↓</div>' : "";
    return '<div style="background: #F4EEFF; border: 0.3mm solid #E6DDF7; border-radius: 2.5mm; padding: 5px 10px; margin: 2px 0; font-weight: 700; font-size: 10.5pt; color: #1E0063; display: inline-block; min-width: 240px; box-shadow: 0 1px 2px rgba(30, 0, 99, 0.05);">' + escapeHtml_(s) + '</div>' + arrow;
  }).join("");

  return '<div class="content-card keep-together" style="text-align: center;">' +
    '<div style="font-size: 10.5pt; font-weight: 700; color: #1E0063; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.4px;">' + escapeHtml_(headerTitle) + '</div>' +
    items +
  '</div>';
}

/**
 * Renders Business Studies Case Study callout card
 */
function renderCaseStudyCardBlock_(title, body) {
  return '<div class="content-card keep-together" style="border-left: 1.2mm solid #7C30E0;">\n' +
    '<div style="font-size: 10.5pt; font-weight: bold; color: #7C30E0; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(title || 'Case Scenario') + '</div>\n' +
    '<div style="font-size: 11pt; line-height: 1.48; color: #1B1530; font-style: italic;">' + escapeHtml_(body) + '</div>\n' +
  '</div>';
}

/**
 * D2 Multi-Level Hierarchy Engine for Answer Content
 * Level 1: 1, 2, 3
 * Level 2: A, B, C
 * Level 3: 1A, 1B, 1C
 * Level 4: I, II, III
 * Level 5: a, b, c
 * Level 6: i, ii, iii
 * 5 mm indent per level, hanging indent.
 */
function formatAnswerContentWithD2Hierarchy_(text) {
  var lines = String(text || '').trim().split('\n');
  var out = [];
  var level2Counter = 0;
  var inLevel1 = false;

  for (var i = 0; i < lines.length; i++) {
    var rawLine = lines[i];
    var trimmed = rawLine.trim();
    if (!trimmed) continue;

    var leadingSpaces = rawLine.search(/\S|$/);

    // Section headings (e.g. Working Notes:, Step-by-step Calculation:, etc.) - never numbered
    if (/^(Working Notes|Step-by-step Calculation|Explanation of Steps|Chain of Effects|Sequential Steps|Interpretation|Business Case Scenario)\b/i.test(trimmed) && !/^\d+\./.test(trimmed)) {
      level2Counter = 0;
      inLevel1 = false;
      out.push('<div style="font-weight: 700; margin-top: 3.5mm; margin-bottom: 2mm; color: #1E0063; font-size: 11pt; letter-spacing: 0.3px;">' + escapeHtml_(trimmed) + '</div>');
      continue;
    }

    // CBSE marks breakdown lines (e.g. '• 1.0 Mark: ...' or '1.0 Mark: ...') - never renumber
    if (/^[•\-\s]*(\d+(\.\d+)?\s*Marks?:)/i.test(trimmed)) {
      out.push('<div style="margin-left: 4mm; margin-bottom: 1.5mm; font-size: 10pt; color: #1E0063; line-height: 1.45;">' + escapeHtml_(trimmed) + '</div>');
      continue;
    }

    // Legal / accounting citations like "Section 52(2)" - never renumber
    if (/^Section\s+\d+/i.test(trimmed)) {
      out.push('<div style="margin-bottom: 2mm; font-size: 11pt; line-height: 1.48; color: #1B1530;">' + escapeHtml_(trimmed) + '</div>');
      continue;
    }

    // Level 1: 1, 2, 3
    var mLvl1 = trimmed.match(/^(\d+)[\.\)]\s+(.*)/);
    if (mLvl1 && leadingSpaces < 2) {
      var num = mLvl1[1];
      var content1 = mLvl1[2];
      level2Counter = 0;
      inLevel1 = true;
      var formatted1 = escapeHtml_(content1).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div class="d2-item d2-lvl-1" style="margin-left: 0mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 2mm; font-size: 11pt; line-height: 1.48; color: #1B1530;">' +
        '<span style="font-weight: 700; color: #1E0063;">' + num + '.</span> ' + formatted1 + '</div>');
      continue;
    }

    // Level 2: A, B, C OR indented bullets under Level 1
    var mLvl2 = trimmed.match(/^([A-Z])[\.\)]\s+(.*)/);
    var mBullet = (leadingSpaces >= 2 || inLevel1) ? trimmed.match(/^[•\-\*]\s+(.*)/) : null;

    if (mLvl2) {
      var letter = mLvl2[1];
      var content2 = mLvl2[2];
      level2Counter = letter.charCodeAt(0) - 65 + 1;
      var formatted2 = escapeHtml_(content2).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div class="d2-item d2-lvl-2" style="margin-left: 5mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 1.5mm; font-size: 10.5pt; line-height: 1.45; color: #1B1530;">' +
        '<span style="font-weight: 700; color: #7C30E0;">' + letter + '.</span> ' + formatted2 + '</div>');
      continue;
    } else if (mBullet && inLevel1) {
      var letterAuto = String.fromCharCode(65 + level2Counter);
      level2Counter++;
      var contentB = mBullet[1];
      var formattedB = escapeHtml_(contentB).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div class="d2-item d2-lvl-2" style="margin-left: 5mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 1.5mm; font-size: 10.5pt; line-height: 1.45; color: #1B1530;">' +
        '<span style="font-weight: 700; color: #7C30E0;">' + letterAuto + '.</span> ' + formattedB + '</div>');
      continue;
    }

    // Level 3: 1A, 1B, 1C
    var mLvl3 = trimmed.match(/^(\d+[A-Z])[\.\)]\s+(.*)/);
    if (mLvl3) {
      var tag3 = mLvl3[1];
      var content3 = mLvl3[2];
      var formatted3 = escapeHtml_(content3).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div class="d2-item d2-lvl-3" style="margin-left: 10mm; padding-left: 7.5mm; text-indent: -7.5mm; margin-bottom: 1.5mm; font-size: 10.5pt; line-height: 1.45; color: #1B1530;">' +
        '<span style="font-weight: 700; color: #7C30E0;">' + tag3 + '.</span> ' + formatted3 + '</div>');
      continue;
    }

    // Level 4: I, II, III
    var mLvl4 = trimmed.match(/^(I|II|III|IV|V|VI|VII|VIII|IX|X)[\.\)]\s+(.*)/);
    if (mLvl4) {
      var tag4 = mLvl4[1];
      var content4 = mLvl4[2];
      var formatted4 = escapeHtml_(content4).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div class="d2-item d2-lvl-4" style="margin-left: 15mm; padding-left: 7mm; text-indent: -7mm; margin-bottom: 1.5mm; font-size: 10pt; line-height: 1.45; color: #1B1530;">' +
        '<span style="font-weight: 700; color: #F87800;">' + tag4 + '.</span> ' + formatted4 + '</div>');
      continue;
    }

    // Level 5: a, b, c (excluding roman numerals)
    var mLvl5 = trimmed.match(/^([a-z])[\\.\)]\s+(.*)/);
    if (mLvl5 && ['i', 'v', 'x'].indexOf(mLvl5[1]) === -1) {
      var tag5 = mLvl5[1];
      var content5 = mLvl5[2];
      var formatted5 = escapeHtml_(content5).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div class="d2-item d2-lvl-5" style="margin-left: 20mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 1.5mm; font-size: 10pt; line-height: 1.45; color: #1B1530;">' +
        '<span style="font-weight: 700; color: #1E0063;">' + tag5 + '.</span> ' + formatted5 + '</div>');
      continue;
    }

    // Level 6: i, ii, iii
    var mLvl6 = trimmed.match(/^(i|ii|iii|iv|v|vi|vii|viii|ix|x)[\\.\)]\s+(.*)/);
    if (mLvl6) {
      var tag6 = mLvl6[1];
      var content6 = mLvl6[2];
      var formatted6 = escapeHtml_(content6).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div class="d2-item d2-lvl-6" style="margin-left: 25mm; padding-left: 6mm; text-indent: -6mm; margin-bottom: 1.5mm; font-size: 9.5pt; line-height: 1.45; color: #1B1530;">' +
        '<span style="font-weight: 700; color: #7C30E0;">' + tag6 + '.</span> ' + formatted6 + '</div>');
      continue;
    }

    // Indented calculation or equation under active level
    if (leadingSpaces >= 2 && inLevel1) {
      out.push('<div style="margin-left: 6mm; margin-bottom: 1.5mm; font-size: 10.5pt; line-height: 1.45; color: #334155;">' + escapeHtml_(trimmed) + '</div>');
    } else {
      var fmtGeneric = escapeHtml_(trimmed).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
      out.push('<div style="margin-bottom: 2mm; font-size: 11pt; line-height: 1.48; color: #1B1530;">' + fmtGeneric + '</div>');
    }
  }

  return out.join('\n');
}

/**
 * Renders generic text with headings and list markers
 */
function renderGenericTextBlock_(text, blk) {
  if (!text && (!blk || !blk.isFirstQuestionBlock)) return '';
  var isAnswer = blk && blk.isAnswer;
  if (isAnswer) {
    var d2Content = formatAnswerContentWithD2Hierarchy_(text);
    return '<div class="content-card keep-together">' + d2Content + '</div>';
  }

  var lines = String(text || '').trim().split('\n');
  var out = [];

  if (blk && blk.isFirstQuestionBlock) {
    var marks = blk.marks || 6;
    out.push('<table style="width: 100%; border-collapse: collapse; margin-bottom: 2.5mm;">' +
      '<tr>' +
        '<td style="vertical-align: middle; text-align: left;">' +
          '<span style="display: inline-block; width: 7.5mm; height: 7.5mm; border-radius: 2mm; background: #F1E8FF; color: #7C30E0; font-weight: 800; font-size: 11pt; text-align: center; line-height: 7.5mm;">Q1</span>' +
        '</td>' +
        '<td style="vertical-align: middle; text-align: right;">' +
          '<span style="display: inline-block; color: #F87800; font-weight: 700; border: 0.3mm solid #FFD2A8; border-radius: 3mm; padding: 0.5mm 3mm; font-size: 9.5pt;">' + marks + ' Marks</span>' +
        '</td>' +
      '</tr>' +
    '</table>');
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (!line.trim()) continue;
    var formatted = escapeHtml_(line).replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    if (/^\s*([0-9]+\.|\-|\•)\s+/.test(line)) {
      out.push('<div style="padding-left: 12px; margin-bottom: 4px; font-size: 11pt; line-height: 1.48; color: #0f172a;">' + formatted + '</div>');
    } else if (line.indexOf('Adjustments:') === 0 || line.indexOf('Instructions:') === 0 || line.indexOf('Working Notes:') === 0) {
      out.push('<div style="font-weight: bold; margin-top: 6px; margin-bottom: 4px; color: #1E0063; font-size: 11pt; letter-spacing: 0.3px;">' + formatted + '</div>');
    } else {
      out.push('<div style="margin-bottom: 6px; font-size: 11.5pt; line-height: 1.48; color: #0f172a;">' + formatted + '</div>');
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
    // Strip emojis to guarantee clean PDF rendering without missing glyphs
    l = l.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu, '').trim();
    if (!l) return '';
    if (!l.startsWith('•') && !l.startsWith('-') && !/^\d+\./.test(l)) {
      l = '• ' + l;
    }
    var escaped = escapeHtml_(l);
    return '<div style="margin-bottom: 2px;">' + escaped + '</div>';
  }).filter(Boolean).join('\n');
}

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
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!dateVal) {
    return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'd MMM');
  }
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, 'Asia/Kolkata', 'd MMM');
  }
  var s = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    var parts = s.split('-');
    var day = parseInt(parts[2], 10);
    var monIdx = parseInt(parts[1], 10) - 1;
    return day + ' ' + (monthNames[monIdx] || 'Nov');
  }
  var m = s.match(/^(\d{1,2})[-/ ]([a-zA-Z]{3})/);
  if (m) {
    var day = parseInt(m[1], 10);
    var monStr = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
    return day + ' ' + monStr;
  }
  var mSlash = s.match(/^(\d{1,2})[-/ ](\d{1,2})/);
  if (mSlash) {
    var day = parseInt(mSlash[1], 10);
    var monIdx = parseInt(mSlash[2], 10) - 1;
    return day + ' ' + (monthNames[monIdx] || 'Nov');
  }
  if (/^\d{1,2}\s+[a-zA-Z]{3}$/.test(s)) {
    return s;
  }
  return '15 Nov';
}

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
    bypassCache: true,
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
    bypassCache: true,
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
 * Master Test Runner: Generates DPP Question & Model Answer PDFs for Class 11 and Class 12
 * @return {Object}
 */
function testRunDppBothClasses() {
  Logger.log('🚀 Starting DPP Test Run for Class 11 & Class 12 with Model Answers...');
  
  var q11 = testGenerateQuestionPdf(11);
  Logger.log('📄 [Class 11 Question PDF]: ' + (q11 ? q11.driveUrl : 'FAILED'));
  
  var a11 = testGenerateAnswerPdf(11);
  Logger.log('📄 [Class 11 Model Answer PDF]: ' + (a11 ? a11.driveUrl : 'FAILED'));

  var q12 = testGenerateQuestionPdf(12);
  Logger.log('📄 [Class 12 Question PDF]: ' + (q12 ? q12.driveUrl : 'FAILED'));
  
  var a12 = testGenerateAnswerPdf(12);
  Logger.log('📄 [Class 12 Model Answer PDF]: ' + (a12 ? a12.driveUrl : 'FAILED'));

  var summary = {
    ok: true,
    class11: {
      question: q11,
      answer: a11
    },
    class12: {
      question: q12,
      answer: a12
    },
    timestamp: getKolkataTimestamp()
  };

  Logger.log('✅ DPP Test Run Complete: ' + JSON.stringify(summary));
  return summary;
}

/**
 * Test 1: Accountancy Multi-Page Model Answer PDF (Reval, Capital, Balance Sheet, Notes)
 */
function testGenerateAccountancyMultiPagePdf(classLevel) {
  classLevel = Number(classLevel) || 12;
  var todayStr = getKolkataDate();

  var result = createAnswerPdfFromTemplate_({
    bypassCache: true,
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
    bypassCache: true,
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
    bypassCache: true,
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
    bypassCache: true,
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
          '#COMPUTATION:Bank Reconciliation Statement as on 31st March 2026\n' +
          'Particulars | Plus Items (₹) | Minus Items (₹)\n' +
          'Debit balance as per Cash Book | 45,000 |\n' +
          'Add: Cheques issued but not presented (18,000 - 11,000) | 7,000 |\n' +
          'Add: Bank Interest directly credited by bank | 800 |\n' +
          'Less: Cheques deposited but not credited by bank | | 4,500\n' +
          'Less: Bank charges debited by bank | | 250\n' +
          'Total | 52,800 | 4,750\n' +
          'Credit (Favourable) Balance as per Pass Book (52,800 - 4,750) | 48,050 |\n' +
          '#ENDCOMPUTATION',
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
          'Opening Stock: ₹30,000 | Purchases: ₹1,40,000 | Sales: ₹2,50,000 | Wages: ₹15,000 | Salaries: ₹24,000 | Debtors: ₹60,000 | Creditors: ₹35,000 | Capital: ₹1,00,000 | Machinery: ₹50,000 | Cash at Bank: ₹66,000.\n' +
          'Adjustments:\n' +
          '1. Closing Stock valued at ₹42,000.\n' +
          '2. Outstanding Wages ₹3,000 and Prepaid Salaries ₹2,000.\n' +
          '3. Provide Depreciation on Machinery @ 10% p.a.\n' +
          '4. Create Provision for Doubtful Debts @ 5% on Debtors.',
        marks: 6,
        modelAnswer:
          '#TACCOUNT:Trading and Profit & Loss Account for the year ended 31st March 2026\n' +
          'Particulars | Amount (₹) | Particulars | Amount (₹)\n' +
          'To Opening Stock | 30,000 | By Sales | 2,50,000\n' +
          'To Purchases | 1,40,000 | By Closing Stock | 42,000\n' +
          'To Wages (15,000 + 3,000 O/s) | 18,000 | |\n' +
          'To Gross Profit c/d | 1,04,000 | |\n' +
          'Total | 2,92,000 | Total | 2,92,000\n' +
          'To Salaries (24,000 - 2,000 Ppd) | 22,000 | By Gross Profit b/d | 1,04,000\n' +
          'To Dep. on Machinery (10% of 50k) | 5,000 | |\n' +
          'To Prov. for Doubtful Debts (5%) | 3,000 | |\n' +
          'To Net Profit c/d | 74,000 | |\n' +
          'Total | 1,04,000 | Total | 1,04,000\n' +
          '#ENDTACCOUNT\n' +
          '\n' +
          '#BALANCESHEET:Balance Sheet as at 31st March 2026\n' +
          'Liabilities | Amount (₹) | Assets | Amount (₹)\n' +
          'Capital: 1,00,000 | | Machinery (50k - 5k Dep) | 45,000\n' +
          '  Add: Net Profit: 74,000 | 1,74,000 | Closing Stock | 42,000\n' +
          'Creditors | 35,000 | Debtors (60k - 3k PDD) | 57,000\n' +
          'Outstanding Wages | 3,000 | Prepaid Salaries | 2,000\n' +
          ' | | Cash at Bank | 66,000\n' +
          'TOTAL LIABILITIES | 2,12,000 | TOTAL ASSETS | 2,12,000\n' +
          '#ENDBALANCESHEET',
        // Content fix (2026-11-15): Cash at Bank was ₹16,000, which left the Trial Balance
        // short by ₹50,000 (Dr 3,35,000 vs Cr 3,85,000). ₹66,000 makes TB agree at ₹3,85,000
        // and the Balance Sheet tally at ₹2,12,000; Trading and P&L figures are unchanged.
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
          '#TACCOUNT:Commercial Vehicle Account\n' +
          'Date | Particulars | Amount (₹) | Date | Particulars | Amount (₹)\n' +
          '01-Apr-23 | To Bank A/c | 6,00,000 | 31-Mar-24 | By Depreciation A/c | 60,000\n' +
          ' | | | 31-Mar-24 | By Balance c/d | 5,40,000\n' +
          ' | Total | 6,00,000 | | Total | 6,00,000\n' +
          '01-Apr-24 | To Balance b/d | 5,40,000 | 31-Mar-25 | By Depreciation A/c | 60,000\n' +
          ' | | | 31-Mar-25 | By Balance c/d | 4,80,000\n' +
          ' | Total | 5,40,000 | | Total | 5,40,000\n' +
          '01-Apr-25 | To Balance b/d | 4,80,000 | 01-Oct-25 | By Dep. A/c (6 mos) | 30,000\n' +
          ' | | | 01-Oct-25 | By Bank A/c (Sale) | 4,20,000\n' +
          ' | | | 01-Oct-25 | By Profit & Loss (Loss) | 30,000\n' +
          ' | Total | 4,80,000 | | Total | 4,80,000\n' +
          '#ENDTACCOUNT',
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
          '#JOURNAL:Journal Proper (Rectifying Entries)\n' +
          'No. | Particulars | L.F. | Debit (₹) | Credit (₹)\n' +
          '1. | Sales A/c Dr. | | 4,000 |\n' +
          ' | To Suspense A/c | | | 4,000\n' +
          '(Being overcasting of Sales Book rectified)\n' +
          '2. | Furniture A/c Dr. | | 9,000 |\n' +
          ' | To Purchases A/c | | | 9,000\n' +
          '(Being purchase of furniture wrongly debited to purchases rectified)\n' +
          '3. | Sohan A/c Dr. | | 5,500 |\n' +
          ' | To Mohan A/c | | | 5,500\n' +
          '(Being cash received from Mohan wrongly credited to Sohan rectified)\n' +
          '4. | Supplier\'s (Creditor\'s) A/c Dr. | | 4,800 |\n' +
          ' | To Returns Inward A/c | | | 2,400\n' +
          ' | To Returns Outward A/c | | | 2,400\n' +
          '(Being goods returned to supplier wrongly entered in Returns Inward Book, now rectified)\n' +
          '5. | Repairs A/c Dr. | | 1,800 |\n' +
          ' | To Machinery A/c | | | 1,800\n' +
          '(Being revenue repairs wrongly capitalized to machinery rectified)\n' +
          '#ENDJOURNAL',
        // Content fix (2026-11-15): entry 4 used Returns Inward Dr + Suspense Dr. The error is
        // two-sided (Returns Inward debited and supplier credited by ₹2,400 instead of the reverse),
        // so it is rectified by Supplier Dr ₹4,800 without Suspense.
        rubric:
          '• 1 Mark for each accurate rectifying entry with appropriate account heads and narrations',
        traps:
          '⚠️ Suspense account is only used for ONE-SIDED errors (error 1). Errors 2, 3, 4 and 5 are two-sided.\n' +
          '⚠️ Error 4: the supplier was credited instead of debited, so debit the supplier with DOUBLE the amount (₹4,800).'
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
        '#JOURNAL:Journal of Gyan Ltd.\n' +
        'Date | Particulars | L.F. | Debit (₹) | Credit (₹)\n' +
        ' | Equity Share Capital A/c (500 x 10) Dr. | | 5,000 |\n' +
        ' | To Share First Call A/c (500 x 2) | | | 1,000\n' +
        ' | To Share Final Call A/c (500 x 3) | | | 1,500\n' +
        ' | To Share Forfeiture A/c (500 x 5) | | | 2,500\n' +
        '(Being 500 shares forfeited for non-payment of calls)\n' +
        ' | Bank A/c (300 x 8) Dr. | | 2,400 |\n' +
        ' | Share Forfeiture A/c (300 x 2) Dr. | | 600 |\n' +
        ' | To Equity Share Capital A/c (300 x 10) | | | 3,000\n' +
        '(Being 300 forfeited shares reissued @ ₹8 per share fully paid-up)\n' +
        ' | Share Forfeiture A/c (300 x 3) Dr. | | 900 |\n' +
        ' | To Capital Reserve A/c | | | 900\n' +
        '(Being net gain on reissue of 300 shares transferred to Capital Reserve)\n' +
        '#ENDJOURNAL',
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
        '#TACCOUNT:Revaluation Account\n' +
        'Particulars | Amount (₹) | Particulars | Amount (₹)\n' +
        'To Provision for Doubtful Debts | 4,000 | By Stock A/c (Appr.) | 10,000\n' +
        'To Machinery A/c (10% of 1,40,000) | 14,000 | By Revaluation Loss c/d: |\n' +
        ' | |   Deepak (3/5) = 4,800 |\n' +
        ' | |   Alok (2/5) = 3,200 | 8,000\n' +
        'Total | 18,000 | Total | 18,000\n' +
        '#ENDTACCOUNT\n' +
        '\n' +
        '#CAPITAL:Partners\' Capital Accounts\n' +
        'Particulars | Deepak (₹) | Alok (₹) | Rohit (₹) | Particulars | Deepak (₹) | Alok (₹) | Rohit (₹)\n' +
        'To Revaluation Loss | 4,800 | 3,200 | - | By Balance b/d | 1,80,000 | 1,20,000 | -\n' +
        'To Balance c/d | 2,17,200 | 1,44,800 | 1,00,000 | By Gen. Reserve | 24,000 | 16,000 | -\n' +
        '| | | | By Prem. for GW | 18,000 | 12,000 | -\n' +
        '| | | | By Bank A/c | - | - | 1,00,000\n' +
        'Total | 2,22,000 | 1,48,000 | 1,00,000 | Total | 2,22,000 | 1,48,000 | 1,00,000\n' +
        '#ENDCAPITAL',
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
        '#TACCOUNT:Profit and Loss Appropriation Account for the year ended 31-Mar-2026\n' +
        'Particulars | Amount (₹) | Particulars | Amount (₹)\n' +
        'To Interest on Capital: | | By Net Profit b/d | 2,40,000\n' +
        '  A (6% on 5,00,000) = 30,000 | | |\n' +
        '  B (6% on 3,00,000) = 18,000 | 48,000 | |\n' +
        'To Partner Salary (B) | 60,000 | |\n' +
        'To Divisible Profit transferred to: | | |\n' +
        '  A Capital A/c (3/5) = 79,200 | | |\n' +
        '  B Capital A/c (2/5) = 52,800 | 1,32,000 | |\n' +
        'TOTAL | 2,40,000 | TOTAL | 2,40,000\n' +
        '#ENDTACCOUNT\n' +
        '\n' +
        '#CAPITAL:Partners\' Capital Accounts (Fluctuating)\n' +
        'Particulars | A (₹) | B (₹) | Particulars | A (₹) | B (₹)\n' +
        'To Balance c/d | 6,09,200 | 4,30,800 | By Balance b/d | 5,00,000 | 3,00,000\n' +
        '| | | By Interest on Capital | 30,000 | 18,000\n' +
        '| | | By Salary | - | 60,000\n' +
        '| | | By P&L Appropriation A/c | 79,200 | 52,800\n' +
        'Total | 6,09,200 | 4,30,800 | Total | 6,09,200 | 4,30,800\n' +
        '#ENDCAPITAL',
      // Content fix (2026-11-15): added the fluctuating Capital Accounts the question and rubric ask for.
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
        '#JOURNAL:Journal of Gyan Engineering Ltd.\n' +
        'Date | Particulars | L.F. | Debit (₹) | Credit (₹)\n' +
        ' | Bank A/c (2,000 x 96) Dr. | | 1,92,000 |\n' +
        ' | To 9% Debenture Application & Allotment A/c | | | 1,92,000\n' +
        '(Being application money received on 2,000 debentures @ ₹96)\n' +
        ' | 9% Debenture App. & Allotment A/c Dr. | | 1,92,000 |\n' +
        ' | Loss on Issue of Debentures A/c (4% + 5%) Dr. | | 18,000 |\n' +
        ' | To 9% Debentures A/c (2,000 x 100) | | | 2,00,000\n' +
        ' | To Premium on Redemption of Debentures A/c (5%) | | | 10,000\n' +
        '(Being 2,000 debentures issued at 4% discount redeemable at 5% premium)\n' +
        ' | Securities Premium A/c Dr. | | 18,000 |\n' +
        ' | To Loss on Issue of Debentures A/c | | | 18,000\n' +
        '(Being total loss on issue written off from Securities Premium)\n' +
        '#ENDJOURNAL',
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
        '#COMPUTATION:Cash Flow from Operating Activities\n' +
        'Particulars | Details (₹) | Amount (₹)\n' +
        'Net Profit before Tax and Extraordinary Items | | 4,50,000\n' +
        'Adjustments for Non-Cash and Non-Operating Items: | |\n' +
        '  Add: Depreciation on Plant & Machinery | 55,000 |\n' +
        '  Add: Goodwill amortised | 20,000 |\n' +
        '  Less: Gain on sale of land (investing activity) | (30,000) | 45,000\n' +
        'Operating Profit before Working Capital Changes | | 4,95,000\n' +
        'Adjustments for Working Capital Changes: | |\n' +
        '  Less: Increase in Trade Receivables (Current Asset) | (40,000) |\n' +
        '  Add: Decrease in Inventories (Current Asset) | 25,000 |\n' +
        '  Add: Increase in Trade Payables (Current Liability) | 15,000 | Nil\n' +
        'Cash Generated from Operations | | 4,95,000\n' +
        'Less: Income Tax Paid | | (60,000)\n' +
        'Net Cash Flow from Operating Activities | | 4,35,000\n' +
        '#ENDCOMPUTATION',
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
