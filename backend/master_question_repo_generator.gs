/**
 * ═══════════════════════════════════════════════════════════════════════
 * MASTER QUESTION REPOSITORY — 1-CLICK AI QUESTION GENERATOR
 * Attached to Spreadsheet "Master Question Repository"
 * Spreadsheet ID: 1FMk5KBCaEBLj7rwmGI9lIEpM02aGWrC-6tD8GXApDCY
 * ═══════════════════════════════════════════════════════════════════════
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ Commerce Gyan AI')
    .addItem('🚀 1-Click Generate & Insert Questions', 'generateAndInsertQuestions_')
    .addToUi();
}

function generateAndInsertQuestions_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const promptSheet = ss.getSheetByName('PROMPT_ENGINE');
  
  if (!promptSheet) {
    ui.alert('Error', 'PROMPT_ENGINE tab not found!', ui.ButtonSet.OK);
    return;
  }

  const targetClass = String(promptSheet.getRange('C4').getValue());
  const targetSubject = String(promptSheet.getRange('C5').getValue());
  const userPrompt = String(promptSheet.getRange('F11').getValue());
  
  let sheetName = '12_BST';
  if (targetSubject.indexOf('Business Studies') !== -1) {
    sheetName = targetClass.indexOf('11') !== -1 ? '11_BST' : '12_BST';
  } else if (targetSubject.indexOf('Accountancy') !== -1) {
    sheetName = targetClass.indexOf('11') !== -1 ? '11_ACC' : '12_ACC';
  } else if (targetSubject.indexOf('Economics') !== -1) {
    sheetName = targetClass.indexOf('11') !== -1 ? '11_ECO_MICRO' : '12_ECO_MACRO';
  } else if (targetSubject.indexOf('Statistics') !== -1) {
    sheetName = '11_STAT';
  }

  const targetSheet = ss.getSheetByName(sheetName);
  if (!targetSheet) {
    ui.alert('Error', 'Target sheet tab "' + sheetName + '" not found!', ui.ButtonSet.OK);
    return;
  }

  ui.showSidebar(HtmlService.createHtmlOutput('<h3>⏳ Generating questions via Gemini...</h3><p>Please wait 10-15 seconds. Questions will be inserted into ' + sheetName + ' across columns A to T!</p>').setTitle('AI Working'));

  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    ui.alert('API Key Missing', 'Please set GEMINI_API_KEY in Project Settings > Script Properties!', ui.ButtonSet.OK);
    return;
  }

  // Active models fallback chain
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const systemInstruction = "You are Senior CBSE Commerce Head Examiner Gyan Sir. " +
    "Generate authentic exam questions strictly matching the 20 columns: QID, Canonical_Topic_ID, ChapterNo, ChapterName, Topic, Subtopic, QuestionType, Marks, Difficulty, QuestionText, OptA, OptB, OptC, OptD, CorrectAnswer, Official_CBSE_Marking_Scheme, Explanation_NCERT, Trap_Alert, RealWorld_SharkTank_Hint, Status. " +
    "Return JSON array of 20-item arrays.";

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userPrompt + "\nOutput strictly as a JSON array of rows where each row has exactly 20 column values matching columns A to T." }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: { type: "ARRAY", items: { type: "STRING" } }
      }
    }
  };

  let success = false;
  let lastErr = '';

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

    try {
      const res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      if (res.getResponseCode() === 200) {
        const body = JSON.parse(res.getContentText());
        const rowsData = JSON.parse(body.candidates[0].content.parts[0].text);

        if (rowsData && rowsData.length > 0) {
          const lastRow = targetSheet.getLastRow();
          const startRow = Math.max(lastRow + 1, 6); // Leave top KPI rows untouched
          targetSheet.getRange(startRow, 1, rowsData.length, 20).setValues(rowsData);
          ui.alert('Success! 🎉', rowsData.length + ' questions successfully inserted into ' + sheetName + ' across columns A to T!', ui.ButtonSet.OK);
          success = true;
          break;
        }
      } else {
        lastErr = 'Model ' + model + ' error: HTTP ' + res.getResponseCode();
      }
    } catch (e) {
      lastErr = e.toString();
    }
  }

  if (!success) {
    ui.alert('Generation Notice', 'Failed to generate: ' + lastErr, ui.ButtonSet.OK);
  }
}
