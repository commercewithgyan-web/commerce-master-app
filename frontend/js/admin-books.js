/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — ADMIN BOOKS CONTROLLER (admin-books.js)
 * Founder Console: Real-time P&L, Balance Sheet Equation Verifier,
 * Begusarai Cash Drawer Counter, and Financial Ratios.
 * ═══════════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  // Initialize Telegram native back button
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function() {
        window.location.href = '../index.html';
      });
    } catch (e) {}
  }

  // Load Dashboard
  loadBooksData();

  // Add Expense Handler
  document.getElementById('btnSubmitExpense').addEventListener('click', async function() {
    var amount = document.getElementById('expAmount').value;
    var note = document.getElementById('expNote').value.trim();
    var category = document.getElementById('expCategory').value;
    var paidFrom = document.getElementById('expPaidFrom').value;

    if (!amount || !note) {
      alert('Please fill amount and description');
      return;
    }

    TG_APP.hapticMedium();
    try {
      await API_CLIENT.call('recordExpense', {
        amount: amount,
        note: note,
        category: category,
        paidFrom: paidFrom,
        mode: paidFrom === 'Cash' ? 'Cash' : 'UPI'
      });

      TG_APP.hapticSuccess();
      alert('✅ Expense saved successfully!');
      document.getElementById('expAmount').value = '';
      document.getElementById('expNote').value = '';
      loadBooksData();
    } catch (e) {
      alert('Error saving expense: ' + e.message);
    }
  });
});

async function loadBooksData() {
  try {
    var data = await API_CLIENT.call('getBooksDashboard');
    renderBooksData(data);
  } catch (err) {
    console.warn('Admin books fetch error (check admin rights):', err);
  }
}

function renderBooksData(data) {
  if (!data) return;

  // P&L
  if (data.pl) {
    document.getElementById('plMonthBadge').innerText = data.pl.monthLabel;
    document.getElementById('plMarginBadge').innerText = data.pl.marginPct + '% Margin';
    document.getElementById('plRevenue').innerText = '₹' + data.pl.totalRevenue.toLocaleString('en-IN');
    document.getElementById('plExpenses').innerText = '₹' + data.pl.totalExpenses.toLocaleString('en-IN');
    document.getElementById('plNetProfit').innerText = '₹' + data.pl.netProfit.toLocaleString('en-IN');
  }

  // Cash Drawer
  if (data.cashDrawer) {
    document.getElementById('drawerDate').innerText = data.cashDrawer.date;
    document.getElementById('drawerPhysicalCash').innerText = '₹' + data.cashDrawer.physicalCashToCount.toLocaleString('en-IN');
    document.getElementById('drawerMovement').innerText =
      'Inflow: +' + formatRupee(data.cashDrawer.cashInflowToday) +
      ' | Outflow: -' + formatRupee(data.cashDrawer.cashOutflowToday) +
      ' | Opening: ' + formatRupee(data.cashDrawer.openingCash);
  }

  // Balance Sheet
  if (data.balanceSheet) {
    var bs = data.balanceSheet;
    document.getElementById('bsTotalAssets').innerText = '₹' + bs.assets.totalAssets.toLocaleString('en-IN');
    document.getElementById('bsLiabilities').innerText = '₹' + bs.liabilities.total.toLocaleString('en-IN');
    document.getElementById('bsEquity').innerText = '₹' + bs.equity.totalEquity.toLocaleString('en-IN');
    document.getElementById('bsVariance').innerText = '₹' + bs.verification.variance;

    var badge = document.getElementById('bsEquationBadge');
    if (bs.verification.isBalanced) {
      badge.innerText = 'Assets = L + E ✅';
      badge.className = 'pill pill-green';
    } else {
      badge.innerText = 'Variance ₹' + bs.verification.variance + ' ⚠️';
      badge.className = 'pill pill-violet';
    }
  }

  // Ratios
  if (data.ratios) {
    var r = data.ratios;
    document.getElementById('ratioMargin').innerText = r.netProfitMargin + '%';
    document.getElementById('ratioOpex').innerText = r.opexRatio + '%';
    document.getElementById('ratioRunway').innerText = r.cashRunwayMonths + ' Months';
    document.getElementById('ratioCollection').innerText = r.collectionRate + '%';
    document.getElementById('ratioRevPerStudent').innerText = '₹' + r.revenuePerStudent.toLocaleString('en-IN');
  }
}

function formatRupee(num) {
  return '₹' + (parseFloat(num) || 0).toLocaleString('en-IN');
}
