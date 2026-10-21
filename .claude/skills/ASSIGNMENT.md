# Assignment 02 — OJIX ClientFlow: CRM & Follow-up OS

**Owner:** Member 2. **Audience:** Freelancers, service businesses, sales teams, agencies, and small/mid-sized companies.

## Business problem
Businesses lose opportunities when lead details, conversations, next steps, and follow-up dates live in scattered notes. Build a lightweight CRM that provides a trustworthy pipeline and follow-up queue, not an automated sales-bot or a full marketing platform.

## Users and roles
- Workspace Admin: manages team membership, pipeline settings, and all workspace records.
- Sales/Account Owner: creates and updates assigned leads/contacts/deals.
- Team Member: accesses only records explicitly assigned or shared.
- Viewer: read-only reports and permitted records.

Enforce authorization in the data/API layer and test both allowed and denied access paths.

## Mandatory MVP
1. Authentication suitable for a local/sandbox demo.
2. Contact and organization records with name, business email/phone fields, source, owner, tags, and timestamps; use synthetic data.
3. Lead/deal pipeline with configurable or clearly documented stages, estimated value, expected close date, and next action.
4. Activity timeline for notes, calls/meetings recorded manually, stage changes, and follow-up updates.
5. Follow-up queue showing due, overdue, and upcoming next actions, with filters by owner, stage, source, and date.
6. Search and normalized duplicate checks, including case-insensitive email comparison where an email is supplied.
7. Dashboard with pipeline counts/value, follow-ups due, and stale opportunities. Clearly label all metrics and assumptions.
8. Input validation, empty/loading/error states, responsive UI, and a synthetic demo dataset.
9. End-to-end acceptance flow: create a lead, add contact details, move it through stages, log an activity, schedule a follow-up, and verify it appears in the correct queue.

## Safety and scope boundaries
- Use synthetic people and companies only.
- No live email, WhatsApp, calling, ad-platform, payment, or third-party enrichment integration is required.
- Never imply a real message was sent. Follow-up actions may be prepared or recorded in-app.
- Do not expose personal/contact details in logs, public URLs, or reports without a clear need.

## Three independently authored skills required
1. **ClientFlow build orchestrator:** coordinates product, UI, data/API, QA, security, and release workstreams with explicit ownership and integration checks.
2. **Lead follow-up accelerator:** e.g., prioritizes overdue follow-ups, flags stale deals, prepares next-action summaries, or detects likely duplicate leads. It must explain its rules and avoid fabricating activity.
3. **CRM data & release assurance:** independently checks workspace access, record ownership, duplicate handling, pipeline transitions, metric consistency, sensitive-data exposure, and test evidence.

These are suggested capability areas; author original instructions and reasoning.

## Acceptance and negative tests
- Users cannot inspect or mutate records outside their permitted workspace/ownership scope.
- A viewer cannot change contacts, activities, or deal stages.
- Duplicate email detection is case-insensitive and does not silently merge records.
- Invalid stage changes and malformed values are rejected.
- Follow-up date boundaries and overdue indicators follow documented timezone rules.
- Refreshing a page does not lose saved updates; activity history reflects key mutations.
- Run and report actual core-flow tests, security-negative tests, static checks, and build results.

## Explicit non-goals
No unsolicited outreach, email/WhatsApp sending, social scraping, real customer-data imports, automated credit decisions, or claims of legally compliant consent management.
