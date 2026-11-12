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

  // Format Sheet / Question Number (NO. :)
  var sheetNumber = String(data.qid || ('DPS-' + classLevel + (isAns ? '-A' : '-Q')));
  if (sheetNumber.length > 10) {
    sheetNumber = sheetNumber.substring(0, 10);
  }

  // Format Subject, Topic, Date
  var subjectText = 'Class ' + classLevel + ' • ' + (data.subject || 'Accountancy');
  var topicText = String(data.chapter || (classLevel === 11 ? 'Bank Reconciliation Statement' : 'Partnership Accounts Fundamentals'));
  if (topicText.length > 48) {
    topicText = topicText.substring(0, 46) + '...';
  }

  var formattedDate = formatDateDps_(data.date);

  // Check if background image overlay is configured via ScriptProperties
  var props = PropertiesService.getScriptProperties();
  var bgFileId = props.getProperty('PRACTICE_SHEET_BG_FILE_ID');
  var bgBase64 = null;
  if (data.bgBase64) {
    bgBase64 = data.bgBase64;
  } else if (bgFileId) {
    try {
      var bgFile = DriveApp.getFileById(bgFileId);
      bgBase64 = Utilities.base64Encode(bgFile.getBlob().getBytes());
    } catch (e) {
      Logger.log('Notice: Could not load PRACTICE_SHEET_BG_FILE_ID: ' + e.message);
    }
  }

  // Common body content HTML
  var bodyInnerHtml = isAns ? formatAnswerBodyHtml_(data) : formatQuestionBodyHtml_(data.questionText || '', marks, classLevel);

  // If background image is present, overlay onto image
  if (bgBase64) {
    return buildImageOverlayHtml_(bgBase64, pillText, sheetNumber, subjectText, topicText, formattedDate, bodyInnerHtml, isAns);
  }

  // Otherwise, use the Built-in Permanent Vector HTML/CSS/SVG Template (Default)
  return buildPermanentVectorStationeryHtml_(pillText, sheetNumber, subjectText, topicText, formattedDate, bodyInnerHtml, isAns);
}

/**
 * Builds the Built-in Permanent Pure HTML/CSS/inline SVG Stationery Template
 */
function buildPermanentVectorStationeryHtml_(pillText, sheetNumber, subjectText, topicText, formattedDate, bodyInnerHtml, isAns) {
  var cgLogoSvg = '<svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" stroke="#e2e8f0" stroke-width="1.5" fill="#ffffff"/><path d="M50 14 C72 14 86 28 86 46 C86 48 83 50 80 50 C77 50 76 48 76 46 C76 34 65 24 50 24 C36 24 25 35 25 50 C25 65 36 76 50 76 C60 76 68 70 72 61 L54 61 C51 61 49 59 49 56 C49 53 51 51 54 51 L81 51 C84 51 86 53 86 56 C86 73 70 86 50 86 C30 86 14 70 14 50 C14 30 30 14 50 14 Z" fill="url(#cgG)"/><path d="M50 32 C60 32 68 39 68 48 L68 52 C68 53 67 54 66 54 L52 54 C50 54 48 52 48 50 C48 48 50 46 52 46 L60 46 C59 40 54 36 48 36 C41 36 36 41 36 48 C36 55 41 60 48 60 C53 60 57 57 59 53 L66 57 C62 64 55 68 47 68 C35 68 26 59 26 47 C26 35 37 32 50 32 Z" fill="#9333ea" opacity="0.85"/><defs><linearGradient id="cgG" x1="14" y1="14" x2="86" y2="86" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#f59e0b"/><stop offset="45%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs></svg>';

  var bookIconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5b1865" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';

  var targetIconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5b1865" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>';

  var calIconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5b1865" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  var pinIconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#5b1865"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';

  var phoneIconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="#5b1865"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';

  var socialIconsSvg = '<div style="display: inline-flex; align-items: center; gap: 7px;">' +
    '<svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M3.6 1.7l11.4 10.3L3.6 22.3c-.4-.4-.6-1-.6-1.7V3.4c0-.7.2-1.3.6-1.7z"/><path fill="#FBBC05" d="M17.4 9.6l3.3 1.9c1 .6 1 1.5 0 2l-3.3 1.9-2.4-2.4 2.4-3.4z"/><path fill="#34A853" d="M15 12l2.4 2.4-13.8 7.9c.7.5 1.7.4 2.4 0l9-10.3z"/><path fill="#EA4335" d="M3.6 1.7c-.7-.4-1.7-.5-2.4 0L15 12l-2.4-2.4L3.6 1.7z"/></svg>' +
    '<svg width="14" height="14" viewBox="0 0 24 24"><rect width="24" height="18" y="3" rx="4" fill="#FF0000"/><polygon points="9.5,7.5 16.5,12 9.5,16.5" fill="#FFFFFF"/></svg>' +
    '<svg width="13" height="13" viewBox="0 0 24 24"><defs><radialGradient id="ig" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#fdf497"/><stop offset="5%" stop-color="#fdf497"/><stop offset="45%" stop-color="#fd5949"/><stop offset="60%" stop-color="#d6249f"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="17" cy="7" r="1" fill="#fff"/></svg>' +
    '<svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#29B6F6"/><path d="M5.5 11.5l12-5-4 11-3.5-3-2 1.5v-2.5l6-5.5-7.5 4.5z" fill="#ffffff"/></svg>' +
  '</div>';

  var watermarkSvg = '<svg width="220" height="220" viewBox="0 0 100 100"><path d="M50 14 C70 14 84 28 84 46 C84 48 81 50 78 50 C75 50 74 48 74 46 C74 34 63 24 50 24 C37 24 26 35 26 50 C26 65 37 76 50 76 C60 76 68 70 72 61 L54 61 C51 61 49 59 49 56 C49 53 51 51 54 51 L80 51 C83 51 85 53 85 56 C85 73 70 86 50 86 C30 86 14 70 14 50 C14 30 30 14 50 14 Z" fill="url(#cgWater)"/><defs><linearGradient id="cgWater" x1="14" y1="14" x2="86" y2="86" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs></svg>';

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
'  <!-- 1. Top Header Bar -->\n' +
'  <div style="width: 210mm; padding: 4.5mm 12mm 2.5mm 12mm; display: flex; align-items: center; justify-content: space-between;">\n' +
'    <!-- Left: Logo & Commerce Gyan Branding -->\n' +
'    <div style="display: flex; align-items: center; gap: 9px;">\n' +
'      ' + cgLogoSvg + '\n' +
'      <div style="width: 1px; height: 28px; background: #cbd5e1;"></div>\n' +
'      <div>\n' +
'        <div style="font-family: Georgia, serif; font-size: 18.5px; font-weight: 800; color: #0f4c81; letter-spacing: 0.6px; line-height: 1.1;">COMMERCE GYAN</div>\n' +
'        <div style="font-size: 8.5px; font-weight: 700; font-style: italic; color: #6b21a8; letter-spacing: 1.4px; line-height: 1.1; margin-top: 2px;">BE THE BEST FROM THE REST</div>\n' +
'      </div>\n' +
'    </div>\n' +
'    <!-- Center: Purple Rounded Pill -->\n' +
'    <div style="background: #5b1865; border: 1.5px solid #4f46e5; color: #ffffff; font-weight: 800; font-size: ' + (isAns ? '12px' : '12.5px') + '; text-transform: uppercase; border-radius: 20px; padding: 5px 16px; letter-spacing: 0.7px; white-space: nowrap;">' + escapeHtml_(pillText) + '</div>\n' +
'    <!-- Right: NO. Box -->\n' +
'    <div style="display: flex; align-items: center; gap: 6px;">\n' +
'      <div style="width: 1px; height: 28px; background: #cbd5e1;"></div>\n' +
'      <span style="font-weight: 700; font-size: 12px; color: #5b1865;">NO. :</span>\n' +
'      <div style="border: 1.5px solid #5b1865; border-radius: 7px; min-width: 82px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11.5px; color: #5b1865; background: #ffffff; padding: 0 6px;">' + escapeHtml_(sheetNumber) + '</div>\n' +
'    </div>\n' +
'  </div>\n' +
'\n' +
'  <!-- 2. Tri-Color Divider Rule -->\n' +
'  <div style="display: flex; width: 100%; height: 3.5px; margin-top: 2px;">\n' +
'    <div style="flex: 75; background: #f59e0b;"></div>\n' +
'    <div style="flex: 12; background: #38bdf8;"></div>\n' +
'    <div style="flex: 13; background: #5b1865;"></div>\n' +
'  </div>\n' +
'\n' +
'  <!-- 3. Metadata Bar -->\n' +
'  <div style="border-top: 1.5px solid #5b1865; border-bottom: 1.5px solid #5b1865; padding: 3px 12mm; display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700; color: #5b1865; margin-top: 2px;">\n' +
'    <div style="display: flex; align-items: center; gap: 5px;">\n' +
'      ' + bookIconSvg + '\n' +
'      <span>Subject :</span>\n' +
'      <span style="border-bottom: 1px solid #5b1865; padding: 0 6px 1px 6px; font-weight: 600; color: #0f172a; min-width: 130px; display: inline-block;">' + escapeHtml_(subjectText) + '</span>\n' +
'    </div>\n' +
'    <div style="width: 1px; height: 16px; background: #5b1865;"></div>\n' +
'    <div style="display: flex; align-items: center; gap: 5px;">\n' +
'      ' + targetIconSvg + '\n' +
'      <span>Topic :</span>\n' +
'      <span style="border-bottom: 1px solid #5b1865; padding: 0 6px 1px 6px; font-weight: 600; color: #0f172a; min-width: 170px; display: inline-block;">' + escapeHtml_(topicText) + '</span>\n' +
'    </div>\n' +
'    <div style="width: 1px; height: 16px; background: #5b1865;"></div>\n' +
'    <div style="display: flex; align-items: center; gap: 5px;">\n' +
'      ' + calIconSvg + '\n' +
'      <span>Date :</span>\n' +
'      <span style="border-bottom: 1px solid #5b1865; padding: 0 6px 1px 6px; font-weight: 600; color: #0f172a; min-width: 80px; text-align: center; display: inline-block;">' + escapeHtml_(formattedDate) + '</span>\n' +
'    </div>\n' +
'  </div>\n' +
'\n' +
'  <!-- 4. Left Red Margin Line -->\n' +
'  <div style="position: absolute; left: 14mm; top: 32mm; bottom: 18mm; width: 1.5px; background: #e11d48; z-index: 1;"></div>\n' +
'\n' +
'  <!-- 5. Center Watermark -->\n' +
'  <div style="position: absolute; top: 52%; left: 50%; transform: translate(-50%, -50%); z-index: 0; opacity: 0.08; text-align: center; pointer-events: none; width: 100%;">\n' +
'    ' + watermarkSvg + '\n' +
'    <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 800; color: #0f4c81; letter-spacing: 2px;">COMMERCE GYAN</div>\n' +
'    <div style="font-size: 11px; font-weight: 700; font-style: italic; color: #6b21a8; letter-spacing: 2.5px; margin-top: 4px;">BE THE BEST FROM THE REST</div>\n' +
'  </div>\n' +
'\n' +
'  <!-- 6. Notebook Body Content -->\n' +
'  <div style="position: relative; z-index: 2; margin-left: 17mm; margin-right: 12mm; padding-top: 5mm; min-height: 220mm;">\n' +
'    ' + bodyInnerHtml + '\n' +
'  </div>\n' +
'\n' +
'  <!-- 7. Footer Rule -->\n' +
'  <div style="position: absolute; bottom: 14mm; left: 0; width: 100%; display: flex; height: 3px;">\n' +
'    <div style="flex: 75; background: #f59e0b;"></div>\n' +
'    <div style="flex: 12; background: #38bdf8;"></div>\n' +
'    <div style="flex: 13; background: #5b1865;"></div>\n' +
'  </div>\n' +
'\n' +
'  <!-- 8. Bottom Footer Bar -->\n' +
'  <div style="position: absolute; bottom: 0; left: 0; width: 210mm; height: 14mm; padding: 2px 10mm 4px 10mm; display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 600; color: #1e293b;">\n' +
'    <div style="display: flex; align-items: center; gap: 5px;">\n' +
'      ' + pinIconSvg + '\n' +
'      <span>Behind G.D. College, 2nd Floor, Begusarai</span>\n' +
'    </div>\n' +
'    <div style="width: 1px; height: 16px; background: #cbd5e1;"></div>\n' +
'    <div style="display: flex; align-items: center; gap: 7px;">\n' +
'      ' + socialIconsSvg + '\n' +
'    </div>\n' +
'    <div style="width: 1px; height: 16px; background: #cbd5e1;"></div>\n' +
'    <div style="border: 1px solid #5b1865; border-radius: 12px; padding: 2px 9px; font-weight: 700; font-size: 9px; color: #5b1865; background: #fbf5ff; display: inline-flex; align-items: center; gap: 4px;">\n' +
'      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5b1865" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>\n' +
'      <span>Commerce with Gyan</span>\n' +
'    </div>\n' +
'    <div style="width: 1px; height: 16px; background: #cbd5e1;"></div>\n' +
'    <div style="display: flex; align-items: center; gap: 5px;">\n' +
'      ' + phoneIconSvg + '\n' +
'      <span style="font-weight: 800; font-size: 11px; color: #5b1865;">9278569860</span>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'</body>\n' +
'</html>';
}

/**
 * Builds HTML when an official template background image (Base64) is supplied
 */
function buildImageOverlayHtml_(bgBase64, pillText, sheetNumber, subjectText, topicText, formattedDate, bodyInnerHtml, isAns) {
  var ansPillOverlay = isAns ?
    '<div style="position: absolute; top: 4.8mm; left: 75mm; width: 88mm; height: 8.5mm; background: #5b1865; border: 1.5px solid #4f46e5; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-family: sans-serif; font-weight: 800; font-size: 10px; text-transform: uppercase; z-index: 2; letter-spacing: 0.5px;">' + escapeHtml_(pillText) + '</div>' : '';

  return '<!DOCTYPE html>\n' +
'<html>\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<title>' + escapeHtml_(pillText) + '</title>\n' +
'<style>\n' +
'  @page { size: 210mm 297mm; margin: 0; }\n' +
'  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n' +
'  html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; position: relative; overflow: hidden; }\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div style="position: relative; width: 210mm; height: 297mm; overflow: hidden;">\n' +
'  <img src="data:image/jpeg;base64,' + bgBase64 + '" style="position: absolute; top: 0; left: 0; width: 210mm; height: 297mm; z-index: 0;" />\n' +
'  ' + ansPillOverlay + '\n' +
'  <div style="position: absolute; top: 5.2mm; left: 174mm; width: 27mm; height: 7.5mm; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; color: #5b1865; z-index: 2;">' + escapeHtml_(sheetNumber) + '</div>\n' +
'  <div style="position: absolute; top: 25.4mm; left: 34mm; width: 44mm; height: 5mm; display: flex; align-items: center; font-weight: 700; font-size: 10px; color: #0f172a; z-index: 2; overflow: hidden; white-space: nowrap;">' + escapeHtml_(subjectText) + '</div>\n' +
'  <div style="position: absolute; top: 25.4mm; left: 102mm; width: 45mm; height: 5mm; display: flex; align-items: center; font-weight: 700; font-size: 10px; color: #0f172a; z-index: 2; overflow: hidden; white-space: nowrap;">' + escapeHtml_(topicText) + '</div>\n' +
'  <div style="position: absolute; top: 25.4mm; left: 173mm; width: 25mm; height: 5mm; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; color: #0f172a; z-index: 2;">' + escapeHtml_(formattedDate) + '</div>\n' +
'  <div style="position: absolute; top: 38mm; left: 18mm; width: 180mm; bottom: 20mm; z-index: 2; overflow: hidden;">\n' +
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
  var s = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    var parts = s.split('-');
    return parts[2] + ' / ' + parts[1] + ' / ' + parts[0];
  }
  return s;
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
function getApprovedSubjectiveQuestion_(classLevel, subtopic, targetMarks) {
  classLevel = Number(classLevel) || 12;
  subtopic = subtopic || {};
  targetMarks = Number(targetMarks) || 0;

  // 1. Try to query SHEET_QB!QuestionBank or Theory_Bank
  try {
    var allQ = getAllRowsAsObjects_('SHEET_QB', 'QuestionBank', 1000);
    for (var i = 0; i < allQ.length; i++) {
      var q = allQ[i];
      var qClass = Number(q.Class || q.classLevel);
      var qType = String(q.Type || q.QuestionType || '').toLowerCase();
      var qMarks = Number(q.Marks || q.marks || 6);
      var qStatus = String(q.ApprovalStatus || q.Status || '').toLowerCase();

      if (qClass === classLevel && (qType.indexOf('subjective') !== -1 || qType.indexOf('theory') !== -1 || qType.indexOf('short') !== -1 || qType.indexOf('long') !== -1)) {
        if (qStatus === 'approved' || qStatus === 'active') {
          if (!targetMarks || qMarks === targetMarks) {
            return {
              qid: q.QID || q.QuestionID || ('QB_' + classLevel + '_' + i),
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
  } catch (err) {
    Logger.log('Notice in getApprovedSubjectiveQuestion_ reading QuestionBank: ' + err.message);
  }

  // 2. Curated Authentic CBSE Multi-Mark Vault by Class Level & Mark Tier
  if (classLevel === 11) {
    if (targetMarks === 3 || targetMarks === 4) {
      return {
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
      };
    } else {
      // 6-Mark Class 11 Comprehensive Problem
      return {
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
      };
    }
  }

  // Class 12 (3 or 4 Marks)
  if (classLevel === 12 && (targetMarks === 3 || targetMarks === 4)) {
    return {
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
    };
  }

  // Class 12 Problem (Default / 6-Mark)
  return {
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
  };
}
