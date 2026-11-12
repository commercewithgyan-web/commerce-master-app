# Perplexity Project — Links, Files, Skills & Setup Guide

**Project:** Commerce With Gyan — Class 11/12 Homework Automation  
**Checked:** 2026-10-19

## A. Where each input belongs

| Perplexity field | Put here | Why |
| --- | --- | --- |
| Project Title | `Commerce With Gyan — Homework Automation` | Short identifying title |
| Project Description | Short purpose: coded syllabus → approved question bank → Forms/DPP → Classroom at 7 PM IST | Orientation, not detailed operating rules |
| Project Instructions | The content of `COMMERCE_GYAN_PERPLEXITY_PROJECT_INSTRUCTIONS.md` | Persistent independent-thinking and architecture policies |
| Project > Skills | `SKILL.md` or `COMMERCE_GYAN_PERPLEXITY_SKILL.zip` | Reusable audit/checklist workflow |
| Sources > Files | Actual syllabus/question-bank exports, DPP PDF, subject-specific formatting `.md`, code snapshots, sample result PDFs | Source-of-truth material, not speculative instructions |
| Sources > Links | Public documentation pages and accessible project links | Context and current authoritative references |
| Connectors | Authorize Google Drive, if available, for current private Sheets, source PDFs and scripts; separately check Classroom authorization | Private data should not be assumed readable by URL alone |

Perplexity Projects currently document an **8,000-character instruction limit** and up to **1,000 characters for description**. Skills are configured through Project Settings > Skills; UI naming can vary across accounts.

## B. Project links you should supply (replace placeholders)

| Priority | Link needed | Format / notes |
| --- | --- | --- |
| 1 | **Syllabus Planner** | `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit` — specify authoritative tabs and syllabus coding rules |
| 1 | **Master Question Bank** | `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit` — or create only after auditing existing resources |
| 1 | **Classroom course(s)** | `https://classroom.google.com/c/<COURSE_ID>` — links can document identity, but authenticated access/API permission must be verified |
| 1 | **Original DPP template** | Google Drive share URL + upload the actual PDF; if there is an editable source, also add it |
| 1 | **Existing Apps Script backend** | Exact Apps Script project editor URL and code snapshot/README |
| 2 | **Subject-format rules** | Upload Accountancy, Economics, Statistics and Business Studies `.md` files, plus examples |
| 2 | **Finished reference DPPs** | Good and bad sample PDFs, screenshots and a written defect list |
| 2 | **Homework schedule / policies** | Google Sheet URL and rules for default topics, counts, difficulty, holidays, approvals |
| 2 | **Classroom/Forms integration logs** | Redacted status exports and test results, not tokens or private credentials |

**Important:** Pasting a restricted Google URL does **not** grant access. Connect Google Drive where appropriate, authorize required services, or upload a safe export. Even Drive connector files copied into a Perplexity Project may be snapshots; request fresh reads after source changes.

## C. Public official documentation links (ready to paste)

### Google Classroom
- https://developers.google.com/workspace/classroom/reference/rest

### Google Apps Script and scheduling
- https://developers.google.com/apps-script/guides/triggers/installable
- https://developers.google.com/apps-script/guides/services/quotas

### Google Forms quiz automation
- https://developers.google.com/workspace/forms/api/guides
- https://developers.google.com/workspace/forms/api/guides/setup-grading

### Google Docs template merging and PDF source analysis
- https://developers.google.com/workspace/docs/api/how-tos/merge

### AI-generated structured question data
- https://ai.google.dev/gemini-api/docs/structured-output

### Perplexity project & skill documentation
- https://www.perplexity.ai/help-center/en/articles/10352961-what-are-projects
- https://www.perplexity.ai/en-GB/hub/workshops/perplexity-computer-for-buyside-professionals
- https://www.perplexity.ai/en-GB/hub/products/projects

**Source strategy:** Attach the few *most relevant* exact API guides first, rather than filling the Project with broad links. Documentation sources help verify design; they do not substitute for inspecting your live code and files.

## D. What NOT to include

- Gmail/passwords, API keys, OAuth refresh tokens, secret deployment URLs, service-account private keys.
- Student PII in publicly shared files; redact names, email IDs and marks when not essential.
- Any public links that expose teacher-only answer keys or unpublished homework.
- Unverified AI diagrams/specifications labelled as implemented or working.
- Outdated duplicated copies without dates, versions, or identifying source of truth.

## E. Recommended setup sequence

1. Create the Perplexity Project and enter its title and a short description.
2. Paste the combined instructions in Project Settings; they are intentionally shorter than the detailed master project specification.
3. Upload `COMMERCE_GYAN_PERPLEXITY_SKILL.zip` using Project Settings > Skills (or Computer > Skills > Create skill > Upload a skill). An individual `SKILL.md` upload also works where offered.
4. Connect a permitted Google Drive account if possible and add *actual* source files/snapshots.
5. Add official Google documentation links relevant to the first audit.
6. Start with: `Apply the commerce-gyan-architecture-auditor skill. Inventory my available sources, challenge the current architecture, compare at least two alternatives, and prepare a non-destructive integration blueprint. Do not deploy or publish anything.`
7. Compare the resulting blueprint with your existing scripts/data and require test-backed acceptance criteria.

## F. Perplexity-specific limits checked

- New Projects have persistent file storage; documentation currently states up to 10,000 files / 5 GB total / 100 MB per file, subject to future changes.
- Project instructions: up to 8,000 characters; description: up to 1,000 characters.
- Skills can be uploaded as a `.md` file or `.zip` with `SKILL.md` at archive root, including YAML `name` and `description`; a 10 MB skill upload size is documented in Perplexity's training materials.
- Perplexity supports project-scoped reusable skills and project context links. Private Google Drive material may require connector authorization or uploaded exports.

These are platform capabilities, not evidence that your own Perplexity account has every tool enabled.
