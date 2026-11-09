/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — TELEGRAM BOT API & ROUTER (telegram.gs)
 * Multipart document uploader, text chunking, inline keyboards,
 * and command dispatcher for Admin & Students.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Returns the Telegram Bot API base URL
 * @return {string}
 */
function getTelegramApiUrl_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('BOT_TOKEN');
  if (!token) throw new Error('CONFIG_ERROR: BOT_TOKEN is missing');
  return 'https://api.telegram.org/bot' + token + '/';
}

/**
 * Sends a text message to a Telegram chat with automatic chunking for >4000 chars
 * @param {string|number} chatId
 * @param {string} text
 * @param {Object} [replyMarkup]
 * @return {Object} Telegram API response
 */
function sendTelegramMessage_(chatId, text, replyMarkup) {
  var chunks = chunkText_(text, 4000);
  var lastRes = null;

  for (var i = 0; i < chunks.length; i++) {
    var payload = {
      chat_id: String(chatId),
      text: chunks[i],
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };

    // Attach keyboard markup only to the last chunk
    if (i === chunks.length - 1 && replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    try {
      lastRes = callTelegramApi_('sendMessage', payload);
    } catch (mdErr) {
      // Fallback: If Markdown parsing fails, send as plain text
      delete payload.parse_mode;
      lastRes = callTelegramApi_('sendMessage', payload);
    }
  }

  return lastRes;
}

/**
 * Sends a document (PDF, file) via multipart/form-data upload using raw binary Blob.
 * Law C-5: Never sends Google Drive HTML URLs to Telegram.
 * @param {string|number} chatId
 * @param {GoogleAppsScript.Base.Blob} blob
 * @param {string} filename
 * @param {string} [caption]
 * @return {Object}
 */
function sendTelegramDocument_(chatId, blob, filename, caption) {
  var boundary = '-----CommerceGyanMultipart' + Utilities.getUuid();
  var blobBytes = blob.getBytes();

  // Construct multipart/form-data body
  var body = Utilities.newBlob('').getBytes();

  var textParts = [
    '--' + boundary + '\r\n',
    'Content-Disposition: form-data; name="chat_id"\r\n\r\n',
    String(chatId) + '\r\n'
  ];

  if (caption) {
    textParts.push(
      '--' + boundary + '\r\n',
      'Content-Disposition: form-data; name="caption"\r\n\r\n',
      caption + '\r\n',
      '--' + boundary + '\r\n',
      'Content-Disposition: form-data; name="parse_mode"\r\n\r\n',
      'Markdown\r\n'
    );
  }

  textParts.push(
    '--' + boundary + '\r\n',
    'Content-Disposition: form-data; name="document"; filename="' + (filename || blob.getName() || 'document.pdf') + '"\r\n',
    'Content-Type: ' + (blob.getContentType() || 'application/pdf') + '\r\n\r\n'
  );

  var headerBytes = Utilities.newBlob(textParts.join('')).getBytes();
  var footerBytes = Utilities.newBlob('\r\n--' + boundary + '--\r\n').getBytes();

  var fullPayload = [].concat(headerBytes, blobBytes, footerBytes);

  var options = {
    method: 'post',
    contentType: 'multipart/form-data; boundary=' + boundary,
    payload: fullPayload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(getTelegramApiUrl_() + 'sendDocument', options);
  var json = JSON.parse(response.getContentText());

  if (!json.ok) {
    throw new Error('Telegram sendDocument failed: ' + json.description);
  }

  return json;
}

/**
 * Sends a photo to a Telegram chat via multipart Blob upload
 * @param {string|number} chatId
 * @param {GoogleAppsScript.Base.Blob} photoBlob
 * @param {string} [caption]
 * @return {Object}
 */
function sendTelegramPhoto_(chatId, photoBlob, caption) {
  var boundary = '-----CommerceGyanPhoto' + Utilities.getUuid();
  var photoBytes = photoBlob.getBytes();

  var textParts = [
    '--' + boundary + '\r\n',
    'Content-Disposition: form-data; name="chat_id"\r\n\r\n',
    String(chatId) + '\r\n'
  ];

  if (caption) {
    textParts.push(
      '--' + boundary + '\r\n',
      'Content-Disposition: form-data; name="caption"\r\n\r\n',
      caption + '\r\n',
      '--' + boundary + '\r\n',
      'Content-Disposition: form-data; name="parse_mode"\r\n\r\n',
      'Markdown\r\n'
    );
  }

  textParts.push(
    '--' + boundary + '\r\n',
    'Content-Disposition: form-data; name="photo"; filename="' + (photoBlob.getName() || 'photo.jpg') + '"\r\n',
    'Content-Type: image/jpeg\r\n\r\n'
  );

  var headerBytes = Utilities.newBlob(textParts.join('')).getBytes();
  var footerBytes = Utilities.newBlob('\r\n--' + boundary + '--\r\n').getBytes();

  var fullPayload = [].concat(headerBytes, photoBytes, footerBytes);

  var options = {
    method: 'post',
    contentType: 'multipart/form-data; boundary=' + boundary,
    payload: fullPayload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(getTelegramApiUrl_() + 'sendPhoto', options);
  var json = JSON.parse(response.getContentText());

  if (!json.ok) {
    throw new Error('Telegram sendPhoto failed: ' + json.description);
  }

  return json;
}

/**
 * Sends chat action status (typing, upload_document, record_voice)
 * @param {string|number} chatId
 * @param {string} action
 */
function sendChatAction_(chatId, action) {
  try {
    callTelegramApi_('sendChatAction', {
      chat_id: String(chatId),
      action: action || 'typing'
    });
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Low-level JSON API executor for Telegram
 * @param {string} method
 * @param {Object} payload
 * @return {Object}
 */
function callTelegramApi_(method, payload) {
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(getTelegramApiUrl_() + method, options);
  var resText = response.getContentText();
  var json = JSON.parse(resText);

  if (!json.ok) {
    throw new Error('Telegram ' + method + ' error (' + json.error_code + '): ' + json.description);
  }

  return json;
}

// ─────────────────────────────────────────────────────────────────────
// INCOMING TELEGRAM UPDATE ROUTER
// ─────────────────────────────────────────────────────────────────────

/**
 * Routes Telegram updates based on message type
 * @param {Object} update
 */
function handleTelegramUpdate_(update) {
  if (update.message) {
    var msg = update.message;

    // Log to Sheet 4 Bot_Logs
    var chatId = msg.chat ? msg.chat.id : '';
    var textSnippet = msg.text || (msg.voice ? '[Voice Note]' : (msg.photo ? '[Photo]' : '[Other]'));

    // 1. Text Message
    if (msg.text) {
      handleTextMessage_(msg);
    }
    // 2. Voice Doubt Note (ELI10 Feynman Engine)
    else if (msg.voice) {
      handleVoiceDoubt_(msg);
    }
    // 3. Photo (Red-pen or expense bill receipt)
    else if (msg.photo) {
      handlePhotoMessage_(msg);
    }

    appendRow_('SHEET_TG', 'Bot_Logs', [
      getKolkataTimestamp(),
      chatId,
      textSnippet,
      'Processed',
      'Success'
    ]);
  }
  // 4. Callback Query (inline button tap)
  else if (update.callback_query) {
    handleCallbackQuery_(update.callback_query);
  }
}

/**
 * Handles incoming text messages and bot slash commands
 * @param {Object} msg
 */
function handleTextMessage_(msg) {
  var chatId = msg.chat.id;
  var text = (msg.text || '').trim();
  var isAdmin = isAdmin_(chatId);

  // ── ADMIN COMMANDS ──
  if (isAdmin) {
    if (text.indexOf('/cash') === 0) {
      handleAdminCashCommand_(chatId);
      return;
    }
    if (text.indexOf('/addstudent') === 0) {
      handleAdminAddStudentCommand_(chatId, text);
      return;
    }
    if (text.indexOf('/markpaid') === 0) {
      handleAdminMarkPaidCommand_(chatId, text);
      return;
    }
    if (text.indexOf('/grantgrace') === 0) {
      handleAdminGrantGraceCommand_(chatId, text);
      return;
    }
    if (text.indexOf('/settopic') === 0) {
      handleAdminSetTopicCommand_(chatId, text);
      return;
    }
    if (text.indexOf('/approve') === 0) {
      handleAdminApproveCommand_(chatId, text);
      return;
    }
    if (text.indexOf('/reject') === 0) {
      handleAdminRejectCommand_(chatId, text);
      return;
    }
    if (text.indexOf('/expense') === 0) {
      handleAdminExpenseCommand_(chatId, text);
      return;
    }
    if (text.indexOf('/pl') === 0) {
      handleAdminPlCommand_(chatId);
      return;
    }
    if (text.indexOf('/balance') === 0) {
      handleAdminBalanceCommand_(chatId);
      return;
    }
    if (text.indexOf('/ratios') === 0) {
      handleAdminRatiosCommand_(chatId);
      return;
    }
  }

  // ── STUDENT & SHARED COMMANDS ──
  if (text.indexOf('/start') === 0) {
    handleStartCommand_(chatId, msg.from);
    return;
  }
  if (text.indexOf('/fee') === 0) {
    handleFeeCommand_(chatId);
    return;
  }
  if (text.indexOf('/sos') === 0) {
    handleSosCommand_(chatId);
    return;
  }
  if (text.indexOf('/mystery') === 0) {
    handleMysteryCommand_(chatId);
    return;
  }
  if (text.indexOf('/redpen') === 0) {
    handleRedPenCommand_(chatId);
    return;
  }

  // Default friendly guidance
  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  sendTelegramMessage_(chatId,
    '👋 *Hello from Commerce Gyan!*\n\n' +
    'Tap below to open your personalized student portal or submit a query.',
    {
      inline_keyboard: [
        [{ text: '📱 Open Mini App', web_app: { url: miniAppUrl } }],
        [{ text: '💰 Fee Status', callback_data: 'cmd_fee' }, { text: '🚨 Panic SOS', callback_data: 'cmd_sos' }]
      ]
    }
  );
}

/**
 * Handles /cash admin command for physical cash drawer reconciliation
 * @param {string|number} chatId
 */
function handleAdminCashCommand_(chatId) {
  sendChatAction_(chatId, 'typing');
  var drawer = getCashDrawerBalance_();

  var text = '💵 *PHYSICAL CASH DRAWER COUNTER — ' + drawer.date + '*\n' +
             '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
             '🏦 *Opening Cash Balance*: ' + formatCurrency_(drawer.openingCash) + '\n\n' +
             '📥 *Cash Fees Collected Today* (' + drawer.cashInflowCount + '):\n' +
             '• Total Inflow: *+' + formatCurrency_(drawer.cashInflowToday) + '*\n';

  if (drawer.inflows.length > 0) {
    drawer.inflows.forEach(function(item) {
      text += '  - ' + item.studentName + ' (' + item.studentId + '): ' + formatCurrency_(item.amount) + '\n';
    });
  } else {
    text += '  - (No cash fees received today)\n';
  }

  text += '\n📤 *Cash Expenses Paid Today* (' + drawer.cashOutflowCount + '):\n' +
          '• Total Outflow: *-' + formatCurrency_(drawer.cashOutflowToday) + '*\n';

  if (drawer.outflows.length > 0) {
    drawer.outflows.forEach(function(item) {
      text += '  - ' + item.category + ' (' + item.note + '): ' + formatCurrency_(item.amount) + '\n';
    });
  } else {
    text += '  - (No cash expenses paid today)\n';
  }

  text += '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '💼 *PHYSICAL CASH TO COUNT IN DRAWER*:\n' +
          '👉 *' + formatCurrency_(drawer.physicalCashToCount) + '*\n\n' +
          'Net Cash Movement Today: ' + (drawer.netCashInHandToday >= 0 ? '+' : '') + formatCurrency_(drawer.netCashInHandToday);

  sendTelegramMessage_(chatId, text);
}

/**
 * Handles /addstudent command: /addstudent S001 Rahul 12 9876543210 12345678 P-CBSE-3
 * @param {string|number} chatId
 * @param {string} text
 */
function handleAdminAddStudentCommand_(chatId, text) {
  var parts = text.split(/\s+/);
  if (parts.length < 7) {
    sendTelegramMessage_(chatId,
      '❌ *Format Error*\n' +
      'Usage: `/addstudent StudentID Name Class Phone TelegramID PlanID [JoinDate]`\n' +
      'Example: `/addstudent S001 Rahul 12 9876543210 12345678 P-CBSE-3`'
    );
    return;
  }

  try {
    var res = registerStudent_({
      name: parts[2],
      classLevel: parts[3],
      phone: parts[4],
      telegramId: parts[5],
      planId: parts[6],
      joinDate: parts[7] || getKolkataDate()
    });

    sendTelegramMessage_(chatId,
      '✅ *Student Enrolled Successfully!*\n\n' +
      '• ID: `' + res.studentId + '`\n' +
      '• Name: ' + res.name + '\n' +
      '• Plan: ' + res.planName + ' (' + formatCurrency_(res.monthlyFee) + '/mo)\n' +
      '• First Month Pro-Rata: ' + formatCurrency_(res.firstMonthFee) + '\n' +
      '• Course Duration: ' + res.durationMonths + ' months\n' +
      '• Total Course Fee: ' + formatCurrency_(res.totalCourseFee) + '\n' +
      '• First Due Date: ' + res.firstInvoice.dueDate
    );
  } catch (e) {
    sendTelegramMessage_(chatId, '❌ *Enrollment Failed*: ' + e.message);
  }
}

/**
 * Handles /markpaid command: /markpaid S001 [amount] [mode] [month]
 * e.g. /markpaid S001 1500 Cash Nov
 * @param {string|number} chatId
 * @param {string} text
 */
function handleAdminMarkPaidCommand_(chatId, text) {
  var parts = text.split(/\s+/);
  if (parts.length < 2) {
    sendTelegramMessage_(chatId,
      '❌ *Usage*: `/markpaid StudentID [Amount] [Mode: Cash|UPI] [ForMonth]`\n' +
      'Example: `/markpaid S001 1500 Cash Nov`'
    );
    return;
  }

  var studentId = parts[1];
  var student = findRow_('SHEET_FEE', 'Students', 'StudentID', studentId);
  if (!student) {
    sendTelegramMessage_(chatId, '❌ Student ID "' + studentId + '" not found.');
    return;
  }

  var amount = parts[2] ? parseFloat(parts[2]) : (parseFloat(student.MonthlyFee) || 1500);
  var mode = parts[3] || 'Cash';
  var forMonth = parts[4] || '';

  try {
    var res = recordPayment_({
      studentId: studentId,
      amount: amount,
      mode: mode,
      forMonth: forMonth,
      recordedBy: 'Gyan Sir'
    });

    sendTelegramMessage_(chatId,
      '✅ *Payment Recorded & Reconciled!*\n\n' +
      '• Receipt: `' + res.receiptNo + '`\n' +
      '• Student: ' + student.Name + ' (' + studentId + ')\n' +
      '• Amount: ' + formatCurrency_(amount) + ' (' + mode + ')\n' +
      '• Invoice: ' + (res.matchedInvoice || 'Direct') + '\n' +
      (mode.toLowerCase() === 'cash' ? '💵 *Cash Drawer Credited Instantly!*\n' : '') +
      '• Telegram Receipt Sent: ' + (res.sentToTelegram ? '✅ Yes' : '⚠️ No Telegram ID')
    );
  } catch (e) {
    sendTelegramMessage_(chatId, '❌ Payment recording error: ' + e.message);
  }
}

/**
 * Handles /grantgrace command: /grantgrace StudentID
 * Grants 7-day Exam Grace Shield during board exam weeks
 * @param {string|number} chatId
 * @param {string} text
 */
function handleAdminGrantGraceCommand_(chatId, text) {
  var parts = text.split(/\s+/);
  if (parts.length < 2) {
    sendTelegramMessage_(chatId, 'Usage: `/grantgrace StudentID`');
    return;
  }

  var studentId = parts[1];
  var updated = updateRowByColValue_('SHEET_FEE', 'Students', 'StudentID', studentId, {
    Status: 'Grace'
  });

  if (updated) {
    sendTelegramMessage_(chatId,
      '🛡️ *Exam Grace Shield Granted!*\n\n' +
      'Student `' + studentId + '` status set to *Grace* for 7 days.\n' +
      'Overdue fee lockouts will be bypassed during exams.'
    );
  } else {
    sendTelegramMessage_(chatId, '❌ Student ID "' + studentId + '" not found.');
  }
}

/**
 * Handles /start command
 * @param {string|number} chatId
 * @param {Object} fromUser
 */
function handleStartCommand_(chatId, fromUser) {
  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';
  var name = fromUser ? (fromUser.first_name || 'Student') : 'Student';

  var welcomeMsg =
    '🎓 *Welcome to Commerce Gyan Mastery App!*\n\n' +
    'Hello ' + name + '! I am your automated academic coach for CBSE Class 11 & 12 Commerce.\n\n' +
    '⚡ *Features Built For You*:\n' +
    '• ⏱️ *Ghost Timer*: Beat Gyan Sir\'s class solve records & earn CG Coins.\n' +
    '• 🎤 *Voice Doubt Solver*: Speak your doubt & get a 10-year-old story analogy.\n' +
    '• 📸 *Red-Pen Snapshot*: Check register answers for CBSE board traps.\n' +
    '• 🚨 *2:00 AM Exam Panic SOS*: Instant stress-buster & formula sheet.\n' +
    '• 🕵️ *Saturday Detective Mysteries*: Solve corporate audit crime scenes.\n\n' +
    'Tap below to launch your learning studio:';

  sendTelegramMessage_(chatId, welcomeMsg, {
    inline_keyboard: [
      [{ text: '🚀 Launch Telegram Mini App', web_app: { url: miniAppUrl } }],
      [{ text: '💰 My Fee Details', callback_data: 'cmd_fee' }, { text: '🚨 Panic SOS', callback_data: 'cmd_sos' }]
    ]
  });
}

/**
 * Handles /fee command for students
 * @param {string|number} chatId
 */
function handleFeeCommand_(chatId) {
  var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(chatId));
  if (!student) {
    sendTelegramMessage_(chatId, '❌ Student account not linked to this Telegram ID. Please contact Gyan Sir.');
    return;
  }

  var text = '💰 *Fee Summary — Commerce Gyan*\n\n' +
             '• Student: *' + student.Name + '* (`' + student.StudentID + '`)\n' +
             '• Plan: ' + student.PlanName + '\n' +
             '• Monthly Fee: ' + formatCurrency_(student.MonthlyFee) + '\n' +
             '• Total Paid: ' + formatCurrency_(student.TotalPaid) + '\n' +
             '• Outstanding Balance: *' + formatCurrency_(student.Balance) + '*\n' +
             '• Status: ' + (student.Paid === '✅' ? '✅ Paid in Full' : '⚠️ Pending Balance') + '\n\n' +
             'To view detailed monthly invoices or pay via UPI, open the Mini App:';

  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  sendTelegramMessage_(chatId, text, {
    inline_keyboard: [
      [{ text: '💳 Open Fee Ledger in Mini App', web_app: { url: miniAppUrl + '#fee' } }]
    ]
  });
}

/**
 * Handles photos sent in chat (intercepts raw photo dumps and redirects to redpen camera)
 * @param {Object} msg
 */
function handlePhotoMessage_(msg) {
  var chatId = msg.chat.id;
  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  sendTelegramMessage_(chatId,
    '📸 *Register Photo Received!*\n\n' +
    'To guarantee high-speed evaluation without file size limits, please submit handwritten copies via the *Red-Pen Snapshot Camera* in the Mini App.',
    {
      inline_keyboard: [
        [{ text: '📸 Open Red-Pen Camera in Mini App', web_app: { url: miniAppUrl + '#redpen' } }]
      ]
    }
  );
}

/**
 * Handles inline button callbacks
 * @param {Object} query
 */
function handleCallbackQuery_(query) {
  var chatId = query.message.chat.id;
  var data = query.data;

  if (data === 'cmd_fee') {
    handleFeeCommand_(chatId);
  } else if (data === 'cmd_sos') {
    handleSosCommand_(chatId);
  }
}

/** Placeholder stubs for modules linked in subsequent phases */
function handleSosCommand_(chatId) { /* Implemented in sos.gs (Phase 5B) */ }
function handleMysteryCommand_(chatId) { /* Implemented in mysteries.gs (Phase 5B) */ }
function handleRedPenCommand_(chatId) { /* Implemented in redpen.gs (Phase 5B) */ }
/**
 * Handles /settopic command: /settopic Class Subject ChapterNo Subtopic
 * e.g. /settopic 12 Accountancy 6 "Working Capital Changes"
 */
function handleAdminSetTopicCommand_(chatId, text) {
  var parts = text.split(/\s+/);
  if (parts.length < 5) {
    sendTelegramMessage_(chatId,
      '❌ *Usage*: `/settopic Class Subject ChapterNo Subtopic`\n' +
      'Example: `/settopic 12 Accountancy 6 "Working Capital Changes"`'
    );
    return;
  }

  var classLevel = parts[1];
  var subject = parts[2];
  var chapterNo = parts[3];
  var subtopic = parts.slice(4).join(' ').replace(/['"]/g, '');

  try {
    var res = setActiveSubtopic_(classLevel, subject, chapterNo, subtopic);
    sendTelegramMessage_(chatId,
      '🎯 *Active Subtopic Locked for Tonight\'s 07:30 PM Test!*\n\n' +
      '• Class: ' + res.classLevel + '\n' +
      '• Subject: ' + res.subject + '\n' +
      '• Chapter ' + res.chapterNo + ': ' + res.chapterName + '\n' +
      '• Active Subtopic: *' + res.subtopicName + '*\n' +
      '• Canonical ID: `' + res.canonicalId + '`\n\n' +
      '70% fresh questions + 30% retention questions will be assembled at 06:00 AM.'
    );
  } catch (e) {
    sendTelegramMessage_(chatId, '❌ Error setting topic: ' + e.message);
  }
}

/**
 * Handles /approve command: /approve Q001
 */
function handleAdminApproveCommand_(chatId, text) {
  var parts = text.split(/\s+/);
  if (parts.length < 2) {
    sendTelegramMessage_(chatId, 'Usage: `/approve Q001`');
    return;
  }
  var qid = parts[1];
  try {
    approveQuestion_(qid);
    sendTelegramMessage_(chatId, '✅ Question `' + qid + '` approved and added to active rotation vault.');
  } catch (e) {
    sendTelegramMessage_(chatId, '❌ Error approving: ' + e.message);
  }
}

/**
 * Handles /reject command: /reject Q001
 */
function handleAdminRejectCommand_(chatId, text) {
  var parts = text.split(/\s+/);
  if (parts.length < 2) {
    sendTelegramMessage_(chatId, 'Usage: `/reject Q001`');
    return;
  }
  var qid = parts[1];
  try {
    rejectQuestion_(qid);
    sendTelegramMessage_(chatId, '❌ Question `' + qid + '` rejected.');
  } catch (e) {
    sendTelegramMessage_(chatId, '❌ Error rejecting: ' + e.message);
  }
}


/**
 * Handles Telegram /pl command: P&L summary
 */
function handleAdminPlCommand_(chatId) {
  sendChatAction_(chatId, 'typing');
  var pl = calculateMonthlyPL_();

  var text =
    '📊 *PROFIT & LOSS STATEMENT — ' + pl.monthLabel + '*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '💰 *Total Revenue*: ' + formatCurrency_(pl.totalRevenue) + '\n' +
    '• UPI: ' + formatCurrency_(pl.revenueByMode.UPI) + '\n' +
    '• Cash: ' + formatCurrency_(pl.revenueByMode.Cash) + '\n\n' +
    '💸 *Total Expenses*: ' + formatCurrency_(pl.totalExpenses) + '\n' +
    '• Direct Expenses: ' + formatCurrency_(pl.categoryBreakdown['Direct Expense']) + '\n' +
    '• Utilities: ' + formatCurrency_(pl.categoryBreakdown['Utilities']) + '\n' +
    '• Marketing: ' + formatCurrency_(pl.categoryBreakdown['Marketing']) + '\n' +
    '• Admin & Misc: ' + formatCurrency_(pl.categoryBreakdown['Admin'] + pl.categoryBreakdown['Other']) + '\n' +
    '• Depreciation: ' + formatCurrency_(pl.categoryBreakdown['Depreciation']) + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    (pl.isProfitable ? '🟢' : '🔴') + ' *NET PROFIT*: *' + formatCurrency_(pl.netProfit) + '*\n' +
    '📈 *Profit Margin*: *' + pl.marginPct + '%*';

  sendTelegramMessage_(chatId, text);
}

/**
 * Handles Telegram /balance command: Balance Sheet
 */
function handleAdminBalanceCommand_(chatId) {
  sendChatAction_(chatId, 'typing');
  var bs = calculateBalanceSheet_();

  var text =
    '🏛️ *BALANCE SHEET — ' + bs.asOfDate + '*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '💼 *ASSETS*:\n' +
    '• Fixed Assets (Book Value): ' + formatCurrency_(bs.assets.fixedAssets.total) + '\n' +
    '• Cash in Hand: ' + formatCurrency_(bs.assets.currentAssets.cashInHand) + '\n' +
    '• Bank / UPI Balance: ' + formatCurrency_(bs.assets.currentAssets.bankBalance) + '\n' +
    '• Unpaid Fee Receivables: ' + formatCurrency_(bs.assets.currentAssets.feeReceivables) + '\n' +
    '👉 *TOTAL ASSETS*: *' + formatCurrency_(bs.assets.totalAssets) + '*\n\n' +
    '📑 *LIABILITIES*:\n' +
    '• Total Liabilities: ' + formatCurrency_(bs.liabilities.total) + '\n\n' +
    '👑 *EQUITY*:\n' +
    '• Total Equity: ' + formatCurrency_(bs.equity.totalEquity) + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '⚖️ *VERIFICATION (Assets = L + E)*:\n' +
    (bs.verification.isBalanced ? '✅ *Equation Balanced perfectly!*' : '⚠️ *Variance*: ' + formatCurrency_(bs.verification.variance)) + '\n' +
    'Total L + E: ' + formatCurrency_(bs.verification.totalLiabilitiesAndEquity);

  sendTelegramMessage_(chatId, text);
}

/**
 * Handles Telegram /ratios command: 5 Financial Ratios
 */
function handleAdminRatiosCommand_(chatId) {
  sendChatAction_(chatId, 'typing');
  var r = calculateRatios_();

  var text =
    '📈 *INSTITUTE FINANCIAL HEALTH RATIOS*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '1️⃣ *Net Profit Margin*: *' + r.netProfitMargin + '%* (Target >40%)\n' +
    '2️⃣ *Operating Expense Ratio*: *' + r.opexRatio + '%* (Target <60%)\n' +
    '3️⃣ *Cash Runway*: *' + r.cashRunwayMonths + ' Months* (Target >6m)\n' +
    '4️⃣ *Fee Collection Rate*: *' + r.collectionRate + '%* (Target >90%)\n' +
    '5️⃣ *Revenue Per Student*: *' + formatCurrency_(r.revenuePerStudent) + '*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '🏥 *Overall Health Score*: ' + r.healthScore + '\n' +
    '👨‍🎓 Active Students: ' + r.activeStudents;

  sendTelegramMessage_(chatId, text);
}

// ─────────────────────────────────────────────────────────────────────
// WEBHOOK REGISTRATION HELPERS
// ─────────────────────────────────────────────────────────────────────

/**
 * Registers the WebApp deployment URL as the Telegram Bot Webhook
 * @param {string} [webAppUrl] - Optional URL; defaults to deployment
 */
function setTelegramWebhook(webAppUrl) {
  var props = PropertiesService.getScriptProperties();
  var url = webAppUrl || props.getProperty('WEBAPP_URL') || ScriptApp.getService().getUrl();
  if (!url) {
    throw new Error('WebApp URL not found. Deploy as WebApp or set WEBAPP_URL in Script Properties.');
  }
  var res = callTelegramApi_('setWebhook', {
    url: url,
    allowed_updates: ['message', 'callback_query']
  });
  Logger.log('📡 setWebhook result: ' + JSON.stringify(res));
  return res;
}

/**
 * Checks current Telegram Webhook status
 */
function getTelegramWebhookInfo() {
  var res = callTelegramApi_('getWebhookInfo', {});
  Logger.log('📡 getWebhookInfo: ' + JSON.stringify(res, null, 2));
  return res;
}

/**
 * Deletes Telegram Webhook
 */
function deleteTelegramWebhook() {
  var res = callTelegramApi_('deleteWebhook', {});
  Logger.log('📡 deleteWebhook: ' + JSON.stringify(res));
  return res;
}
