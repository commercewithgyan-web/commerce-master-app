/**
 * ============================================================================
 * MASTER QUESTION REPOSITORY — 1-CLICK AI QUESTION GENERATOR (v2.4 PATCHED)
 * Attached to Spreadsheet: "Master Question Repository"
 * Spreadsheet ID: 1FMk5KBCaEBLj7rwmGI9lIEpM02aGWrC-6tD8GXApDCY
 * ============================================================================
 */

var MASTER_REPO_SPREADSHEET_ID = '1FMk5KBCaEBLj7rwmGI9lIEpM02aGWrC-6tD8GXApDCY';
var VAULT_START_ROW = 6;
var VAULT_START_COL = 27; // Column AA
var VAULT_NUM_COLS = 20;  // Columns AA to AT
var QA_STATUS_COL = 47;   // Column AU (QA_Audit_Status)

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ Commerce Gyan AI')
    .addItem('🚀 1-Click Generate & Insert Questions (AA:AT Vault)', 'generateAndInsertQuestions_')
    .addSeparator()
    .addItem('✅ Approve All QA-Ready Drafts on Active Tab', 'approveReadyDraftsOnActiveSheet_')
    .addItem('🔄 Reset Active Tab Filters to ALL', 'resetActiveSheetFilters_')
    .addToUi();
}

function resolveTargetVaultTab_(targetClass, targetSubject, helperTabCell) {
  var validTabs = {
    '11_ACC': true,
    '11_BST': true,
    '11_ECO_MICRO': true,
    '11_STAT': true,
    '12_ACC': true,
    '12_BST': true,
    '12_ECO_MACRO': true,
    '12_ECO_IED': true
  };

  var trimmedHelper = String(helperTabCell || '').trim().toUpperCase();
  if (validTabs[trimmedHelper]) {
    return trimmedHelper;
  }

  var isClass11 = String(targetClass || '').indexOf('11') !== -1;
  var subj = String(targetSubject || '').toLowerCase();

  if (subj.indexOf('business') !== -1 || subj.indexOf('bst') !== -1) {
    return isClass11 ? '11_BST' : '12_BST';
  }
  if (subj.indexOf('account') !== -1 || subj.indexOf('acc') !== -1) {
    return isClass11 ? '11_ACC' : '12_ACC';
  }
  if (subj.indexOf('stat') !== -1) {
    return '11_STAT';
  }
  if (subj.indexOf('indian') !== -1 || subj.indexOf('ied') !== -1 || subj.indexOf('development') !== -1) {
    return '12_ECO_IED';
  }
  if (subj.indexOf('micro') !== -1) {
    return '11_ECO_MICRO';
  }
  if (subj.indexOf('macro') !== -1) {
    return '12_ECO_MACRO';
  }
  if (subj.indexOf('eco') !== -1) {
    return isClass11 ? '11_ECO_MICRO' : '12_ECO_MACRO';
  }

  return isClass11 ? '11_ACC' : '12_ACC';
}

function getNextMasterVaultRow_(sheet) {
  var maxRows = Math.max(sheet.getMaxRows(), VAULT_START_ROW);
  var aaValues = sheet.getRange(VAULT_START_ROW, VAULT_START_COL, maxRows - VAULT_START_ROW + 1, 1).getValues();
  var lastPopulatedOffset = -1;

  for (var i = aaValues.length - 1; i >= 0; i--) {
    var cellVal = String(aaValues[i][0] || '').trim();
    if (cellVal !== '') {
      lastPopulatedOffset = i;
      break;
    }
  }

  return VAULT_START_ROW + lastPopulatedOffset + 1;
}

function generateAndInsertQuestions_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var promptSheet = ss.getSheetByName('PROMPT_ENGINE');

  if (!promptSheet) {
    ui.alert('Error', 'PROMPT_ENGINE tab not found!', ui.ButtonSet.OK);
    return;
  }

  var targetClass = String(promptSheet.getRange('C4').getValue() || 'Class 11').trim();
  var targetSubject = String(promptSheet.getRange('C5').getValue() || 'Accountancy').trim();
  var chapterName = String(promptSheet.getRange('C6').getValue() || '').trim();
  var topicName = String(promptSheet.getRange('C7').getValue() || '').trim();
  var subtopicName = String(promptSheet.getRange('C8').getValue() || '').trim();
  var questionType = String(promptSheet.getRange('C9').getValue() || 'MCQ (1 Mark)').trim();
  var numQuestions = parseInt(promptSheet.getRange('C10').getValue(), 10) || 5;
  var difficulty = String(promptSheet.getRange('C11').getValue() || 'Standard').trim();
  var helperTabCell = String(promptSheet.getRange('D5').getValue() || '').trim();
  var canonicalTopicIdCell = String(promptSheet.getRange('D8').getValue() || '').trim();
  var userPrompt = String(promptSheet.getRange('F11').getValue() || '').trim();

  var sheetName = resolveTargetVaultTab_(targetClass, targetSubject, helperTabCell);
  var targetSheet = ss.getSheetByName(sheetName);
  if (!targetSheet) {
    ui.alert('Error', 'Target sheet tab "' + sheetName + '" not found!', ui.ButtonSet.OK);
    return;
  }

  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    ui.alert('API Key Missing', 'Please set GEMINI_API_KEY in Project Settings > Script Properties!', ui.ButtonSet.OK);
    return;
  }

  ui.showSidebar(
    HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:12px;">' +
      '<h3>⏳ Generating ' + numQuestions + ' questions via Gemini...</h3>' +
      '<p>Target Vault: <b>' + sheetName + ' (Columns AA to AT)</b></p>' +
      '<p>Chapter: ' + chapterName + '<br>Topic: ' + topicName + '</p>' +
      '<p style="color:#666;font-size:12px;">Questions will be inserted safely into the Master Vault (AA:AT) with Status = Draft so your live filter canvas (A6) stays intact.</p>' +
      '</div>'
    ).setTitle('Commerce Gyan AI Engine')
  );

  var candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  var systemInstruction =
    'You are Senior CBSE Commerce Head Examiner Gyan Sir (Commerce Gyan, Begusarai). ' +
    'Generate exactly ' + numQuestions + ' authentic CBSE examination questions strictly matching the 20-column schema: ' +
    '[0] QID, [1] Canonical_Topic_ID, [2] ChapterNo, [3] ChapterName, [4] Topic, [5] Subtopic, ' +
    '[6] QuestionType, [7] Marks, [8] Difficulty, [9] QuestionText, [10] OptA, [11] OptB, [12] OptC, [13] OptD, ' +
    '[14] CorrectAnswer, [15] Official_CBSE_Marking_Scheme, [16] Explanation_NCERT, [17] Trap_Alert, ' +
    '[18] RealWorld_SharkTank_Hint, [19] Status. ' +
    'For MCQs, populate OptA to OptD with distinct choices and set CorrectAnswer to A, B, C, or D. ' +
    'For non-MCQ subjective/case study questions, set OptA, OptB, OptC, OptD to "-" and put the full model solution in CorrectAnswer. ' +
    'Set Status (index 19) to "Draft". Return strictly a JSON array of 20-element string arrays.';

  var payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{
      role: 'user',
      parts: [{
        text: userPrompt +
          '\n\nCRITICAL: Return strictly a JSON array of ' + numQuestions +
          ' rows, where each row has exactly 20 string elements mapping to Columns AA through AT.'
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: { type: 'ARRAY', items: { type: 'STRING' } }
      }
    }
  };

  var success = false;
  var lastErr = '';

  for (var i = 0; i < candidateModels.length; i++) {
    var model = candidateModels[i];
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

    try {
      var res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      if (res.getResponseCode() === 200) {
        var body = JSON.parse(res.getContentText());
        var rawText = body.candidates[0].content.parts[0].text;
        var rowsData = JSON.parse(rawText);

        if (rowsData && rowsData.length > 0) {
          var startRow = getNextMasterVaultRow_(targetSheet);
          var normalizedRows = rowsData.map(function(row, idx) {
            var r = [];
            for (var c = 0; c < VAULT_NUM_COLS; c++) {
              r.push(row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '');
            }
            if (canonicalTopicIdCell && canonicalTopicIdCell.indexOf('C1') === 0 && (!r[1] || r[1].indexOf('C1') !== 0)) {
              r[1] = canonicalTopicIdCell;
            }
            if (!r[0]) {
              var seqNum = String(startRow - VAULT_START_ROW + idx + 1);
              while (seqNum.length < 3) seqNum = '0' + seqNum;
              r[0] = sheetName.replace('_', '') + '-Q' + seqNum;
            }
            var isMcq = r[6].toUpperCase().indexOf('MCQ') !== -1;
            if (!isMcq) {
              r[10] = '-';
              r[11] = '-';
              r[12] = '-';
              r[13] = '-';
            }
            r[19] = 'Draft';
            return r;
          });

          targetSheet.getRange(startRow, VAULT_START_COL, normalizedRows.length, VAULT_NUM_COLS).setValues(normalizedRows);
          SpreadsheetApp.flush();

          ui.alert(
            'Success! 🎉',
            normalizedRows.length + ' questions safely appended to ' + sheetName +
            ' in Master Vault rows AA' + startRow + ':AT' + (startRow + normalizedRows.length - 1) +
            ' with Status = "Draft".',
            ui.ButtonSet.OK
          );
          success = true;
          break;
        }
      } else {
        lastErr = 'Model ' + model + ' error: HTTP ' + res.getResponseCode() + ' - ' + res.getContentText();
      }
    } catch (e) {
      lastErr = e.toString();
    }
  }

  if (!success) {
    ui.alert('Generation Notice', 'Failed to generate: ' + lastErr, ui.ButtonSet.OK);
  }
}

function approveReadyDraftsOnActiveSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var ui = SpreadsheetApp.getUi();
  var sheetName = sheet.getName();

  if (sheetName === 'DASHBOARD' || sheetName === 'PROMPT_ENGINE' || sheetName === 'LOOKUP_DATA') {
    ui.alert('Select a Subject Tab', 'Please switch to one of the 8 subject tabs (e.g. 11_ACC, 12_BST) first.', ui.ButtonSet.OK);
    return;
  }

  var nextRow = getNextMasterVaultRow_(sheet);
  var numRows = nextRow - VAULT_START_ROW;
  if (numRows <= 0) {
    ui.alert('Empty Vault', 'No questions found in ' + sheetName + ' Master Vault (AA6:AT).', ui.ButtonSet.OK);
    return;
  }

  var statusRange = sheet.getRange(VAULT_START_ROW, 46, numRows, 2);
  var statusVals = statusRange.getValues();
  var approvedCount = 0;
  var blockedCount = 0;

  for (var i = 0; i < statusVals.length; i++) {
    var currentStatus = String(statusVals[i][0] || '').trim();
    var qaCheck = String(statusVals[i][1] || '').trim();

    if (currentStatus !== 'Approved') {
      if (qaCheck === '✅ READY TO APPROVE') {
        sheet.getRange(VAULT_START_ROW + i, 46).setValue('Approved');
        approvedCount++;
      } else if (qaCheck !== '') {
        blockedCount++;
      }
    }
  }

  SpreadsheetApp.flush();
  ui.alert(
    'QA Approval Complete ✅',
    'Sheet: ' + sheetName + '\n' +
    '• Newly Approved: ' + approvedCount + ' questions\n' +
    '• Held Back by QA Gatekeeper (Col AU): ' + blockedCount + ' questions',
    ui.ButtonSet.OK
  );
}

function resetActiveSheetFilters_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var sheetName = sheet.getName();
  if (sheetName === 'DASHBOARD' || sheetName === 'PROMPT_ENGINE' || sheetName === 'LOOKUP_DATA') {
    return;
  }
  sheet.getRange('A3').setValue('ALL CHAPTERS');
  sheet.getRange('D3').setValue('ALL TOPICS');
  sheet.getRange('G3').setValue('ALL SUBTOPICS');
  sheet.getRange('J3').setValue('ALL TYPES');
  SpreadsheetApp.flush();
}
