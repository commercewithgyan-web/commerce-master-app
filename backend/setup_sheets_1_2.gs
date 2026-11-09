/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SHEET 1 & 2 SETUP
 * Sheet 1: Syllabus Planner (3 tabs)
 * Sheet 2: Question Bank (11 tabs)
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// SHEET 1: SYLLABUS PLANNER (3 tabs)
// ─────────────────────────────────────────────────────────────────────

var SYLLABUS_HEADER_COLOR = '#D0E4F5'; // Light blue

/**
 * Sets up Sheet 1: Syllabus Planner with 3 tabs.
 * @param {SpreadsheetApp.Spreadsheet} ss
 */
function setupSheet1_SyllabusPlanner(ss) {
  setupTab_MasterSyllabus_(ss);
  setupTab_ChapterWeightage_(ss);
  setupTab_SyllabusSetup_(ss);
  Logger.log('  ✅ Sheet 1: Syllabus Planner — Complete (3 tabs)');
}

/** Tab 1.1: Master_Syllabus — 797 CBSE subtopics */
function setupTab_MasterSyllabus_(ss) {
  var sheet = createOrGetSheet_(ss, 'Master_Syllabus');
  var headers = ['Class', 'Subject', 'Part', 'Unit', 'ChapterNo', 'ChapterName',
                 'Topic', 'Subtopic', 'Canonical_Topic_ID', 'Marks', 'Periods', 'Status'];

  formatHeaders_(sheet, headers, SYLLABUS_HEADER_COLOR);

  // Data validations
  setDropdown_(sheet, 1, ['11', '12']);                                    // Class
  setDropdown_(sheet, 2, ['Accountancy', 'Business Studies', 'Economics']); // Subject
  setDropdown_(sheet, 12, ['Not Started', 'In Progress', 'Completed']);    // Status

  // Column widths
  setColumnWidths_(sheet, {
    1: 60, 2: 140, 3: 80, 4: 80, 5: 90, 6: 200,
    7: 200, 8: 250, 9: 160, 10: 70, 11: 70, 12: 100
  });

  // Number formats
  setNumberFormat_(sheet, [10, 11], '0');

  // Conditional formatting for Status
  addConditionalFormat_(sheet, 12, 'Completed', '#D5F5E3');
  addConditionalFormat_(sheet, 12, 'In Progress', '#FFF9C4');
  addConditionalFormat_(sheet, 12, 'Not Started', '#FADBD8');
}

/** Tab 1.2: Chapter_Weightage — Marks distribution */
function setupTab_ChapterWeightage_(ss) {
  var sheet = createOrGetSheet_(ss, 'Chapter_Weightage');
  var headers = ['Class', 'Subject', 'ChapterNo', 'ChapterName', 'TotalMarks',
                 'MCQ_Marks', 'SA1_Marks', 'SA2_Marks', 'LA_Marks', 'CaseStudy_Marks'];

  formatHeaders_(sheet, headers, SYLLABUS_HEADER_COLOR);

  setDropdown_(sheet, 1, ['11', '12']);
  setDropdown_(sheet, 2, ['Accountancy', 'Business Studies', 'Economics']);

  setColumnWidths_(sheet, {
    1: 60, 2: 140, 3: 90, 4: 200, 5: 90,
    6: 90, 7: 90, 8: 90, 9: 90, 10: 110
  });

  setNumberFormat_(sheet, [5, 6, 7, 8, 9, 10], '0');

  // Pre-fill Class 12 Accountancy sample data
  var sampleData = [
    ['12', 'Accountancy', '1', 'Accounting for Partnership Firms - Fundamentals', 36, 4, 6, 8, 12, 6],
    ['12', 'Accountancy', '2', 'Reconstitution of a Partnership Firm', 24, 4, 4, 8, 8, 0],
    ['12', 'Accountancy', '3', 'Admission of a Partner', 24, 4, 4, 8, 8, 0],
    ['12', 'Accountancy', '4', 'Retirement and Death of a Partner', 24, 4, 4, 8, 8, 0],
    ['12', 'Accountancy', '5', 'Dissolution of Partnership Firm', 16, 4, 4, 0, 8, 0],
    ['12', 'Accountancy', '6', 'Accounting for Share Capital', 20, 4, 4, 4, 8, 0],
    ['12', 'Accountancy', '7', 'Issue and Redemption of Debentures', 12, 4, 4, 0, 4, 0],
    ['12', 'Accountancy', '8', 'Financial Statements of a Company', 12, 4, 4, 0, 4, 0],
    ['12', 'Accountancy', '9', 'Analysis of Financial Statements', 12, 4, 4, 0, 4, 0],
    ['12', 'Accountancy', '10', 'Cash Flow Statement', 8, 0, 0, 0, 8, 0]
  ];
  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
    Logger.log('    📝 Pre-filled 10 sample chapter weightages (Class 12 Accountancy)');
  }
}

/** Tab 1.3: Setup — Configuration key-value pairs */
function setupTab_SyllabusSetup_(ss) {
  var sheet = createOrGetSheet_(ss, 'Setup');
  var headers = ['Key', 'Value'];
  formatHeaders_(sheet, headers, SYLLABUS_HEADER_COLOR);

  setColumnWidths_(sheet, { 1: 200, 2: 300 });

  // Pre-fill config
  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, 5, 2).setValues([
      ['SheetName', 'Syllabus Planner'],
      ['TotalSubtopics', '797'],
      ['Board', 'CBSE'],
      ['AcademicYear', '2026-27'],
      ['LastUpdated', Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd-MMM-yyyy')]
    ]);
  }

  // Protect sheet with warning
  var protection = sheet.protect().setDescription('Setup — Edit with caution');
  protection.setWarningOnly(true);
}


// ─────────────────────────────────────────────────────────────────────
// SHEET 2: QUESTION BANK (11 tabs)
// ─────────────────────────────────────────────────────────────────────

var QB_HEADER_COLOR = '#D5F5E3'; // Light green

/**
 * Sets up Sheet 2: Question Bank with 11 tabs.
 * @param {SpreadsheetApp.Spreadsheet} ss
 */
function setupSheet2_QuestionBank(ss) {
  setupTab_QuestionBank_(ss);
  setupTab_DailyQuestions_(ss);
  setupTab_StudentAnswers_(ss);
  setupTab_Leaderboard_(ss);
  setupTab_Doubts_(ss);
  setupTab_NotebookNotes_(ss);
  setupTab_NotebookFavourites_(ss);
  setupTab_NotebookSummary_(ss);
  setupTab_RevisionQueue_(ss);
  setupTab_AuditMysteries_(ss);
  setupTab_RedPenSubmissions_(ss);
  Logger.log('  ✅ Sheet 2: Question Bank — Complete (11 tabs)');
}

/** Tab 2.1: QuestionBank — Master question vault */
function setupTab_QuestionBank_(ss) {
  var sheet = createOrGetSheet_(ss, 'QuestionBank');
  var headers = ['QID', 'Created', 'Class', 'Subject', 'Chapter', 'Topic',
                 'Type', 'Question', 'OptA', 'OptB', 'OptC', 'OptD',
                 'CorrectIdx', 'Rubric', 'Explanation', 'SharkTank_Hint',
                 'Teacher_Ghost_Seconds', 'Source', 'ApprovalStatus',
                 'Confidence', 'Difficulty'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  // Data validations
  setDropdown_(sheet, 3, ['11', '12']);                                       // Class
  setDropdown_(sheet, 4, ['Accountancy', 'Business Studies', 'Economics']);    // Subject
  setDropdown_(sheet, 7, ['MCQ', 'Subjective']);                              // Type
  setDropdown_(sheet, 13, ['A', 'B', 'C', 'D']);                             // CorrectIdx
  setDropdown_(sheet, 18, ['Gemini', 'Manual']);                              // Source
  setDropdown_(sheet, 19, ['AI_Draft', 'Approved', 'Rejected']);              // ApprovalStatus
  setDropdown_(sheet, 20, ['high', 'medium', 'low']);                         // Confidence
  setDropdown_(sheet, 21, ['Easy', 'Medium', 'Hard']);                        // Difficulty

  // Column widths
  setColumnWidths_(sheet, {
    1: 80, 2: 100, 3: 55, 4: 130, 5: 120, 6: 150,
    7: 80, 8: 350, 9: 160, 10: 160, 11: 160, 12: 160,
    13: 75, 14: 250, 15: 300, 16: 200,
    17: 80, 18: 80, 19: 100, 20: 85, 21: 85
  });

  // Date format for Created
  setDateFormat_(sheet, [2], 'dd-MMM-yyyy');

  // Number format for Ghost Seconds
  setNumberFormat_(sheet, [17], '0');

  // Conditional formatting for ApprovalStatus
  addConditionalFormat_(sheet, 19, 'Approved', '#D5F5E3');
  addConditionalFormat_(sheet, 19, 'AI_Draft', '#FFF9C4');
  addConditionalFormat_(sheet, 19, 'Rejected', '#FADBD8');
}

/** Tab 2.2: DailyQuestions — Today's served questions */
function setupTab_DailyQuestions_(ss) {
  var sheet = createOrGetSheet_(ss, 'DailyQuestions');
  var headers = ['Date', 'QID', 'Class', 'Subject', 'Type', 'Ghost_Target_Sec'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setDropdown_(sheet, 3, ['11', '12']);
  setDropdown_(sheet, 4, ['Accountancy', 'Business Studies', 'Economics']);
  setDropdown_(sheet, 5, ['MCQ', 'Subjective']);

  setColumnWidths_(sheet, { 1: 110, 2: 80, 3: 55, 4: 130, 5: 90, 6: 100 });
  setDateFormat_(sheet, [1], 'dd-MMM-yyyy');
  setNumberFormat_(sheet, [6], '0');
}

/** Tab 2.3: StudentAnswers — All student submissions */
function setupTab_StudentAnswers_(ss) {
  var sheet = createOrGetSheet_(ss, 'StudentAnswers');
  var headers = ['Timestamp', 'TelegramID', 'StudentName', 'QID', 'AnswerText',
                 'WordCount', 'Score', 'TimeTaken_Seconds', 'BeatGhost_Status', 'Status'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setDropdown_(sheet, 9, ['BEAT_RECORD', 'REGULAR', 'SLOW']);
  setDropdown_(sheet, 10, ['Submitted', 'Reviewed', 'Edited']);

  setColumnWidths_(sheet, {
    1: 140, 2: 100, 3: 120, 4: 80, 5: 300,
    6: 80, 7: 70, 8: 80, 9: 110, 10: 90
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy HH:mm:ss');
  setNumberFormat_(sheet, [6, 7, 8], '0');
}

/** Tab 2.4: Leaderboard — Ranked student scores */
function setupTab_Leaderboard_(ss) {
  var sheet = createOrGetSheet_(ss, 'Leaderboard');
  var headers = ['TelegramID', 'StudentName', 'Class', 'TotalScore',
                 'SpeedFinisher_Badges', 'CG_Coins', 'Rank', 'LastActive'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setDropdown_(sheet, 3, ['11', '12']);

  setColumnWidths_(sheet, {
    1: 100, 2: 130, 3: 55, 4: 90, 5: 90, 6: 80, 7: 60, 8: 110
  });

  setNumberFormat_(sheet, [4, 5, 6, 7], '0');
  setDateFormat_(sheet, [8], 'dd-MMM-yyyy');
}

/** Tab 2.5: Doubts — Text & voice doubt logs */
function setupTab_Doubts_(ss) {
  var sheet = createOrGetSheet_(ss, 'Doubts');
  var headers = ['Timestamp', 'TelegramID', 'StudentName', 'Question', 'Answer',
                 'InputType', 'AudioDuration_Sec', 'Persona_Used',
                 'Story_Analogies_Used', 'Status'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setDropdown_(sheet, 6, ['text', 'voice']);
  setDropdown_(sheet, 8, ['ELI10_Voice', 'Standard_Academic']);
  setDropdown_(sheet, 10, ['Answered', 'Pending', 'Failed']);

  setColumnWidths_(sheet, {
    1: 140, 2: 100, 3: 120, 4: 350, 5: 400,
    6: 80, 7: 80, 8: 120, 9: 200, 10: 80
  });

  setDateFormat_(sheet, [1], 'dd-MMM-yyyy HH:mm:ss');
  setNumberFormat_(sheet, [7], '0');
}

/** Tab 2.6: Notebook_Notes — Student personal notes */
function setupTab_NotebookNotes_(ss) {
  var sheet = createOrGetSheet_(ss, 'Notebook_Notes');
  var headers = ['Timestamp', 'TelegramID', 'QID', 'Title', 'StudentNote', 'Topic'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setColumnWidths_(sheet, { 1: 140, 2: 100, 3: 80, 4: 200, 5: 350, 6: 150 });
  setDateFormat_(sheet, [1], 'dd-MMM-yyyy HH:mm:ss');
}

/** Tab 2.7: Notebook_Favourites — Starred items */
function setupTab_NotebookFavourites_(ss) {
  var sheet = createOrGetSheet_(ss, 'Notebook_Favourites');
  var headers = ['Timestamp', 'TelegramID', 'QID', 'Title'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setColumnWidths_(sheet, { 1: 140, 2: 100, 3: 80, 4: 250 });
  setDateFormat_(sheet, [1], 'dd-MMM-yyyy HH:mm:ss');
}

/** Tab 2.8: Notebook_Summary — AI-generated weekly summaries */
function setupTab_NotebookSummary_(ss) {
  var sheet = createOrGetSheet_(ss, 'Notebook_Summary');
  var headers = ['Week', 'TelegramID', 'Summary', 'WeakTopics',
                 'SuggestedActions', 'GeneratedAt'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setColumnWidths_(sheet, { 1: 100, 2: 100, 3: 350, 4: 250, 5: 250, 6: 140 });
  setDateFormat_(sheet, [6], 'dd-MMM-yyyy HH:mm:ss');
}

/** Tab 2.9: Revision_Queue — Spaced repetition scheduler */
function setupTab_RevisionQueue_(ss) {
  var sheet = createOrGetSheet_(ss, 'Revision_Queue');
  var headers = ['TelegramID', 'QID', 'LastAttempt', 'NextReview',
                 'Attempts', 'Status'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setDropdown_(sheet, 6, ['Due', 'Scheduled', 'Mastered']);

  setColumnWidths_(sheet, { 1: 100, 2: 80, 3: 110, 4: 110, 5: 70, 6: 90 });
  setDateFormat_(sheet, [3, 4], 'dd-MMM-yyyy');
  setNumberFormat_(sheet, [5], '0');

  // Conditional formatting for Status
  addConditionalFormat_(sheet, 6, 'Due', '#FADBD8');
  addConditionalFormat_(sheet, 6, 'Mastered', '#D5F5E3');
}

/** Tab 2.10: Audit_Mysteries — Saturday detective scenarios */
function setupTab_AuditMysteries_(ss) {
  var sheet = createOrGetSheet_(ss, 'Audit_Mysteries');
  var headers = ['MysteryID', 'ReleaseDate', 'Class', 'Chapter',
                 'Scenario_Title', 'Story_Text', 'Suspect_Options_JSON',
                 'Correct_Verdict', 'Forensic_Explanation', 'Status'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setDropdown_(sheet, 3, ['11', '12']);
  setDropdown_(sheet, 10, ['Draft', 'Scheduled', 'Released', 'Completed']);

  setColumnWidths_(sheet, {
    1: 90, 2: 110, 3: 55, 4: 120, 5: 200,
    6: 400, 7: 300, 8: 150, 9: 350, 10: 90
  });

  setDateFormat_(sheet, [2], 'dd-MMM-yyyy');
}

/** Tab 2.11: RedPen_Submissions — Handwritten copy check log */
function setupTab_RedPenSubmissions_(ss) {
  var sheet = createOrGetSheet_(ss, 'RedPen_Submissions');
  var headers = ['SubmissionID', 'Timestamp', 'TelegramID', 'StudentName',
                 'Class', 'Subject', 'Chapter', 'ImageDriveURL',
                 'Correct_Elements', 'Traps_Caught', 'Narration_Check',
                 'Estimated_Marks', 'Status'];

  formatHeaders_(sheet, headers, QB_HEADER_COLOR);

  setDropdown_(sheet, 5, ['11', '12']);
  setDropdown_(sheet, 6, ['Accountancy', 'Business Studies', 'Economics']);
  setDropdown_(sheet, 13, ['Submitted', 'Analyzed', 'Reviewed']);

  setColumnWidths_(sheet, {
    1: 100, 2: 140, 3: 100, 4: 120, 5: 55, 6: 130, 7: 120,
    8: 200, 9: 250, 10: 250, 11: 250, 12: 80, 13: 90
  });

  setDateFormat_(sheet, [2], 'dd-MMM-yyyy HH:mm:ss');
  setNumberFormat_(sheet, [12], '0.0');
}
