/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMMERCE MASTER APP v2.3 — FEE MANAGEMENT MODULE (fees.gs)
 * Student Onboarding, Dynamic Board-Exam Month Capping, Pro-Rata Engine,
 * 12-Month Invoicing, Payment Reconciliation, Physical Cash Drawer Counter,
 * Instant PDF Receipts, and 5-Stage Reminder Automations.
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 1. PRO-RATA & BOARD-EXAM SESSION ALIGNMENT FORMULAS
// ─────────────────────────────────────────────────────────────────────

/**
 * Calculates pro-rata first month fee based on joining date
 * Formula: MonthlyFee * (DaysRemainingInMonth / TotalDaysInMonth)
 * @param {number} monthlyFee
 * @param {Date|string} joinDateInput
 * @return {number} Rounded to nearest ₹1
 */
function calculateProRata_(monthlyFee, joinDateInput) {
  var d = parseDateOrToday_(joinDateInput);
  var year = d.getFullYear();
  var month = d.getMonth(); // 0-based

  // Total days in joining month
  var totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  // Days remaining including joining day
  var daysRemaining = totalDaysInMonth - d.getDate() + 1;

  if (daysRemaining <= 0) daysRemaining = 1;
  if (daysRemaining >= totalDaysInMonth) return Math.round(monthlyFee);

  var prorated = (monthlyFee * daysRemaining) / totalDaysInMonth;
  return Math.round(prorated);
}

/**
 * Calculates academic session end date based on CBSE Class rules:
 * - Class 12: March 31 (Board exam completion)
 * - Class 11: February 28/29 (Final exams)
 * @param {number|string} classLevel - 11 or 12
 * @param {Date|string} joinDateInput
 * @return {Date} Course end date
 */
function calculateCourseEndDate_(classLevel, joinDateInput) {
  var d = parseDateOrToday_(joinDateInput);
  var joinYear = d.getFullYear();
  var joinMonth = d.getMonth() + 1; // 1-based (1..12)
  var isClass12 = parseInt(classLevel, 10) === 12;

  var targetYear = joinYear;
  if (isClass12) {
    // If joined April to December (months 4-12), end date is March 31 of next year
    if (joinMonth > 3) {
      targetYear = joinYear + 1;
    }
    return new Date(targetYear, 2, 31); // Month 2 is March (0-based)
  } else {
    // Class 11: concludes February 28
    if (joinMonth > 2) {
      targetYear = joinYear + 1;
    }
    return new Date(targetYear, 1, 28); // Month 1 is February
  }
}

/**
 * Calculates duration in months from join date to course end date (max 12)
 * @param {Date} joinDate
 * @param {Date} endDate
 * @return {number}
 */
function calculateDurationMonths_(joinDate, endDate) {
  var months = (endDate.getFullYear() - joinDate.getFullYear()) * 12 +
               (endDate.getMonth() - joinDate.getMonth()) + 1;
  return Math.max(1, Math.min(12, months));
}

// ─────────────────────────────────────────────────────────────────────
// 2. STUDENT REGISTRATION & INVOICE GENERATOR
// ─────────────────────────────────────────────────────────────────────

/**
 * Registers a new student and atomically creates their 12-month schedule
 * @param {Object} data - { name, classLevel, phone, telegramId, planId, joinDate, discountAmount, discountNote }
 * @return {Object} Registered student record with first invoice details
 */
function registerStudent_(data) {
  return withLock_('registerStudent_' + data.telegramId, 30000, function() {
    var sheet = getSheet_('SHEET_FEE', 'Students');

    // Check if telegramId already exists
    if (data.telegramId) {
      var existing = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(data.telegramId));
      if (existing) {
        throw new Error('Student with Telegram ID ' + data.telegramId + ' already registered (' + existing.StudentID + ')');
      }
    }

    // Next Student ID (e.g. S001)
    var studentId = getNextId_('SHEET_FEE', 'Students', 1, 'S', 3);

    // Fetch Plan info
    var plan = findRow_('SHEET_FEE', 'Plans', 'PlanID', data.planId);
    if (!plan) {
      throw new Error('PlanID "' + data.planId + '" not found in Plans tab');
    }

    var monthlyFee = parseFloat(plan.MonthlyFee) || 1500;
    var joinDate = parseDateOrToday_(data.joinDate);
    var classLevel = parseInt(data.classLevel, 10) || 12;

    // Academic session calculations
    var firstMonthFee = calculateProRata_(monthlyFee, joinDate);
    var courseEndDate = calculateCourseEndDate_(classLevel, joinDate);
    var durationMonths = calculateDurationMonths_(joinDate, courseEndDate);
    var discount = parseFloat(data.discountAmount) || 0;
    var totalCourseFee = firstMonthFee + ((durationMonths - 1) * monthlyFee) - discount;

    var newStudentRow = [
      studentId,
      data.name,
      classLevel,
      'CBSE',
      data.phone || '',
      String(data.telegramId || ''),
      data.planId,
      plan.PlanName,
      monthlyFee,
      getKolkataDate(joinDate),
      firstMonthFee,
      discount,
      data.discountNote || '',
      getKolkataDate(courseEndDate),
      durationMonths,
      totalCourseFee,
      0, // TotalPaid
      totalCourseFee, // Balance
      '❌', // Paid
      'Active', // Status
      data.notes || 'Registered via Admin'
    ];

    sheet.appendRow(newStudentRow);
    Logger.log('✅ Registered Student: ' + studentId + ' - ' + data.name);

    // Generate dynamic schedule invoices up to course end month
    var invoices = generateStudentInvoices_(studentId, data.name, joinDate, durationMonths, monthlyFee, firstMonthFee);

    // Send Welcome Telegram Message if telegramId provided
    if (data.telegramId) {
      sendStudentWelcomeMessage_(data.telegramId, data.name, studentId, plan.PlanName, firstMonthFee, invoices[0]);
    }

    return {
      studentId: studentId,
      name: data.name,
      planName: plan.PlanName,
      monthlyFee: monthlyFee,
      firstMonthFee: firstMonthFee,
      durationMonths: durationMonths,
      totalCourseFee: totalCourseFee,
      firstInvoice: invoices[0]
    };
  });
}

/**
 * Generates dynamic invoice rows in Fee_Schedule up to course duration
 * @param {string} studentId
 * @param {string} studentName
 * @param {Date} joinDate
 * @param {number} durationMonths
 * @param {number} monthlyFee
 * @param {number} firstMonthFee
 * @return {Object[]} Array of generated invoice objects
 */
function generateStudentInvoices_(studentId, studentName, joinDate, durationMonths, monthlyFee, firstMonthFee) {
  var scheduleSheet = getSheet_('SHEET_FEE', 'Fee_Schedule');
  var invoices = [];
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (var i = 0; i < durationMonths; i++) {
    var invDate = new Date(joinDate.getFullYear(), joinDate.getMonth() + i, 1);
    var monthLabel = monthNames[invDate.getMonth()] + ' ' + invDate.getFullYear();
    var invoiceNo = 'INV-' + studentId + '-' + (i + 1 < 10 ? '0' : '') + (i + 1);

    // Invoice 1 is pro-rated; subsequent invoices are full monthlyFee
    var invAmount = (i === 0) ? firstMonthFee : monthlyFee;

    // Due Date: 5th of that month (or joinDate + 2 days for month 1 if joined after the 5th)
    var dueDate = new Date(invDate.getFullYear(), invDate.getMonth(), 5);
    if (i === 0 && joinDate.getDate() > 5) {
      dueDate = new Date(joinDate.getTime() + (2 * 24 * 60 * 60 * 1000));
    }

    var row = [
      invoiceNo,
      studentId,
      studentName,
      monthLabel,
      getKolkataDate(dueDate),
      invAmount,
      0, // Paid
      invAmount, // Balance
      'Pending' // Status
    ];

    scheduleSheet.appendRow(row);
    invoices.push({
      invoiceNo: invoiceNo,
      month: monthLabel,
      dueDate: getKolkataDate(dueDate),
      amount: invAmount
    });
  }

  Logger.log('  🧾 Generated ' + durationMonths + ' invoices for ' + studentId);
  return invoices;
}

// ─────────────────────────────────────────────────────────────────────
// 3. PAYMENT RECORDING & INSTANT PDF RECEIPTS
// ─────────────────────────────────────────────────────────────────────

/**
 * Records a payment against student's outstanding invoices,
 * updates Students & Fee_Schedule tabs atomically, and delivers an instant PDF receipt.
 * 
 * If Mode is 'Cash', atomically credits the physical cash drawer.
 * 
 * @param {Object} paymentData
 *        { studentId, amount, mode, forMonth, upiRef, note, recordedBy }
 * @return {Object} Receipt and payment summary
 */
function recordPayment_(paymentData) {
  return withLock_('recordPayment_' + paymentData.studentId, 30000, function() {
    var student = findRow_('SHEET_FEE', 'Students', 'StudentID', paymentData.studentId);
    if (!student) {
      throw new Error('Student "' + paymentData.studentId + '" not found');
    }

    var amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid payment amount: ' + paymentData.amount);
    }

    var mode = (paymentData.mode || 'UPI').trim();
    var forMonth = paymentData.forMonth || '';
    var paymentId = getNextId_('SHEET_FEE', 'Payments', 1, 'PAY', 4);
    var receiptNo = 'CG-REC-' + Utilities.formatDate(new Date(), TIMEZONE_KOLKATA, 'yyyyMM') + '-' + paymentId.replace('PAY-', '');

    // 1. Match payment against Fee_Schedule invoice(s)
    var matchedInvoice = matchAndUpdateInvoice_(paymentData.studentId, amount, forMonth);

    // 2. Append to Payments Tab
    var paymentsSheet = getSheet_('SHEET_FEE', 'Payments');
    var paymentRow = [
      paymentId,
      getKolkataDate(),
      student.StudentID,
      amount,
      student.Name,
      mode,
      paymentData.upiRef || (mode === 'Cash' ? 'OFFLINE_CASH' : 'DIRECT_TRANSFER'),
      matchedInvoice ? matchedInvoice.month : forMonth,
      matchedInvoice ? matchedInvoice.invoiceNo : 'DIRECT',
      paymentData.note || 'Tuition fee',
      receiptNo,
      '❌', // ReceiptSent (updated to ✅ after dispatch)
      paymentData.recordedBy || 'Gyan Sir',
      getKolkataTimestamp()
    ];
    paymentsSheet.appendRow(paymentRow);
    var paymentRowNum = paymentsSheet.getLastRow();

    // 3. Recalculate Student TotalPaid & Balance
    recalculateStudentFeeBalance_(student.StudentID);

    // 4. Generate Official PDF Receipt
    var receiptResult = generateReceiptPdf_({
      receiptNo: receiptNo,
      date: getKolkataDate(),
      studentId: student.StudentID,
      studentName: student.Name,
      classLevel: student.Class,
      planName: student.PlanName,
      forMonth: matchedInvoice ? matchedInvoice.month : forMonth,
      amount: amount,
      mode: mode,
      upiRef: paymentData.upiRef || (mode === 'Cash' ? 'OFFLINE_CASH' : 'DIRECT'),
      invoiceNo: matchedInvoice ? matchedInvoice.invoiceNo : 'DIRECT',
      balance: getUpdatedStudentBalance_(student.StudentID),
      status: 'SUCCESS'
    });

    // 5. Deliver PDF to Student's Telegram DM
    var sentToTelegram = false;
    if (student.TelegramID) {
      try {
        sendTelegramDocument_(
          student.TelegramID,
          receiptResult.pdfBlob,
          'Receipt_' + receiptNo + '.pdf',
          '🧾 *Official Fee Receipt — Commerce Gyan*\n\n' +
          'Dear ' + student.Name + ', thank you for your payment of ' + formatCurrency_(amount) +
          ' (' + mode + '). Your official receipt is attached below.'
        );
        sentToTelegram = true;
        // Mark ReceiptSent = ✅ in Payments tab
        updateCell_('SHEET_FEE', 'Payments', paymentRowNum, 12, '✅');
      } catch (tgErr) {
        logError_('recordPayment_TelegramSend', tgErr);
      }
    }

    // 6. Log to Receipts tab
    appendRow_('SHEET_FEE', 'Receipts', [
      receiptNo,
      getKolkataDate(),
      student.StudentID,
      paymentId,
      amount,
      matchedInvoice ? matchedInvoice.invoiceNo : 'DIRECT',
      receiptResult.driveUrl,
      student.TelegramID || 'No Telegram ID'
    ]);

    Logger.log('✅ Payment Recorded: ' + paymentId + ' (' + formatCurrency_(amount) + ' by ' + student.Name + ')');

    return {
      success: true,
      paymentId: paymentId,
      receiptNo: receiptNo,
      receiptUrl: receiptResult.driveUrl,
      sentToTelegram: sentToTelegram,
      matchedInvoice: matchedInvoice ? matchedInvoice.invoiceNo : null
    };
  });
}

/**
 * Matches an incoming payment to an invoice and updates its Paid, Balance, and Status fields
 * @param {string} studentId
 * @param {number} amount
 * @param {string} [forMonth]
 * @return {Object|null}
 */
function matchAndUpdateInvoice_(studentId, amount, forMonth) {
  var scheduleSheet = getSheet_('SHEET_FEE', 'Fee_Schedule');
  var invoices = findRows_('SHEET_FEE', 'Fee_Schedule', 'StudentID', studentId);
  if (!invoices || invoices.length === 0) return null;

  var targetInv = null;

  // If specific month specified, try to find that invoice
  if (forMonth) {
    for (var i = 0; i < invoices.length; i++) {
      if (String(invoices[i].Month).toLowerCase().indexOf(forMonth.toLowerCase()) !== -1) {
        targetInv = invoices[i];
        break;
      }
    }
  }

  // Otherwise, select the earliest unpaid or partially paid invoice
  if (!targetInv) {
    for (var j = 0; j < invoices.length; j++) {
      var s = String(invoices[j].Status || '').toLowerCase();
      if (s === 'pending' || s === 'due' || s === 'overdue' || s === 'partial') {
        targetInv = invoices[j];
        break;
      }
    }
  }

  if (!targetInv) {
    targetInv = invoices[invoices.length - 1]; // Fallback to last invoice
  }

  var rowNum = targetInv._rowNumber;
  var invAmount = parseFloat(targetInv.Amount) || 0;
  var currentPaid = parseFloat(targetInv.Paid) || 0;
  var newPaid = currentPaid + amount;
  var newBalance = invAmount - newPaid;

  var newStatus = 'Pending';
  if (newBalance <= 0) {
    newStatus = 'Paid';
  } else if (newPaid > 0) {
    newStatus = 'Partial';
  }

  updateCell_('SHEET_FEE', 'Fee_Schedule', rowNum, 7, newPaid); // Paid
  updateCell_('SHEET_FEE', 'Fee_Schedule', rowNum, 8, newBalance); // Balance
  updateCell_('SHEET_FEE', 'Fee_Schedule', rowNum, 9, newStatus); // Status

  return {
    invoiceNo: targetInv.InvoiceNo,
    month: targetInv.Month,
    status: newStatus,
    balance: newBalance
  };
}

/**
 * Re-sums payments for a student and updates TotalPaid, Balance, and Paid flag
 * @param {string} studentId
 */
function recalculateStudentFeeBalance_(studentId) {
  var student = findRow_('SHEET_FEE', 'Students', 'StudentID', studentId);
  if (!student) return;

  var payments = findRows_('SHEET_FEE', 'Payments', 'StudentID', studentId);
  var totalPaid = 0;
  for (var i = 0; i < payments.length; i++) {
    totalPaid += (parseFloat(payments[i].Amount) || 0);
  }

  var totalCourseFee = parseFloat(student.TotalCourseFee) || 0;
  var remainingBalance = totalCourseFee - totalPaid;
  var isPaidInFull = remainingBalance <= 0;

  var rowNum = student._rowNumber;
  updateCell_('SHEET_FEE', 'Students', rowNum, 17, totalPaid); // TotalPaid (col Q)
  updateCell_('SHEET_FEE', 'Students', rowNum, 18, remainingBalance); // Balance (col R)
  updateCell_('SHEET_FEE', 'Students', rowNum, 19, isPaidInFull ? '✅' : '❌'); // Paid (col S)
}

/**
 * Gets updated balance for a student
 * @param {string} studentId
 * @return {number}
 */
function getUpdatedStudentBalance_(studentId) {
  var student = findRow_('SHEET_FEE', 'Students', 'StudentID', studentId);
  return student ? parseFloat(student.Balance) || 0 : 0;
}

// ─────────────────────────────────────────────────────────────────────
// 4. INSTANT PDF RECEIPT GENERATOR (Blob Engine)
// ─────────────────────────────────────────────────────────────────────

/**
 * Generates an official PDF receipt from the Google Doc template,
 * stores it in Google Drive, and returns both the URL and binary PDF Blob.
 * 
 * Never sends raw Google Drive HTML links to Telegram (Law C-5).
 * 
 * @param {Object} data - Field substitutions
 * @return {{ driveUrl: string, pdfBlob: GoogleAppsScript.Base.Blob }}
 */
function generateReceiptPdf_(data) {
  var props = PropertiesService.getScriptProperties();
  var templateId = props.getProperty('DOC_RECEIPT_TEMPLATE_ID');
  if (!templateId) {
    throw new Error('CONFIG_ERROR: DOC_RECEIPT_TEMPLATE_ID not configured');
  }

  // Ensure Receipts folder exists
  var folderName = 'Commerce Master App Receipts';
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  // Make a temporary copy of the template
  var templateFile = DriveApp.getFileById(templateId);
  var tempFile = templateFile.makeCopy('Receipt_' + data.receiptNo + '_TEMP', folder);
  var tempDoc = DocumentApp.openById(tempFile.getId());
  var body = tempDoc.getBody();

  // Replace placeholders
  body.replaceText('\\{\\{RECEIPT_NO\\}\\}', data.receiptNo);
  body.replaceText('\\{\\{DATE\\}\\}', data.date);
  body.replaceText('\\{\\{STUDENT_ID\\}\\}', data.studentId);
  body.replaceText('\\{\\{STUDENT_NAME\\}\\}', data.studentName);
  body.replaceText('\\{\\{CLASS\\}\\}', String(data.classLevel));
  body.replaceText('\\{\\{PLAN_NAME\\}\\}', data.planName || 'CBSE Combined');
  body.replaceText('\\{\\{FOR_MONTH\\}\\}', data.forMonth || 'Current');
  body.replaceText('\\{\\{AMOUNT\\}\\}', formatCurrency_(data.amount).replace('₹', ''));
  body.replaceText('\\{\\{MODE\\}\\}', data.mode);
  body.replaceText('\\{\\{UPI_REF\\}\\}', data.upiRef || 'N/A');
  body.replaceText('\\{\\{INVOICE_NO\\}\\}', data.invoiceNo || 'N/A');
  body.replaceText('\\{\\{BALANCE\\}\\}', formatCurrency_(data.balance).replace('₹', ''));
  body.replaceText('\\{\\{STATUS\\}\\}', data.status || 'PAID');

  tempDoc.saveAndClose();

  // Convert to PDF Blob
  var pdfBlob = tempFile.getAs('application/pdf');
  pdfBlob.setName('Receipt_' + data.receiptNo + '.pdf');

  // Create permanent PDF file in Drive
  var pdfFile = folder.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Remove temporary doc
  tempFile.setTrashed(true);

  return {
    driveUrl: pdfFile.getUrl(),
    pdfBlob: pdfBlob
  };
}

// ─────────────────────────────────────────────────────────────────────
// 5. PHYSICAL CASH DRAWER COUNTER (/cash)
// ─────────────────────────────────────────────────────────────────────

/**
 * Reconciles the offline physical cash drawer for today.
 * Sums cash fees collected minus cash expenses paid out.
 * @return {Object} Cash drawer audit breakdown
 */
function getCashDrawerBalance_() {
  var todayStr = getKolkataDate();

  // 1. Cash Inflows: Payments received today with Mode === 'Cash'
  var payments = getAllRowsAsObjects_('SHEET_FEE', 'Payments', 1000);
  var cashInflowToday = 0;
  var cashPaymentsToday = [];

  for (var i = 0; i < payments.length; i++) {
    var p = payments[i];
    var pDate = p.Date instanceof Date ? getKolkataDate(p.Date) : String(p.Date);
    var pMode = String(p.Mode || '').trim().toLowerCase();

    if (pDate === todayStr && pMode === 'cash') {
      var amt = parseFloat(p.Amount) || 0;
      cashInflowToday += amt;
      cashPaymentsToday.push({
        studentId: p.StudentID,
        studentName: p.StudentName,
        amount: amt,
        paymentId: p.PaymentID
      });
    }
  }

  // 2. Cash Outflows: Expenses recorded today where Mode or PaidFrom === 'Cash'
  var expenses = getAllRowsAsObjects_('SHEET_BOOKS', 'Expenses', 1000);
  var cashOutflowToday = 0;
  var cashExpensesToday = [];

  for (var j = 0; j < expenses.length; j++) {
    var e = expenses[j];
    var eDate = e.Date instanceof Date ? getKolkataDate(e.Date) : String(e.Date);
    var eMode = String(e.Mode || '').trim().toLowerCase();
    var ePaidFrom = String(e.PaidFrom || '').trim().toLowerCase();

    if (eDate === todayStr && (eMode === 'cash' || ePaidFrom === 'cash')) {
      var expAmt = parseFloat(e.Amount) || 0;
      cashOutflowToday += expAmt;
      cashExpensesToday.push({
        entryId: e.EntryID,
        category: e.Category,
        note: e.Note,
        amount: expAmt
      });
    }
  }

  // 3. Opening Cash Balance from Opening_Balances tab
  var openingBalances = getAllRowsAsObjects_('SHEET_BOOKS', 'Opening_Balances', 20);
  var openingCash = 0;
  for (var k = 0; k < openingBalances.length; k++) {
    if (String(openingBalances[k].Key) === 'OpeningCash') {
      openingCash = parseFloat(openingBalances[k].Value) || 0;
      break;
    }
  }

  var netCashInHandToday = cashInflowToday - cashOutflowToday;
  var totalDrawerBalance = openingCash + netCashInHandToday;

  return {
    date: todayStr,
    openingCash: openingCash,
    cashInflowToday: cashInflowToday,
    cashOutflowToday: cashOutflowToday,
    netCashInHandToday: netCashInHandToday,
    physicalCashToCount: totalDrawerBalance,
    cashInflowCount: cashPaymentsToday.length,
    cashOutflowCount: cashExpensesToday.length,
    inflows: cashPaymentsToday,
    outflows: cashExpensesToday
  };
}

// ─────────────────────────────────────────────────────────────────────
// 6. AUTOMATED 5-STAGE FEE REMINDERS
// ─────────────────────────────────────────────────────────────────────

/**
 * Daily 7:00 PM Trigger: Sends scheduled reminders for due & overdue fees.
 * Categories:
 * - 5 Days Before Due: Friendly reminder
 * - Due Today: Action prompt
 * - 3 Days Overdue: Gentle nudge
 * - 7 Days Overdue: Critical warning
 * - 10 Days Overdue: Access paused notice
 */
function sendFeeReminders() {
  Logger.log('🔔 Running Daily Fee Reminders (07:00 PM IST)...');
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var invoices = getAllRowsAsObjects_('SHEET_FEE', 'Fee_Schedule', 1500);
  var remindersSent = 0;

  for (var i = 0; i < invoices.length; i++) {
    var inv = invoices[i];
    var status = String(inv.Status || '').toLowerCase();
    if (status === 'paid' || status === 'waived' || status === 'refunded') {
      continue;
    }

    var dueDate = parseDateOrToday_(inv.DueDate);
    dueDate.setHours(0, 0, 0, 0);

    var diffDays = Math.round((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    var reminderType = null;

    if (diffDays === -5) reminderType = '5-Day Warning';
    else if (diffDays === 0) reminderType = 'Due Today';
    else if (diffDays === 3) reminderType = '3-Day Overdue';
    else if (diffDays === 7) reminderType = '7-Day Warning';
    else if (diffDays === 10) reminderType = 'Access Paused';

    if (reminderType) {
      var student = findRow_('SHEET_FEE', 'Students', 'StudentID', inv.StudentID);
      if (student && student.TelegramID && student.Status !== 'Grace') {
        var msg = buildFeeReminderMessage_(student.Name, inv.InvoiceNo, inv.Month, inv.Balance, reminderType, inv.DueDate);
        try {
          sendTelegramMessage_(student.TelegramID, msg);
          appendRow_('SHEET_FEE', 'Fee_Reminders', [
            getKolkataDate(),
            student.StudentID,
            inv.InvoiceNo,
            inv.Balance,
            Math.max(0, diffDays),
            reminderType,
            'Telegram DM',
            'Sent'
          ]);
          remindersSent++;
        } catch (e) {
          logError_('sendFeeReminders', e);
        }
      }
    }
  }

  Logger.log('  ✅ Dispatched ' + remindersSent + ' fee reminders');
}

/**
 * Builds reminder copy based on reminder stage
 */
function buildFeeReminderMessage_(studentName, invoiceNo, month, balance, type, dueDate) {
  var formattedBal = formatCurrency_(balance);
  var formattedDate = getKolkataDate(dueDate);

  switch (type) {
    case '5-Day Warning':
      return '📅 *Upcoming Fee Reminder — Commerce Gyan*\n\n' +
             'Dear ' + studentName + ', your course fee for *' + month + '* (' + formattedBal + ') is scheduled for *' + formattedDate + '*.\n\n' +
             'You can complete payment directly via the Telegram Mini App under the 💰 Fee tab.';

    case 'Due Today':
      return '🔔 *Course Fee Due Today — Commerce Gyan*\n\n' +
             'Dear ' + studentName + ', your monthly fee for *' + month + '* (' + formattedBal + ') is due today.\n\n' +
             'Kindly clear to maintain uninterrupted access to daily Ghost challenges and AI Doubt Solver.';

    case '3-Day Overdue':
      return '⚠️ *Fee Overdue Notice — Commerce Gyan*\n\n' +
             'Dear ' + studentName + ', your invoice (' + invoiceNo + ') for ' + month + ' (' + formattedBal + ') is 3 days past due.\n\n' +
             'Please update your payment via UPI to keep your streak and learning notebook active.';

    case '7-Day Warning':
      return '🚨 *Urgent: Account Access Warning*\n\n' +
             'Dear ' + studentName + ', fee for ' + month + ' (' + formattedBal + ') is 7 days overdue.\n\n' +
             '⚠️ *Important*: Daily MCQ practice and AI Doubt Solver will automatically pause in 3 days if unpaid. Contact Gyan Sir if you need assistance.';

    case 'Access Paused':
      return '❌ *Account Access Paused — Commerce Gyan*\n\n' +
             'Dear ' + studentName + ', your access to the Commerce Master App has been temporarily paused due to overdue tuition fee (' + formattedBal + ').\n\n' +
             'To instantly restore access, tap below to view payment details or speak directly with Gyan Sir.';

    default:
      return 'Fee reminder for ' + month + ': ' + formattedBal;
  }
}

/**
 * Sends a welcome message with invoice proforma to a newly onboarded student
 */
function sendStudentWelcomeMessage_(telegramId, name, studentId, planName, firstMonthFee, firstInvoice) {
  try {
    var msg = '🎓 *Welcome to Commerce Gyan Mastery Batch!*\n\n' +
              'Hello *' + name + '*, your enrollment is confirmed!\n\n' +
              '📌 *Student ID*: `' + studentId + '`\n' +
              '📚 *Plan*: ' + planName + '\n' +
              '💵 *First Month Pro-Rata Fee*: ' + formatCurrency_(firstMonthFee) + '\n' +
              '📅 *First Invoice Due*: ' + firstInvoice.dueDate + '\n\n' +
              '🚀 *Next Steps*:\n' +
              '1. Tap [📱 Open Mini App] to access your daily MCQs and personal notebook.\n' +
              '2. Tonight at 07:30 PM, today\'s practice question will be released!\n\n' +
              'Founder & Educator: Gyan Sir';

    sendTelegramMessage_(telegramId, msg);
  } catch (e) {
    logError_('sendStudentWelcomeMessage_', e);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 7. MINI APP API HANDLERS (Fee Portal)
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns complete fee dashboard data for authenticated student in Mini App
 * @param {Object} verifiedUser - Telegram user from HMAC verification
 * @return {Object}
 */
function apiGetFeeDashboard_(verifiedUser) {
  var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(verifiedUser.id));
  if (!student) {
    throw new Error('Student profile not found for Telegram ID: ' + verifiedUser.id);
  }

  var invoices = findRows_('SHEET_FEE', 'Fee_Schedule', 'StudentID', student.StudentID);
  var payments = findRows_('SHEET_FEE', 'Payments', 'StudentID', student.StudentID);

  // Sort payments reverse chronological
  payments.reverse();

  // Find next due invoice
  var nextDue = null;
  for (var i = 0; i < invoices.length; i++) {
    var s = String(invoices[i].Status || '').toLowerCase();
    if (s === 'pending' || s === 'due' || s === 'overdue' || s === 'partial') {
      nextDue = {
        invoiceNo: invoices[i].InvoiceNo,
        month: invoices[i].Month,
        dueDate: invoices[i].DueDate,
        amount: invoices[i].Amount,
        balance: invoices[i].Balance,
        status: invoices[i].Status
      };
      break;
    }
  }

  return {
    studentId: student.StudentID,
    name: student.Name,
    planName: student.PlanName,
    monthlyFee: parseFloat(student.MonthlyFee) || 0,
    totalCourseFee: parseFloat(student.TotalCourseFee) || 0,
    totalPaid: parseFloat(student.TotalPaid) || 0,
    balance: parseFloat(student.Balance) || 0,
    paidStatus: student.Paid,
    accountStatus: student.Status,
    nextDue: nextDue,
    invoices: invoices.map(function(inv) {
      return {
        invoiceNo: inv.InvoiceNo,
        month: inv.Month,
        dueDate: inv.DueDate,
        amount: inv.Amount,
        paid: inv.Paid,
        balance: inv.Balance,
        status: inv.Status
      };
    }),
    paymentHistory: payments.map(function(p) {
      return {
        paymentId: p.PaymentID,
        date: p.Date,
        amount: p.Amount,
        mode: p.Mode,
        forMonth: p.ForMonth,
        receiptNo: p.ReceiptNo,
        receiptSent: p.ReceiptSent
      };
    })
  };
}

/**
 * Returns receipt details or Drive download URL
 * @param {Object} verifiedUser
 * @param {Object} payload - { receiptNo or paymentId }
 * @return {Object}
 */
function apiGetReceipt_(verifiedUser, payload) {
  var student = findRow_('SHEET_FEE', 'Students', 'TelegramID', String(verifiedUser.id));
  if (!student) throw new Error('Student not found');

  var receipt = null;
  if (payload.receiptNo) {
    receipt = findRow_('SHEET_FEE', 'Receipts', 'ReceiptNo', payload.receiptNo);
  } else if (payload.paymentId) {
    receipt = findRow_('SHEET_FEE', 'Receipts', 'PaymentID', payload.paymentId);
  }

  if (!receipt) {
    throw new Error('Receipt not found');
  }

  // Security check: ensure receipt belongs to this student
  if (receipt.StudentID !== student.StudentID && !isAdmin_(verifiedUser.id)) {
    throw new Error('ACCESS_DENIED: Unauthorized receipt access');
  }

  return {
    receiptNo: receipt.ReceiptNo,
    date: receipt.Date,
    amount: receipt.Amount,
    pdfUrl: receipt.PDF_URL
  };
}
