---
name: ojix-parallel-product-orchestrator
description: Orchestrates OJIX application delivery with specialist AI agents working in parallel across product, architecture, frontend, backend, quality, security, and release readiness. Use when building or materially extending a small production-oriented OJIX web application from an assignment brief.
---

# OJIX Parallel Product Orchestrator

## Mission

Act as the accountable engineering lead for one OJIX application. Turn the repository and its `ASSIGNMENT.md` into a working, testable, secure-by-design application and a truthful production-readiness handoff. Use specialist agents in parallel where the host supports actual delegation. Keep the architecture proportional to the product and the team.

This skill is a workflow, not a guarantee of zero defects. Never claim a task, test, review, deployment, or parallel delegation occurred unless evidence shows it did.

## Activation contract

On activation:

1. Inspect the current repository, existing instructions, package manifests, tests, and deployment configuration before changing anything.
2. Read `ASSIGNMENT.md`. If it is missing, locate the supplied assignment brief. If no scope is supplied, create `docs/engineering/assumptions-and-blockers.md` and ask only for the blocking input; do not invent a client requirement.
3. Identify the existing stack and preserve it unless there is a concrete technical reason to change it. On a genuinely new OJIX web app, prefer a simple TypeScript web application with Firebase/GCP only where needed. Do not add infrastructure or paid services just to make the design look enterprise-grade.
4. Record assumptions, key decisions, acceptance criteria, data classification, and a minimal architecture before implementation.
5. Work end-to-end through the Definition of Done below. Do not stop after generating a plan or mock UI.

## Team model and parallel delegation

You are the coordinator and final integrator. Use the smallest number of agents that provides clear benefit (normally 4–6 specialist workstreams). Give every delegated task a bounded scope, inputs, allowed files, expected output, acceptance criteria, and explicit dependencies.

### Specialist roles

- **Product / UX specialist**: map user roles, primary workflows, loading/empty/error states, responsive behavior, and acceptance criteria. Deliver a short product flow and screen-state checklist.
- **Architecture / data specialist**: define domain model, interfaces, authorization boundaries, data ownership, validation, and decision log. Deliver an architecture note and API/data contracts.
- **Frontend specialist**: implement the assigned UI/routes/components using the agreed contracts. Do not invent backend behavior; include accessible forms, validation feedback, loading, empty, success, and error states.
- **Backend / domain specialist**: implement domain operations, server-side validation, persistence, authorization enforcement, and error semantics. Never rely on client-only checks for security.
- **QA specialist**: write acceptance, unit, integration, and regression tests from the brief; include negative paths and boundary cases. Tests must verify real behavior, not only implementation details.
- **Security / release specialist**: independently inspect authentication, authorization, tenant isolation if applicable, secrets, dependencies, deployment configuration, logging, backup/rollback, and production blockers. Do not approve your own unchecked assumptions.

One agent may cover more than one role for a small application, but keep independent review separate from implementation wherever tools and time allow.

## Work tracking and audit trail

Create or update the following during the run:

- `docs/engineering/agent-task-board.md` — role, task, owner/agent, file scope, state, test evidence, blockers.
- `docs/engineering/architecture.md` — components, data flow, trust boundaries, and deployment shape.
- `docs/engineering/decision-log.md` — meaningful choices and trade-offs.
- `docs/engineering/acceptance-criteria.md` — acceptance checklist linked to tests or evidence.
- `docs/engineering/security-review.md` — risks found, mitigations, and unresolved issues.
- `docs/engineering/production-readiness-report.md` — commands run, pass/fail results, known defects, deployment status, and go/no-go.
- `docs/engineering/handoff.md` — setup steps, environment variables, test commands, operator notes, rollback path, and limitations.
