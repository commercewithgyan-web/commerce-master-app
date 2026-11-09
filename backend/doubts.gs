/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — VOICE FEYNMAN DOUBT ENGINE (doubts.gs)
 * Telegram .ogg Voice Note Pipeline, Multimodal Gemini Streaming,
 * Subject-Aware Isolation (Accountancy vs BST vs Economics),
 * Strict 2-Step Audio Grounding, and Formal Text Solver.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. SUBJECT-AWARE SEPARATION & DETECTION HELPERS
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
 * Returns strict subject boundary rules to inject into Gemini prompts.
 * Strictly prevents Accountancy jargon (Narrations, Debits, Ledgers) from contaminating BST/Economics.
 * 
 * @param {string} subject - 'Business Studies' | 'Economics' | 'Accountancy'
 * @return {string}
 */
function getSubjectBoundaryInstructions_(subject) {
  if (subject === 'Business Studies') {
    return (
      'STRICT SUBJECT BOUNDARY — BUSINESS STUDIES (BST):\n' +
      '- You are explaining a Business Studies (BST) concept.\n' +
      '- Explain strictly using Management principles, functions, organizational structures, and real-world company examples (e.g. Tata, Zomato, Apple, Infosys, Reliance).\n' +
      '- Structure answers using clear Headings and Subheadings.\n' +
      '- CRITICAL ABSOLUTE PROHIBITION: NEVER mention "Narration", "Journal Entry", "Debit", "Credit", "Ledger", "Balance Sheet", or "T-Account". Business Studies has ZERO journal entries and ZERO narrations. Giving Accountancy feedback on Business Studies is strictly prohibited.\n'
    );
  } else if (subject === 'Economics') {
    return (
      'STRICT SUBJECT BOUNDARY — ECONOMICS:\n' +
      '- You are explaining an Economics concept (Microeconomics / Macroeconomics / Indian Economic Development / Statistics).\n' +
      '- Focus on Economic logic, behavioral decision making, schedules, curves (Demand, Supply, Cost, Revenue, Forex, BOP), and monetary/fiscal mechanisms (RBI, Repo Rate, Government Budget).\n' +
      '- CRITICAL ABSOLUTE PROHIBITION: NEVER mention "Narration", "Journal Entry", "Debit", "Credit", "Ledger", or "Partnership Deed". Economics has ZERO narrations or ledger postings.\n'
    );
  } else {
    return (
      'STRICT SUBJECT BOUNDARY — ACCOUNTANCY:\n' +
      '- You are explaining an Accountancy concept (Partnership, Company Accounts, Cash Flow, Financial Ratios).\n' +
      '- Emphasize CBSE accounting standards, Debit/Credit rules, Ledger posting, Journal Entries, and accurate "Being..." narrations where required.\n'
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 2. VOICE NOTE PIPELINE (Telegram .ogg -> Gemini Multimodal)
// ─────────────────────────────────────────────────────────────────────

/**
 * Handles incoming voice notes from Telegram DM
 * Downloads raw .ogg audio, executes Strict Transcription Grounded prompt,
 * and replies with an intuitive everyday analogy grounded strictly on the transcribed question.
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
    var classLevel = student ? student.Class : 12;

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

    // 3. Build the Strict Transcription Grounded prompt
    var prompt = buildVoiceDoubtPrompt_({
      name: studentName,
      classLevel: classLevel
    });

    // 4. Invoke Gemini Multimodal with raw audio
    var geminiKey = props.getProperty('GEMINI_KEY');
    if (!geminiKey) throw new Error('GEMINI_KEY is missing');

    var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + geminiKey;
    var geminiPayload = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: 'audio/ogg',
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 350
      }
    };

    var geminiRes = UrlFetchApp.fetch(geminiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(geminiPayload),
      muteHttpExceptions: true
    });

    var rawResponse = '';
    if (geminiRes.getResponseCode() === 200) {
      var json = JSON.parse(geminiRes.getContentText());
      if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
        rawResponse = json.candidates[0].content.parts[0].text.trim();
      }
    }

    // Step 2 Grounding & Rejection Check (Never hallucinate or guess if silent/unintelligible)
    var isRejected = !rawResponse ||
                     rawResponse.toLowerCase().indexOf('could not hear your voice clearly') !== -1 ||
                     rawResponse.toLowerCase().indexOf('was not clear') !== -1 ||
                     rawResponse.toLowerCase().indexOf('speak again') !== -1 ||
                     rawResponse.toLowerCase().indexOf('closer to the mic') !== -1;

    if (isRejected) {
      var rejectMsg = 'Sorry, your voice was not clear. Please speak closer to the mic and ask again!';
      sendTelegramMessage_(chatId, '⚠️ *Study Buddy Notice*:\n\n' + rejectMsg);
      return;
    }

    // Step 3 Parse Grounded Explanation Tags
    var parsed = parseVoiceExplanationTags_(rawResponse, studentName);
    var detectedSubj = detectCommerceSubject_(parsed.transcript || parsed.explanation, '', '');

    // 5. Deliver friendly grounded reply to student
    var replyText = '';
    if (parsed.transcript) {
      replyText += '🎙️ *Question heard:* "' + parsed.transcript + '"\n';
      replyText += '📚 *Subject:* ' + detectedSubj + '\n\n';
    }
    replyText += '💡 *Simple Explanation:*\n\n' + parsed.explanation;

    if (parsed.keyRule) {
      replyText += '\n\n⭐ *Golden Rule:* ' + parsed.keyRule;
    }
    if (parsed.cbseTrap) {
      replyText += '\n⚠️ *CBSE Trap:* ' + parsed.cbseTrap;
    }

    sendTelegramMessage_(chatId, replyText, {
      inline_keyboard: [
        [{ text: '📓 Save to My Notes', callback_data: 'save_note_last' }],
        [{ text: '📱 Practice Related MCQ', callback_data: 'cmd_practice' }]
      ]
    });

    // 6. Log to Sheet 2 (Doubts tab) with true transcribed question
    appendRow_('SHEET_QB', 'Doubts', [
      getKolkataTimestamp(),
      String(chatId),
      studentName,
      parsed.transcript || ('[Voice Note: ' + duration + 's]'),
      parsed.explanation,
      'voice_telegram',
      duration,
      detectedSubj,
      'Everyday Analogies',
      'Answered'
    ]);

    Logger.log('🎙️ Grounded Voice Doubt (' + detectedSubj + ') resolved for ' + studentName + ' in ' + duration + 's');

  } catch (err) {
    logError_('handleVoiceDoubt_', err);
    sendTelegramMessage_(chatId,
      '⚠️ *Study Buddy Notice*: Sorry, your voice was not clear. Please speak closer to the mic and ask again!'
    );
  }
}

/**
 * Builds the hidden system prompt for Voice Doubts.
 * Enforces Mandatory 2-Step Audio Grounding and Strict Subject Boundaries.
 * 
 * @param {Object} ctx - { name, classLevel }
 * @return {string}
 */
function buildVoiceDoubtPrompt_(ctx) {
  var name = ctx.name || 'Student';
  var classLevel = ctx.classLevel || 12;

  return (
    'You are Gyan Sir\'s AI Study Mentor for ' + name + ', a CBSE Class ' + classLevel + ' Commerce student.\n' +
    'INPUT: An audio recording from the student asking an academic doubt in Accountancy, Business Studies (BST), or Economics.\n\n' +
    'MANDATORY 2-STEP AUDIO GROUNDING & INSTRUCTIONS:\n' +
    'Step 1: First listen to the student\'s audio and transcribe exactly what was spoken.\n' +
    'Step 2: If the audio is silent, unclear, background noise, or not an academic question, reply ONLY:\n' +
    'Sorry, your voice was not clear. Please speak closer to the mic and ask again!\n' +
    'DO NOT GUESS OR INVENT ANY TOPIC. Never assume or talk about topics the student did not ask about.\n' +
    'Step 3: Answer STRICTLY the question transcribed in Step 1 using a simple everyday Indian story/analogy (under 120 words).\n\n' +
    'CRITICAL SUBJECT BOUNDARIES:\n' +
    '1. If the question is about Business Studies (BST) (e.g. Fayol, Taylor, management, planning, organising, staffing, directing, controlling, marketing, consumer protection, financial management):\n' +
    '   - Explain using Management concepts, real company examples (Tata, Zomato, Apple), and Headings/Subheadings.\n' +
    '   - STRICT PROHIBITION: NEVER mention "Narration", "Journal Entry", "Debit", "Credit", or "Ledger". Business Studies has ZERO narrations and ZERO journal entries.\n' +
    '2. If the question is about Economics (e.g. demand, supply, elasticity, national income, gdp, inflation, rbi, ppf, balance of payments, government budget):\n' +
    '   - Focus on Economic concepts, schedules, and curves. Never mention narrations or ledger rules.\n' +
    '3. Only if the question is strictly about Accountancy (e.g. debentures, shares, partnership, financial statements, cash flow):\n' +
    '   - Discuss Debits, Credits, Ledger posting, and Journal narrations.\n\n' +
    'OUTPUT FORMAT (STRICT):\n' +
    '[TRANSCRIPT]: <exact words spoken by the student>\n' +
    '[EXPLANATION]: Hey ' + name + '! <Explain ONLY what was transcribed using a simple everyday Indian story/analogy under 120 words. Zero dry jargon first. Connect to official CBSE syllabus term in 1 crisp sentence.>\n' +
    '[KEY_RULE]: <1 crisp golden rule under 10 words>\n' +
    '[CBSE_TRAP]: <1 common examiner trap to avoid under 15 words>'
  );
}

/**
 * Backward compatibility alias for buildVoiceDoubtPrompt_
 */
function buildELI10VoicePrompt_(ctx) {
  return buildVoiceDoubtPrompt_(ctx);
}

/**
 * Helper to parse [TRANSCRIPT], [EXPLANATION], [KEY_RULE], [CBSE_TRAP] tags
 * 
 * @param {string} text
 * @param {string} defaultName
 * @return {{ transcript: string, explanation: string, keyRule: string, cbseTrap: string }}
 */
function parseVoiceExplanationTags_(text, defaultName) {
  var transcript = '';
  var explanation = '';
  var keyRule = '';
  var cbseTrap = '';

  var tMatch = text.match(/\[TRANSCRIPT\]:\s*([^\n]+)/i);
  if (tMatch) transcript = tMatch[1].trim().replace(/^["']|["']$/g, '');

  var eMatch = text.match(/\[EXPLANATION\]:\s*([\s\S]+?)(?=\[(?:KEY_RULE|CBSE_TRAP)\]|$)/i);
  if (eMatch) explanation = eMatch[1].trim();

  var kMatch = text.match(/\[KEY_RULE\]:\s*([^\n]+)/i);
  if (kMatch) keyRule = kMatch[1].trim();

  var cMatch = text.match(/\[CBSE_TRAP\]:\s*([^\n]+)/i);
  if (cMatch) cbseTrap = cMatch[1].trim();

  if (!explanation) {
    explanation = text.replace(/\[(?:TRANSCRIPT|KEY_RULE|CBSE_TRAP)\]:[^\n]*/gi, '').trim();
  }
  if (!explanation) {
    explanation = 'Hey ' + defaultName + '! Let me explain that concept simply.';
  }

  return {
    transcript: transcript,
    explanation: explanation,
    keyRule: keyRule || 'Concept clarity precedes calculation.',
    cbseTrap: cbseTrap || 'Read the question terms and requirements carefully.'
  };
}

/**
 * Handles voice doubt queries from Mini App (doubt.html via browser MediaRecorder)
 * Transcribes real audio and answers strictly grounded on the spoken question.
 * 
 * @param {Object} verifiedUser
 * @param {Object} payload - { audioBase64, mimeType, duration }
 * @return {Object}
 */
function apiAskVoiceDoubt_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  var base64Audio = payload.audioBase64;
  if (!base64Audio) throw new Error('Audio data is required');

  // Detect real audio MIME type cleanly
  var rawMimeType = (payload.mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
  var mimeType = rawMimeType;
  if (mimeType.indexOf('webm') !== -1) mimeType = 'audio/webm';
  else if (mimeType.indexOf('ogg') !== -1) mimeType = 'audio/ogg';
  else if (mimeType.indexOf('mp4') !== -1) mimeType = 'audio/mp4';
  else if (mimeType.indexOf('wav') !== -1) mimeType = 'audio/wav';
  else if (mimeType.indexOf('mp3') !== -1 || mimeType.indexOf('mpeg') !== -1) mimeType = 'audio/mp3';
  else if (mimeType.indexOf('aac') !== -1) mimeType = 'audio/aac';
  else mimeType = 'audio/webm';

  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) throw new Error('GEMINI_KEY is missing');

  var studentName = student.Name || verifiedUser.first_name || 'Student';
  var classLevel = student.Class || 12;

  var prompt = buildVoiceDoubtPrompt_({
    name: studentName,
    classLevel: classLevel
  });

  var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + geminiKey;
  var geminiPayload = {
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
      temperature: 0.2,
      maxOutputTokens: 350
    }
  };

  var response = UrlFetchApp.fetch(geminiUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(geminiPayload),
    muteHttpExceptions: true
  });

  var rawResponse = '';
  if (response.getResponseCode() === 200) {
    var json = JSON.parse(response.getContentText());
    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts) {
      rawResponse = json.candidates[0].content.parts[0].text.trim();
    }
  }

  // Step 2 Grounding & Rejection Check
  var isRejected = !rawResponse ||
                   rawResponse.toLowerCase().indexOf('could not hear your voice clearly') !== -1 ||
                   rawResponse.toLowerCase().indexOf('was not clear') !== -1 ||
                   rawResponse.toLowerCase().indexOf('speak again') !== -1 ||
                   rawResponse.toLowerCase().indexOf('closer to the mic') !== -1;

  if (isRejected) {
    var rejectMsg = 'Sorry, your voice was not clear. Please speak closer to the mic and ask again!';
    return {
      isRejected: true,
      studentName: studentName,
      message: rejectMsg
    };
  }

  // Step 3 Parse Grounded Explanation Tags
  var parsed = parseVoiceExplanationTags_(rawResponse, studentName);
  var detectedSubj = detectCommerceSubject_(parsed.transcript || parsed.explanation, '', '');

  var followUps = ['Explain simpler', 'Give another example'];
  if (detectedSubj === 'Business Studies') {
    followUps = ['Corporate example', 'Heading breakdown', 'CBSE case study tip'];
  } else if (detectedSubj === 'Economics') {
    followUps = ['Curve explanation', 'Economic schedule', 'Indian economy example'];
  } else {
    followUps = ['Calculation example', 'Journal entry', 'Ledger account'];
  }

  // Log to Sheet 2
  appendRow_('SHEET_QB', 'Doubts', [
    getKolkataTimestamp(),
    String(verifiedUser.id),
    studentName,
    parsed.transcript || '[Voice Note]',
    parsed.explanation,
    'voice_webapp',
    payload.duration || 0,
    detectedSubj,
    'Everyday Analogies',
    'Answered'
  ]);

  return {
    isRejected: false,
    studentName: studentName,
    subject: detectedSubj,
    transcribed: parsed.transcript,
    answer: parsed.explanation,
    keyTakeaway: parsed.keyRule,
    cbseTrap: parsed.cbseTrap,
    followUpSuggestions: followUps
  };
}

// ─────────────────────────────────────────────────────────────────────
// 3. TEXT DOUBT ENGINE (Mini App Formal Solver)
// ─────────────────────────────────────────────────────────────────────

/**
 * Handles text-based doubt queries from Mini App (doubt.html)
 * Enforces strict subject boundaries so Business Studies never receives Accountancy advice.
 * 
 * @param {Object} verifiedUser
 * @param {Object} payload - { question, subject, chapter }
 * @return {Object}
 */
function apiAskDoubt_(verifiedUser, payload) {
  var student = requirePaidStudent_(verifiedUser.id);
  var questionText = (payload.question || '').trim();
  if (!questionText) throw new Error('Question text is required');

  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) throw new Error('GEMINI_KEY is missing');

  var classLevel = student.Class || 12;

  // Strict subject detection
  var subject = detectCommerceSubject_(questionText, payload.subject, payload.chapter);
  var chapter = payload.chapter || (subject === 'Business Studies' ? 'Principles of Management' : (subject === 'Economics' ? 'Money and Banking' : 'Partnership Fundamentals'));

  var subjectInstructions = getSubjectBoundaryInstructions_(subject);

  // Subject-specific follow up suggestions
  var sampleFollowUps = [];
  if (subject === 'Business Studies') {
    sampleFollowUps = ['Explain with real company example', 'Key heading points for CBSE', 'Common case study trap'];
  } else if (subject === 'Economics') {
    sampleFollowUps = ['Explain schedule & curve', 'Indian economy practical case', 'Key assumptions to remember'];
  } else {
    sampleFollowUps = ['Explain with calculation', 'Show journal entry', 'Show ledger account'];
  }

  var hiddenPrompt =
    'You are Gyan Sir, an expert CBSE Commerce teacher answering a student\'s academic doubt.\n\n' +
    'STUDENT: ' + student.Name + ' (Class ' + classLevel + ' ' + subject + ')\n' +
    'CHAPTER: ' + chapter + '\n' +
    'STUDENT QUESTION: "' + questionText + '"\n\n' +
    subjectInstructions + '\n' +
    'DIRECTIVE:\n' +
    '1. Provide a crystal-clear, structured CBSE answer under 150 words.\n' +
    '2. If calculation (Accountancy/Economics): show formula, step substitution, and final answer with ₹.\n' +
    '3. If Business Studies: use Headings/Subheadings and mention real company cases (e.g. Tata, Zomato, Apple). NEVER mention narrations or journal entries.\n' +
    '4. Highlight 1 Common CBSE Trap that examiners watch for.\n' +
    '5. Return STRICT JSON:\n' +
    '{\n' +
    '  "answer": "Structured markdown explanation",\n' +
    '  "keyTakeaway": "1-line golden rule to memorize",\n' +
    '  "cbseTrap": "Examiner trap warning",\n' +
    '  "followUpSuggestions": ' + JSON.stringify(sampleFollowUps) + '\n' +
    '}';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + geminiKey;
  var geminiPayload = {
    contents: [{ parts: [{ text: hiddenPrompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  var resData = null;
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(geminiPayload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      var json = JSON.parse(response.getContentText());
      var raw = json.candidates[0].content.parts[0].text;
      resData = JSON.parse(raw);
    }
  } catch (e) {
    logError_('apiAskDoubt_', e);
  }

  // Subject-specific fallback (zero cross-subject leakage)
  if (!resData) {
    if (subject === 'Business Studies') {
      resData = {
        answer: 'According to CBSE guidelines for Business Studies (' + chapter + '), structure answers using clear Headings, Subheadings, and corporate examples (e.g., Tata, Zomato). Never mix accounting narrations into BST theory.',
        keyTakeaway: 'Examiners award marks specifically for NCERT headings.',
        cbseTrap: 'Writing long paragraphs without headings loses presentation marks.',
        followUpSuggestions: sampleFollowUps
      };
    } else if (subject === 'Economics') {
      resData = {
        answer: 'According to CBSE guidelines for Economics (' + chapter + '), always define the concept clearly, state assumptions (ceteris paribus), and explain using schedule and curve analysis.',
        keyTakeaway: 'Always state economic assumptions before concluding.',
        cbseTrap: 'Failing to label axes on diagrams costs marks.',
        followUpSuggestions: sampleFollowUps
      };
    } else {
      resData = {
        answer: 'According to CBSE guidelines for Accountancy (' + chapter + '), ensure all charges are debited to P&L before distributing appropriations.',
        keyTakeaway: 'Charges come before Appropriations.',
        cbseTrap: 'Do not deduct manager commission inside P&L Appropriation.',
        followUpSuggestions: sampleFollowUps
      };
    }
  }

  // Log to Sheet 2 Doubts
  appendRow_('SHEET_QB', 'Doubts', [
    getKolkataTimestamp(),
    String(verifiedUser.id),
    student.Name,
    questionText,
    resData.answer,
    'text',
    0,
    subject,
    'CBSE Rubric',
    'Answered'
  ]);

  return {
    studentName: student.Name,
    subject: subject,
    question: questionText,
    answer: resData.answer,
    keyTakeaway: resData.keyTakeaway,
    cbseTrap: resData.cbseTrap,
    followUpSuggestions: resData.followUpSuggestions
  };
}

// ─────────────────────────────────────────────────────────────────────
// 4. STUDENT CONTEXT LOADER HELPER
// ─────────────────────────────────────────────────────────────────────

/**
 * Loads student's recent mistakes and weak topics for dynamic personalization
 * @param {string|number} telegramId
 * @return {{ weakTopics: string, recentMistakes: string }}
 */
function getStudentDiagnosticContext_(telegramId) {
  var weakTopics = [];
  var recentMistakes = [];

  try {
    var answers = findRows_('SHEET_QB', 'StudentAnswers', 'TelegramID', String(telegramId));
    var qBank = getAllRowsAsObjects_('SHEET_QB', 'QuestionBank', 1000);
    var qMap = {};
    qBank.forEach(function(q) { qMap[q.QID] = q; });

    answers.slice(-10).forEach(function(a) {
      if (parseInt(a.Score, 10) === 0) {
        var q = qMap[a.QID];
        if (q) {
          recentMistakes.push(q.Topic || q.Chapter);
          if (weakTopics.indexOf(q.Topic) === -1) {
            weakTopics.push(q.Topic);
          }
        }
      }
    });
  } catch (e) {
    // Non-fatal
  }

  return {
    weakTopics: weakTopics.slice(0, 3).join(', ') || 'Partnership Fundamentals',
    recentMistakes: recentMistakes.slice(0, 2).join(', ') || 'Charge vs Appropriation'
  };
}
