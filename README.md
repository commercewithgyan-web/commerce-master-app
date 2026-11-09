# 🎓 Commerce Master App v2.3 (Production Deployment)

> **Antigravity Autonomous Academic Engine & Zomato/CRED-Grade Telegram Mini App**  
> **Target:** CBSE Class 11 & 12 Commerce (Accountancy, Business Studies, Economics, Statistics)  
> **Founder & Solo Educator:** Gyan deep Kumar (Gyan Sir)  
> **Architecture Law:** 100% Free Tiers / ₹0 Marginal Cost (Google Sheets, Apps Script, Gemini 2.5 Flash Free, GitHub/Cloudflare Pages)

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             TELEGRAM ECOSYSTEM                              │
├──────────────────────────┬───────────────────────────┬──────────────────────┤
│    Official Channels     │    Telegram Mini App      │     Bot DM / Voice   │
│  Class 11 & 12 Broadcast │   (Paid Student Studio)   │ (Admin & Mentorship) │
│  • Single A4 Q-PDF 7:30P │   • Zomato/CRED Dark Mode │ • Voice Feynman (ogg)│
│  • Model Ans PDF 8:15AM  │   • Ghost Timer & Coins   │ • Admin Commands     │
│  • [Open Mini App] CTA   │   • 5-Layer Notebook      │ • Midnight SOS Alert │
└────────────┬─────────────┴─────────────┬─────────────┴──────────┬───────────┘
             │                           │                        │
             └───────────────────┐       │       ┌────────────────┘
                                 ▼       ▼       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GOOGLE APPS SCRIPT MICROSERVICES                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Code.gs: Main router, doPost(), doGet()                                 │
│  • auth.gs: HMAC-SHA256 initData verification, paid student gate           │
│  • sheets.gs: Atomic Sheet operations & range-specific queries             │
│  • fees.gs: Pro-rata joining, exam month capping, instant receipts         │
│  • questions.gs: 70/30 pacing, Ghost challenges, Fisher-Yates shuffle      │
│  • doubts.gs: Multimodal raw audio .ogg, 10-Yr-Old Kid ELI10 Feynman engine│
│  • redpen.gs: Canvas-compressed (1280px) handwritten copy OCR               │
│  • mysteries.gs: Saturday Corporate Audit Detective room                   │
│  • sos.gs: 2:00 AM panic stress-buster & 1-page formula booster             │
│  • subjective.gs: Single-PDF daily cycle (zero timeout risk)               │
│  • books.gs: Cash-basis 4-list accounting, P&L, balance sheet verifier     │
│  • watcher.gs: Content-aware layout decision tree & SVG vector math engine │
│  • triggers.gs: Time-based crons (Asia/Kolkata timezone)                   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐     ┌──────────────────┐
│  5 DECOUPLED     │    │  GOOGLE AI       │     │  GOOGLE DOCS     │
│  GOOGLE SHEETS   │    │  STUDIO          │     │  PDF TEMPLATES   │
│  1. Syllabus     │    │  Gemini 2.5      │     │  • Q-PDF         │
│  2. QuestionBank │    │  Flash Free Tier │     │  • Ans-PDF       │
│  3. Fee Mgmt     │    │  (1,500 req/day) │     │  • Fee Receipt   │
│  4. Telegram     │    │  Text, Vision,   │     │                  │
│  5. Books & Cash │    │  Raw Audio OGG   │     │                  │
└──────────────────┘    └──────────────────┘     └──────────────────┘
```

---

## 📂 5 Decoupled Google Sheets Schema

| Sheet Name | Tabs Count | Key Tabs & Functions |
|---|:---:|---|
| **`1. Syllabus Planner`** | 3 | `Master_Syllabus` (797 CBSE subtopics), `Chapter_Weightage`, `Setup` |
| **`2. Question Bank`** | 11 | `QuestionBank` (Vault), `DailyQuestions`, `StudentAnswers`, `Leaderboard` (Masked), `Doubts`, `Notebook_Notes`, `Notebook_Favourites`, `Notebook_Summary`, `Revision_Queue`, `Audit_Mysteries`, `RedPen_Submissions` |
| **`3. Fee Management`** | 7 | `Plans`, `Students` (Board session alignment), `Payments`, `Fee_Schedule` (Pro-rata), `Fee_Summary`, `Fee_Reminders`, `Receipts` |
| **`4. Telegram Delivery`** | 7 | `Bot_Logs`, `PDF_Log`, `Subjective_PDF_Log`, `Broadcasts`, `Settings`, `Errors`, `Audio_Pills_Log` |
| **`5. Books & Expenses`** | 6 | `Expenses` (7 categories), `Assets` (SLM depreciation), `Liabilities`, `Capital_Drawings`, `Opening_Balances`, `Monthly_Reports` (P&L & Balance Sheet) |

---

## 🛠️ Step-by-Step Setup Guide

### 1. Initialize Sheets & Doc Templates
1. Open [Google Apps Script](https://script.google.com) and create a new project: `Commerce Master App Backend`.
2. Add all `.gs` files from the `/backend/` directory.
3. Run `setupAllSheets()` from `setup_master.gs`. This will automatically create all 5 Google Sheets with headers, validations, conditional formatting, and column widths.
4. Run `setupDocTemplates()` from `setup_doc_templates.gs`. This will create the Google Docs proformas in Google Drive.
5. Run `verifySetup()` to validate that all 34 tabs across the 5 sheets are in place.

### 2. Configure Script Properties
Set the following properties in Apps Script Settings:
- `BOT_TOKEN`: Telegram Bot Token from `@BotFather`
- `GEMINI_KEY`: Free API key from [Google AI Studio](https://aistudio.google.com/apikey)
- `ADMIN_ID`: Gyan Sir's numerical Telegram ID
- `SHEET_SYLLABUS`, `SHEET_QB`, `SHEET_FEE`, `SHEET_TG`, `SHEET_BOOKS`: Auto-populated by `setupAllSheets()`
- `DOC_QUESTION_TEMPLATE_ID`, `DOC_ANSWER_TEMPLATE_ID`, `DOC_RECEIPT_TEMPLATE_ID`: Auto-populated by `setupDocTemplates()`

### 3. Deploy Web App & Set Webhook
1. Deploy as Web App (`Execute as: Me`, `Who has access: Anyone`).
2. Register webhook:
   ```bash
   curl -F "url=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec" \
        https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
   ```

---

## 🔒 Security & Architectural Enforcements

- **Zero-Cost Law**: Free Gemini 2.5 Flash (`1500 req/day`), static hosting on GitHub Pages, Apps Script native limits.
- **HMAC-SHA256 Auth**: Strict signature verification of Telegram `initData`. Never trust `initDataUnsafe`.
- **Blob PDF Generation**: Never send raw Google Drive URLs to Telegram `sendDocument`. All PDFs are compiled into memory as Blobs and uploaded via multipart form data.
- **LockService Concurrency**: Prevents race conditions during answer submissions and daily question assignments.
- **Client-Side Compression**: Red-pen register photos are clamped to 1280px / 70% JPEG (~200 KB) via HTML5 `<canvas>` before upload, consuming strictly ~258 tokens per page.

---

## 🚀 Build Phase Tracker (100% PRODUCTION READY)

- [x] **Phase 1: Sheets & Templates Setup** (5 Sheets, 34 Tabs, 3 Doc Proformas, Master Setup)
- [x] **Phase 2: Backend Core** (`Code.gs`, `auth.gs`, `sheets.gs`, `utils.gs`, HMAC verification)
- [x] **Phase 3: Fee Module** (`fees.gs`, pro-rata, 12-month capping, `/cash`, instant receipts)
- [x] **Phase 4: Question Bank & 5-Layer Notebook** (`questions.gs`, `notebook.gs`, ghost challenges)
- [x] **Phase 5: Voice Feynman Engine & Doubt Solver** (`doubts.gs`, `.ogg` audio pipeline, ELI10)
- [x] **Phase 5B: WOW & Delight Suite** (`redpen.gs`, `mysteries.gs`, `sos.gs`)
- [x] **Phase 6: Single-PDF Broadcast Cycle** (`subjective.gs`, 7:30 PM & 8:15 AM channel crons, `watcher.gs`)
- [x] **Phase 7: Books & Expenses** (`books.gs`, cash basis P&L, balance sheet verifier)
- [x] **Phase 8: Zomato/CRED-Grade Mini App Frontend** (`frontend/`, haptic feedback, PWA offline cache)
- [x] **Phase 9: Time-Based Triggers & Automated Crons** (`triggers.gs`, Asia/Kolkata timezone)
- [x] **Phase 10: End-to-End Verification & Launch** (`test_suite.gs` 25/25 unit tests passed)

---

## 🧪 Automated Test Suite Results

Run `runAllCommerceTests()` from [`backend/test_suite.gs`](backend/test_suite.gs):
```text
📋 Test Group 1: Pro-Rata Fee Formulas — 4/4 PASSED
📋 Test Group 2: Board Exam Session Alignment — 3/3 PASSED
📋 Test Group 3: Anti-Cheating Dynamic Shuffler — 3/3 PASSED
📋 Test Group 4: Autonomous Watcher Layout Tree — 8/8 PASSED
📋 Test Group 5: Zero-CDN SVG Vector Engines — 2/2 PASSED
📋 Test Group 6: Privacy Masking & Formatters — 5/5 PASSED
─────────────────────────────────────────────────────────────
TOTAL: 25 PASSED | 0 FAILED (100% PASS RATE)
```

---

## 👨‍🏫 Solo Educator Daily Routine (≤20 Mins/Day)

| Time | Duration | Autonomous Action | Gyan Sir's Manual Input |
|---|---|---|---|
| **06:00 AM** | 0 min | System assembles 70/30 practice questions | None (Automatic) |
| **08:00 AM** | 0 min | Bot broadcasts 60-second audio pill | None (Automatic) |
| **08:15 AM** | 0 min | Bot broadcasts official Model Answer PDF | None (Automatic) |
| **Pre-Class** | 10 sec | Locks today's teaching subtopic | Send `/settopic 12 Accountancy 6 "Working Capital"` |
| **07:30 PM** | 0 min | Channel receives A4 Question PDF + Mini App unlocks MCQ | None (Automatic) |
| **08:30 PM** | 2 min | Dinner digest of pending AI draft questions | Tap `/approve [QID]` in Telegram |
| **09:00 PM** | 1 min | Reconciles physical cash in Begusarai drawer | Send `/cash` to verify closing cash balance |
| **11:00 PM** | 0 min | Rebuilds masked leaderboard & updates spaced repetition | None (Automatic) |
| **11:30 PM** | 0 min | Audits Balance Sheet $\text{Assets} = \text{Liabilities} + \text{Equity}$ | None (Automatic) |
| **02:00 AM** | 0 min | Full 5-Sheet Drive Backup | None (Automatic) |
