# Frontend v3.0 Migration Notes: URL Discrepancy & Route Mapping

**Author:** Antigravity Autonomous Agent  
**Date:** 12 November 2026  
**Status:** Stage 6 Production Pre-Flight Review  
**Target Institute:** Commerce Gyan (Begusarai, Bihar) | **Founder:** Gyan Deep Kumar (Gyan Sir)  
**Apps Script Project:** `1nUSSiIMQYCRuOVpu5ok36P9nI8p61fO-BF5dQKhcRjOoZTcJHEWvImaL`  
**GitHub Pages Target:** `https://commercewithgyan-web.github.io/commerce-master-app/index.html?v=3.2`

---

## 1. Executive Summary

This document captures the audit findings, architecture discrepancies, missing backend routes, and action name mapping decisions discovered during the Frontend v3.0 Migration (Tasks 1 through 7). These items require review and confirmation from Gyan Sir before backend deployment and final production lock-in.

---

## 2. Backend Webhook URL Discrepancy

Two distinct Google Apps Script Webhook URLs are currently active across the client-side codebase:

| Client Layer | File | Webhook URL | Target Environment |
|---|---|---|---|
| **Standalone Pages API Client** | `frontend/js/api.js` (line 12) | `https://script.google.com/macros/s/AKfycbywJKoynUbc2fY7caEx9hZ-FARG71J9v1F6uXaL5z7XxBS_NKhwFiKCZIVeaYVJ0QS4jQ/exec` | Legacy / Staging Deployment |
| **Studio SPA & Telegram Bridge** | `index.html` (bridge.js default) | `https://script.google.com/macros/s/AKfycbzmOtPr1jYIG6ktQymaVNrrJ7SGkB2KglPxyXzIK-ha94M66ilYn_dr92T-Aj1Fh0DrBQ/exec` | Production Deployment (`AKfycbzm...`) |

### Key Risks & Decision Needed:
- **Discrepancy Impact:** Standalone pages (`fee.html`, `question.html`, `progress.html`, `notebook.html`, `doubt.html`) making requests through `api.js` talk to `AKfycbyw...`, whereas the unified 11-tab SPA inside `index.html` talks to `AKfycbzm...`. If `AKfycbyw...` points to an older Apps Script deployment version or a different sheet, state changes (like fee receipts, notebook saves, quiz scores) will be split across two sheets.
- **Action Required by Gyan Sir:** Confirm whether `AKfycbzm...` is the authoritative single production deployment ID. Once confirmed, `api.js` should be updated to point to `AKfycbzm...` to achieve unified single-endpoint architecture.

---

## 3. Missing Backend Routes Audit

The frontend audit identified 6 core API actions called by the standalone client controllers that have **NO handler** in the existing production `Code.gs` (neither in the top-level `doPost` action switch nor in the legacy `handleApiRequest` dispatcher):

| Action Name | Called By | Frontend Purpose | Current Backend Status |
|---|---|---|---|
| `getHomeDashboard` | `frontend/js/home.js:59` | Loads student stats, coin balance, streak, predicted score & today's subtopic | **MISSING** — returns `Unknown action: getHomeDashboard` |
| `getNotebook` | `frontend/js/notebook.js` | Retrieves student's saved notes, formulas, mistakes & bookmarks | **MISSING** — returns `Unknown action: getNotebook` |
| `getProgress` | `frontend/js/progress.js` | Retrieves attendance history, accuracy breakdown, chapter mastery scores | **MISSING** — returns `Unknown action: getProgress` |
| `getFeeDashboard` | `frontend/js/fee.js` | Loads fee ledger, due dates, receipt hashes & coin redemption discount | **MISSING** — returns `Unknown action: getFeeDashboard` |
| `addNote` | `question.js`, `doubt.js`, `notebook.js` | Saves bookmark / handwritten concept note to digital notebook | **MISSING** — returns `Unknown action: addNote` |
| `runRedPenAnalysis` | `frontend/js/redpen.js` | Uploads student handwritten answer copy for Gemini AI marking & rubric | **MISSING** — returns `Unknown action: runRedPenAnalysis` |

> **Note on Local Fix:** During review, stubs for `getHomeDashboard`, `getNotebook`, `getProgress`, `getFeeDashboard`, `addNote`, and `runRedPenAnalysis` were drafted in `backend/Code.gs` and `backend/redpen.gs` in the local workspace. Per strict frontend-only constraints, these were **NOT pushed** to live Google Apps Script (`clasp push` was withheld).

---

## 4. Action Name Mapping Decisions (Legacy vs v3.0 Explicit Actions)

The v3.0 backend introduces explicit, secure action names that are intended to replace several legacy actions. Gyan Sir needs to confirm the following mappings:

| Legacy Action Name (v2.3) | Proposed v3.0 Explicit Action | Schema / Payload Match | Recommendation |
|---|---|---|---|
| `submitAnswer` | `submitStudentQuizAttempt` | Both accept `{ qid, selectedOption, timeTakenSeconds }`. v3.0 writes to `Quiz_Attempts` sheet and awards coins server-side. | **Map to `submitStudentQuizAttempt`** |
| `addNote` | `saveStudentNotebookItem` | Both accept `{ rollNo, itemType, noteText }`. v3.0 writes to `Notebook_Notes` with encryption metadata. | **Map to `saveStudentNotebookItem`** |
| `getSession` | `getStudentMiniAppBootstrap` | `getSession` returned `{ student, access, role }`. `getStudentMiniAppBootstrap` returns `{ student, attendance, claimStatus, recoveryDrillsDue, coinBalance }`. | **Map to `getStudentMiniAppBootstrap`** |
| `recordFeePayment` | `recordFeePayment` (v3.0) | Accepts `{ Roll_No, method: 'CG_COINS', amount }`. Enforces ₹250 proration floor & 30% late fee cap. | **Implemented in Task 4** |

---

## 5. Front-End Hardening Completed in This Migration

1. **Authentication Security (Task 1):**
   - Abolished client-side `GUEST_STUDENT` fallback and hardcoded Admin ID bypass.
   - Unauthorized browser or invalid Telegram launches cleanly trigger the dedicated `showAuthFailed()` modal.
   - Version cache-busting bumped to `v3.2 LIVE`.

2. **Universal Schema Normalization (Task 2):**
   - Replaced all legacy `studentId` / `StudentID` identifiers with canonical `Roll_No`.
   - Maintained backward-compatible read fallbacks (`Roll_No || roll`).

3. **Anti-Cheat Grading (Task 3):**
   - Completely eliminated client-side `optionMap` transmission.
   - All quiz submissions are graded strictly on the Apps Script backend.

4. **Universal Ledger-Based Fee UI (Task 4):**
   - CG Coins wallet integration with ₹1 = 1 CG Coin redemption.
   - Enforced ₹250 proration floor and 30% late fee cap.
   - SHA-256 tamper-evident receipt verification modal with 1-tap copy.

5. **6-Tab Unified Navigation (Task 5):**
   - Replaced fragmented 5-tab docks with the canonical 6 tabs:
     **📅 Aaj · 📖 Syllabus · 💳 Fees · 📝 Notes · 🤖 Doubt · 📊 Progress**
   - Sub-features (Case Study Lab, Red-Pen Check, SWOT Smart Receipt) cleanly routed.

6. **New v3.0 Feature Wiring (Task 6):**
   - Wired 14-day Telegram admission claim code binding (`bindStudentClaimCode`).
   - Wired REC-01 Late/Absent recovery drill completion (`completeRecoveryDrill`).
   - Added read-only live attendance status badge ("Present Today ✅" / "Not Marked Yet") and streak counter to the Aaj tab.
   - Bridge boot flow wires `getStudentMiniAppBootstrap`.

7. **Dead Code Cleanup (Task 7):**
   - 0 hits for `GUEST_STUDENT`, `optionMap`, `studentId`, `StudentID` across `frontend/`.
   - Verified 100% clean Node.js syntax across all 12 JS controllers and 8 HTML files.

---

## 6. Next Steps for Gyan Sir

1. **Backend Deployment (`clasp push`):**
   Review and push the 6 missing route handlers in `backend/Code.gs` and `backend/redpen.gs` to production Apps Script ID `1nUSSiIMQYCRuOVpu5ok36P9nI8p61fO-BF5dQKhcRjOoZTcJHEWvImaL`.
2. **URL Unification:**
   Confirm whether `AKfycbzm...` is the sole production URL, and authorize updating `api.js`.
3. **Telegram WebApp Button:**
   The WebApp Menu button on `@CommerceGyanDostbot` should point to:  
   `https://commercewithgyan-web.github.io/commerce-master-app/index.html?v=3.2`
