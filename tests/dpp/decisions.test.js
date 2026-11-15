#!/usr/bin/env node
/**
 * Decider + validator assertions. Run: node tests/dpp/decisions.test.js
 * Each fixture states which block kinds the decider must produce, so a fix for
 * one kind (e.g. Trial Balance) cannot silently re-classify another (e.g. Journal).
 */
'use strict';
const { makeSandbox, collectFixtures, decideBlocks, render } = require('./harness');

const sb = makeSandbox();
let failures = 0, passes = 0;
function check(name, cond, detail) {
  if (cond) { passes++; return; }
  failures++;
  console.log('FAIL ' + name + (detail ? '  → ' + detail : ''));
}
function kinds(blocks) {
  return blocks.map((b) => (b.type === 'table' || b.type === 'taccount' || b.type === 'journal' || b.type === 'capital') ? (b.kind || b.type) : b.type);
}

// ── 1. Expected kinds for every real fixture ─────────────────────────
const EXPECT = {
  acc_multipage: { must: ['ledger', 'capital', 'balance_sheet'] },
  eco_graph: { must: ['graph'] },
  stats_formula: { must: ['formula', 'calculation'] },
  bst_flow: { must: ['card', 'flow'] },
  vault_c11_subj_4m_brs: { must: ['computation'], noReview: true, valid: true },
  vault_c11_subj_6m_finstmt: { must: ['ledger', 'balance_sheet'], noReview: true, valid: true },
  vault_c11_subj_3m_depr: { must: ['ledger'], noReview: true, valid: true },
  vault_c11_subj_5m_rectification: { must: ['journal'], noReview: true, valid: true },
  vault_c11_subj_2m_accprinc: { must: ['text'], noReview: true },
  vault_c12_subj_4m_shares: { must: ['journal'], noReview: true, valid: true },
  vault_c12_subj_6m_admission: { must: ['ledger', 'capital'], noReview: true, valid: true },
  vault_c12_subj_6m_partner: { must: ['ledger', 'capital'], noReview: true, valid: true },
  vault_c12_subj_4m_debentures: { must: ['journal'], noReview: true, valid: true },
  vault_c12_subj_3m_cfs: { must: ['computation'], noReview: true }
};

const fixtures = collectFixtures(sb);
const summary = [];
for (const fx of fixtures) {
  const blocks = decideBlocks(sb, fx.data);
  const ks = kinds(blocks);
  const review = blocks.filter((b) => b.needsReview).map((b) => b.reviewReason);
  const validation = sb.validateBlocks_(blocks);
  summary.push({ name: fx.name, kinds: ks.join(', '), review: review.length, validation: validation.map((v) => v.issues.join('; ')).join(' | ') });
  const exp = EXPECT[fx.name];
  if (!exp) continue;
  for (const k of exp.must) check(fx.name + ' has ' + k, ks.includes(k), 'got [' + ks.join(', ') + ']');
  if (exp.noReview) check(fx.name + ' no NEEDS_REVIEW', review.length === 0, review.join('; '));
  if (exp.valid) check(fx.name + ' tallies', validation.length === 0, JSON.stringify(validation));
  // Full render must not throw and must keep the watermark.
  const html = render(sb, fx.data, true).html;
  check(fx.name + ' renders watermark', /class="watermark"/.test(html));
  check(fx.name + ' no opaque card background', !/\.content-card \{\s*background: #ffffff/.test(html));
}

// ── 2. Decider unit cases (one per content kind) ──────────────────────
function decide(header, body, title, subject) {
  return sb.decideTableKind_(header.split('|').map((s) => s.trim()), body, title || '', subject || '', null).kind;
}
check('journal by header+Dr.', decide('Date | Particulars | L.F. | Dr. (₹) | Cr. (₹)', [' | Cash A/c Dr. | | 500 | ', ' | To Sales A/c | | | 500', '(Being goods sold)']) === 'journal');
check('trial balance by title', decide('S.No. | Name of Account | L.F. | Debit (₹) | Credit (₹)', ['1 | Cash | | 500 |'], 'Trial Balance as at 31 March') === 'trial_balance');
check('trial balance by header', decide('Name of Account | Debit Balance (₹) | Credit Balance (₹)', ['Cash | 500 |']) === 'trial_balance');
check('ledger To/By', decide('Particulars | Amount | Particulars | Amount', ['To Balance b/d | 500 | By Bank | 200']) === 'ledger');
check('BS horizontal', decide('Liabilities | Amount (₹) | Assets | Amount (₹)', ['Capital | 500 | Cash | 500']) === 'balance_sheet');
check('BS schedule III', decide('Particulars | Note No. | 31.3.2026 | 31.3.2025', ['I. EQUITY AND LIABILITIES | | |']) === 'bs_schedule3');
check('capital 3 partners', decide('Particulars | A (₹) | B (₹) | C (₹) | Particulars | A (₹) | B (₹) | C (₹)', ['To Drawings | 1 | 2 | 3 | By Balance b/d | 4 | 5 | 6']) === 'capital');
check('capital without hard-coded names', decide('Particulars | Priya (₹) | Rahul (₹) | Particulars | Priya (₹) | Rahul (₹)', ['To Drawings | 1 | 2 | By Balance b/d | 4 | 5']) === 'capital');
check('computation CFS', decide('Particulars | Amount (₹)', ['Net Profit | 4,50,000', 'Add: Depreciation | 55,000'], 'Cash Flow from Operating Activities') === 'computation');
check('comparison Basis', decide('Basis | Recruitment | Selection', ['Meaning | Searching | Choosing']) === 'comparison');
check('stats frequency', decide('Class | f | cf', ['0-10 | 5 | 5', '10-20 | 8 | 13'], '', 'Statistics') === 'stats');
check('lone f no longer marks any line as header', decide('x | f', ['10 | 2']) === 'stats');

// ── 3. Pipe width normalisation (blank Date column survives) ─────────
const cells = sb.splitPipesToWidth_(' | Bank A/c Dr. | | 1,92,000 | ', 5);
check('blank first cell kept', cells.length === 5 && cells[0] === '' && cells[3] === '1,92,000', JSON.stringify(cells));
const edge = sb.splitPipesToWidth_('| a | b |', 2);
check('edge pipes trimmed', edge.length === 2 && edge[0] === 'a', JSON.stringify(edge));

// ── 4. Validators catch broken totals ────────────────────────────────
const badJ = sb.validateBlock_({ type: 'journal', kind: 'journal', rowsText: 'Date | Particulars | L.F. | Dr | Cr\n | Cash A/c Dr. | | 500 |\n | To Sales | | | 400\n(Being sale)' });
check('journal Dr≠Cr caught', badJ.length === 1, JSON.stringify(badJ));
const badBS = sb.validateBlock_({ type: 'table', kind: 'balance_sheet', rowsText: 'Liabilities | Amount | Assets | Amount\nCapital | 500 | Cash | 400\nTotal | 500 | Total | 500' });
check('BS item sum ≠ total caught', badBS.length === 1, JSON.stringify(badBS));
const badTB = sb.validateBlock_({ type: 'table', kind: 'trial_balance', rowsText: 'S.No. | Name of Account | L.F. | Dr | Cr\n1 | Cash | | 500 |\n2 | Capital | | | 450\n | Total | | 500 | 450' });
check('TB disagreement caught', badTB.some((s) => /does not agree/.test(s)), JSON.stringify(badTB));

// ── 5. Single source: accounts_spec → Journal + Ledgers + TB all tally ──
const spec = [{
  type: 'accounts_spec',
  entries: [
    { date: '01-Apr', dr: [{ ac: 'Cash', amt: 100000 }], cr: [{ ac: 'Capital', amt: 100000 }], narration: 'Being business started with cash' },
    { date: '05-Apr', dr: [{ ac: 'Purchases', amt: 30000 }], cr: [{ ac: 'Cash', amt: 30000 }], narration: 'Being goods purchased for cash' },
    { date: '09-Apr', dr: [{ ac: 'Cash', amt: 25000 }, { ac: 'Debtors', amt: 15000 }], cr: [{ ac: 'Sales', amt: 40000 }], narration: 'Being goods sold' }
  ]
}];
const expanded = sb.expandSpecBlocks_(spec);
const ek = kinds(expanded);
check('spec → journal', ek[0] === 'journal', ek.join(','));
check('spec → 5 ledgers', ek.filter((k) => k === 'ledger').length === 5, ek.join(','));
check('spec → trial balance', ek[ek.length - 1] === 'trial_balance', ek.join(','));
check('spec blocks all tally', sb.validateBlocks_(expanded).length === 0, JSON.stringify(sb.validateBlocks_(expanded)));
check('spec TB total 1,40,000', /1,40,000 \| 1,40,000/.test(expanded[expanded.length - 1].rowsText), expanded[expanded.length - 1].rowsText);

const s3 = sb.expandSpecBlocks_([{ type: 'balance_sheet_spec', format: 'schedule3', sections: [
  { heading: 'Equity and Liabilities', groups: [{ heading: "Shareholders' Funds", items: [{ label: 'Share Capital', note: 1, cy: 500000 }] }, { heading: 'Current Liabilities', items: [{ label: 'Trade Payables', cy: 100000 }] }] },
  { heading: 'Assets', groups: [{ heading: 'Non-current Assets', items: [{ label: 'Property, Plant & Equipment', note: 2, cy: 450000 }] }, { heading: 'Current Assets', items: [{ label: 'Cash and Cash Equivalents', cy: 150000 }] }] }
] }]);
check('schedule III kind', s3[0].kind === 'bs_schedule3');
check('schedule III tallies', sb.validateBlocks_(s3).length === 0, JSON.stringify(sb.validateBlocks_(s3)));

console.log('\nDecisions per fixture:');
for (const s of summary) console.log('  ' + s.name.padEnd(34) + s.kinds + (s.review ? '  [NEEDS_REVIEW ' + s.review + ']' : '') + (s.validation ? '  [CHECK: ' + s.validation + ']' : ''));
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
