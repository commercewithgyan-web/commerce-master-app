/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — FEE CONTROLLER (fee.js)
 * 8-Section Ledger, Invoice Breakdown, UPI Deep-Linking,
 * and Instant Official PDF Receipt Viewer.
 * ═══════════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', async function() {
  TG_APP.hapticLight();

  try {
    var data = await API_CLIENT.call('getFeeDashboard');
    renderFeeDashboard(data);
  } catch (err) {
    console.error('Fee dashboard error:', err);
  }
});

function renderFeeDashboard(data) {
  if (!data) return;

  // Plan & Summary
  document.getElementById('planNameBadge').innerText = data.planName || 'CBSE Combined';
  document.getElementById('monthlyFeeBadge').innerText = formatRupee(data.monthlyFee) + '/mo';
  document.getElementById('totalCourseFeeDisplay').innerText = formatRupee(data.totalCourseFee);
  document.getElementById('totalPaidDisplay').innerText = formatRupee(data.totalPaid);
  document.getElementById('balanceDisplay').innerText = formatRupee(data.balance);

  // Status pill
  var statusPill = document.getElementById('feeStatusPill');
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

  // Progress Bar
  var pct = data.totalCourseFee > 0 ? Math.min(100, Math.round((data.totalPaid / data.totalCourseFee) * 100)) : 0;
  document.getElementById('feeProgressBar').style.width = pct + '%';

  // Next Due Card
  var nextDueCard = document.getElementById('nextDueCard');
  if (data.nextDue) {
    nextDueCard.style.display = 'block';
    document.getElementById('nextDueAmount').innerText = formatRupee(data.nextDue.balance);
    document.getElementById('nextDueMonth').innerText = data.nextDue.month;
    document.getElementById('nextDueDate').innerText = data.nextDue.dueDate;

    // UPI Link
    var upiBtn = document.getElementById('btnPayUpi');
    var upiUrl = 'upi://pay?pa=gyandeep@upi&pn=Commerce%20Gyan&am=' + data.nextDue.balance + '&cu=INR&tn=' + encodeURIComponent('Tuition ' + data.nextDue.invoiceNo);
    upiBtn.href = upiUrl;
    upiBtn.innerText = '💳 Pay ' + formatRupee(data.nextDue.balance) + ' via UPI';
  } else {
    nextDueCard.style.display = 'none';
  }

  // Invoices Schedule List
  var invContainer = document.getElementById('invoicesList');
  if (data.invoices && data.invoices.length > 0) {
    invContainer.innerHTML = '';
    data.invoices.forEach(function(inv) {
      var item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '8px 0';
      item.style.borderBottom = '1px solid #272B36';

      var statusColor = '#34D399';
      if (inv.status === 'Overdue') statusColor = '#F87171';
      else if (inv.status === 'Due' || inv.status === 'Pending') statusColor = '#FBBF24';

      item.innerHTML =
        '<div>' +
        '  <div style="font-weight:600; font-size:0.88rem;">' + inv.month + '</div>' +
        '  <div class="text-xs text-secondary">' + inv.invoiceNo + ' • Due ' + inv.dueDate + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
        '  <div class="mono" style="font-size:0.88rem; font-weight:700;">' + formatRupee(inv.amount) + '</div>' +
        '  <div class="text-xs" style="color:' + statusColor + ';">' + inv.status + '</div>' +
        '</div>';
      invContainer.appendChild(item);
    });
  }

  // Payments History List
  var payContainer = document.getElementById('paymentsList');
  if (data.paymentHistory && data.paymentHistory.length > 0) {
    payContainer.innerHTML = '';
    data.paymentHistory.forEach(function(p) {
      var item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '8px 0';
      item.style.borderBottom = '1px solid #272B36';

      item.innerHTML =
        '<div>' +
        '  <div class="text-emerald" style="font-weight:700; font-size:0.9rem;">+' + formatRupee(p.amount) + '</div>' +
        '  <div class="text-xs text-secondary">' + (p.date || 'Recent') + ' • ' + p.mode + ' (' + p.forMonth + ')</div>' +
        '</div>' +
        '<div>' +
        '  <button class="btn btn-outline btn-sm" onclick="viewReceipt(\'' + p.paymentId + '\')">🧾 Receipt</button>' +
        '</div>';
      payContainer.appendChild(item);
    });
  } else {
    payContainer.innerHTML = '<div class="text-xs text-secondary" style="text-align:center; padding:12px;">No payment records found.</div>';
  }
}

function formatRupee(num) {
  var val = parseFloat(num) || 0;
  return '₹' + val.toLocaleString('en-IN');
}

async function viewReceipt(paymentId) {
  TG_APP.hapticLight();
  try {
    var receipt = await API_CLIENT.call('getReceipt', { paymentId: paymentId });
    if (receipt && receipt.pdfUrl) {
      window.open(receipt.pdfUrl, '_blank');
    } else {
      alert('Receipt No: ' + receipt.receiptNo + '\nAmount: ₹' + receipt.amount);
    }
  } catch (e) {
    alert('Receipt generated. Contact Gyan Sir for physical copy.');
  }
}
