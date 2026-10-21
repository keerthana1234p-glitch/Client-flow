---
name: production-assurance
description: Independently verifies workspace access, RBAC ownership enforcement (Viewer 403), duplicate handling (409), multi-workspace isolation, IST timezone rendering, and 20 automated tests before production release.
---

# Production Assurance Skill

## Mission & Purpose
The **Production Assurance Skill** acts as an adversarial gatekeeper. It audits:
1. **RBAC Enforcement**: Confirms `VIEWER` gets 403 Forbidden on any `POST`, `PUT`, `DELETE`.
2. **Workspace Isolation**: Verifies that every database operation filters by `workspaceId`, ensuring zero cross-tenant leaks.
3. **Case-Insensitive Deduplication**: Confirms `mode: 'insensitive'` for emails, returning 409 Conflict within the same workspace, while permitting the same email in different workspaces.
4. **Timezone Accuracy**: Confirms `Asia/Kolkata` (IST) formatting on all dates and overdue queues.
5. **Automated Test Suite**: Enforces that all 20 tests pass without error:
   - `rbac.test.ts` (5 tests)
   - `isolation.test.ts` (3 tests)
   - `duplicate.test.ts` (4 tests)
   - `followup.test.ts` (5 tests)
   - `pipeline.test.ts` (3 tests)
6. **Build Verification**: Confirms `npx tsc --noEmit` and `npm run build` exit with code 0.
