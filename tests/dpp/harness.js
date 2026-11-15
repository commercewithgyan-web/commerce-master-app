/**
 * Node harness that loads the Apps Script DPP renderer files into a sandbox
 * so the HTML output can be tested locally (no Drive, no deploy).
 * Lives outside backend/ so clasp never pushes it.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BACKEND = path.join(__dirname, '..', '..', 'backend');
const GS_FILES = ['dpp_brand_assets.gs', 'dpp_watermark_faded.gs', 'dpp_decider.gs', 'subjective.gs'];

function pad2(n) { return (n < 10 ? '0' : '') + n; }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function makeSandbox() {
  const logs = [];
  const sandbox = {
    console,
    logs,
    Logger: { log: (m) => logs.push(String(m)) },
    Utilities: {
      formatDate: (d, tz, fmt) => {
        d = d || new Date(Date.UTC(2026, 10, 15));
        const day = d.getDate(), mon = MONTHS[d.getMonth()], yr = d.getFullYear();
        if (fmt === 'd MMM') return day + ' ' + mon;
        if (fmt === 'dd-MMM-yyyy') return pad2(day) + '-' + mon + '-' + yr;
        return yr + '-' + pad2(d.getMonth() + 1) + '-' + pad2(day);
      },
      newBlob: () => { throw new Error('newBlob not available in harness'); },
      computeDigest: () => [],
      DigestAlgorithm: {},
      Charset: {}
    },
    getKolkataDate: () => '2026-11-15',
    getKolkataTimestamp: () => '2026-11-15 10:00:00'
  };
  vm.createContext(sandbox);
  for (const f of GS_FILES) {
    const p = path.join(BACKEND, f);
    if (!fs.existsSync(p)) continue;
    vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: f });
  }
  // Short placeholders keep snapshots small and readable.
  sandbox.getDppLogoBase64_ = () => 'LOGO_B64';
  sandbox.getDppPhotoBase64_ = () => 'PHOTO_B64';
  sandbox.getDppWatermarkBase64_ = () => 'WATERMARK_B64';
  if (sandbox.getDppWatermarkFadedBase64_) sandbox.getDppWatermarkFadedBase64_ = () => 'WATERMARK_FADED_B64';
  return sandbox;
}

/** Captures the payloads the in-repo test functions would send to Drive. */
function collectFixtures(sb) {
  const fixtures = [];
  const capture = (kind) => (data) => {
    fixtures.push({ kind, data: JSON.parse(JSON.stringify(data)) });
    return { pageCount: 0, driveUrl: '' };
  };
  const realAns = sb.createAnswerPdfFromTemplate_;
  const realQ = sb.createQuestionPdfFromTemplate_;
  sb.createAnswerPdfFromTemplate_ = capture('answer');
  sb.createQuestionPdfFromTemplate_ = capture('question');
  const tests = [
    ['acc_multipage', 'testGenerateAccountancyMultiPagePdf', 12],
    ['eco_graph', 'testGenerateEconomicsGraphPdf', 12],
    ['stats_formula', 'testGenerateStatisticsFormulaPdf', 11],
    ['bst_flow', 'testGenerateBstFlowchartPdf', 12]
  ];
  const out = [];
  for (const [name, fn, cls] of tests) {
    fixtures.length = 0;
    sb[fn](cls);
    out.push({ name, data: fixtures[0].data });
  }
  sb.createAnswerPdfFromTemplate_ = realAns;
  sb.createQuestionPdfFromTemplate_ = realQ;

  for (const cls of [11, 12]) {
    for (const v of sb.getCuratedSubjectiveVault_(cls)) {
      out.push({
        name: 'vault_' + v.qid.toLowerCase(),
        data: {
          date: '2026-11-15',
          classLevel: cls,
          subject: v.subject,
          chapter: v.chapterName,
          qid: v.qid,
          marks: v.marks,
          questionText: v.question,
          answerText: v.modelAnswer,
          mainAnswerJson: v.mainAnswerJson || null,
          marksBreakdown: v.rubric,
          commonMistakes: v.traps
        }
      });
    }
  }
  for (const f of DEMO_FIXTURES) out.push({ name: f.name, data: Object.assign({ classLevel: 12, marks: 4, qid: f.name }, f.data) });
  for (const f of out) f.data.date = '2026-11-15';
  return out;
}

/** One sample per content kind that the vault does not cover yet. */
const DEMO_FIXTURES = [
  { name: 'demo_accounts_spec', data: {
    subject: 'Accountancy', classLevel: 11, chapter: 'Journal, Ledger and Trial Balance',
    questionText: 'Journalise, post to ledger and prepare Trial Balance: Started business with cash ₹1,00,000; bought goods for cash ₹30,000; sold goods for ₹40,000 (₹25,000 cash, rest on credit to Ravi).',
    mainAnswerJson: { blocks: [{ type: 'accounts_spec', entries: [
      { date: '01-Apr', dr: [{ ac: 'Cash A/c', amt: 100000 }], cr: [{ ac: 'Capital A/c', amt: 100000 }], narration: 'Being business started with cash' },
      { date: '05-Apr', dr: [{ ac: 'Purchases A/c', amt: 30000 }], cr: [{ ac: 'Cash A/c', amt: 30000 }], narration: 'Being goods purchased for cash' },
      { date: '09-Apr', dr: [{ ac: 'Cash A/c', amt: 25000 }, { ac: 'Ravi A/c', amt: 15000 }], cr: [{ ac: 'Sales A/c', amt: 40000 }], narration: 'Being goods sold, part on credit to Ravi' }
    ], show: ['journal', 'ledger', 'trial_balance'], accounts: ['Cash A/c'] }] },
    marksBreakdown: '• 1 Mark: Journal\n• 2 Marks: Ledger\n• 1 Mark: Trial Balance'
  } },
  { name: 'demo_schedule3_bs', data: {
    subject: 'Accountancy', chapter: 'Financial Statements of a Company',
    questionText: 'Prepare the Balance Sheet of Gyan Ltd. as per Schedule III.',
    mainAnswerJson: { blocks: [{ type: 'balance_sheet_spec', format: 'schedule3', title: 'Balance Sheet of Gyan Ltd. as at 31st March 2026', cyLabel: '31.03.2026 (₹)', pyLabel: '31.03.2025 (₹)', sections: [
      { heading: 'Equity and Liabilities', groups: [
        { heading: "Shareholders' Funds", items: [{ label: 'Share Capital', note: 1, cy: 500000, py: 400000 }, { label: 'Reserves and Surplus', note: 2, cy: 120000, py: 80000 }] },
        { heading: 'Non-Current Liabilities', items: [{ label: 'Long-term Borrowings', note: 3, cy: 200000, py: 250000 }] },
        { heading: 'Current Liabilities', items: [{ label: 'Trade Payables', cy: 80000, py: 70000 }] }] },
      { heading: 'Assets', groups: [
        { heading: 'Non-Current Assets', items: [{ label: 'Property, Plant and Equipment', note: 4, cy: 650000, py: 560000 }] },
        { heading: 'Current Assets', items: [{ label: 'Inventories', cy: 110000, py: 140000 }, { label: 'Cash and Cash Equivalents', cy: 140000, py: 100000 }] }] }
    ] }] }
  } },
  { name: 'demo_trial_balance', data: {
    subject: 'Accountancy', classLevel: 11, chapter: 'Trial Balance',
    questionText: 'Prepare Trial Balance from the given balances.',
    answerText: '#TRIALBALANCE:Trial Balance as at 31st March 2026\nS.No. | Name of Account | L.F. | Debit Balance (₹) | Credit Balance (₹)\n1 | Cash A/c | | 45,000 |\n2 | Purchases A/c | | 30,000 |\n3 | Ravi A/c | | 15,000 |\n4 | Capital A/c | | | 50,000\n5 | Sales A/c | | | 40,000\n | Total | | 90,000 | 90,000\n#ENDTRIALBALANCE'
  } },
  { name: 'demo_bst_compare', data: {
    subject: 'Business Studies', chapter: 'Staffing',
    questionText: 'Distinguish between Recruitment and Selection on any three bases.',
    answerText: 'Difference between Recruitment and Selection:\n\nBasis | Recruitment | Selection\nMeaning | Searching for prospective employees and stimulating them to apply | Choosing the most suitable candidates from those who applied\nNature | Positive process (attracts candidates) | Negative process (rejects unsuitable candidates)\nSequence | Comes before selection | Comes after recruitment'
  } },
  { name: 'demo_stats_table', data: {
    subject: 'Statistics', classLevel: 11, chapter: 'Measures of Central Tendency',
    questionText: 'Calculate the arithmetic mean of the following distribution.',
    answerText: '#STATS:Calculation of Mean (Direct Method)\nMarks (Class) | No. of Students (f) | Mid-value (m) | fm\n0-10 | 5 | 5 | 25\n10-20 | 8 | 15 | 120\n20-30 | 12 | 25 | 300\n30-40 | 5 | 35 | 175\nTotal | Σf = 30 | | Σfm = 620\n#ENDSTATS\n\nMean = Σfm / Σf = 620 / 30 = 20.67 marks'
  } },
  { name: 'demo_macro_ni', data: {
    subject: 'Economics', chapter: 'National Income Accounting',
    questionText: 'Calculate National Income (NNP at FC) by the income method.',
    answerText: '#COMPUTATION:Calculation of National Income (Income Method)\nParticulars | ₹ crore\nCompensation of Employees | 800\nAdd: Operating Surplus (Rent + Interest + Profit) | 600\nAdd: Mixed Income of Self-employed | 200\nDomestic Income (NDP at FC) | 1,600\nAdd: Net Factor Income from Abroad | (20)\nNational Income (NNP at FC) | 1,580\n#ENDCOMPUTATION'
  } },
  { name: 'demo_eco_graphs', data: {
    subject: 'Economics', chapter: 'Market Equilibrium & PPC',
    questionText: 'Show the effect of an increase in supply on equilibrium, and draw a PPC.',
    answerText: '1. Increase in Supply: supply curve shifts right from S0 to S1, price falls to P1 and quantity rises to Q1.\n\n#GRAPH:supply_shift|Rightward Shift in Supply Curve (Increase in Supply)\n\n2. Production Possibility Curve: B is efficient, A shows under-utilisation, C is unattainable.\n\n#GRAPH:ppc|Production Possibility Curve'
  } }
];

function render(sb, data, isAnswer) {
  return sb.generateMultiPageDailyPracticeSheetHtml_(JSON.parse(JSON.stringify(data)), isAnswer);
}

/** Block list as the decider sees it (answer side). */
function decideBlocks(sb, data) {
  if (data.mainAnswerJson) {
    const j = typeof data.mainAnswerJson === 'string' ? JSON.parse(data.mainAnswerJson) : data.mainAnswerJson;
    const blocks = Array.isArray(j) ? j : j.blocks;
    return typeof sb.expandSpecBlocks_ === 'function' ? sb.expandSpecBlocks_(blocks) : blocks;
  }
  return sb.analyzeAndStructureBlock_(data.answerText || '', data.subject, data.renderSpec);
}

module.exports = { makeSandbox, collectFixtures, render, decideBlocks };
