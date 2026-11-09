/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SHEET 3 SETUP
 * Sheet 3: Fee Management (7 tabs)
 * ═══════════════════════════════════════════════════════════════════════
 */

var FEE_HEADER_COLOR = '#FFF2CC'; // Light gold

/**
 * Sets up Sheet 3: Fee Management with 7 tabs.
 * @param {SpreadsheetApp.Spreadsheet} ss
 */
function setupSheet3_FeeManagement(ss) {
  setupTab_Plans_(ss);
  setupTab_Students_(ss);
  setupTab_Payments_(ss);
  setupTab_FeeSchedule_(ss);
  setupTab_FeeSummary_(ss);
  setupTab_FeeReminders_(ss);
  setupTab_Receipts_(ss);
  Logger.log('  ✅ Sheet 3: Fee Management — Complete (7 tabs)');
}

/** Tab 3.1: Plans — Pricing & Course packages */
function setupTab_Plans_(ss) {
  var sheet = createOrGetSheet_(ss, 'Plans');
  var headers = ['PlanID', 'PlanName', 'Board', 'Subjects', 'SubjectList',
                 'MonthlyFee', 'Duration_Months', 'TotalCourseFee', 'Active', 'Description'];

  formatHeaders_(sheet, headers, FEE_HEADER_COLOR);

  setDropdown_(sheet, 3, ['CBSE']);
  setDropdown_(sheet, 9, ['✅', '❌']);

  setColumnWidths_(sheet, {
    1: 100, 2: 150, 3: 80, 4: 80, 5: 220,
    6: 100, 7: 120, 8: 120, 9: 70, 10: 250
  });

  setCurrencyFormat_(sheet, [6, 8]);
  setNumberFormat_(sheet, [4, 7], '0');

  // Pre-fill active plans if empty
  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, 2, 10).setValues([
      ['P-CBSE-3', 'CBSE Combined', 'CBSE', 3, 'Accountancy, BST, Economics', 1500, 12, '=F2*G2', '✅', 'Comprehensive 3-Subject Commerce Mastery'],
      ['P-CBSE-1', 'CBSE Single', 'CBSE', 1, 'Any One Subject', 800, 12, '=F3*G3', '✅', 'Specialized Single Subject Preparation']
    ]);
    Logger.log('    📝 Pre-filled 2 master plans (P-CBSE-3, P-CBSE-1)');
  }
}

/** Tab 3.2: Students — Master Student Directory with Dynamic Formulas */
function setupTab_Students_(ss) {
  var sheet = createOrGetSheet_(ss, 'Students');
  var headers = [
    'StudentID', 'Name', 'Class', 'Board', 'Phone', 'TelegramID',
    'PlanID', 'PlanName', 'MonthlyFee', 'JoinDate', 'FirstMonthFee',
    'DiscountAmount', 'DiscountNote', 'CourseEndDate', 'Duration_Months',
    'TotalCourseFee', 'TotalPaid', 'Balance', 'Paid', 'Status', 'Notes'
  ];

  formatHeaders_(sheet, headers, FEE_HEADER_COLOR);

  // Freeze row 1 and column A
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  // Validations
  setDropdown_(sheet, 3, ['11', '12']);
  setDropdown_(sheet, 4, ['CBSE']);
  setDropdown_(sheet, 19, ['✅', '❌']);
  setDropdown_(sheet, 20, ['Active', 'Inactive', 'Grace', 'Graduated', 'Dropped']);

  // Column widths
  setColumnWidths_(sheet, {
    1: 90, 2: 150, 3: 60, 4: 70, 5: 110, 6: 110,
    7: 90, 8: 140, 9: 100, 10: 110, 11: 110,
    12: 110, 13: 150, 14: 120, 15: 110,
    16: 120, 17: 110, 18: 110, 19: 70, 20: 90, 21: 200
  });

  // Formatting
  setCurrencyFormat_(sheet, [9, 11, 12, 16, 17, 18]);
  setDateFormat_(sheet, [10, 14], 'dd-MMM-yyyy');
  setNumberFormat_(sheet, [15], '0');

  // Conditional format
  addConditionalFormat_(sheet, 19, '✅', '#D5F5E3');
  addConditionalFormat_(sheet, 19, '❌', '#FADBD8');
  addConditionalFormat_(sheet, 20, 'Active', '#D5F5E3');
  addConditionalFormat_(sheet, 20, 'Grace', '#FFF9C4');
  addConditionalFormat_(sheet, 20, 'Inactive', '#FADBD8');
}

/**
 * Seeds Gyan Sir's test profile into Sheet 3: Fee Management -> Students
 * and ensures active founder access.
 */
function seedGyanSirStudentData() {
  var feeSs = openSpreadsheet_('SHEET_FEE');
  var studentsSheet = feeSs.getSheetByName('Students');
  if (!studentsSheet) {
    setupTab_Students_(feeSs);
    studentsSheet = feeSs.getSheetByName('Students');
  }

  var row2Data = [
    'S001', 'Gyan Sir (Test)', 12, 'CBSE', '9876543210', '552858970',
    'P-CBSE-3', 'CBSE Combined', 1500, '2026-11-01', 1500, 0, '',
    '2027-03-31', 5, 7500, 7500, 0, '✅', 'Active', 'Founder Admin'
  ];

  if (studentsSheet.getLastRow() < 2) {
    studentsSheet.appendRow(row2Data);
  } else {
    // If row 2 is empty or S001, update in place
    var existingId = String(studentsSheet.getRange(2, 1).getValue()).trim();
    if (!existingId || existingId === 'S001') {
      studentsSheet.getRange(2, 1, 1, row2Data.length).setValues([row2Data]);
    } else {
      studentsSheet.appendRow(row2Data);
    }
  }

  Logger.log('✅ Seeded Gyan Sir into 3. Fee Management -> Students (Row 2)');
  return { ok: true, studentId: 'S001', name: 'Gyan Sir (Test)', telegramId: '552858970' };
}

/** Tab 3.3: Payments — All payment logs and transactions */
function setupTab_Payments_(ss) {
  var sheet = createOrGetSheet_(ss, 'Payments');
  var headers = [
    'PaymentID', 'Date', 'StudentID', 'Amount', 'StudentName',
    'Mode', 'UPI_Ref', 'ForMonth', 'InvoiceNo', 'Note',
    'ReceiptNo', 'ReceiptSent', 'RecordedBy', 'RecordedAt'
  ];

  formatHeaders_(sheet, headers, FEE_HEADER_COLOR);

  setDropdown_(sheet, 6, ['UPI', 'Cash', 'Bank', 'Card']);
  setDropdown_(sheet, 12, ['✅', '❌']);

  setColumnWidths_(sheet, {
    1: 100, 2: 110, 3: 90, 4: 100, 5: 140,
    6: 80, 7: 150, 8: 100, 9: 110, 10: 200,
    11: 110, 12: 90, 13: 110, 14: 140
  });

  setCurrencyFormat_(sheet, [4]);
  setDateFormat_(sheet, [2], 'dd-MMM-yyyy');
  setDateFormat_(sheet, [14], 'dd-MMM-yyyy HH:mm:ss');
}

/** Tab 3.4: Fee_Schedule — Invoices generated per student */
function setupTab_FeeSchedule_(ss) {
  var sheet = createOrGetSheet_(ss, 'Fee_Schedule');
  var headers = [
    'InvoiceNo', 'StudentID', 'StudentName', 'Month',
    'DueDate', 'Amount', 'Paid', 'Balance', 'Status'
  ];

  formatHeaders_(sheet, headers, FEE_HEADER_COLOR);

  setDropdown_(sheet, 9, ['Pending', 'Due', 'Overdue', 'Partial', 'Paid', 'Waived', 'Refunded']);

  setColumnWidths_(sheet, {
    1: 110, 2: 90, 3: 140, 4: 100,
    5: 110, 6: 100, 7: 100, 8: 100, 9: 100
  });

  setCurrencyFormat_(sheet, [6, 7, 8]);
  setDateFormat_(sheet, [5], 'dd-MMM-yyyy');

  addConditionalFormat_(sheet, 9, 'Paid', '#D5F5E3');
  addConditionalFormat_(sheet, 9, 'Overdue', '#FADBD8');
  addConditionalFormat_(sheet, 9, 'Due', '#FFF9C4');
  addConditionalFormat_(sheet, 9, 'Partial', '#FFE0B2');
}

/** Tab 3.5: Fee_Summary — Rapid overview of balances */
function setupTab_FeeSummary_(ss) {
  var sheet = createOrGetSheet_(ss, 'Fee_Summary');
  var headers = [
    'StudentID', 'Name', 'Plan', 'MonthlyFee',
    'MonthsPaid', 'TotalPaid', 'Balance', 'NextDue', 'Status', 'Action'
  ];

  formatHeaders_(sheet, headers, FEE_HEADER_COLOR);

  setDropdown_(sheet, 9, ['Current', 'Due Soon', 'Overdue', 'Paused', 'Grace']);

  setColumnWidths_(sheet, {
    1: 90, 2: 150, 3: 130, 4: 100,
    5: 90, 6: 100, 7: 100, 8: 110, 9: 100, 10: 120
  });

  setCurrencyFormat_(sheet, [4, 6, 7]);
  setNumberFormat_(sheet, [5], '0');
  setDateFormat_(sheet, [8], 'dd-MMM-yyyy');

  addConditionalFormat_(sheet, 9, 'Current', '#D5F5E3');
  addConditionalFormat_(sheet, 9, 'Overdue', '#FADBD8');
  addConditionalFormat_(sheet, 9, 'Due Soon', '#FFF9C4');
  addConditionalFormat_(sheet, 9, 'Paused', '#E1BEE7');
}

/** Tab 3.6: Fee_Reminders — Scheduled & dispatched reminder alerts */
function setupTab_FeeReminders_(ss) {
  var sheet = createOrGetSheet_(ss, 'Fee_Reminders');
  var headers = [
    'Date', 'StudentID', 'InvoiceNo', 'AmountDue',
    'DaysOverdue', 'ReminderType', 'SentVia', 'Status'
  ];

  formatHeaders_(sheet, headers, FEE_HEADER_COLOR);

  setDropdown_(sheet, 6, ['5-Day Warning', 'Due Today', '3-Day Overdue', '7-Day Warning', 'Access Paused']);
  setDropdown_(sheet, 7, ['Telegram DM', 'Bot Message']);
  setDropdown_(sheet, 8, ['Sent', 'Failed', 'Skipped']);

  setColumnWidths_(sheet, {
    1: 110, 2: 90, 3: 110, 4: 100,
    5: 100, 6: 140, 7: 120, 8: 90
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy');
  setCurrencyFormat_(sheet, [4]);
  setNumberFormat_(sheet, [5], '0');
}

/** Tab 3.7: Receipts — Official generated PDF receipts log */
function setupTab_Receipts_(ss) {
  var sheet = createOrGetSheet_(ss, 'Receipts');
  var headers = [
    'ReceiptNo', 'Date', 'StudentID', 'PaymentID',
    'Amount', 'InvoiceNo', 'PDF_URL', 'SentTo'
  ];

  formatHeaders_(sheet, headers, FEE_HEADER_COLOR);

  setColumnWidths_(sheet, {
    1: 120, 2: 110, 3: 90, 4: 100,
    5: 100, 6: 110, 7: 250, 8: 120
  });

  setDateFormat_(sheet, [2], 'dd-MMM-yyyy');
  setCurrencyFormat_(sheet, [5]);
}
