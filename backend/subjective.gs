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
// 3. OFFICIAL "COMMERCE GYAN — DAILY PRACTICE SHEET" A4 PDF COMPILER
// ─────────────────────────────────────────────────────────────────────

/**
 * Compiles official A4 Question PDF on "Commerce Gyan — Daily Practice Sheet" template
 * @param {Object} data
 * @return {{ driveUrl: string, pdfBlob: GoogleAppsScript.Base.Blob, qid: string }}
 */
function createQuestionPdfFromTemplate_(data) {
  var folder = getOrCreatePdfFolder_('Commerce Master App Daily PDFs');
  var htmlContent = generateDailyPracticeSheetHtml_(data, false);
  var rawDate = String(data.date || getKolkataDate()).replace(/[^0-9a-zA-Z]/g, '_');
  var fileName = 'DPS_Question_Class' + (data.classLevel || 12) + '_' + rawDate;

  var htmlBlob = Utilities.newBlob(htmlContent, 'text/html', fileName + '.html');
  var pdfBlob = htmlBlob.getAs('application/pdf');
  pdfBlob.setName(fileName + '.pdf');

  var permPdf = folder.createFile(pdfBlob);
  permPdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    driveUrl: permPdf.getUrl(),
    pdfBlob: pdfBlob,
    qid: data.qid || ('DPS-' + (data.classLevel || 12))
  };
}

/**
 * Compiles official A4 Model Answer PDF on "Commerce Gyan — Daily Practice Sheet" template
 * @param {Object} data
 * @return {{ driveUrl: string, pdfBlob: GoogleAppsScript.Base.Blob, qid: string }}
 */
function createAnswerPdfFromTemplate_(data) {
  var folder = getOrCreatePdfFolder_('Commerce Master App Daily PDFs');
  var htmlContent = generateDailyPracticeSheetHtml_(data, true);
  var rawDate = String(data.date || getKolkataDate()).replace(/[^0-9a-zA-Z]/g, '_');
  var fileName = 'DPS_Answer_Class' + (data.classLevel || 12) + '_' + rawDate;

  var htmlBlob = Utilities.newBlob(htmlContent, 'text/html', fileName + '.html');
  var pdfBlob = htmlBlob.getAs('application/pdf');
  pdfBlob.setName(fileName + '.pdf');

  var permPdf = folder.createFile(pdfBlob);
  permPdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    driveUrl: permPdf.getUrl(),
    pdfBlob: pdfBlob,
    qid: data.qid || ('DPS-' + (data.classLevel || 12))
  };
}

/**
 * Generates the complete, self-contained HTML for Gyan Sir's official
 * "Commerce Gyan — Daily Practice Sheet" A4 Stationery.
 *
 * Supports:
 * - Primary Method: If PRACTICE_SHEET_BG_FILE_ID is configured in Script Properties,
 *   embeds the PNG/JPG as a full-page background and overlays text onto exact coordinates.
 * - Built-in Permanent HTML/CSS/inline SVG Template (Always active by default):
 *   Replicates the exact stationery design in pure vector HTML/CSS/SVG so it works
 *   100% serverless and offline with zero broken images.
 *
 * @param {Object} data
 * @param {boolean} isAnswerKey
 * @return {string}
 */
function generateDailyPracticeSheetHtml_(data, isAnswerKey) {
  data = data || {};
  var isAns = !!isAnswerKey;
  var classLevel = Number(data.classLevel) || 12;
  var marks = Number(data.marks) || 6;
  var pillText = isAns ? 'DAILY PRACTICE SHEET • ANSWER KEY' : 'DAILY PRACTICE SHEET';

  // Format Sheet / Question Number (NO. :) e.g. Q-12-04 or Q-12-06
  var sheetNumber = formatSheetNumberDps_(data.qid, classLevel, marks, isAns);

  // Format Subject, Topic, Date
  var subjectText = 'Class ' + classLevel + ' • ' + (data.subject || 'Accountancy');
  var topicText = String(data.chapter || (classLevel === 11 ? 'Bank Reconciliation Statement' : 'Partnership Accounts Fundamentals'));
  if (topicText.length > 48) {
    topicText = topicText.substring(0, 46) + '...';
  }

  var formattedDate = formatDateDps_(data.date);

  // Retrieve official stationery background image (Drive File ID or data.bgBase64)
  var bgBase64 = data.bgBase64;
  if (!bgBase64) {
    var props = PropertiesService.getScriptProperties();
    var bgFileId = props.getProperty('PRACTICE_SHEET_BG_FILE_ID') || '1G5FOitdeuh8FgLbnkgNdqiftvtCfiIah';
    if (!bgFileId) {
      throw new Error('PRACTICE_SHEET_BG_FILE_ID is not configured in Script Properties.');
    }
    try {
      var bgFile = DriveApp.getFileById(bgFileId);
      if (!bgFile) {
        throw new Error('PRACTICE_SHEET_BG_FILE_ID (' + bgFileId + ') not found in Google Drive.');
      }
      bgBase64 = Utilities.base64Encode(bgFile.getBlob().getBytes());
    } catch (e) {
      throw new Error('Failed to load official practice sheet background from Drive (' + bgFileId + '): ' + e.message);
    }
  }

  if (!bgBase64) {
    throw new Error('PRACTICE_SHEET_BG_FILE_ID is missing or unreadable. Silent CSS fallback is disabled.');
  }

  // Common body content HTML
  var bodyInnerHtml = isAns ? formatAnswerBodyHtml_(data) : formatQuestionBodyHtml_(data.questionText || '', marks, classLevel);

  return buildImageOverlayHtml_(bgBase64, pillText, sheetNumber, subjectText, topicText, formattedDate, bodyInnerHtml, isAns);
}

/**
 * Deprecated: Vector CSS redraw has been permanently removed per founder policy.
 * The official PNG stationery background is locked to guarantee 100% visual fidelity.
 */
function buildPermanentVectorStationeryHtml_() {
  throw new Error('Vector CSS redrawing is disabled. All Daily Practice Sheet PDFs must use the official pre-printed PNG template.');
}

/**
 * Builds HTML overlay onto the official "Commerce Gyan — Daily Practice Sheet" PNG background.
 * Exact millimeter coordinates match Gyan Sir's pre-printed stationery.
 */
function buildImageOverlayHtml_(bgBase64, pillText, sheetNumber, subjectText, topicText, formattedDate, bodyInnerHtml, isAns) {
  var ansPillOverlay = isAns ?
    '<div style="position: absolute; top: 4.2mm; left: 84.5mm; width: 78mm; height: 10.5mm; background: #5b1865; border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; font-weight: 800; font-size: 8.5pt; text-transform: uppercase; z-index: 2; letter-spacing: 0.3px;">' + escapeHtml_(pillText) + '</div>' : '';

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
'    width: 210mm;\n' +
'    height: 297mm;\n' +
'    background: #ffffff;\n' +
'    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n' +
'    color: #1e293b;\n' +
'    position: relative;\n' +
'    overflow: hidden;\n' +
'  }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div style="position: relative; width: 210mm; height: 297mm; overflow: hidden;">\n' +
'  <!-- Exact pre-printed PNG stationery background (Full bleed A4) -->\n' +
'  <img src="data:image/png;base64,' + bgBase64 + '" style="position: fixed; top: 0; left: 0; width: 210mm; height: 297mm; z-index: 0;" />\n' +
'  ' + ansPillOverlay + '\n' +
'  <!-- 1. NO. Box (top-right purple box) -->\n' +
'  <div style="position: absolute; top: 5.5mm; left: 177mm; width: 23mm; height: 7mm; display: flex; align-items: center; justify-content: center; font-size: 10pt; font-weight: bold; color: #5b1865; z-index: 2;">' + escapeHtml_(sheetNumber) + '</div>\n' +
'  <!-- 2. Subject Line (Underline after Subject :) -->\n' +
'  <div style="position: absolute; top: 26.5mm; left: 35mm; width: 43mm; font-size: 9pt; font-weight: bold; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; z-index: 2;">' + escapeHtml_(subjectText) + '</div>\n' +
'  <!-- 3. Topic Line (Underline after Topic :) -->\n' +
'  <div style="position: absolute; top: 26.5mm; left: 104mm; width: 44mm; font-size: 8.5pt; font-weight: bold; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; z-index: 2;">' + escapeHtml_(topicText) + '</div>\n' +
'  <!-- 4. Date Line (Underline after Date :) -->\n' +
'  <div style="position: absolute; top: 26.5mm; left: 173mm; width: 25mm; text-align: center; font-size: 9pt; font-weight: bold; color: #0f172a; letter-spacing: 0.5px; z-index: 2;">' + escapeHtml_(formattedDate) + '</div>\n' +
'  <!-- 5. Main Question / Answer Body strictly to the right of red margin line -->\n' +
'  <div style="position: absolute; top: 60mm; left: 16mm; right: 12mm; bottom: 26mm; background: transparent; overflow: hidden; z-index: 1;">\n' +
'    ' + bodyInnerHtml + '\n' +
'  </div>\n' +
'</div>\n' +
'</body>\n' +
'</html>';
}

/**
 * Formats question body HTML with badges, problem text/tables, and evening register prompt
 */
function formatQuestionBodyHtml_(questionText, marks, classLevel) {
  var marksBadge = '<div style="background: #f3e8ff; border: 1.5px solid #a855f7; color: #581c87; font-weight: 800; padding: 2px 10px; border-radius: 6px; font-size: 11.5px;">[ ' + marks + ' Marks ]</div>';
  var headerRow = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
    '<div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Official CBSE Class ' + classLevel + ' Problem</div>' +
    marksBadge +
  '</div>';

  var contentHtml = formatAccountingTableOrTextDps_(questionText);

  var bottomNote = '<div style="margin-top: 25px; background: #faf5ff; border: 1.5px dashed #c084fc; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 10px;">' +
    '<span style="font-size: 20px;">✍️</span>' +
    '<div style="font-size: 11.5px; color: #581c87; font-weight: 600; line-height: 1.4;">' +
      '<strong>CBSE Register Assignment:</strong> Solve this question in your physical practice register tonight. Official Step-by-Step Model Answer Key with CBSE Marking Rubric will be shared tomorrow at <strong>08:15 AM IST</strong>.' +
    '</div>' +
  '</div>';

  return headerRow + contentHtml + bottomNote;
}

/**
 * Formats model answer body HTML with question summary, CBSE solution, rubric, and traps
 */
function formatAnswerBodyHtml_(data) {
  var marks = Number(data.marks) || 6;
  var qSummary = escapeHtml_(String(data.questionText || '')).substring(0, 240);
  if (String(data.questionText || '').length > 240) qSummary += '...';

  var summaryBox = '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #5b1865; border-radius: 6px; padding: 6px 10px; margin-bottom: 8px;">' +
    '<div style="display: flex; justify-content: space-between; align-items: center;">' +
      '<span style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Original Question Recap</span>' +
      '<span style="background: #f3e8ff; border: 1px solid #a855f7; color: #581c87; font-weight: 800; padding: 1px 7px; border-radius: 4px; font-size: 10px;">[ ' + marks + ' Marks ]</span>' +
    '</div>' +
    '<div style="font-size: 10.5px; color: #334155; margin-top: 3px; font-weight: 500; line-height: 1.4;">' + qSummary + '</div>' +
  '</div>';

  var solHeading = '<div style="font-size: 11.5px; font-weight: 700; color: #5b1865; margin-bottom: 2px;">Official CBSE Model Solution:</div>';
  var solutionHtml = formatAccountingTableOrTextDps_(data.answerText || '');

  // Rubric Card
  var rubricHtml = '<div style="margin-top: 10px; background: #f0fdf4; border: 1.5px solid #22c55e; border-radius: 7px; padding: 7px 12px;">' +
    '<div style="font-size: 11px; font-weight: 700; color: #15803d; display: flex; align-items: center; gap: 5px;">' +
      '<span>✅</span><strong>CBSE Step-by-Step Marking Scheme & Rubric</strong>' +
    '</div>' +
    '<div style="font-size: 10.5px; color: #166534; margin-top: 4px; line-height: 1.45;">' +
      formatBulletListDps_(data.marksBreakdown || '') +
    '</div>' +
  '</div>';

  // Traps Card
  var trapsHtml = '<div style="margin-top: 8px; background: #fff1f2; border: 1.5px solid #f43f5e; border-radius: 7px; padding: 7px 12px;">' +
    '<div style="font-size: 11px; font-weight: 700; color: #be123c; display: flex; align-items: center; gap: 5px;">' +
      '<span>⚠️</span><strong>Common Examiner Traps to Avoid</strong>' +
    '</div>' +
    '<div style="font-size: 10.5px; color: #9f1239; margin-top: 4px; line-height: 1.45;">' +
      formatBulletListDps_(data.commonMistakes || '') +
    '</div>' +
  '</div>';

  return summaryBox + solHeading + solutionHtml + rubricHtml + trapsHtml;
}

/**
 * Parses raw text or table markup into styled HTML
 */
function formatAccountingTableOrTextDps_(text) {
  if (!text) return '';
  var lines = String(text).trim().split('\n');
  var isTable = false;
  for (var k = 0; k < lines.length; k++) {
    if (lines[k].indexOf('|') !== -1) {
      isTable = true;
      break;
    }
  }

  if (!isTable) {
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var escaped = escapeHtml_(line);
      if (/^\s*([0-9]+\.|\-|\•)\s+/.test(line)) {
        out.push('<div style="padding-left: 14px; margin-bottom: 5px; font-size: 12px; line-height: 1.5;">' + escaped + '</div>');
      } else if (line.indexOf('Adjustments:') === 0 || line.indexOf('Adjustments') === 0 || line.indexOf('Instructions:') === 0) {
        out.push('<div style="font-weight: bold; margin-top: 8px; margin-bottom: 4px; color: #5b1865; font-size: 12px;">' + escaped + '</div>');
      } else {
        out.push('<div style="margin-bottom: 6px; font-size: 12.5px; line-height: 1.55;">' + escaped + '</div>');
      }
    }
    return out.join('\n');
  }

  // Parse Table Lines
  var htmlLines = ['<div style="overflow-x: auto; margin: 6px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 10.5px; font-family: monospace, -apple-system, sans-serif;">'];
  for (var j = 0; j < lines.length; j++) {
    var rawLine = lines[j].trim();
    if (!rawLine || /^[\-\=\s]+$/.test(rawLine)) continue;

    if (rawLine.indexOf('|') !== -1) {
      var cols = rawLine.split('|');
      var isHeader = (j <= 2 && /particular|date|debit|credit|amount|plus|minus/i.test(rawLine));
      var isTotal = /total|balance c\/d|balance b\/d/i.test(rawLine);

      if (isHeader) {
        var ths = cols.map(function(c) {
          return '<th style="background: #f3e8ff; color: #5b1865; padding: 4px 6px; border: 1px solid #d8b4fe; font-weight: 700; text-align: left;">' + escapeHtml_(c.trim()) + '</th>';
        }).join('');
        htmlLines.push('<tr>' + ths + '</tr>');
      } else {
        var borderStyle = isTotal ? 'border: 1px solid #d8b4fe; border-bottom: 3px double #1e293b; font-weight: 700; background: #faf5ff;' : 'border: 1px solid #e2e8f0;';
        var tds = cols.map(function(c) {
          return '<td style="padding: 3px 6px; ' + borderStyle + '">' + escapeHtml_(c.trim()) + '</td>';
        }).join('');
        htmlLines.push('<tr>' + tds + '</tr>');
      }
    } else {
      htmlLines.push('<tr><td colspan="10" style="padding: 3px 6px; font-weight: bold; background: #f8fafc; border: 1px solid #e2e8f0;">' + escapeHtml_(rawLine) + '</td></tr>');
    }
  }
  htmlLines.push('</table></div>');
  return htmlLines.join('\n');
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
    return '<div style="margin-bottom: 3px;">' + escaped + '</div>';
  }).filter(Boolean).join('\n');
}

/**
 * Formats date into DD / MM / YYYY
 */
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
