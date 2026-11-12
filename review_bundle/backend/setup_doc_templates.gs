/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — SETUP DOC TEMPLATES
 * Generates official Google Docs templates for:
 * 1. Daily Subjective Question PDF
 * 2. Model Answer PDF with Step-by-Step Marking Rubric
 * 3. Official Fee Receipt with Computer-Generated Proforma
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * 🚀 Setup Google Docs Templates
 * Run once to generate the 3 official templates in Google Drive
 * and save their IDs to Script Properties.
 */
function setupDocTemplates() {
  Logger.log('🚀 Setting up Google Docs Templates in Google Drive...');
  var props = PropertiesService.getScriptProperties();

  // Find or create "Commerce Master App Templates" folder
  var folderName = 'Commerce Master App Templates';
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  Logger.log('📁 Folder: ' + folder.getName() + ' (' + folder.getId() + ')');

  // 1. Question Template
  var qDocId = props.getProperty('DOC_QUESTION_TEMPLATE_ID');
  if (!qDocId) {
    var qDoc = createQuestionDocTemplate_(folder);
    props.setProperty('DOC_QUESTION_TEMPLATE_ID', qDoc.getId());
    Logger.log('  ✅ Created Question Template: ' + qDoc.getId());
  } else {
    Logger.log('  ℹ️ Question Template exists: ' + qDocId);
  }

  // 2. Answer Template
  var aDocId = props.getProperty('DOC_ANSWER_TEMPLATE_ID');
  if (!aDocId) {
    var aDoc = createAnswerDocTemplate_(folder);
    props.setProperty('DOC_ANSWER_TEMPLATE_ID', aDoc.getId());
    Logger.log('  ✅ Created Answer Template: ' + aDoc.getId());
  } else {
    Logger.log('  ℹ️ Answer Template exists: ' + aDocId);
  }

  // 3. Receipt Template
  var rDocId = props.getProperty('DOC_RECEIPT_TEMPLATE_ID');
  if (!rDocId) {
    var rDoc = createReceiptDocTemplate_(folder);
    props.setProperty('DOC_RECEIPT_TEMPLATE_ID', rDoc.getId());
    Logger.log('  ✅ Created Receipt Template: ' + rDoc.getId());
  } else {
    Logger.log('  ℹ️ Receipt Template exists: ' + rDocId);
  }

  Logger.log('\n═══════════════════════════════════════════════');
  Logger.log('✅ DOC TEMPLATES CREATED SUCCESSFULLY');
  Logger.log('  DOC_QUESTION_TEMPLATE_ID: ' + props.getProperty('DOC_QUESTION_TEMPLATE_ID'));
  Logger.log('  DOC_ANSWER_TEMPLATE_ID  : ' + props.getProperty('DOC_ANSWER_TEMPLATE_ID'));
  Logger.log('  DOC_RECEIPT_TEMPLATE_ID : ' + props.getProperty('DOC_RECEIPT_TEMPLATE_ID'));
  Logger.log('═══════════════════════════════════════════════');
}

/**
 * Creates the Daily Subjective Question Google Doc template
 * @param {Folder} folder
 * @return {Document}
 */
function createQuestionDocTemplate_(folder) {
  var doc = DocumentApp.create('TEMPLATE_Daily_Question_CommerceGyan');
  var file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);

  var body = doc.getBody();
  body.clear();

  // Page setup: A4, 0.5 in margins
  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(36);
  body.setMarginRight(36);

  // Title / Institution Header
  var p1 = body.appendParagraph('COMMERCE GYAN — DAILY PRACTICE QUESTION');
  p1.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p1.setFontFamily('Plus Jakarta Sans');
  p1.setFontSize(16);
  p1.setBold(true);
  p1.setForegroundColor('#2D124D'); // Royal Imperial Violet

  var pSub = body.appendParagraph('CBSE Board Exam Series • Solo Educator & Founder: Gyan Sir');
  pSub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pSub.setFontFamily('Inter');
  pSub.setFontSize(9);
  pSub.setForegroundColor('#64748B');

  body.appendHorizontalRule();

  // Meta Box Table
  var metaTable = body.appendTable([
    ['Date: {{DATE}}', 'Class: {{CLASS}} • Subject: {{SUBJECT}}'],
    ['Chapter: {{CHAPTER}}', 'Marks Weightage: [{{MARKS}} Marks]']
  ]);
  metaTable.setBorderWidth(0.5);
  metaTable.setBorderColor('#CBD5E1');

  body.appendParagraph('');

  // Question Heading
  var qHeading = body.appendParagraph('PRACTICE PROBLEM:');
  qHeading.setFontFamily('Plus Jakarta Sans');
  qHeading.setFontSize(12);
  qHeading.setBold(true);
  qHeading.setForegroundColor('#0B0C10');

  // Question Content Box
  var qContent = body.appendParagraph('{{QUESTION_TEXT}}');
  qContent.setFontFamily('Lora');
  qContent.setFontSize(11);
  qContent.setLineSpacing(1.25);
  qContent.setForegroundColor('#1E293B');

  body.appendParagraph('');

  // Instructions Card
  var instrHead = body.appendParagraph('📌 INSTRUCTIONS & CB-EVALUATION GUIDELINES:');
  instrHead.setFontFamily('Plus Jakarta Sans');
  instrHead.setFontSize(10);
  instrHead.setBold(true);
  instrHead.setForegroundColor('#475569');

  var i1 = body.appendListItem('Solve this question in your official Practice Register with proper format & narrations.');
  i1.setFontFamily('Inter');
  i1.setFontSize(9.5);
  var i2 = body.appendListItem('The Official Model Answer with CBSE Step-by-Step Marking Rubric will be released tomorrow morning at 08:15 AM IST.');
  i2.setFontFamily('Inter');
  i2.setFontSize(9.5);
  var i3 = body.appendListItem('Paid Batch Students: Open the Telegram Mini App to submit your daily MCQ drill and earn CG Coins!');
  i3.setFontFamily('Inter');
  i3.setFontSize(9.5);

  body.appendParagraph('');
  body.appendHorizontalRule();

  // Footer
  var pFooter = body.appendParagraph('Commerce Gyan Telegram Channel • Single Broadcast System • Strictly CBSE Syllabus');
  pFooter.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pFooter.setFontFamily('Inter');
  pFooter.setFontSize(8);
  pFooter.setForegroundColor('#94A3B8');

  doc.saveAndClose();
  return doc;
}

/**
 * Creates the Model Answer with Step-by-Step Marking Google Doc template
 * @param {Folder} folder
 * @return {Document}
 */
function createAnswerDocTemplate_(folder) {
  var doc = DocumentApp.create('TEMPLATE_Model_Answer_CommerceGyan');
  var file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);

  var body = doc.getBody();
  body.clear();

  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(36);
  body.setMarginRight(36);

  // Institution Header
  var p1 = body.appendParagraph('COMMERCE GYAN — OFFICIAL MODEL ANSWER KEY');
  p1.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p1.setFontFamily('Plus Jakarta Sans');
  p1.setFontSize(16);
  p1.setBold(true);
  p1.setForegroundColor('#2D124D');

  var pSub = body.appendParagraph('Diagnostic Marking Key & CBSE Examiner Traps • Gyan Sir');
  pSub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pSub.setFontFamily('Inter');
  pSub.setFontSize(9);
  pSub.setForegroundColor('#64748B');

  body.appendHorizontalRule();

  // Meta Table
  var metaTable = body.appendTable([
    ['Date: {{DATE}}', 'Class: {{CLASS}} • Subject: {{SUBJECT}}'],
    ['Chapter: {{CHAPTER}}', 'Total Marks: [{{MARKS}} Marks]']
  ]);
  metaTable.setBorderWidth(0.5);
  metaTable.setBorderColor('#CBD5E1');

  body.appendParagraph('');

  // Original Question Reference
  var qRefHead = body.appendParagraph('ORIGINAL PROBLEM:');
  qRefHead.setFontFamily('Plus Jakarta Sans');
  qRefHead.setFontSize(10);
  qRefHead.setBold(true);
  qRefHead.setForegroundColor('#475569');

  var qRef = body.appendParagraph('{{QUESTION_TEXT}}');
  qRef.setFontFamily('Lora');
  qRef.setFontSize(9.5);
  qRef.setItalic(true);
  qRef.setForegroundColor('#64748B');

  body.appendParagraph('');

  // Model Answer Section
  var ansHead = body.appendParagraph('✅ STEP-BY-STEP MODEL SOLUTION:');
  ansHead.setFontFamily('Plus Jakarta Sans');
  ansHead.setFontSize(12);
  ansHead.setBold(true);
  ansHead.setForegroundColor('#059669'); // Emerald Green

  var ansBody = body.appendParagraph('{{ANSWER_TEXT}}');
  ansBody.setFontFamily('Roboto Mono');
  ansBody.setFontSize(10);
  ansBody.setLineSpacing(1.2);
  ansBody.setForegroundColor('#0B0C10');

  body.appendParagraph('');

  // Step-by-Step Marking Breakdown Box
  var rubricHead = body.appendParagraph('📊 CBSE STEP-BY-STEP MARKING RUBRIC:');
  rubricHead.setFontFamily('Plus Jakarta Sans');
  rubricHead.setFontSize(10);
  rubricHead.setBold(true);
  rubricHead.setForegroundColor('#1E293B');

  var rubricBody = body.appendParagraph('{{MARKS_BREAKDOWN}}');
  rubricBody.setFontFamily('Inter');
  rubricBody.setFontSize(9.5);
  rubricBody.setForegroundColor('#334155');

  body.appendParagraph('');

  // Common Pitfalls / Traps Caught Box
  var trapHead = body.appendParagraph('⚠️ COMMON EXAMINER TRAPS TO AVOID:');
  trapHead.setFontFamily('Plus Jakarta Sans');
  trapHead.setFontSize(10);
  trapHead.setBold(true);
  trapHead.setForegroundColor('#DC2626'); // Crimson

  var trapBody = body.appendParagraph('{{COMMON_MISTAKES}}');
  trapBody.setFontFamily('Inter');
  trapBody.setFontSize(9.5);
  trapBody.setForegroundColor('#991B1B');

  body.appendParagraph('');
  body.appendHorizontalRule();

  var pFooter = body.appendParagraph('Commerce Gyan • Self-Evaluation Answer Key • For Personal Study Only');
  pFooter.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pFooter.setFontFamily('Inter');
  pFooter.setFontSize(8);
  pFooter.setForegroundColor('#94A3B8');

  doc.saveAndClose();
  return doc;
}

/**
 * Creates the Official Fee Receipt Google Doc template
 * @param {Folder} folder
 * @return {Document}
 */
function createReceiptDocTemplate_(folder) {
  var doc = DocumentApp.create('TEMPLATE_Fee_Receipt_CommerceGyan');
  var file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);

  var body = doc.getBody();
  body.clear();

  body.setMarginTop(36);
  body.setMarginBottom(36);
  body.setMarginLeft(40);
  body.setMarginRight(40);

  // Institution Header
  var p1 = body.appendParagraph('COMMERCE GYAN');
  p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p1.setFontFamily('Plus Jakarta Sans');
  p1.setFontSize(18);
  p1.setBold(true);
  p1.setForegroundColor('#2D124D');

  var pSub = body.appendParagraph('Official Academic Coaching • Begusarai Center\nFounder & Educator: Gyan deep Kumar (Gyan Sir)');
  pSub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pSub.setFontFamily('Inter');
  pSub.setFontSize(9);
  pSub.setForegroundColor('#64748B');

  var badge = body.appendParagraph('OFFICIAL FEE PAYMENT RECEIPT');
  badge.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  badge.setFontFamily('Plus Jakarta Sans');
  badge.setFontSize(11);
  badge.setBold(true);
  badge.setForegroundColor('#D97706'); // Heritage Gold

  body.appendHorizontalRule();

  // Receipt Details Table
  var table = body.appendTable([
    ['Receipt No:', '{{RECEIPT_NO}}', 'Date:', '{{DATE}}'],
    ['Student ID:', '{{STUDENT_ID}}', 'Student Name:', '{{STUDENT_NAME}}'],
    ['Class:', 'Class {{CLASS}}', 'Plan Enrolled:', '{{PLAN_NAME}}'],
    ['For Month:', '{{FOR_MONTH}}', 'Payment Mode:', '{{MODE}}'],
    ['UPI / Transaction Ref:', '{{UPI_REF}}', 'Invoice No:', '{{INVOICE_NO}}']
  ]);
  table.setBorderWidth(0.5);
  table.setBorderColor('#E2E8F0');

  body.appendParagraph('');

  // Payment Calculation Table
  var calcTable = body.appendTable([
    ['Particulars', 'Amount (INR)'],
    ['Tuition & Course Access (Month of {{FOR_MONTH}})', '₹{{AMOUNT}}'],
    ['Discount Applied', '₹0'],
    ['TOTAL AMOUNT RECEIVED', '₹{{AMOUNT}}'],
    ['Current Outstanding Balance', '₹{{BALANCE}}']
  ]);
  calcTable.setBorderWidth(1);
  calcTable.setBorderColor('#CBD5E1');

  // Format header row of calculation table
  var headerRow = calcTable.getRow(0);
  headerRow.getCell(0).editAsText().setBold(true);
  headerRow.getCell(1).editAsText().setBold(true);

  body.appendParagraph('');

  // Computer generated note
  var note = body.appendParagraph('Status: {{STATUS}}\nThis is an automated, tamper-evident digital receipt generated by the Commerce Master App v2.3. No physical signature required.');
  note.setFontFamily('Inter');
  note.setFontSize(8.5);
  note.setItalic(true);
  note.setForegroundColor('#64748B');

  body.appendParagraph('');
  body.appendHorizontalRule();

  var pFooter = body.appendParagraph('Commerce Gyan • Support: Gyan Sir • Telegram: @commercegyan');
  pFooter.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  pFooter.setFontFamily('Inter');
  pFooter.setFontSize(8);
  pFooter.setForegroundColor('#94A3B8');

  doc.saveAndClose();
  return doc;
}
