/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SHEETS ENGINE (sheets.gs)
 * High-performance, atomic Google Sheets operations with range-specific
 * reads, LockService synchronization, and object mappings.
 * ═══════════════════════════════════════════════════════════════════════
 */

// Cache opened spreadsheets during execution to prevent redundant openById calls
var _spreadsheetCache = {};

/**
 * Retrieves a Sheet instance by Script Property key and Tab name
 * @param {string} sheetKey - e.g. 'SHEET_SYLLABUS', 'SHEET_QB', 'SHEET_FEE', 'SHEET_TG', 'SHEET_BOOKS'
 * @param {string} tabName - e.g. 'Students', 'QuestionBank'
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet_(sheetKey, tabName) {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty(sheetKey);
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
 * Appends a row atomically to the specified sheet
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {Array} rowData
 * @return {number} Appended row number
 */
function appendRow_(sheetKey, tabName, rowData) {
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
 * Uses range bounding to avoid fetching empty rows.
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {number} [maxRows=2000] - Hard safety limit
 * @return {Object[]}
 */
function getAllRowsAsObjects_(sheetKey, tabName, maxRows) {
  var sheet = getSheet_(sheetKey, tabName);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow <= 1 || lastCol < 1) return [];

  var fetchRows = Math.min(lastRow - 1, maxRows || 2000);
  var headers = getHeaders_(sheet);
  var data = sheet.getRange(2, 1, fetchRows, lastCol).getValues();

  var result = [];
  for (var i = 0; i < data.length; i++) {
    var rowObj = { _rowNumber: i + 2 };
    for (var j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    result.push(rowObj);
  }
  return result;
}

/**
 * Finds the first row matching a column name and value
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {string} colName - Header column name
 * @param {*} value - Value to search for
 * @return {Object|null} Row object with _rowNumber or null
 */
function findRow_(sheetKey, tabName, colName, value) {
  var sheet = getSheet_(sheetKey, tabName);
  var headers = getHeaders_(sheet);
  var colIndex = headers.indexOf(colName);
  if (colIndex === -1) {
    throw new Error('Column "' + colName + '" not found in tab: ' + tabName);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;

  var colValues = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
  var targetStr = String(value).trim().toLowerCase();

  for (var i = 0; i < colValues.length; i++) {
    if (String(colValues[i][0]).trim().toLowerCase() === targetStr) {
      var rowNum = i + 2;
      var rowData = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      var obj = { _rowNumber: rowNum };
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowData[j];
      }
      return obj;
    }
  }
  return null;
}

/**
 * Finds all rows matching a column name and value
 * @param {string} sheetKey
 * @param {string} tabName
 * @param {string} colName
 * @param {*} value
 * @return {Object[]}
 */
function findRows_(sheetKey, tabName, colName, value) {
  var sheet = getSheet_(sheetKey, tabName);
  var headers = getHeaders_(sheet);
  var colIndex = headers.indexOf(colName);
  if (colIndex === -1) {
    throw new Error('Column "' + colName + '" not found in tab: ' + tabName);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var colValues = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
  var targetStr = String(value).trim().toLowerCase();
  var matches = [];

  for (var i = 0; i < colValues.length; i++) {
    if (String(colValues[i][0]).trim().toLowerCase() === targetStr) {
      var rowNum = i + 2;
      var rowData = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      var obj = { _rowNumber: rowNum };
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = rowData[j];
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
  var sheet = getSheet_(sheetKey, tabName);
  var headers = getHeaders_(sheet);
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
