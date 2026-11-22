// Notices: admin-written notices shown on the student Today tab.
// Sheet: Notices in MASTER_ERP. Class is '11', '12' or 'All'. Never guessed.
const NOTICE_HEADERS_ = ['Notice_ID', 'Title', 'Body', 'Class', 'Start_Date', 'End_Date', 'Created_By', 'Created_At', 'Active'];

function noticeSheet_() {
  const ss = SpreadsheetApp.openById(getActiveSheetIds().MASTER_ERP);
  let sh = ss.getSheetByName('Notices');
  if (!sh) sh = ss.insertSheet('Notices');
  if (sh.getLastRow() === 0) sh.appendRow(NOTICE_HEADERS_);
  return sh;
}
function noticeDate_(v) {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  return Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd');
}
function noticeClass_(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  if (s === 'all' || s === '') return 'All';
  if (/(^|\D)11(\D|$)/.test(s)) return '11';
  if (/(^|\D)12(\D|$)/.test(s)) return '12';
  return null;
}

// Admin only (listed in isAdminOnlyAction_)
function saveNotice(payload) {
  payload = payload || {};
  const title = String(payload.title || '').trim();
  if (!title) return { ok: false, error: 'title required' };
  const cls = noticeClass_(payload.classLevel);
  if (cls === null) return { ok: false, error: 'classLevel must be 11, 12 or All' };
  const start = noticeDate_(payload.startDate) || getKolkataDate();
  const end = noticeDate_(payload.endDate) || start;
  if (end < start) return { ok: false, error: 'endDate before startDate' };
  return withWriteLock_(() => {
    const sh = noticeSheet_();
    const id = 'NT-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMddHHmmss') + '-' + Math.floor(Math.random() * 90 + 10);
    sh.appendRow([id, title, String(payload.body || '').trim(), cls, start, end,
      String(payload.createdBy || ''), new Date().toISOString(), 'TRUE']);
    return { ok: true, id: id };
  });
}

// Open to students: returns only active notices valid today for the given class.
function getNotices(payload) {
  payload = payload || {};
  const sh = noticeSheet_();
  const today = getKolkataDate();
  const want = payload.classLevel == null || payload.classLevel === '' ? null : noticeClass_(payload.classLevel);
  const out = [];
  sheetToObjects(sh).forEach(function (r) {
    if (String(r.Active).toUpperCase() !== 'TRUE') return;
    const s = noticeDate_(r.Start_Date), e = noticeDate_(r.End_Date) || s;
    if (today < s || today > e) return;
    const c = noticeClass_(r.Class);
    if (c === null) return;
    if (want !== null && c !== 'All' && c !== want) return;
    out.push({ id: r.Notice_ID, title: r.Title, body: r.Body, classLevel: c, startDate: s, endDate: e, createdAt: r.Created_At });
  });
  out.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  return { ok: true, notices: out };
}

// Admin only: soft delete (Active=FALSE)
function deleteNotice(payload) {
  const id = String((payload || {}).id || '').trim();
  if (!id) return { ok: false, error: 'id required' };
  return withWriteLock_(() => {
    const sh = noticeSheet_();
    const d = sh.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
      if (String(d[i][0]) === id) { sh.getRange(i + 1, 9).setValue('FALSE'); return { ok: true }; }
    }
    return { ok: false, error: 'not found' };
  });
}
