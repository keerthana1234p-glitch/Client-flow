# OJIX ClientFlow — Security & Access Control Review

## 1. Threat Modeling & Scope
The application handles CRM records (contacts, organizations, deals, follow-ups). 
Per the assignment brief:
- **Synthetic Data**: No real customer or financial data is stored or processed.
- **No External Sending**: No real emails, WhatsApp messages, or web scraping occur.
- **Boundaries**: All operations stay within the authenticated workspace.

---

## 2. Security Controls & Authorization Matrix

| Control Area | Security Risk | Mitigation Strategy | Enforcement Layer | Status |
| :--- | :--- | :--- | :--- | :---: |
| **RBAC Enforcement** | Unauthorized mutation of deals/stages by Viewers or external members. | Authoritative `canUserPerform()` checks on every mutating method in `store.ts`. Throws `AuthorizationError`. | Data/Service Layer | VERIFIED |
| **Viewer Restrictions** | Viewer editing contact information or moving stages. | Blocked both in UI (read-only state) and in domain store methods (`updateDealStage`, `createContact`, etc.). | Service & UI | VERIFIED |
| **Member Isolation** | Team member modifying another rep's deal. | Record ownership check (`record.ownerId === user.id || user.role === 'admin'`). | Service Layer | VERIFIED |
| **Duplicate Prevention** | Duplicate emails silently overwriting existing contact records. | Lowercase normalization check. Returns conflict warning rather than merging. | Deduplication Service | VERIFIED |
| **Input Sanitization** | Malformed values, negative deal amounts, invalid stage names. | Strict schema and type checking on all mutations. | Domain Logic | VERIFIED |
| **PII & Log Protection** | Contact emails/phones printed into public logs or debug consoles. | Console logging scrubs contact details; synthetic identifiers used. | Application Core | VERIFIED |

---

## 3. Negative Security Test Cases (Automated)

1. **Test SEC-01:** Viewer attempts `createContact()` -> Expect `AuthorizationError: Role "viewer" cannot create contacts`.
2. **Test SEC-02:** Viewer attempts `updateDealStage()` -> Expect `AuthorizationError: Role "viewer" cannot update deal stages`.
3. **Test SEC-03:** Team Member attempts to mutate a deal owned by another user -> Expect `AuthorizationError: Not authorized to modify this record`.
4. **Test SEC-04:** Attempt to advance deal to an invalid stage name -> Expect `ValidationError: Invalid stage transition`.
5. **Test SEC-05:** Submitting duplicate email with mixed case (`Alex@Corp.com` vs `alex@corp.com`) -> Triggers conflict warning without data loss.
