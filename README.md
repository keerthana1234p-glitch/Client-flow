# OJIX ClientFlow — CRM & Follow-up OS

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
[![Timezone](https://img.shields.io/badge/Timezone-Asia%2FKolkata%20(IST)-indigo?style=for-the-badge)](https://timeanddate.com/)
[![Production Readiness](https://img.shields.io/badge/Production%20Readiness-VERIFIED%20GO-emerald?style=for-the-badge)](docs/engineering/production-readiness-report.md)

> Built for the **OJIX Multi-Agent Engineering Challenge**.
> **Assignment 02 — Member 2: OJIX ClientFlow (CRM & Follow-up OS)**

---

## 🚀 Live Demo & Deployment
- **Live Vercel Link:** [https://clientflow-ojix.vercel.app](https://clientflow-ojix.vercel.app) *(Deploy via Vercel GitHub integration)*
- **Demo Accounts (Pre-seeded):**
  - **Admin:** `admin@test.com` / `password123` (Full workspace authority)
  - **Owner:** `owner@test.com` / `password123` (Manage deals & contacts)
  - **Viewer:** `viewer@test.com` / `password123` (Read-only / HTTP 403 on mutate)

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Operation | Endpoint | ADMIN | OWNER | VIEWER |
| :--- | :--- | :---: | :---: | :---: |
| **Inspect Pipeline / Queues** | `GET /api/deals`, `/api/followups/*` | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK |
| **View Contacts & Duplicates** | `GET /api/contacts`, `/duplicates` | ✅ 200 OK | ✅ 200 OK | ✅ 200 OK |
| **Create Contact** | `POST /api/contacts` | ✅ 201 Created | ✅ 201 Created | 🚫 **403 Forbidden** |
| **Create Opportunity** | `POST /api/deals` | ✅ 201 Created | ✅ 201 Created | 🚫 **403 Forbidden** |
| **Drag & Drop Stage Move** | `PUT /api/deals/:id/stage` | ✅ 200 OK | ✅ 200 OK | 🚫 **403 Forbidden** |
| **Schedule Next Action** | `POST /api/followups/today` | ✅ 201 Created | ✅ 201 Created | 🚫 **403 Forbidden** |

---

## ⏰ Timezone Standardization: `Asia/Kolkata` (IST)
Every date and time in OJIX ClientFlow strictly conforms to Indian Standard Time (`Asia/Kolkata` / UTC+05:30):
- Overdue dates are calculated relative to `now()` in IST.
- Follow-up timestamps are formatted as `DD MMM YYYY, hh:mm A IST`.
- All queue screens display the active IST timezone banner.

---

## 🧮 Priority Score Formula (Max 30, Sorted DESC)
Every deal and overdue follow-up is scored using deterministic logic:
$$\text{Priority Score} = \min(30, \text{Overdue} + \text{HighValue} + \text{StaleDecay} + \text{StageBonus})$$
- **Overdue**: $+10$ if `dueAt < now` (IST)
- **High Value**: $+5$ if deal `value > 100,000`
- **Stale Decay**: $+7$ if inactive 7–14 days, $+10$ if inactive $>14$ days
- **Stage**: $+3$ if deal stage is `QUALIFIED`
- **Cap**: Strictly capped at 30 points.

---

## 👥 Case-Insensitive Deduplication (HTTP 409 Conflict)
- Duplicate email checks use `mode: 'insensitive'` normalization.
- Submitting `test@corp.com` vs `TEST@CORP.COM` in the **same workspace** returns **HTTP 409 Conflict** and blocks silent data overwriting.
- The same email in **different workspaces** is permitted, ensuring tenant independence.

---

## 🧠 The 4 Required Skills (`.claude/skills/` & `.agents/skills/`)
1. **[ojix-parallel-product-orchestrator](.claude/skills/ojix-parallel-product-orchestrator/SKILL.md)**: Coordinates architectural planning, documentation, workstream delegation, and release gates.
2. **[clientflow-crm-core](.claude/skills/clientflow-crm-core/SKILL.md)**: Pipeline Kanban board and deal stage transitions (`LEAD`, `QUALIFIED`, `WON`, `LOST`).
3. **[lead-followup-accelerator](.claude/skills/lead-followup-accelerator/SKILL.md)**: Priority score calculation (max 30) + case-insensitive duplicate detector.
4. **[production-assurance](.claude/skills/production-assurance/SKILL.md)**: Independent adversarial verification testing all 5 quality and security gates.

---

## 🧪 Automated Testing (Exactly 20 Tests)
Run with `npm test`:

1. `src/test/rbac.test.ts` (5 tests) — Viewer GET only, POST/PUT/DELETE rejected with 403.
2. `src/test/isolation.test.ts` (3 tests) — Multi-workspace tenant separation.
3. `src/test/duplicate.test.ts` (4 tests) — Case-insensitive email 409 conflict.
4. `src/test/followup.test.ts` (5 tests) — Priority score (max 30) + IST dates.
5. `src/test/pipeline.test.ts` (3 tests) — Drag-drop stage persistence & validation.

---

## 💻 Quick Setup & Execution

```bash
# 1. Install dependencies
npm install

# 2. Setup database schema & seed
npm run prisma:push
npm run prisma:seed

# 3. Start local development server
npm run dev

# 4. Run automated test suite (20 tests)
npm test

# 5. Type check & build
npx tsc --noEmit
npm run build
```

---

## 🎬 2-Minute Demo Video Walkthrough Script

1. **0:00 - 0:30 (RBAC 403 Enforcement)**:
   - Log in as `viewer@test.com`.
   - Attempt to drag-drop or move a deal stage; observe the **403 Forbidden** banner.
   - Switch to `admin@test.com` to show authorized execution.
2. **0:30 - 1:00 (Case-Insensitive Deduplication 409)**:
   - Open `/contacts/new`.
   - Type `SOPHIA@AURAROBOTICS.SYNTHETIC` matching existing lowercase contact.
   - Show the live warning banner and **HTTP 409 Conflict** response.
3. **1:00 - 1:30 (Overdue Queue & Priority Scoring in IST)**:
   - Open `/queue/overdue`.
   - Point out the **RED urgency badges**, `Asia/Kolkata` IST date formatting, and Priority Score sorting (max 30).
4. **1:30 - 2:00 (Kanban Pipeline Persistence)**:
   - Move deal from `LEAD` to `QUALIFIED` to `WON`.
   - Refresh the page to demonstrate database persistence via Prisma SQLite.
