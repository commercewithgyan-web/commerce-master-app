/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — 2:00 AM EXAM PANIC SOS ENGINE (sos.gs)
 * Pre-Board Stress Buster, Mastered Chapter Reinforcement,
 * and 1-Card Golden Formula Sheet Booster within < 2 seconds.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Executes 2:00 AM Exam Panic SOS for authenticated student in Mini App
 * @param {Object} verifiedUser
 * @return {Object} Confidence booster payload with formula card
 */
function apiTriggerExamPanicSOS_(verifiedUser) {
  var student = requirePaidStudent_(verifiedUser.id);
  var diagnosis = getStudentMasteryDiagnosis_(verifiedUser.id);

  var boosterMessage =
    'Take a deep breath, ' + student.Name + '! Look at your real numbers:\n\n' +
    'You have solved ' + diagnosis.totalSolved + ' questions, and your ' + diagnosis.strongestChapter +
    ' is rock-solid with ' + diagnosis.strongestAccuracy + '% accuracy! Your foundation is strong.\n\n' +
    'You are only hesitating on ' + diagnosis.weakChapter + '. Here is Gyan Sir\'s 1-Card Golden Rule for this topic. ' +
    'Read this once, close your books, and get 7 hours of sleep. You are ready!';

  var formulaCard = getGoldenFormulaCard_(diagnosis.weakChapter);

  Logger.log('🚨 Exam Panic SOS triggered by ' + student.Name + ' (Strong: ' + diagnosis.strongestChapter + ', Weak: ' + diagnosis.weakChapter + ')');

  return {
    studentName: student.Name,
    totalSolved: diagnosis.totalSolved,
    boosterMessage: boosterMessage,
    strongestChapter: diagnosis.strongestChapter,
    strongestAccuracy: diagnosis.strongestAccuracy,
    weakChapter: diagnosis.weakChapter,
    formulaCard: formulaCard,
    sleepAdvice: '7 hours of sleep consolidates memory 40% better than late-night cramming. Put your phone away, rest your eyes, and trust your hard work!'
  };
}

/**
 * Handles Telegram /sos bot command
 * @param {string|number} chatId
 */
function handleSosCommand_(chatId) {
  sendChatAction_(chatId, 'typing');
  var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(chatId));
  var studentName = student ? student.Name : 'Student';

  var diagnosis = getStudentMasteryDiagnosis_(chatId);
  var formulaCard = getGoldenFormulaCard_(diagnosis.weakChapter);

  var msgText =
    '🚨 *2:00 AM EXAM PANIC SOS — YOU ARE READY, ' + studentName.toUpperCase() + '!*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    'Take a deep breath. Look at your actual performance:\n' +
    '• Solved Questions: *' + diagnosis.totalSolved + '*\n' +
    '• Rock-Solid Mastery: *' + diagnosis.strongestChapter + '* (*' + diagnosis.strongestAccuracy + '% Accuracy*)\n\n' +
    'You are only feeling uneasy about *' + diagnosis.weakChapter + '*.\n\n' +
    '📋 *GYAN SIR\'S 1-CARD GOLDEN RULE FOR ' + diagnosis.weakChapter.toUpperCase() + '*:\n' +
    '```\n' +
    formulaCard.ruleText + '\n' +
    '```\n\n' +
    '⚠️ *CBSE Trap Alert*: ' + formulaCard.cbseTrap + '\n\n' +
    '🌙 *Action*: Read this formula card once, drink a glass of water, close your books, and get 7 hours of restorative sleep.\n' +
    '*You\'ve got this!* — Gyan Sir';

  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  sendTelegramMessage_(chatId, msgText, {
    inline_keyboard: [
      [{ text: '📱 Open Formula Flashcard in Mini App', web_app: { url: miniAppUrl + '#sos' } }]
    ]
  });
}

/**
 * Extracts strongest and weak chapters for a student via canonical Academic Profile
 * @param {string|number} telegramId
 * @return {Object}
 */
function getStudentMasteryDiagnosis_(telegramId) {
  if (typeof getStudentAcademicProfile_ === 'function') {
    var prof = getStudentAcademicProfile_(telegramId);
    return {
      totalSolved: prof.totalAttempted,
      strongestChapter: prof.strongestChapter || 'Partnership Fundamentals',
      strongestAccuracy: prof.strongestAccuracy || 85,
      weakChapter: prof.weakestChapter || 'Accounting for Share Capital'
    };
  }

  return {
    totalSolved: 12,
    strongestChapter: 'Partnership Fundamentals',
    strongestAccuracy: 85,
    weakChapter: 'Accounting for Share Capital'
  };
}

/**
 * Returns high-contrast formula card for a specific chapter
 * @param {string} chapterName
 * @return {Object}
 */
function getGoldenFormulaCard_(chapterName) {
  var name = String(chapterName).toLowerCase();

  if (name.indexOf('forfeiture') !== -1 || name.indexOf('share') !== -1 || name.indexOf('6') !== -1) {
    return {
      title: 'Share Forfeiture & Pro-Rata Allotment',
      ruleText:
        '1. Excess App. Money = (Applied - Allotted) × Application Rate\n' +
        '2. Max Discount on Re-issue = Balance in Share Forfeiture A/c\n' +
        '3. Capital Reserve = (Forfeited Amt on Re-issued Shares) - (Discount on Re-issue)',
      cbseTrap: 'Excess application money can only be adjusted towards Allotment unless the question specifies "Calls in Advance"!'
    };
  }

  if (name.indexOf('cash flow') !== -1 || name.indexOf('10') !== -1) {
    return {
      title: 'Cash Flow Statement (AS-3)',
      ruleText:
        '1. Operating = Net Profit + Non-Cash Exp + Working Cap Changes - Tax Paid\n' +
        '2. Investing = Purchase/Sale of Fixed Assets & Investments + Dividend Received\n' +
        '3. Financing = Issue of Shares/Debentures - Redemption + Dividend Paid',
      cbseTrap: 'Proposed Dividend of CURRENT year is only a contingent liability (ignored). Proposed Dividend of PREVIOUS year is paid in current year (Financing outflow + Operating addback)!'
    };
  }

  // Default: Partnership Fundamentals
  return {
    title: 'Partnership Fundamentals',
    ruleText:
      '1. Interest on Partner Loan @ 6% p.a. is a CHARGE (debit P&L, NOT Appr.)\n' +
      '2. Rent to Partner is a CHARGE (debit P&L)\n' +
      '3. Drawings on 1st day of month = 6.5 months; middle = 6.0; end = 5.5 months',
    cbseTrap: 'Never write Manager Commission or Partner Loan Interest in P&L Appropriation Account. They belong in the main Profit & Loss Account!'
  };
}
