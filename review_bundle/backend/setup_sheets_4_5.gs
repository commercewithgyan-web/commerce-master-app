/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SHEET 4 & 5 SETUP
 * Sheet 4: Telegram Delivery (7 tabs)
 * Sheet 5: Books & Expenses (6 tabs)
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// SHEET 4: TELEGRAM DELIVERY (7 tabs)
// ─────────────────────────────────────────────────────────────────────

var TG_HEADER_COLOR = '#E8DAEF'; // Light purple

/**
 * Sets up Sheet 4: Telegram Delivery with 7 tabs.
 * @param {SpreadsheetApp.Spreadsheet} ss
 */
function setupSheet4_TelegramDelivery(ss) {
  setupTab_BotLogs_(ss);
  setupTab_PDFLog_(ss);
  setupTab_SubjectivePDFLog_(ss);
  setupTab_Broadcasts_(ss);
  setupTab_Settings_(ss);
  setupTab_Errors_(ss);
  setupTab_AudioPillsLog_(ss);
  Logger.log('  ✅ Sheet 4: Telegram Delivery — Complete (7 tabs)');
}

/** Tab 4.1: Bot_Logs — Telegram incoming commands and responses */
function setupTab_BotLogs_(ss) {
  var sheet = createOrGetSheet_(ss, 'Bot_Logs');
  var headers = ['Timestamp', 'TelegramID', 'Command', 'Response', 'Status'];

  formatHeaders_(sheet, headers, TG_HEADER_COLOR);

  setDropdown_(sheet, 5, ['Success', 'Error', 'Ignored']);

  setColumnWidths_(sheet, {
    1: 140, 2: 110, 3: 130, 4: 400, 5: 90
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy HH:mm:ss');
}

/** Tab 4.2: PDF_Log — General PDF dispatch telemetry */
function setupTab_PDFLog_(ss) {
  var sheet = createOrGetSheet_(ss, 'PDF_Log');
  var headers = ['Date', 'Type', 'PDF_URL', 'SentTo', 'Count', 'SentAt'];

  formatHeaders_(sheet, headers, TG_HEADER_COLOR);

  setDropdown_(sheet, 2, ['Question', 'Answer', 'Receipt', 'Report']);

  setColumnWidths_(sheet, {
    1: 110, 2: 100, 3: 250, 4: 120, 5: 80, 6: 140
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy');
  setDateFormat_(sheet, [6], 'dd-MMM-yyyy HH:mm:ss');
  setNumberFormat_(sheet, [5], '0');
}

/** Tab 4.3: Subjective_PDF_Log — Single-PDF broadcast cycle tracking */
function setupTab_SubjectivePDFLog_(ss) {
  var sheet = createOrGetSheet_(ss, 'Subjective_PDF_Log');
  var headers = ['Date', 'QuestionPDF_URL', 'AnswerPDF_URL', 'SentAt', 'ChannelID'];

  formatHeaders_(sheet, headers, TG_HEADER_COLOR);

  setColumnWidths_(sheet, {
    1: 110, 2: 250, 3: 250, 4: 140, 5: 140
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy');
  setDateFormat_(sheet, [4], 'dd-MMM-yyyy HH:mm:ss');
}

/** Tab 4.4: Broadcasts — Mass message alerts to channels or batches */
function setupTab_Broadcasts_(ss) {
  var sheet = createOrGetSheet_(ss, 'Broadcasts');
  var headers = ['Date', 'Message', 'SentTo', 'Count', 'Status'];

  formatHeaders_(sheet, headers, TG_HEADER_COLOR);

  setDropdown_(sheet, 5, ['Sent', 'Failed', 'Partial']);

  setColumnWidths_(sheet, {
    1: 140, 2: 450, 3: 140, 4: 80, 5: 90
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy HH:mm:ss');
  setNumberFormat_(sheet, [4], '0');
}

/** Tab 4.5: Settings — Runtime configurations & identifiers */
function setupTab_Settings_(ss) {
  var sheet = createOrGetSheet_(ss, 'Settings');
  var headers = ['Key', 'Value'];

  formatHeaders_(sheet, headers, TG_HEADER_COLOR);

  setColumnWidths_(sheet, { 1: 220, 2: 350 });

  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, 10, 2).setValues([
      ['GROUP_ID_11', ''],
      ['GROUP_ID_12', ''],
      ['CHANNEL_ID_11', ''],
      ['CHANNEL_ID_12', ''],
      ['ADMIN_ID', ''],
      ['ACTIVE_CLASS', '12'],
      ['GEMINI_MODEL', 'gemini-3.5-flash-lite'],
      ['CURRENT_FISCAL_YEAR', '2026-27'],
      ['MINI_APP_URL', ''],
      ['MAINTENANCE_MODE', 'false']
    ]);
  }

  var protection = sheet.protect().setDescription('Settings — Restricted to Admin');
  protection.setWarningOnly(true);
}

/** Tab 4.6: Errors — Real-time crash and anomaly capture */
function setupTab_Errors_(ss) {
  var sheet = createOrGetSheet_(ss, 'Errors');
  var headers = ['Timestamp', 'Function', 'ErrorMessage', 'StackTrace', 'Resolved'];

  formatHeaders_(sheet, headers, TG_HEADER_COLOR);

  setDropdown_(sheet, 5, ['✅', '❌']);

  setColumnWidths_(sheet, {
    1: 140, 2: 150, 3: 350, 4: 350, 5: 80
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy HH:mm:ss');
  addConditionalFormat_(sheet, 5, '❌', '#FADBD8');
  addConditionalFormat_(sheet, 5, '✅', '#D5F5E3');
}

/** Tab 4.7: Audio_Pills_Log — 60-second morning audio pills catalog */
function setupTab_AudioPillsLog_(ss) {
  var sheet = createOrGetSheet_(ss, 'Audio_Pills_Log');
  var headers = ['PillID', 'Date', 'Class', 'Topic', 'Audio_Drive_URL',
                 'Broadcast_At', 'Duration_Sec', 'Status'];

  formatHeaders_(sheet, headers, TG_HEADER_COLOR);

  setDropdown_(sheet, 3, ['11', '12']);
  setDropdown_(sheet, 8, ['Drafted', 'Broadcast', 'Failed']);

  setColumnWidths_(sheet, {
    1: 100, 2: 110, 3: 60, 4: 200, 5: 250,
    6: 140, 7: 90, 8: 90
  });

  setDateFormat_(sheet, [2], 'dd-MMM-yyyy');
  setDateFormat_(sheet, [6], 'dd-MMM-yyyy HH:mm:ss');
  setNumberFormat_(sheet, [7], '0');
}


// ─────────────────────────────────────────────────────────────────────
// SHEET 5: BOOKS & EXPENSES (6 tabs)
// ─────────────────────────────────────────────────────────────────────

var BOOKS_HEADER_COLOR = '#FADBD8'; // Light coral / salmon

/**
 * Sets up Sheet 5: Books & Expenses with 6 tabs.
 * @param {SpreadsheetApp.Spreadsheet} ss
 */
function setupSheet5_BooksExpenses(ss) {
  setupTab_Expenses_(ss);
  setupTab_Assets_(ss);
  setupTab_Liabilities_(ss);
  setupTab_CapitalDrawings_(ss);
  setupTab_OpeningBalances_(ss);
  setupTab_MonthlyReports_(ss);
  Logger.log('  ✅ Sheet 5: Books & Expenses — Complete (6 tabs)');
}

/** Tab 5.1: Expenses — Cash-basis 4-list expenditure log */
function setupTab_Expenses_(ss) {
  var sheet = createOrGetSheet_(ss, 'Expenses');
  var headers = [
    'EntryID', 'Date', 'Amount', 'Category', 'SubCategory',
    'PaidFrom', 'Mode', 'Note', 'BillURL', 'RecordedBy', 'RecordedAt'
  ];

  formatHeaders_(sheet, headers, BOOKS_HEADER_COLOR);

  setDropdown_(sheet, 4, [
    'Direct Expense', 'Marketing', 'Utilities', 'Admin',
    'Finance', 'Depreciation', 'Other'
  ]);
  setDropdown_(sheet, 6, ['HDFC Current', 'UPI', 'Cash']);
  setDropdown_(sheet, 7, ['UPI', 'Card', 'Cash', 'Bank']);

  setColumnWidths_(sheet, {
    1: 90, 2: 110, 3: 100, 4: 130, 5: 140,
    6: 110, 7: 80, 8: 250, 9: 200, 10: 110, 11: 140
  });

  setCurrencyFormat_(sheet, [3]);
  setDateFormat_(sheet, [2], 'dd-MMM-yyyy');
  setDateFormat_(sheet, [11], 'dd-MMM-yyyy HH:mm:ss');
}

/** Tab 5.2: Assets — Fixed & Current assets with SLM depreciation */
function setupTab_Assets_(ss) {
  var sheet = createOrGetSheet_(ss, 'Assets');
  var headers = [
    'AssetID', 'Name', 'Category', 'SubType', 'PurchaseDate',
    'PurchaseCost', 'UsefulLife_Years', 'SalvageValue',
    'Depreciation_Method', 'CurrentValue', 'Note'
  ];

  formatHeaders_(sheet, headers, BOOKS_HEADER_COLOR);

  setDropdown_(sheet, 3, ['Fixed', 'Current']);
  setDropdown_(sheet, 9, ['SLM', 'None']);

  setColumnWidths_(sheet, {
    1: 90, 2: 160, 3: 90, 4: 120, 5: 110,
    6: 110, 7: 120, 8: 110, 9: 140, 10: 120, 11: 200
  });

  setCurrencyFormat_(sheet, [6, 8, 10]);
  setDateFormat_(sheet, [5], 'dd-MMM-yyyy');
  setNumberFormat_(sheet, [7], '0');
}

/** Tab 5.3: Liabilities — Obligations, loans, and payables */
function setupTab_Liabilities_(ss) {
  var sheet = createOrGetSheet_(ss, 'Liabilities');
  var headers = [
    'LiabilityID', 'Name', 'Category', 'SubType', 'Amount',
    'InterestRate', 'StartDate', 'EndDate', 'MonthlyEMI',
    'RemainingBalance', 'Note'
  ];

  formatHeaders_(sheet, headers, BOOKS_HEADER_COLOR);

  setDropdown_(sheet, 3, ['Loan', 'Payable', 'Advance']);

  setColumnWidths_(sheet, {
    1: 100, 2: 160, 3: 100, 4: 120, 5: 110,
    6: 100, 7: 110, 8: 110, 9: 110, 10: 120, 11: 200
  });

  setCurrencyFormat_(sheet, [5, 9, 10]);
  setNumberFormat_(sheet, [6], '0.00%');
  setDateFormat_(sheet, [7, 8], 'dd-MMM-yyyy');
}

/** Tab 5.4: Capital_Drawings — Founder capital injections and withdrawals */
function setupTab_CapitalDrawings_(ss) {
  var sheet = createOrGetSheet_(ss, 'Capital_Drawings');
  var headers = ['EntryID', 'Date', 'Type', 'Amount', 'Mode', 'Note'];

  formatHeaders_(sheet, headers, BOOKS_HEADER_COLOR);

  setDropdown_(sheet, 3, ['Capital', 'Drawing']);
  setDropdown_(sheet, 5, ['Bank', 'Cash']);

  setColumnWidths_(sheet, {
    1: 90, 2: 110, 3: 100, 4: 110, 5: 80, 6: 250
  });

  setCurrencyFormat_(sheet, [4]);
  setDateFormat_(sheet, [2], 'dd-MMM-yyyy');
}

/** Tab 5.5: Opening_Balances — Initial balance baseline */
function setupTab_OpeningBalances_(ss) {
  var sheet = createOrGetSheet_(ss, 'Opening_Balances');
  var headers = ['Key', 'Value'];

  formatHeaders_(sheet, headers, BOOKS_HEADER_COLOR);

  setColumnWidths_(sheet, { 1: 200, 2: 250 });

  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, 5, 2).setValues([
      ['BusinessName', 'Commerce Gyan'],
      ['StartDate', '01-Apr-2026'],
      ['OpeningCash', '0'],
      ['OpeningBank', '0'],
      ['OpeningCapital', '0']
    ]);
  }

  var protection = sheet.protect().setDescription('Opening Balances — Restricted');
  protection.setWarningOnly(true);
}

/** Tab 5.6: Monthly_Reports — Auto-compiled P&L, Balance Sheet & Ratios */
function setupTab_MonthlyReports_(ss) {
  var sheet = createOrGetSheet_(ss, 'Monthly_Reports');
  var headers = [
    'Month', 'Year', 'TotalRevenue', 'TotalExpenses', 'NetProfit',
    'Margin_Pct', 'CashBalance', 'BankBalance', 'TotalAssets',
    'TotalLiabilities', 'Equity', 'GeneratedAt'
  ];

  formatHeaders_(sheet, headers, BOOKS_HEADER_COLOR);

  setDropdown_(sheet, 1, [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]);

  setColumnWidths_(sheet, {
    1: 100, 2: 70, 3: 120, 4: 120, 5: 120,
    6: 90, 7: 110, 8: 110, 9: 120, 10: 120, 11: 120, 12: 140
  });

  setCurrencyFormat_(sheet, [3, 4, 5, 7, 8, 9, 10, 11]);
  setNumberFormat_(sheet, [2], '0');
  setNumberFormat_(sheet, [6], '0.0%');
  setDateFormat_(sheet, [12], 'dd-MMM-yyyy HH:mm:ss');
}
