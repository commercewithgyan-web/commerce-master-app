/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — AUTOMATED TEST SUITE (test_suite.gs)
 * Comprehensive Unit & Integration Verification Suite.
 * Run runAllCommerceTests() in Google Apps Script to verify all invariants.
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * 🧪 Master Test Runner: Executes all unit and logic verification tests
 */
function runAllCommerceTests() {
  Logger.log('🧪 ═══════════════════════════════════════════');
  Logger.log('   Commerce Master App v2.3 — Test Suite');
  Logger.log('═══════════════════════════════════════════════\n');

  var passed = 0;
  var failed = 0;

  function assert(testName, condition, details) {
    if (condition) {
      Logger.log('  ✅ PASS: ' + testName);
      passed++;
    } else {
      Logger.log('  ❌ FAIL: ' + testName + ' — ' + (details || 'Assertion failed'));
      failed++;
    }
  }

  // ── TEST 1: PRO-RATA CALCULATIONS ──
  Logger.log('📋 Running Test Group 1: Pro-Rata Fee Formulas...');
  var prNov10 = calculateProRata_(1500, new Date(2026, 10, 10)); // Nov 10 (30 days, 21 remaining) -> 1500 * 21 / 30 = 1050
  assert('Pro-rata Nov 10 (₹1500 plan) == ₹1050', prNov10 === 1050, 'Got: ' + prNov10);

  var prNov1 = calculateProRata_(1500, new Date(2026, 10, 1)); // Nov 1 -> 1500
  assert('Pro-rata Nov 1 (full month) == ₹1500', prNov1 === 1500, 'Got: ' + prNov1);

  var prNov30 = calculateProRata_(1500, new Date(2026, 10, 30)); // Nov 30 (1 day) -> 1500 * 1 / 30 = 50
  assert('Pro-rata Nov 30 (1 day) == ₹50', prNov30 === 50, 'Got: ' + prNov30);

  var prFeb15 = calculateProRata_(1500, new Date(2027, 1, 15)); // Feb 15, 2027 (28 days, 14 remaining) -> 1500 * 14 / 28 = 750
  assert('Pro-rata Feb 15 non-leap year (₹1500 plan) == ₹750', prFeb15 === 750, 'Got: ' + prFeb15);

  // ── TEST 2: BOARD-EXAM SESSION CAPPING ──
  Logger.log('\n📋 Running Test Group 2: Board Exam Session Alignment...');
  var end12 = calculateCourseEndDate_(12, new Date(2026, 10, 10)); // Joined Nov 2026, Class 12
  assert('Class 12 concludes March 31', end12.getMonth() === 2 && end12.getDate() === 31, 'Got: ' + end12);

  var end11 = calculateCourseEndDate_(11, new Date(2026, 10, 10)); // Joined Nov 2026, Class 11
  assert('Class 11 concludes February 28', end11.getMonth() === 1 && end11.getDate() === 28, 'Got: ' + end11);

  var dur12 = calculateDurationMonths_(new Date(2026, 10, 10), end12); // Nov to Mar = 5 months
  assert('Class 12 duration from Nov to Mar == 5 months', dur12 === 5, 'Got: ' + dur12);

  // ── TEST 3: ANTI-CHEATING OPTION SHUFFLING ──
  Logger.log('\n📋 Running Test Group 3: Anti-Cheating Dynamic Shuffler...');
  var dummyQ = {
    QID: 'Q-9999',
    OptionA: 'Apples',
    OptionB: 'Bananas',
    OptionC: 'Cherries',
    OptionD: 'Dates',
    CorrectIndex: 'C'
  };

  // v2.4 contract: { options: [text x4], optionMap: { originalKey: displayIndex } }
  var shuffleA = shuffleOptionsForStudent_(dummyQ);

  assert('Shuffle returns all 4 option texts', shuffleA.options.length === 4 && shuffleA.options.slice().sort().join('|') === 'Apples|Bananas|Cherries|Dates', 'Got: ' + JSON.stringify(shuffleA.options));
  assert('optionMap tracks original correct key (C)', shuffleA.options[shuffleA.optionMap.C] === 'Cherries', 'Correct option lost during shuffle');
  assert('optionMap covers A, B, C, D exactly once', [shuffleA.optionMap.A, shuffleA.optionMap.B, shuffleA.optionMap.C, shuffleA.optionMap.D].sort().join('') === '0123', 'Got: ' + JSON.stringify(shuffleA.optionMap));

  // ── TEST 4: CONTENT-AWARE COLUMN BUDGETING ──
  Logger.log('\n📋 Running Test Group 4: Autonomous Watcher Layout Tree...');
  var sampleFinancialTable = [
    ['Date', 'Particulars', 'L.F.', 'Debit (₹)', 'Credit (₹)'],
    ['01-Apr-2026', 'Bank A/c', '12', '50,000', '-'],
    ['01-Apr-2026', 'To Share Capital A/c', '14', '-', '50,000']
  ];

  var widths = calculateOptimalColumnWidths_(sampleFinancialTable, 540); // 540pt printable width
  assert('Date column clamped to 52pt', widths[0] === 52, 'Got: ' + widths[0]);
  assert('L.F. column clamped to 28pt', widths[2] === 28, 'Got: ' + widths[2]);
  assert('Debit ₹ column clamped to 72pt', widths[3] === 72, 'Got: ' + widths[3]);
  assert('Credit ₹ column clamped to 72pt', widths[4] === 72, 'Got: ' + widths[4]);
  assert('Particulars absorbs remaining width (>300pt)', widths[1] >= 300, 'Got: ' + widths[1]);

  var orientPortrait = determinePageOrientation_(480);
  assert('Table width <= 500pt chooses PORTRAIT', orientPortrait.orientation === 'PORTRAIT' && !orientPortrait.useTSplit, 'Wrong orientation');

  var orientLandscape = determinePageOrientation_(650);
  assert('Table width 500-750pt chooses LANDSCAPE', orientLandscape.orientation === 'LANDSCAPE' && !orientLandscape.useTSplit, 'Wrong orientation');

  var orientTSplit = determinePageOrientation_(850);
  assert('Table width > 750pt chooses CBSE T-SPLIT GRID', orientTSplit.useTSplit, 'T-Split failed');

  // ── TEST 5: SVG MATH & ECONOMICS VECTOR GENERATORS ──
  Logger.log('\n📋 Running Test Group 5: Zero-CDN SVG Vector Engines...');
  var sdSvg = generateMathVectorSvg_('STANDARD_DEVIATION');
  assert('Standard Deviation SVG generates radical & summation', sdSvg.indexOf('<svg') === 0 && sdSvg.indexOf('∑') !== -1, 'Invalid SD SVG');

  var ecoSvg = generateEconomicsGraphSvg_('DEMAND_SUPPLY_EQUILIBRIUM');
  assert('Economics Equilibrium SVG generates Cartesian axes and E0 point', ecoSvg.indexOf('<svg') === 0 && ecoSvg.indexOf('E₀') !== -1, 'Invalid Eco SVG');

  // ── TEST 6: STRING & PRIVACY UTILITIES ──
  Logger.log('\n📋 Running Test Group 6: Privacy Masking & Formatters...');
  var masked1 = maskStudentName_('Rahul Sharma');
  assert('Masks "Rahul Sharma" to "Rahul S."', masked1 === 'Rahul S.', 'Got: ' + masked1);

  var masked2 = maskStudentName_('Aarav');
  assert('Preserves single name "Aarav"', masked2 === 'Aarav', 'Got: ' + masked2);

  var curr1 = formatCurrency_(1250000);
  assert('Formats Indian currency: ₹12,50,000', curr1 === '₹12,50,000', 'Got: ' + curr1);

  var curr2 = formatCurrency_(800);
  assert('Formats small currency: ₹800', curr2 === '₹800', 'Got: ' + curr2);

  var chunks = chunkText_('A'.repeat(5000), 4000);
  assert('Splits 5000 chars into chunks <= 4000', chunks.length === 2 && chunks[0].length <= 4000, 'Chunking failed');

  // ── TEST 7: DOUBT ENGINE SUBJECT ISOLATION & TOPIC TITLES ──
  // (buildELI10VoicePrompt_ / parseVoiceExplanationTags_ were removed in the multi-lens doubt rewrite)
  Logger.log('\n📋 Running Test Group 7: Doubt Engine Subject Isolation...');
  assert('Debenture question routes to Accountancy', detectCommerceSubject_('What is Debenture?') === 'Accountancy', 'Got: ' + detectCommerceSubject_('What is Debenture?'));
  assert('Fayol question routes to Business Studies', detectCommerceSubject_('Explain Fayol unity of command') === 'Business Studies', 'Got: ' + detectCommerceSubject_('Explain Fayol unity of command'));
  assert('Elasticity question routes to Economics', detectCommerceSubject_('What is price elasticity of demand?') === 'Economics', 'Got: ' + detectCommerceSubject_('What is price elasticity of demand?'));
  assert('Explicit subject overrides keywords', detectCommerceSubject_('What is Debenture?', 'BST') === 'Business Studies', 'Explicit subject ignored');
  assert('Unknown text falls back to Accountancy', detectCommerceSubject_('hello sir') === 'Accountancy', 'Fallback failed');
  assert('Topic title strips filler and caps at 4 words', extractTopicTitle_('what is goodwill in partnership firm accounts') === 'Goodwill in partnership firm', 'Got: ' + extractTopicTitle_('what is goodwill in partnership firm accounts'));
  assert('Empty question gives default topic title', extractTopicTitle_('') === 'Core Concept', 'Got: ' + extractTopicTitle_(''));

  // ── TEST 8: MINI APP ROUTES (Phase 1 of 2026-11-12 review fixes) ──
  Logger.log('\n📋 Running Test Group 8: Mini App Route Wiring...');
  var unknownRes = handleApiRequest({ action: 'noSuchActionForTest' });
  assert('Unknown action still returns Unknown action', unknownRes && unknownRes.ok === false && String(unknownRes.error).indexOf('Unknown action') === 0, 'Got: ' + JSON.stringify(unknownRes));

  var routeNames = ['getHomeDashboard', 'getNotebook', 'getProgress', 'getFeeDashboard', 'addNote', 'runRedPenAnalysis'];
  routeNames.forEach(function(actionName) {
    // Empty payloads: addNote rejects empty note and runRedPenAnalysis rejects missing image before any write or Gemini call.
    var routeOk = true;
    var routeDetail = '';
    try {
      var r = handleApiRequest({ action: actionName, payload: {} });
      routeDetail = JSON.stringify(r);
      if (r && String(r.error || '').indexOf('Unknown action') === 0) routeOk = false;
    } catch (err) {
      routeDetail = String(err && err.message);
      if (routeDetail.indexOf('Unknown action') !== -1) routeOk = false;
    }
    assert('Route wired: ' + actionName, routeOk, 'Got: ' + routeDetail);
  });

  // ── SUMMARY ──
  Logger.log('\n═══════════════════════════════════════════════');
  Logger.log('📊 TEST RESULTS: ' + passed + ' PASSED | ' + failed + ' FAILED');
  Logger.log('═══════════════════════════════════════════════');

  return {
    passed: passed,
    failed: failed,
    success: (failed === 0)
  };
}
