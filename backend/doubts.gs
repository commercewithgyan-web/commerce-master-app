/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — MULTI-SUBJECT & MULTI-LENS DOUBT ENGINE (doubts.gs)
 * Real Multimodal Gemini 2.5 Flash / Flash Lite Streaming,
 * Multi-Subject Separation (Accountancy, Business Studies, Economics),
 * Multi-Lens Execution (💡 Simple Story | 📝 Exam Notes | 🏢 Real Example),
 * and Strict Transcription Grounding.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. CORE MULTI-LENS ENGINE (askDoubtGemini)
// ─────────────────────────────────────────────────────────────────────

/**
 * Queries Gemini with Gyan Sir's strict pedagogical boundaries and requested lens.
 * 
 * @param {string} studentName - Student's first name
 * @param {string} subject - 'Accountancy' | 'Business Studies' | 'Economics'
 * @param {string} question - Question text
 * @param {string} lens - 'ALL' | 'STORY' | 'EXAM_NOTES' | 'REAL_EXAMPLE'
 * @return {Object} Structured JSON output containing explanation & lenses
 */
function askDoubtGemini(studentName, subject, question, lens) {
  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) throw new Error('GEMINI_KEY is missing');

  var targetSubject = subject || 'Accountancy';
  var requestedLens = (lens || 'ALL').toUpperCase();

  var systemPrompt =
    'You are Gyan Sir\'s elite Commerce Study Buddy for ' + studentName + '.\n' +
    'SUBJECT: ' + targetSubject + '\n' +
    'STUDENT QUESTION: "' + question + '"\n' +
    'REQUESTED LENS: ' + requestedLens + ' (Options: ALL, STORY, EXAM_NOTES, REAL_EXAMPLE)\n\n' +
    'STRICT PEDAGOGICAL BOUNDARIES:\n' +
    '1. SUBJECT IS BUSINESS STUDIES (BST):\n' +
    '   - Focus on Management Principles, Functions, and Headings.\n' +
    '   - STRICT PROHIBITION: NEVER mention "Narration", "Journal Entry", "Debit", or "Credit". Business Studies has ZERO journal entries and ZERO narrations.\n' +
    '2. SUBJECT IS ECONOMICS:\n' +
    '   - Focus on Economic concepts, schedules, and curves. No accounting debits/credits.\n' +
    '3. SUBJECT IS ACCOUNTANCY:\n' +
    '   - Focus on Journal formats, ledgers, and Accounting Standards.\n\n' +
    'LENS EXECUTION RULES:\n' +
    '- If LENS == "STORY": Explain using an everyday Indian analogy (street food, cricket, pocket money) under 100 words.\n' +
    '- If LENS == "EXAM_NOTES": Give a 3-bullet CBSE board exam point-wise answer with bold keywords ready to copy into a student register.\n' +
    '- If LENS == "REAL_EXAMPLE": Explain how real companies (Tata, Zomato, boAt) apply this exact concept in business under 100 words.\n' +
    '- If LENS == "ALL": Generate all 3 lenses simultaneously in the JSON output.\n\n' +
    'OUTPUT SPECIFICATION:\n' +
    'Return STRICT JSON:\n' +
    '{\n' +
    '  "subject": "' + targetSubject + '",\n' +
    '  "activeLens": "' + (requestedLens === 'ALL' ? 'STORY' : requestedLens) + '",\n' +
    '  "answer": "<Full explanation for the requested lens, or STORY if ALL>",\n' +
    '  "lenses": {\n' +
    '    "STORY": "<everyday Indian analogy under 100 words>",\n' +
    '    "EXAM_NOTES": "<3-bullet CBSE board exam point-wise answer with bold keywords>",\n' +
    '    "REAL_EXAMPLE": "<real-world corporate example (Tata, Zomato, boAt) under 100 words>"\n' +
    '  },\n' +
    '  "keyRule": "<1 crisp golden rule to memorize under 12 words>",\n' +
    '  "cbseTrap": "<1 common CBSE examiner trap to avoid under 15 words>"\n' +
    '}';

  var geminiModel = getGeminiModel_();
  var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + geminiModel + ':generateContent?key=' + geminiKey;
  var payload = {
    contents: [{ parts: [{ text: systemPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  var res = UrlFetchApp.fetch(geminiUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() === 200) {
    var json = JSON.parse(res.getContentText());
    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
      var raw = json.candidates[0].content.parts[0].text;
      return JSON.parse(raw);
    }
  }

  throw new Error('Gemini API call failed with response code: ' + res.getResponseCode() + ' - ' + res.getContentText());
}

// ─────────────────────────────────────────────────────────────────────
// 2. TEXT DOUBT ENDPOINT (apiAskDoubt_)
// ─────────────────────────────────────────────────────────────────────

/**
 * Handles text-based doubts from Mini App
 * 
 * @param {Object} verifiedUser
 * @param {Object} payload - { question, subject, lens }
 * @return {Object}
 */
function apiAskDoubt_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  var studentName = student.Name || verifiedUser.first_name || 'Student';
  var questionText = (payload.question || '').trim();
  var mode = 'text';

  // If question was not transcribed client-side, transcribe from audioBase64
  if (!questionText && payload.audioBase64) {
    mode = 'voice_webapp';
    var rawMimeType = (payload.mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    var transcribeRes = transcribeAndGroundAudio_(payload.audioBase64, rawMimeType, studentName, payload.subject || 'Accountancy');
    if (transcribeRes.isRejected) {
      return {
        isRejected: true,
        studentName: studentName,
        message: 'Sorry, your voice was not clear. Please speak closer to the mic and ask again!'
      };
    }
    questionText = transcribeRes.transcribed;
  } else if (payload.audioBase64) {
    mode = 'voice_hybrid';
  }

  if (!questionText) throw new Error('Question text or voice input is required');

  var subject = payload.subject || detectCommerceSubject_(questionText, '', '');
  var lens = payload.lens || 'ALL';

  var result = askDoubtGemini(studentName, subject, questionText, lens);

  // Log to Sheet 2 Doubts
  appendRow_('SHEET_QB', 'Doubts', [
    getKolkataTimestamp(),
    String(verifiedUser.id),
    studentName,
    questionText,
    result.answer || (result.lenses ? result.lenses.STORY : ''),
    mode,
    payload.duration || 0,
    subject,
    lens,
    'Answered'
  ]);

  return {
    isRejected: false,
    studentName: studentName,
    subject: subject,
    question: questionText,
    transcribed: questionText,
    answer: result.answer || (result.lenses ? result.lenses.STORY : ''),
    lenses: result.lenses || {},
    activeLens: result.activeLens || 'STORY',
    keyTakeaway: result.keyRule,
    keyRule: result.keyRule,
    cbseTrap: result.cbseTrap
  };
}

// ─────────────────────────────────────────────────────────────────────
// 3. VOICE DOUBT ENDPOINTS (Web App & Telegram)
// ─────────────────────────────────────────────────────────────────────

/**
 * Handles voice doubts from Mini App via MediaRecorder
 * 
 * @param {Object} verifiedUser
 * @param {Object} payload - { audioBase64, mimeType, duration, subject }
 * @return {Object}
 */
function apiAskVoiceDoubt_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  var studentName = student.Name || verifiedUser.first_name || 'Student';
  var subject = payload.subject || 'Accountancy';

  var transcribedQuestion = (payload.question || '').trim();

  // If question was not pre-transcribed client-side, transcribe from audioBase64
  if (!transcribedQuestion && payload.audioBase64) {
    var rawMimeType = (payload.mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    var transcribeRes = transcribeAndGroundAudio_(payload.audioBase64, rawMimeType, studentName, subject);

    if (transcribeRes.isRejected) {
      return {
        isRejected: true,
        studentName: studentName,
        message: 'Sorry, your voice was not clear. Please speak closer to the mic and ask again!'
      };
    }
    transcribedQuestion = transcribeRes.transcribed;
  }

  if (!transcribedQuestion) {
    return {
      isRejected: true,
      studentName: studentName,
      message: 'Could not hear your question clearly. Please speak closer to the mic or type your doubt!'
    };
  }

  var finalSubject = payload.subject || detectCommerceSubject_(transcribedQuestion, '', '');

  // 2. Execute multi-lens generation using askDoubtGemini
  var result = askDoubtGemini(studentName, finalSubject, transcribedQuestion, 'ALL');

  // 3. Log to Sheet 2
  appendRow_('SHEET_QB', 'Doubts', [
    getKolkataTimestamp(),
    String(verifiedUser.id),
    studentName,
    transcribedQuestion,
    result.answer || (result.lenses ? result.lenses.STORY : ''),
    'voice_webapp',
    payload.duration || 0,
    finalSubject,
    'ALL_LENSES',
    'Answered'
  ]);

  return {
    isRejected: false,
    studentName: studentName,
    subject: finalSubject,
    transcribed: transcribedQuestion,
    answer: result.answer || (result.lenses ? result.lenses.STORY : ''),
    lenses: result.lenses || {},
    activeLens: result.activeLens || 'STORY',
    keyTakeaway: result.keyRule,
    keyRule: result.keyRule,
    cbseTrap: result.cbseTrap
  };
}

/**
 * Handles incoming voice notes from Telegram DM
 * 
 * @param {Object} msg - Telegram message object containing voice
 */
function handleVoiceDoubt_(msg) {
  var chatId = msg.chat.id;
  sendChatAction_(chatId, 'typing');

  var studentName = 'Student';

  try {
    var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(chatId));
    studentName = student ? student.Name : (msg.from ? msg.from.first_name : 'Student');

    var voice = msg.voice;
    var fileId = voice.file_id;
    var duration = voice.duration || 0;

    // 1. Fetch file path from Telegram Bot API
    var fileRes = callTelegramApi_('getFile', { file_id: fileId });
    if (!fileRes.ok || !fileRes.result.file_path) {
      throw new Error('Could not retrieve voice file path from Telegram');
    }

    var filePath = fileRes.result.file_path;

    // 2. Download .ogg audio binary into memory
    var props = PropertiesService.getScriptProperties();
    var botToken = props.getProperty('BOT_TOKEN');
    var downloadUrl = 'https://api.telegram.org/file/bot' + botToken + '/' + filePath;

    var audioResponse = UrlFetchApp.fetch(downloadUrl);
    var audioBlob = audioResponse.getBlob();
    var audioBytes = audioBlob.getBytes();
    var base64Audio = Utilities.base64Encode(audioBytes);

    // 3. Transcribe & ground audio
    var groundRes = transcribeAndGroundAudio_(base64Audio, 'audio/ogg', studentName, 'Accountancy');

    if (groundRes.isRejected) {
      var rejectMsg = 'Sorry, your voice was not clear. Please speak closer to the mic and ask again!';
      sendTelegramMessage_(chatId, '⚠️ *Study Buddy Notice*:\n\n' + rejectMsg);
      return;
    }

    var transcribedText = groundRes.transcribed;
    var detectedSubj = detectCommerceSubject_(transcribedText, '', '');

    // 4. Generate multi-lens answer
    var result = askDoubtGemini(studentName, detectedSubj, transcribedText, 'STORY');

    // 5. Deliver friendly grounded reply to student
    var replyText = '🎙️ *Question heard:* "' + transcribedText + '"\n';
    replyText += '📚 *Subject:* ' + detectedSubj + '\n\n';
    replyText += '💡 *Simple Story:*\n\n' + (result.lenses ? result.lenses.STORY : result.answer);

    if (result.keyRule) {
      replyText += '\n\n⭐ *Golden Rule:* ' + result.keyRule;
    }
    if (result.cbseTrap) {
      replyText += '\n⚠️ *CBSE Trap:* ' + result.cbseTrap;
    }

    sendTelegramMessage_(chatId, replyText, {
      inline_keyboard: [
        [{ text: '📓 Save to My Notes', callback_data: 'save_note_last' }],
        [{ text: '📱 Practice Related MCQ', callback_data: 'cmd_practice' }]
      ]
    });

    // 6. Log to Sheet 2
    appendRow_('SHEET_QB', 'Doubts', [
      getKolkataTimestamp(),
      String(chatId),
      studentName,
      transcribedText,
      result.answer || (result.lenses ? result.lenses.STORY : ''),
      'voice_telegram',
      duration,
      detectedSubj,
      'STORY',
      'Answered'
    ]);

  } catch (err) {
    logError_('handleVoiceDoubt_', err);
    sendTelegramMessage_(chatId,
      '⚠️ *Study Buddy Notice*: Sorry, your voice was not clear. Please speak closer to the mic and ask again!'
    );
  }
}

/**
 * Transcribes audio and validates whether it is an academic question or silent/unintelligible.
 * 
 * @param {string} base64Audio
 * @param {string} mimeType
 * @param {string} studentName
 * @param {string} subject
 * @return {{ isRejected: boolean, transcribed: string }}
 */
function transcribeAndGroundAudio_(base64Audio, mimeType, studentName, subject) {
  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) throw new Error('GEMINI_KEY is missing');

  var prompt =
    'Listen carefully to this audio recording from student ' + studentName + ' asking about ' + subject + '.\n' +
    'Step 1: If the audio is silent, unintelligible, muffled noise, or not a question, output EXACTLY:\n' +
    'REJECTED_UNCLEAR_AUDIO\n' +
    'Step 2: Otherwise, output ONLY the exact transcribed question spoken by the student. Do not add explanations or commentary.';

  var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + geminiKey;
  var payload = {
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Audio
          }
        },
        { text: prompt }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 150
    }
  };

  var res = UrlFetchApp.fetch(geminiUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() === 200) {
    var json = JSON.parse(res.getContentText());
    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
      var raw = json.candidates[0].content.parts[0].text.trim();
      var isRejected = !raw ||
                       raw.indexOf('REJECTED_UNCLEAR_AUDIO') !== -1 ||
                       raw.toLowerCase().indexOf('not clear') !== -1 ||
                       raw.toLowerCase().indexOf('speak again') !== -1;

      return {
        isRejected: isRejected,
        transcribed: isRejected ? '' : raw.replace(/^["']|["']$/g, '').trim()
      };
    }
  }

  return { isRejected: true, transcribed: '' };
}

// ─────────────────────────────────────────────────────────────────────
// 4. SUBJECT DETECTION HELPER
// ─────────────────────────────────────────────────────────────────────

/**
 * Detects the commerce subject from query text, chapter, or explicit parameter.
 * Strictly separates Business Studies (BST), Economics, and Accountancy.
 * 
 * @param {string} text - Spoken transcript or written question
 * @param {string} [explicitSubject] - Optional subject passed by caller
 * @param {string} [chapter] - Optional chapter passed by caller
 * @return {string} 'Business Studies' | 'Economics' | 'Accountancy'
 */
function detectCommerceSubject_(text, explicitSubject, chapter) {
  var s = (explicitSubject || '').toLowerCase();
  if (s.indexOf('business') !== -1 || s.indexOf('bst') !== -1) return 'Business Studies';
  if (s.indexOf('eco') !== -1) return 'Economics';
  if (s.indexOf('acc') !== -1) return 'Accountancy';

  var combined = ((text || '') + ' ' + (chapter || '')).toLowerCase();

  // 1. Business Studies Keywords
  var bstRegex = /\b(fayol|henri fayol|taylor|f\.w\. taylor|scientific management|principles of management|unity of command|unity of direction|scalar chain|espirit de corps|remuneration|centralisation|centralization|decentralisation|decentralization|span of control|delegation|authority|responsibility|accountability|planning|organising|organizing|staffing|directing|controlling|supervision|motivation|maslow|grapevine|leadership|communication barrier|marketing|marketing mix|branding|packaging|labelling|labeling|pricing|promotion|personal selling|advertising|public relations|consumer protection|copra|consumer rights|district commission|state commission|national commission|financial management|capital structure|trading on equity|working capital|fixed capital|financial market|money market|capital market|sebi|stock exchange|depository|demat|treasury bill|commercial paper|call money)\b/i;

  // 2. Economics Keywords
  var ecoRegex = /\b(demand|supply|elasticity|price elasticity|income elasticity|utility|marginal utility|law of diminishing|indifference curve|budget line|production possibility|ppf|ppc|opportunity cost|marginal cost|average cost|total cost|marginal revenue|average revenue|macroeconomics|microeconomics|national income|gdp|gnp|ndp|nnp|value added|multiplier|investment multiplier|propensity to consume|mpc|mps|apc|aps|consumption function|saving function|inflationary gap|deflationary gap|aggregate demand|aggregate supply|rbi|reserve bank|monetary policy|repo rate|reverse repo|crr|slr|open market operations|fiscal deficit|revenue deficit|primary deficit|government budget|balance of payment|balance of payments|bop|current account deficit|capital account|autonomous transactions|accommodating transactions|foreign exchange rate|forex|depreciation of rupee|appreciation of rupee|money supply|m1|m2|m3|m4|indian economic development|ied|demographic transition|sustainable development|rural credit|self help group|human capital formation)\b/i;

  // 3. Accountancy Keywords
  var accRegex = /\b(debit|credit|journal|ledger|trial balance|balance sheet|p&l|profit and loss|appropriation|goodwill|super profit|capitalisation|revaluation|realisation|realization|sacrificing ratio|gaining ratio|debenture|debentures|share capital|forfeiture|reissue|pro-rata|prorata|cash flow statement|operating activities|investing activities|financing activities|ratio analysis|liquidity ratio|current ratio|quick ratio|debt to equity|proprietary ratio|interest coverage|inventory turnover|trade receivables turnover|return on investment|roi|interest on capital|interest on drawing|partner loan|capital reserve|provision|depreciation|bills receivable|bills payable)\b/i;

  if (bstRegex.test(combined)) return 'Business Studies';
  if (ecoRegex.test(combined)) return 'Economics';
  if (accRegex.test(combined)) return 'Accountancy';

  return 'Accountancy'; // Default fallback
}
