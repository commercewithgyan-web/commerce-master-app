# Review fixes plan (2026-11-12)

Source: read-only review of this repo on 2026-11-12. Each item cites the file:line found then. Re-check line numbers before editing, because files move.

## Goal
Close the high-priority gaps found in the review: missing backend routes, hard-coded admin identity, two backend deployment URLs, duplicated front-end copies, and hard-coded sheet IDs. Then the medium items.

## Decisions needed first (not decided here)
- **D1. Six missing routes. DECIDED 2026-11-12: wire up all six (user choice).** `getHomeDashboard`, `getNotebook`, `getProgress`, `getFeeDashboard`, `addNote`, `runRedPenAnalysis` are called from the front end but have no `case` in `backend/Code.gs` (`doPost` switch at line 266, `doGet` switch at line 2219). Partial logic already exists to adapt: `getDashboardSummary()` (`Code.gs:399`), `getStudentFeeLedger()` (`Code.gs:444`), `getStudentAcademicProfile_()` (`backend/notebook.gs:483`), `runGatekeeperAndBuildCtx_()` (`backend/redpen.gs:62`). **Recommended:** wire these up as new cases. The alternative is to remove the front-end calls, which would remove features.
- **D2. Canonical backend URL.** `frontend/js/api.js:29` and `question.js:81` use `AKfycbywJ…`. `index.html:2160`, `:4751` and `studio/bridge.js:17` use `AKfycbzm…` / `AKfycbyw…`. The migration plan says "do not unify". Confirm whether both deployments must stay live and run the same code. Until confirmed, Phase 3 does not start.
- **D3. Single source for the HTML.** `index.html`, `frontend/index.html` and `staging/index.html` are copies of each other, 5,177 lines each. **Recommended:** keep one source and generate the copies with a script, or add a check that fails when they differ.

## Phase 1: Missing routes (high)
1. Add `case` entries for the six actions in the `doPost` switch (`backend/Code.gs:266`) and, where the front end uses `doGet`, in the second switch (`Code.gs:2219`).
2. Each handler takes the verified user from `verifyTelegramInitData_` (`backend/auth.gs`), never from the client payload.
3. Add a test for each route in `backend/test_suite.gs`. Test cases: valid user, unknown action (must still return "Unknown action"), and a student asking for another student's data (must be refused).
- **Verify:** run the suite in the Apps Script editor. Check each front-end screen (`home.js`, `notebook.js`, `progress.js`, `fee.js`, `question.js`, `redpen.js`) against staging.

## Phase 2: Admin identity (high)
1. Move the admin ID from code into Script Properties (`ADMIN_TELEGRAM_ID`). Read it at `backend/Code.gs:43`, `:54-55`, and in the checks at `backend/auth.gs:116`, `:152`, `:265`. Keep `auth.gs:116-122` as the only place that grants ADMIN.
2. Remove the fallback in `frontend/js/redpen.js:83-87`. If the Telegram user is missing, send no ID and let the server reject the request.
3. `frontend/js/home.js:108` is display only. Keep it, and add a comment that the server makes the real decision.
- **Verify:** `grep -rn "552858970"` returns only the Script Property note and tests.

## Phase 3: Backend URL (high, after D2)
1. Put the chosen URL in one place (for example `window.COMMERCE_BACKEND_URL`, set in one shared file).
2. Point `api.js:29`, `question.js:81`, `index.html:2160` and `:4751`, `staging/index.html` and `studio/bridge.js:17` to it.
- **Verify:** grep finds one URL. Telegram login and one quiz submit work on staging.

## Phase 4: Sheet IDs (medium)
1. Move `FALLBACK_SHEET_IDS` (`backend/sheets.gs:11-18`) into Script Properties, as decided on 2026-11-11.
2. Remove the silent remap at `backend/sheets.gs:77`, or log it.
- **Verify:** `getActiveSheetIds()` returns the same IDs before and after.

## Phase 5: HTML copies (high, after D3)
Apply D3. Do not edit the three HTML copies by hand after this.

## Phase 6: Escaping (medium, audit first)
1. List every `innerHTML` write in `frontend/js/` (notebook 12, fee 9, question 5, doubt 4, and others).
2. For each one, check whether user-entered text (doubts, notes, names) is inserted. Use `textContent` or an escape helper for those.
- **Verify:** type `<img src=x onerror=alert(1)>` into a note and a doubt. It must show as text.

## Phase 7: Small items (low)
- `frontend/js/api.js:81-87`: build the timeout message from `timeoutMs`, not a fixed "60 seconds".

## Phase 8: Navigation and mobile (medium)
1. Decide whether the teacher sidebar (`frontend/index.html:163-245`, 11 items) and the student tabs (6 tabs per the 2026-11-11 decision) need separate designs.
2. Check each main screen at 375 px with the `playwright-skill`. Check for horizontal scroll and touch targets under 44 px.

## Checked on 2026-11-12 (verification pass)
- CORRECTED: five of the six routes already had handlers (`apiGetHomeDashboard_`, `apiGetProgress_`, `apiGetNotebook_`, `apiAddNote_` in `backend/notebook.gs`; `apiGetFeeDashboard_` in `backend/fees.gs`). Only `runRedPenAnalysis` had no handler; it now uses the new bridge `apiRunRedPenAnalysis_` in `backend/redpen.gs`. The missing piece was the `case` entries in the `handleApiRequest` switch (`backend/Code.gs:2260-2276`).
- NEW SECURITY FINDING: `backend/Code.gs:2199-2207`. When `initData` is missing or invalid, `handleApiRequest` sets `verifiedUser` to the admin (`id: 552858970, is_admin: true`). Any unauthenticated POST therefore runs as admin, including `addNote` and the dashboards. Fix belongs in Phase 2 and needs a decision on whether guests should get a limited, non-admin user.
- Switches confirmed at `backend/Code.gs:153`, `:266`, `:2219`. Admin ID references at `auth.gs:116,121,152,265`, `Code.gs:43,54-55,2203`, `redpen.js:83,87`, `home.js:108` confirmed.
- Backend URL `AKfycbywJ…` in `api.js:29`, `question.js:81`, `studio/bridge.js:17`. `AKfycbzm…` in `index.html:2160,4751` and the two copies. Confirmed.
- `innerHTML` counts confirmed: notebook 12, fee 9, question 5, doubt 4. Also `doubt.js`, `home.js`, `mystery.js`, `detective.js`, `redpen.js`, `progress.js`, `telegram.js` have some.
- Timeout abort message is at `api.js:85`, timeout logic at `api.js:81-90`.

## Open verification item (answered in part)
- No file in `frontend/js/` mentions `optionMap`. `backend/questions.gs:656` reads `payload.optionMap`, and falls back to `CorrectIndexNum` when it is missing (`questions.gs:663`). So shuffled-option grading depends on the server or on the stored answer. Confirm on a shuffled question before changing anything. The offline queue (`api.js:171-210`) is still unchecked.

## Order and rollback
- One commit per phase. Deploy to staging with `clasp` first. Production only after a manual check.
- Phases 1 and 2 can run in parallel. Phases 3 and 5 wait for D2 and D3.
