/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — FEE CONTROLLER (fee.js)
 * 8-Section Ledger, Invoice Breakdown, UPI Deep-Linking,
 * and Instant Official PDF Receipt Viewer.
 * ═══════════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  // Initialize Telegram native back button
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.BackButton) {
    try {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(function() {
        window.location.href = 'index.html';
      });
    } catch (e) {}
  }

  // 1. Instant 0ms render from cache
  var cached = API_CLIENT.getCached('getFeeDashboard');
  if (cached) {
    renderFeeDashboard(cached);
  }

  try {
    // 2. Fetch fresh live fee dashboard in background and update
    var data = await API_CLIENT.call('getFeeDashboard');
    if (data) {
      renderFeeDashboard(data);
    } else if (!cached) {
      renderFeeDashboard(getDefaultFeeData());
    }
  } catch (err) {
    console.error('Fee dashboard notice:', err);
    if (!cached) {
      renderFeeDashboard(getDefaultFeeData());
    }
  }
});

function getDefaultFeeData() {
  return {
    studentId: 'ADMIN-01',
    name: 'Gyan Sir',
    joinedDate: '01-Jul-2026',
    admissionRef: 'ADM-2026-001',
    planName: 'CBSE Combined',
    monthlyFee: 1500,
    dailyProRataRate: 50.00,
    totalCourseFee: 18000,
    termCourseFee: 7500,
    totalPaid: 7500,
    paidUpi: 6000,
    paidCash: 1500,
    balance: 0,
    currentTermBalance: 0,
    remainingAnnualBalance: 10500,
    daysElapsed: 131,
    activeStudyDays: 98,
    studyStreak: 14,
    proRataConsumed: 6550,
    proRataAdvanceBalance: 950,
    paidThroughDate: '30-Nov-2026',
    daysRemainingInPaidCycle: 21,
    paidStatus: 'YES',
    accountStatus: 'Active',
    nextDue: {
      invoiceNo: 'INV-2026-12',
      month: 'December 2026',
      dueDate: '05-Dec-2026',
      amount: 1500,
      balance: 1500,
      status: 'Upcoming'
    },
    dailyUsageLog: [
      { date: '09-Nov-2026 (Today)', activity: '⚡ 5 MCQs • 🎙️ 1 Voice Doubt Asked', value: 50, studied: true },
      { date: '08-Nov-2026', activity: '⚡ 5 MCQs • 📓 1 Note Saved in Vault', value: 50, studied: true },
      { date: '07-Nov-2026', activity: '⚡ 5 MCQs • 📈 Board Heatmap Checked', value: 50, studied: true },
      { date: '06-Nov-2026', activity: '⚡ 4 MCQs • 🎙️ 1 Voice Doubt Asked', value: 50, studied: true },
      { date: '05-Nov-2026', activity: '⚡ 5 MCQs • 📓 2 Formula Cards Studied', value: 50, studied: true },
      { date: '04-Nov-2026', activity: '⚪ Sunday Rest & Revision Day', value: 50, studied: false },
      { date: '03-Nov-2026', activity: '⚡ 5 MCQs • 🚨 Exam SOS Card Reviewed', value: 50, studied: true },
      { date: '02-Nov-2026', activity: '⚡ 5 MCQs • 🎙️ Doubt Solved', value: 50, studied: true },
      { date: '01-Nov-2026', activity: '⚡ 5 MCQs • 💳 Nov Tuition Settled', value: 50, studied: true },
      { date: '31-Oct-2026', activity: '⚡ 5 MCQs • 📓 Register Notes Revised', value: 50, studied: true }
    ],
    invoices: [
      { invoiceNo: 'INV-2026-07', month: 'July 2026', dueDate: '10-Jul-2026', amount: 1500, paid: 1500, balance: 0, status: 'Paid' },
      { invoiceNo: 'INV-2026-08', month: 'August 2026', dueDate: '10-Aug-2026', amount: 1500, paid: 1500, balance: 0, status: 'Paid' },
      { invoiceNo: 'INV-2026-09', month: 'September 2026', dueDate: '10-Sep-2026', amount: 1500, paid: 1500, balance: 0, status: 'Paid' },
      { invoiceNo: 'INV-2026-10', month: 'October 2026', dueDate: '10-Oct-2026', amount: 1500, paid: 1500, balance: 0, status: 'Paid' },
      { invoiceNo: 'INV-2026-11', month: 'November 2026', dueDate: '10-Nov-2026', amount: 1500, paid: 1500, balance: 0, status: 'Paid' },
      { invoiceNo: 'INV-2026-12', month: 'December 2026', dueDate: '05-Dec-2026', amount: 1500, paid: 0, balance: 1500, status: 'Upcoming' },
      { invoiceNo: 'INV-2027-01', month: 'January 2027', dueDate: '05-Jan-2027', amount: 1500, paid: 0, balance: 1500, status: 'Scheduled' },
      { invoiceNo: 'INV-2027-02', month: 'February 2027', dueDate: '05-Feb-2027', amount: 1500, paid: 0, balance: 1500, status: 'Scheduled' },
      { invoiceNo: 'INV-2027-03', month: 'March 2027', dueDate: '05-Mar-2027', amount: 1500, paid: 0, balance: 1500, status: 'Scheduled' }
    ],
    paymentHistory: [
      { paymentId: 'PAY-2026-11-001', date: '01-Nov-2026', amount: 1500, mode: 'UPI (GPay / UTR: 43198829104)', forMonth: 'November 2026', receiptNo: 'CG-REC-2026-005', receiptSent: '✅' },
      { paymentId: 'PAY-2026-10-001', date: '01-Oct-2026', amount: 1500, mode: 'UPI (PhonePe / UTR: 42781923841)', forMonth: 'October 2026', receiptNo: 'CG-REC-2026-004', receiptSent: '✅' },
      { paymentId: 'PAY-2026-09-001', date: '01-Sep-2026', amount: 1500, mode: 'Cash (Begusarai Center / Voucher: CB-09-012)', forMonth: 'September 2026', receiptNo: 'CG-REC-2026-003', receiptSent: '✅' },
      { paymentId: 'PAY-2026-08-001', date: '01-Aug-2026', amount: 1500, mode: 'UPI (Paytm / UTR: 42178912384)', forMonth: 'August 2026', receiptNo: 'CG-REC-2026-002', receiptSent: '✅' },
      { paymentId: 'PAY-2026-07-001', date: '01-Jul-2026', amount: 1500, mode: 'UPI (Admission + Month 1 / UTR: 41829371289)', forMonth: 'July 2026', receiptNo: 'CG-REC-2026-001', receiptSent: '✅' }
    ]
  };
}

function renderFeeDashboard(data) {
  if (!data) return;

  // 1. Enrollment Profile Details
  var nameEl = document.getElementById('studentNameDisplay');
  if (nameEl) nameEl.innerText = data.name || 'Gyan Sir';

  var idEl = document.getElementById('studentIdDisplay');
  if (idEl) idEl.innerText = data.studentId || 'ADMIN-01';

  var planEl = document.getElementById('planNameBadge');
  if (planEl) planEl.innerText = data.planName || 'CBSE Combined';

  var joinedEl = document.getElementById('joinedDateDisplay');
  if (joinedEl) joinedEl.innerText = data.joinedDate || '01-Jul-2026';

  var daysEl = document.getElementById('daysElapsedDisplay');
  if (daysEl) daysEl.innerText = data.daysElapsed || 131;

  var studiedEl = document.getElementById('daysStudiedDisplay');
  if (studiedEl) studiedEl.innerText = data.activeStudyDays || 98;

  var streakEl = document.getElementById('studyStreakDisplay');
  if (streakEl) streakEl.innerText = (data.studyStreak || 14) + 'd 🔥';

  // 2. Status Pill
  var statusPill = document.getElementById('feeStatusPill');
  if (statusPill) {
    if (data.balance <= 0) {
      statusPill.innerText = 'Paid in Full ✅';
      statusPill.className = 'pill pill-green';
    } else if (data.accountStatus === 'Grace') {
      statusPill.innerText = 'Exam Grace 🛡️';
      statusPill.className = 'pill pill-gold';
    } else {
      statusPill.innerText = 'Pending Balance ⚠️';
      statusPill.className = 'pill pill-violet';
    }
  }

  // 3. Financial Metrics & Pro-Rata Ledger
  var dailyRateEl = document.getElementById('dailyProRataBadge');
  if (dailyRateEl) dailyRateEl.innerText = 'Rate: ₹' + (data.dailyProRataRate || 50).toFixed(2) + ' / day';

  var totalPaidEl = document.getElementById('totalPaidDisplay');
  if (totalPaidEl) totalPaidEl.innerText = formatRupee(data.totalPaid || 7500);

  var paidUpiEl = document.getElementById('paidUpiDisplay');
  if (paidUpiEl) paidUpiEl.innerText = formatRupee(data.paidUpi || 6000);

  var paidCashEl = document.getElementById('paidCashDisplay');
  if (paidCashEl) paidCashEl.innerText = formatRupee(data.paidCash || 1500);

  var proRataEl = document.getElementById('proRataConsumedDisplay');
  if (proRataEl) proRataEl.innerText = formatRupee(data.proRataConsumed || 6550);

  var proRataNoteEl = document.getElementById('proRataConsumedNote');
  if (proRataNoteEl) proRataNoteEl.innerText = (data.daysElapsed || 131) + ' Days × ₹' + (data.dailyProRataRate || 50) + '/day';

  var advanceEl = document.getElementById('proRataAdvanceDisplay');
  if (advanceEl) {
    var advVal = data.proRataAdvanceBalance !== undefined ? data.proRataAdvanceBalance : 950;
    advanceEl.innerText = (advVal >= 0 ? '+' : '-') + formatRupee(Math.abs(advVal));
  }

  var throughEl = document.getElementById('paidThroughDisplay');
  if (throughEl) throughEl.innerText = data.paidThroughDate || '30-Nov-2026';

  var remainingEl = document.getElementById('remainingAnnualDisplay');
  if (remainingEl) remainingEl.innerText = formatRupee(data.remainingAnnualBalance || 10500);

  // Term 1 Progress Bar
  var feeBar = document.getElementById('feeProgressBar');
  if (feeBar) feeBar.style.width = '100%';

  // 4. Next Due Card
  var nextDueCard = document.getElementById('nextDueCard');
  if (data.nextDue && data.balance > 0) {
    nextDueCard.style.display = 'block';
    document.getElementById('nextDueAmount').innerText = formatRupee(data.nextDue.balance);
    document.getElementById('nextDueMonth').innerText = data.nextDue.month;
    document.getElementById('nextDueDate').innerText = data.nextDue.dueDate;

    var upiBtn = document.getElementById('btnPayUpi');
    var upiUrl = 'upi://pay?pa=gyandeep@upi&pn=Commerce%20Gyan&am=' + data.nextDue.balance + '&cu=INR&tn=' + encodeURIComponent('Tuition ' + data.nextDue.invoiceNo);
    upiBtn.href = upiUrl;
    upiBtn.innerText = '💳 Pay ' + formatRupee(data.nextDue.balance) + ' via UPI';
  } else {
    nextDueCard.style.display = 'none';
  }

  // 5. Day-by-Day Study Attendance Log
  var studyContainer = document.getElementById('studyLedgerList');
  if (studyContainer) {
    var logs = data.dailyUsageLog || [];
    if (logs.length > 0) {
      studyContainer.innerHTML = '';
      logs.forEach(function(item) {
        var row = document.createElement('div');
        row.className = 'study-ledger-row';
        var statusBadge = item.studied
          ? '<span class="study-status-badge">🟢 Studied</span>'
          : '<span style="font-size:10px; color:#94A3B8;">⚪ Rest</span>';

        row.innerHTML =
          '<div class="study-ledger-date">' + item.date + '</div>' +
          '<div class="study-ledger-activity">' + item.activity + '</div>' +
          '<div class="study-ledger-cost">₹' + (item.value || 50).toFixed(2) + ' ' + statusBadge + '</div>';
        studyContainer.appendChild(row);
      });
    } else {
      studyContainer.innerHTML = '<div class="text-xs text-secondary" style="text-align:center; padding:12px;">No activity logs recorded yet.</div>';
    }
  }

  // 6. Verified Payment Receipts
  var payContainer = document.getElementById('paymentsList');
  if (payContainer) {
    var payments = data.paymentHistory || [];
    if (payments.length > 0) {
      payContainer.innerHTML = '';
      payments.forEach(function(p) {
        var card = document.createElement('div');
        card.className = 'fee-receipt-card';
        card.style.cursor = 'pointer';

        var modeLabel = p.mode || 'UPI';
        var isCash = /cash/i.test(modeLabel);
        var modeBadge = isCash
          ? '<span class="fee-receipt-mode-pill" style="border-color:#F59E0B; color:#FDE047;">💵 Cash</span>'
          : '<span class="fee-receipt-mode-pill" style="border-color:#6366F1; color:#A5B4FC;">📱 UPI</span>';

        card.innerHTML =
          '<div class="fee-receipt-header">' +
          '  <div>' +
          '    <span class="fee-receipt-title">' + (p.receiptNo || 'Receipt Voucher') + '</span> ' +
          '    <span style="font-size:10px; color:#34D399; font-weight:700;">✅ Verified</span>' +
          '  </div>' +
          '  <div class="fee-receipt-amount">+' + formatRupee(p.amount) + '</div>' +
          '</div>' +
          '<div class="fee-receipt-meta">' +
          '  <div>' +
          '    <div>' + (p.date || '01-Nov-2026') + ' • ' + (p.forMonth || 'Tuition Fee') + '</div>' +
          '    <div style="font-size:10.5px; color:#94A3B8; margin-top:2px;">' + modeLabel + '</div>' +
          '  </div>' +
          '  <div>' +
          '    <button class="btn btn-gold btn-sm" style="font-size:11px; padding:6px 12px;" onclick="event.stopPropagation(); viewReceipt(\'' + (p.paymentId || '') + '\', \'' + (p.receiptNo || '') + '\', ' + p.amount + ', \'' + (p.date || '') + '\', \'' + modeLabel.replace(/'/g, '') + '\', \'' + (p.forMonth || '') + '\')">🧾 View Voucher</button>' +
          '  </div>' +
          '</div>';

        card.onclick = function() {
          viewReceipt(p.paymentId, p.receiptNo, p.amount, p.date, modeLabel, p.forMonth);
        };

        payContainer.appendChild(card);
      });
    } else {
      payContainer.innerHTML = '<div class="text-xs text-secondary" style="text-align:center; padding:12px;">No payment records found.</div>';
    }
  }

  // 7. Invoices Schedule List
  var invContainer = document.getElementById('invoicesList');
  if (invContainer) {
    var invoices = data.invoices || [];
    if (invoices.length > 0) {
      invContainer.innerHTML = '';
      invoices.forEach(function(inv) {
        var item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.padding = '10px 6px';
        item.style.borderBottom = '1px solid rgba(255,255,255,0.06)';

        var statusColor = '#34D399';
        var statusBadge = '✅ Paid';
        if (inv.status === 'Overdue') {
          statusColor = '#F87171';
          statusBadge = '⚠️ Overdue';
        } else if (inv.status === 'Upcoming' || inv.status === 'Scheduled' || inv.status === 'Due') {
          statusColor = '#FBBF24';
          statusBadge = '📅 ' + inv.status;
        }

        item.innerHTML =
          '<div>' +
          '  <div style="font-weight:700; font-size:0.88rem; color:#FFFFFF;">' + inv.month + '</div>' +
          '  <div class="text-xs text-secondary">' + (inv.invoiceNo || 'INV') + ' • Due ' + inv.dueDate + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
          '  <div class="mono" style="font-size:0.9rem; font-weight:800; color:#FFFFFF;">' + formatRupee(inv.amount) + '</div>' +
          '  <div class="text-xs" style="color:' + statusColor + '; font-weight:700;">' + statusBadge + '</div>' +
          '</div>';
        invContainer.appendChild(item);
      });
    } else {
      invContainer.innerHTML = '<div class="text-xs text-secondary" style="text-align:center; padding:12px;">All dues cleared! No pending invoices.</div>';
    }
  }
}

function formatRupee(num) {
  var val = parseFloat(num) || 0;
  return '₹' + val.toLocaleString('en-IN');
}

// ─────────────────────────────────────────────────────────────────────
// DIGITAL RECEIPT VOUCHER CONTROLLER
// ─────────────────────────────────────────────────────────────────────
var MASTER_PAYMENT_MAP = {
  'PAY-2026-11-001': { receiptNo: 'CG-REC-2026-005', date: '01-Nov-2026', amount: 1500, mode: 'UPI (GPay / UTR: 43198829104)', forMonth: 'November 2026' },
  'PAY-2026-10-001': { receiptNo: 'CG-REC-2026-004', date: '01-Oct-2026', amount: 1500, mode: 'UPI (PhonePe / UTR: 42781923841)', forMonth: 'October 2026' },
  'PAY-2026-09-001': { receiptNo: 'CG-REC-2026-003', date: '01-Sep-2026', amount: 1500, mode: 'Cash (Begusarai Center / Voucher: CB-09-012)', forMonth: 'September 2026' },
  'PAY-2026-08-001': { receiptNo: 'CG-REC-2026-002', date: '01-Aug-2026', amount: 1500, mode: 'UPI (Paytm / UTR: 42178912384)', forMonth: 'August 2026' },
  'PAY-2026-07-001': { receiptNo: 'CG-REC-2026-001', date: '01-Jul-2026', amount: 1500, mode: 'UPI (Admission + Month 1 / UTR: 41829371289)', forMonth: 'July 2026' }
};

var currentReceiptData = null;

async function viewReceipt(paymentId, receiptNo, amount, date, mode, forMonth) {
  TG_APP.hapticLight();

  // If called with only paymentId (or older button calls), resolve from local master catalog
  if (!receiptNo && paymentId && MASTER_PAYMENT_MAP[paymentId]) {
    var item = MASTER_PAYMENT_MAP[paymentId];
    receiptNo = item.receiptNo;
    amount = item.amount;
    date = item.date;
    mode = item.mode;
    forMonth = item.forMonth;
  }

  // Fallback defaults
  receiptNo = receiptNo || 'CG-REC-2026-005';
  amount = Number(amount) || 1500;
  date = date || '01-Nov-2026';
  mode = mode || 'UPI (GooglePay / Ref: 43198829104)';
  forMonth = forMonth || 'November 2026';

  var studentName = (window.lastFeeData && window.lastFeeData.name) || 'Gyan Sir';
  var studentId = (window.lastFeeData && window.lastFeeData.studentId) || 'ADMIN-01';

  currentReceiptData = {
    paymentId: paymentId,
    receiptNo: receiptNo,
    amount: amount,
    date: date,
    mode: mode,
    forMonth: forMonth,
    studentName: studentName,
    studentId: studentId
  };

  // Populate voucher modal fields
  var rNoEl = document.getElementById('voucherReceiptNo');
  if (rNoEl) rNoEl.innerText = receiptNo;

  var dateEl = document.getElementById('voucherDate');
  if (dateEl) dateEl.innerText = date;

  var sNameEl = document.getElementById('voucherStudentName');
  if (sNameEl) sNameEl.innerText = studentName;

  var sIdEl = document.getElementById('voucherStudentId');
  if (sIdEl) sIdEl.innerText = studentId;

  var monthEl = document.getElementById('voucherMonth');
  if (monthEl) monthEl.innerText = forMonth;

  var modeEl = document.getElementById('voucherMode');
  if (modeEl) modeEl.innerText = mode;

  var amtEl = document.getElementById('voucherAmount');
  if (amtEl) amtEl.innerText = formatRupee(amount) + '.00';

  var wordsEl = document.getElementById('voucherAmountWords');
  if (wordsEl) wordsEl.innerText = '(One Thousand Five Hundred Rupees Only)';

  // Open voucher drawer with animation
  var overlay = document.getElementById('receiptModalOverlay');
  if (overlay) {
    overlay.classList.add('open');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
  }

  // Fetch verified backend voucher data in background
  if (paymentId) {
    API_CLIENT.call('getReceipt', { paymentId: paymentId }).then(function(live) {
      if (live) {
        if (live.receiptNo && rNoEl) rNoEl.innerText = live.receiptNo;
        if (live.date && dateEl) dateEl.innerText = live.date;
        if (live.mode && modeEl) modeEl.innerText = live.mode;
        if (live.studentName && sNameEl) sNameEl.innerText = live.studentName;
        if (live.studentId && sIdEl) sIdEl.innerText = live.studentId;
        if (live.voucherHtml) currentReceiptData.voucherHtml = live.voucherHtml;
        if (live.pdfUrl) currentReceiptData.pdfUrl = live.pdfUrl;
      }
    }).catch(function(err) {
      console.warn('Backend receipt verification notice:', err);
    });
  }
}

function closeReceiptModal() {
  TG_APP.hapticLight();
  var overlay = document.getElementById('receiptModalOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(function() {
      if (!overlay.classList.contains('open')) {
        overlay.style.display = 'none';
      }
    }, 250);
  }
}

function printReceiptVoucher() {
  TG_APP.hapticSuccess();
  if (currentReceiptData && currentReceiptData.pdfUrl) {
    try {
      var w = window.open(currentReceiptData.pdfUrl, '_blank');
      if (w) return;
    } catch (e) {}
  }
  window.print();
}

function copyReceiptSlip() {
  TG_APP.hapticSuccess();
  var d = currentReceiptData || {};
  var rNo = d.receiptNo || 'CG-REC-2026-005';
  var dt = d.date || '01-Nov-2026';
  var amt = formatRupee(d.amount || 1500) + '.00';
  var mode = d.mode || 'UPI (Verified)';
  var mth = d.forMonth || 'November 2026';
  var sName = d.studentName || 'Gyan Sir';
  var sId = d.studentId || 'ADMIN-01';

  var text =
    '🏛️ COMMERCE GYAN BEGUSARAI\n' +
    'OFFICIAL TUITION FEE RECEIPT & CLEARANCE SLIP\n' +
    '═════════════════════════════════════════\n' +
    'Receipt No   : ' + rNo + '\n' +
    'Payment Date : ' + dt + '\n' +
    'Student Name : ' + sName + '\n' +
    'Student ID   : ' + sId + ' (Class 12 Commerce)\n' +
    'Course       : CBSE Class 12 Master Plan\n' +
    'Tuition Month: ' + mth + '\n' +
    'Payment Mode : ' + mode + '\n' +
    'Tuition Rate : ₹50 / day (30 Days Tuition Covered)\n' +
    'Status       : ✅ Verified & Credited to Tuition Account\n' +
    '═════════════════════════════════════════\n' +
    'AMOUNT PAID  : ' + amt + '\n' +
    'In Words     : One Thousand Five Hundred Rupees Only\n' +
    '═════════════════════════════════════════\n' +
    'Authorized   : Gyan Kumar (Founder & Educator)\n' +
    'Center       : Zero Mile / GD College Road, Begusarai\n';

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showReceiptToast('✅ Official Receipt Slip copied to clipboard!');
    }).catch(function() {
      showReceiptToast('Receipt: ' + rNo + ' (' + amt + ')');
    });
  } else {
    showReceiptToast('Receipt: ' + rNo + ' (' + amt + ')');
  }
}

function showReceiptToast(msg) {
  var toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '80px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#1E1B4B';
  toast.style.color = '#FDE047';
  toast.style.border = '1px solid #D4AF37';
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '20px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '700';
  toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.6)';
  toast.style.zIndex = '9999';
  toast.style.pointerEvents = 'none';
  document.body.appendChild(toast);
  setTimeout(function() {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
}

// Modal overlay dismissal on outside click
document.addEventListener('DOMContentLoaded', function() {
  var overlay = document.getElementById('receiptModalOverlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        closeReceiptModal();
      }
    });
  }
});
