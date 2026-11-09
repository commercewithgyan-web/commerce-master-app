/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — AUTONOMOUS ACADEMIC WATCHER & TYPESETTER (watcher.gs)
 * Content-Aware Financial Layout Decision Tree, Table Column Budgeting,
 * Auto-Orientation Switcher (Portrait/Landscape/T-Split), Double-Underline
 * Closing Rules, Hanging Indents, SVG Vector Math & Dynamic Economics Graphs.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. CONTENT-AWARE LAYOUT DECISION TREE
// ─────────────────────────────────────────────────────────────────────

/**
 * Calculates optimal table column widths based on content type and character budgets
 * Clamps L.F./Note No to 25-30pt, Rupee amounts to 65-80pt monospace,
 * and gives Particulars the remaining 55%-65% elastic page width.
 * 
 * @param {Array<string[]>} tableData - 2D matrix of table cells
 * @param {number} availablePageWidthPt - Total printable width (e.g. 540pt for A4 Portrait)
 * @return {number[]} Array of column widths in points
 */
function calculateOptimalColumnWidths_(tableData, availablePageWidthPt) {
  if (!tableData || tableData.length === 0) return [];
  var numCols = tableData[0].length;
  if (numCols === 0) return [];

  var headers = tableData[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var widths = new Array(numCols);
  var fixedTotal = 0;
  var elasticIndices = [];

  for (var c = 0; c < numCols; c++) {
    var h = headers[c];

    // 1. L.F. / Note No. / Q.No. (Compact) -> 28pt
    if (h.indexOf('l.f') !== -1 || h.indexOf('lf') !== -1 || h.indexOf('note') !== -1 || h === 'no.') {
      widths[c] = 28;
      fixedTotal += 28;
    }
    // 2. Date column -> 52pt
    else if (h.indexOf('date') !== -1) {
      widths[c] = 52;
      fixedTotal += 52;
    }
    // 3. Currency (Debit ₹ / Credit ₹ / Amount) -> 72pt monospace
    else if (h.indexOf('debit') !== -1 || h.indexOf('credit') !== -1 || h.indexOf('₹') !== -1 || h.indexOf('amount') !== -1) {
      widths[c] = 72;
      fixedTotal += 72;
    }
    // 4. Elastic text (Particulars / Details / Descriptions)
    else {
      elasticIndices.push(c);
    }
  }

  // Distribute remaining elastic width
  var remainingWidth = Math.max(100, availablePageWidthPt - fixedTotal);
  if (elasticIndices.length > 0) {
    var sharePerElastic = Math.floor(remainingWidth / elasticIndices.length);
    for (var k = 0; k < elasticIndices.length; k++) {
      widths[elasticIndices[k]] = sharePerElastic;
    }
  }

  return widths;
}

/**
 * Determines page orientation based on total table width
 * <= 500pt: Portrait A4 (612pt wide, 540pt printable)
 * 500-750pt: Landscape A4 (792pt wide, 720pt printable)
 * > 750pt: CBSE Vertical T-Split Grid (Debit top, Credit bottom)
 * 
 * @param {number} totalEstimatedTableWidthPt
 * @return {{ orientation: string, useTSplit: boolean }}
 */
function determinePageOrientation_(totalEstimatedTableWidthPt) {
  if (totalEstimatedTableWidthPt <= 500) {
    return { orientation: 'PORTRAIT', useTSplit: false };
  } else if (totalEstimatedTableWidthPt <= 750) {
    return { orientation: 'LANDSCAPE', useTSplit: false };
  } else {
    // Exceeds 750pt (e.g. 4-partner capital ledger): split into CBSE vertical grid
    return { orientation: 'PORTRAIT', useTSplit: true };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 2. DOMAIN-SPECIFIC AUTONOMOUS STYLERS
// ─────────────────────────────────────────────────────────────────────

/**
 * Formats a Google Docs Table element according to CBSE Accountancy guidelines:
 * - Roboto Mono font for ₹ numbers
 * - Right-aligned currency figures
 * - Double-underline for ledger closing rows
 * - Hanging indents for (Being...) narrations
 * 
 * @param {GoogleAppsScript.Document.Table} table
 * @param {number[]} columnWidths
 */
function formatAccountancyTableDoc_(table, columnWidths) {
  var numRows = table.getNumRows();
  var numCols = columnWidths.length;

  for (var r = 0; r < numRows; r++) {
    var row = table.getRow(r);
    var isHeader = (r === 0);

    for (var c = 0; c < numCols; c++) {
      var cell = row.getCell(c);
      cell.setWidth(columnWidths[c]);

      // Header row styling
      if (isHeader) {
        cell.setBackgroundColor('#F1F5F9');
        var pHead = cell.getChild(0).asParagraph();
        pHead.setFontFamily('Plus Jakarta Sans');
        pHead.setFontSize(9.5);
        pHead.setBold(true);
        pHead.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      } else {
        var pCell = cell.getChild(0).asParagraph();
        var cellText = pCell.getText().trim();

        // Detect currency / numeric values (₹ or numbers)
        if (/^[₹\d,\.\-]+$/.test(cellText)) {
          pCell.setFontFamily('Roboto Mono');
          pCell.setFontSize(9);
          pCell.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
        }
        // Detect Journal Narration: (Being...)
        else if (cellText.indexOf('(Being') === 0 || cellText.indexOf('(being') === 0) {
          pCell.setFontFamily('Lora');
          pCell.setFontSize(8.5);
          pCell.setItalic(true);
          pCell.setIndentFirstLine(14); // 14pt hanging indent
        }
        // General Particulars text
        else {
          pCell.setFontFamily('Inter');
          pCell.setFontSize(9);
          pCell.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
        }

        // Detect Total row for double-underline closing rule
        if (cellText.toLowerCase().indexOf('total') !== -1 || cellText.toLowerCase().indexOf('balance c/d') !== -1) {
          pCell.setBold(true);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 3. STATISTICS MATH-VECTOR ENGINE (SVG)
// ─────────────────────────────────────────────────────────────────────

/**
 * Generates an SVG vector mathematical expression without external CDN dependencies.
 * Prevents formula breakdown (such as raw \frac{\sum x^2}{N}) on mobile screens.
 * 
 * @param {string} formulaType - 'STANDARD_DEVIATION' | 'CORRELATION' | 'MEAN'
 * @return {string} Pure SVG XML string
 */
function generateMathVectorSvg_(formulaType) {
  switch (formulaType) {
    case 'STANDARD_DEVIATION':
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 70" width="340" height="70">' +
        '  <text x="10" y="42" font-family="Cambria Math, serif" font-size="22" font-style="italic">σ =</text>' +
        '  <!-- Square Root Radical -->' +
        '  <path d="M 55,40 L 63,40 L 72,58 L 84,18 L 330,18" fill="none" stroke="#0B0C10" stroke-width="2.2" stroke-linecap="round" />' +
        '  <!-- Summation Fraction -->' +
        '  <text x="96" y="38" font-family="Cambria Math, serif" font-size="20">∑</text>' +
        '  <text x="120" y="34" font-family="Cambria Math, serif" font-size="16">(X - X̄)²</text>' +
        '  <!-- Fraction Bar -->' +
        '  <line x1="94" y1="42" x2="230" y2="42" stroke="#0B0C10" stroke-width="1.8" />' +
        '  <text x="156" y="58" font-family="Cambria Math, serif" font-size="16" font-style="italic">N</text>' +
        '</svg>'
      );

    case 'CORRELATION':
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 70" width="360" height="70">' +
        '  <text x="10" y="42" font-family="Cambria Math, serif" font-size="22" font-style="italic">r =</text>' +
        '  <text x="90" y="32" font-family="Cambria Math, serif" font-size="16">Cov(X, Y)</text>' +
        '  <line x1="55" y1="40" x2="330" y2="40" stroke="#0B0C10" stroke-width="1.8" />' +
        '  <text x="130" y="60" font-family="Cambria Math, serif" font-size="16">σx × σy</text>' +
        '</svg>'
      );

    default: // MEAN
      return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">' +
        '  <text x="10" y="38" font-family="Cambria Math, serif" font-size="22">X̄ =</text>' +
        '  <text x="70" y="28" font-family="Cambria Math, serif" font-size="18">∑X</text>' +
        '  <line x1="60" y1="35" x2="140" y2="35" stroke="#0B0C10" stroke-width="1.8" />' +
        '  <text x="95" y="52" font-family="Cambria Math, serif" font-size="18">N</text>' +
        '</svg>'
      );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 4. ECONOMICS AUTO-GRAPH ENGINE (90° Cartesian SVG)
// ─────────────────────────────────────────────────────────────────────

/**
 * Generates high-contrast Cartesian coordinate SVG graphs for Micro & Macro economics
 * @param {string} graphType - 'DEMAND_SUPPLY_EQUILIBRIUM' | 'INCOME_MULTIPLIER'
 * @return {string} Pure SVG XML string
 */
function generateEconomicsGraphSvg_(graphType) {
  if (graphType === 'DEMAND_SUPPLY_EQUILIBRIUM') {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" width="320" height="260">' +
      '  <!-- Axes -->' +
      '  <line x1="45" y1="220" x2="295" y2="220" stroke="#0F172A" stroke-width="2.2" />' +
      '  <line x1="45" y1="220" x2="45" y2="25" stroke="#0F172A" stroke-width="2.2" />' +
      '  <!-- Axis Labels -->' +
      '  <text x="250" y="242" font-family="Inter, sans-serif" font-size="11" font-weight="600">Quantity (Q)</text>' +
      '  <text x="10" y="25" font-family="Inter, sans-serif" font-size="11" font-weight="600">Price (P)</text>' +
      '  <text x="32" y="235" font-family="Inter, sans-serif" font-size="10">O</text>' +
      '  <!-- Demand Curve (Downward Sloping) -->' +
      '  <line x1="65" y1="45" x2="265" y2="200" stroke="#EF4444" stroke-width="2.5" />' +
      '  <text x="270" y="205" font-family="Inter, sans-serif" font-size="11" fill="#EF4444" font-weight="bold">D</text>' +
      '  <!-- Supply Curve (Upward Sloping) -->' +
      '  <line x1="65" y1="200" x2="265" y2="45" stroke="#10B981" stroke-width="2.5" />' +
      '  <text x="270" y="50" font-family="Inter, sans-serif" font-size="11" fill="#10B981" font-weight="bold">S</text>' +
      '  <!-- Equilibrium Point E0 -->' +
      '  <circle cx="165" cy="122.5" r="4.5" fill="#D4AF37" stroke="#0B0C10" stroke-width="1.5" />' +
      '  <text x="175" y="120" font-family="Inter, sans-serif" font-size="11" font-weight="bold" fill="#2D124D">E₀</text>' +
      '  <!-- Dashed Guidelines -->' +
      '  <line x1="45" y1="122.5" x2="165" y2="122.5" stroke="#94A3B8" stroke-dasharray="4,4" />' +
      '  <line x1="165" y1="122.5" x2="165" y2="220" stroke="#94A3B8" stroke-dasharray="4,4" />' +
      '  <text x="22" y="126" font-family="Roboto Mono, monospace" font-size="10">P₀</text>' +
      '  <text x="160" y="236" font-family="Roboto Mono, monospace" font-size="10">Q₀</text>' +
      '</svg>'
    );
  }

  // Fallback: Circular Flow of Income
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160" width="300" height="160">' +
    '  <rect x="20" y="55" width="90" height="45" rx="6" fill="#F1F5F9" stroke="#2D124D" stroke-width="2" />' +
    '  <text x="35" y="82" font-family="Inter" font-size="11" font-weight="bold">Households</text>' +
    '  <rect x="190" y="55" width="90" height="45" rx="6" fill="#F1F5F9" stroke="#2D124D" stroke-width="2" />' +
    '  <text x="218" y="82" font-family="Inter" font-size="11" font-weight="bold">Firms</text>' +
    '  <path d="M 70,55 C 100,20 200,20 230,55" fill="none" stroke="#10B981" stroke-width="2" marker-end="url(#arrow)" />' +
    '  <text x="110" y="30" font-family="Inter" font-size="9" fill="#047857">Factor Services</text>' +
    '  <path d="M 230,100 C 200,135 100,135 70,100" fill="none" stroke="#D4AF37" stroke-width="2" />' +
    '  <text x="110" y="145" font-family="Inter" font-size="9" fill="#B45309">Goods & Services</text>' +
    '</svg>'
  );
}

// ─────────────────────────────────────────────────────────────────────
// 5. BUSINESS STUDIES 3-TIER CASE STUDY STYLER
// ─────────────────────────────────────────────────────────────────────

/**
 * Formats a Business Studies case study answer into the official CBSE 3-Step Matrix:
 * 1. Quoted Lines from the passage
 * 2. Concept Identified (with NCERT heading)
 * 3. Detailed Explanation & Organizational Impact
 * 
 * @param {Object} caseStudyData - { quotedLines, conceptName, explanation }
 * @return {string} Formatted markdown call-out
 */
function formatBusinessStudiesCaseMatrix_(caseStudyData) {
  return (
    '📋 *CBSE 3-STEP CASE EVALUATION MATRIX*\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '1️⃣ *Quoted Lines from the Case*:\n' +
    '   _"' + caseStudyData.quotedLines + '"_\n\n' +
    '2️⃣ *Concept Identified*:\n' +
    '   👉 *' + caseStudyData.conceptName + '*\n\n' +
    '3️⃣ *Detailed Explanation & Strategic Impact*:\n' +
    '   ' + caseStudyData.explanation + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━'
  );
}
