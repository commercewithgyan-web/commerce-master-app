/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — PHASE 1: MASTER SETUP ORCHESTRATOR
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Run setupAllSheets() ONCE to initialize all 5 Google Sheets with
 * complete schemas, data validations, formulas, and formatting.
 * 
 * @author Commerce Gyan (Gyan deep Kumar)
 * @version 2.3
 * @license Private
 */

// ─────────────────────────────────────────────────────────────────────
// SECTION 1: MASTER ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────

/**
 * 🚀 MASTER PHASE 1 SETUP
 * Run this function ONCE to create all 5 Google Sheets with complete schemas.
 * 
 * PREREQUISITES:
 * Optionally set Script Properties before running:
 *   SHEET_SYLLABUS, SHEET_QB, SHEET_FEE, SHEET_TG, SHEET_BOOKS
 * If blank, new spreadsheets are created and IDs saved automatically.
 */
function setupAllSheets() {
  Logger.log('🚀 ═══════════════════════════════════════════');
  Logger.log('   Commerce Master App v2.3 — Phase 1 Setup');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('📅 ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MMM-yyyy HH:mm:ss'));
  Logger.log('');

  var props = PropertiesService.getScriptProperties();

  // Step 1: Create or open all 5 spreadsheets
  var ss1 = getOrCreateSpreadsheet_(props, 'SHEET_SYLLABUS', '1. Syllabus Planner');
  var ss2 = getOrCreateSpreadsheet_(props, 'SHEET_QB', '2. Question Bank');
  var ss3 = getOrCreateSpreadsheet_(props, 'SHEET_FEE', '3. Fee Management');
  var ss4 = getOrCreateSpreadsheet_(props, 'SHEET_TG', '4. Telegram Delivery');
  var ss5 = getOrCreateSpreadsheet_(props, 'SHEET_BOOKS', '5. Books & Expenses');

  // Step 2: Run individual setup functions
  Logger.log('\n📋 Setting up Sheet 1: Syllabus Planner...');
  setupSheet1_SyllabusPlanner(ss1);

  Logger.log('\n📋 Setting up Sheet 2: Question Bank...');
  setupSheet2_QuestionBank(ss2);

  Logger.log('\n📋 Setting up Sheet 3: Fee Management...');
  setupSheet3_FeeManagement(ss3);

  Logger.log('\n📋 Setting up Sheet 4: Telegram Delivery...');
  setupSheet4_TelegramDelivery(ss4);

  Logger.log('\n📋 Setting up Sheet 5: Books & Expenses...');
  setupSheet5_BooksExpenses(ss5);

  // Step 3: Cleanup default sheets
  cleanupDefaultSheets_([ss1, ss2, ss3, ss4, ss5]);

  // Step 4: Log summary
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('✅ PHASE 1 COMPLETE — All 5 Sheets Initialized');
  Logger.log('═══════════════════════════════════════════════');
  Logger.log('Sheet IDs (saved to Script Properties):');
  Logger.log('  SHEET_SYLLABUS : ' + props.getProperty('SHEET_SYLLABUS'));
  Logger.log('  SHEET_QB       : ' + props.getProperty('SHEET_QB'));
  Logger.log('  SHEET_FEE      : ' + props.getProperty('SHEET_FEE'));
  Logger.log('  SHEET_TG       : ' + props.getProperty('SHEET_TG'));
  Logger.log('  SHEET_BOOKS    : ' + props.getProperty('SHEET_BOOKS'));
  Logger.log('');
  Logger.log('🔗 Next: Run setupDocTemplates() to create PDF templates.');
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 2: HELPER FUNCTIONS (used by all setup scripts)
// ─────────────────────────────────────────────────────────────────────

/**
 * Gets an existing spreadsheet by ID from Script Properties,
 * or creates a new one and saves its ID.
 * @param {PropertiesService.Properties} props
 * @param {string} propKey - Script Property key
 * @param {string} name - Spreadsheet name
 * @return {SpreadsheetApp.Spreadsheet}
 */
function getOrCreateSpreadsheet_(props, propKey, name) {
  var id = props.getProperty(propKey);
  if (id) {
    try {
      var ss = SpreadsheetApp.openById(id);
      Logger.log('📂 Opened existing: ' + name + ' (' + id + ')');
      return ss;
    } catch (e) {
      Logger.log('⚠️ Could not open ' + propKey + '=' + id + ', creating new...');
    }
  }
  var ss = SpreadsheetApp.create(name);
  props.setProperty(propKey, ss.getId());
  Logger.log('📄 Created: ' + name + ' (' + ss.getId() + ')');
  return ss;
}

/**
 * Creates or gets an existing sheet tab within a spreadsheet.
 * @param {SpreadsheetApp.Spreadsheet} ss
 * @param {string} tabName
 * @return {SpreadsheetApp.Sheet}
 */
function createOrGetSheet_(ss, tabName) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    Logger.log('  ✅ Created tab: ' + tabName);
  } else {
    Logger.log('  ℹ️ Tab exists: ' + tabName);
  }
  return sheet;
}

/**
 * Removes the default "Sheet1" tab from spreadsheets (if other tabs exist).
 * @param {SpreadsheetApp.Spreadsheet[]} spreadsheets
 */
function cleanupDefaultSheets_(spreadsheets) {
  spreadsheets.forEach(function(ss) {
    var def = ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1) {
      ss.deleteSheet(def);
      Logger.log('  🗑️ Removed default Sheet1 from: ' + ss.getName());
    }
  });
}

/**
 * Applies standard header formatting to row 1 of a sheet.
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {string[]} headers - Array of header names
 * @param {string} bgColor - Header background hex color
 */
function formatHeaders_(sheet, headers, bgColor) {
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground(bgColor);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrap(true);
  headerRange.setBorder(false, false, true, false, false, false,
    '#333333', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Freeze header row
  sheet.setFrozenRows(1);

  // Set auto-filter
  if (sheet.getMaxRows() > 1) {
    var filterRange = sheet.getRange(1, 1, sheet.getMaxRows(), headers.length);
    if (!sheet.getFilter()) {
      filterRange.createFilter();
    }
  }
}

/**
 * Applies data validation dropdown to a column.
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {number} col - Column number (1-based)
 * @param {string[]} values - Dropdown options
 * @param {number} [startRow=2]
 * @param {number} [endRow=500]
 */
function setDropdown_(sheet, col, values, startRow, endRow) {
  startRow = startRow || 2;
  endRow = endRow || 500;
  var range = sheet.getRange(startRow, col, endRow - startRow + 1, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

/**
 * Sets column widths from a map.
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {Object} widthMap - {colIndex: widthPx, ...} (1-based)
 */
function setColumnWidths_(sheet, widthMap) {
  for (var col in widthMap) {
    sheet.setColumnWidth(parseInt(col), widthMap[col]);
  }
}

/**
 * Applies Indian currency format ₹ to columns.
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {number[]} cols - Column numbers (1-based)
 * @param {number} [startRow=2]
 * @param {number} [endRow=500]
 */
function setCurrencyFormat_(sheet, cols, startRow, endRow) {
  startRow = startRow || 2;
  endRow = endRow || 500;
  cols.forEach(function(col) {
    sheet.getRange(startRow, col, endRow - startRow + 1, 1)
      .setNumberFormat('₹#,##,##0');
  });
}

/**
 * Applies date/datetime format to columns.
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {number[]} cols
 * @param {string} format - e.g. 'dd-MMM-yyyy' or 'dd-MMM-yyyy HH:mm'
 * @param {number} [startRow=2]
 * @param {number} [endRow=500]
 */
function setDateFormat_(sheet, cols, format, startRow, endRow) {
  startRow = startRow || 2;
  endRow = endRow || 500;
  cols.forEach(function(col) {
    sheet.getRange(startRow, col, endRow - startRow + 1, 1)
      .setNumberFormat(format);
  });
}

/**
 * Applies number format to columns.
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {number[]} cols
 * @param {string} format
 * @param {number} [startRow=2]
 * @param {number} [endRow=500]
 */
function setNumberFormat_(sheet, cols, format, startRow, endRow) {
  startRow = startRow || 2;
  endRow = endRow || 500;
  cols.forEach(function(col) {
    sheet.getRange(startRow, col, endRow - startRow + 1, 1)
      .setNumberFormat(format);
  });
}

/**
 * Adds conditional formatting: if text equals value, set background.
 * @param {SpreadsheetApp.Sheet} sheet
 * @param {number} col
 * @param {string} textValue
 * @param {string} bgColor
 * @param {number} [startRow=2]
 * @param {number} [endRow=500]
 */
function addConditionalFormat_(sheet, col, textValue, bgColor, startRow, endRow) {
  startRow = startRow || 2;
  endRow = endRow || 500;
  var range = sheet.getRange(startRow, col, endRow - startRow + 1, 1);
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(textValue)
    .setBackground(bgColor)
    .setRanges([range])
    .build();
  var rules = sheet.getConditionalFormatRules();
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);
}

// ─────────────────────────────────────────────────────────────────────
// SECTION 3: VERIFICATION
// ─────────────────────────────────────────────────────────────────────

/**
 * Verifies all 5 sheets are properly set up.
 * Run after setupAllSheets() to confirm.
 */
function verifySetup() {
  Logger.log('🔍 Verifying Phase 1 Setup...\n');
  var props = PropertiesService.getScriptProperties();

  var expected = {
    'SHEET_SYLLABUS': ['Master_Syllabus', 'Chapter_Weightage', 'Setup'],
    'SHEET_QB': ['QuestionBank', 'DailyQuestions', 'StudentAnswers', 'Leaderboard',
                 'Doubts', 'Notebook_Notes', 'Notebook_Favourites', 'Notebook_Summary',
                 'Revision_Queue', 'Audit_Mysteries', 'RedPen_Submissions'],
    'SHEET_FEE': ['Plans', 'Students', 'Payments', 'Fee_Schedule', 'Fee_Summary',
                  'Fee_Reminders', 'Receipts'],
    'SHEET_TG': ['Bot_Logs', 'PDF_Log', 'Subjective_PDF_Log', 'Broadcasts',
                 'Settings', 'Errors', 'Audio_Pills_Log'],
    'SHEET_BOOKS': ['Expenses', 'Assets', 'Liabilities', 'Capital_Drawings',
                    'Opening_Balances', 'Monthly_Reports']
  };

  var allPassed = true;
  for (var key in expected) {
    var id = props.getProperty(key);
    if (!id) {
      Logger.log('❌ MISSING: ' + key + ' not found in Script Properties');
      allPassed = false;
      continue;
    }
    try {
      var ss = SpreadsheetApp.openById(id);
      var tabs = expected[key];
      var existingTabs = ss.getSheets().map(function(s) { return s.getName(); });
      Logger.log('📊 ' + key + ' (' + ss.getName() + '):');
      tabs.forEach(function(tab) {
        if (existingTabs.indexOf(tab) >= 0) {
          var sheet = ss.getSheetByName(tab);
          var cols = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          Logger.log('  ✅ ' + tab + ' (' + cols.length + ' columns)');
        } else {
          Logger.log('  ❌ MISSING: ' + tab);
          allPassed = false;
        }
      });
    } catch (e) {
      Logger.log('❌ ERROR opening ' + key + ': ' + e.message);
      allPassed = false;
    }
  }

  Logger.log('');
  if (allPassed) {
    Logger.log('✅ ALL VERIFICATIONS PASSED — Phase 1 is complete!');
  } else {
    Logger.log('⚠️ SOME CHECKS FAILED — Re-run setupAllSheets() or fix manually.');
  }
}

/**
 * 🔐 Quick helper to set runtime credentials into Script Properties.
 * @param {Object} config - { BOT_TOKEN, ADMIN_ID, CHANNEL_ID, GEMINI_KEY, MINI_APP_URL, WEBAPP_URL }
 */
function setProjectSecrets(config) {
  if (!config) {
    Logger.log('⚠️ Usage: setProjectSecrets({ BOT_TOKEN: "...", ADMIN_ID: "...", ... })');
    return;
  }
  var props = PropertiesService.getScriptProperties();
  if (config.BOT_TOKEN) props.setProperty('BOT_TOKEN', config.BOT_TOKEN);
  if (config.ADMIN_ID) props.setProperty('ADMIN_ID', String(config.ADMIN_ID));
  if (config.CHANNEL_ID) props.setProperty('CHANNEL_ID', String(config.CHANNEL_ID));
  if (config.GEMINI_KEY) props.setProperty('GEMINI_KEY', config.GEMINI_KEY);
  if (config.MINI_APP_URL) props.setProperty('MINI_APP_URL', config.MINI_APP_URL);
  if (config.WEBAPP_URL) props.setProperty('WEBAPP_URL', config.WEBAPP_URL);
  Logger.log('🔐 Script Properties successfully saved.');
}

/**
 * 🚀 ONE-CLICK MASTER INITIALIZER FOR ALL SECRETS, TRIGGERS & WEBHOOK
 * Run this function in Apps Script to save all properties and link the Telegram Bot.
 */
function applyAllProjectCredentials() {
  Logger.log('🚀 Running applyAllProjectCredentials()...');
  var props = PropertiesService.getScriptProperties();

  // Set up 13 daily triggers
  try {
    setupTriggers();
    Logger.log('  ✅ 1. Automated Crons (triggers.gs) registered in Asia/Kolkata.');
  } catch (e) {
    Logger.log('  ⚠️ Triggers note: ' + e.message);
  }

  // Register Webhook
  try {
    var webAppUrl = props.getProperty('WEBAPP_URL');
    if (webAppUrl) {
      var hookRes = setTelegramWebhook(webAppUrl);
      Logger.log('  ✅ 2. Telegram Webhook registered: ' + JSON.stringify(hookRes));
    }
  } catch (e) {
    Logger.log('  ⚠️ Webhook note: ' + e.message);
  }

  Logger.log('\n🎉 MASTER BOT & SYSTEM ACTIVATION COMPLETE!');
}
