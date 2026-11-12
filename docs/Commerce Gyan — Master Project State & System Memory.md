# **COMMERCE GYAN — MASTER PROJECT STATE & SYSTEM MEMORY**

**Single Source of Truth (SSOT) Architecture & Operational Blueprint**

*Location: Begusarai, Bihar \| Owner: Gyan deep Kumar (Gyan Sir) \| Current Date: November 2026*  
\|---\|

# **1\. EXECUTIVE CONTEXT & PURPOSE**

This document serves as the permanent memory bridge for Commerce Gyan across all AI conversations, automations, and development sprints. It guarantees that any new conversation or subagent immediately knows all finalized architectural decisions, master Google Sheet links, and cross-spoke integration pathways without having to start over.

* **Institute**: Commerce Gyan (Begusarai, Bihar)  
* **Classes**: Class 11 & Class 12 Commerce (CBSE & BSEB Boards)  
* **Subjects**: Accountancy, Business Studies, Economics, Statistics / CA Foundation  
* **Teaching Model**: Hybrid (Physical Offline Batch in Begusarai \+ Live/Recorded App Lectures \+ Unlisted/Public YouTube Videos)  
* **Zero Isolated Spoke Rule**: No tool, script, or feature (whether YouTube, Notion, Google Drive, or ERP) ever operates in isolation. Every action in one spoke automatically cascades through the central **System** to update the connected spokes.

# **2\. THE 8-SPOKE BIDIRECTIONAL HUB ARCHITECTURE**

From the owner's master Freeform diagram, the system functions as a central hub with bidirectional data flows across 8 operational spokes:

* **Central System (Google Workspace Backbone)**: Google Sheets master database, Google Drive 71-chapter hierarchy, Google Forms intake, Google Docs master templates, and Apps Script controllers.  
* **Syllabus Planner (`02_Syllabus_Planner`)**: 797 CBSE subtopics with Canonical Topic IDs. Pulls morning hooks/examples from Notion; unlocks today's A4 DPP and 3-track quiz upon topic completion; feeds missed topic links to ERP for absent/late students.  
* **GoodNotes Studio (`06_GoodNotes_&_Studio`)**: Live handwritten teaching on iPad M3 with Apple Pencil using pre-branded Class 11/12 Acc/BS/Eco templates. 60-second class-end PDF export stamped with dynamic Student ID watermarks and saved to Google Drive.  
* **ERP Core (`01_ERP_Core_System`)**: Lead CRM, 3-day demo tracker (`0/3`), admissions, Option A 100% dynamic cell-editable fee matrix, 5-day grace 5% late fee with 1-click teacher waiver, positive-only Mode 1 CG Coins, and SWOT Smart Receipts.  
* **Student Portal in Telegram (`05_Student_Portal_&_App`)**: Runs via Telegram Mini App (`WebApp`) with 4-digit PIN \+ auto-bound `Telegram_User_ID` login. Students view live attendance (`P`/`L`/`A`), fee ledgers, SWOT receipts, CG Coins, A4 DPPs, GoodNotes PDFs, and unlisted YouTube recovery videos in one place.  
* **Daily Practice Paper (`03_Google_Classroom` & `04_Daily_MCQ_&_Forms`)**: Standardized A4 sheet PDF DPP \+ 3-track quiz (`Open MCQ`, `Open Practice`, `Open AI Challenge`) dispatched via Telegram at 7:00 PM IST with T+1 delayed model solutions.  
* **Notion Second-Brain (`07_Notion_&_YouTube`)**: Structured databases for Teaching Hooks, Real-World Commerce Examples, Case Studies, and Common Accounting Errors. Feeds the 8:00 AM AI morning brief and live class prep.  
* **YouTube Complete System (`07_Notion_&_YouTube` & Studio)**: Automated FFmpeg compression (`2GB -> 400MB`) \+ audio boost (`-16 LUFS`). Serves Unlisted batch lectures behind a 90% watch-gate for absent/late recovery, and repurposes classroom hooks into public YouTube Shorts / Reels for organic marketing.  
* **Telegram Teacher Remote Control (`ERP-091`)**: Admin command menu (`/startclass`, `/attendance`, `/endclass`, `/fee`, `/waive`) inside Telegram so the teacher controls all 8 spokes from one screen.

# **3\. FINALIZED OPERATIONAL POLICIES & DECISION RULES**

## **A. Parent Messaging Policy (Zero Messages in Phase 1\)**

* **Rule**: Parents are NOT sent automated messages, WhatsApp alerts, or SMS in Phase 1 under any circumstance.  
* **Status**: All parent-facing triggers, daily WhatsApps, fee escalation messages, and the dedicated Parent Portal are moved to **Later (Phase 2\)**.  
* **Attendance Tracking**: The teacher's 30-second attendance sidebar (`CLS-02`) marks `Present (P)`, `Late (L)`, and `Absent (A)`. All attendance records and monthly report cards remain internal and visible to students via their Telegram Student Portal only.

## **B. Late (`L`) Attendance & Recovery (Option 2 Confirmed)**

* **Rule**: Option 2 is strictly enforced.  
* **Workflow**: Marking a student **Late (`L`)** automatically assigns them the exact same **2-MCQ Topic Recovery Drill (`REC-01`) \+ Notes Upload (`REC-02`)** as an **Absent (`A`)** student.  
* **Purpose**: Guarantees that whether a student arrives 20 minutes late or misses class entirely, they must watch the missed video concept and pass the understanding check before getting full credit.

## **C. CG Coin Gamification Economy (Mode 1 Active, Positive-Only)**

* **Rule**: Mode 1 (`FEE_DISCOUNT_MODE`) is the active starting mode.  
* **Rate**: 1 Coin \= ₹1 tuition fee discount, up to an editable monthly cap (default ₹100/month) configured in `CONFIG_FEE_SETTINGS`.  
* **Zero Deduction Guarantee**: Student coins are strictly positive-only and NEVER deducted. `ERP-071` (*Negative Coin Penalty Tracker*) is permanently cut out (`Delete / Remove (Cut Out)`).  
* **Earning Events**: Attendance marked `Present (P)` (+2 coins), Daily Quiz score \>=80% (+15 coins), Perfect score (+30 coins), Successful student referral (+100 coins).

## **D. Billing Architecture & 100% Dynamic Editable Config (Option A)**

* **Rule**: Option A is locked in.  
* **Dynamic Table**: Every single fee item—Monthly per-subject rates (₹700/₹800), 3-subject combos (₹1,400/₹1,500), Quarterly rates, Half-Yearly (5% off), Yearly Full-Session (8% off), ₹500 Registration Fee, ₹200 Study Material Fee, and scholarship caps—is maintained in an editable configuration sheet (`CONFIG_FEE_SETTINGS`). The teacher can change any amount in spreadsheet cells anytime without touching code.

## **E. Late Fee & Teacher Waiver Rule**

* **Rule**: 5-day grace period, 5% of the due/outstanding amount.  
* **Teacher Waiver**: The teacher has a 1-click waiver option (`Revoke_Late_Fee` / `ERP-069`) and promise-date unlock (`Revoke_Access_Lock`) to waive the late fee partially or 100% and restore app access until an agreed extension date.

## **F. Sibling Linking**

* **Rule**: Lightweight automatic phone-number matching (`ONB-09`).  
* **Mechanism**: Uses a `COUNTIF` check on parent mobile numbers across student records \+ a simple manual checkbox in the discount engine to grant the 10% sibling concession without complex multi-account logins.

## **G. QR Booklets & Scanning Deferred to Phase 2**

* **Rule**: Physical QR code printing in books and QR scanning are deferred to **Later (Phase 2\)** (`ERP-082`, `F-001`, `SYL-025`, `GND-015`, `T-013`).  
* **In-App Adaptive Learning Active**: The 3-tier score-based adaptive routing (`MCQ-019`: `<50%` Basic, `50–75%` Standard, `>75%` HOTS) operates directly inside the Telegram Student Portal/App in Phase 1\.

## **H. Unified Accounting-Grade SWOT Smart Fee Receipt**

* **Rule**: `FEE-03` \+ `ERP-064` are unified as the single primary receipt generator (basic `FEE-04` is cut out).  
* **Contents**: Sequential Receipt ID (`CG/YYYY-YY/XXXX`), Current Payment \+ Previous Date-Wise Payment History \+ Remaining Due Balance, Teacher Waiver / "You Saved" Badge, Positive-Only CG Coins Earned & Balance, Monthly Attendance % (`P` / `L` / `A`), Test Scores, 1-Line Student SWOT Remark, and a Motivational Commerce Quote. Exported as compressed PDF \+ PNG.

# **4\. MASTER FILE & SYSTEM REGISTER**

* **Master Feature Control Workbook**: [Commerce Gyan — App-Wise Master Feature Control Workbook](https://docs.google.com/spreadsheets/d/1QM5tqcaPdnSNGjfPFEhHixp3PkB1N-SCoV8caqUO9w4/edit) (`1QM5tqcaPdnSNGjfPFEhHixp3PkB1N-SCoV8caqUO9w4`)  
  * `00_Summary_Dashboard`: Live KPI tracking referencing `A2:A1250` and `D2:D1250` across 1,106 features (**836 Keep/Active**, **254 Later Phase 2**, **16 Delete/Cut Out**, **18 Template Slots**, **75.6% Active Adoption**).  
  * `01_ERP_Core_System`: 550 features (Admissions, Fee Ledger, Roll Call, 149 WhatsApp templates).  
  * `02_Syllabus_Planner`: 89 features (797 CBSE subtopics, Canonical IDs, 71 chapters, 8 AM AI brief).  
  * `03_Google_Classroom`: 46 features (A4 DPP sheets, delayed solutions, rubric grading).  
  * `04_Daily_MCQ_&_Forms`: 192 features (2,000+ Question Bank, 7 PM quiz, 6 exam formats).  
  * `05_Student_Portal_&_App`: 138 features (Telegram Mini App, 90% watch-gate, 2-device lock).  
  * `06_GoodNotes_&_Studio`: 30 features (iPad M3 live chalkboard, OBS capture, FFmpeg compression).  
  * `07_Notion_&_YouTube`: 58 features (Notion second-brain sync, unlisted lectures, Shorts queue).  
  * `99_All_Master_Register`: Live dynamic `QUERY` SSOT stacking all 1,106 features from Row 2\.  
* **Master Requirement Blueprint**: Google Doc `1RC0ye75JRj6IiEj-ey9MBU3ON-Zn5J-meBG5X4ls5qM`  
* **Class Suite All Stages in Table**: Google Doc `1mIUCC9xl0kXregDQcHMYvRSZtwbjyNhDJeYrJcHU6Ao`  
* **Interactive Visual Explorer & Flowcharts**: Sandbox Canvas App (`commerce_gyan_stage_flowcharts.html`)

# **5\. NEW CHAT KICK-OFF PROMPT**

Whenever starting a new chat thread in Gemini, paste the following 2-line prompt:"Please load my persistent memory from the user skill 'gemini-spark-instructions' and Google Doc 'Commerce Gyan — Master Project State & System Memory' (ID: 1CX4zIFuUA7l2FILBOnb5hZKrov32e3c5JAQz2UWDaYc). Continue our Commerce Gyan 8-spoke ecosystem development from where we left off."

# **6\. OPERATIONAL PROTOCOL: PLANNING-FIRST & AUTO-COMPRESSION**

* **Phase-Strict Discipline**: The ecosystem is strictly in the **Planning & Architecture Stage**. No direct code, files, or App Scripts are to be created or modified in the production system until Gyan Sir explicitly issues the directive: *"Now create this system"*.  
* **Continuous Memory Synchronization**: All finalized spoke decisions, architecture rules, and roadmap items must be recorded in this master memory document.  
* **Automatic Prompt Markdown Compression**: All spoken Hindi/Hinglish/English instructions from the user are automatically compressed into token-efficient, structured English Markdown specifications to minimize token consumption while retaining 100% functional fidelity.  
* **Initial Target Scale**: Optimized for a 100-student cohort across Class 11 and Class 12, engineered for zero-lag performance on Google Sheets ERP and Telegram WebApp.

# **7\. FINALIZED SPOKE SPECIFICATION: 02\_SYLLABUS\_PLANNER & DPP SYSTEM**

* **Preloaded Canonical Hierarchy**: 797 CBSE subtopics across 71 chapters with immutable IDs (e.g., `C12-ACC-B1-CH02-T04`).  
* **Teacher Desk Class Control (100% In-App)**:  
  * *Pre-Class Queue*: Automatically displays today's next scheduled subtopic with estimated board weightage. Includes `Start Class` live timer.  
  * *Dual Completion Triggers*:  
    * `Partially Completed`: Sends 3 basic concept MCQs today and holds long numerical DPPs until the topic is 100% finished.  
    * `Completed Today`: Unlocks the dynamic question count selector (MCQs: 1–15, Subjective: 0–5, AI Vision Check toggle).  
  * *Pre-7:00 PM Teacher Preview*: 1-tap modal in Telegram displaying the exact selected questions with an approval/swap option before broadcast.  
* **Student Syllabus & Assessment Portal**:  
  * *Live Syllabus Tracker Tab*: Real-time completion bars for Accountancy, Business Studies, and Economics with chapter-by-chapter checklists (Completed, In Progress, Upcoming).  
  * *14-Day Homework Tracker*: Date-pill calendar grid tracking On-Time (+15 pts), Late (+10 pts), and Pending homework with 1-tap backlog resolution. Includes an Early Bird Speed Bonus (+15 CG Coins for submissions before 9:30 PM).  
  * *Missed Class Recovery Alert*: Flags absent/late dates and redirects students via a deep link to the **Commerce Gyan Play Store App** for recorded lectures, unlocking the 2-MCQ recovery drill.  
  * *Public YouTube Revision Funnel*: In-app card featuring official public YouTube one-shot lectures with a \+10 bonus CG Coin claim incentive.  
  * *Weekly Batch Podium & Wall of Fame*: Public recognition for the top 3 consistent students of the week (Speed Finisher and 7-Day Champion badges).  
* **A4 Google Doc DPP Template**: Template generation held pending Gyan Sir's custom layout upload.

# **8\. FINALIZED HYBRID FLIPPED-CLASSROOM & VISUAL LEADERBOARD SPECIFICATION**

* **Solo-Teacher Flipped-Classroom Model (3 \+ 7 Split)**:  
  * *Context*: Solves solo-teacher offline classroom time limits in Begusarai without rushing theory or skipping board numericals.  
  * *Live Classroom Track (*`DELIVERY_MODE: LIVE_CLASS`*)*: Core concept derivation \+ 2 to 3 benchmark board numericals solved live on iPad blackboard.  
  * *App Video Vault Track (*`DELIVERY_MODE: APP_VAULT`*)*: Remaining 7 to 8 advanced numerical problems \+ comprehensive NCERT theory recorded once and hosted in the Commerce Gyan Play Store App for self-paced student mastery.  
  * *In-App Visibility*: Every topic card in the Telegram Mini App clearly displays this two-track breakdown so students know exactly what was covered live and what is available in the video vault.  
* **Visual Leaderboard & Competition Engine**:  
  * *Telegram Profile Photo Sync*: Automatically retrieves the student's active Telegram avatar via `initDataUnsafe.user.photo_url` with zero manual upload friction.  
  * *Gamified Initials Badge Fallback*: If photo access is private or unavailable, displays styled circular initials with dynamic rank-based border rings (🥇 Gold for Rank 1, 🥈 Silver for Rank 2, 🥉 Bronze for Rank 3\) and Roll Number tags.  
* **Status**: 100% Finalized and Approved by Gyan Sir. Pure Planning Mode strictly maintained (no code execution).

# **9\. FINALIZED MASTER QUESTION BANK VAULT SPECIFICATION (STANDALONE REPOSITORY)**

* **Architecture Principle**:  
  * Independent, dedicated Google Sheet: **`Commerce Gyan — Master Question Bank Vault`** placed in a dedicated root Google Drive folder (`00_Commerce_Gyan_Master_Hub`).  
  * Strict decoupling: Question authoring, AI generation, and cataloging live exclusively inside Google Sheets and Apps Script Web Studio. Telegram is strictly an outbound delivery pipe, not a question authoring tool.  
* **Unified 4-Tier Delivery Scope per Question**:  
  * `CLASS_LIVE_TEACHING`: Benchmark concept and practical numericals solved live on iPad in Begusarai classroom.  
  * `APP_VIDEO_VAULT`: Advanced numericals and theory breakdown recorded for the Commerce Gyan Play Store App.  
  * `DAILY_7PM_DRILL`: Automated 7:00 PM Telegram Mini App practice (MCQs \+ Subjective).  
  * `WEEKEND_MOCK_BOARD`: Full-length CBSE/Bihar Board 80-mark mock papers.  
* **Workbook Tab Hierarchy**:  
  * `00_Dashboard`: Live analytics matrix showing total question counts, approved vs draft counts, and topic coverage percentages across all 71 chapters.  
  * `01_Schedule_Bridge`: 7-day advance planner linking teaching dates to specific question packages, with auto-fallback to the most recently completed `Canonical_Topic_ID`.  
  * 8 Subject Tabs:  
    * Class 11: `11_Accountancy`, `11_Business_Studies`, `11_Micro_Economics`, `11_Statistics`  
    * Class 12: `12_Accountancy`, `12_Business_Studies`, `12_Macro_Economics`, `12_Indian_Economics`  
* **Standardized Column Contract (Per Subject Tab)**:  
  * `Question_ID`, `Canonical_Topic_ID`, `Chapter_Name`, `Topic_Name`, `Subtopic_Name`, `Scope_Tag`, `Question_Type`, `Marks`, `Difficulty`, `Question_Text`, `Option_A`, `Option_B`, `Option_C`, `Option_D`, `Correct_Option`, `CBSE_Working_Notes_Why_Correct`, `CBSE_Step_Marking_Rubric`, `Approval_Status`.  
* **Integrated Gemini AI Question Generator Prompt Engine**:  
  * Sidebar/modal where teacher selects Class, Subject, Chapter, Topic, Subtopic, and Target Count.  
  * Generates a strict structured tabular prompt.  
  * Output directly populates all columns (question, options, working notes, rubric) matching CBSE standards with zero manual re-typing.  
* **Status**: 100% Finalized in Pure Planning Mode. No premature code execution.

# **10\. REFINED CLASSROOM DRILL & NOTEBOOKLM INGESTION ARCHITECTURE**

* **Classroom 10-Minute Exit Drill (`LAST_10_MIN_DRILL`)**:  
  * *Definition*: Solves Gyan Sir's offline classroom routine in Begusarai. The last 10 minutes of every physical class are dedicated to an immediate exit practice on the blackboard/iPad.  
  * *Mechanism*: Tapping `Start Class` or opening the Teacher Desk displays the exact 1–2 exit questions tagged for today's topic so the teacher does not have to hunt through guidebooks while students are seated.  
* **Evening 7:00 PM Homework Drill (`HOMEWORK_7PM`)**:  
  * Separate automated queue sent to the student's Telegram Mini App for home solving.  
* **NotebookLM Vision Ingestion Pipeline (CBSE Sample Papers & Board Archives)**:  
  * *Source Ingestion*: Gyan Sir uploads physical photos/scans/PDFs of official CBSE Sample Papers, Marking Schemes, and Board Exam archives directly into his Gemini Notebook (NotebookLM).  
  * *NotebookLM RAG Bridge*: When the Question Bank generation engine is triggered for any `Canonical_Topic_ID`, it uses the `teaching-content-pipeline` skill to query that specific NotebookLM notebook via `notebooklm:retrieve_relevant_chunks`.  
  * *Zero Hallucination Guarantee*: Every generated MCQ and numerical is strictly derived from and cross-referenced against the actual uploaded CBSE sample papers and NCERT marking rubrics.  
* **Status**: 100% Finalized in Pure Planning Mode. No code execution.

# **11\. CLASSROOM DISPLAY HARDWARE & INTERACTIVE BOARD PROJECTION ENGINE**

* **Classroom Hardware Setup (Begusarai Center)**:  
  * Digital Board / Display Screen driven by Mac Mini (or iPad M3 mirroring via AirPlay/HDMI).  
  * OBS Studio capturing live teaching at 1080p.  
* **Display Mechanisms for the 10-Minute Exit Drill**:  
  * *Method 1: 1-Click Digital Board Kiosk Mode (Mac Mini Browser)*:  
    * Teacher clicks a single shortcut/button in Teacher Desk: `📺 Open Classroom Board View`.  
    * Launches full-screen interactive display designed specifically for 65"/75" Digital Boards with 24pt+ high-contrast readable typography.  
    * Features: Question card with large option buttons, interactive click-to-reveal answer with CBSE Working Notes and trap alerts, and confetti/sound triggers.  
  * *Method 2: iPad GoodNotes Last-Page Template (Apple Pencil Annotation)*:  
    * The last page of today's GoodNotes notebook template automatically includes the 10-minute exit question blocks.  
    * Allows Gyan Sir to solve and annotate directly with Apple Pencil in front of students while mirrored to the board.  
* **Status**: 100% Finalized in Pure Planning Mode. No code execution.

# **12\. STANDALONE DIGITAL BOARD WORKFLOW (ZERO-DEPENDENCY CLASSROOM MODE)**

* **Context**: Solves the physical classroom scenario when Gyan Sir teaches *exclusively* on the Digital Board (Android OS or Windows OPS built into the touch panel) without touching the Mac Mini or iPad.  
* **Stand-Alone Access Mechanisms (3 Simple Ways)**:  
  * *Pathway 1: Built-in Digital Board Web Browser (1-Click Touch Bookmark)*:  
    * The Digital Board's built-in Chrome/Firefox browser has a pinned home screen bookmark: `Commerce Gyan Board View`.  
    * Teacher taps the icon on the touchscreen \-\> Directly opens full-screen interactive Exit Drill for today's topic.  
    * Touch-responsive: Tap options with your finger or stylus, reveal CBSE working notes, and swipe to the next question.  
  * *Pathway 2: Annotation over Live Browser (Touch Screen Pen)*:  
    * Most digital boards (Maxhub, ViewSonic, LG, Senses, Newline) have a built-in floating annotation toolbar (`Pen / Pencil` icon).  
    * While the question is displayed on the board's browser, Gyan Sir taps the board's pen tool and writes journal entries and calculations directly over the question on the screen.  
  * *Pathway 3: Offline 1-Page PDF / Image in Digital Board Whiteboard*:  
    * The daily 10-minute question card is auto-exported as a single clean PNG image / PDF into today's Google Drive chapter folder.  
    * Teacher opens the Digital Board's native Whiteboard app \-\> Taps `Import Image` \-\> Solves directly on the digital canvas.  
* **Status**: 100% Finalized in Pure Planning Mode. No code execution.

# **13\. STANDARDIZED DIGITAL BOARD WEB APP ENGINE (DATE-WISE CALENDAR & ADAPTIVE SCREEN VIEW)**

* **Architecture Definition**:  
  * Independent, dedicated web endpoint powered by Google Apps Script HtmlService: `?view=board`.  
  * Responsive Viewport Design: Automatically calculates client screen resolution via CSS viewport units (`vw`/`vh`) and modern flex/grid layouts:  
    * *75" / 65" Digital Board (4K/1080p Touch Screen)*: Auto-scales typography to 28pt–34pt with massive touch-target option cards (80px+ height).  
    * *Mac Mini Monitor / Laptop*: Scales to comfortable desktop proportions with keyboard navigation (Keys 1/2/3/4 or A/B/C/D).  
    * *iPad M3 / Android Tablet*: Scales to tablet touch layout with full pinch-to-zoom and Apple Pencil compatibility.  
* **Date-Wise Interactive Calendar Grid (Drill Calendar)**:  
  * Top navigation bar features a collapsible **Date Picker / Interactive Weekly Calendar Pill Strip** (e.g. `[Today: 06 Nov]`, `[05 Nov]`, `[04 Nov]`, `[03 Nov]`, `[Calendar 📅]`).  
  * Tapping any date instantly loads that specific date's 10-minute exit questions pulled dynamically from the Master Question Bank (`Canonical_Topic_ID` linkage).  
  * Past dates remain accessible for quick revision drills; future dates display scheduled upcoming topics.  
* **Master Question Bank Dynamic Binding**:  
  * Live linkage: Pulls directly from the `Master_Question_Bank` sheet where questions are tagged `Scope_Tag: LAST_10_MIN_DRILL` or `CLASS_LIVE`.  
  * Zero static hardcoding: If Gyan Sir edits a question or working note in the Google Sheet, the Digital Board Web App reflects the change on the next tap.  
* **Interactive Classroom Discussion Features**:  
  * Full-screen kiosk toggle (`⛶`).  
  * 1-Touch option reveal with emerald-green confirmation, multi-color particle confetti animation, and CBSE marking trap/working note slide-up drawer.  
  * Reset and Next Question navigation buttons.  
* **Status**: 100% Finalized in Pure Planning Mode. No code execution.

# **14\. COMPREHENSIVE ARCHITECTURAL AUDIT & HARDENING: SPOKE 2 (SYLLABUS PLANNER) & SPOKE 4 (QUESTION BANK)**

* **Audit Scope**: End-to-end integration stress-test between `02_Syllabus_Planner` (797 Canonical Topics) and `Master_Question_Bank` across Classroom Exit Drill (`?view=board`) and Telegram Student App (`?view=app`).  
* **5 Identified Edge Cases & Architectural Gaps**:  
  * *Gap 1: Missing Question Buffer on Multi-Day Topics*: Accountancy chapters taking 2-3 days risk running out of tagged questions if students need fresh practice each day.  
    * *Hardening*: Enforce a "3-Tier Depth Buffer" per subtopic (Min 10 MCQs \+ 3 Numericals: Tier 1 Basics, Tier 2 Standards, Tier 3 HOTS).  
  * *Gap 2: Offline Internet Hiccup in Begusarai Classroom*: If broadband drops for 5 minutes during the last 10 minutes of class, board projection could freeze.  
    * *Hardening*: ServiceWorker PWA local caching for `?view=board` so today's and yesterday's exit drills run offline smoothly.  
  * *Gap 3: Unapproved Draft Leakage*: Raw AI-generated questions from NotebookLM could accidentally broadcast to students at 7 PM before teacher review.  
    * *Hardening*: Hard query filter enforcing `Approval_Status == 'APPROVED'` and `Version >= 1` before any broadcast trigger runs.  
  * *Gap 4: Late-Admission Backlog Panic*: A student enrolling in August or November opening the 14-day homework tracker could be overwhelmed by 40 red pending pills.  
    * *Hardening*: Anchor the homework tracker to `Student_Admission_Date`; prior drills display as optional "Revision Vault" rather than overdue red alerts.  
  * *Gap 5: Accounting Format Distortion on Mobile Viewports*: Multi-column journals (Debit/Credit/LF) or Revaluation tables distort on narrow phone screens.  
    * *Hardening*: Horizontal swipe container with sticky Debit/Credit headers and synchronized PDF tap-to-expand.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **15\. BRAND IDENTITY SYSTEM & DEEP INTEGRATION HARDENING (SPOKE 2 & SPOKE 4\)**

* **Commerce Gyan Master Brand Specifications (Begusarai, Bihar)**:  
  * *Primary Typography & Colors*: Deep Obsidian (`#0B0C10`), Royal Imperial Violet (`#2D124D`), Heritage Gold (`#D4AF37`), Crisp Chalk White (`#F8FAFC`).  
  * *Official Brand Inscription*: **"Commerce Gyan — Be the Best from the Rest"** (Begusarai, Bihar \| Mentor: Gyan deep Kumar).  
* **Omni-Channel Watermarking & Branding Standards**:  
  * *Digital Board Kiosk Mode (*`?view=board`*)*:  
    * Subtle gold-embossed top header: "COMMERCE GYAN • BEGUSARAI \| 10-MIN CLASSROOM EXIT DRILL".  
    * Diagonal semi-transparent watermark: "COMMERCE GYAN — GYAN SIR" across the board background to discourage pirated photo circulation.  
  * *Telegram Mini App (*`?view=app`*)*:  
    * Official institute logo badge and gold seal at top navigation.  
    * Every generated score card, WhatsApp status share graphic, and parent progress card carries the branded crest, student roll number, and official Telegram bot link (`@CommerceGyanDostbot`).  
  * *A4 Google Doc & PDF Worksheets*:  
    * Standardized formal header: Institute name, logo placeholder, contact/center details, CBSE batch, and date.  
    * Dynamic diagonal watermark: "COMMERCE GYAN • UNIFIED ACADEMIC SYSTEM" \+ Student ID stamping on student-specific copies.  
    * Official footer: Page numbering, copyright, and institute motto.  
* **Additional Architectural Gaps & Hardening (Advanced Audit)**:  
  * *Gap 6: Accidental Duplicate Question Seeding across 10-Min Board Drill and 7 PM Homework*:  
    * *Risk*: A student sees the exact same MCQ on the Digital Board at 10:55 AM and again at 7:00 PM on their phone, ruining the challenge.  
    * *Fix*: Mandatory Mutual-Exclusion Filter in `01_Schedule_Bridge`: Questions tagged for `LAST_10_MIN_DRILL` on date T are automatically blacklisted from date T's `HOMEWORK_7PM` package.  
  * *Gap 7: Formula / MathJax Rendering Failures in Offline Browser*:  
    * *Risk*: Complex Economics equations (e.g. Multiplier K \= 1 / (1 \- MPC)) or Accounting ratios render as raw unparsed code if external CDN is blocked.  
    * *Fix*: Localized MathJax / KaTeX bundle pre-packaged inside Apps Script HTML Service to ensure 100% offline mathematical typesetting.  
  * *Gap 8: Incomplete Multi-Part Numericals Grading*:  
    * *Risk*: A 6-mark board question containing 3 separate parts (A: Revaluation, B: Partners' Capital, C: Balance Sheet) being graded as a single text block.  
    * *Fix*: Multi-Tier Rubric Matrix in Question Bank linking Part A (2M), Part B (3M), and Part C (1M) separately so Gemini Vision AI provides sub-component scoring.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **16\. DUAL BRAND ARCHITECTURE & BOT CONFIDENTIALITY DIRECTIVE**

* **Strict Bot Confidentiality Directive**:  
  * *Zero Bot Metadata in Academic Deliverables*: The Telegram bot username, token, technical endpoint, or internal bot URLs must NEVER appear inside any academic question, printable A4 DPP worksheet, model solution, or classroom digital board display.  
  * Questions and practice sheets must remain strictly academic, distraction-free, and clean, matching standard CBSE board examination papers.  
* **Dual Brand Presence Standard**:  
  * *Offline Coaching Entity*: **"Commerce Gyan"** (Physical Classroom & Hybrid Institute \| Begusarai, Bihar \| Mentor: Gyan deep Kumar).  
    * Used exclusively on: Physical center signage, offline student roll cards, fee receipts, digital board classroom displays, attendance logs, and physical test papers.  
  * *Online Digital & Social Media Presence*: **"Commerce with Gyan"** (Digital Brand \| YouTube, Instagram, Telegram public media, Play Store App).  
    * Used exclusively on: YouTube channel branding, video watermarks, Instagram reels/posts, Play Store app title, and public online learning content.  
  * *Official Core Motto*: **"Be the Best from the Rest"**.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **17\. ADVANCED EXPERT ADDITIONS: SYLLABUS PLANNER & QUESTION BANK (ACADEMIC MASTERY)**

* **Syllabus Planner Advanced Modules**:  
  * *Board Exam Weightage & Mark Predictor*: Visual tags on every chapter showing exact CBSE board marks (e.g. Partnership: 36 Marks, Share Capital: 24 Marks) \+ target completion deadlines to prevent year-end syllabus rush.  
  * *Dual-Board Curriculum Toggles (CBSE vs Bihar Board BSEB)*: Subtopic flags highlighting Bihar Board specific theory patterns, 50-mark objective splits, and bilingual commerce terminology.  
  * *Annual Academic Buffer Days (Begusarai Local Reality)*: Built-in holiday offsets for Chhath Puja (4 days), Durga Puja (6 days), Makar Sankranti, Flood season, and school pre-board exam weeks.  
  * *Multi-Cycle Revision Loops (R1, R2, R3)*: Automated topic recycling for pre-board sprint (December) and final board revision (January/February).  
* **Master Question Bank Advanced Modules**:  
  * *CBSE Board Trap Radar (Pitfall Matrix)*: Pre-tagged examiner traps for every subtopic (e.g., forgetting partner loan interest charging vs appropriation, pro-rata excess application money refund vs allotment adjustment).  
  * *6 Standard CBSE Exam Formats*: Assertion-Reasoning, 4-Mark Case-Study Applications, Match-the-Following, Fill-in-the-Blank Ledgers, Reverse Numericals (Missing Value Problems), and Full 8-Mark Comprehensive Problems.  
  * *Live Class Question Bookmark & Pinning Tool*: 1-tap star icon on questions in Teacher Desk to quickly select today's classroom exit problem in 5 seconds.  
  * *Difficulty-Adaptive 3-Tier Routing*: In-app routing adjusting evening homework drill based on student diagnostic score (\<50% Basic, 50-75% Standard, \>75% HOTS).  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **18\. MASTER ACADEMIC ROADMAP, UNIVERSAL PINNING & 3-TRACK ADAPTIVE MASTERY ENGINE**

* **Universal Multi-Screen Pinning Engine (`⭐ PIN_EVERYWHERE`)**:  
  * *Mechanism*: Tapping the ⭐ Pin icon on any question in the Question Bank Vault (or via Teacher Desk) instantly queues that question across all connected delivery surfaces:  
    * Surface 1: Digital Board Exit Drill (`?view=board`).  
    * Surface 2: Tonight's 7:00 PM Telegram Homework Drill (`?view=app`).  
    * Surface 3: Pinned Weekly Discussion Card in the Telegram Doubt Group.  
  * *Auto-Unpin*: Once the drill concludes, pinned items seamlessly transition to the student's historical revision vault.  
* **Full-Session Academic Roadmap (Student Year-at-a-Glance Planner)**:  
  * *All-at-Once Transparency*: Every enrolled student receives a full-year calendar in each subject upon registration.  
  * *Pre-Dated Milestones*: Maps out exact planned start dates, subtopic completion targets, chapter-end tests, mid-term sprints, and final pre-board revision dates for the entire 2026-27 / 2027-28 academic session.  
  * *Students See Ahead*: Eliminates anxiety; students know months in advance when syllabus will wrap up (e.g. Class 12 Syllabus 100% completed by 15 November).  
* **Proactive Telegram Syllabus Drift Alarm (Teacher Backlog Early Warning)**:  
  * *Discrepancy Formula*: Compares `Planned_Date` vs `Actual_Completion_Date` across the 797 Canonical Topics daily at 8:00 PM IST.  
  * *Telegram Proactive Alert*: If actual teaching slips ≥ 2 classes behind schedule:  
    * Bot sends a private message to Gyan Sir: "⚠️ Syllabus Drift Warning: Class 12 Accountancy is 2 topics behind planned schedule for Ch 2 Reconstitution. Suggested Recovery: 90-minute Sunday Extra Class on \[Upcoming Sunday Date\] or double session tomorrow."  
    * Enables 1-click teacher action: `[ 📅 Schedule Sunday Extra Class ]` or `[ 🔄 Shift Buffer Days ]`.  
* **3-Track Personalized Adaptive Homework Engine (Pedagogical Mastery)**:  
  * *Foundation*: Solves the pedagogical trap of one-size-fits-all homework so toppers are challenged while average students build rock-solid confidence.  
  * *The 3-Track Blueprint*:  
    * **Track A (Foundation Builder \- Level 1\)**: For students scoring \<50% or missing core prerequisites. Focuses on straightforward direct NCERT formula drills and definition MCQs with instant step-by-step guidance.  
    * **Track B (Standard Board Pro \- Level 2\)**: For students scoring 50% \- 75%. Focuses on authentic CBSE past 5-year board questions, standard multi-step practicals, and balanced speed drills.  
    * **Track C (HOTS & 100/100 Topper Sprint \- Level 3\)**: For high-scoring students (\>75%). Focuses on complex reverse-calculation numericals, multi-concept partner death/capital deficiency problems, and tricky Assertion-Reasoning traps.  
  * *Adaptive Dynamics*:  
    * Every student receives the same core foundational problem (Part A).  
    * Part B branches automatically based on the student's 7-day rolling mastery index.  
    * Students can also voluntarily tap **"Level Up 🚀"** in the Mini App to attempt Track C problems for double CG Coins (+30 coins), incentivizing average students to push their limits.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **19\. COMMERCE GYAN 9-MONTH ADMISSION CHARTER & MASTER ACADEMIC CALENDAR (THE "BE THE BEST FROM THE REST" BLUEPRINT)**

* **Strategic Objective & Marketing Anchor**:  
  * Delivers a complete, pre-scheduled, 9-month master academic charter to prospective students and parents during initial enquiry/admission.  
  * Transforms syllabus tracking from a private teacher schedule into a flagship sales asset proving why Commerce Gyan is *"Be the Best from the Rest"*.  
* **Delivery Formats (Dual Distribution)**:  
  * *Format 1: Printable A4 Full-Color High-Gloss Prospectus PDF*:  
    * Distributed physically at the Begusarai center desk and sent as a downloadable high-resolution PDF on WhatsApp upon enquiry.  
    * Features formal Commerce Gyan crest, 9-month monthly timeline blocks, board exam mark weightage tables, and Gyan Sir's signature commitment.  
  * *Format 2: Interactive In-App 9-Month Visual Gantt / Calendar (Telegram Mini App)*:  
    * Embedded under the `Syllabus` tab in the Telegram Mini App.  
    * Allows students to zoom into any month (April to December/February) and filter across 4 dedicated event layers.  
* **The 4 Dedicated Event Layers Across All 9 Months**:  
  * *Layer 1: Core Concept Lectures (Live Class)*: Exact scheduled subtopics per week across Accountancy, Business Studies, and Economics.  
  * *Layer 2: Mandatory Chapter-End & Cumulative Tests*: 50-mark board pattern subjective tests \+ monthly objective Radars.  
  * *Layer 3: Pre-Scheduled Doubt Resolution Clinics*: Dedicated weekly/bi-weekly doubt windows ensuring zero conceptual carry-over.  
  * *Layer 4: 3-Stage Revision Loops (R1, R2, R3)*: Mid-term sprint (R1), pre-board simulation (R2), and final 80-mark board mock drills (R3).  
* **The 9-Month Master Academic Progression (Session Cadence)**:  
  * *Month 1 (April)*: Foundations & Fundamentals (Class 12 Partnership Fundamentals / Class 11 Accounting Intro) \+ Diagnostic Test.  
  * *Month 2 (May)*: Reconstitution — Admission of a Partner & Goodwill Valuation \+ Monthly Chapter Test 1\.  
  * *Month 3 (June)*: Retirement/Death of a Partner & Dissolution \+ Mid-Year Cumulative Test (50 Marks).  
  * *Month 4 (July)*: Company Accounts Part 1 — Accounting for Share Capital (Issue & Pro-Rata Allotment) \+ Doubt Sprint.  
  * *Month 5 (August)*: Company Accounts Part 2 — Forfeiture, Reissue & Issue of Debentures \+ Test 3\.  
  * *Month 6 (September)*: Financial Statement Analysis & Accounting Ratios \+ R1 Mid-Term Revision Sprint.  
  * *Month 7 (October)*: Cash Flow Statement (AS-3 Revised) \+ Pre-Diwali Comprehensive Board Test.  
  * *Month 8 (November)*: **15 NOVEMBER — 100% SYLLABUS FINISH CELEBRATION** \+ Full-Syllabus Mock Test 1\.  
  * *Month 9 (December to February)*: Pre-Board R2 & R3 Sprint (80-Mark Mock Board Simulations, CBSE Marking Scheme Training, Examiner Trap Workshops).  
* **Enquiry CRM Integration**:  
  * When an enquiry is captured in `Admissions_Leads`, the system auto-generates a personalized WhatsApp welcoming message attaching the **9-Month Academic Charter PDF** for their specific class (11 or 12).  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **20\. MASTER PENDING ITEMS REGISTER & DRIVE SYLLABUS VAULT AUDIT**

* **Pending Deliverable Items Logged (Teacher Action Items)**:  
  * *Item 1: A4 Master Google Doc DPP Proforma Layout*:  
    * Status: **100% FINALIZED, POPULATED & LINKED**.  
    * System Action: Template asset linked (Doc ID: `1LNV6MiJL6LWDmOGyRr8s_H9tR_6dGEb2VELCJYQ5__E`). Standardized A4 proforma layout and Apps Script assembly rules fully specified in Section 50\.  
  * *Item 2: Custom 9-Month Syllabus Planner Image / PDF Reference*:  
    * Status: PENDING GYAN SIR'S UPLOAD OR SYNC.  
    * System Action: Workspace search completed across Drive. Found foundational reference assets:  
      * `DRAFT TEST — Class 12 Syllabus Report` (PDF ID: `1Iex9vfATDSNkbZ46013Kvm9QpzH-2VUO`)  
      * `DRAFT TEST — Class 11 Syllabus Report` (PDF ID: `1fNdIJBzJYq0m8U-1mcl3AE9xmOz1QBb2`)  
      * `Bst 2025-26 syllabus.pdf` (PDF ID: `1hQL1ksa5jgKQeVhUir-OONx-ep2_CCrv`)  
      * `Commerce Gyan Class Suite - Stage-Wise Implementation Workflow` (PDF ID: `1NWKZk3GZwgWVaOfV55vwqKUXBj76X0uu`)  
      * `Commerce With Gyan — Class 12 Live Syllabus Progress` (Doc ID: `1k-ni2zcNNpT7zTVA1ekK6U5DG840sskEQPN5X8wixkA`)  
      * `Commerce With Gyan — Class 11 Live Syllabus Progress` (Doc ID: `1cOCalpqWzXvXIW25L9KRf4ugL4-lUeO5UirC-_Cxgy0`)  
* **Integration Protocol**:  
  * Whenever Gyan Sir uploads his specific Syllabus Planner image or new reference PDF, the system will ingest it, verify topic alignments against the 797 Canonical Subtopics, and format the official printable 9-Month Prospectus Calendar accordingly.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **21\. AUTHENTIC CURRICULUM & TEST BLUEPRINTS INGESTION (DISCOVERED DRIVE ASSETS)**

* **Discovered Master Reference Assets**:  
  * *Asset A (Day-Wise Lecture Syllabus Architecture)*: [11 Accountancy](https://drive.google.com/file/d/1Fsg0wh55xDhuYYO7FmwYbWKo659YWO4p/view) (File ID: `1Fsg0wh55xDhuYYO7FmwYbWKo659YWO4p`).  
    * Exact 6-column lecture progression: `Lecture Number`, `S.No.`, `Unit`, `Chapter Name`, `Subtopics`, `Number of Lecture`, `Date of Lecture`.  
    * Day-by-day mapping starting from mid-April covering all foundational lectures (e.g. Basic Accounting Terms, Accounting Principles, Accounting Equation, Journal & Vouchers).  
  * *Asset B (36-Week Sunday Test Series Architecture)*: [Pw 12 test planner](https://drive.google.com/file/d/1ODsPMIeiA-7TZpGnIemsDtdQRywHU8rO/view) (File ID: `1ODsPMIeiA-7TZpGnIemsDtdQRywHU8rO`).  
    * Standardized 36-week Sunday test series schedule running from late April through late December across Accountancy, Economics, Business Studies, and Mathematics.  
* **System Integration Mapping (How These Assets Power the Ecosystem)**:  
  * *Lecture-Level Micro Planning*: The Day-by-Day structure from `1Fsg0wh55xDhuYYO7FmwYbWKo659YWO4p` directly establishes the standard lecture pacing for the 797 CBSE subtopics in `02_Syllabus_Planner`.  
  * *Weekly Sunday Test Series Layer*: The 36-test structure from `1ODsPMIeiA-7TZpGnIemsDtdQRywHU8rO` directly powers the Sunday Test / Olympiad schedule in the 9-Month Master Academic Charter (Section 19).  
  * *Unified Alignment*: Connects day-to-day classroom lecture numbers (e.g. Lecture 1, 2, 3...) to weekly Sunday tests so that every Sunday test strictly tests only the subtopics completed up to that Saturday.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **22\. 8-SUBJECT UNIFIED MASTER LECTURE & 36-WEEK TEST SYNC ARCHITECTURE**

* **Curriculum Scope (All 8 Core Commerce Subjects)**:  
  * *Class 11 (4 Subjects)*: Accountancy, Business Studies, Microeconomics, Statistics for Economics.  
  * *Class 12 (4 Subjects)*: Accountancy, Business Studies, Macroeconomics, Indian Economic Development.  
* **The Dual-Column "Planned vs. Actual" Daily Lecture Contract**:  
  * Based on Asset A (*11 Accountancy* \- `1Fsg0wh55xDhuYYO7FmwYbWKo659YWO4p`), every lecture across all 8 subjects carries:  
    * `Lecture_Seq_No`, `Unit_Name`, `Chapter_Name`, `Micro_Subtopic_Breakdown`, `Planned_Lecture_Count`, `Planned_Date`.  
    * `Actual_Completion_Date`, `Variance_Status` (`ON_TRACK`, `AHEAD`, `BEHIND_BY_X_DAYS`), `Recovery_Session_ID`.  
  * Student & Parent View: Clean, transparent read-only prospectus showing the exact master schedule with real-time green/gold completion ticks.  
  * Teacher Audit View: Highlights negative drift immediately so no subject lags quietly.  
* **The 36-Week Sunday Test Series Engine (Integrated with Weekly Lecture Progress)**:  
  * Based on Asset B (*Pw 12 test planner* \- `1ODsPMIeiA-7TZpGnIemsDtdQRywHU8rO`), every Sunday from late April through late December has a pre-assigned 50-mark board-pattern test.  
  * *Strict Syllabus Boundary Rule*: Sunday Test N tests ONLY the exact micro-subtopics planned and completed between Monday and Saturday of Week N.  
  * *Auto-Syllabus Reconciliation*: If a Friday lecture is delayed to Monday due to an unforeseen holiday, the upcoming Sunday test automatically trims that subtopic from the exam package to guarantee 100% fair testing.  
* **Expert Pedagogical Hardening (How to Elevate This Beyond Competitors)**:  
  * *Enhancement 1: 3-Layer Visual Roadmap Display (In-App & Glossy PDF)*:  
    * Tier 1: Year-at-a-Glance 9-Month Master Gantt (April to Nov).  
    * Tier 2: 36-Week Sunday Test Schedule Matrix across all 4 subjects.  
    * Tier 3: Day-Wise Lecture & Practice Tracker.  
  * *Enhancement 2: Automated "Sunday Recovery & Buffer Week" Trigger*:  
    * If any of the 4 subjects records a cumulative delay ≥ 3 lectures, the system flags the next available Sunday afternoon for an automated 90-minute doubt/recovery session.  
  * *Enhancement 3: Cumulative Milestone Revision Tests (Every 4th Sunday)*:  
    * Instead of only standalone weekly tests, every 4th Sunday is a **Cumulative Multi-Chapter Benchmark Exam** (e.g., Week 4 covers Chapters 1 & 2 combined) ensuring long-term retention.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **23\. RETENTION ENGINE, COMBO PRICING DEFENSE & VIRAL CG COINS GROWTH STRATEGY**

* **Critical Business Diagnosis (Begusarai Offline Reality)**:  
  * *The Churn Phenomenon*: Students enroll for the full 3-subject combo (Accountancy \+ BST \+ Economics), but after 2-3 months drop BST and Economics to study only Accountancy, causing an immediate 50% revenue drop per student.  
  * *Root Cause Identified*: Students perceive Accountancy as the only "hard numerical subject" needing a tutor, while treating BST and Economics as "theory self-study subjects".  
* **Rule Enforcement**:  
  * *Zero Auto-Scheduling of Sunday Recovery*: Sunday extra classes are STRICTLY manual confirmation by Gyan Sir. The system NEVER auto-schedules or broadcasts Sunday classes on its own.  
  * *Full Student Transparency*: All 8-subject lecture trackers, test calendars, and revision loops display automatically inside the Telegram Mini App dashboard.  
* **The 4-Pillar Offline Business Turnaround Strategy**:  
  * *Pillar 1: The "Unbreakable 3-Subject Combo Lock" (Pricing & System Value)*:  
    * Current: Standalone Accountancy (₹800/mo) vs Combo 3 Subjects (₹1,500/mo).  
    * New Strategic Structure: Price Accountancy standalone at ₹900/mo, but offer the complete 3-Subject Power Combo at ₹1,400/mo (effectively making BST & Economics cost only ₹250/mo each).  
    * The "Ecosystem Lock": Full Telegram Mini App access, Gemini Vision AI copy checks, and A4 DPPs are unlocked ONLY for 3-subject combo enrolled students. Single-subject students get only basic classroom lectures without the AI evaluation engine.  
  * *Pillar 2: Win-Back Campaign for Past Dropped Students ("Reactivate & Retain")*:  
    * Targeted WhatsApp / Telegram message to all students who dropped BST/Economics: "Special Board 2027 Diagnostic: Gyan Sir has launched the Begusarai Commerce AI Portal. Re-activate your BST & Economics enrollment this week and receive full access to our 36-Week Sunday Test Series \+ Gemini AI Copy Checking for just ₹400/month additional."  
  * *Pillar 3: The "Viral MCQ Share & Win" Referral Engine (Organic Student Acquisition)*:  
    * Every evening at 7:00 PM, after solving today's 5 Speed MCQs, students get a 1-tap button: `📲 Challenge a Friend on WhatsApp`.  
    * Generates a branded quiz challenge card: "I scored 40/50 in Partnership Hidden Goodwill at Commerce Gyan Begusarai\! Can you beat my score? Tap here: \[Telegram Link\]".  
    * Referral Tokenomics: When an external classmate opens the bot and attempts the quiz, the referring Commerce Gyan student earns **\+50 CG Coins** (₹50 fee discount), and the new student gets a **7-Day Free Practice Pass**.  
  * *Pillar 4: Repositioning BST & Economics as "Marks-Multiplier Board Subjects"*:  
    * Transform BST from boring textbook reading into Case-Study Masterclasses (identifying CBSE 4-mark case traps).  
    * Transform Economics into Formula & Numerical Mastery (National Income aggregates & multiplier graphs).  
    * Position Commerce Gyan as the ONLY institute in Begusarai providing structured, daily case-study rubrics for 100/100 board scores.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **24\. VIRAL MARKETING ENGINE, PHYSICAL REWARDS & BST/ECO MONETIZATION PLAYBOOK**

* **Viral Instagram Story Loop ("Sunday Topper Showcase")**:  
  * *Mechanism*: Every Sunday at 7:00 PM, system generates an automated 9:16 high-contrast vertical story graphic for the Class 11 and Class 12 weekly test champions.  
  * *Branding & Tagging*: Features the official "Commerce with Gyan" Instagram frame, student name, school name (e.g. GD College/St. Joseph), score, and their Instagram handle.  
  * *Viral Reshare Dynamic*: Gyan Sir posts and tags the student on `@CommerceWithGyan`. The student reshares to their personal story to flex their achievement to 300-800 local school classmates, driving organic profile visits and DM enquiries directly to Gyan Sir.  
* **Tiered Referral & Rewards Economy ("Learn, Earn & Upgrade")**:  
  * *Level 1 (1 Referral)*: 100 CG Coins (₹100 fee discount) \+ Branded Commerce Gyan Metal Executive Pen presented physically in class.  
  * *Level 2 (2 Referrals)*: 250 CG Coins \+ Exclusive Printed "CBSE Board 10-Year Theory & Ratio Flash Vault" physical spiral booklet.  
  * *Level 3 (3+ Referrals)*: 500 CG Coins (Full 50% monthly combo discount) \+ "Commerce Gyan Academic Ambassador" lapel pin & certificate.  
* **Monetization & Engagement Playbook for BST & Economics (High-Ticket Repositioning)**:  
  * *Transformation 1: "The Corporate Case Investigation Room" (BST)*:  
    * Eliminate dry textbook reading. Reframe BST classes as live investigative case breakdowns using real companies (Tata, Reliance, Zomato, Shark Tank India).  
    * Students analyze real-world case studies in teams using the "CBSE 3-Step Answer Matrix" (Quote Lines \-\> Name Concept \-\> Explain Impact), making BST exciting and indispensable for 95%+ marks.  
  * *Transformation 2: "The Dalal Street & Budget Simulation" (Economics)*:  
    * Teach Macroeconomics and National Income through live stock market, inflation, and Union Budget simulations.  
    * Students calculate real GDP deflator and Multiplier curves using live Indian economic data, transforming theory into high-status financial literacy.  
  * *Transformation 3: Standalone "BST \+ Eco Board Booster Crash Pass" (Revenue Recovery)*:  
    * For students who strictly refuse full offline attendance in BST/Eco: Sell a specialized digital pass at ₹499/month (or ₹1,499 one-time) providing:  
      * Weekly 36-Sunday Test Series access for BST & Eco.  
      * 24/7 Gemini Vision AI case-study answer grading.  
      * Gyan Sir's curated A4 Case-Study & Formula Worksheets.  
    * Captures pure 100% margin software revenue from students who would otherwise have paid zero\!  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **25\. FINALIZED SPOKE 6 SPECIFICATION: GOODNOTES IPAD M3 STUDIO & AUTOMATED PDF PIPELINE**

* **Hardware & Software Foundation**:  
  * *Hardware Setup*: iPad Pro M3 with Apple Pencil Pro, mirrored via USB-C/AirPlay to 75" Digital Board and Mac Mini M2 running OBS Studio (1080p recording at 60fps, \-16 LUFS audio).  
  * *Primary Chalkboard Engine*: GoodNotes 6 utilizing pre-designed vector PDF templates.  
* **Master Pre-Branded Chalkboard Template Architecture**:  
  * *Color Palette & Contrast*: Deep Blackboard Obsidian (`#0F1117`), Dark Slate Gray ruling, Pale Gold active lines (`#D4AF37`), Chalk White primary text.  
  * *Branded Header & Watermark Stamp*:  
    * Top bar (30px): Subtle Heritage Gold crest with: "COMMERCE GYAN • BEGUSARAI \| MENTOR: GYAN DEEP KUMAR".  
    * Background: Faint diagonal security watermark: "COMMERCE GYAN — CLASSROOM LECTURE VAULT".  
  * *Subject-Specific Page Layouts*:  
    * `ACC_JOURNAL_LEDGER`: Pre-ruled 5-column Journal (Date, Particulars, L.F., Debit ₹, Credit ₹) \+ 3-column partner T-accounts (Asha, Bharat, Chitra) eliminating manual chalkboard line-drawing.  
    * `BST_CASE_MATRIX`: 2-column layout (Left: Case Scenario extract; Right: 3-step answer matrix — Quote, Concept, Impact).  
    * `ECO_ANALYTICAL_GRID`: Top 50% coordinate Cartesian plane for supply/demand curves and multiplier graphs; Bottom 50% formula derivation ruling.  
* **The 60-Second 2-Tap PDF Export & Cloud Sync Pipeline**:  
  * *End-of-Class Ritual*: In GoodNotes, teacher taps `Share > Export All > PDF (Flattened, Vector)`.  
  * *Cloud Destination*: Saves directly via Google Drive iOS integration into today's pre-mapped chapter folder: `00_Commerce_Gyan_Master_Hub/01_Academic_Drive_Hierarchy/[Class]/[Subject]/[Chapter]/01_Goodnotes_Daily_PDF/`  
  * *Standardized Naming Convention*: `[Class]-[Subject]-CH[XX]-L[YY]_[Date]_[TopicSlug].pdf` (e.g. `12-ACC-CH02-L14_20261106_HiddenGoodwill.pdf`).  
* **Dynamic Security Watermarking & Multi-Surface Publishing**:  
  * *Apps Script Drive Watcher*: Automatically detects newly uploaded PDFs in `01_Goodnotes_Daily_PDF`.  
  * *Dynamic Watermark Stamping*: Applies translucent dynamic footer with student metadata when viewed in app: "OFFICIALLY ISSUED TO: \[STUDENT ROLL NO\] • RE-DISTRIBUTION PROHIBITED".  
  * *Multi-Surface Availability*:  
    * Surface 1: Mini App `📚 DPP & Vault` tab under today's chapter.  
    * Surface 2: Attached automatically to the `REC-01` Missed Class Recovery task for absent/late students.  
    * Surface 3: Pinned in the batch Telegram notes repository.  
* **Classroom-to-YouTube Pipeline Integration (Mac Mini OBS)**:  
  * Simultaneously, Mac Mini OBS captures the clean iPad screen \+ microphone feed in 1080p MP4.  
  * Automatically compressed via FFmpeg (2GB \-\> 350MB, audio boosted to \-16 LUFS) and uploaded as an Unlisted video to the Commerce with Gyan YouTube library for the Commerce Gyan Play Store App.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **26\. FINALIZED OBS STUDIO RECORDING & HIGH-VISIBILITY SPACEBAR PAUSE ARCHITECTURE**

* **Hardware & Software Core Setup (Begusarai Center)**:  
  * Mac Mini M2 running OBS Studio 30+ capturing clean iPad Pro M3 screen via USB-C capture/NDI, PTZ Camera (instructor/board feed), and Sennheiser Wireless Teaching Microphone.  
* **Fail-Safe Spacebar Single-Key Toggle Workflow**:  
  * *Single Hotkey Binding*: Spacebar (`Space`) mapped synchronously to:  
    * Native OBS Action: `Pause Recording` / `Unpause Recording`.  
    * Visual Overlay Source: `Show Alert Banner` / `Hide Alert Banner`.  
  * *Operational Flow*:  
    * Teacher turns to engage in offline classroom discussion \-\> Presses `Spacebar`.  
    * Local video and Sennheiser audio recording pause instantly.  
    * Activates an unmissable, high-contrast flashing red border banner across the primary confidence monitor / Digital Board perimeter: `🔴 RECORDING PAUSED — PRESS SPACEBAR TO RESUME`.  
    * When stepping back to lecture, the prominent red visual reminder ensures Gyan Sir taps `Spacebar` before speaking, resuming 1080p recording seamlessly with zero forgotten lectures.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **27\. STANDALONE ERP ARCHITECTURE: ENQUIRY CRM & DYNAMIC WHATSAPP TEMPLATE ENGINE**

* **Dedicated Master Workbook Separation**:  
  * Independent, dedicated Google Sheet: **`Commerce Gyan — Master ERP Core`** placed in the root `00_Commerce_Gyan_Master_Hub` folder.  
  * Keeps operational business data (enquiries, admissions, fees, attendance) strictly decoupled from the Question Bank and Syllabus Planner.  
* **Dedicated Tab 1: `Inquiry_CRM`**:  
  * *Standard Schema*: `Enquiry_ID` (auto-assigned ENQ-YYMMDD-ROW), `Timestamp`, `Student_Name`, `Parent_Name`, `Student_WhatsApp_No`, `Parent_Mobile_No`, `Class_Level` (11/12), `School_College` (GD College, St. Joseph, MRJD, KV IOCL, BP Inter, etc.), `Course_Interest` (3-Subject Power Combo vs Single Subject Accountancy), `Lead_Score` (HOT/WARM/COLD), `Demo_Status` (Day 0/3, 1/3, 2/3, 3/3, Completed, Expired), `Follow_Up_Date`, `Selected_Template_ID`, `WhatsApp_Prefill_Action_Link`, `Conversion_Status` (Enquired \-\> Demo Scheduled \-\> Admitted \-\> Lost).  
* **Dedicated Tab 2: `WA_Templates` (The Dynamic Template Vault)**:  
  * *Pre-Filled Standard Templates*:  
    * `TPL-01_WELCOME_PROSPECTUS`: Instant welcome greeting \+ center address \+ 9-Month Master Academic Charter PDF link.  
    * `TPL-02_DEMO_REMINDER`: Friendly reminder for tomorrow morning's 3-day demo class (Day 1/3) with batch time and location.  
    * `TPL-03_DEMO_DAY3_COUNSELING`: Concluding demo day notice inviting parents for the 3-subject combo counseling session.  
    * `TPL-04_COMBO_OFFER`: Special 3-Subject Power Combo pricing breakdown (₹1,400/mo vs ₹900 single subject).  
    * `TPL-05_ABSENT_DEMO_FOLLOWUP`: Re-engagement text for students who missed a scheduled demo class.  
  * *Dynamic Variable Merging*: Templates automatically replace placeholders (`{{Student_Name}}`, `{{Class}}`, `{{Demo_Date}}`, `{{Batch_Time}}`) using live data from `Inquiry_CRM`.  
* **Manual Template Selection & 1-Click WhatsApp Dispatch**:  
  * *Workflow (In Sheet & Telegram Teacher Desk)*:  
    * Teacher selects the desired message from an in-cell or in-app dropdown (`Selected_Template_ID`).  
    * The column `WhatsApp_Prefill_Action_Link` instantly generates the personalized API URL: `https://wa.me/{{Student_WhatsApp_No}}?text={{Merged_Encoded_Text}}`  
    * Tapping this link on phone or tablet immediately launches WhatsApp to that exact student/parent with the customized message pre-filled. Teacher simply reviews and presses Send (➤).  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **28\. FINALIZED ENQUIRY PRE-ADMISSION ENGINE & INTEGRATION HARDENING**

* **Hardened Security & Fraud Prevention Rules**:  
  * *Two-Stage Referral Escrow Rule (Red Flag 1 Fix)*: When an enrolled student refers a classmate, the referring student receives \+10 CG Coins upon enquiry creation as a nominal token. The remaining \+90 CG Coins (₹90 tuition discount) and the Branded Executive Metal Pen unlock ONLY after the referred lead pays their first month's admission fee.  
  * *Automated Phone Regex Normalizer (Red Flag 2 Fix)*: Every phone number entered via Google Ads, walk-ins, or Telegram is normalized via `=REGEXREPLACE(Raw_Phone, "[^0-9]", "")`, stripping leading zeros or spaces and enforcing the canonical 12-digit format (`91XXXXXXXXXX`) before generating `wa.me` hyperlinks.  
  * *Strict Demo Ledger Isolation (Red Flag 3 Fix)*: Demo students on Day 1/3, 2/3, and 3/3 are tracked strictly within `Inquiry_CRM`. They are completely isolated from `Attendance_Logs` and `Students` master sheets until official admission fees are paid, preventing `#N/A` formula corruption on monthly SWOT receipts.  
  * *Cryptographic 7-Day Kill-Switch (Red Flag 4 Fix)*: Guest practice passes automatically lock on Day 8 at 00:01 AM (`Pass_Expiry = Creation_Time + 168 Hours`), displaying an admission modal to prevent indefinite free-riding on Question Bank and Gemini AI grading.  
  * *Inbound Opt-In Protocol (Red Flag 5 Fix)*: Prioritizes user-initiated chats from Google Business Profile / Google Ads to avoid WhatsApp spam flagging, backed by in-person contact saving during center desk counseling.  
* **Data & Permission Optimization**:  
  * *Public Prospectus CDN Anchor (Yellow Flag 6 Fix)*: 9-Month Master Academic Charter PDF hosted with permanent public read permissions (`export=download`) to eliminate Drive 403 access blocks.  
  * *Composite Lead Key (Yellow Flag 7 Fix)*: Unique identifier formatted as `Mobile_Class` (`98350XXXXX_12`). Re-enquiries update follow-up dates instead of duplicating rows; differing class entries trigger automatic 10% sibling discount flags.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **29\. FINALIZED ADMISSION INTAKE SCHEMA, AUDIT HARDENING & REGIONAL ENHANCEMENTS**

* **Finalized 12-Field Admission Schema**:  
  * *Student Identity*: Full Legal Name (10th marksheet match), Date of Birth, Gender, 12-Digit Aadhaar Number (Verhoeff validated), Student WhatsApp Number (PIN \= last 4 digits).  
  * *Parent Contacts*: Parent/Guardian Name, Primary Calling Number, Parent WhatsApp Number (for receipts/reports), Local Residential Area/Mohalla in Begusarai.  
  * *Academic Mapping*: Class (11/12) & Board (CBSE/BSEB), School/College Name, Class 10 Aggregate Percentage (adaptive baseline), Course Enrolled (Combo ₹1,400 vs Single ₹900), Assigned Batch Slot.  
  * *Conditional Schooling Logic*: Toggle: `Attending (Regular)` vs. `Non-Attending (Dummy/Open)`. If Attending \-\> School Shift Timing (Morning vs. Day); if Non-Attending \-\> field automatically hidden. 5th optional subject permanently eliminated.  
* **Audit Findings & Hardening Fixes (Admission Pipeline)**:  
  * *Hardening Fix 1: Verhoeff 12-Digit Aadhaar Checksum*: In-sheet/in-app validation ensuring invalid or mistyped Aadhaar numbers are flagged instantly before submission.  
  * *Hardening Fix 2: Shared Parent/Student Mobile Number Routing*: If a student uses the same mobile number as their parent, system binds the PIN to that number while establishing a fallback parental verification toggle on receipts.  
  * *Hardening Fix 3: Mid-Session Class/Batch Shift Protocol*: Dedicated operational state machine allowing students to switch between morning and evening batches without creating duplicate attendance rows or breaking historical fee records.  
* **3 Strategic Regional Enhancements (Begusarai Reality)**:  
  * *Enhancement 1: 1-Click WhatsApp Parent Admission Certificate*: Automated branded graphic certificate sent to parents upon admission: "Welcome to Commerce Gyan Family • Roll No: CG-12-015 • Syllabus Finish: 15 Nov Guarantee".  
  * *Enhancement 2: Seasonal Flood & Winter Fog Shift Automation*: 1-tap seasonal batch time adjuster in Teacher Desk (e.g. shifts 06:30 AM batch to 07:30 AM during December/January Bihar fog).  
  * *Enhancement 3: Automated Sibling Phone Matching*: Background `COUNTIF` formula on parent mobile numbers instantly flagging a 10% sibling concession on tuition fee.  
* **Status**: Formally recorded in Master Memory Document. Pure Planning Mode strictly maintained (no code execution).

# **30\. TEACHER DAILY SCHEDULE OPERATIONAL REALITY & UNIFIED AFTERNOON/EVENING BATCH ARCHITECTURE**

* **Founder-Educator Daily Schedule Constraints (Begusarai Reality)**:  
  * *School Commitment (Fixed Daytime Window)*: Gyan Sir teaches at school during the day (morning until \~02:30 PM). Morning coaching batches are permanently abolished.  
  * *Dedicated Offline Coaching Window*: Exclusively active in the afternoon/evening window:  
    * Standard Slot: \~03:00 PM to \~06:30 PM / 07:00 PM (seasonally adjusted for Summer vs. Winter sunset & fog).  
  * *Batch Simplification*: Single dedicated afternoon/evening stream per cohort (Class 11 & Class 12 sequential slots). Eliminates all multi-shift morning/evening batch complexity from ERP.  
* **Attendance & Classroom Operations Subsystem (Hardened for Evening Routine)**:  
  * *30-Second Rapid Roll Call (Teacher Desk Mobile)*:  
    * Default state: All enrolled students pre-toggled to `Present (P)`.  
    * Teacher taps only the 2–3 late or missing students to toggle `Late (L)` or `Absent (A)`. Single tap `Save Attendance` commits to `Attendance_Logs`.  
  * *Enforced Option 2 Recovery Protocol (*`REC-01` *\+* `REC-02`*)*:  
    * Marking a student `Late (L)` or `Absent (A)` automatically attaches today's completed topic ID, GoodNotes PDF, and 2-MCQ recovery drill into their Telegram Mini App profile.  
    * Full attendance credit restored only upon passing the 2-MCQ verification check.  
  * *Phase 1 Parent Policy Strictly Maintained*: Zero automated WhatsApp/SMS alerts to parents for attendance; records remain internal and visible exclusively to students via their Telegram Mini App passbook.  
* **4 Expert Operational Improvements (Tailored to Evening Teaching Window)**:  
  * *Improvement 1: Sunset/Seasonal Auto-Shifter (Summer vs. Winter)*:  
    * Winter (Nov–Feb): Batches shift 30 mins earlier (e.g. 03:00 PM – 05:45 PM) so students return home before dark/fog.  
    * Summer (Mar–Oct): Batches run comfortably until 06:30 PM / 07:00 PM. System updates schedule across Telegram Mini App in 1 tap.  
  * *Improvement 2: Immediate Post-Class Assessment Release Sync (7:00 PM IST)*:  
    * Evening classes concluding between 06:00 PM and 06:45 PM seamlessly hand off to the 07:00 PM Telegram assessment broadcast. Today's concepts remain fresh in students' minds while commuting home.  
  * *Improvement 3: Self-Check Attendance Kiosk Option*:  
    * Digital Board displays a 30-second QR / 4-digit code at the entrance during the first 5 minutes; punctual students tap their presence on the board, saving Gyan Sir 100% of attendance-taking time.  
  * *Improvement 4: "Emergency School Overtime / Meeting" Buffer Protocol*:  
    * If school duties delay arrival past 02:30 PM, teacher taps `[ ⚠️ Delay Class by 20 Mins ]` in Teacher Desk, instantly sending a polite broadcast to the student Telegram channel without frantic phone calls.  
* **Status**: Formally recorded in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **31\. FINALIZED SUBSYSTEM B: ADVANCE MULTI-CADENCE BILLING, LATE PENALTY & TRANSPARENT LEDGER AUDIT**

* **Immediate Multi-Cadence Billing Deployment**:  
  * Activated immediately within the current operational system:  
    * *Monthly Plan*: ₹1,400/mo (3-Subject Combo) \| ₹900/mo (Single Subject).  
    * *Quarterly Advance Plan (3 Months)*: ₹3,999 (₹201 cash savings \+ Free Printed Formula & Ratio Booklet \+ 100 Bonus CG Coins).  
    * *Yearly Full-Session Plan (10 Months)*: ₹12,500 (₹1,500 savings \+ Free Printed 10-Year PYQ Book \+ 5 Board Mock Exam Sets \+ 300 Bonus CG Coins \+ VIP front-row seating).  
  * *Non-Loss Guarantee*: Protects operating income by combining slight monetary discounts with high-perceived-value physical booklets and gamified bonus tokens.  
* **Strict 5% Late Penalty Engine**:  
  * *Billing Due Date*: 5th of every calendar month.  
  * *Penalty Activation*: Automatically calculated on the **6th morning** at **5% of the outstanding due amount** (e.g. 5% of ₹1,400 \= ₹70 penalty).  
  * *Teacher Override*: Retains 1-click teacher waiver (`/waive [Roll_No] 100%`) for genuine family delays.  
* **Two-Tier Interactive Student Journey Ledger**:  
  * *Tier 1 (Executive Summary Card)*: Current month status, net amount due, due date, and latest payment badge.  
  * *Tier 2 (Lifetime History Drawer \- On Click)*: Chronological record detailing: Date, Receipt ID (`CG/26-27/XXXX`), Description, Gross Billed, CG Coins Redeemed, Net Paid, Payment Mode (Cash/UPI), and Lifetime Balance Due.  
* **System Audit Findings & 4 Hardening Fixes (Fee & Billing Engine)**:  
  * *Fix 1: Pro-Rata Advance Mid-Cycle Upgrades*: If a monthly student upgrades to Quarterly on the 20th of a month, the system credits the remaining unutilized days of their current monthly fee against the new ₹3,999 invoice.  
  * *Fix 2: Multi-Child Sibling Advance Stacking Rule*: Prevents compounding error by applying the 10% sibling concession *before* advance payment calculations.  
  * *Fix 3: Anti-Tampering Receipt Hash Verification*: Every PDF receipt includes an encrypted cryptographic validation hash (`SHA256(Receipt_ID + Roll_No + Amount + Date)`) to verify authenticity.  
  * *Fix 4: Cash-to-UPI Auto-Reconciliation for Offline Tutors*: Cash payments logged in Teacher Desk automatically generate a daily cash-in-hand closing balance for Gyan Sir's personal accounting.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **32\. OMNI-CHANNEL PDF EXPORT ENGINE, STUDENT WIN-WIN PSYCHOLOGY & 4-TIER HARDENING DEPLOYMENT**

* **Official Branded Printable PDF Generator Engine**:  
  * *Comprehensive Document Scope*: Every single touchpoint in the student's journey is exportable on-demand as an official, high-resolution vector PDF:  
    * Document 1: Official Admission Confirmation Certificate & Student Identity Card.  
    * Document 2: Individual Payment Receipts (`CG/2026-27/XXXX`) with SWOT Academic Analytics.  
    * Document 3: Lifetime Consolidated Fee Ledger & Tax Passbook (complete chronological statement from Day 1).  
    * Document 4: Monthly Academic Performance & SWOT Report Card.  
    * Document 5: 36-Week Sunday Test Series & Olympiad Score Transcripts.  
  * *Standardized Brand Frame*: Every exported document adheres strictly to the official Commerce Gyan identity:  
    * Top Banner: Heritage Gold crest, formal center address (Begusarai, Bihar), contact details, and mentor signature (Gyan deep Kumar).  
    * Watermark: Subtle diagonal security watermark ("COMMERCE GYAN • BE THE BEST FROM THE REST").  
    * Verification QR: Embedded cryptographic validation hash ensuring authenticity.  
* **Student "Win-Win" Psychological Architecture (Continuous Positive Reinforcement)**:  
  * *The "You Saved & Earned" Transparency Counter*:  
    * Every financial document highlights cumulative student savings: Combo Package Discounts \+ CG Coins Redeemed \+ Early Bird Bonuses.  
    * Students and parents see a concrete metric: *"Total Money Saved at Commerce Gyan: ₹2,450"*.  
  * *Weekly "Personal Best" (PB) Micro-Milestones*:  
    * Regardless of class rank, if an average student improves their score from 50% to 65%, the app celebrates their **Personal Best (PB)** with a gold badge and \+20 bonus CG Coins.  
  * *Monthly Gyan Sir Mentor Voice Note (Personal Attention)*:  
    * Attached directly to their digital fee receipt/passbook, a 30-second personal audio snippet from Gyan Sir acknowledging their effort: *"Rahul, your journal entries in Admission were flawless this month. Keep this momentum for Company Accounts."*  
* **Resolution of Previous Audit Vulnerabilities (Production Hardened)**:  
  * *Fix 1 (Pro-Rata Mid-Month Upgrades)*: Automatically credited and calculated down to the day against the new plan.  
  * *Fix 2 (Sibling Stacking)*: Pre-cadence 10% deduction strictly applied to younger sibling's tuition.  
  * *Fix 3 (Tamper-Proof Receipt Hash)*: SHA256 checksum printed on every receipt PDF with scan-to-verify modal.  
  * *Fix 4 (Daily Cash-in-Hand Reconciliation)*: Teacher Desk closes drawer daily with separate cash vs. UPI ledger commits.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **33\. GEMINI VISION AI UPI SCREENSHOT VERIFICATION & FRAUD-PROOF PAYMENT AUDIT ENGINE**

* **UPI Payment Screenshot Ingestion Engine**:  
  * *Context*: Students/parents frequently share payment screenshots on WhatsApp (PhonePe, Google Pay, Paytm, BHIM, Bank Apps) or show them at the center desk.  
  * *Teacher Workflow*: In Teacher Desk under `Fee Entry`, Gyan Sir uploads the student's shared payment screenshot (or snaps a photo of their phone screen).  
* **Automated Gemini 1.5 Flash Multimodal OCR Extraction**:  
  * The image is processed server-side via Gemini 1.5 Flash Vision.  
  * Extracts with 100% precision:  
    * `UPI_Transaction_ID` / `UTR_Number` (12-digit standardized bank reference number, e.g., `4311XXXXXXXX`).  
    * `Exact_Amount_Paid` (e.g., `₹1,400.00`).  
    * `Payment_Timestamp` (Date and time of transaction, e.g., `05 Nov 2026, 06:42 PM`).  
    * `UPI_App_Source` (PhonePe, Google Pay, Paytm, Cred, BHIM, NetBanking).  
    * `Recipient_VPA_Match` (Verifies payment was credited to Gyan Sir's official VPA / Commerce Gyan UPI QR, e.g., `commercegyan@okaxis` or registered merchant account).  
* **Anti-Fraud & Anti-Tampering Security Safeguards**:  
  * *Rule 1: Duplicate UTR Detection Engine*:  
    * The extracted 12-digit UTR is immediately queried across the entire historical `Fee_Ledger`.  
    * If that UTR already exists in another student's record or a previous month, the system instantly throws a **CRITICAL RED FRAUD WARNING**: `🚨 DUPLICATE UTR DETECTED: This transaction ID was already logged on 02 Oct by [Student Roll No]. Payment rejected.`  
  * *Rule 2: Photoshop / Tamper Anomaly Detection*:  
    * Gemini Vision analyzes font rendering, pixel alignment, and digital artifacts around the amount and date fields.  
    * If mismatched fonts, edited text layers, or manipulated numbers are detected, it flags: `⚠️ WARNING: Image shows signs of digital editing or altered text. Manual verification required.`  
* **1-Tap Verified Ledger Commit**:  
  * Once extracted and verified, the Teacher Desk screen displays the parsed details: `[Verified UTR: 431189201942] • [Amount: ₹1,400] • [Source: PhonePe] • [Time: 05 Nov 18:42]`  
  * Teacher taps **`✅ Confirm & Issue Receipt`**:  
    * Automatically logs payment row into `Fee_Ledger`.  
    * Stores the uploaded screenshot in a secure Drive audit folder: `00_Commerce_Gyan_Master_Hub/05_Payment_Screenshots/[Roll_No]/`.  
    * Generates and dispatches the official **SWOT Smart Receipt PDF** (`CG/2026-27/XXXX`) to student & parent WhatsApp within 5 seconds.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **34\. EXTENSIBLE FEE CATALOG, IMMUTABLE REVERSAL PROTOCOL & AUDIT-PROOF ACCOUNTING**

* **The Extensible Key-Value Fee Catalog Engine (`CONFIG_FEE_SETTINGS`)**:  
  * *Dynamic Charge Structure*: Zero hardcoded prices. Every fee item, tuition rate, registration amount, study material kit, and future add-on is maintained as a structured row: `[Charge_Code | Charge_Display_Name | Amount_INR | Cadence | Active_Status]`.  
  * *Anti-Breakage Engineering*: Formulas and Apps Script query charges using `INDEX/MATCH` on `Charge_Code` (never fixed cell coordinates like B4). Gyan Sir can add new rows, reorder items, or change amounts at any time with 0% risk of breaking code or formulas.  
  * *Automatic Number Sanitization*: Handles currency symbols and commas (e.g. `₹ 1,400 /-` or `1,400.00` cleanly parsed to `1400`).  
* **Immutable Financial Ledger & The Strict Reversal Protocol**:  
  * *Strict Anti-Alteration Rule*: Once an entry is logged in `Fee_Ledger`, it is **NEVER EDITED, OVERWRITTEN, OR DELETED**. Overwriting corrupts bank reconciliations and audit integrity.  
  * *Standard Reversal Workflow (When Mistake Occurs)*:  
    * Example: Gyan Sir accidentally records ₹200 instead of ₹1,500, or miscounts cash.  
    * Step 1 (Trigger Reversal): Teacher clicks `[ ↩️ Reverse Payment ]` on that transaction in Teacher Desk or sheet.  
    * Step 2 (Mandatory Reason Logging): Teacher selects/enters the correction reason:  
      * `TYPO_CORRECTION` (e.g., "Entered ₹200 by mistake instead of ₹1,500").  
      * `MISCOUNT_CORRECTION` (e.g., "Cash miscounted during desk rush").  
      * `DUPLICATE_ENTRY_ERROR` (e.g., "Logged twice in error").  
      * `STUDENT_CHANGE_MIND` / `REFUND`.  
    * Step 3 (Offsetting Ledger Entry): System generates an automatic offsetting debit/credit row: `REV-YYYY-XXXX | Amount: -₹200.00 | Reversal_Of: PAY-YYYY-XXXX | Reason: Typo correction | Created_At: Timestamp`.  
    * Step 4 (Original Receipt Voiding): Original receipt `CG/26-27/0042` status changes to `VOID_REVERSED`.  
    * Step 5 (Correct Entry Posting): Teacher enters the correct transaction (₹1,500), generating a clean, fresh sequential receipt `CG/26-27/0043` with correct balance and notes.  
* **Student Transparency & PDF Ledger Statement Update**:  
  * The student's digital passbook and printable PDF statement clearly show both the reversal and the new receipt in sequence, ensuring 100% accounting transparency and zero confusion between teacher, student, and parents.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **35\. FINALIZED CROSS-SPOKE HARDENING & ADDITIONAL FEE/RETENTION POLICIES**

* **Finalized Fee Policies (Discovered from Workspace & Confirmed)**:  
  * *First-Month Mid-Session Proration*: Formula `Monthly_Fee * ((Total_Days - Joining_Day + 1) / Total_Days)` automatically bills only active remaining days for mid-month enrollments; standard monthly billing starts on the 1st of the following month.  
  * *Board-Specific Cell-Editable Pricing (*`CONFIG_FEE_SETTINGS`*)*: Separate manual cell rows for CBSE vs. BSEB single and combo plans.  
  * *Mid-Session Subject Transitions*: Upgrades (Single \-\> Combo) activate immediately with pro-rata top-up and unlock full Telegram AI/Vault access. Downgrades (Combo \-\> Single) apply strictly on the 1st of the next billing cycle and revoke VIP AI features.  
  * *Student Discontinuation Stop-Billing*: Setting `Status = Left` and `Leaving_Date` immediately freezes future monthly invoice generation.  
  * *In-App Loss-Aversion Warning & 30-Day Coin Forfeiture*: Fee-pending students see a live countdown to the 6th (5% penalty) and 15th (pass pause). Coins freeze on Day 16 and permanently forfeit (reset to 0\) on Day 31 of default.  
* **6 Cross-Spoke Hardening Fixes (Approved & Locked)**:  
  * *Fix 1 (Physical vs. Digital Sync on Fee Pause)*: Fee-paused students (Day 16+) show a `[⚠️ Fee Paused]` badge in the Teacher Desk attendance list; physical `Present` attendance is recorded for accuracy, but CG Coin earning remains locked until dues are cleared.  
  * *Fix 2 (1-Tap SIM/Phone Re-Bind)*: Teacher Desk includes a `🔄 Reset Device & Update Phone` action that updates the student's mobile number, recalculates their last-4-digit PIN, and unbinds the old `Telegram_User_ID`.  
  * *Fix 3 (Milestone Test Buffer Backfill)*: If syllabus drift delays a subtopic before a 50-mark Sunday test, untaught marks are automatically backfilled with high-yield revision questions from previously completed chapters so total test marks never shrink.  
  * *Fix 4 (Digital Board 1-Tap Force Sync)*: Top-right `🔄 Sync` button on `?view=board` overrides morning PWA cache whenever Gyan Sir changes a topic mid-afternoon.  
  * *Fix 5 (Combo Exit Session Toggle)*: Digital Board exit drill shows a dual swipe toggle (`[📗 Accounts Exit] | [📘 BST Case-Study]`) for seamless back-to-back subject drills.  
  * *Fix 6 (Protected OBS Pause Hotkey)*: Maps OBS pause/unpause \+ flashing red border alert to `Shift + Space` (or double-tap Space) to prevent accidental desk bumps during live teaching.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **36\. RECOVERED 10-DAY CHAT MEMORY & ZERO-CRASH SYSTEM RELIABILITY ARCHITECTURE**

* **Recovered Technical & Operational Rules from Past 10 Days of Chats (`c_156d3ad00b1ea40b` & `c_acefcd67a2c7265e`)**:  
  * *Rule 1: Client-Side HTML5 Canvas Image Auto-Compression (Token & Bandwidth Guard)*:  
    * Before any student register photo or UPI screenshot leaves the mobile browser, an asynchronous HTML5 `<canvas>` script resizes the image to **max `1280px` width at `70%` JPEG quality**.  
    * Shrinks 5–9 MB mobile camera photos down to **`~200KB–250KB` in under 200ms**, capping Gemini 1.5 Flash Vision consumption at strictly **`~258 image tokens` per page** (`~1,058 total tokens` including rubric/output) so daily usage stays 100% within Google AI Studio's free tier (`1,500 RPD`) with zero `413 Payload Too Large` errors.  
  * *Rule 2: Server-Side Gemini API Key Proxy & Graceful Fallback*:  
    * `GEMINI_API_KEY` is stored strictly in Apps Script `PropertiesService` (never exposed in client HTML). If Google AI ever hits a temporary rate limit or outage, the backend automatically falls back to *"Submission logged for teacher review (+30 pts)"* so student streaks never break.  
  * *Rule 3: Localized withLock\_ Write-Only Concurrency*:  
    * `LockService.getScriptLock()` (`5,000ms` wait) wraps *only* row-write operations (`appendRow` / `setValue`), keeping all read queries and JSON parsing 100% lock-free.  
  * *Rule 4: Persistent localStorage Session \+ Telegram\_User\_ID Hardware Binding (`APP-033`)*:  
    * Verified student credentials persist in `localStorage.getItem('cg_student_session')` and bind `1 Roll_No = 1 Telegram_User_ID` (`initDataUnsafe.user.id`), eliminating re-login prompts while blocking account sharing on non-enrolled phones.  
  * *Rule 5: 3-Layer Anti-Piracy & Video Telemetry (`APP-023`–`APP-027`)*:  
    * `>=90%` watch-gate with 30-second heartbeats before unlocking `REC-01` recovery quizzes, High-Rewind Concept Heatmap (`>50%` students rewinding the same 2-minute segment flags the concept for class review), 2-device fingerprint lock, and `>3` IPs/hour fraud alert.  
  * *Rule 6: Morning 8:00 AM AI Hook Brief & 30-Min Pre-Class Defaulter/Weak-Scorer Brief (`SYL-019` & `SYL-020`)*:  
    * 8:00 AM Telegram brief delivers today's teaching hook/example from Notion; 30 minutes before batch time, delivers yesterday's 3 lowest quiz scorers to call on in class \+ active batch fee defaulters.  
  * *Rule 7: Concessions, Stackable 30% Cap & 2:00 AM Automated Backup (`ERP-061`, `ERP-062`, `ERP-085`)*:  
    * Supports Army/Martyr/EWS concession (`Deferred to Phase 2` toggleable in config), enforces a hard **30% maximum total discount cap** when stacking Sibling/Group/Merit concessions, and runs an automated **2:00 AM nightly database snapshot** to Google Drive.  
* **Round-2 Behavioral Loophole Fixes (Locked)**:  
  * *Loophole 7 Fix (T+1 Solution Copy-Paste Cutoff)*: Once the T+1 model solution unlocks (24h after drill release), pending backlog submissions switch to `Revision Mode (0 CG Coins / 0 Leaderboard Points)`—clearing the red pending pill for attendance compliance without awarding competitive points.  
  * *Loophole 8 Fix (Handwritten Roll-No Header \+ Image Fingerprint)*: Students must write their `Roll_No` and `Date` in pen at the top-right of every register page; Gemini Vision verifies the handwritten `Roll_No` matches the logged-in student, and perceptual image hashing blocks duplicate photos across the batch.  
  * *Loophole 9 Fix (Power-Cut Mobile Fallback for 75" Board)*: Teacher Desk includes `📱 Broadcast Exit Drill to Phones / iPad` so if Begusarai power cuts out during the last 10 minutes, exit questions push directly to student phones and the iPad M3.  
  * *Loophole 10 Fix (Zero Base64 in Sheets \+ 60-Day Drive Auto-Purge)*: Register photos save as compressed JPEGs in a Drive folder (`06_Register_Uploads/[Month]/`) with only the `Drive_File_ID` stored in Sheets; routine homework images older than 60 days auto-purge to protect Google Drive's 15GB free quota.  
  * *Loophole 11 Fix (Frozen Clock on Day-29 Fee Extension)*: Granting a teacher promise-date extension pauses the 30-day coin forfeiture timer rather than resetting it to Day 1; if unpaid by `Promise_Date + 1`, Day-31 forfeiture executes immediately.  
  * *Loophole 12 Fix (Strict 1-Device Telegram ID Lock)*: Enforces `APP-033` hardware binding until Gyan Sir explicitly taps `🔄 Reset Device` in Teacher Desk.  
* **Zero-Crash Cross-System Reliability Architecture (Locked)**:  
  * *Crash Safeguard 1 (6:55 PM RAM Pre-Warm via CacheService)*: Pre-loads tonight's Class 11 & 12 drill JSON into `CacheService` at 6:55 PM so 100 simultaneous student opens at 7:00 PM read from memory in \~10ms without hitting Apps Script's 30-concurrent-read ceiling.  
  * *Crash Safeguard 2 (Dual Gemini API Key Rotation \+ 4s Auto-Retry)*: Rotates across `GEMINI_API_KEY_1` and `GEMINI_API_KEY_2` in `ScriptProperties` (30 RPM capacity) with client-side exponential backoff.  
  * *Crash Safeguard 3 (Single-Sheet Student Snapshot Bridge)*: Syncs active `Canonical_Topic_ID` and today's approved question package into a local snapshot tab inside the primary ERP sheet so student requests never call `openById()` across multiple workbooks.  
  * *Crash Safeguard 4 (Just-In-Time On-Demand PDF Watermarking)*: Stamping student Roll Numbers onto PDFs occurs on-demand when a student taps download (0.8s) rather than looping 100 PDFs at 7:00 PM (avoiding the 6-minute execution limit).  
  * *Crash Safeguard 5 (Rolling 30-Day Active Logs \+ Pre-Computed Student Totals)*: Running totals (`Attendance_%`, `CG_Coins`, `14_Day_Grid_JSON`) live directly on the 100 rows of `Students_Master`, while raw logs older than 60 days compact into a cold archive workbook.  
  * *Crash Safeguard 6 (Atomic Single-Row Coin Redemption)*: Coin redemptions are recorded atomically inside the `Fee_Ledger` payment row (`Coins_Redeemed`), and live balance is derived via `Total_Earned - SUM(Valid_Redeemed)` so mid-network drops never vanish coins.  
  * *Crash Safeguard 7 (Header-Locked Formulas \+ 2:00 AM Nightly Backup)*: Uses script-computed values and header-locked `ARRAYFORMULA`s so manual row edits never shift cell references.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **37\. FINALIZED TELEGRAM IN-APP YOUTUBE LMS CINEMA & PRODUCTION CRASH HARDENING**

* **Telegram Mini App YouTube In-App LMS Cinema (`APP-023` & `NYT-013`)**:  
  * *Zero-Bounce Native Playback*: Public and unlisted videos from the official "Commerce with Gyan" YouTube channel play directly inside the Telegram Mini App webview container via the official YouTube IFrame Player API (`enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3`).  
  * *Distraction-Free Environment*: Suppresses external related video recommendations, keeping students focused purely on the lecture. Supports 1x, 1.25x, 1.5x, 2x playback speeds, landscape orientation, and interactive chapter jump timestamps.  
  * *Real-Time Telemetry & Watch-Gate*: JavaScript events monitor playback duration (`getCurrentTime() / getDuration()`). Reaching `>=90%` completion automatically unlocks the `REC-01` 2-MCQ recovery drill and credits `+10 CG Coins` to the student's wallet.  
  * *Live Companion Drawer*: Displays the synchronized GoodNotes lecture PDF download button and practice questions directly beneath the video player.  
* **Round-2 Behavioral Loophole Hardening (Formally Locked)**:  
  * *Loophole 7 (T+1 Solution Cutoff)*: Once the T+1 model solution unlocks at 24 hours, backlog homework submissions switch to `Revision Mode (0 CG Coins / 0 Rank Points)`.  
  * *Loophole 8 (Handwritten Header & Anti-Cheating)*: Students must write `Roll_No` and `Date` in ink on the top-right of every register page; Gemini Vision verifies the handwritten roll number and perceptual image hashing blocks duplicate photos across the batch.  
  * *Loophole 9 (Power-Cut Mobile Fallback)*: Teacher Desk includes `📱 Push Exit Drill to Phones / iPad` for seamless continuation during Begusarai power cuts.  
  * *Loophole 10 (Zero Base64 in Sheets & 60-Day Drive Purge)*: Register photos are stored as 200KB JPEGs in a dedicated Drive folder (`06_Register_Uploads/[Month]/`) with only the file link logged in Sheets; routine homework older than 60 days auto-purges.  
  * *Loophole 11 (Frozen Clock on Day-29 Fee Extension)*: A teacher promise-date extension pauses the 30-day coin forfeiture timer rather than resetting it; Day-31 forfeiture executes if unpaid by `Promise_Date + 1`.  
  * *Loophole 12 (Strict 1-Device Telegram Lock)*: Enforces `1 Roll_No = 1 Telegram_User_ID` hardware lock to prevent account sharing with outside students.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **38\. MASTER ATTENDANCE OPERATIONAL SUBSYSTEM & HARDENED CLASSROOM ROLL CALL ENGINE**

* **Context & Operational Reality (Begusarai Center)**:  
  * Solo founder: Gyan Sir conducts sequential afternoon/evening batches (Class 11: \~03:00 PM to 04:45 PM; Class 12: \~04:45 PM to 06:30/06:45 PM).  
  * Attendance must take under 30 seconds of teacher time per batch, zero cognitive load, and zero paper registers.  
* **The 3 Multi-Modal Roll Call Methods (Teacher Flexibility)**:  
  * *Method 1: 20-Second Rapid Mobile Roster (In-App Teacher Desk — Primary)*:  
    * Teacher opens Telegram Mini App Teacher Desk \-\> Taps `📅 Attendance`.  
    * Screen pre-fills all enrolled students in that batch as **`Present (P)`** with green cards by default.  
    * Teacher taps only the 2 or 3 absentees: 1 tap turns card red (`Absent - A`), 2 taps turns card amber (`Late - L`).  
    * Tapping **`💾 Commit Attendance`** writes to `Attendance_Logs` in under 20 seconds.  
  * *Method 2: 60-Second Digital Board Self-Check-In Kiosk (Entrance Touchscreen)*:  
    * During the first 5 minutes of class (03:00–03:05 PM / 04:45–04:50 PM), Digital Board displays an interactive name tile grid.  
    * Students tap their name/roll card as they enter; card turns emerald green (`Checked In ✅`).  
    * At 03:05 PM, teacher glances at un-tapped tiles, taps `Lock & Commit`, saving 100% of teacher roll call effort.  
  * *Method 3: 1-Tap Offline Physical Register Backup*:  
    * If Digital Board is off and phone battery is low, teacher marks paper checklist; taps `Bulk Update` on desktop later.  
* **Attendance Status Hierarchy & Downstream Automation**:  
  * *Status P (Present)*: Confirms on-time physical attendance \-\> Credits `+2 CG Coins` to student wallet \-\> Adds \+1 to continuous daily streak.  
  * *Status L (Late Arrival \- Arriving \>10 mins late)*:  
    * Awards `+1 CG Coin`.  
    * Automatically assigns **`REC-01` 2-MCQ Topic Recovery Drill** \+ lecture notes review in the student's Telegram Mini App to verify the missed opening concepts.  
    * Records exact late entry timestamp internally for monthly reports.  
  * *Status A (Absent \- Physical Non-Attendance)*:  
    * Awards `0 CG Coins`; breaks active attendance streak.  
    * Unlocks the **`REC-01` Recovery Task**: requires student to watch the unlisted class lecture in the Commerce Gyan Play Store App (`>=90%` watch-gate) \+ pass the 2-MCQ check to restore recovery credit.  
* **Phase 1 Parent Notification & Privacy Rule (Strictly Maintained)**:  
  * ZERO automated WhatsApp/SMS alerts sent to parents for single daily absences or late arrivals.  
  * Monthly attendance percentage (`P / L / A` counts) is printed transparently on the official **SWOT Smart Fee Receipt** delivered to parents on fee payment.  
  * *Safety Exception*: Only if a student is marked Absent for **3 consecutive days** without prior leave, system triggers a private notification to Gyan Sir: `[ 📞 Call Parent of Absent Student ]`.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **39\. REFINED ATTENDANCE POLICY: MANUAL IN-APP ROSTER & 3-DAY ABSENCE ALARM**

* **Confirmed Teacher Roll Call Method**:  
  * *Method 1 Confirmed & Locked*: Rapid In-App Mobile Roster inside the Telegram Mini App Teacher Desk.  
    * All enrolled students pre-set to `Present (P)` by default.  
    * Teacher taps only the 2–3 late or missing students to mark `Late (L)` or `Absent (A)`.  
    * Single tap `Save Attendance` commits to `Attendance_Logs` in under 20 seconds.  
  * *Digital Board Kiosk Eliminated*: Board-based self-check-in (Method 2\) and physical paper backup (Method 3\) are permanently dropped to keep classroom operations simple and unified inside the teacher's phone.  
* **Parent Privacy & Monthly Fee Integration**:  
  * Zero daily SMS or WhatsApp alerts to parents under any circumstance during Phase 1\.  
  * Monthly attendance percentage and full `P / L / A` breakdown are printed directly on the official **SWOT Smart Fee Receipt** delivered to parents upon fee payment.  
* **3-Day Consecutive Absence Teacher Alert**:  
  * If any student is marked `Absent (A)` for **more than 3 consecutive days** without an approved leave note, the system triggers a private high-priority alert to Gyan Sir's personal Telegram: `🚨 3-DAY ABSENCE ALERT: [Student Name - Roll No] has been absent for 4 consecutive classes. Tap to call parent directly.`  
  * Allows Gyan Sir to personally check on the student's safety and well-being without automated robot messages.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **40\. MASTER NOTION OS RECONCILIATION & QUICK-CAPTURE TELEGRAM SECOND-BRAIN PIPELINE**

* **Notion Master Workspace Architecture Reconciled**:  
  * *Discovered Notion System State*: Reconciles Gyan Sir's [Commerce With Gyan Master OS](https://app.notion.com/p/Commerce-With-Gyan-Master-OS-3ed13c0557d881198333e62ecc7207bd) and Drive master assets ([Class suite \- 8 Notion classroom planner](https://drive.google.com/file/d/1NCmnt_a6t1ZrB-6zKmqJiWRCw0o-f0d_/view) & [Commerce Gyan — Option 1B Master Integrated Sheet](https://docs.google.com/spreadsheets/d/1_sN2WUzGhyc6hPKUqAI6PNFFoahjkToOKNm_vNk4PL8/edit)).  
  * *Core Integrated Databases in Master OS*:  
    * Database 1: `Subjects_DB` (Accountancy, BST, Economics, Statistics across Class 11 & 12).  
    * Database 2: `Chapters_DB` (All 71 Chapters mapped to Drive Folders & NotebookLM URLs).  
    * Database 3: `Topics_DB` (797 Canonical Topics with completion rollups and GoodNotes links).  
    * Database 4: `YouTube_Videos_DB` (Central YouTube Course & Shorts Dashboard: To Script \-\> Filming \-\> Editing \-\> Uploaded \-\> Published).  
    * Database 5: `Question_Bank_DB` (Filter by MCQ, Short, Long, PYQ linked to chapters).  
    * Database 6: `Teaching_Hooks_Vault` (Instagram/YouTube reel ideas, real-world commerce case studies, and common accounting traps).  
* **Option A Confirmed: "Quick-Capture Telegram Second-Brain Bot"**:  
  * *The Mobile Capture Flow*:  
    * Step 1: While browsing Instagram Reels or YouTube Shorts on mobile, Gyan Sir taps `Share via Telegram` \-\> sends link to his private personal `Commerce Gyan Brain Bot`.  
    * Step 2: Bot reads video caption/metadata via Gemini in 2 seconds and asks exactly **1 quick interactive tap question**: `"Where should I tag this? [ 📘 Accountancy ] [ 📙 Business Studies ] [ 📗 Economics ]"`  
    * Step 3: Gyan Sir taps the subject button \-\> Bot automatically maps the concept, tags the chapter, and logs it directly into Notion under `Teaching_Hooks_Vault` without opening the Notion app.  
  * *The 2-Month Resurface Cycle*:  
    * When the `02_Syllabus_Planner` reaches that specific topic 2 months later, the morning 8:00 AM Telegram briefing automatically surfaces the saved reel link: `"💡 Remember that Shark Tank Reel you saved on 6th Nov? Use it today to explain Issue of Shares at Premium!"`  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **41\. FINALIZED NOTION MASTER OS QUICK-CAPTURE & 8:00 AM HOOK RESURFACE ARCHITECTURE**

* **Option A Telegram Capture Bot Pipeline Confirmed**:  
  * *Capture Stage*: While watching Instagram Reels or YouTube Shorts on mobile, Gyan Sir taps `Share` \-\> selects personal `Commerce Gyan Brain Bot` on Telegram.  
  * *1-Question Classification*: Bot reads video caption/metadata via Gemini and asks exactly 1 interactive question: `Where should I file this? [ 📘 Accountancy ] [ 📙 Business Studies ] [ 📗 Economics ]`.  
  * *Direct Deposit into Notion Master OS*: Tapping the subject button automatically deposits a clean card into the `📥 Inbox` / `🧠 Knowledge` database in Gyan Sir's [Commerce With Gyan Master OS](https://glistening-penguin-d1c.notion.site/Commerce-With-Gyan-Master-OS-3ed13c0557d881198333e62ecc7207bd) without creating duplicate databases or violating the Master OS single-record rule.  
  * *2-Month Classroom Payoff (8:00 AM Morning Resurface)*: When `02_Syllabus_Planner` reaches that specific topic months later, the morning 8:00 AM Telegram brief automatically pulls the saved reel link, 2-line AI summary, and suggested opening hook so Gyan Sir has an engaging real-world story ready for class.  
* **Notion Link Sharing Protocol Clarification**:  
  * Re-pasting the exact same URL does not change access permissions if the child databases remain stored as private root mentions.  
  * The architectural audit was completed successfully by cross-referencing the master root page and Drive blueprints.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **42\. FULL-SCALE NOTION MASTER OS AUDIT & CROSS-SYSTEM SYNCHRONIZATION BLUEPRINT**

* **Audit Origin & Database Scope**:  
  * Live technical audit of `Commerce With Gyan Master OS` dated 06 November 2026\.  
  * Confirmed 14 Canonical Backend Databases inside `🗄️ System Databases`:  
    * 1\. 🚀 `Master Projects` (`35dbbe80246b468fa52e415c3acf1a7c`)  
    * 2\. ✅ `Master Tasks` (`2b6912e4e0a3420ebc7b19ee0af19e6f`)  
    * 3\. 📚 `Master Curriculum` (`f5347166dd5741808c0500de1a27af73`)  
    * 4\. 🧑‍🏫 `Teaching Sessions` (`b5ca594ff5964d47ab0e0d04f71b3b2f`)  
    * 5\. 🎥 `Content Pipeline` (`13215f5cc8054bfea0f19a09cfca4308`)  
    * 6\. 📖 `Publications` (`12c5296170f8445287e5152bbc1cea82`)  
    * 7\. 🧠 `Knowledge & Resources` (`bbfda7d2e8aa46d3bf424af63316b4e1`)  
    * 8\. 🤖 `AI Workflows` (`f0e1540e4c184ae095450f9c381d4ab3`)  
    * 9\. 📈 `Learning` (`0beae7b038294afcae46c4693ee11729`)  
    * 10\. 🎯 `Goals` (`94bbc4dabc6a45918c7b064eed6095ed`)  
    * 11\. 🔎 `Reviews` (`a20fa035ad4046c797b4154614aafa8e`)  
    * 12\. 📥 `Capture Inbox` (`4cfb0d4942004600b8639b223b0b8a03`)  
    * 13\. 📝 `Assessment & Question Bank` (`2d1d6cefb71b4781bdef9a4bd84d9143`)  
    * 14\. 🔗 `Platform Map` (`a23042545e2e4ca6a297f774150cb953`)  
* **Strict Canonical Key Enforcement**:  
  * Universal key: `C<Class>-<SUBJECT>-B<Book/Part>-CH<Chapter>-T<Topic>-S<Subtopic>` (e.g. `C12-BST-B2-CH09-T01-S01`).  
  * Identical identifier must be preserved across Google Sheets `Topic_Master`, Notion `Master Curriculum`, Notion `Platform Map`, GoodNotes exports, and Drive folders.  
* **Three-Status Independence Rule (Crucial Architecture Guardrail)**:  
  * In `Master Curriculum`, three status properties are independent and must NEVER be merged into a single field:  
    * `Status`: Academic syllabus progression (`Not Started`, `In Progress`, `Covered`, `Revision`).  
    * `Coaching Status`: Actual physical classroom execution at Begusarai center (`Not Started`, `In Progress`, `Covered`, `Revision`).  
    * `YouTube Status`: Video production lifecycle (`Not Planned`, `Idea`, `In Production`, `Published`).  
* **Resolution of 4 Major Audit Gaps**:  
  * *Gap 1 (Telegram Delivery Ownership)*: Notion `Platform Map` has zero Telegram columns. Kept deliberately clean; all Telegram channel IDs, message IDs, and delivery states remain strictly inside Google Sheets ERP.  
  * *Gap 2 (Class 12 BST Reference Implementation Reconciliation)*: Reconciles 12 core chapters (`126 topic records`). Chapters 1–8 have generic `Status = Covered` but `Coaching Status = Not Started`. System requires teacher evidence confirmation before syncing to coaching completion.  
  * *Gap 3 (YouTube Content Pipeline Mapping)*: 12 chapter-control records in `Content Pipeline` (`12 BST Ch 01 — YouTube Chapter Control` to `Ch 12`). Published YouTube URLs will populate only upon live upload, feeding into the Telegram Mini App LMS player.  
  * *Gap 4 (Telegram Quick-Capture Destination)*: Confirmed target database: `📥 Capture Inbox` (`4cfb0d4942004600b8639b223b0b8a03`) with properties `Type Guess = Resource`, `Status = Inbox`, `Context`, and `Source URL`.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **43\. CLASS 12 BST REFERENCE IMPLEMENTATION ROLLOUT & MULTI-SUBJECT EXPANSION PROTOCOL**

* **Class 12 BST Reference Implementation State Reconciled**:  
  * *Location & Scope*: Built as the foundational reference model in `Commerce With Gyan Master OS`, utilizing filtered views of canonical databases (`Master Curriculum`, `Teaching Sessions`, `Content Pipeline`, `Assessment & Question Bank`).  
  * *12 Core Chapters Confirmed (126 Canonical Subtopic Records)*:  
    * Part A (Principles & Functions): Ch 01 Nature of Management (14 topics), Ch 02 Principles of Management (23), Ch 03 Business Environment (10), Ch 04 Planning (7), Ch 05 Organising (10), Ch 06 Staffing (8), Ch 07 Directing (11), Ch 08 Controlling (6).  
    * Part B (Business Finance & Marketing): Ch 09 Financial Management (11 topics), Ch 10 Financial Markets (8), Ch 11 Marketing (10), Ch 12 Consumer Protection (8).  
    * Two enrichment records: Cross-cutting themes & Project Work.  
  * *Current Status Discrepancy Resolved*: Chapters 01–08 show generic `Status = Covered` but `Coaching Status = Not Started` and `YouTube Status = Not Planned`. Chapter 09 shows `Curriculum Status = In Progress` and `Content Pipeline = Slides / Notes`.  
* **How Class 12 BST Operates Going Forward (The 8-Stage Chapter Rollout Blueprint)**:  
  * Every chapter follows this strict, un-compromised production sequence before close-out:.  
* **The Multi-Subject Expansion Strategy (The 1-by-1 Cloning Protocol)**:  
  * *The Architectural Rule*: Do NOT create new databases for Accountancy or Economics.  
  * *The 7 Remaining Core Commerce Subjects*:  
    * Class 12: Accountancy (109 topics), Macroeconomics (61 topics), Indian Economic Development (84 topics).  
    * Class 11: Accountancy (117 topics), Business Studies (102 topics), Microeconomics (62 topics), Statistics (134 topics).  
  * *How Expansion Works (Zero Data Duplication)*:  
    * Simply populate the 797 preloaded Canonical Topic IDs into the existing 📚 `Master Curriculum` database (`f53471...`).  
    * Create linked, filtered dashboard views inside 🎓 `Teach` and 🎬 `Create` for each subject (e.g. Filter: `Level = Class 12` AND `Subject = Accountancy`).  
    * Benefit: Keeps the entire 8-subject coaching institute running on the same 14 clean master databases with zero spreadsheet or Notion clutter.  
* **Status**: Formally confirmed by Gyan Sir and locked in Master Project Memory. Pure Planning Mode strictly maintained (no code execution).

# **44\. NOTION DUAL-ENGINE ARCHITECTURE — THE "WRITE ONCE, MONETIZE TWICE" CONTENT FLYWHEEL & YOUTUBE INCOME ENGINE**

## **1\. Architectural Realignment & Operational Intent**

* **Primary System Role**: Notion Master OS is formally designated as the **YouTube Content Engine, Video Production Pipeline, and Creative Monetization Hub** for *Commerce with Gyan*, while seamlessly acting as the single preparation ground for offline coaching lectures at *Commerce Gyan* (Begusarai).  
* **Deprecation of Dummy Statuses**: Fields such as `Status = Covered` or `Coaching Status = Not Started` inside Notion databases are formally acknowledged as dummy template placeholders. Operational syllabus completion, student attendance, and fee tracking remain strictly anchored in the Google Sheets ERP ecosystem (Syllabus Planner `1TzmB1Ehyb7JwdY0phx-LzB4t-Kq2Z-Tw1m8YPrguCa4` and ERP Core `1Muw7PEocEQjdXSlwMBCiFVrCtAu-HYJk0fXi1AblUhc`).  
* **Core Philosophy**: "Write Once, Monetize Twice" — Every piece of curriculum content, numerical breakdown, or business studies case study scripted once in Notion must immediately feed both offline classroom delivery and digital revenue generation without redundant administrative prep.

## **2\. The 4-Stage Content Multiplier Flywheel**

* **Stage 1 — Notion Deep-Dive Scripting (Spoke 7\)**:  
  * Gyan Sir authors a structured concept outline, mnemonic framework, or board-exam case study breakdown inside Notion's `🎬 Video Planner & Scripts` database using the universal topic key (`C12-BST-B2-CH09-T01-S01`).  
  * Contains three distinct sub-blocks: (a) 60-second Hook/Intro for video, (b) Comprehensive Board Theory & Working Notes for lecture, and (c) Board Exam Trap Alerts & 1 MCQ Drill.  
* **Stage 2 — Offline Classroom Delivery (Spoke 6\)**:  
  * The scripted concept is taught during the afternoon/evening offline batch (3:00 PM – 6:30 PM) on the physical blackboard / GoodNotes iPad M3 setup in Begusarai.  
  * Student interactions, real classroom questions, and live problem-solving validate the clarity and pacing of the concept notes.  
* **Stage 3 — YouTube Long-Form Video Production (Spoke 8\)**:  
  * Recorded cleanly via iPad M3 \+ OBS Studio (or standalone studio take) with standardized `Shift + Space` synchronous audio-video pause hotkey.  
  * Uploaded as a 15–20 minute polished concept lecture to *Commerce with Gyan*, driving organic search traffic for CBSE/BSEB Class 11 and 12 Commerce.  
* **Stage 4 — Short-Form Viral Distribution & Capture (Spoke 3 & Telegram)**:  
  * High-yield 60-second segments (exam traps, journal entry mnemonics, quick-fire formulas) are clipped as YouTube Shorts and Instagram Reels (`@CommerceWithGyan`).  
  * Viral hooks and competitor ideas spotted on mobile are funneled into Notion's `📥 Capture Inbox` via the Telegram Quick-Capture Bot.

## **3\. 3-Tier Digital Income Generation Architecture**

* **Tier 1 — YouTube AdSense & Algorithmic Discovery**:  
  * Evergreen Class 11 & 12 Accountancy, BST, and Economics video catalogue builds consistent long-tail ad revenue and pan-India subscriber growth.  
* **Tier 2 — Digital Booster Pass Monetization (₹499 / Subject)**:  
  * Viewers from Bihar and across India convert from free YouTube watchers into paying digital students, unlocking access to the Telegram LMS Cinema (zero-distraction embedded viewing), App Question Vault, and DPP Model Solutions.  
* **Tier 3 — Begusarai Offline Enrollment Funnel**:  
  * High-production digital authority cements unbeatable local market dominance in Begusarai, converting local student viewers into premium walk-in admissions for the offline ₹1,400/month 3-subject combo.

## **4\. Canonical Notion Workspace Alignment**

* **🎬 Video Planner & Scripts**: 5-stage visual Kanban pipeline: `Idea 💡` ➔ `Scripted 📝` ➔ `Recorded 🎥` ➔ `Edited ✂️` ➔ `Published 🚀`.  
* **📚 Teach / Notes Vault**: Central curriculum repository indexed by Subject, Book, Chapter, and Topic Key.  
* **📥 Capture Inbox**: Frictionless mobile endpoint receiving links, voice memos, and video concepts directly from Telegram.

# **45\. FINALIZED SPOKE 3 & SPOKE 5 ARCHITECTURE: DUAL-SCORE AI EVALUATION LEDGER, IN-APP YOUTUBE HINT PLAYER & DIAGNOSTIC COPY CHECKING**

## **1\. Telegram Mini App 4-Tab Student Command Center (Spoke 3\)**

* **Tab 1: ⚡ Daily Drill (7:00 PM IST Post-Class Assessment)**:  
  * Releases automatically at **7:00 PM IST** (pre-warmed in RAM via CacheService at 6:55 PM IST) immediately following the 3:00 PM – 6:45 PM Begusarai offline batches.  
  * Delivers interactive Objective MCQs and Subjective Board Problems directly inside the Telegram Mini App UI (100% functional prior to and alongside A4 PDF template uploads).  
* **Tab 2: 📊 Syllabus & LMS Cinema (Unified Video Player)**:  
  * Interactive chapter completion tracker across all 8 subjects.  
  * Embedded **YouTube IFrame Player API** (`enablejsapi=1&rel=0&modestbranding=1`) playing both public concept videos and unlisted classroom recovery lectures natively inside Telegram with zero external bounce.  
  * **Official YouTube View & Watch-Time Counting**: Initiated via explicit student tap with audio enabled, ensuring every watch session (\>30s) legitimately increments official YouTube views and watch hours on *Commerce with Gyan*.  
  * **90% Watch-Gate Telemetry**: Automatically unlocks `REC-01` recovery drills for Absent (A) and Late (L) students upon reaching \>=90% playback duration.  
* **Tab 3: 📚 DPP Vault & Automated Homework Pipeline**:  
  * Topic-wise repository (`Class` \-\> `Subject` \-\> `Chapter` \-\> `6-Segment Topic Key`).  
  * **T+1 Model Solution Unlock**: Step-by-step model solutions and CBSE marking rubrics unlock automatically at **6:00 AM the next morning (T+1)**.  
  * **Multi-Page Canvas Stitching & Auto-Renaming**: Students can snap up to **2 register pages per subjective question**. Client-side HTML5 \<canvas\> compresses (1280px, 70% JPEG) and vertically stitches both pages into a single \~250KB JPEG strip, auto-renamed to `YYYY-MM-DD_[STUDENT_ID]_[SUBJECT]_[TOPIC_KEY].jpg` and saved in `06_Register_Uploads/[Month]/` (with 60-day auto-purge for routine homework).  
* **Tab 4: 👤 My Desk & Digital Wallet**:  
  * Real-time SWOT Attendance Meter, Two-Tier Fee Ledger, downloadable SWOT Smart Fee Receipts, and separate trackers for **Academic Leaderboard Rank** vs. **CG Coins Wallet**.

## **2\. Standardized Daily Question Delivery Quota (20–25 Min Student Routine)**

* **Accountancy (Mon/Tue Focus & Daily Core)**: 2 MCQs (1M each) \+ 1 Practical Problem (4M or 6M) \= **6–8 Marks/day**.  
* **Business Studies (Wed/Thu Focus & Daily Core)**: 3 MCQs / Assertion-Reasoning (1M each) \+ 1 Real-World Corporate Case Study (4M) \= **7 Marks/day**.  
* **Economics (Fri/Sat Focus & Daily Core)**: 2 MCQs (1M each) \+ 1 Analytical / Numerical / Diagram Problem (4M) \= **6 Marks/day**.  
* **In-Question YouTube Solution Hints**: High-difficulty or trap questions feature an embedded `[ 🎬 Watch Video Explanation by Gyan Sir ]` button that opens the timestamped YouTube explanation natively inside the question card while counting official YouTube views.

## **3\. Dual-Score Evaluation Ledger & Gemini Vision "Red-Pen" Diagnostic Engine**

* **Dedicated Tab (`DAILY_EVALUATION_LOG`)**:  
  * Records `MCQ_OBTAINED` (Objective) and `SUBJ_OBTAINED` (AI-graded Subjective) in separate columns alongside `TOTAL_OBTAINED`, `PERCENTAGE`, `DAILY_RANK`, `PRIMARY_WEAKNESS_TAG`, and `DRIVE_FILE_URL`.  
* **4-Part Personalized AI Diagnostic Report Card (15-Second Turnaround)**:  
  * **Part 1 (Dual Score Breakdown)**: Displays Objective MCQ score, Subjective step-marked score, and real-time Batch Rank.  
  * **Part 2 (Line-by-Line Error Pinpointer — "What Went Wrong")**: Identifies exact missing accounting narrations, un-tallied ledger columns, omitted NCERT keywords (e.g. *Trading on Equity* conditions), or unlabeled Economics graph axes.  
  * **Part 3 (CBSE Step-Marking Prescription — "How to Fix It")**: Provides the exact 1–2 line NCERT/CBSE phrase or formula step required to score full marks.  
  * **Part 4 (Weakness Radar & 1-Tap Video Remedy)**: Tags recurring conceptual errors (`TAG_ACC_HIDDEN_GOODWILL`, `TAG_BST_DELEGATION`) and triggers a Focus Zone Alert with a 1-tap timestamped revision clip if a student repeats the same error twice within 10 days.

# **46\. MASTER END-TO-END SYSTEM DE-CONFLICTION & CANONICAL OVERRIDE RULES**

To guarantee zero formula corruption, zero webhook collisions, and 100% architectural consistency across Sections 1–45, the following **7 Canonical Override Rules** supersede any conflicting legacy statements in earlier sections:

* **Override Rule 1 (Assessment Timing Lock — 7:00 PM Release / 6:00 AM T+1 Solution)**:  
  * All daily drills and DPPs release strictly at **7:00 PM IST** after evening offline classes conclude (backed by the 6:55 PM `CacheService` pre-warm). Model solutions unlock at **6:00 AM the next morning (T+1)**, switching unsubmitted backlogs into non-competitive Revision Mode.  
* **Override Rule 2 (Strict Decoupling of Academic Leaderboard vs. CG Coins Economy)**:  
  * **Academic Leaderboard (Daily & Weekly Rank 1 🥇, Rank 2 🥈, Rank 3 🥉)** is computed **100% from Academic Marks** (`MCQ_OBTAINED + SUBJ_OBTAINED`).  
  * **CG Coins** remain strictly a positive-only reward currency in the student wallet (earned via attendance, streaks, personal bests, and verified referrals), redeemable up to the **₹100/month tuition discount cap** (`CONFIG_FEE_SETTINGS`) plus physical rewards (Executive Metal Pens, Flash Booklets). Non-academic coins never inflate academic class ranks.  
* **Override Rule 3 (6-Segment Universal Key & Separate Sheet Option Columns)**:  
  * The **6-Segment Canonical Key** (`C<Class>-<SUBJECT>-B<Book>-CH<XX>-T<YY>-S<ZZ>`, e.g., `C12-BST-B2-CH09-T01-S01`) is enforced globally across `02_Syllabus_Planner`, `Master_Question_Bank`, Notion Master OS, and GoodNotes exports.  
  * In Google Sheets (`Master_Question_Bank`), MCQ options are stored in **4 separate columns (`Option_A`, `Option_B`, `Option_C`, `Option_D`)** plus `Correct_Option` to prevent manual JSON syntax errors; Apps Script serializes them into JSON automatically during the 6:55 PM RAM cache build.  
* **Override Rule 4 (Single Unified Video Player in Phase 1 — Telegram Mini App LMS Cinema)**:  
  * All references to an external "Commerce Gyan Play Store App" in Sections 7, 8, 25, and 38 are consolidated into the **Telegram Mini App YouTube IFrame LMS Cinema (`?view=app`)** for Phase 1\. All `REC-01` missed-class recovery videos, `APP_VAULT` recorded numericals, and question video hints play natively inside Telegram so watch-gate telemetry (`>=90%`) and official YouTube view counts remain 100% unified.  
* **Override Rule 5 (Phase 1 Parent Communication — In-App Auto-Publish \+ Manual 1-Tap `wa.me` Share)**:  
  * Reconciles Section 3.A/39 with Sections 29/33: The system **never fires automated background WhatsApp messages to parents in Phase 1**. Admission certificates and SWOT Smart Fee Receipts publish automatically inside the student's Telegram Mini App (`My Desk`), while Teacher Desk generates a **1-click `wa.me` pre-filled link** so Gyan Sir can manually forward a verified receipt or 3-day absence check on WhatsApp whenever desired.  
* **Override Rule 6 (Elimination of Morning Batch Strings & Board Attendance Kiosk)**:  
  * Reconciles Sections 27–38 with Section 39: All coaching batches operate strictly in the **Afternoon/Evening Window (\~3:00 PM – 6:45 PM)** after Gyan Sir's daytime school hours (until 2:30 PM). All `06:30 AM` batch references in `WA_Templates` and `Batch_Shift` are replaced with afternoon/evening slots, and the Digital Board self-check-in attendance kiosk is permanently removed in favor of the **20-Second In-App Mobile Roster**.  
  * **Global OBS Hotkey Lock**: **`Shift + Space`** is locked globally across all sections (superseding plain `Spacebar` in Section 26\) as the synchronous OBS Pause/Resume \+ Flashing Red Banner hotkey.  
* **Override Rule 7 (One-Way Read-Only Notion-to-Sheets Content Bridge)**:  
  * **Notion Master OS** is strictly the **YouTube Video Planner, Scripting Studio, and Telegram Quick-Capture Inbox (`📥 Capture Inbox`)**, feeding the 8:00 AM Telegram Morning Hook Brief via a read-only pull.  
  * **Google Sheets** is the sole operational database for ERP, Admissions, Attendance, Fee Ledgers, Syllabus Completion, Question Bank, and AI Grading Logs. Notion's dummy status fields (`Status = Covered`, `Coaching Status = Not Started`) never overwrite Google Sheets.

# **47\. FINALIZED SPOKE 8 ARCHITECTURE: AUTONOMOUS YOUTUBE COMPLETE SYSTEM, FFMPEG COMPRESSION & VIDEO INTELLIGENCE ENGINE**

## **1\. Automated Mac Mini M2 Post-Class FFmpeg Pipeline**

* **Hardware-Accelerated Compression (`h264_videotoolbox`)**:  
  * Watches `/Movies/OBS_Raw/` on the Mac Mini M2. As soon as an OBS 1080p60 recording finishes (using `Shift + Space` for clean pauses during class), FFmpeg compresses the 2.0–2.5 GB raw file down to **\~320 MB in \~90 seconds** with zero visual loss on iPad chalkboard text.  
* **Broadcast Audio Mastering (`loudnorm`)**:  
  * Automatically normalizes the Sennheiser wireless microphone feed to **\-16 LUFS** and strips background room/fan hum.  
* **Begusarai Broadband Fault-Tolerant Resumable Upload**:  
  * Prioritizes the 2 MB GoodNotes PDF and 15 KB 7:00 PM Drill JSON first (syncing in \<3 seconds), then uploads the 320 MB MP4 via YouTube Data API v3 in **10 MB resumable chunks** so power cuts or Wi-Fi drops resume from the exact megabyte without restarting.

## **2\. Dual-Track YouTube Publishing (Unlisted vs. Public)**

* **Track A — Classroom Batch Recovery Lecture (Unlisted)**:  
  * Auto-populates `Video_ID` into Google Sheets (`02_Syllabus_Planner`).  
  * Plays natively inside the **Telegram Mini App LMS Cinema (`?view=app`)** behind the **90% Watch-Gate (`REC-01`)** for Absent (`A`) and Late (`L`) students while legitimately counting official YouTube views.  
* **Track B — Flagship Concept & Exam Trap Video (Public)**:  
  * Scripted in **Notion Master OS (`🎬 Content Pipeline`)** and published publicly on *Commerce with Gyan* to build pan-India CBSE/BSEB reach and AdSense revenue.

## **3\. Six Advanced Video Intelligence Modules**

* **Module 1: Zero-Click AI Audio Indexing & Timestamp Binding (`whisper.cpp` \+ Gemini 1.5 Flash)**:  
  * Extracts audio locally on the Mac Mini M2 Neural Engine at ₹0 cost.  
  * Automatically detects when Gyan Sir solves a specific question (e.g., *"Question 14"*), calculates the exact timestamp (`?t=865s`), and writes the deep link into Column 18 (`VIDEO_EXPLANATION_URL`) of the **Master Question Bank**.  
  * Powers **"Search Inside Video"** in the Telegram Mini App so students can type any term (e.g., *"Hidden Goodwill"*) and jump to that exact second.  
* **Module 2: First-60-Minute Algorithmic Ignition Loop**:  
  * When a Public YouTube video launches, enrolled Begusarai students receive a **"🚀 Premiere Booster Challenge"**. Watching the video and submitting the spoken **80%-mark Concept Codeword** within 2 hours awards **\+15 CG Coins**, creating an immediate high-retention velocity spike for the YouTube recommendation algorithm.  
* **Module 3: Student "Rewind Heatmap" & 8:00 AM Doubt Radar**:  
  * In-app YouTube IFrame telemetry tracks anonymous rewind spikes. If \>=35% of students rewind the same 90-second window 2+ times, the 8:00 AM Telegram Teacher Brief alerts Gyan Sir to review that exact step during the first 5 minutes of class.  
* **Module 4: AI Split-Screen 9:16 Shorts Cutter & Hinglish Caption Burner**:  
  * Detects high-energy "Board Trap" phrases in lecture audio, crops a 45–58s vertical 9:16 clip (top 35% PTZ face-cam, bottom 65% iPad GoodNotes screen), burns Gold & White Hinglish captions with the *Commerce with Gyan* watermark, and sends it to the Telegram Teacher Bot for 1-tap posting to YouTube Shorts and Instagram Reels (`@CommerceWithGyan`).  
* **Module 5: Geo-Targeted YouTube-to-Telegram Conversion Funnel**:  
  * Video descriptions include chapter-specific deep links (`?start=YT_C12_BST_CH09`). External viewers receive a free sample PDF \+ 3-MCQ test and are logged in `Inquiry_CRM`:  
    * **Local (Begusarai)**: Pitched the **3-Day Offline Classroom Demo** (₹1,400/mo 3-Subject Combo).  
    * **Out-of-Station (All India)**: Pitched the **₹499 Digital Board Booster Pass** (AI Copy Checking \+ 36-Week Test Series \+ DPP Vault).

# **48\. DUAL-AI EXECUTION PROTOCOL: CLAUDE SUBSCRIPTION \+ GEMINI WORKSPACE INTEGRATION**

* **Role of Claude (Paid Subscription — Claude Projects / Artifacts / Local Mac Scripts)**:  
  * Primary workbench for writing large, modular frontend code (`?view=app` Telegram Mini App UI, `?view=board` Digital Board Kiosk UI), multi-file Google Apps Script `.gs` modules, and local Mac Mini M2 `FFmpeg`/`whisper.cpp`/OBS automation scripts.  
* **Role of Gemini (Google Workspace Connected Agent & Production Vision API)**:  
  * **Workspace Synchronizer**: Directly reads and updates live Google Docs (`1CX4zIFuUA7l2FILBOnb5hZKrov32e3c5JAQz2UWDaYc`), Google Sheets (*Master ERP*, *Syllabus Planner*, *Question Bank*), Google Drive folders, and NotebookLM CBSE archives.  
  * **In-App Production AI Engine**: Powers real-time student handwritten homework evaluation and UPI screenshot OCR via **Gemini 1.5 Flash API** (\~258 tokens per compressed 200KB image, operating within the ₹0 free tier).  
* **Synchronization Rule**: Any architectural change or finalized code module created in Claude is synced back into this Master Memory Document (`1CX4zIFuUA7l2FILBOnb5hZKrov32e3c5JAQz2UWDaYc`) so both AI assistants always share 100% identical context.

# **49\. SPOKE 8 PRODUCTION HARDENING: AI THUMBNAIL ENGINE, ANTI-PIRACY WATERMARKING & ASYNCHRONOUS PIPELINE UPGRADES**

## **1\. Zero-Click AI Thumbnail & High-CTR Title Generation Engine**

* **Automated Frame Extraction & Compositing**:  
  * During Mac Mini M2 FFmpeg compression, the script automatically extracts the sharpest high-contrast iPad chalkboard frame (solved journal entry, ledger account, or economic curve) alongside a crisp portrait frame from the PTZ face camera.  
  * Automatically composites both assets into a standardized 16:9 high-contrast thumbnail template: Deep Obsidian background, Royal Imperial Violet accents, Heritage Gold title banner, Chalk White board text, and a prominent red/gold *"CBSE & BSEB Board Trap"* badge.  
* **Bilingual High-CTR Title & Description Metadata**:  
  * Gemini automatically generates 3 high-CTR title variations (e.g., *"Partnership Hidden Goodwill: 95% Students Make This 1 Error\! ❌ \| Class 12 Accountancy"*) and saves the ready-to-upload thumbnail JPEG in `/Movies/Ready_For_YouTube/` alongside the video file.

## **2\. Floating Anti-Piracy Watermarking (Telegram Cinema Player)**

* **Dynamic In-App Drift Engine**:  
  * Inside the Telegram Mini App YouTube IFrame LMS Cinema (`?view=app`), a semi-transparent floating text overlay displays the student's unique identity: `[STUDENT_ID] • [STUDENT_MOBILE]` (e.g., `CG-2026-0042 • 98350XXXXX`).  
  * Overlays smoothly drift across randomized viewport coordinates every 45 seconds with CSS opacity modulation (15%–25%), ensuring zero disturbance to board legibility while creating a 100% psychological deterrent against screen recording, external sharing, or course piracy.

## **3\. The "Doubt-to-Video" Auto-Queuer (Spoke 5 to Spoke 8 Feedback Loop)**

* **Automated Homework Error Aggregation**:  
  * When Gemini Vision processes evening subjective homework into `DAILY_EVALUATION_LOG`, if **5 or more students in a batch fail the exact same subtopic concept or question** (e.g., `TAG_ACC_FORFEITURE_OVER_SUBSCRIPTION`), the system automatically flags that topic.  
* **Notion Content Pipeline Queue**:  
  * Injects a high-priority card directly into Notion Master OS (`🎬 Content Pipeline`) under a dedicated filter: **🔥 Urgent Classroom Doubts**.  
  * Alerts Gyan Sir at 8:00 AM via the private Telegram brief: *"5 students missed Question 3 on Pro-Rata Allotment yesterday. Queued for a 5-minute class review or 60-second Short\!"*

## **4\. Auto-Generated 2-Page Revision Cheat Sheet (From `whisper.cpp`)**

* **Zero-Effort Student Handouts**:  
  * Utilizing the transcript already generated by `whisper.cpp` on the Mac Mini M2 Neural Engine, a localized summarization prompt distills the lecture into a clean, 2-page **"Lecture Key Takeaways & Formula Cheat Sheet"** PDF.  
  * Summarizes: (a) Core Board Definitions & NCERT Keywords, (b) Key Accounting Journal Entries & Formulas, and (c) Common Examiner Traps to Avoid.  
  * Automatically attached beneath the video player in the Telegram Mini App under the lecture card for instant 1-tap student download.

## **5\. Bandwidth-Guarded Asynchronous Night Uploader (Begusarai Network Safeguard)**

* **Two-Stage Bandwidth Priority Scheduling**:  
  * **Stage 1 (Immediate Sync at 6:45 PM)**: The lightweight 2 MB GoodNotes PDF and 15 KB 7:00 PM Daily Drill JSON sync immediately in under 3 seconds, ensuring zero interference with student evening drill delivery or Google Apps Script API responsiveness.  
  * **Stage 2 (Background Daemon Post-7:30 PM / Night)**: The heavy 320 MB compressed YouTube MP4 upload is handed off to a low-priority background daemon that monitors network latency and uploads in 10 MB resumable chunks via YouTube Data API v3, guaranteeing full broadband priority for active student traffic during peak evening hours.

# **50\. OFFICIAL A4 GOOGLE DOC DPP TEMPLATE & AUTOMATED EXAM GENERATOR INTEGRATION**

## **1\. Master DPP Template Asset Locked**

* **Live Template Document**: [Commerce Gyan — Master DPP A4 Template & Exam Paper Generator](https://docs.google.com/document/d/1LNV6MiJL6LWDmOGyRr8s_H9tR_6dGEb2VELCJYQ5__E/edit) (Doc ID: `1LNV6MiJL6LWDmOGyRr8s_H9tR_6dGEb2VELCJYQ5__E`).  
* **Resolution of Pending Item 1 (Section 20\)**: The A4 Master Google Doc DPP Proforma Layout is now **100% Finalized, Populated, and Linked** in the system register.

## **2\. Standardized A4 Worksheet Anatomy (15 Marks / 25 Minutes)**

* **Header Block**: Dual Branding (Left: Commerce Gyan Begusarai \| Right: Commerce with Gyan Online Hub \| Center: Official Motto "Be the Best from the Rest").  
* **Student Assessment Profile Bar**: Clean fillable fields for `{{STUDENT_NAME}}`, `{{STUDENT_ID}}`, `{{BATCH_SLOT}}`, `{{SUBJECT}}`, `{{TOPIC_KEY}}`, and Target Score (`___ / 15`).  
* **Section A (Concept Definition & Objective Radar — 3 Marks)**:  
  * 1 Standard MCQ, 1 Assertion-Reasoning board pattern, and 1 Definition with examiner trap warnings.  
* **Section B (Practical Adjustment & Short Reasoning — 6 Marks)**:  
  * Two 3-mark questions covering numerical derivations, journal adjustments, and short case analysis.  
* **Section C (Board-Level Comprehensive Case Study — 6 Marks)**:  
  * High-order thinking skill (HOTS) case study requiring line quotes, concept identification, and step-marked working notes.  
* **Footer Block**: Clear instructions for physical submission, 2-page Telegram Mini App camera upload, T+1 6:00 AM solution release, and in-app video hint QR codes.

## **3\. Automated Generation via `gdocs-design` & Google Apps Script (`DocumentApp`)**

* **One-Click Assembly**: Google Apps Script duplicates this master template, replaces placeholders (`{{...}}`) with live approved questions from the **Master Question Bank** (`1hbXqkvaEH97YDt7puGWK8gdKA9jNU2lJa51mWLvzdfc`), exports a print-ready A4 PDF to Google Drive, and pushes the digital version to the Telegram Mini App at 7:00 PM IST.