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
  var cleanName = (studentName || 'Champ').trim().split(' ')[0] || 'Champ';

  var systemPrompt =
    'You are Gyan Sir, the warm, elite, and inspiring CBSE Commerce mentor for Class 11 & 12 students.\n' +
    'STUDENT NAME: ' + cleanName + '\n' +
    'SUBJECT: ' + targetSubject + '\n' +
    'STUDENT QUESTION: "' + question + '"\n\n' +
    'STRICT PEDAGOGICAL BOUNDARIES:\n' +
    '1. If SUBJECT is Business Studies (BST):\n' +
    '   - Focus strictly on Management Principles, Functions, Headings, and Subheadings.\n' +
    '   - STRICT PROHIBITION: NEVER mention "Narration", "Journal Entry", "Debit", or "Credit". BST has ZERO journal entries and ZERO narrations.\n' +
    '2. If SUBJECT is Economics:\n' +
    '   - Focus strictly on Economic concepts, schedules, formulas ($E_d$, MPC, etc.), and curves. No accounting ledger rules.\n' +
    '3. If SUBJECT is Accountancy:\n' +
    '   - Focus strictly on Accounting Standards, Double Entry principles, Journal entries with narrations, and Ledger postings.\n\n' +
    'MANDATORY PERSONAL TONE & STRUCTURE INSTRUCTIONS:\n' +
    '- "story": MUST start with: "Hey ' + cleanName + '! Don\'t stress about this at all—let\'s crack it in 30 seconds just like we do in class!" followed by an engaging everyday Indian analogy (street food, cricket, pocket money, Netflix, Shark Tank) under 110 words.\n' +
    '- "exam_notes": MUST start with: "Here are your exact CBSE full-marks register notes, ' + cleanName + ':\n" followed by 3 numbered bullet points using **bold keywords** ready for copying directly into the student\'s revision register.\n' +
    '- "real_example": MUST start with: "Let\'s see how real Indian businesses use this, ' + cleanName + ':\n" followed by a real corporate example (Tata, Zomato, Reliance, boAt) under 100 words.\n' +
    '- "golden_rule": 1 crisp golden rule to memorize under 15 words.\n' +
    '- "cbse_trap": 1 common CBSE examiner trap to avoid under 15 words.\n\n' +
    'OUTPUT SPECIFICATION:\n' +
    'Return STRICT JSON with these exact keys:\n' +
    '{\n' +
    '  "subject": "' + targetSubject + '",\n' +
    '  "student_name": "' + cleanName + '",\n' +
    '  "topic_title": "<3-4 word clean topic name e.g. Gaining Ratio Calculation>",\n' +
    '  "story": "<Warm, personal story addressing ' + cleanName + '...>",\n' +
    '  "exam_notes": "<Exact CBSE register notes with **bold keywords**...>",\n' +
    '  "real_example": "<Real Indian corporate example...>",\n' +
    '  "golden_rule": "<1-sentence CBSE Golden Rule>",\n' +
    '  "cbse_trap": "<1-sentence CBSE Exam Trap to avoid>"\n' +
    '}';

  var payload = {
    contents: [{ parts: [{ text: systemPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  var json = callGeminiGenerateContent_(payload);
  if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
    var raw = json.candidates[0].content.parts[0].text;
    var parsed = JSON.parse(raw);

    var storyText = parsed.story || (parsed.lenses ? parsed.lenses.STORY : '') || parsed.answer || '';
    var notesText = parsed.exam_notes || (parsed.lenses ? parsed.lenses.EXAM_NOTES : '') || '';
    var realText = parsed.real_example || (parsed.lenses ? parsed.lenses.REAL_EXAMPLE : '') || '';
    var ruleText = parsed.golden_rule || parsed.keyRule || parsed.keyTakeaway || '';
    var trapText = parsed.cbse_trap || parsed.cbseTrap || '';
    var topicTitle = parsed.topic_title || extractTopicTitle_(question);

    return {
      subject: targetSubject,
      studentName: cleanName,
      topicTitle: topicTitle,
      story: storyText,
      exam_notes: notesText,
      real_example: realText,
      golden_rule: ruleText,
      cbse_trap: trapText,
      answer: storyText,
      lenses: {
        STORY: storyText,
        EXAM_NOTES: notesText,
        REAL_EXAMPLE: realText
      },
      keyRule: ruleText,
      cbseTrap: trapText
    };
  }

  throw new Error('Invalid response structure from Gemini API');
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

  // Duplicate check: prevent duplicate doubt insertion within 60 seconds
  var cache = CacheService.getScriptCache();
  var cleanQ = (questionText || '').toLowerCase().trim();
  var dupKey = 'DOUBT_LOG_' + verifiedUser.id + '_' + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, cleanQ)).slice(0, 16);
  if (!cache.get(dupKey)) {
    cache.put(dupKey, '1', 60);
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
  } else {
    Logger.log('Duplicate doubt suppressed within 60s for student ' + verifiedUser.id);
  }

  return {
    ok: true,
    isRejected: false,
    studentName: studentName,
    subject: subject,
    topicTitle: result.topicTitle || extractTopicTitle_(questionText),
    question: questionText,
    transcribed: questionText,
    story: result.story,
    exam_notes: result.exam_notes,
    real_example: result.real_example,
    golden_rule: result.golden_rule,
    cbse_trap: result.cbse_trap,
    lenses: result.lenses || {},
    answer: result.story || (result.lenses ? result.lenses.STORY : ''),
    activeLens: 'story',
    keyTakeaway: result.golden_rule,
    keyRule: result.golden_rule,
    cbseTrap: result.cbse_trap
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

  // 3. Log to Sheet 2 with 60-second duplicate protection
  var cache = CacheService.getScriptCache();
  var cleanVoiceQ = (transcribedQuestion || '').toLowerCase().trim();
  var voiceDupKey = 'DOUBT_LOG_' + verifiedUser.id + '_' + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, cleanVoiceQ)).slice(0, 16);
  if (!cache.get(voiceDupKey)) {
    cache.put(voiceDupKey, '1', 60);
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
  } else {
    Logger.log('Duplicate voice doubt suppressed within 60s for student ' + verifiedUser.id);
  }

  return {
    ok: true,
    isRejected: false,
    studentName: studentName,
    subject: finalSubject,
    topicTitle: result.topicTitle || extractTopicTitle_(transcribedQuestion),
    question: transcribedQuestion,
    transcribed: transcribedQuestion,
    story: result.story,
    exam_notes: result.exam_notes,
    real_example: result.real_example,
    golden_rule: result.golden_rule,
    cbse_trap: result.cbse_trap,
    lenses: result.lenses || {},
    answer: result.story || (result.lenses ? result.lenses.STORY : ''),
    activeLens: 'story',
    keyTakeaway: result.golden_rule,
    keyRule: result.golden_rule,
    cbseTrap: result.cbse_trap
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

  try {
    var json = callGeminiGenerateContent_(payload);
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
  } catch (voiceErr) {
    Logger.log('Voice transcription note: ' + voiceErr.message);
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

/**
 * Extracts a clean 3-4 word topic title from a student question
 * @param {string} question
 * @return {string}
 */
function extractTopicTitle_(question) {
  if (!question) return 'Core Concept';
  var clean = String(question).replace(/^(sir|please|can you explain|what is|how to calculate|difference between|explain|tell me)\s+/i, '').trim();
  var words = clean.split(/\s+/).slice(0, 4).join(' ');
  return words ? (words.charAt(0).toUpperCase() + words.slice(1)) : 'Core Concept';
}
