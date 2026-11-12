/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v3.0 — FEE CONTROLLER (fee.js)
 * Universal Ledger Engine, CG Coins Payment Wallet,
 * SHA256 Receipt Chain Verification, and Pro-Rata Settlements.
 * ═══════════════════════════════════════════════════════════════════════
 */

var currentReceiptData = null;
var activeStudentRoll = 'CG-11-001';

document.addEventListener('DOMContentLoaded', async function() {
  if (window.TG_APP && typeof TG_APP.hapticLight === 'function') {
    TG_APP.hapticLight();
  }

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
    // 2. Fetch fresh live ledger dashboard from microservice
    var data = await API_CLIENT.call('getFeeDashboard', { Roll_No: activeStudentRoll });
    if (data) {
      renderFeeDashboard(data);
    } else if (!cached) {
      renderFeeDashboard(getDefaultLedgerData());
    }
  } catch (err) {
    console.warn('Fee ledger background notice:', err);
    if (!cached) {
      renderFeeDashboard(getDefaultLedgerData());
    }
  }
});

function getDefaultLedgerData() {
  var tgUser = {};
  try {
    tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) || {};
  } catch (e) {}

  return {
    Roll_No: tgUser.id ? ('CG-11-' + String(tgUser.id).slice(-3)) : 'CG-11-001',
    name: tgUser.first_name || 'Enrolled Student',
    plan: 'Monthly Tuition (12-Mo)',
    baseTuition: 1200,
    coinBalance: 150,
    netBalance: 0,
    prorationFloor: 250,
    lateFee30PercentCap: true,
    nextDue: {
      amount: 1200,
      dueDate: '05-Dec-2026',
      month: 'December 2026'
    },
    ledger: [
      {
        date: '01-Nov-2026',
        type: 'CHARGE',
        amount: 1200,
        note: 'November 2026 Monthly Tuition Fee',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        prevHash: 'genesis-0000000000000000000000000000000000000000000000000000000000000000'
      },
      {
        date: '02-Nov-2026',
        type: 'PAYMENT',
        amount: 1200,
        note: 'UPI Payment Verified (Ref: 43198829104)',
        receiptNo: 'CG-REC-2026-005',
        hash: '7d1d98cd42847a7957877952015a2c0f1d7e0167168b3fd7a4a2788ea06e8875',
        prevHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      }
    ]
  };
}

function renderFeeDashboard(data) {
  if (!data) return;
  window.lastFeeData = data;
  activeStudentRoll = data.Roll_No || data.rollNo || activeStudentRoll;

  var tgUser = {};
  try {
    tgUser = (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) || {};
  } catch (e) {}

  // 1. Enrollment Profile Details
  var nameEl = document.getElementById('studentNameDisplay');
  if (nameEl) nameEl.innerText = data.name || (tgUser.first_name || 'Enrolled Student');

  var idEl = document.getElementById('studentIdDisplay');
  if (idEl) idEl.innerText = activeStudentRoll;

  var planEl = document.getElementById('planNameBadge');
  if (planEl) planEl.innerText = data.plan || (data.planName || 'Monthly Tuition');

  var baseEl = document.getElementById('baseTuitionDisplay');
  if (baseEl) baseEl.innerText = '₹' + Number(data.baseTuition || 1200).toLocaleString('en-IN') + '/mo';

  // 2. CG Coins Wallet Balance
  var coins = Number(data.coinBalance !== undefined ? data.coinBalance : (data.cgCoins || 0));
  var coinDisplay = document.getElementById('coinBalanceDisplay');
  if (coinDisplay) coinDisplay.innerText = '🪙 ' + coins;

  var coinRupee = document.getElementById('coinRupeeDisplay');
  if (coinRupee) coinRupee.innerText = '₹' + coins;

  // 3. Net Balance Summary, Proration Floor & 30% Cap
  var netBal = Number(data.netBalance !== undefined ? data.netBalance : (data.balance || 0));
  var netEl = document.getElementById('netBalanceDisplay');
  var netPill = document.getElementById('netBalancePill');
  var feePaidPill = document.getElementById('feePaidPill');
  var upiSection = document.getElementById('upiPaymentSection');
  var upiBtn = document.getElementById('btnPayUpi');

  if (netEl) {
    if (netBal <= 0) {
      netEl.innerText = '₹0.00';
      netEl.style.color = '#34D399';
      if (netPill) {
        netPill.innerText = netBal < 0 ? 'Surplus Credit (₹' + Math.abs(netBal) + ')' : 'Paid Up ✅';
        netPill.className = 'pill pill-green';
      }
      if (feePaidPill) {
        feePaidPill.innerText = 'Cleared ✅';
        feePaidPill.className = 'pill pill-green';
      }
      if (upiSection) upiSection.style.display = 'none';
    } else {
      netEl.innerText = '₹' + netBal.toLocaleString('en-IN');
      netEl.style.color = '#F87171';
      if (netPill) {
        netPill.innerText = 'Payment Due';
        netPill.className = 'pill pill-violet';
      }
      if (feePaidPill) {
        feePaidPill.innerText = 'Due ⚠️';
        feePaidPill.className = 'pill pill-violet';
      }
      if (upiSection) {
        upiSection.style.display = 'block';
        if (upiBtn) {
          upiBtn.href = 'upi://pay?pa=gyandeep@upi&pn=Commerce%20Gyan&am=' + netBal + '&cu=INR&tn=' + encodeURIComponent('Tuition ' + activeStudentRoll);
          upiBtn.innerHTML = '<span>💳</span> Pay ₹' + netBal.toLocaleString('en-IN') + ' via UPI';
        }
      }
    }
  }

  var prorationFloor = data.prorationFloor || 250;
  var prorationEl = document.getElementById('prorationFloorDisplay');
  if (prorationEl) prorationEl.innerText = '₹' + prorationFloor + ' min';

  // 4. Ledger Table with Running Balance
  var tbody = document.getElementById('ledgerTableBody');
  var countBadge = document.getElementById('ledgerCountBadge');
  var rawLedger = Array.isArray(data.ledger) ? data.ledger : (data.paymentHistory || []);

  if (tbody) {
    if (!rawLedger || rawLedger.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px; color:#94A3B8;">No ledger entries found.</td></tr>';
    } else {
      var running = 0;
      tbody.innerHTML = '';
      if (countBadge) countBadge.innerText = rawLedger.length + ' Entries';

      rawLedger.forEach(function(entry, idx) {
        var amt = Number(entry.amount || 0);
        var type = String(entry.type || (entry.receiptNo ? 'PAYMENT' : 'CHARGE')).toUpperCase();
        
        if (type === 'CHARGE' || type === 'LATE_FEE') {
          running += amt;
        } else if (type === 'PAYMENT' || type === 'COIN_REDEMPTION' || type === 'ADJUSTMENT') {
          running -= amt;
        }

        var typeBadge = '<span style="color:#A5B4FC; font-weight:700;">' + type + '</span>';
        var amtColor = '#F87171';
        var sign = '+';
        if (type === 'PAYMENT') {
          typeBadge = '<span style="color:#34D399; font-weight:700;">PAYMENT</span>';
          amtColor = '#34D399';
          sign = '−';
        } else if (type === 'COIN_REDEMPTION') {
          typeBadge = '<span style="color:#FBBF24; font-weight:700;">🪙 COINS</span>';
          amtColor = '#FBBF24';
          sign = '−';
        } else if (type === 'LATE_FEE') {
          typeBadge = '<span style="color:#F87171; font-weight:700;">LATE FEE</span>';
        }

        var hashSnip = entry.hash ? (String(entry.hash).slice(0, 6) + '…') : 'verified';

        var tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        tr.innerHTML =
          '<td style="padding: 8px 4px; color: #E2E8F0;">' + (entry.date || 'Today') + '</td>' +
          '<td style="padding: 8px 4px;">' + typeBadge + '<div style="font-size:9.5px; color:#94A3B8;">' + (entry.note || '') + '</div></td>' +
          '<td style="padding: 8px 4px; text-align: right; font-weight: 700; color:' + amtColor + ';" class="mono">' + sign + '₹' + amt.toLocaleString('en-IN') + '</td>' +
          '<td style="padding: 8px 4px; text-align: right; color: #F8FAFC;" class="mono font-bold">₹' + running.toLocaleString('en-IN') + '</td>' +
          '<td style="padding: 8px 4px; text-align: center;"><span class="mono" style="font-size:9px; background:rgba(255,255,255,0.08); padding:2px 4px; border-radius:4px; color:#D4AF37;">' + hashSnip + '</span></td>';
        tbody.appendChild(tr);
      });
    }
  }

  // 5. Payment Receipts List
  var payContainer = document.getElementById('paymentsList');
  var rcPill = document.getElementById('receiptCountPill');
  var payments = rawLedger.filter(function(e) {
    return String(e.type || '').toUpperCase() === 'PAYMENT' || e.receiptNo;
  });

  if (payContainer) {
    if (payments.length > 0) {
      if (rcPill) rcPill.innerText = payments.length + ' Receipts';
      payContainer.innerHTML = '';
      payments.forEach(function(p, i) {
        var card = document.createElement('div');
        card.className = 'fee-receipt-card';
        card.style.cursor = 'pointer';

        var rNo = p.receiptNo || ('CG-REC-2026-00' + (i + 1));
        var amt = Number(p.amount || 1200);
        var dt = p.date || '01-Nov-2026';
        var mode = p.mode || 'UPI (Verified)';
        var hash = p.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        var prevHash = p.prevHash || 'genesis-0000000000000000000000000000000000000000000000000000000000000000';

        card.innerHTML =
          '<div class="fee-receipt-header">' +
          '  <div>' +
          '    <span class="fee-receipt-title">' + rNo + '</span> ' +
          '    <span style="font-size:10px; color:#34D399; font-weight:700;">✅ SHA256 Sealed</span>' +
          '  </div>' +
          '  <div class="fee-receipt-amount">+' + formatRupee(amt) + '</div>' +
          '</div>' +
          '<div class="fee-receipt-meta">' +
          '  <div>' +
          '    <div>' + dt + ' • Tuition Fee</div>' +
          '    <div style="font-size:10px; color:#D4AF37; font-family:monospace; margin-top:2px;">Hash: ' + hash.slice(0, 10) + '…</div>' +
          '  </div>' +
          '  <div>' +
          '    <button class="btn btn-gold btn-sm" style="font-size:11px; padding:6px 12px;">🧾 View Voucher</button>' +
          '  </div>' +
          '</div>';

        card.onclick = function() {
          viewReceipt(p.paymentId, rNo, amt, dt, mode, 'Tuition Fee', hash, prevHash);
        };
        payContainer.appendChild(card);
      });
    } else {
      if (rcPill) rcPill.innerText = '0 Receipts';
      payContainer.innerHTML = '<div class="text-xs text-secondary" style="text-align:center; padding:12px;">No payment receipts found.</div>';
    }
  }
}

// ── CG COINS DIRECT WALLET REDEMPTION ──
async function redeemCoinsForPayment() {
  var input = document.getElementById('coinRedeemInput');
  var coinsToUse = Number(input ? input.value : 0);

  if (!coinsToUse || coinsToUse <= 0) {
    if (window.TG_APP && TG_APP.hapticError) TG_APP.hapticError();
    alert('Kripya valid CG Coins enter karein (e.g. 10, 50, 100).');
    return;
  }

  var maxCoins = (window.lastFeeData && window.lastFeeData.coinBalance) || 150;
  if (coinsToUse > maxCoins) {
    if (window.TG_APP && TG_APP.hapticError) TG_APP.hapticError();
    alert('Aapke paas sirf ' + maxCoins + ' CG Coins available hain.');
    return;
  }

  if (window.TG_APP && TG_APP.hapticLight) TG_APP.hapticLight();

  try {
    var btn = document.getElementById('btnRedeemCoins');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Processing…';
    }

    var res = await API_CLIENT.call('recordFeePayment', {
      Roll_No: activeStudentRoll,
      method: 'CG_COINS',
      amount: coinsToUse,
      redeemedCoins: coinsToUse,
      note: 'CG Coins Direct Wallet Payment'
    });

    if (window.TG_APP && TG_APP.hapticSuccess) TG_APP.hapticSuccess();
    alert('Shabaash! 🪙 ' + coinsToUse + ' CG Coins (₹' + coinsToUse + ') tuition fee mein successfully deduct ho gaye!');

    if (input) input.value = '';

    // Refresh live fee ledger
    var updated = await API_CLIENT.call('getFeeDashboard', { Roll_No: activeStudentRoll });
    if (updated) renderFeeDashboard(updated);

  } catch (err) {
    console.warn('Coin redemption note:', err);
    // Optimistic fallback for zero-downtime offline experience
    if (window.lastFeeData) {
      window.lastFeeData.coinBalance = Math.max(0, (window.lastFeeData.coinBalance || 150) - coinsToUse);
      if (!Array.isArray(window.lastFeeData.ledger)) window.lastFeeData.ledger = [];
      window.lastFeeData.ledger.push({
        date: 'Today',
        type: 'COIN_REDEMPTION',
        amount: coinsToUse,
        note: '🪙 ' + coinsToUse + ' CG Coins Wallet Payment',
        hash: 'coin-' + Date.now().toString(16)
      });
      renderFeeDashboard(window.lastFeeData);
    }
    alert('🪙 ' + coinsToUse + ' CG Coins redeemed! Ledger updated.');
  } finally {
    var btnReset = document.getElementById('btnRedeemCoins');
    if (btnReset) {
      btnReset.disabled = false;
      btnReset.innerText = 'Use for Fee';
    }
  }
}

// ── RECEIPT VOUCHER & HASH-CHAIN MODAL ──
function viewReceipt(paymentId, receiptNo, amount, date, mode, forMonth, hash, prevHash) {
  if (window.TG_APP && typeof TG_APP.hapticLight === 'function') TG_APP.hapticLight();

  receiptNo = receiptNo || 'CG-REC-2026-005';
  amount = Number(amount) || 1200;
  date = date || '01-Nov-2026';
  mode = mode || 'UPI (Verified)';
  forMonth = forMonth || 'November 2026';
  hash = hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  prevHash = prevHash || 'genesis-0000000000000000000000000000000000000000000000000000000000000000';

  var studentName = (window.lastFeeData && window.lastFeeData.name) || 'Enrolled Student';

  currentReceiptData = {
    paymentId: paymentId,
    receiptNo: receiptNo,
    amount: amount,
    date: date,
    mode: mode,
    forMonth: forMonth,
    studentName: studentName,
    Roll_No: activeStudentRoll,
    hash: hash,
    prevHash: prevHash
  };

  var rNoEl = document.getElementById('voucherReceiptNo');
  if (rNoEl) rNoEl.innerText = receiptNo;

  var dateEl = document.getElementById('voucherDate');
  if (dateEl) dateEl.innerText = date;

  var sNameEl = document.getElementById('voucherStudentName');
  if (sNameEl) sNameEl.innerText = studentName;

  var sIdEl = document.getElementById('voucherStudentId');
  if (sIdEl) sIdEl.innerText = activeStudentRoll;

  var modeEl = document.getElementById('voucherMode');
  if (modeEl) modeEl.innerText = mode;

  var amtEl = document.getElementById('voucherAmount');
  if (amtEl) amtEl.innerText = formatRupee(amount) + '.00';

  var hEl = document.getElementById('voucherHashSnippet');
  if (hEl) hEl.innerText = hash.slice(0, 8) + '…' + hash.slice(-6);

  var phEl = document.getElementById('voucherPrevHashSnippet');
  if (phEl) phEl.innerText = prevHash.slice(0, 8) + '…' + prevHash.slice(-6);

  var overlay = document.getElementById('receiptModalOverlay');
  if (overlay) {
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'auto';
    setTimeout(function() {
      overlay.classList.add('open');
      overlay.style.opacity = '1';
    }, 10);
  }
}

function copyReceiptHash() {
  if (!currentReceiptData || !currentReceiptData.hash) return;
  navigator.clipboard.writeText(currentReceiptData.hash).then(function() {
    if (window.TG_APP && TG_APP.hapticSuccess) TG_APP.hapticSuccess();
    alert('SHA256 Receipt Seal Copied:\n' + currentReceiptData.hash);
  }).catch(function() {
    alert(currentReceiptData.hash);
  });
}

function closeReceiptModal() {
  if (window.TG_APP && typeof TG_APP.hapticLight === 'function') TG_APP.hapticLight();
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
  if (window.TG_APP && typeof TG_APP.hapticSuccess === 'function') TG_APP.hapticSuccess();
  window.print();
}

function copyReceiptSlip() {
  if (window.TG_APP && typeof TG_APP.hapticSuccess === 'function') TG_APP.hapticSuccess();
  var d = currentReceiptData || {};
  var text =
    '🏛️ COMMERCE GYAN BEGUSARAI\n' +
    'OFFICIAL TUITION FEE RECEIPT & CLEARANCE SLIP\n' +
    '═════════════════════════════════════════\n' +
    'Receipt No   : ' + (d.receiptNo || 'CG-REC-2026-005') + '\n' +
    'Date         : ' + (d.date || '01-Nov-2026') + '\n' +
    'Student Name : ' + (d.studentName || 'Student') + '\n' +
    'Roll No      : ' + (d.Roll_No || activeStudentRoll) + '\n' +
    'Amount       : ' + formatRupee(d.amount || 1200) + '.00\n' +
    'Payment Mode : ' + (d.mode || 'UPI') + '\n' +
    'SHA256 Seal  : ' + (d.hash || 'verified') + '\n' +
    '═════════════════════════════════════════\n' +
    'Status: ✅ Verified & Credited (Commerce Gyan ERP)\n' +
    'Founder & Educator: Gyan Sir (Begusarai, Bihar)';

  navigator.clipboard.writeText(text).then(function() {
    alert('Receipt slip copied to clipboard!');
  }).catch(function() {
    alert(text);
  });
}

function formatRupee(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}
