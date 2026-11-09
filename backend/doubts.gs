/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — VOICE FEYNMAN DOUBT ENGINE (doubts.gs)
 * Telegram .ogg Voice Note Pipeline, Multimodal Gemini 2.5 Flash Streaming,
 * "10-Year-Old Kid" (ELI10) Everyday Indian Analogies, and Formal Text Solver.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. VOICE NOTE PIPELINE (Telegram .ogg -> Gemini Multimodal)
// ─────────────────────────────────────────────────────────────────────

/**
 * Handles incoming voice notes from Telegram DM
 * Downloads raw .ogg audio, executes Strict Transcription Grounded ELI10 prompt,
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

    // 3. Build the Strict Transcription Grounded ELI10 prompt
    var prompt = buildELI10VoicePrompt_({
      name: studentName,
      classLevel: classLevel
    });

    // 4. Invoke Gemini 2.5 Flash Multimodal with raw audio
    var geminiKey = props.getProperty('GEMINI_KEY');
    if (!geminiKey) throw new Error('GEMINI_KEY is missing');

    var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiKey;
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
                     rawResponse.toLowerCase().indexOf('speak again') !== -1;

    if (isRejected) {
      var rejectMsg = 'Sorry ' + studentName + ', I could not hear your voice clearly. Please speak again!';
      sendTelegramMessage_(chatId, '⚠️ *Study Buddy Notice*:\n\n' + rejectMsg);
      return;
    }

    // Step 3 Parse Grounded Explanation Tags
    var parsed = parseVoiceExplanationTags_(rawResponse, studentName);

    // 5. Deliver friendly grounded reply to student
    var replyText = '';
    if (parsed.transcript) {
      replyText += '🎙️ *Question heard:* "' + parsed.transcript + '"\n\n';
    }
    replyText += '🎧 *Study Buddy Explanation:*\n\n' + parsed.explanation;

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
      'ELI10_Grounded',
      'Indian Everyday Analogies',
      'Answered'
    ]);

    Logger.log('🎙️ Grounded Voice Doubt resolved for ' + studentName + ' in ' + duration + 's');

  } catch (err) {
    logError_('handleVoiceDoubt_', err);
    sendTelegramMessage_(chatId,
      '⚠️ *Study Buddy Notice*: Sorry ' + studentName + ', I could not hear your voice clearly. Please speak again!'
    );
  }
}

/**
 * Builds the hidden system prompt for the Voice Feynman Engine ("10-Year-Old Kid")
 * Strictly enforces 3-step transcription grounding to prevent hallucination.
 * 
 * @param {Object} ctx - { name, classLevel }
 * @return {string}
 */
function buildELI10VoicePrompt_(ctx) {
  var name = ctx.name || 'Student';
  var classLevel = ctx.classLevel || 12;

  return (
    'You are Gyan Sir\'s "Study Buddy" voice mentor for ' + name + ', a CBSE Class ' + classLevel + ' Commerce student.\n' +
    'INPUT: An audio recording from the student asking a question.\n\n' +
    'STRICT TRANSCRIPTION & GROUNDING INSTRUCTIONS:\n' +
    'Step 1 — Transcribe:\n' +
    'Listen carefully to the audio and transcribe the student\'s exact spoken question.\n\n' +
    'Step 2 — Silence / Unintelligible Rejection:\n' +
    'If the audio is silent, unintelligible, muffled noise, background music, or contains NO clear question, you MUST output EXACTLY this rejection string and NOTHING else:\n' +
    'Sorry ' + name + ', I could not hear your voice clearly. Please speak again!\n' +
    'NEVER hallucinate, guess topics, or talk about partnership, goodwill, or loans if the student did not say them.\n\n' +
    'Step 3 — Grounded "10-Year-Old Kid" (ELI10) Story:\n' +
    'Answer ONLY what was actually spoken in the transcribed audio. Do NOT inject unrelated topics.\n' +
    'Output format MUST be strictly structured as follows:\n' +
    '[TRANSCRIPT]: <exact words spoken by the student>\n' +
    '[EXPLANATION]: Hey ' + name + '! <Explain ONLY what the student asked using an intuitive, everyday Indian analogy like street food/pani puri, cricket bat/gully cricket, pocket money, or sweets. Zero dry jargon first. Under 100 words.> <Connect to the official CBSE commerce term in 1 crisp sentence.> Did that click, or should I give you another story?\n' +
    '[KEY_RULE]: <1 crisp golden rule under 10 words>\n' +
    '[CBSE_TRAP]: <1 common examiner trap to avoid under 15 words>'
  );
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
    cbseTrap: cbseTrap || 'Read the question terms and dates carefully.'
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

  var rawMimeType = (payload.mimeType || 'audio/webm').split(';')[0].trim();
  var mimeType = rawMimeType;
  if (mimeType.indexOf('webm') !== -1) mimeType = 'audio/webm';
  else if (mimeType.indexOf('ogg') !== -1) mimeType = 'audio/ogg';
  else if (mimeType.indexOf('mp4') !== -1) mimeType = 'audio/mp4';
  else if (mimeType.indexOf('wav') !== -1) mimeType = 'audio/wav';
  else if (mimeType.indexOf('mp3') !== -1) mimeType = 'audio/mp3';
  else mimeType = 'audio/webm';

  var props = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty('GEMINI_KEY');
  if (!geminiKey) throw new Error('GEMINI_KEY is missing');

  var studentName = student.Name || verifiedUser.first_name || 'Student';
  var classLevel = student.Class || 12;

  var prompt = buildELI10VoicePrompt_({
    name: studentName,
    classLevel: classLevel
  });

  var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiKey;
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
                   rawResponse.toLowerCase().indexOf('speak again') !== -1;

  if (isRejected) {
    var rejectMsg = 'Sorry ' + studentName + ', I could not hear your voice clearly. Please speak again!';
    return {
      isRejected: true,
      studentName: studentName,
      message: rejectMsg
    };
  }

  // Step 3 Parse Grounded Explanation Tags
  var parsed = parseVoiceExplanationTags_(rawResponse, studentName);

  // Log to Sheet 2
  appendRow_('SHEET_QB', 'Doubts', [
    getKolkataTimestamp(),
    String(verifiedUser.id),
    studentName,
    parsed.transcript || '[Voice Note]',
    parsed.explanation,
    'voice_webapp',
    payload.duration || 0,
    'ELI10_Grounded',
    'Indian Everyday Analogies',
    'Answered'
  ]);

  return {
    isRejected: false,
    studentName: studentName,
    transcribed: parsed.transcript,
    answer: parsed.explanation,
    keyTakeaway: parsed.keyRule,
    cbseTrap: parsed.cbseTrap,
    followUpSuggestions: ['Explain simpler', 'Give another example']
  };
}

// ─────────────────────────────────────────────────────────────────────
// 2. TEXT DOUBT ENGINE (Mini App Formal Solver)
// ─────────────────────────────────────────────────────────────────────

/**
 * Handles text-based doubt queries from Mini App (doubt.html)
 * Returns formal exam-standard definitions, CBSE rubric breakdowns, and follow-ups.
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
  var subject = payload.subject || 'Accountancy';
  var chapter = payload.chapter || 'Partnership Fundamentals';

  var hiddenPrompt =
    'You are Gyan Sir, an expert CBSE Commerce teacher answering a student\'s doubt.\n\n' +
    'STUDENT: ' + student.Name + ' (Class ' + classLevel + ' ' + subject + ')\n' +
    'CHAPTER: ' + chapter + '\n' +
    'STUDENT QUESTION: "' + questionText + '"\n\n' +
    'DIRECTIVE:\n' +
    '1. Provide a crystal-clear, structured CBSE answer under 150 words.\n' +
    '2. If calculation: show formula, step substitution, and final answer with ₹.\n' +
    '3. Highlight 1 Common CBSE Trap that examiners watch for.\n' +
    '4. Format cleanly with markdown bullet points.\n' +
    '5. Return STRICT JSON:\n' +
    '{\n' +
    '  "answer": "Structured markdown explanation",\n' +
    '  "keyTakeaway": "1-line golden rule to memorize",\n' +
    '  "cbseTrap": "Examiner trap warning",\n' +
    '  "followUpSuggestions": ["Explain with simpler example", "Give a practical calculation", "Show journal entry"]\n' +
    '}';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiKey;
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

  if (!resData) {
    resData = {
      answer: 'According to CBSE guidelines for ' + chapter + ', ensure all charges are debited to P&L before distributing appropriations.',
      keyTakeaway: 'Charges come before Appropriations.',
      cbseTrap: 'Do not deduct manager commission inside P&L Appropriation.',
      followUpSuggestions: ['Explain simpler', 'Give example']
    };
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
    'Standard_Academic',
    'CBSE Rubric',
    'Answered'
  ]);

  return {
    studentName: student.Name,
    question: questionText,
    answer: resData.answer,
    keyTakeaway: resData.keyTakeaway,
    cbseTrap: resData.cbseTrap,
    followUpSuggestions: resData.followUpSuggestions
  };
}

// ─────────────────────────────────────────────────────────────────────
// 3. STUDENT CONTEXT LOADER HELPER
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
