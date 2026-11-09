/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — THE COMMERCE DETECTIVE (mysteries.gs)
 * Saturday Corporate Audit Mysteries, Forensic Accounting Proofs,
 * "🕵️ Detective Investigator" Badge & +25 CG Coin Awards.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Returns today's active Corporate Audit Mystery scenario for Mini App
 * @param {Object} verifiedUser
 * @return {Object} Mystery case details with suspects
 */
function apiGetMystery_(verifiedUser) {
  var student = requirePaidStudent_(verifiedUser.id);
  var classLevel = student.Class || 12;

  var mysteries = getAllRowsAsObjects_('SHEET_QB', 'Audit_Mysteries', 100);

  // If table is empty, seed initial cases
  if (mysteries.length === 0) {
    seedAuditMysteries_();
    mysteries = getAllRowsAsObjects_('SHEET_QB', 'Audit_Mysteries', 100);
  }

  // Find latest active or scheduled mystery for student's class
  var activeMystery = null;
  for (var i = mysteries.length - 1; i >= 0; i--) {
    if (String(mysteries[i].Class) === String(classLevel)) {
      activeMystery = mysteries[i];
      break;
    }
  }

  if (!activeMystery) {
    activeMystery = mysteries[0];
  }

  var suspects = [];
  try {
    suspects = JSON.parse(activeMystery.Suspect_Options_JSON);
  } catch (e) {
    suspects = [
      { id: 1, name: 'Suspect 1 (Sales Head)', claim: 'Credit sales were recorded twice.' },
      { id: 2, name: 'Suspect 2 (Chief Cashier)', claim: 'Closing inventory was intentionally undervalued.' },
      { id: 3, name: 'Suspect 3 (Finance Manager)', claim: 'Working capital cash flow mismatch under AS-3.' }
    ];
  }

  return {
    mysteryId: activeMystery.MysteryID,
    scenarioTitle: activeMystery.Scenario_Title,
    chapter: activeMystery.Chapter,
    releaseDate: activeMystery.ReleaseDate,
    storyText: activeMystery.Story_Text,
    suspects: suspects
  };
}

/**
 * Evaluates student's detective verdict and awards investigator badge + 25 CG coins
 * @param {Object} verifiedUser
 * @param {Object} payload - { mysteryId, suspectIndex }
 * @return {Object} Forensic breakdown
 */
function apiSubmitMysteryVerdict_(verifiedUser, payload) {
  return withLock_('submitMystery_' + verifiedUser.id, 20000, function() {
    var student = requirePaidStudent_(verifiedUser.id);
    var mystery = findRow_('SHEET_QB', 'Audit_Mysteries', 'MysteryID', payload.mysteryId);
    if (!mystery) throw new Error('Mystery scenario not found');

    var correctVerdict = parseInt(mystery.Correct_Verdict, 10);
    var studentChoice = parseInt(payload.suspectIndex, 10);
    var isCorrect = (studentChoice === correctVerdict);

    var bonusCoins = 0;
    var badgeAwarded = null;

    if (isCorrect) {
      bonusCoins = 10; // +10 CG Coins for verified Case Study solve
      badgeAwarded = '🕵️ Detective Investigator';

      // Update student coins and badges in Leaderboard
      updateStudentCoinsAndLeaderboard_(
        String(verifiedUser.id),
        student.Name,
        student.Class,
        1, // score
        bonusCoins,
        false
      );
    }

    return {
      isCorrect: isCorrect,
      correctVerdict: correctVerdict,
      forensicExplanation: mystery.Forensic_Explanation,
      bonusCoins: bonusCoins,
      badgeAwarded: badgeAwarded,
      verdictMessage: isCorrect ?
        '🕵️ BRILLIANT DEDUCTION! You cracked the accounting fraud. The forensic proof confirms your analysis. +25 CG Coins awarded!' :
        '❌ That suspect had an airtight accounting defense. Review the forensic proof below to see where the real fraud occurred.'
    };
  });
}

/**
 * Handles Telegram /mystery bot command
 * @param {string|number} chatId
 */
function handleMysteryCommand_(chatId) {
  sendChatAction_(chatId, 'typing');
  var props = PropertiesService.getScriptProperties();
  var miniAppUrl = props.getProperty('MINI_APP_URL') || 'https://gyandeepkumar.github.io/commerce-master-app';

  var text =
    '📋 *CASE STUDY LAB: CBSE COMPETENCY PRACTICE*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'Practice real-world business, accounting & economics scenarios and verify your answers line-by-line against CBSE Marking Schemes.\n\n' +
    '• 📙 *Business Studies*: Principles, Planning & Case Logic\n' +
    '• 📘 *Accountancy*: Partnership Laws, AS-3 & Share Capital\n' +
    '• 📗 *Economics*: Credit Multiplier, Central Bank & Human Capital\n\n' +
    'Tap below to open the Case Study Lab:';

  sendTelegramMessage_(chatId, text, {
    inline_keyboard: [
      [{ text: '📋 Open Case Study Lab', web_app: { url: miniAppUrl + '/detective.html' } }]
    ]
  });
}

/**
 * Pre-populates the Audit_Mysteries tab with high-converting scenarios
 */
function seedAuditMysteries_() {
  var sheet = getSheet_('SHEET_QB', 'Audit_Mysteries');
  if (sheet.getLastRow() > 1) return;

  var cases = [
    [
      'MYS-001',
      getKolkataDate(),
      12,
      'Cash Flow Statement (AS-3)',
      'The Mystery of the Vanished ₹1,50,000 Cash',
      'Forensic Scene: The chief accountant of a Begusarai FMCG distribution agency reported a sparkling ₹1,20,000 Net Profit on paper for Q3. Yet, the firm\'s Current Bank Account is severely overdrawn by ₹30,000! Creditors are threatening to halt supplies. Three executives are pointing fingers:\n\nSuspect 1 (Sales Manager): "Credit sales were booked twice to inflate revenue!"\nSuspect 2 (Inventory Head): "Closing inventory was drastically undervalued at year-end!"\nSuspect 3 (Cashier): "₹1,50,000 cash was drained into bulk advance purchase of unsold inventory, masking cash shortage as profit under accrual rules."',
      JSON.stringify([
        { id: 1, name: 'Suspect 1 (Sales Head)', claim: 'Credit sales were booked twice.' },
        { id: 2, name: 'Suspect 2 (Inventory Head)', claim: 'Closing inventory was undervalued.' },
        { id: 3, name: 'Suspect 3 (Cashier)', claim: 'Cash drained into inventory under accrual accounting.' }
      ]),
      3,
      'Forensic Proof: Under the Accrual Concept, profit is recognized when sales occur, regardless of cash receipt. Undervaluing inventory would REDUCE profit, not increase it. Booking sales twice would create fictitious debtors, not cash drain. The ₹1,50,000 cash was absorbed by massive Working Capital increase (Operating Cash Outflow under AS-3). Suspect 3 correctly identified the accounting reality!',
      'Released'
    ],
    [
      'MYS-002',
      getKolkataDate(),
      12,
      'Issue of Shares & Forfeiture',
      'The Phantom Capital Reserve Heist',
      'Forensic Scene: An auditor discovering ₹80,000 transferred to Capital Reserve after re-issuing 1,000 forfeited shares of ₹10 each (₹8 called up, ₹5 paid). The CFO claims this was pure earned capital surplus.',
      JSON.stringify([
        { id: 1, name: 'Suspect 1 (Auditor)', claim: 'Capital Reserve was overstated by ₹30,000 because re-issue discount was not deducted.' },
        { id: 2, name: 'Suspect 2 (CFO)', claim: 'All forfeited money belongs directly to Capital Reserve immediately.' },
        { id: 3, name: 'Suspect 3 (Bookkeeper)', claim: 'Forfeited shares can never be credited to Capital Reserve.' }
      ]),
      1,
      'Forensic Proof: Under Section 54/Company Accounts rules, only the NET gain after deducting discount on re-issue can be transferred to Capital Reserve: (Amount forfeited on reissued shares - Discount allowed on reissue). Crediting gross forfeiture without deduction violates CBSE standards!',
      'Scheduled'
    ]
  ];

  cases.forEach(function(c) {
    sheet.appendRow(c);
  });

  Logger.log('🕵️ Seeded ' + cases.length + ' Corporate Audit Mystery cases');
}
