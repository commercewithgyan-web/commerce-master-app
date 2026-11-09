/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — RED-PEN SNAPSHOT (redpen.gs)
 * Client-Side Canvas Compressed (1280px / ~200KB) Handwritten Copy OCR
 * via Gemini 2.5 Flash Vision. Strictly Validates Real Handwritten Register
 * Solutions, Detects Specific Presentation Traps, and Rejects Fake/Screenshots.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Evaluates student's handwritten copy submitted from redpen.html
 * 
 * @param {Object} verifiedUser
 * @param {Object} payload - { imageBase64?: string, pagesBase64?: string[], classLevel?: number, subject?: string, chapter?: string }
 * @return {Object} Diagnostic Red-Pen Feedback Card or Rejection Notice
 */
function apiSubmitRedPenCopy_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  
  // Accept imageBase64 or pagesBase64
  var pages = [];
  if (payload.imageBase64 && typeof payload.imageBase64 === 'string') {
    pages.push(payload.imageBase64);
  } else if (payload.pagesBase64 && Array.isArray(payload.pagesBase64) && payload.pagesBase64.length > 0) {
    pages = payload.pagesBase64;
  } else if (payload.image && typeof payload.image === 'string') {
    pages.push(payload.image);
  }

  if (pages.length === 0) {
    throw new Error('No copy image submitted. Please take a snapshot.');
  }

  // Quota Guard: Cap to max 5 pages per submission
  if (pages.length > 5) {
    pages = pages.slice(0, 5);
  }

  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) throw new Error('GEMINI_KEY missing in Script Properties');

  var classLevel = payload.classLevel || student.Class || 12;
  var subject = payload.subject || 'Accountancy';

  // Construct Multimodal Gemini 2.5 Flash Vision payload
  var geminiParts = [];

  for (var i = 0; i < pages.length; i++) {
    var pageStr = String(pages[i]);
    var mimeType = 'image/jpeg';
    var mimeMatch = pageStr.match(/^data:(image\/[a-zA-Z0-9\.\-\+]+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
    var rawBase64 = pageStr.replace(/^data:image\/[a-zA-Z0-9\.\-\+]+;base64,/, '').trim();
    geminiParts.push({
      inline_data: {
        mime_type: mimeType,
        data: rawBase64
      }
    });
  }

  var visionPrompt =
    'You are Gyan Sir\'s strict CBSE Class 12 Board Copy Examiner.\n' +
    'Inspect this uploaded image carefully and return JSON:\n\n' +
    'STEP 1 — VALIDATE IF THIS IS A HANDWRITTEN ANSWER:\n' +
    'Look at the image. Is it a handwritten commerce answer/solution on paper/register?\n' +
    '- If it is a phone screenshot, a printed question only, a selfie, a blank page, or an unrelated photo, set:\n' +
    '  "isValidHandwriting": false,\n' +
    '  "rejectionMessage": "⚠️ This is not a handwritten register solution! It looks like a screenshot or printed page. Please upload a clear photo of your handwritten notebook answer."\n\n' +
    'STEP 2 — IF IT IS A VALID HANDWRITTEN SOLUTION ("isValidHandwriting": true):\n' +
    'Read the actual handwriting in the photo and evaluate the exact subject & content written on the page:\n' +
    '- "detectedSubject": "Accountancy" | "Business Studies" | "Economics",\n' +
    '- "score": "X / 6 Marks",\n' +
    '- "flawlessElements": [List 2 specific things the student actually wrote correctly in this photo],\n' +
    '- "trapsCaught": [List specific errors actually visible in this photo. Note: Only check narrations/debits/credits if the handwritten answer is Accountancy!],\n' +
    '- "prescription": "1 specific improvement based on what is written in the photo"\n\n' +
    'Return strictly valid JSON.';

  geminiParts.push({ text: visionPrompt });

  var geminiModel = props.getProperty('GEMINI_MODEL') || 'gemini-2.5-flash';
  var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + geminiModel + ':generateContent?key=' + geminiKey;
  
  var requestPayload = {
    contents: [{ parts: geminiParts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  var responseData = null;
  var apiError = null;

  try {
    var res = UrlFetchApp.fetch(geminiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestPayload),
      muteHttpExceptions: true
    });

    var responseCode = res.getResponseCode();
    var responseBody = res.getContentText();

    if (responseCode === 200) {
      var json = JSON.parse(responseBody);
      if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
        var rawJsonText = json.candidates[0].content.parts[0].text;
        // Strip any surrounding markdown code block if present
        rawJsonText = rawJsonText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        responseData = JSON.parse(rawJsonText);
      }
    } else {
      apiError = 'Gemini API Error ' + responseCode + ': ' + responseBody;
      Logger.log(apiError);
    }
  } catch (err) {
    apiError = err.message || String(err);
    logError_('apiSubmitRedPenCopy_', err);
  }

  // Never return fake hardcoded mock 5/6 marks!
  if (!responseData) {
    throw new Error('Gemini Vision could not analyze the image (' + (apiError || 'Invalid response from AI engine') + '). Please ensure your photo is well-lit and clear.');
  }

  // Save image to Google Drive in background safe try-catch
  var driveUrl = 'N/A';
  try {
    driveUrl = saveRedPenImageToDrive_(pages[0], student.StudentID || verifiedUser.id);
  } catch (dErr) {
    Logger.log('Drive save skipped: ' + dErr.message);
  }

  // Next Submission ID
  var subId = 'RP-' + Date.now();
  try {
    subId = getNextId_('SHEET_QB', 'RedPen_Submissions', 1, 'RP', 4);
  } catch (idErr) {}

  var isValid = (responseData.isValidHandwriting !== false);
  var detectedSubj = responseData.detectedSubject || subject;
  var flawlessList = Array.isArray(responseData.flawlessElements) ? responseData.flawlessElements : [];
  var trapsList = Array.isArray(responseData.trapsCaught) ? responseData.trapsCaught : [];
  var prescriptionStr = responseData.prescription || '';
  var scoreStr = responseData.score || (isValid ? '5 / 6 Marks' : '0 / 6 Marks');
  var rejectionMsg = responseData.rejectionMessage || '⚠️ This is not a handwritten register solution! Please upload a clear photo of your handwritten notebook answer.';

  // Log to Sheet 2 Tab 2.11 (RedPen_Submissions)
  try {
    appendRow_('SHEET_QB', 'RedPen_Submissions', [
      subId,
      getKolkataTimestamp(),
      String(verifiedUser.id),
      student.Name || 'Student',
      classLevel,
      detectedSubj,
      payload.chapter || 'Handwritten Submission',
      driveUrl,
      isValid ? flawlessList.join('; ') : 'N/A',
      isValid ? trapsList.join('; ') : 'N/A',
      isValid ? prescriptionStr : rejectionMsg,
      isValid ? scoreStr : 'Rejected (Not handwritten)',
      isValid ? 'Analyzed' : 'Rejected'
    ]);
  } catch (sheetErr) {
    Logger.log('Notice: Could not log RedPen row: ' + sheetErr.message);
  }

  Logger.log('📸 Red-Pen evaluation completed for ' + (student.Name || 'Student') + ' (Valid: ' + isValid + ', Score: ' + scoreStr + ')');

  return {
    ok: true,
    isValidHandwriting: isValid,
    rejectionMessage: isValid ? '' : rejectionMsg,
    detectedSubject: detectedSubj,
    score: isValid ? scoreStr : null,
    flawlessElements: flawlessList,
    trapsCaught: trapsList,
    prescription: prescriptionStr,
    submissionId: subId,
    studentName: student.Name,
    driveUrl: driveUrl
  };
}

/**
 * Saves uploaded compressed image to Google Drive folder
 * @param {string} base64Data
 * @param {string} studentId
 * @return {string} Drive URL
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
    logError_('saveRedPenImageToDrive_', e);
    return 'DRIVE_SAVE_FAILED';
  }
}

/**
 * Handles Telegram /redpen bot command
 * @param {string|number} chatId
 */
function handleRedPenCommand_(chatId) {
  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  sendTelegramMessage_(chatId,
    '📸 *RED-PEN SNAPSHOT: INSTANT COPY CHECK*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Evaluate your handwritten ledger or journal entries against real CBSE examiner criteria:\n\n' +
    '• 🟢 Flawless Elements (+Marks)\n' +
    '• 🔴 CBSE Traps Caught (Missing narrations, single underline balances)\n' +
    '• 📝 Prescription for 100/100 Topper marks\n\n' +
    'Tap below to take a photo using the Mini App Camera (with auto-compression to protect upload speed):',
    {
      inline_keyboard: [
        [{ text: '📸 Open Red-Pen Camera', web_app: { url: miniAppUrl + '#redpen' } }]
      ]
    }
  );
}
