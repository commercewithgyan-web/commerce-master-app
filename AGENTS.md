# 🏛️ COMMERCE MASTER APP — IMMUTABLE AGENT RULES

As an AI agent building this project, you must strictly follow these 7 Golden Rules across all files and phases:

### RULE 1: THE PERMANENT ZERO-COST LAW (₹0 MARGINAL COST)
- Never propose, install, or import paid third-party APIs, paid cloud servers, or subscription databases.
- The entire stack must run exclusively on free tiers:
  * Google AI Studio (Gemini 2.5 Flash free tier: 1,500 RPD)
  * Google Workspace native quotas (5 Sheets, Docs, Drive 15GB, Apps Script)
  * Telegram Bot API (100% free)
  * GitHub Pages / Cloudflare Pages (100% free static hosting with SSL)

### RULE 2: ZOMATO / CRED-GRADE CONSUMER UI/UX
- All frontend screens in `frontend/` must adhere to modern mobile design standards (Polyme / Tailwind CSS / Radix styling):
  * Colors: Deep Obsidian (`#0B0C10`), Royal Violet (`#2D124D`), Heritage Gold (`#D4AF37`), Crisp White (`#F8FAFC`).
  * Native Telegram Haptics: Call `Telegram.WebApp.HapticFeedback` on all key taps, quiz answers, and card clicks.
  * Micro-interactions: Multi-color confetti bursts (`canvas-confetti`) on beating ghost timers; animated audio waveforms for voice doubts; skeleton loaders during fetch.

### RULE 3: SINGLE PDF CHANNEL BROADCAST (NO 60-PDF LOOPS)
- The Telegram Bot acts as an Admin in the class channel/group.
- Generates EXACTLY ONE A4 Question PDF at 7:30 PM IST and broadcasts it to the channel with the [📱 Start MCQ] button.
- Generates EXACTLY ONE Model Answer PDF at 8:15 AM next morning.
- NEVER run batch loops generating individual PDFs for 60 students (prevents Apps Script 6-minute timeouts).

### RULE 4: PRE-CLASS SUBTOPIC DISPATCHER & 70/30 PACING
- Teacher selects today's subtopic in 10 seconds via `/settopic`.
- Tonight's 7:30 PM test delivers 70% questions from today's subtopic + 30% cumulative retention from previous 1–2 days' subtopics.
- Questions are pulled from the pre-verified Question Bank Vault (zero hallucination).

### RULE 5: AUTONOMOUS ACCOUNTANCY TABLE WATCHER (`watcher.gs`)
- Never use equal column widths for financial tables:
  * Clamp L.F. / Note No. to 25–30pt.
  * Clamp Currency (₹) to 65–80pt with `white-space: nowrap;` and monospace font (`Roboto Mono`).
  * Give Particulars the remaining 55%–65% elastic width.
- Auto-switch page orientation: $\le 500\text{pt} \rightarrow$ Portrait; $500–750\text{pt} \rightarrow$ Landscape; $>750\text{pt} \rightarrow$ CBSE Vertical T-Split Grid.
- Draw double-underline rules under ledger totals; hanging indents for `(Being...)` narrations.
- Render Statistics formulas ($\sqrt{}$, $\sum$) and Economics curves as local SVG vectors with ZERO external CDN dependencies.

### RULE 6: VOICE FEYNMAN DOUBT ENGINE ("10-YEAR-OLD KID")
- Voice doubts arriving via Telegram (`.ogg`) must be processed by Gemini 2.5 Flash using the ELI10 System Prompt.
- Must explain using everyday Indian analogies (street food, cricket, pocket money) under 120 words with zero dry jargon first.

### RULE 7: SECURITY & ANTI-CHEATING
- Always verify `initData` using HMAC-SHA256 (never trust `initDataUnsafe`).
- Randomize question sequences and shuffle option letters (A, B, C, D) using Fisher-Yates algorithm per student.
- Store secrets strictly in `PropertiesService.getScriptProperties()` (never hardcode tokens).
- Always use `Asia/Kolkata` timezone.