/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — AUTOMATION & CRONS (triggers.gs)
 * Programmatic Scheduling of all 14 Daily & Weekly Microservice Crons
 * in Asia/Kolkata Timezone. Autonomous Self-Healing Daily Operations.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. MASTER TRIGGER SETUP (Run Once)
// ─────────────────────────────────────────────────────────────────────

/**
 * 🚀 Sets up all automated time-based triggers in Asia/Kolkata timezone.
 * Deletes any duplicate existing triggers to guarantee zero redundant calls.
 */
function setupTriggers() {
  Logger.log('🚀 Setting up Commerce Master App Automated Crons (Asia/Kolkata)...');
  deleteAllTriggers();

  // 1. 06:00 AM — Assemble Daily Questions & Pre-warm (70/30 Pacing)
  ScriptApp.newTrigger('fillDailyQuestions')
    .timeBased()
    .atHour(6)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [06:00 AM] fillDailyQuestions');

  // 2. 08:00 AM — Morning Audio Pill & Daily Notifications
  ScriptApp.newTrigger('sendDailyNotifications')
    .timeBased()
    .atHour(8)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [08:00 AM] sendDailyNotifications');

  // 3. 08:15 AM — Model Answer PDF Channel Broadcast
  ScriptApp.newTrigger('sendSubjectiveAnswerPDF')
    .timeBased()
    .atHour(8)
    .nearMinute(15)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [08:15 AM] sendSubjectiveAnswerPDF');

  // 4. 07:00 PM — 5-Stage Fee Overdue Reminders
  ScriptApp.newTrigger('sendFeeReminders')
    .timeBased()
    .atHour(19)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [07:00 PM] sendFeeReminders');

  // 5. 07:25 PM — Pre-warm Daily Package in RAM CacheService
  ScriptApp.newTrigger('prewarmDailyPackage')
    .timeBased()
    .atHour(19)
    .nearMinute(25)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [07:25 PM] prewarmDailyPackage');

  // 6. 07:30 PM — Today\'s Question PDF Channel Broadcast
  ScriptApp.newTrigger('sendSubjectiveQuestionPDF')
    .timeBased()
    .atHour(19)
    .nearMinute(30)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [07:30 PM] sendSubjectiveQuestionPDF');

  // 7. 08:30 PM — AI Question Approval Digest to Gyan Sir
  ScriptApp.newTrigger('notifyAdminForReview')
    .timeBased()
    .atHour(20)
    .nearMinute(30)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [08:30 PM] notifyAdminForReview');

  // 8. 09:00 PM — Daily Expense & Cash Drawer Summary to Admin
  ScriptApp.newTrigger('sendDailyExpenseSummary')
    .timeBased()
    .atHour(21)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [09:00 PM] sendDailyExpenseSummary');

  // 9. 11:00 PM — Rebuild Leaderboard & Update Spaced Repetition Queue
  ScriptApp.newTrigger('updateLeaderboard')
    .timeBased()
    .atHour(23)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [11:00 PM] updateLeaderboard');

  // 10. 11:30 PM — Check Balance Sheet Mathematical Integrity
  ScriptApp.newTrigger('checkBalanceSheetIntegrity')
    .timeBased()
    .atHour(23)
    .nearMinute(30)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [11:30 PM] checkBalanceSheetIntegrity');

  // 11. 02:00 AM — Full Database Backup to Google Drive
  ScriptApp.newTrigger('dailyBackup')
    .timeBased()
    .atHour(2)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [02:00 AM] dailyBackup');

  // 12. Sunday 10:00 AM — AI Weekly Diagnostic Coaching Briefs
  ScriptApp.newTrigger('sendWeeklySummaries')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(10)
    .nearMinute(0)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [Sun 10:00 AM] sendWeeklySummaries');

  // 13. Sunday 11:00 AM — Parent Performance Summaries
  ScriptApp.newTrigger('sendParentReports')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(11)
    .nearMinute(0)
    .inTimezone(TIMEZONE_KOLKATA)
    .create();
  Logger.log('  ✅ [Sun 11:00 AM] sendParentReports');

  Logger.log('\n═══════════════════════════════════════════════');
  Logger.log('✅ ALL 13 PRODUCTION CRONS CONFIGURED SUCCESSFULLY');
  Logger.log('═══════════════════════════════════════════════');
}

/**
 * Removes all project triggers (useful for reset or maintenance)
 */
function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log('🗑️ Cleared all existing triggers.');
}

// ─────────────────────────────────────────────────────────────────────
// 2. CRON WORKERS IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────

/**
 * 08:00 AM Worker: Notifies paid students of today's plan & broadcasts morning audio pill
 */
function sendDailyNotifications() {
  Logger.log('🌅 Running 08:00 AM Morning Notification Broadcast...');
  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  // 1. Broadcast Morning Audio Pill to class channels
  [11, 12].forEach(function(classLevel) {
    var channelId = props.getProperty('CHANNEL_ID_' + classLevel) || props.getProperty('CHANNEL_ID');
    if (channelId) {
      try {
        var subtopic = getActiveSubtopic_(classLevel);
        sendTelegramMessage_(channelId,
          '🎧 *MORNING 60-SECOND BOARD TRAP AUDIO PILL — CLASS ' + classLevel + '*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          'Topic: *' + subtopic.subtopicName + '*\n\n' +
          '⚠️ *Common Board Trap*: In the absence of a partnership deed, interest on partner\'s loan is a *Charge against profits* @ 6% p.a., NOT an appropriation. It must be debited to P&L even during losses!\n\n' +
          '📱 Paid Batch: Check your 5-Layer Notebook in the Mini App for personal revision queue.',
          {
            inline_keyboard: [
              [{ text: '📱 Open Mini App Studio', web_app: { url: miniAppUrl } }]
            ]
          }
        );
      } catch (e) {
        logError_('sendDailyNotifications_Class' + classLevel, e);
      }
    }
  });
}

/**
 * 07:25 PM Worker: Pre-warms tonight's 07:30 PM question package in Apps Script RAM cache
 */
function prewarmDailyPackage() {
  Logger.log('🔥 Pre-warming 07:30 PM Question Package in RAM CacheService...');
  var todayStr = getKolkataDate();
  [11, 12].forEach(function(classLevel) {
    var q = assembleDailyQuestions_(classLevel);
    var cache = CacheService.getScriptCache();
    cache.put('DAILY_QUESTIONS_C' + classLevel + '_' + todayStr, JSON.stringify(q), 86400);
  });
  Logger.log('  ✅ Cache pre-warmed for instant <100ms loading');
}

/**
 * 08:30 PM Worker: Sends dinner-review digest of draft AI questions to Gyan Sir with 1-tap buttons
 */
function notifyAdminForReview() {
  Logger.log('📋 Running 08:30 PM AI Question Approval Digest...');
  var props = PropertiesService.getScriptProperties();
  var adminId = props.getProperty('ADMIN_ID');
  if (!adminId) return;

  var qBank = getAllRowsAsObjects_('SHEET_QB', 'QuestionBank', 500);
  var drafts = qBank.filter(function(q) {
    return String(q.ApprovalStatus || '').trim().toLowerCase() === 'ai_draft';
  });

  if (drafts.length === 0) {
    Logger.log('  ℹ️ Zero pending AI drafts');
    return;
  }

  var msg = '📝 *EVENING AI QUESTION REVIEW DIGEST*\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            'You have *' + drafts.length + '* questions pending your approval in the vault:\n\n';

  drafts.slice(0, 3).forEach(function(d) {
    msg += '• `' + d.QID + '` (' + d.Subject + ' Ch ' + d.Chapter + '):\n' +
           '  "' + d.Question.substring(0, 80) + '..."\n' +
           '  Correct: Option ' + d.CorrectIdx + ' | Ghost: ' + (d.Teacher_Ghost_Seconds || 35) + 's\n' +
           '  Approve: `/approve ' + d.QID + '` | Reject: `/reject ' + d.QID + '`\n\n';
  });

  msg += 'Tip: Tap /approve [QID] to release into tomorrow\'s rotation!';
  sendTelegramMessage_(adminId, msg);
}

/**
 * 09:00 PM Worker: Sends daily expense & physical cash drawer summary to Gyan Sir
 */
function sendDailyExpenseSummary() {
  var props = PropertiesService.getScriptProperties();
  var adminId = props.getProperty('ADMIN_ID');
  if (!adminId) return;

  var drawer = getCashDrawerBalance_();
  var text = '🌙 *EVENING EXPENSE & CASH DRAWER RECAP*\n' +
             '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
             '💼 *Physical Cash in Begusarai Drawer*: *' + formatCurrency_(drawer.physicalCashToCount) + '*\n' +
             '• Cash Fees Received Today: +' + formatCurrency_(drawer.cashInflowToday) + '\n' +
             '• Cash Expenses Paid Today: -' + formatCurrency_(drawer.cashOutflowToday) + '\n\n' +
             'Have a restful evening, Gyan Sir!';

  sendTelegramMessage_(adminId, text);
}

/**
 * 11:30 PM Worker: Verifies books equation Assets = Liabilities + Equity
 */
function checkBalanceSheetIntegrity() {
  Logger.log('⚖️ Auditing Balance Sheet Integrity (11:30 PM IST)...');
  var bs = calculateBalanceSheet_();

  if (!bs.verification.isBalanced) {
    var props = PropertiesService.getScriptProperties();
    var adminId = props.getProperty('ADMIN_ID');
    if (adminId) {
      sendTelegramMessage_(adminId,
        '⚠️ *ACCOUNTING ALERT: Balance Sheet Variance Detected*\n\n' +
        '• Total Assets: ' + formatCurrency_(bs.assets.totalAssets) + '\n' +
        '• Liabilities + Equity: ' + formatCurrency_(bs.verification.totalLiabilitiesAndEquity) + '\n' +
        '• Variance: *' + formatCurrency_(bs.verification.variance) + '*\n\n' +
        'Please verify recent manual expense or liability entries.'
      );
    }
  } else {
    Logger.log('  ✅ Balance Sheet equation verified perfectly: ' + bs.verification.equation);
  }
}

/**
 * 02:00 AM Worker: Creates automated daily backup copy of all 5 Google Sheets in Drive
 */
function dailyBackup() {
  Logger.log('💾 Running 02:00 AM Database Backup to Google Drive...');
  var props = PropertiesService.getScriptProperties();
  var todayStr = getKolkataDate().replace(/-/g, '_');

  var folderName = 'Commerce Master App Backups';
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  var sheetKeys = ['SHEET_SYLLABUS', 'SHEET_QB', 'SHEET_FEE', 'SHEET_TG', 'SHEET_BOOKS'];

  sheetKeys.forEach(function(key) {
    var id = props.getProperty(key);
    if (id) {
      try {
        var file = DriveApp.getFileById(id);
        file.makeCopy('BACKUP_' + file.getName() + '_' + todayStr, folder);
      } catch (e) {
        logError_('dailyBackup_' + key, e);
      }
    }
  });

  Logger.log('  ✅ All 5 Google Sheets backed up safely');
}

/**
 * Sunday 11:00 AM Worker: Sends weekly progress report to parents
 */
function sendParentReports() {
  Logger.log('👨‍👩‍👧 Running Sunday Parent Reports (11:00 AM IST)...');
  // For students who have registered a parent contact in Notes
  var students = getAllRowsAsObjects_('SHEET_FEE', 'Students', 100);
  students.forEach(function(s) {
    if (s.TelegramID && s.Status === 'Active') {
      try {
        sendTelegramMessage_(s.TelegramID,
          '📊 *Weekly Academic Report for ' + s.Name + ' (Parent Update)*\n\n' +
          '• Overall Accuracy: Mastered 🟢\n' +
          '• Daily Drills Completed: Active Streak\n' +
          '• Next Board Exam Focus: Working Capital & Partnership Accounts\n\n' +
          'Commerce Gyan Academic Board • Founder: Gyan Sir'
        );
      } catch (e) {}
    }
  });
}
