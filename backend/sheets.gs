/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SHEETS ENGINE (sheets.gs)
 * High-performance, atomic Google Sheets operations with range-specific
 * reads, LockService synchronization, and object mappings.
 * ═══════════════════════════════════════════════════════════════════════
 */

// Hardcoded fallback Sheet IDs if PropertiesService is missing any key
var FALLBACK_SHEET_IDS = {
  SHEET_ERP: '1hQrgvYVoJ2AZ7JSLZm13tAnBUitAACuAPB1HS2m8fZc',
  SHEET_MASTER_ERP: '1hQrgvYVoJ2AZ7JSLZm13tAnBUitAACuAPB1HS2m8fZc',
  SHEET_SYLLABUS: '1VN-A-e9EKURW1_AnEez03tTLEONHJcS_K5KvYtVeBto',
  SHEET_QB: '1iK-Qv-TZv8m0gkQ7dg5SSHRedgPCN8bQCn7q3GBfwhQ',
  SHEET_MASTER_REPO: '1fK9POU5MczWrgsdhWc-g4Me5U6e6UtsWnwBkKG4IoCE',
  SHEET_FEE: '1l-14FD7HInLqNV7059Bxbdr1u1bY2AKY9QtsDbzZbQM',
  SHEET_TG: '1KRHuUUTGpkOUHvYJHls7J5yLNTZsCbJa5lou1GfHiWM',
  SHEET_BOOKS: '1FxEUPLIudc8uIZEeMu9GL7JWnP-yQktiXlq7GVtRD5k'
};

// Cache opened spreadsheets during execution to prevent redundant openById calls
var _spreadsheetCache = {};

// Request-level in-memory cache for sheet tab values to prevent redundant range queries
var _sheetDataCache = {};

/**
 * Gets all raw 2D array values from a sheet tab in a single batch read.
 * Cached in RAM during execution to prevent redundant sheet scans.
 * @param {string} sheetKey
 * @param {string} tabName
 * @return {Array<Array<*>>} 2D array [row][col], where row 0 is headers
 */
function getTabAllValues_(sheetKey, tabName) {
  var cacheKey = sheetKey + '::' + tabName;
  if (_sheetDataCache[cacheKey]) {
    return _sheetDataCache[cacheKey];
  }
  var sheet = getSheet_(sheetKey, tabName);
  var values = sheet.getDataRange().getValues();
  _sheetDataCache[cacheKey] = values;
  return values;
}

/**
 * Invalidates execution cache for a specific sheet tab upon modification
 */
function invalidateSheetCache_(sheetKey, tabName) {
  var cacheKey = sheetKey + '::' + tabName;
  delete _sheetDataCache[cacheKey];
}

/**
 * Retrieves the active Sheet ID for a given key, honoring ENV_MODE dynamically.
 * @param {string} sheetKey
 * @return {string}
 */
function getSheetIdByKey_(sheetKey) {
  if (typeof getActiveSheetIds === 'function') {
    var activeIds = getActiveSheetIds();
    var keyMap = {
      'SHEET_ERP': activeIds.MASTER_ERP,
      'SHEET_MASTER_ERP': activeIds.MASTER_ERP,
      'SHEET_SYLLABUS': activeIds.SYLLABUS,
      'SHEET_QB': activeIds.QUESTION_BANK,
      'SHEET_MASTER_REPO': activeIds.MASTER_Q_REPO,
      'SHEET_FEE': activeIds.FEE_MGMT,
      'SHEET_TG': activeIds.TELEGRAM,
      'SHEET_BOOKS': activeIds.BOOKS_EXPENSES
    };
    if (keyMap[sheetKey]) {
      return keyMap[sheetKey];
    }
  }
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty(sheetKey) || FALLBACK_SHEET_IDS[sheetKey];
  if (sheetId === '1FMk5KBCaEBLj7rwmGI9lIEpM02aGWrc-6tD8GXApDCY') {
    sheetId = FALLBACK_SHEET_IDS.SHEET_MASTER_REPO;
  }
  return sheetId;
}

/**
 * Retrieves a Sheet instance by Script Property key and Tab name
 * @param {string} sheetKey - e.g. 'SHEET_SYLLABUS', 'SHEET_QB', 'SHEET_FEE', 'SHEET_TG', 'SHEET_BOOKS'
 * @param {string} tabName - e.g. 'Students', 'QuestionBank'
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet_(sheetKey, tabName) {
  var sheetId = getSheetIdByKey_(sheetKey);
  if (!sheetId) {
    throw new Error('Config missing for Script Property: ' + sheetKey);
  }

  if (!_spreadsheetCache[sheetId]) {
    _spreadsheetCache[sheetId] = SpreadsheetApp.openById(sheetId);
  }

  var ss = _spreadsheetCache[sheetId];
  var tab = ss.getSheetByName(tabName);
  if (!tab) {
    throw new Error('Tab "' + tabName + '" not found in sheet: ' + sheetKey);
  }
  return tab;
}

/**
 * Retrieves a Spreadsheet instance by Script Property key
 * @param {string} sheetKey
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function openSpreadsheet_(sheetKey) {
  var sheetId = getSheetIdByKey_(sheetKey);
  if (!sheetId) {
    throw new Error('Config missing for Script Property: ' + sheetKey);
  }

  if (!_spreadsheetCache[sheetId]) {
    _spreadsheetCache[sheetId] = SpreadsheetApp.openById(sheetId);
  }

  return _spreadsheetCache[sheetId];
}

/**
 * Appends a row atomically to the specified sheet
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {Array} rowData
 * @return {number} Appended row number
 */
function appendRow_(sheetKey, tabName, rowData) {
  invalidateSheetCache_(sheetKey, tabName);
  var sheet = getSheet_(sheetKey, tabName);
  sheet.appendRow(rowData);
  return sheet.getLastRow();
}

/**
 * Reads headers from row 1 of a sheet tab
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {string[]}
 */
function getHeaders_(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });
}

/**
 * Reads all rows from a sheet as an array of JavaScript objects keyed by header names.
 * Uses single batch read from memory cache.
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {number} [maxRows=2000] - Hard safety limit
 * @return {Object[]}
 */
function getAllRowsAsObjects_(sheetKey, tabName, maxRows) {
  var allData = getTabAllValues_(sheetKey, tabName);
  if (!allData || allData.length <= 1) return [];

  var headers = allData[0].map(function(h) { return String(h).trim(); });
  var limit = Math.min(allData.length - 1, maxRows || 2000);
  var result = [];

  for (var i = 1; i <= limit; i++) {
    var rowValues = allData[i];
    var rowObj = { _rowNumber: i + 1 };
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = rowValues[j];
    }
    result.push(rowObj);
  }
  return result;
}

/**
 * Finds the first row matching a column name and value via high-speed in-memory scan
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {string} colName - Header column name
 * @param {*} value - Value to search for
 * @return {Object|null} Row object with _rowNumber or null
 */
function findRow_(sheetKey, tabName, colName, value) {
  var allData = getTabAllValues_(sheetKey, tabName);
  if (!allData || allData.length <= 1) return null;

  var headers = allData[0].map(function(h) { return String(h).trim(); });
  var colIndex = headers.indexOf(colName);
  if (colIndex === -1) {
    return null;
  }

  var targetStr = String(value).trim().toLowerCase();
  for (var i = 1; i < allData.length; i++) {
    var rowValues = allData[i];
    if (String(rowValues[colIndex]).trim().toLowerCase() === targetStr) {
      var obj = { _rowNumber: i + 1 };
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowValues[j];
      }
      return obj;
    }
  }
  return null;
}

/**
 * Finds all rows matching a column name and value via high-speed in-memory scan
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {string} colName
 * @param {*} value
 * @return {Object[]}
 */
function findRows_(sheetKey, tabName, colName, value) {
  var allData = getTabAllValues_(sheetKey, tabName);
  if (!allData || allData.length <= 1) return [];

  var headers = allData[0].map(function(h) { return String(h).trim(); });
  var colIndex = headers.indexOf(colName);
  if (colIndex === -1) {
    return [];
  }

  var targetStr = String(value).trim().toLowerCase();
  var matches = [];

  for (var i = 1; i < allData.length; i++) {
    var rowValues = allData[i];
    if (String(rowValues[colIndex]).trim().toLowerCase() === targetStr) {
      var obj = { _rowNumber: i + 1 };
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowValues[j];
      }
      matches.push(obj);
    }
  }
  return matches;
}

/**
 * Updates a specific cell by row and column index (1-based)
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {number} row
 * @param {number} col
 * @param {*} value
 */
function updateCell_(sheetKey, tabName, row, col, value) {
  invalidateSheetCache_(sheetKey, tabName);
  var sheet = getSheet_(sheetKey, tabName);
  sheet.getRange(row, col).setValue(value);
}

/**
 * Updates specific columns for a row identified by a column search
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {string} searchCol
 * @param {*} searchValue
 * @param {Object} updateMap - { colName: newValue, ... }
 * @return {boolean} True if found and updated
 */
function updateRowByColValue_(sheetKey, tabName, searchCol, searchValue, updateMap) {
  invalidateSheetCache_(sheetKey, tabName);
  var sheet = getSheet_(sheetKey, tabName);
  var allData = getTabAllValues_(sheetKey, tabName);
  var headers = allData && allData.length > 0 ? allData[0].map(function(h) { return String(h).trim(); }) : getHeaders_(sheet);
  var match = findRow_(sheetKey, tabName, searchCol, searchValue);
  if (!match) return false;

  var rowNum = match._rowNumber;
  for (var key in updateMap) {
    var cIndex = headers.indexOf(key);
    if (cIndex !== -1) {
      sheet.getRange(rowNum, cIndex + 1).setValue(updateMap[key]);
    }
  }
  return true;
}

/**
 * Prevents race conditions by wrapping a function inside a ScriptLock.
 * Releases the lock reliably in a finally block.
 * @param {string} lockName - Diagnostic identifier
 * @param {number} timeoutMs - Max wait time in ms (e.g. 30000)
 * @param {Function} callback - Function to execute inside lock
 * @return {*} Result of callback
 */
function withLock_(lockName, timeoutMs, callback) {
  var lock = LockService.getScriptLock();
  var timeout = timeoutMs || 30000;
  var success = lock.tryLock(timeout);

  if (!success) {
    throw new Error('Lock timeout: Could not acquire lock for ' + lockName);
  }

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

/**
 * Auto-increments and formats the next ID for a given table
 * e.g. EXP-0001, S001, Q-0001
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {number} idColIndex - 1-based column where ID is stored
 * @param {string} prefix - e.g. "EXP" or "S"
 * @param {number} [padLen=4]
 * @return {string}
 */
function getNextId_(sheetKey, tabName, idColIndex, prefix, padLen) {
  var sheet = getSheet_(sheetKey, tabName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return formatId_(prefix, 1, padLen);
  }

  // Get last ID in column
  var lastVal = sheet.getRange(lastRow, idColIndex).getValue();
  if (!lastVal) {
    return formatId_(prefix, lastRow, padLen);
  }

  // Extract trailing digits
  var match = String(lastVal).match(/(\d+)$/);
  if (match) {
    var nextNum = parseInt(match[1], 10) + 1;
    return formatId_(prefix, nextNum, padLen);
  }

  return formatId_(prefix, lastRow, padLen);
}
