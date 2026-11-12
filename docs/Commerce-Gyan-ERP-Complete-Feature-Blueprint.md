# Commerce Gyan ERP — Feature Blueprint

Prepared: 11 October 2026 · Time zone: Asia/Kolkata

## 1. What this document covers

This is the functional blueprint of the current ERP and its prepared local update, based on the current application source, backend setup files and recorded verification evidence. It is not a claim that every feature has passed live end-to-end testing. Historical/overridden code is not treated as a separate working feature.

**Status key**

- **Existing:** Included in the deployed ERP baseline; individual features may still need end-to-end verification.
- **Local:** Implemented in the new local package; not deployed.
- **Setup required:** Source prepared, but needs separate backend/Google installation and verification.
- **Future:** Not implemented or not enabled in the current scope.

Live site: https://commerce-gyan-erp.netlify.app/

Recorded live release: `2026-10-11-owner-recovery-1`.
Local candidate: `2026-10-11-local-finance-automation-1`.

The current ERP is owner-only. Staff, students and parents do not have separate portals. Attendance is deliberately outside the current scope. WhatsApp sending remains manual.

## 2. Stage-by-stage operating blueprint

| Stage | Start with | Main actions | Result | Status |
|---|---|---|---|---|
| 1 | Owner account | Sign in, verify authenticator, sync | Private workspace access | Existing |
| 2 | Settings | Coaching profile, accounts, categories, fees, enquiry rules | Operating configuration | Existing |
| 3 | Enquiries | Capture contact, subjects and permission | Saved enquiry | Existing |
| 4 | Follow-up | Next action, date/time, demo and outcome | Reviewed lead pipeline | Existing |
| 5 | Quotation | Board/subjects, fee basis, discounts and validity | Preserved fee quotation | Existing |
| 6 | Admission | Accept quotation, assign student identity and enrollment | Student contract/profile | Existing |
| 7 | Billing | Calculate missing periods, review exceptions, approve | Issued bills | Existing |
| 8 | Collections | Record receipt, allocate principal/penalties, retain advance | Updated ledger and receipt | Existing |
| 9 | Corrections | Refund/reverse or adjust with dated reasons | Preserved correction history | Existing |
| 10 | Teaching | Batches, tests, marks and resources | Teaching records/results | Existing |
| 11 | Expenses | Select personal/coaching, record income/outflows | Separate finance records | Existing; clearer menus Local |
| 12 | Documents | Generate admission/bill/receipt PDF and image | Downloadable documents | Existing |
| 13 | Google integration | Verify bridge, opt in, retry failures | Private Drive files / enquiry Calendar events | Local + Setup required |
| 14 | Reporting | Review cash, dues, conversion and budgets | Management summaries | Existing; added summaries Local |
| 15 | Reconciliation | Compare actual totals or approve statement matches | Saved verification records | Existing |
| 16 | Close and protect | Data health, pending saves, backup, recovery | Operational safeguards | Existing; full recovery rehearsal pending |

## 3. Navigation and workspaces

### Workspace — Existing

- **Today:** Work queue for due follow-ups, demos, fee-related work and operational actions.
- Quick enquiry capture, payment collection, student/enquiry lookup and missing-bill review.
- Reviewed due WhatsApp follow-up queue for eligible contacts.
- **ERP Dashboard:** Coaching overview and navigation to operational modules.
- **CRM Reports:** Coaching cash summaries, enquiry conversion, lost reasons and batch capacity.

### Admissions — Existing

- Enquiries and follow-up pipeline.
- Students/admissions register and student profiles.

### Fees & collections — Existing

- Fees, payments and reconciliation.
- Missing-bill review, student ledger, corrections and documents.

### Teaching — Existing

- Batches, tests/marks and resource library.
- No active attendance workflow.

### Personal Expenses / Coaching Expenses — Local navigation improvement

- Separate menu sections, each containing Money overview, Transactions, Budgets, Accounts, Recurring and Reports.
- Only the selected ledger's tab is active; heading and add button identify Personal or Coaching.
- Existing ledger selector remains available.
- Selecting a coaching operational module switches to the coaching workspace.
- Existing records are not automatically moved or reclassified by this change.

### Administration — Existing

- Communication, Data Health, Audit and Settings.

## 4. Owner access and security — Existing

- Owner sign-in/sign-out and password-recovery flow.
- Mandatory TOTP authenticator verification before protected ERP access.
- QR-based authenticator enrollment; unfinished enrollment reuse within memory and owner isolation.
- Existing verified factors use a verification challenge rather than another enrollment.
- Token refresh and session-expiry handling.
- Thirty-minute owner idle controls in the current source.
- Saved settings hidden while authenticator verification is incomplete.
- Protected database record access and guarded saved-operation endpoints.
- Direct authenticated record writes blocked; application writes use controlled operations.
- Current-session gate rejects sessions invalidated by recovery.
- Private one-use recovery codes: generate/regenerate only after verified access; server stores hashes rather than plaintext.
- Recovery requires a fresh password login and an unused code; rate limits, code consumption, session revocation, TOTP reset and mandatory re-enrollment are included in the backend.
- Recovery service health indicator.
- Server secrets are not part of the public website package.
- Website security headers, restricted connection destinations and frame restrictions are included.

**Limits:** A real owner factor-reset/re-enrollment rehearsal is not complete. Keep authenticator access and secured administrator recovery. Do not put codes or enrollment secrets in project documents.

## 5. Settings and initial configuration — Existing

- Coaching name, tagline, address, contact phone, optional second phone, UPI ID, email and social/website details.
- Approved coaching logo in document generation.
- Separate ledger accounts and categories; default Cash, Bank and UPI account support.
- Monthly category budgets.
- Fee master with effective-month versions and reasons.
- Review applying a future rate version to eligible student contracts; existing contracts are not silently repriced.
- Enquiry follow-up delays, follow-up window, call duration and quotation-validity rules.
- Early-bird, referral and family discount percentages with a combined cap.
- Drive root/bridge connection settings.
- Backup/export/restore controls, release identity, sync timing and pending-save indicators.

**Local additions:** Explicit automatic-document-upload choice (default No), restored Calendar verification/enable controls, and billing-review queue controls.

## 6. Enquiry capture and follow-up — Existing

- Minimal new-enquiry capture: name, class, subjects and contact phone.
- Same WhatsApp number, a separate WhatsApp number, or no WhatsApp number.
- Contact permission/consent defaults conservatively; permission is required before messaging.
- Optional lead source and requirements.
- Saved older guardian, school, address and other details are preserved during later review.
- Pipeline supports enquiry contact, demo scheduling, decision/admission and lost/closed outcomes.
- Priority, next action, follow-up date/time and follow-up mode.
- Automatic planning of the next follow-up; log completed follow-up and plan another.
- Demo date/time and outcome recording.
- Lost-reason requirement when closing a lead as lost.
- Rule-based lead priority score with explanation; not a prediction of admission probability.
- Staggered follow-up slots within a configured window.
- Reviewed contact-permitted follow-up queue and manual message drafts.
- Admission links the enquiry to the student; closed/admitted leads are excluded from relevant follow-up messaging.

**Calendar extension:** Detailed in section 14; currently local/setup-required, not continuously running.

## 7. Quotations and promotions — Existing

- Board and subject selections drive master pricing where applicable.
- Manual quotation pricing for cases such as two-subject combinations.
- Quote validity date and saved quotation version/history.
- Combined early-bird/referral/family discounts with cap.
- Discount duration: first month, first N billing months, or ongoing monthly.
- Saved quotation pricing remains frozen until explicit repricing.
- Accepted quotation can carry its promotional terms into admission.
- Source-enquiry relationship retained for quotation-linked admissions.
- Changes to current master rates do not silently replace saved quotations.

## 8. Admission and student profile — Existing

- Permanent student identity/code, name and contact details.
- Guardian/student contact information, school and enrollment details where recorded.
- Class, board, subjects, batch and status.
- Joining date, first billing month, course/session boundaries and fee plan.
- Fee source, manual/master basis, discount and fee-waiver terms.
- Accepted quotation/promotional duration.
- Student register search by name, code and phone.
- Profile view with ledger, payment/receipt history, contact actions and related activity.
- Family-related profile lookup using recorded contact information.
- Active/inactive/suspended enrollment handling in relevant workflows.
- Scheduled collection arrangements and promises to pay.
- Effective-dated subject/fee contract changes and next-session planning.
- Future contract history visible without rewriting original issued bills.
- Private Drive links and generated admission documents.

## 9. Fee master, contracts and billing — Existing

### Current initial master values

| Board | Single subject per month | All three subjects per month |
|---|---:|---:|
| Bihar Board | ₹700 | ₹1,400 |
| CBSE | ₹800 | ₹1,500 |

Two subjects require a reviewed manual amount. Saved effective-dated rates and individual contracts determine actual billing; the table is not a statement that every student owes these amounts.

### Billing functions

- Monthly and other saved fee-plan calculations.
- Explicit first billing month and contract history.
- Actual-day proration for joining/leaving-month calculations.
- Generate missing bills through the selected month.
- Preview students, periods, due dates, charges, totals and contract exceptions before posting.
- Existing student/period bills excluded from the missing-bill preview.
- Inactive/other enrollments excluded according to current rules; Active/Suspended are considered by the current preview.
- Exception review blocks creation when the preview contains contract errors.
- Issued bills stay unchanged when later master/contract settings change.
- Review/approve creation in batches with progress feedback.
- Outstanding principal, penalties, payments, advance and status in the student ledger.
- Separate unbilled expected charges from issued outstanding dues.
- Aging groups: 0–30, 31–60 and 61+ days from due date.

### Fines and adjustments

- Monthly fees due in advance on the 1st, with the recorded three-day grace rule.
- Reviewed fine based on month-start unpaid principal, not penalties.
- Percentage calculation, fixed override and editable final amount.
- Assessment reason/history and repeat-assessment checks.
- Dated principal/penalty adjustments and waivers/revocation.
- Original bills preserved rather than overwritten to conceal corrections.

## 10. Scheduled billing — Local + Setup required

- Separate server function proposed to run daily at 6 AM IST.
- One unique review request per owner/month; repeated runs request duplicate-safe insertion.
- Default disabled until a server environment flag is explicitly enabled.
- Queues reviews only: never writes issued bills, contracts or payments.
- Owner/MFA-protected queue schema supplied separately.
- Settings button checks monthly review requests.
- Calculate/review drafts uses current saved contracts and the existing billing preview.
- Only explicit owner approval creates bills.

**Important distinction:** The scheduler does not precompute or store per-student draft amounts. It creates monthly review requests; amounts are calculated when reviewed. Queue entries are history, not an approved/paid indicator. Database installation and live scheduler verification have not been performed.

## 11. Payments, allocations, promises and corrections — Existing

- Record student payment amount, date, payment mode, reference and receipt identity.
- Review principal/penalty allocations against student bills.
- Default allocation follows oldest principal first, then penalties.
- Excess payment retained as student advance/credit.
- Student ledger with issued charges, allocated payment, remaining due and advance.
- Duplicate/reference and relationship checks in relevant save/import workflows.
- Promise-to-pay record with promised amount/date and progress assessment.
- Original and net receipt values shown separately after corrections.
- Dated refund/reversal records with reasons and remaining-refundable checks.
- Corrections preserve original receipt/history and affect ledger/cash summaries.
- Receipt PDF/image and reviewed message actions.

**Limits:** Recording a refund or payment does not execute a bank transfer, collect money or issue a gateway transaction. The actual money movement occurs outside the ERP.

## 12. Personal and coaching finance — Existing + Local usability/report additions

- Separate scoped transactions, accounts, categories, budgets and recurring records.
- Income, Expense and within-ledger Transfer entry types.
- Amount in INR with integer-paise calculations, date, account and transfer destination.
- Description/merchant, category, tags and notes.
- Optional JPEG/PNG/WebP expense receipt photo up to 1 MB; view/remove saved image.
- Entry edit/delete controls; fee-derived income/corrections are managed through payment history rather than deleted as ordinary transactions.
- Monthly overview: expenses, income, net cash flow, budget remaining, spending breakdown, account balances and recent entries.
- Transaction filters: text, month, entry type, category and date range; all-dates view.
- Filtered CSV export with spreadsheet formula-injection precautions.
- Accounts with opening balances; opening balance is not income.
- Category creation and case-insensitive duplicate-name checks.
- Category/month budgets with spent, remaining and over-budget indicators.
- Monthly/weekly/yearly recurring expenses, next due date, reviewed Post due and remove controls.
- Recurring posting uses a deterministic record identity to reduce duplicate entry creation.
- Transfers do not increase income/expenses.
- Coaching fee receipts and refunds included as derived coaching cash entries.

**Local report additions:** Ledger-specific monthly income/outflow/net summaries and prior-month outflow comparison. Personal net is recorded savings/deficit; coaching net is cash surplus/deficit, not accounting profit or a verified bank balance.

**Limits:** No automatic cross-ledger transfer, expense split, tax accounting, bank feed or automatic recurring payment is claimed. Expense categories currently use the saved/default list; coaching-specific category redesign is a recommendation, not a completed migration.

## 13. Teaching modules — Existing

### Batches

- Create/edit batch name, subjects, schedule, teacher and capacity.
- Student-to-batch assignment and student counts.
- Capacity/available-seat summary and relevant admission checks.

### Tests and marks

- Test title, date, subject/chapter, batch and maximum marks.
- Mark entry for eligible active students in the selected/all batches.
- Results sorted by marks with percentage calculation.
- Results CSV export.

### Resources

- Resource title, class, subject/chapter and recorded URL.
- Search and edit library entries.
- Open resource links.

**Not included:** Attendance, LMS lessons, assignments/submissions, online exams, student logins or automated grading.

## 14. Documents and Google integration

### Document generation — Existing

- Admission record, fee bill and payment receipt models.
- Coaching branding/contact profile and student identifiers/details.
- Download PDF and PNG/image; document preview.
- Share generated files where the device supports it, with download fallback/manual attachment.
- Issued document snapshot/revision handling in the document workflows.
- Admission documents identify fee information separately from payment receipts.
- Original issued financial/document details are preserved by the relevant history/revision workflow.
- Hindi/Devanagari and other bundled font assets exist, but visual quality is not yet fully verified.
- These are not configured GST tax invoices.

### Drive links — Existing

- Save Drive file/folder links on student profiles.
- Categories include admission forms, bills, receipts, session records and other documents.
- Owner/root/bridge configuration and connection verification.
- Link attachment does not alter Drive sharing permissions.

### Automatic document upload — Local + Setup required

- Explicit No/Yes setting, default No.
- Requires verified owner session and saved verified bridge.
- Upload generated PDF and PNG to private owner Drive folders.
- Fixed ERP root and student/category folder structure.
- Document keys/revision suffixes identify duplicates and revisions.
- Bridge validates owner, current-session/MFA access, document source, category, file type/signature and size.
- Upload result includes file links recorded back into the ERP.
- Error status and manual Save to Drive retry.

**Limits:** Upload runs when documents are generated/opened, not from a durable background queue. It is not a general arbitrary-file upload service. Existing saved bridge verification returned HTTP 404; redeployment/authorization is required before activation.

### Calendar sync — Local + Setup required

- Owner primary Google Calendar only.
- Enquiry follow-up/demo-derived private events with date/time, duration and popup reminder.
- Verify Calendar authorization before saving enabled settings.
- Stable enquiry event identity, generation and sync state.
- Update changed ERP events; close/cancel identified ERP events for closed/admitted enquiries.
- Source timestamp/rule version tracks whether sync is current.
- Sync after enquiry saves and retry pending sync while ERP is open.
- Error messages preserve enquiry saves even if Calendar fails.
- No attendee invitations/sendUpdates.

**Limits:** Other calendar appointments are not checked for conflicts; this is not general two-way calendar synchronization. Continuous background sync is not implemented. Google permissions/execution and live duplicate/cancellation behavior still need verification.

## 15. Communication centre — Existing, manual sending only

- Default templates plus create/edit/customize templates.
- Active/inactive template choice and saved template/version references.
- Enquiry acknowledgements and relevant student/fee follow-up drafts.
- Reviewed recipient and message text.
- Contact permission checks and closed-lead exclusions.
- Copy Message and Open WhatsApp actions.
- Save message snapshot before copying/opening.
- Changed text/recipient/template requires a fresh reviewed snapshot.
- Draft, Open and User-confirmed sent status.
- Owner explicitly confirms pressing Send in WhatsApp.
- Saved history with recipient, time, template/version and snapshot view.
- Duplicate confirmation disabled when already user-confirmed.
- Delivery/read status explicitly unknown.

**Not included:** WhatsApp API sending, bulk unattended messages, provider delivery receipts, read receipts or automatic SMS/email campaigns.

## 16. Reports and management views

### Existing

- Personal/coaching monthly expenses by category, count, amount and share.
- Daily expense totals, recorded income/net, CSV and print/PDF through browser print.
- Coaching gross fee collections, refunds/reversals, coaching expenses and cash remainder.
- All-time enquiry-source conversion, demos completed, admissions and average admission time where dates exist.
- Lost reasons/counts.
- Batch active students, capacity and available seats.
- Source-conversion CSV export.
- Fees: issued dues/advance, missing periods, expected unbilled charges, contract exceptions and aging.
- Student ledger and payment/receipt history.
- Test results and percentage CSV.
- Reconciliation totals/differences and health/audit views.

### Local additions

- Clearly scoped personal/coaching cash summaries.
- Previous-month outflow comparison.
- Coaching receipts/refunds counted once in the added summary.
- Transfers and unpaid bills excluded from added cash totals.

**Not included:** Statutory financial statements, verified accounting profit, GST return preparation, sophisticated forecasting or fully customizable report-builder dashboards.

## 17. Reconciliation and month-close — Existing

- Compare recorded gross collections by payment mode with owner-entered actual totals.
- Save recorded/actual amounts, difference, period and notes.
- Flag non-cash receipts missing references.
- Import owner-downloaded statement CSV locally; select reference, credit amount and date columns.
- Match exact normalized reference, amount and valid ISO date to a recorded non-cash payment.
- Ambiguous matches, duplicate statement rows and already-verified records do not qualify for another approval.
- Approve verification record; it does not create/change payment amounts or balances.
- Raw statement contents remain in the browser; saved verification includes match metadata.
- Month-close checklist: physical cash/bank/UPI comparison, refunds, issued charges/allocations/advance, missing bills, concessions, pending saves, data health and encrypted backup.

**Limits:** This is assisted reconciliation, not an automatic bank integration.

## 18. Audit, data quality, reliable saves and backup — Existing

- Audit/history view and entity activity records.
- Data Health flags missing/invalid contacts, incomplete contracts, date inconsistencies, open enquiries without next actions, orphan payments and duplicate references.
- Ledger checks include repeated student/period bills, allocation relationships, refund excess and cash/allocation/advance inconsistencies.
- Health checks report issues without silently correcting source records.
- Atomic controlled save batches and expected-version conflict handling.
- Pending operation journal on the owner's device; check/retry the same operation rather than re-entering uncertain saves.
- Acknowledgement checks before clearing pending operations.
- Cross-tab record-change notice and sync-before-next-action guidance.
- Last sync count/time and lightweight operation status history; credentials/record contents excluded from that health log.
- Download JSON backup covering both ledgers and ERP records.
- Current-ledger CSV export.
- Restore validates format, IDs, supported records/amounts and duplicate IDs.
- Missing-ID import preview; existing IDs preserved, no destructive replace-all restore.
- Payment-reference conflict checks, dependency-aware order, batches and resumable import.
- Last backup-download indicator on the device.
- Temporary demo mode is explicitly not cloud-saved.

**Limits:** In-memory exact backup/restore tests are not database disaster recovery. A full isolated database backup/restore, concurrency audit and browser/API/database workflow rehearsal remain pending.

## 19. Deployment blueprint

### Stage A — Review the local candidate

1. Read this blueprint and the setup guide.
2. Check personal/coaching navigation, reports, forms and documents in a local browser.
3. Complete mobile/iPad and Hindi document visual checks.
4. Retain existing production backup and live deployment reference.

### Stage B — Website update

1. Upload only the Website ZIP to the existing Netlify site.
2. Verify release identity, owner login/authenticator, record sync and zero unresolved saves.
3. Confirm no existing records were moved or overwritten.

### Stage C — Google integration

1. Restore the owner-controlled Apps Script deployment using the supplied source.
2. Owner reviews/completes Google authorization.
3. Verify the working /exec URL in ERP Settings.
4. Test private sample document upload and Calendar update/retry/cancellation.
5. Enable only the verified workflows.

### Stage D — Billing review scheduler

1. Review/test supplied queue SQL in isolation before installing.
2. Deploy the server function through a workflow that bundles Functions, not static upload alone.
3. Configure server-only secrets; review hosting usage/cost.
4. Confirm scheduled badge/run, queue access permissions and duplicate behavior.
5. Enable scheduler; owner reviews current drafts and explicitly approves bills.

### Stage E — Full operational verification

1. Enquiry → quotation → admission → bill → payment allocation → receipt → backup/restore.
2. Dated correction/advance/penalty and effective-contract scenarios.
3. Multi-device conflict/pending-save recovery.
4. Isolated lost-authenticator recovery and database disaster recovery.

No live deployment, backend installation or Google authorization occurred during the local package preparation.

## 20. Future/not-current features and outstanding safeguards

- Separate staff/student/parent portals and permission roles.
- Payment gateway/online collection.
- Official WhatsApp automation/provider statuses.
- Attendance remains excluded unless explicitly requested later.
- Durable background document queue and continuous Calendar worker.
- Persisted per-student scheduled draft amounts, approvals/status dashboard and broader configurable scheduling.
- Further renewal queues, profile/Today/report refinements beyond the existing functions.
- Canonical private source repository and CI/deployment linkage.
- Review leaked-password protection availability/cost and enablement.
- Recovery dependency lockfile/internal-RPC permission audit.
- Full isolated Auth reset, database backup/restore and concurrency verification.

These are not represented as completed features.

## 21. Package and evidence index

- Website: `Commerce-Gyan-ERP-Website-2026-10-11.zip`.
- Separate setup: `Commerce-Gyan-ERP-Backend-Setup-2026-10-11.zip`.
- Setup instructions: `repairs/automation/SETUP.md`.
- Feature source: `repairs/bridge-auth/site/app.js` and `documents.js`.
- Local scheduler/bridge source: `repairs/automation/`.
- Status history: `DONE.md`, `TO_BE_DONE.md`, `PROJECT_MEMORY.md`.

Recorded passing local checks: JavaScript syntax; fee/contract rules; enquiry/quotation/navigation; report isolation; integrated in-memory workflow and exact restore; owner-enrollment behavior; mocked bridge access checks; mocked scheduler queue behavior; ZIP integrity.

Not verified by those checks: browser layout, mobile/iPad, document visual quality, deployed Google execution, scheduler deployment, new database policies/concurrency, full database disaster recovery or real owner factor reset.

This document contains no student records, passwords, server keys, recovery codes or authenticator secrets. Local project memory is not a confirmed upload to ChatGPT project sources.
