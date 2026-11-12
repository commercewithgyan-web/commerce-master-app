/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SYLLABUS DATA SYNCHRONIZER (syncSyllabusScript.gs)
 * Syncs and programmatically maps all 797 CBSE syllabus topics
 * from Gyan Sir's source spreadsheet into "1. Syllabus Planner" -> Master_Syllabus.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * Syncs all 797 syllabus topics from source to target Master_Syllabus sheet
 * Performs field mapping, chapter parsing, and weightage marks lookup.
 * 
 * @return {number} Number of rows inserted
 */
function syncMasterSyllabusData() {
  var SOURCE_SS_ID = '1TzmB1Ehyb7JwdY0phx-LzB4t-Kq2Z-Tw1m8YPrguCa4';
  var TARGET_SS_ID = '1-LrOhyGDDAwxm-eNF-kJX6JldbllQYulZ9wLo_63hFY';

  var sourceSs = SpreadsheetApp.openById(SOURCE_SS_ID);
  var sourceSheet = sourceSs.getSheetByName('Topic_Master');
  if (!sourceSheet) {
    throw new Error('Topic_Master sheet not found in source spreadsheet: ' + SOURCE_SS_ID);
  }

  var sourceData = sourceSheet.getRange(2, 1, 797, 8).getValues();

  var targetSs = SpreadsheetApp.openById(TARGET_SS_ID);
  var targetSheet = targetSs.getSheetByName('Master_Syllabus');
  if (!targetSheet) {
    throw new Error('Master_Syllabus sheet not found in target spreadsheet: ' + TARGET_SS_ID);
  }

  // Clear any existing rows beyond header
  var lastRow = targetSheet.getLastRow();
  if (lastRow > 1) {
    targetSheet.getRange(2, 1, lastRow - 1, 12).clearContent();
  }

  // Update validations to support Active status and full subject taxonomy
  var subjectRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Accountancy', 'Business Studies', 'Economics', 'Indian Economics', 'Macro Economics', 'Micro Economics', 'Statistics'], true)
    .build();
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Not Started', 'In Progress', 'Completed'], true)
    .build();
  targetSheet.getRange('B2:B1000').setDataValidation(subjectRule);
  targetSheet.getRange('L2:L1000').setDataValidation(statusRule);

  // Pre-load Chapter Weightage for Marks lookup
  var weightageSheet = targetSs.getSheetByName('Chapter_Weightage');
  var weightageMap = {};
  if (weightageSheet) {
    var wData = weightageSheet.getDataRange().getValues();
    for (var w = 1; w < wData.length; w++) {
      var wClass = String(wData[w][0]).trim();
      var wSubject = String(wData[w][1]).toLowerCase().trim();
      var wChNo = String(wData[w][2]).trim();
      var wMarks = String(wData[w][4] || '').trim();
      weightageMap[wClass + '_' + wSubject + '_' + wChNo] = wMarks;
    }
  }

  var mappedRows = sourceData.map(function(row) {
    var rawClass = row[2]; // Col C
    var rawSubject = row[1]; // Col B
    var rawBook = row[3]; // Col D
    var rawChapter = String(row[4] || '').trim(); // Col E

    // Extract Chapter Number & Chapter Name
    var chMatch = rawChapter.match(/^(?:Chapter|Ch\.?)?\s*(\d+)[\.:\-\s]/i) || rawChapter.match(/(?:Chapter|Ch\.?)\s*(\d+)/i);
    var chapterNo = chMatch ? parseInt(chMatch[1], 10) : '';

    var chapterName = rawChapter;
    if (/^(?:Chapter|Ch\.?)?\s*\d+[\.:\-\s]+/i.test(rawChapter)) {
      chapterName = rawChapter.replace(/^(?:Chapter|Ch\.?)?\s*\d+[\.:\-\s]+/, '').trim();
    } else if (rawChapter.indexOf(':') !== -1) {
      chapterName = rawChapter.split(':')[1].trim();
    }

    var rawTopic = row[5]; // Col F
    var rawSubtopic = row[6]; // Col G

    // Canonical ID (Col A holds the standard canonical ID C12-ACC-... or fallback to Col H)
    var canonicalId = (row[7] && String(row[7]).startsWith('C')) ? row[7] : (row[0] || row[7]);

    // Marks lookup from Chapter_Weightage
    var lookupKey = String(rawClass) + '_' + String(rawSubject).toLowerCase().trim() + '_' + String(chapterNo);
    var marks = weightageMap[lookupKey] || '';

    return [
      rawClass,       // Col A: Class
      rawSubject,     // Col B: Subject
      rawBook,        // Col C: Part
      '',             // Col D: Unit
      chapterNo,      // Col E: ChapterNo
      chapterName,    // Col F: ChapterName
      rawTopic,       // Col G: Topic
      rawSubtopic,    // Col H: Subtopic
      canonicalId,    // Col I: Canonical_Topic_ID
      marks,          // Col J: Marks
      '',             // Col K: Periods
      'Active'        // Col L: Status
    ];
  });

  // Batch insert all 797 rows in a single API call
  targetSheet.getRange(2, 1, mappedRows.length, 12).setValues(mappedRows);
  Logger.log('✅ Successfully mapped and inserted ' + mappedRows.length + ' syllabus rows into Master_Syllabus!');
  return mappedRows.length;
}
