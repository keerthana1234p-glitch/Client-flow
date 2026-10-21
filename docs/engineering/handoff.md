# OJIX ClientFlow — Operations & Deployment Handoff Guide

## 1. Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation & Execution
```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```
The application will launch locally at `http://localhost:3000`.

---

## 2. Running Automated Tests
```bash
# Run complete test suite (RBAC, deduplication, pipeline, queues)
npm run test
```

---

## 3. Vercel Deployment Instructions

OJIX ClientFlow is configured for zero-config deployment to Vercel:

1. Push this repository to GitHub or GitLab.
2. In the Vercel Dashboard, click **"Add New Project"** and select the repository.
3. Keep default settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. The application will go live immediately with a public production URL.

---

## 4. Live Demonstration Walkthrough Script

Use this script during evaluation or video presentation to demonstrate measurable time savings:

1. **Step 1: Role-Based Access Showcase (1 minute)**
   - Start as **David Chen (Viewer)**: Notice that "Add Contact" and "New Opportunity" buttons are locked. Try to advance a stage; observe clean read-only enforcement.
   - Switch via header to **Sarah Jenkins (Workspace Admin)**: All administrative controls, stage movements, and contact management become instantly available.

2. **Step 2: Case-Insensitive Duplicate Check (1 minute)**
   - Navigate to **Contacts & Orgs**.
   - Click **Add Contact**.
   - Enter `SOPHIA@AURAROBOTICS.SYNTHETIC` (matching existing `sophia@aurarobotics.synthetic`).
   - Notice the live amber warning banner highlighting existing record details and blocking accidental silent overwrites.

3. **Step 3: Lead Follow-Up Accelerator Skill Demo (1.5 minutes)**
   - Click the **"AI Follow-up Accelerator"** button in the header.
   - Explain the deterministic Urgency Scoring formula.
   - Show how overdue deals and stale (>14 days inactive) opportunities are prioritized.
   - Click **"Generate Next-Action Briefing"** to demonstrate factual, zero-hallucination briefings.

4. **Step 4: Production Assurance Skill Audit (1.5 minutes)**
   - Click the **"Production Assurance"** button in the header.
   - Click **"Run Assurance Verification"**.
   - Watch all 5 assurance gates run in real-time with PASS badges and cryptographic-grade evidence.

5. **Step 5: End-to-End Golden Flow (1 minute)**
   - Create a new Opportunity.
   - Advance it across Kanban columns (*New Lead* -> *Qualified* -> *Proposal*).
   - Log a call touchpoint in the Activity Timeline.
   - Schedule a follow-up for today and verify it appears in the **Follow-up Queue (Due Today)** tab.
