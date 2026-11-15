/**
 * ═══════════════════════════════════════════════════════════════════════
 * DPP DECIDER SYSTEM
 * One place that decides WHAT a piece of content is (journal, ledger,
 * trial balance, balance sheet, computation, comparison, statistics …)
 * and HOW it is laid out (column ratios, indents, alignment).
 *
 *  1. Layout Profile Registry  – widths / indents per content kind
 *  2. Decider                   – scored classification + confidence
 *  3. NEEDS_REVIEW fallback     – hand-aligned text kept in monospace
 *  4. Content Spec expansion    – accounts_spec → Journal + Ledgers + TB
 *  5. Validators                – Dr = Cr, totals, balance sheet tally
 * Renderers in subjective.gs read their widths from here, so changing one
 * kind can never shift the layout of another.
 * ═══════════════════════════════════════════════════════════════════════
 */

var DPP_LAYOUT_PROFILES_ = {
  // Journal: Date | Particulars | L.F. | Dr | Cr. Dr line flush, "To" line indented.
  journal: {
    widths: { 5: [12, 48, 8, 16, 16], 4: [56, 10, 17, 17], 3: [60, 20, 20] },
    drIndentMm: 0, toIndentMm: 8, narrationIndentMm: 4
  },
  // Ledger (T-account): two equal halves.
  ledger: {
    // Dated ledgers: date column wide enough for "01-Apr-23" on one line.
    widths: { 4: [36, 14, 36, 14], 6: [12, 25, 13, 12, 25, 13], 8: [11, 21, 6, 12, 11, 21, 6, 12] }
  },
  trial_balance: {
    widths: { 5: [8, 52, 8, 16, 16], 4: [52, 12, 18, 18], 3: [60, 20, 20] }
  },
  // Class 11 / partnership horizontal Balance Sheet.
  balance_sheet: { widths: { 4: [36, 14, 36, 14] } },
  // Class 12 company Balance Sheet, Schedule III vertical form.
  bs_schedule3: {
    widths: { 4: [58, 12, 15, 15], 3: [65, 15, 20] },
    levelIndentMm: [0, 3, 7, 11]
  },
  // Single-column computations: CFS, BRS, National Income, P&L appropriation working.
  computation: {
    widths: { 2: [75, 25], 3: [60, 20, 20], 4: [52, 16, 16, 16] },
    levelIndentMm: [0, 5, 10]
  },
  // "Distinguish between" tables (BST / Eco): Basis | A | B.
  comparison: { widths: { 2: [50, 50], 3: [20, 40, 40], 4: [16, 28, 28, 28] } },
  // Statistics frequency / correlation tables: label column + equal numeric columns.
  stats: { firstColPct: 22 },
  generic: { firstColPct: 30 },
  graph: { widthMm: 120, aspect: 0.75 },
  theory: { levelIndentMm: [0, 5, 10, 15, 20, 25] }
};

/** Column widths (percent, sum 100) for a kind and column count. */
function getProfileWidths_(kind, n) {
  var p = DPP_LAYOUT_PROFILES_[kind];
  if (p && p.widths && p.widths[n]) return p.widths[n].slice();
  if (n <= 0) return [];
  if (n === 1) return [100];
  var first = (p && p.firstColPct) || (kind === 'stats' ? 22 : 30);
  var rest = (100 - first) / (n - 1);
  var out = [first];
  for (var i = 1; i < n; i++) out.push(Math.round(rest * 100) / 100);
  return out;
}

function colgroupFromWidths_(widths) {
  if (!widths || !widths.length) return '';
  return '<colgroup>' + widths.map(function(w) { return '<col style="width: ' + w + '%;">'; }).join('') + '</colgroup>';
}

/**
 * Splits a pipe row to exactly n cells. Edge pipes ("| a | b |") are trimmed
 * only while the row has more cells than the header, so an intentionally empty
 * first cell (blank Date column) is kept in place.
 */
function splitPipesToWidth_(line, n, keepRaw) {
  // keepRaw: return cells with their leading spaces (used for indentation levels).
  var rawCells = String(line || '').replace(/\s+$/, '').split('|');
  var cells = rawCells.map(function(c) { return c.trim(); });
  function drop(atStart) {
    if (atStart) { cells.shift(); rawCells.shift(); } else { cells.pop(); rawCells.pop(); }
  }
  var fromStart = true;
  while (n && cells.length > n) {
    if (fromStart && cells[0] === '') drop(true);
    else if (cells[cells.length - 1] === '') drop(false);
    else if (cells[0] === '') drop(true);
    else break;
    fromStart = !fromStart;
  }
  if (!n) {
    if (cells.length && cells[0] === '') drop(true);
    if (cells.length && cells[cells.length - 1] === '') drop(false);
  }
  while (n && cells.length < n) { cells.push(''); rawCells.push(''); }
  return keepRaw ? rawCells.map(function(c) { return String(c).replace(/\s+$/, ''); }) : cells;
}

/** "1,92,000" → 192000, "(30,000)" → -30000, "-" / text → null. */
function parseAmount_(s) {
  var t = String(s == null ? '' : s).replace(/₹|rs\.?|\s/gi, '');
  if (!t || t === '-' || t === '—') return null;
  var neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  if (/^-/.test(t)) { neg = true; t = t.slice(1); }
  if (!/^\d[\d,]*(\.\d+)?$/.test(t)) return null;
  var v = parseFloat(t.replace(/,/g, ''));
  return neg ? -v : v;
}

/** 192000 → "1,92,000" (Indian grouping). */
function formatInr_(n) {
  if (n == null || n === '') return '';
  var neg = n < 0;
  var s = String(Math.round(Math.abs(n)));
  var last3 = s.slice(-3);
  var rest = s.slice(0, -3);
  if (rest) last3 = ',' + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (neg ? '(' : '') + rest + last3 + (neg ? ')' : '');
}

// ─────────────────────────────────────────────────────────────────────
// DECIDER
// ─────────────────────────────────────────────────────────────────────

var DPP_TABLE_KINDS_ = ['journal', 'ledger', 'capital', 'trial_balance', 'balance_sheet', 'bs_schedule3', 'computation', 'comparison', 'stats', 'generic'];

/**
 * Scores every table kind and returns the best one.
 * @param {string[]} headerCols
 * @param {string[]} bodyLines raw body lines (pipe rows and narration lines)
 * @param {string} title
 * @param {string} subject
 * @param {string[]} [allowed] restrict to these kinds (e.g. inside #TABLE)
 * @return {{kind:string, confidence:number, reasons:string[], scores:Object}}
 */
function decideTableKind_(headerCols, bodyLines, title, subject, allowed) {
  var n = headerCols.length;
  var h = headerCols.join(' | ').toLowerCase();
  var t = String(title || '').toLowerCase();
  var subj = String(subject || '').toLowerCase();
  var scores = {};
  var reasons = [];
  DPP_TABLE_KINDS_.forEach(function(k) { scores[k] = 0; });
  function add(kind, pts, why) { scores[kind] += pts; reasons.push(kind + '+' + pts + ':' + why); }

  var pipeRows = bodyLines.filter(function(l) { return l.indexOf('|') !== -1; });
  var cellsRows = pipeRows.map(function(l) { return splitPipesToWidth_(l, n); });
  var narrations = bodyLines.filter(function(l) { return l.indexOf('|') === -1 && /^\s*\(being/i.test(l); }).length;
  var drSuffix = 0, toLeft = 0, toByPairs = 0, addLess = 0, numericCells = 0, totalCells = 0;
  cellsRows.forEach(function(c) {
    c.forEach(function(cell) {
      if (/\bdr\.?$/i.test(cell)) drSuffix++;
      if (/^(add|less)\s*:/i.test(cell)) addLess++;
      if (cell) { totalCells++; if (parseAmount_(cell) !== null) numericCells++; }
    });
    var joined = c.join('|');
    if (/(^|\|)\s*to\s/i.test(joined) && /\|\s*(\d{1,2}[-\/ ]\w+[-\/ ]?\d*\s*\|\s*)?by\s/i.test(joined)) toByPairs++;
    else if (/(^|\|)\s*to\s/i.test(joined)) toLeft++;
  });
  var numericRatio = totalCells ? numericCells / totalCells : 0;

  // Journal
  if (/journal/.test(t)) add('journal', 5, 'title');
  if (/\bdate\b/.test(h) && /l\.?\s?f/.test(h)) add('journal', 3, 'date+L.F. header');
  if (/(debit|\bdr\b)/.test(h) && /(credit|\bcr\b)/.test(h)) { add('journal', 1, 'dr/cr header'); add('trial_balance', 1, 'dr/cr header'); }
  if (drSuffix) add('journal', Math.min(4, 2 + drSuffix), 'rows end with Dr.');
  if (narrations) add('journal', 4, '(Being …) narration');
  if (toLeft && !toByPairs && drSuffix) add('journal', 1, 'To lines');

  // Trial balance
  if (/trial balance/.test(t)) add('trial_balance', 6, 'title');
  if (/(name of account|s\.?\s?no|heads? of account)/.test(h)) add('trial_balance', 2, 'account-name header');
  if (/balance/.test(h) && /(debit|dr)/.test(h)) add('trial_balance', 2, 'debit balance header');

  // Ledger
  var particularsCount = (h.match(/particular/g) || []).length;
  if (particularsCount === 2) add('ledger', 3, 'two Particulars columns');
  if (toByPairs) add('ledger', 4, 'To … | By … rows');
  if (/(a\/c|account)$/.test(t.trim()) && !/balance sheet|trial/.test(t)) add('ledger', 2, 'account title');
  if (n === 4 || n === 6 || n === 8) add('ledger', 1, 'even column count');

  // Partners' capital (two halves with ≥2 partner columns each)
  if (n >= 6 && n % 2 === 0 && /particular/.test(headerCols[0].toLowerCase()) && /particular/.test(String(headerCols[n / 2]).toLowerCase())) {
    var partnerCols = headerCols.slice(1, n / 2).filter(function(c) { return !/date|j\.?f|l\.?f|amount/i.test(c); }).length;
    // Outranks the generic ledger signals (two Particulars, To/By rows) that a capital account also has.
    if (partnerCols >= 2) add('capital', 10, partnerCols + ' partner columns');
  }
  if (/capital a\/?cs?|capital accounts/.test(t)) add('capital', 2, 'title');

  // Balance sheets
  if (/liabilit/.test(h) && /asset/.test(h)) add('balance_sheet', 7, 'Liabilities | Assets header');
  if (/balance sheet/.test(t)) { add('balance_sheet', 2, 'title'); add('bs_schedule3', 2, 'title'); }
  if (/note/.test(h)) add('bs_schedule3', 6, 'Note No. column');
  if (bodyLines.some(function(l) { return /equity and liabilities|shareholders'? funds/i.test(l); })) add('bs_schedule3', 3, 'Schedule III headings');

  // Computation / statements in one column of amounts
  if (n <= 4 && /particular/.test(String(headerCols[0]).toLowerCase()) && particularsCount === 1 && !/liabilit|asset|note|date/.test(h)) add('computation', 3, 'Particulars + amounts');
  if (addLess) add('computation', 2, 'Add:/Less: rows');
  if (/cash flow|reconciliation|national income|calculation|computation|statement/.test(t)) add('computation', 3, 'statement title');

  // Comparison
  if (/^basis/.test(String(headerCols[0]).toLowerCase())) add('comparison', 8, 'Basis column');
  if (/distinguish|difference/.test(t)) add('comparison', 3, 'title');

  // Statistics
  if (headerCols.some(function(c) { return /^(x|y|f|cf|fx|fd|dx|dy|mid[-\s]?value|m|class( interval)?|c\.i\.|x²|y²|xy|d²|σ.*)$/i.test(c.replace(/\s*\(.*\)$/, '')); })) add('stats', 4, 'statistical column names');
  if (/stat/.test(subj) && numericRatio > 0.5) add('stats', 2, 'statistics subject, numeric grid');
  if (numericRatio > 0.75 && !particularsCount) add('stats', 1, 'mostly numbers');

  add('generic', 1, 'fallback');

  var kinds = allowed && allowed.length ? allowed : DPP_TABLE_KINDS_;
  var best = 'generic', second = 0;
  kinds.forEach(function(k) {
    if (scores[k] > scores[best] || kinds.indexOf(best) === -1) { best = k; }
  });
  kinds.forEach(function(k) { if (k !== best && scores[k] > second) second = scores[k]; });
  var top = scores[best];
  var confidence = top <= 1 ? 0.3 : Math.max(0.3, Math.min(1, (top - second) / top + 0.25));
  return { kind: best, confidence: Math.round(confidence * 100) / 100, reasons: reasons, scores: scores };
}

/**
 * True when text is hand-aligned with spaces (fixed-width tables typed into
 * the vault). Proportional fonts destroy that alignment, so such text must be
 * printed in monospace rather than guessed into a table.
 */
function looksFixedWidth_(text) {
  var lines = String(text || '').split('\n').filter(function(l) { return l.trim(); });
  if (lines.length < 3) return false;
  var rules = lines.filter(function(l) { return /^\s*[-=_]{10,}\s*$/.test(l); }).length;
  // A run of 3+ spaces between two non-pipe characters = alignment by spaces.
  var aligned = lines.filter(function(l) { return /[^\s|] {3,}[^\s|]/.test(l) && /\d[\d,]*\)?\s*$/.test(l); }).length;
  return (rules >= 1 && aligned >= 2) || aligned >= 4;
}

/**
 * Logs a NEEDS_REVIEW notice. Content is still printed (monospace), never dropped.
 */
function flagNeedsReview_(blk, why) {
  blk.needsReview = true;
  blk.reviewReason = why;
  try { Logger.log('DPP NEEDS_REVIEW: ' + why); } catch (_) {}
  return blk;
}

/**
 * Turns an unmarked pipe table into a typed block using the decider.
 * Returns null if the decider is not confident (caller falls back).
 */
function buildDecidedTableBlock_(text, subject, title, allowed) {
  var lines = String(text || '').split('\n').filter(function(l) { return l.trim() && !/^\s*[-=_]{3,}\s*$/.test(l) && !/^\s*\|?[\s\-:|]+\|[\s\-:|]*$/.test(l); });
  var firstPipe = -1;
  for (var i = 0; i < lines.length; i++) { if (lines[i].indexOf('|') !== -1) { firstPipe = i; break; } }
  if (firstPipe === -1) return null;
  var lead = lines.slice(0, firstPipe);
  var headerCols = splitPipesToWidth_(lines[firstPipe], 0);
  var body = lines.slice(firstPipe + 1);
  var decision = decideTableKind_(headerCols, body, title || (lead.length === 1 ? lead[0] : ''), subject, allowed);

  // Shape check: rows that cannot be fitted to the header width.
  var pipeRows = body.filter(function(l) { return l.indexOf('|') !== -1; });
  var bad = pipeRows.filter(function(l) {
    var raw = l.split('|').length;
    return raw > headerCols.length + 2 || raw < Math.max(2, headerCols.length - 2);
  }).length;
  var shapeBad = !!(pipeRows.length && bad / pipeRows.length > 0.3);
  if (shapeBad) decision.confidence = Math.min(decision.confidence, 0.35);

  var tableTitle = title || (lead.length === 1 && lead[0].length <= 90 ? lead[0].replace(/:$/, '') : '');
  return {
    type: 'table',
    kind: decision.kind,
    title: tableTitle,
    rowsText: lines.slice(firstPipe).join('\n'),
    leadText: (!tableTitle && lead.length) ? lead.join('\n') : '',
    decision: decision,
    shapeBad: shapeBad
  };
}

// ─────────────────────────────────────────────────────────────────────
// CONTENT SPEC → BLOCKS (single source of truth for accounting)
// ─────────────────────────────────────────────────────────────────────

/**
 * Expands spec blocks into renderable blocks.
 *  accounts_spec       { entries:[{date, dr:[{ac,amt}], cr:[{ac,amt}], narration}], show:['journal','ledger','trial_balance'], accounts:[…] }
 *  journal_spec        { entries:[…] }
 *  trial_balance_spec  { rows:[{ac, dr, cr}] }
 *  balance_sheet_spec  { format:'horizontal'|'schedule3', liabilities:[…], assets:[…] } or { format:'schedule3', sections:[…] }
 */
function expandSpecBlocks_(blocks) {
  var out = [];
  (blocks || []).forEach(function(b) {
    if (!b || !b.type) return;
    if (b.type === 'accounts_spec') {
      var show = b.show || ['journal', 'ledger', 'trial_balance'];
      if (show.indexOf('journal') !== -1) out.push(journalBlockFromEntries_(b.entries, b.title));
      var ledgers = deriveLedgersFromEntries_(b.entries);
      if (show.indexOf('ledger') !== -1) {
        ledgers.order.forEach(function(ac) {
          if (b.accounts && b.accounts.indexOf(ac) === -1) return;
          out.push(ledgerBlockFromAccount_(ledgers.byAc[ac]));
        });
      }
      if (show.indexOf('trial_balance') !== -1) out.push(trialBalanceBlockFromLedgers_(ledgers, b.tbTitle || b.trialBalanceTitle));
    } else if (b.type === 'journal_spec') {
      out.push(journalBlockFromEntries_(b.entries, b.title));
    } else if (b.type === 'trial_balance_spec') {
      out.push(trialBalanceBlockFromRows_(b.rows, b.title));
    } else if (b.type === 'balance_sheet_spec') {
      out.push(b.format === 'schedule3' ? schedule3BlockFromSpec_(b) : horizontalBsBlockFromSpec_(b));
    } else {
      out.push(b);
    }
  });
  return out;
}

function journalBlockFromEntries_(entries, title) {
  var rows = ['Date | Particulars | L.F. | Dr. (₹) | Cr. (₹)'];
  (entries || []).forEach(function(e) {
    var dr = e.dr || [], cr = e.cr || [];
    dr.forEach(function(d, i) {
      rows.push((i === 0 ? (e.date || '') : '') + ' | ' + d.ac + ' Dr. | | ' + formatInr_(d.amt) + ' | ');
    });
    cr.forEach(function(c) {
      rows.push(' | To ' + c.ac + ' | | | ' + formatInr_(c.amt));
    });
    if (e.narration) rows.push('(Being ' + String(e.narration).replace(/^\(?being\s*/i, '').replace(/\)$/, '') + ')');
  });
  return { type: 'journal', kind: 'journal', title: title || 'Journal Entries', rowsText: rows.join('\n'), fromSpec: true };
}

function deriveLedgersFromEntries_(entries) {
  var byAc = {}, order = [];
  function acct(name) {
    if (!byAc[name]) { byAc[name] = { name: name, dr: [], cr: [] }; order.push(name); }
    return byAc[name];
  }
  (entries || []).forEach(function(e) {
    var dr = e.dr || [], cr = e.cr || [];
    dr.forEach(function(d) {
      var a = acct(d.ac);
      if (cr.length === 1) a.dr.push({ date: e.date || '', desc: 'To ' + cr[0].ac, amt: d.amt });
      else if (dr.length === 1) cr.forEach(function(c) { a.dr.push({ date: e.date || '', desc: 'To ' + c.ac, amt: c.amt }); });
      else a.dr.push({ date: e.date || '', desc: 'To Sundries', amt: d.amt });
    });
    cr.forEach(function(c) {
      var a = acct(c.ac);
      if (dr.length === 1) a.cr.push({ date: e.date || '', desc: 'By ' + dr[0].ac, amt: c.amt });
      else if (cr.length === 1) dr.forEach(function(d) { a.cr.push({ date: e.date || '', desc: 'By ' + d.ac, amt: d.amt }); });
      else a.cr.push({ date: e.date || '', desc: 'By Sundries', amt: c.amt });
    });
  });
  order.forEach(function(name) {
    var a = byAc[name];
    var drSum = a.dr.reduce(function(s, x) { return s + x.amt; }, 0);
    var crSum = a.cr.reduce(function(s, x) { return s + x.amt; }, 0);
    a.balance = drSum - crSum; // + = debit balance
    a.total = Math.max(drSum, crSum);
  });
  return { byAc: byAc, order: order };
}

function ledgerBlockFromAccount_(a) {
  var hasDates = a.dr.concat(a.cr).some(function(x) { return x.date; });
  var dr = a.dr.slice(), cr = a.cr.slice();
  if (a.balance > 0) cr.push({ date: '', desc: 'By Balance c/d', amt: a.balance });
  else if (a.balance < 0) dr.push({ date: '', desc: 'To Balance c/d', amt: -a.balance });
  var rows = [hasDates ? 'Date | Particulars | Amount (₹) | Date | Particulars | Amount (₹)' : 'Particulars | Amount (₹) | Particulars | Amount (₹)'];
  var max = Math.max(dr.length, cr.length);
  for (var i = 0; i < max; i++) {
    var l = dr[i] || { date: '', desc: '', amt: null };
    var r = cr[i] || { date: '', desc: '', amt: null };
    rows.push(hasDates
      ? [l.date, l.desc, formatInr_(l.amt), r.date, r.desc, formatInr_(r.amt)].join(' | ')
      : [l.desc, formatInr_(l.amt), r.desc, formatInr_(r.amt)].join(' | '));
  }
  var tot = formatInr_(a.total);
  rows.push(hasDates ? [' ', 'Total', tot, ' ', 'Total', tot].join(' | ') : ['Total', tot, 'Total', tot].join(' | '));
  return { type: 'taccount', kind: 'ledger', title: /a\/c$/i.test(a.name) ? a.name : a.name + ' A/c', rowsText: rows.join('\n'), fromSpec: true };
}

function trialBalanceBlockFromLedgers_(ledgers, title) {
  var rows = ledgers.order.map(function(name) {
    var a = ledgers.byAc[name];
    return { ac: name, dr: a.balance > 0 ? a.balance : null, cr: a.balance < 0 ? -a.balance : null };
  }).filter(function(r) { return r.dr || r.cr; });
  return trialBalanceBlockFromRows_(rows, title);
}

function trialBalanceBlockFromRows_(rows, title) {
  var lines = ['S.No. | Name of Account | L.F. | Debit Balance (₹) | Credit Balance (₹)'];
  var drT = 0, crT = 0;
  (rows || []).forEach(function(r, i) {
    drT += r.dr || 0; crT += r.cr || 0;
    lines.push((i + 1) + ' | ' + r.ac + ' | | ' + formatInr_(r.dr) + ' | ' + formatInr_(r.cr));
  });
  lines.push(' | Total | | ' + formatInr_(drT) + ' | ' + formatInr_(crT));
  return { type: 'table', kind: 'trial_balance', title: title || 'Trial Balance', rowsText: lines.join('\n'), fromSpec: true };
}

/** liabilities/assets: [{label, amt, sub:[{label, amt}]}] */
function horizontalBsBlockFromSpec_(b) {
  function flatten(items) {
    var out = [], total = 0;
    (items || []).forEach(function(it) {
      if (it.sub && it.sub.length) {
        out.push({ desc: it.label + ':', amt: null });
        var subT = 0;
        it.sub.forEach(function(s, i) {
          subT += s.amt;
          out.push({ desc: '  ' + s.label + ' ' + formatInr_(s.amt), amt: i === it.sub.length - 1 ? (it.amt != null ? it.amt : subT) : null });
        });
        total += (it.amt != null ? it.amt : subT);
      } else {
        out.push({ desc: it.label, amt: it.amt });
        total += it.amt || 0;
      }
    });
    return { rows: out, total: total };
  }
  var L = flatten(b.liabilities), A = flatten(b.assets);
  var lines = ['Liabilities | Amount (₹) | Assets | Amount (₹)'];
  var max = Math.max(L.rows.length, A.rows.length);
  for (var i = 0; i < max; i++) {
    var l = L.rows[i] || { desc: '', amt: null }, a = A.rows[i] || { desc: '', amt: null };
    lines.push([l.desc, formatInr_(l.amt), a.desc, formatInr_(a.amt)].join(' | '));
  }
  lines.push(['Total', formatInr_(L.total), 'Total', formatInr_(A.total)].join(' | '));
  return { type: 'table', kind: 'balance_sheet', title: b.title || 'Balance Sheet', rowsText: lines.join('\n'), fromSpec: true };
}

/**
 * sections: [{heading:'EQUITY AND LIABILITIES', groups:[{heading:"Shareholders' Funds", items:[{label, note, cy, py}]}]}]
 */
function schedule3BlockFromSpec_(b) {
  var hasPy = JSON.stringify(b.sections || []).indexOf('"py"') !== -1;
  var cyLabel = b.cyLabel || 'Current Year (₹)';
  var pyLabel = b.pyLabel || 'Previous Year (₹)';
  var lines = [hasPy ? ('Particulars | Note No. | ' + cyLabel + ' | ' + pyLabel) : ('Particulars | Note No. | Amount (₹)')];
  var roman = ['I', 'II', 'III', 'IV'];
  var sectionTotals = [];
  (b.sections || []).forEach(function(sec, si) {
    lines.push(roman[si] + '. ' + String(sec.heading).toUpperCase() + ' | |' + (hasPy ? ' |' : ''));
    var cyT = 0, pyT = 0;
    (sec.groups || []).forEach(function(g, gi) {
      lines.push((gi + 1) + '. ' + g.heading + ' | |' + (hasPy ? ' |' : ''));
      (g.items || []).forEach(function(it, ii) {
        cyT += it.cy || 0; pyT += it.py || 0;
        var tag = '(' + String.fromCharCode(97 + ii) + ') ';
        lines.push(tag + it.label + ' | ' + (it.note || '') + ' | ' + formatInr_(it.cy) + (hasPy ? ' | ' + formatInr_(it.py) : ''));
      });
    });
    sectionTotals.push(cyT);
    lines.push('Total | | ' + formatInr_(cyT) + (hasPy ? ' | ' + formatInr_(pyT) : ''));
  });
  return { type: 'table', kind: 'bs_schedule3', title: b.title || 'Balance Sheet', rowsText: lines.join('\n'), fromSpec: true };
}

// ─────────────────────────────────────────────────────────────────────
// VALIDATORS (accounting consistency)
// ─────────────────────────────────────────────────────────────────────

function dppTableLines_(blk) {
  return String(blk.rowsText || '').split('\n').filter(function(l) { return l.trim() && !/^\s*[-=_]{3,}\s*$/.test(l); });
}

function sameAmount_(a, b) { return Math.abs((a || 0) - (b || 0)) < 0.5; }

/** A header row names columns; it has no amounts and no To/By postings. */
function dppLooksLikeHeader_(cells) {
  if (!cells || !cells.length) return false;
  if (cells.some(function(c) { return parseAmount_(c) !== null; })) return false;
  if (cells.some(function(c) { return /^(to|by)\s/i.test(c); })) return false;
  return true;
}

/**
 * @return {string[]} human-readable issues; empty when the block tallies.
 */
function validateBlock_(blk) {
  if (!blk) return [];
  var kind = blk.kind || (blk.type === 'journal' ? 'journal' : blk.type === 'taccount' ? 'ledger' : blk.type === 'capital' ? 'capital' : null);
  if (!kind && blk.type === 'table') {
    var tl = dppTableLines_(blk);
    if (tl.length && tl[0].indexOf('|') !== -1) kind = decideTableKind_(splitPipesToWidth_(tl[0], 0), tl.slice(1), blk.title, '', null).kind;
  }
  var lines = dppTableLines_(blk);
  if (!lines.length || lines[0].indexOf('|') === -1) return [];
  var header = splitPipesToWidth_(lines[0], 0);
  var body = lines.slice(1);
  // Headerless ledger / journal (rows start straight with To/By or amounts): use the default header.
  if (!dppLooksLikeHeader_(header)) {
    body = lines;
    if (kind === 'ledger') header = header.length === 6 ? ['Date', 'Particulars', 'Amount', 'Date', 'Particulars', 'Amount'] : ['Particulars', 'Amount', 'Particulars', 'Amount'];
    else if (kind === 'journal') header = ['Date', 'Particulars', 'L.F.', 'Dr.', 'Cr.'];
    else return [];
  }
  var n = header.length;
  var issues = [];
  var label = (blk.title || kind || blk.type);

  if (kind === 'journal') {
    var drI = n - 2, crI = n - 1, entryNo = 1, drS = 0, crS = 0, any = false;
    var close = function() {
      if (any && !sameAmount_(drS, crS)) issues.push(label + ': entry ' + entryNo + ' Dr ' + formatInr_(drS) + ' ≠ Cr ' + formatInr_(crS));
      if (any) entryNo++;
      drS = 0; crS = 0; any = false;
    };
    body.forEach(function(l) {
      if (l.indexOf('|') === -1) { if (/^\s*\(being/i.test(l)) close(); return; }
      var c = splitPipesToWidth_(l, n);
      if (/total/i.test(c.join(' '))) return;
      var d = parseAmount_(c[drI]), k = parseAmount_(c[crI]);
      if (d !== null) { drS += d; any = true; }
      if (k !== null) { crS += k; any = true; }
    });
    close();
    return issues;
  }

  if (kind === 'ledger' || kind === 'balance_sheet' || kind === 'capital') {
    // Left half / right half; amount columns are every column except particulars/date/JF.
    var half = n / 2;
    if (n % 2 !== 0) return [];
    var amtCols = [];
    for (var ci = 0; ci < half; ci++) {
      if (!/particular|liabilit|asset|date|j\.?\s?f|l\.?\s?f/i.test(header[ci])) amtCols.push(ci);
    }
    var segL = amtCols.map(function() { return 0; }), segR = amtCols.map(function() { return 0; }), seg = 1;
    body.forEach(function(l) {
      if (l.indexOf('|') === -1) return;
      var c = splitPipesToWidth_(l, n);
      var isTotal = /total/i.test(c[0] + ' ' + c[1]) || /total/i.test(c[half] + ' ' + c[half + 1]);
      amtCols.forEach(function(ai, idx) {
        var lv = parseAmount_(c[ai]), rv = parseAmount_(c[ai + half]);
        if (isTotal) {
          var colName = header[ai] || ('column ' + (ai + 1));
          if (lv !== null && rv !== null && !sameAmount_(lv, rv)) issues.push(label + ' (part ' + seg + ', ' + colName + '): left total ' + formatInr_(lv) + ' ≠ right total ' + formatInr_(rv));
          if (lv !== null && !sameAmount_(segL[idx], lv)) issues.push(label + ' (part ' + seg + ', ' + colName + '): left items add to ' + formatInr_(segL[idx]) + ' but total says ' + formatInr_(lv));
          if (rv !== null && !sameAmount_(segR[idx], rv)) issues.push(label + ' (part ' + seg + ', ' + colName + '): right items add to ' + formatInr_(segR[idx]) + ' but total says ' + formatInr_(rv));
        } else {
          if (lv !== null) segL[idx] += lv;
          if (rv !== null) segR[idx] += rv;
        }
      });
      if (isTotal) { segL = amtCols.map(function() { return 0; }); segR = amtCols.map(function() { return 0; }); seg++; }
    });
    return issues;
  }

  if (kind === 'trial_balance') {
    var dI = n - 2, cI = n - 1, dS = 0, cS = 0;
    body.forEach(function(l) {
      if (l.indexOf('|') === -1) return;
      var c = splitPipesToWidth_(l, n);
      var d = parseAmount_(c[dI]), k = parseAmount_(c[cI]);
      if (/total/i.test(c.join(' '))) {
        if (d !== null && !sameAmount_(d, dS)) issues.push(label + ': debit column adds to ' + formatInr_(dS) + ' but total says ' + formatInr_(d));
        if (k !== null && !sameAmount_(k, cS)) issues.push(label + ': credit column adds to ' + formatInr_(cS) + ' but total says ' + formatInr_(k));
        if (d !== null && k !== null && !sameAmount_(d, k)) issues.push(label + ': Trial Balance does not agree (' + formatInr_(d) + ' vs ' + formatInr_(k) + ')');
        return;
      }
      if (d !== null) dS += d;
      if (k !== null) cS += k;
    });
    return issues;
  }

  if (kind === 'bs_schedule3') {
    var totals = [];
    body.forEach(function(l) {
      var c = splitPipesToWidth_(l, n);
      if (/^total$/i.test(c[0])) totals.push(parseAmount_(c[2]));
    });
    if (totals.length === 2 && !sameAmount_(totals[0], totals[1])) issues.push(label + ': Equity & Liabilities ' + formatInr_(totals[0]) + ' ≠ Assets ' + formatInr_(totals[1]));
    return issues;
  }
  return issues;
}

/** Validates a whole block list; returns [{index, type, issues}] for failures only. */
function validateBlocks_(blocks) {
  var out = [];
  (blocks || []).forEach(function(b, i) {
    var iss = validateBlock_(b);
    if (iss.length) { b.validationIssues = iss; out.push({ index: i, type: b.type, kind: b.kind || '', issues: iss }); }
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// SHARED RENDER HELPERS
// ─────────────────────────────────────────────────────────────────────

var DPP_TABLE_STYLE_ = 'width: 100%; border-collapse: collapse; font-size: 10.5pt; border: 1px solid #E6DDF7; table-layout: fixed; font-family: inherit;';
var DPP_TH_STYLE_ = 'background: #F4EEFF; color: #1E0063; padding: 5px 7px; border-right: 1px solid #E6DDF7; border-bottom: 1px solid #E6DDF7; font-weight: 700; font-size: 10pt; vertical-align: bottom;';
var DPP_TD_BASE_ = 'padding: 3px 7px; border-right: 1px solid #E6DDF7; color: #1B1530; font-size: 10.5pt; vertical-align: top; font-variant-numeric: tabular-nums;';
var DPP_TOTAL_ROW_ = 'border-top: 1px solid #1E0063; border-bottom: 3px double #1E0063; font-weight: 700;';

function dppTableTitleHtml_(title) {
  return title ? '<div style="font-weight: 700; font-size: 10.5pt; color: #1E0063; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px;">' + escapeHtml_(title) + '</div>' : '';
}

/** Leading spaces → indent level (2 spaces per level). */
function dppIndentLevel_(raw) {
  var m = String(raw || '').match(/^(\s*)/);
  return Math.min(3, Math.floor((m ? m[1].length : 0) / 2));
}

/**
 * Renders trial balance, Schedule III balance sheet, computation, comparison,
 * statistics and generic tables from their layout profile.
 */
function renderProfiledTableHtml_(blk, kind) {
  var lines = dppTableLines_(blk);
  if (!lines.length) return '';
  var rawHeaderLine = lines[0];
  var header = splitPipesToWidth_(rawHeaderLine, 0);
  var n = header.length;
  var widths = getProfileWidths_(kind, n);
  var profile = DPP_LAYOUT_PROFILES_[kind] || {};
  var levelMm = profile.levelIndentMm || [0, 5, 10, 15];

  // Numeric columns: decided per column from the body, not from header words.
  var body = lines.slice(1).filter(function(l) { return l.indexOf('|') !== -1; });
  var numericCol = header.map(function(hc, ci) {
    if (ci === 0 && kind !== 'stats') return false;
    if (kind === 'comparison') return false;
    var filled = 0, nums = 0;
    body.forEach(function(l) {
      var raw = l.split('|');
      var c = splitPipesToWidth_(l, n)[ci];
      if (c) { filled++; if (parseAmount_(c) !== null || /^[\d.,\-+()%√²σΣ\s/=]+$/.test(c)) nums++; }
    });
    return filled > 0 && nums / filled >= 0.6;
  });
  var centerCol = header.map(function(hc) { return /^(s\.?\s?no\.?|l\.?\s?f\.?|note( no\.?)?|j\.?\s?f\.?)$/i.test(hc.trim()); });

  var ths = header.map(function(hc, ci) {
    var align = centerCol[ci] ? 'center' : (numericCol[ci] ? 'right' : 'left');
    return '<th style="' + DPP_TH_STYLE_ + ' text-align: ' + align + ';">' + escapeHtml_(hc) + '</th>';
  }).join('');

  var trs = [];
  for (var i = 1; i < lines.length; i++) {
    var raw = lines[i];
    if (raw.indexOf('|') === -1) {
      trs.push('<tr><td colspan="' + n + '" style="' + DPP_TD_BASE_ + ' font-style: italic; color: #475569;">' + escapeHtml_(raw.trim()) + '</td></tr>');
      continue;
    }
    var rawFirst = raw.split('|')[0];
    var cells = splitPipesToWidth_(raw, n);
    var first = cells[0];
    var restEmpty = cells.slice(1).every(function(c) { return !c; });
    // Closing lines only (an opening "Net Profit before Tax" is not a total).
    var isTotal = /^(total|grand total)\b/i.test(first) || /^net cash (flow )?(from|used)/i.test(first) ||
      /^cash (and|&) cash equivalents at the end/i.test(first) || /balance as per pass book/i.test(first) ||
      /^national income\b/i.test(first) || (kind === 'trial_balance' && /^total\b/i.test(cells[1] || ''));
    var lvl = dppIndentLevel_(rawFirst);
    var isHeading = false, bold = false;

    if (kind === 'bs_schedule3') {
      if (/^(I|II|III|IV)\.\s/.test(first)) { lvl = 0; isHeading = true; bold = true; }
      else if (/^\d+\.\s/.test(first)) { lvl = 1; bold = true; }
      else if (/^\([a-z]{1,3}\)\s/.test(first)) { lvl = 2; }
      else if (/^\([ivx]+\)\s|^-\s/.test(first)) { lvl = 3; }
    } else if (kind === 'computation') {
      if (/^(add|less)\s*:/i.test(first) && lvl === 0) lvl = 1;
      if (restEmpty && /:$/.test(first)) bold = true;
    }
    var rowStyle = isTotal ? DPP_TOTAL_ROW_ : 'border-bottom: 1px solid #F0EAFB;';
    var tds = cells.map(function(c, ci) {
      var align = centerCol[ci] ? 'center' : (numericCol[ci] ? 'right' : 'left');
      var style = DPP_TD_BASE_ + ' text-align: ' + align + ';';
      if (numericCol[ci]) style += ' white-space: nowrap;';
      if (ci === 0 && !centerCol[0]) style += ' padding-left: ' + (2 + (levelMm[lvl] || 0)) + 'mm;';
      if (ci === 0 && centerCol[0]) style += '';
      if (bold || isTotal) style += ' font-weight: 700;';
      if (isHeading) style += ' color: #1E0063; letter-spacing: 0.3px;';
      if (kind === 'comparison' && ci === 0) style += ' font-weight: 700; color: #1E0063;';
      return '<td style="' + style + '">' + escapeHtml_(c) + '</td>';
    }).join('');
    trs.push('<tr style="' + rowStyle + '">' + tds + '</tr>');
  }

  return '<div class="content-card keep-together" data-kind="' + kind + '">' +
    dppTableTitleHtml_(blk.title) +
    '<table style="' + DPP_TABLE_STYLE_ + '">' + colgroupFromWidths_(widths) +
    '<thead><tr>' + ths + '</tr></thead><tbody>' + trs.join('\n') + '</tbody></table>' +
  '</div>';
}

/**
 * NEEDS_REVIEW fallback: prints hand-aligned text in monospace so the
 * author's spacing survives exactly. Rule lines become thin rules.
 */
function renderPreformattedBlockHtml_(blk) {
  var lines = String(blk.text || '').replace(/\s+$/, '').split('\n');
  var title = '';
  if (lines.length && /^[A-Z0-9 '&().,\-:\/]{6,}$/.test(lines[0].trim()) && !/\d[\d,]*\s*$/.test(lines[0])) {
    title = lines.shift().trim();
  }
  var parts = [], buf = [];
  function flush() {
    if (!buf.length) return;
    parts.push('<pre style="font-family: \'Roboto Mono\', \'Courier New\', monospace; font-size: 9.2pt; line-height: 1.42; white-space: pre; margin: 0; color: #1B1530;">' + escapeHtml_(buf.join('\n')) + '</pre>');
    buf = [];
  }
  lines.forEach(function(l) {
    if (/^\s*=+\s*$/.test(l)) { flush(); parts.push('<div style="border-top: 3px double #1E0063; margin: 1mm 0;"></div>'); }
    else if (/^\s*[-_]{6,}\s*$/.test(l)) { flush(); parts.push('<div style="border-top: 0.3mm solid #CFC3EA; margin: 1mm 0;"></div>'); }
    else buf.push(l);
  });
  flush();
  return '<div class="content-block keep-together" data-kind="preformatted"' + (blk.needsReview ? ' data-review="1"' : '') + '>' +
    dppTableTitleHtml_(title || blk.title) + parts.join('') + '</div>';
}

/**
 * Teacher-facing check of the whole curated vault. Run from the Apps Script
 * editor: returns every answer whose numbers do not tally or that fell back to
 * NEEDS_REVIEW, without generating any PDF.
 */
function runDppVaultValidation() {
  var report = [];
  [11, 12].forEach(function(cls) {
    getCuratedSubjectiveVault_(cls).forEach(function(v) {
      var blocks = v.mainAnswerJson ? expandSpecBlocks_(v.mainAnswerJson.blocks || v.mainAnswerJson) : analyzeAndStructureBlock_(v.modelAnswer || '', v.subject, null);
      var fails = validateBlocks_(blocks);
      var review = blocks.filter(function(b) { return b.needsReview; }).map(function(b) { return b.reviewReason; });
      if (fails.length || review.length || (v.reviewFlags && v.reviewFlags.length)) {
        report.push({ qid: v.qid, classLevel: cls, validation: fails, needsReview: review, reviewFlags: v.reviewFlags || [] });
      }
    });
  });
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

/**
 * Visual check on the real Drive converter. Run from the Apps Script editor.
 * Writes question + answer PDFs for every curated vault question into a PRIVATE
 * Drive folder "DPP Render Check" (no sharing, no Telegram, no Sheet writes) and
 * logs each file's link, page count and any accounting check that failed.
 */
function testDppRenderGallery() {
  var it = DriveApp.getFoldersByName('DPP Render Check');
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder('DPP Render Check');
  var stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd_HHmm');
  var lines = [];
  [11, 12].forEach(function(cls) {
    getCuratedSubjectiveVault_(cls).forEach(function(v) {
      var data = { classLevel: cls, subject: v.subject, chapter: v.chapterName, qid: v.qid, marks: v.marks,
        questionText: v.question, answerText: v.modelAnswer, marksBreakdown: v.rubric, commonMistakes: v.traps };
      [true, false].forEach(function(isAns) {
        var r = generateMultiPageDailyPracticeSheetHtml_(JSON.parse(JSON.stringify(data)), isAns);
        var name = stamp + '_' + v.qid + (isAns ? '_ANS' : '_Q');
        var pdf = Utilities.newBlob(r.html, 'text/html', name + '.html').getAs('application/pdf').setName(name + '.pdf');
        var file = folder.createFile(pdf);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        lines.push(name + '  pages=' + r.pageCount + (r.validation && r.validation.length ? '  CHECK=' + JSON.stringify(r.validation) : '') + '  ' + file.getUrl());
      });
    });
  });
  Logger.log(lines.join('\n'));
  return lines;
}
