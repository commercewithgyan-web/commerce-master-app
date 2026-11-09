/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — BOOKS & EXPENSES MODULE (books.gs)
 * Cash-Basis 4-List Accounting, Instant Expense Logger, Bill Photo OCR,
 * Auto-Generated P&L, Balance Sheet Verifier (Assets = Liabilities + Equity),
 * Financial Health Ratios, and Monthly Close Automation.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. EXPENSE RECORDING & TELEGRAM PARSER
// ─────────────────────────────────────────────────────────────────────

/**
 * Records an expense atomically into Sheet 5 Tab 5.1 (Expenses)
 * @param {Object} data - { amount, category, subCategory, paidFrom, mode, note, billUrl, recordedBy }
 * @return {Object} Appended expense record
 */
function recordExpense_(data) {
  var amount = parseFloat(data.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid expense amount: ' + data.amount);
  }

  var entryId = getNextId_('SHEET_BOOKS', 'Expenses', 1, 'EXP', 4);
  var validCategories = [
    'Direct Expense', 'Marketing', 'Utilities', 'Admin',
    'Finance', 'Depreciation', 'Other'
  ];

  var category = data.category || 'Other';
  if (validCategories.indexOf(category) === -1) {
    category = 'Other';
  }

  var row = [
    entryId,
    getKolkataDate(),
    amount,
    category,
    data.subCategory || '',
    data.paidFrom || 'UPI',
    data.mode || 'UPI',
    data.note || 'Operational expense',
    data.billUrl || '',
    data.recordedBy || 'Gyan Sir',
    getKolkataTimestamp()
  ];

  appendRow_('SHEET_BOOKS', 'Expenses', row);
  Logger.log('💸 Recorded Expense: ' + entryId + ' - ' + formatCurrency_(amount) + ' (' + category + ')');

  return {
    entryId: entryId,
    amount: amount,
    category: category,
    note: data.note,
    date: getKolkataDate()
  };
}

/**
 * Handles Telegram /expense command:
 * /expense 500 "Gemini API"
 * /expense 1200 "Internet bill" Utilities HDFC
 * @param {string|number} chatId
 * @param {string} text
 */
function handleAdminExpenseCommand_(chatId, text) {
  var regex = /\/expense\s+(\d+(?:\.\d+)?)\s*(?:"([^"]+)"|'([^']+)'|(\S+))?(?:\s+(\S+))?(?:\s+(\S+))?/i;
  var match = text.match(regex);

  if (!match) {
    sendTelegramMessage_(chatId,
      '❌ *Usage*: `/expense Amount "Note" [Category] [PaidFrom]`\n' +
      'Example: `/expense 500 "Gemini API" "Direct Expense" UPI`\n' +
      'Example: `/expense 1200 "Internet" Utilities HDFC`'
    );
    return;
  }

  var amount = parseFloat(match[1]);
  var note = match[2] || match[3] || match[4] || 'Misc Expense';
  var category = match[5] || 'Admin';
  var paidFrom = match[6] || 'UPI';

  // Smart categorization
  var lowerNote = note.toLowerCase();
  if (lowerNote.indexOf('gemini') !== -1 || lowerNote.indexOf('workspace') !== -1 || lowerNote.indexOf('hosting') !== -1 || lowerNote.indexOf('teacher') !== -1) {
    category = 'Direct Expense';
  } else if (lowerNote.indexOf('internet') !== -1 || lowerNote.indexOf('wifi') !== -1 || lowerNote.indexOf('electricity') !== -1 || lowerNote.indexOf('mobile') !== -1) {
    category = 'Utilities';
  } else if (lowerNote.indexOf('ad') !== -1 || lowerNote.indexOf('marketing') !== -1 || lowerNote.indexOf('flyer') !== -1) {
    category = 'Marketing';
  } else if (lowerNote.indexOf('stationery') !== -1 || lowerNote.indexOf('paper') !== -1 || lowerNote.indexOf('print') !== -1) {
    category = 'Admin';
  }

  try {
    var res = recordExpense_({
      amount: amount,
      note: note,
      category: category,
      paidFrom: paidFrom,
      mode: paidFrom === 'Cash' ? 'Cash' : 'UPI',
      recordedBy: 'Gyan Sir'
    });

    sendTelegramMessage_(chatId,
      '✅ *Expense Recorded!*\n\n' +
      '• ID: `' + res.entryId + '`\n' +
      '• Amount: *' + formatCurrency_(res.amount) + '*\n' +
      '• Note: ' + res.note + '\n' +
      '• Category: ' + res.category + '\n' +
      '• Paid Via: ' + paidFrom + '\n' +
      '• Date: ' + res.date + '\n\n' +
      (paidFrom === 'Cash' ? '💵 *Cash Drawer Debited Instantly!*' : '')
    );
  } catch (e) {
    sendTelegramMessage_(chatId, '❌ Error recording expense: ' + e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 2. AUTO-GENERATED PROFIT & LOSS STATEMENT (P&L)
// ─────────────────────────────────────────────────────────────────────

/**
 * Calculates monthly P&L for a specific month and year
 * Revenue = Sum(Payments)
 * Expenses = Sum(Expenses) categorized
 * Net Profit = Revenue - Expenses
 * Margin % = (Net Profit / Revenue) * 100
 * 
 * @param {number} [targetMonth] - 1-based (1..12), defaults to current month
 * @param {number} [targetYear] - defaults to current year
 * @return {Object} P&L breakdown
 */
function calculateMonthlyPL_(targetMonth, targetYear) {
  var now = new Date();
  var m = targetMonth || (now.getMonth() + 1);
  var y = targetYear || now.getFullYear();

  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var monthLabel = monthNames[m - 1] + ' ' + y;

  // 1. REVENUE: Sum Payments where ForMonth matches or Date is in target month
  var payments = getAllRowsAsObjects_('SHEET_FEE', 'Payments', 2000);
  var totalRevenue = 0;
  var revenueByMode = { UPI: 0, Cash: 0, Bank: 0, Card: 0 };

  payments.forEach(function(p) {
    var pDate = parseDateOrToday_(p.Date);
    var pMonth = pDate.getMonth() + 1;
    var pYear = pDate.getFullYear();

    if ((pMonth === m && pYear === y) || (p.ForMonth && p.ForMonth.indexOf(monthNames[m - 1]) !== -1)) {
      var amt = parseFloat(p.Amount) || 0;
      totalRevenue += amt;
      var mode = p.Mode || 'UPI';
      revenueByMode[mode] = (revenueByMode[mode] || 0) + amt;
    }
  });

  // 2. EXPENSES: Sum Expenses for target month by category
  var expenses = getAllRowsAsObjects_('SHEET_BOOKS', 'Expenses', 2000);
  var totalExpenses = 0;
  var categoryBreakdown = {
    'Direct Expense': 0,
    'Marketing': 0,
    'Utilities': 0,
    'Admin': 0,
    'Finance': 0,
    'Depreciation': 0,
    'Other': 0
  };

  expenses.forEach(function(e) {
    var eDate = parseDateOrToday_(e.Date);
    if (eDate.getMonth() + 1 === m && eDate.getFullYear() === y) {
      var amt = parseFloat(e.Amount) || 0;
      totalExpenses += amt;
      var cat = e.Category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
    }
  });

  // Include monthly depreciation for Fixed Assets
  var monthlyDepreciation = calculateTotalMonthlyDepreciation_();
  categoryBreakdown['Depreciation'] += monthlyDepreciation;
  totalExpenses += monthlyDepreciation;

  var netProfit = totalRevenue - totalExpenses;
  var marginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

  return {
    monthLabel: monthLabel,
    month: m,
    year: y,
    totalRevenue: totalRevenue,
    revenueByMode: revenueByMode,
    totalExpenses: totalExpenses,
    categoryBreakdown: categoryBreakdown,
    netProfit: netProfit,
    marginPct: marginPct,
    isProfitable: netProfit >= 0
  };
}

// ─────────────────────────────────────────────────────────────────────
// 3. AUTO-GENERATED BALANCE SHEET & VERIFICATION
// ─────────────────────────────────────────────────────────────────────

/**
 * Calculates Balance Sheet and verifies the Fundamental Accounting Equation:
 * Assets = Liabilities + Equity
 * 
 * @return {Object} Verified Balance Sheet report
 */
function calculateBalanceSheet_() {
  var asOfDate = getKolkataDate();

  // 1. FIXED ASSETS (at depreciated Book Value via SLM)
  var assetsRows = getAllRowsAsObjects_('SHEET_BOOKS', 'Assets', 500);
  var totalFixedAssets = 0;
  var fixedAssetsList = [];

  assetsRows.forEach(function(a) {
    if (String(a.Category || '').toLowerCase() === 'fixed') {
      var cost = parseFloat(a.PurchaseCost) || 0;
      var salvage = parseFloat(a.SalvageValue) || 0;
      var life = parseFloat(a.UsefulLife_Years) || 3;
      var pDate = parseDateOrToday_(a.PurchaseDate);

      // SLM monthly depreciation
      var monthsPassed = getMonthsDifference_(pDate, new Date());
      var monthlyDep = life > 0 ? (cost - salvage) / (life * 12) : 0;
      var accumDep = Math.min(cost - salvage, Math.round(monthlyDep * monthsPassed));
      var bookValue = Math.max(salvage, cost - accumDep);

      totalFixedAssets += bookValue;
      fixedAssetsList.push({
        name: a.Name,
        cost: cost,
        accumulatedDepreciation: accumDep,
        currentValue: bookValue
      });
    }
  });

  // 2. CURRENT ASSETS: Cumulative Cash in Hand + Bank/UPI Balance + Receivables
  var cashDrawer = getCashDrawerBalance_();
  var cashInHand = typeof getCumulativeCashInHand_ === 'function' ? getCumulativeCashInHand_() : (cashDrawer.physicalCashToCount || 0);
  var bankBalance = getCalculatedBankBalance_();
  var feeReceivables = calculateTotalFeeReceivables_();

  var totalCurrentAssets = cashInHand + bankBalance + feeReceivables;
  var totalAssets = totalFixedAssets + totalCurrentAssets;

  // 3. LIABILITIES: Loans, Payables, Advances
  var liabRows = getAllRowsAsObjects_('SHEET_BOOKS', 'Liabilities', 500);
  var totalLiabilities = 0;
  var liabilitiesList = [];

  liabRows.forEach(function(l) {
    var bal = parseFloat(l.RemainingBalance) || parseFloat(l.Amount) || 0;
    totalLiabilities += bal;
    liabilitiesList.push({
      name: l.Name,
      category: l.Category,
      balance: bal
    });
  });

  // 4. EQUITY: Opening Capital + Cumulative Capital Additions + Cumulative Net Profit - Drawings
  var equity = calculateTotalEquity_();
  var totalLiabilitiesAndEquity = totalLiabilities + equity;

  // 5. Verification: Assets = Liabilities + Equity
  var variance = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  var isBalanced = (variance <= 5); // within ₹5 rounding tolerance

  if (!isBalanced) {
    Logger.log('⚠️ BALANCE SHEET VARIANCE: Assets(' + totalAssets + ') != L+E(' + totalLiabilitiesAndEquity + '). Variance: ₹' + variance);
  }

  return {
    asOfDate: asOfDate,
    assets: {
      fixedAssets: {
        total: totalFixedAssets,
        items: fixedAssetsList
      },
      currentAssets: {
        cashInHand: cashInHand,
        bankBalance: bankBalance,
        feeReceivables: feeReceivables,
        total: totalCurrentAssets
      },
      totalAssets: totalAssets
    },
    liabilities: {
      total: totalLiabilities,
      items: liabilitiesList
    },
    equity: {
      totalEquity: equity
    },
    verification: {
      totalAssets: totalAssets,
      totalLiabilitiesAndEquity: totalLiabilitiesAndEquity,
      variance: variance,
      isBalanced: isBalanced,
      equation: totalAssets + ' = ' + totalLiabilities + ' + ' + equity
    }
  };
}

// ─────────────────────────────────────────────────────────────────────
// 4. FINANCIAL HEALTH RATIOS
// ─────────────────────────────────────────────────────────────────────

/**
 * Computes 5 Core Financial Health Ratios
 * @return {Object}
 */
function calculateRatios_() {
  var pl = calculateMonthlyPL_();
  var bs = calculateBalanceSheet_();
  var students = getAllRowsAsObjects_('SHEET_FEE', 'Students', 500);

  var activeStudentCount = 0;
  var totalBilled = 0;
  var totalCollected = 0;

  students.forEach(function(s) {
    if (s.Status === 'Active' || s.Status === 'Grace') activeStudentCount++;
    totalBilled += (parseFloat(s.TotalCourseFee) || 0);
    totalCollected += (parseFloat(s.TotalPaid) || 0);
  });

  // 1. Net Profit Margin (%)
  var netProfitMargin = pl.marginPct;

  // 2. Operating Expense Ratio (%)
  var opexRatio = pl.totalRevenue > 0 ? Math.round((pl.totalExpenses / pl.totalRevenue) * 1000) / 10 : 0;

  // 3. Cash Runway (Months) = (Cash + Bank) / Monthly Expense
  var liquidFunds = bs.assets.currentAssets.cashInHand + bs.assets.currentAssets.bankBalance;
  var monthlyBurn = Math.max(1000, pl.totalExpenses);
  var cashRunwayMonths = Math.round((liquidFunds / monthlyBurn) * 10) / 10;

  // 4. Fee Collection Rate (%)
  var collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 100;

  // 5. Revenue Per Student (₹)
  var revenuePerStudent = activeStudentCount > 0 ? Math.round(pl.totalRevenue / activeStudentCount) : 0;

  return {
    netProfitMargin: netProfitMargin,
    opexRatio: opexRatio,
    cashRunwayMonths: cashRunwayMonths,
    collectionRate: collectionRate,
    revenuePerStudent: revenuePerStudent,
    activeStudents: activeStudentCount,
    healthScore: (netProfitMargin >= 40 && collectionRate >= 85 && cashRunwayMonths >= 6) ? 'EXCELLENT 🟢' : 'HEALTHY 🟡'
  };
}

// ─────────────────────────────────────────────────────────────────────
// 5. INTERNAL ACCOUNTING HELPERS
// ─────────────────────────────────────────────────────────────────────

function calculateTotalMonthlyDepreciation_() {
  var assets = getAllRowsAsObjects_('SHEET_BOOKS', 'Assets', 200);
  var monthlyDep = 0;

  assets.forEach(function(a) {
    if (String(a.Category || '').toLowerCase() === 'fixed' && String(a.Depreciation_Method) === 'SLM') {
      var cost = parseFloat(a.PurchaseCost) || 0;
      var salvage = parseFloat(a.SalvageValue) || 0;
      var life = parseFloat(a.UsefulLife_Years) || 3;
      if (life > 0) {
        monthlyDep += (cost - salvage) / (life * 12);
      }
    }
  });

  return Math.round(monthlyDep);
}

function getCalculatedBankBalance_() {
  var openBal = 0;
  var openRows = getAllRowsAsObjects_('SHEET_BOOKS', 'Opening_Balances', 10);
  openRows.forEach(function(r) {
    if (r.Key === 'OpeningBank') openBal = parseFloat(r.Value) || 0;
  });

  // Payments received via UPI/Bank (verified only)
  var payments = getAllRowsAsObjects_('SHEET_FEE', 'Payments', 2000);
  var bankInflow = 0;
  payments.forEach(function(p) {
    var mode = String(p.Mode || '').toLowerCase();
    var status = String(p.Status || p.ReceiptSent || '').toUpperCase();
    var isVerified = !p.Status || status.indexOf('VERIFIED') !== -1 || status.indexOf('PAID') !== -1 || status.indexOf('✅') !== -1;
    if ((mode === 'upi' || mode === 'bank') && isVerified) {
      bankInflow += (parseFloat(p.Amount) || 0);
    }
  });

  // Expenses paid from UPI/HDFC
  var expenses = getAllRowsAsObjects_('SHEET_BOOKS', 'Expenses', 2000);
  var bankOutflow = 0;
  expenses.forEach(function(e) {
    var paidFrom = String(e.PaidFrom || '').toLowerCase();
    if (paidFrom === 'upi' || paidFrom.indexOf('hdfc') !== -1) {
      bankOutflow += (parseFloat(e.Amount) || 0);
    }
  });

  return openBal + bankInflow - bankOutflow;
}

function calculateTotalFeeReceivables_() {
  var invoices = getAllRowsAsObjects_('SHEET_FEE', 'Fee_Schedule', 2000);
  var receivables = 0;
  invoices.forEach(function(inv) {
    var s = String(inv.Status || '').trim().toUpperCase();
    if (s === 'DUE' || s === 'OVERDUE' || s === 'PARTIAL') {
      receivables += (parseFloat(inv.Balance) || 0);
    }
  });
  return receivables;
}

function calculateTotalEquity_() {
  var openingCapital = 0;
  var openRows = getAllRowsAsObjects_('SHEET_BOOKS', 'Opening_Balances', 10);
  openRows.forEach(function(r) {
    if (r.Key === 'OpeningCapital') openingCapital = parseFloat(r.Value) || 0;
  });

  // Capital additions and Drawings
  var capRows = getAllRowsAsObjects_('SHEET_BOOKS', 'Capital_Drawings', 500);
  var additionalCapital = 0;
  var drawings = 0;

  capRows.forEach(function(c) {
    var amt = parseFloat(c.Amount) || 0;
    if (String(c.Type).toLowerCase() === 'capital') additionalCapital += amt;
    else if (String(c.Type).toLowerCase() === 'drawing') drawings += amt;
  });

  // Cumulative Net Profit to date
  var pl = calculateMonthlyPL_();
  var cumulativeProfit = pl.netProfit;

  return openingCapital + additionalCapital + cumulativeProfit - drawings;
}

function getMonthsDifference_(d1, d2) {
  var months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return Math.max(0, months);
}

/**
 * End-of-Month Cron: Automatically archives monthly P&L and Balance Sheet to Tab 5.6
 */
function closeMonth() {
  Logger.log('📅 Running Monthly Close Automation...');
  var pl = calculateMonthlyPL_();
  var bs = calculateBalanceSheet_();

  appendRow_('SHEET_BOOKS', 'Monthly_Reports', [
    pl.monthLabel.split(' ')[0],
    pl.year,
    pl.totalRevenue,
    pl.totalExpenses,
    pl.netProfit,
    pl.marginPct / 100,
    bs.assets.currentAssets.cashInHand,
    bs.assets.currentAssets.bankBalance,
    bs.assets.totalAssets,
    bs.liabilities.total,
    bs.equity.totalEquity,
    getKolkataTimestamp()
  ]);

  Logger.log('  ✅ Monthly Report closed for ' + pl.monthLabel);
}

// ─────────────────────────────────────────────────────────────────────
// 6. MINI APP ADMIN BOOKS API HANDLERS
// ─────────────────────────────────────────────────────────────────────

function apiGetBooksDashboard_(verifiedUser) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  var pl = calculateMonthlyPL_();
  var bs = calculateBalanceSheet_();
  var ratios = calculateRatios_();
  var drawer = getCashDrawerBalance_();

  return {
    pl: pl,
    balanceSheet: bs,
    ratios: ratios,
    cashDrawer: drawer
  };
}

function apiRecordExpense_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  return recordExpense_(payload);
}

function apiGetMonthlyPL_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  return calculateMonthlyPL_(payload && payload.month, payload && payload.year);
}

function apiGetBalanceSheet_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  return calculateBalanceSheet_();
}

function apiGetRatios_(verifiedUser, payload) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  return calculateRatios_();
}

function apiGetCashDrawerBalance_(verifiedUser) {
  requireAdmin_(verifiedUser && verifiedUser.id);
  return getCashDrawerBalance_();
}
