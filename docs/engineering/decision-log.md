# OJIX ClientFlow — Architecture Decision Log (ADL)

## ADR-001: Technology Stack Selection
- **Status:** Accepted
- **Context:** The application must be lightweight, fast, testable, responsive, and ready for deployment to Vercel without requiring external paid database setup.
- **Decision:** Build using **React 18 + TypeScript + Vite**. Use modern CSS with glassmorphic cards, Lucide icons, and zero bulky UI frameworks.
- **Consequences:** Near-instant hot reload, zero build configuration overhead, clean typing, and single-command Vercel production deployment.

---

## ADR-002: Client-Side Data & Persistence Architecture
- **Status:** Accepted
- **Context:** Need persistent storage suitable for local evaluation, test suites, and live Vercel previews that survives page reloads.
- **Decision:** Implement a modular **Repository/Service pattern** (`src/services/store.ts`). All reads/mutations pass through an authoritative service layer that checks RBAC permissions, normalizes data, and persists to browser `localStorage` with fallback to memory during tests.
- **Consequences:** Fast, testable in Node/Vitest environments, 100% resilient across browser reloads, without requiring external database credentials.

---

## ADR-003: Authoritative RBAC Enforcement
- **Status:** Accepted
- **Context:** UI-only hiding of buttons does not meet the assignment requirement: *"Enforce authorization in the data/API layer and test both allowed and denied access paths."*
- **Decision:** Create `canUserPerform(currentUser, action, resource)` inside `src/services/rbac.ts`. Every mutation method in `store.ts` (`createDeal`, `updateDealStage`, `deleteContact`, etc.) checks permissions and throws a typed `AuthorizationError` if the role lacks authorization.
- **Consequences:** Negative security tests can directly invoke service methods and verify that unauthorized requests fail authoritatively.

---

## ADR-004: Deduplication Strategy
- **Status:** Accepted
- **Context:** Contact creation must prevent accidental duplicates while avoiding destructive silent merging.
- **Decision:** Normalize emails (`email.trim().toLowerCase()`). On conflict, display an inline duplicate warning dialog with a link to the existing record, requiring explicit user confirmation if they choose to proceed.
- **Consequences:** Case-insensitive comparison (`John@Doe.com` vs `john@doe.com`), prevents data corruption, and satisfies assignment test criteria.

---

## ADR-005: Follow-Up Stale & Overdue Computation
- **Status:** Accepted
- **Context:** Sales reps must quickly spot decayed opportunities and overdue next steps.
- **Decision:** 
  1. Overdue = `nextActionDate < today && stage !== 'won' && stage !== 'lost'`.
  2. Stale = `now - lastActivityAt > 14 days && stage !== 'won' && stage !== 'lost'`.
- **Consequences:** Clear, deterministic, explainable business logic that feeds directly into the Lead Follow-up Accelerator skill.
