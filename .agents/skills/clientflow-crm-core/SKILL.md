---
name: clientflow-crm-core
description: Builds and manages the ClientFlow CRM core pipeline, drag-and-drop Kanban board, deal stage transitions (LEAD, QUALIFIED, WON, LOST), and contact relationships with workspace isolation.
---

# ClientFlow CRM Core Skill

## Mission & Purpose
The **ClientFlow CRM Core Skill** provides the core commercial pipeline mechanics for ClientFlow. It governs deal stages, drag-and-drop Kanban interactions, stage progression rules, and contact associations within strict workspace boundaries.

---

## 1. Domain Entities & Stages
- **Stages**:
  - `LEAD`: Initial inbound inquiry or raw prospect.
  - `QUALIFIED`: Fit, budget, and business timeline confirmed.
  - `WON`: Contract executed and closed successfully.
  - `LOST`: Opportunity archived with documented outcome.

## 2. Transition Rules
- Stages can transition smoothly across the Kanban board.
- Any stage change MUST update `lastActivityAt` to the current timestamp.
- Mutations MUST verify that the active user possesses permission (`ADMIN` or `OWNER`). `VIEWER` mutations are strictly rejected with HTTP 403 Forbidden.

## 3. Workspace Isolation Contract
- Every contact, deal, follow-up, and note MUST belong to an explicit `workspaceId`.
- No cross-tenant data leakage is permitted under any circumstance.
