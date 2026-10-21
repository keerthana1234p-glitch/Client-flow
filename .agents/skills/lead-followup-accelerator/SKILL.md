---
name: lead-followup-accelerator
description: Accelerates sales follow-ups by analyzing pipeline health, triaging overdue actions with exact priority scoring (max 30), flagging stale deals (7-14d yellow, >14d red), detecting contact duplicates case-insensitively, and formatting all dates in IST (Asia/Kolkata).
---

# Lead Follow-Up Accelerator Skill

## Mission & Purpose
The **Lead Follow-Up Accelerator** automates follow-up triage, calculates deterministic priority scores, detects duplicate leads case-insensitively within workspaces, and flags pipeline rot.

---

## 1. Priority Score Formula (Max 30, Sorted DESC)
Every active deal/follow-up receives a deterministic priority score:
$$\text{Priority Score} = \min(30, \text{Overdue} + \text{HighValue} + \text{StaleBonus} + \text{StageBonus})$$

Where:
- **Overdue**: $+10$ if `dueAt < now` (IST)
- **High Value**: $+5$ if deal `value > 100,000`
- **Stale Decay**:
  - $+7$ if inactive for $> 7$ days but $\le 14$ days
  - $+10$ if inactive for $> 14$ days
- **Stage**: $+3$ if deal stage is `QUALIFIED`
- **Maximum Cap**: Strictly capped at 30 points. Sorted in descending order.

---

## 2. Duplicate Detection Rules
- **Email Match**: Case-insensitive exact match (`mode: 'insensitive'`). Same workspace $\rightarrow$ HTTP 409 Conflict. Different workspace $\rightarrow$ Allowed.
- **Phone Match**: Normalized numeric comparison (95% similarity).

---

## 3. Timezone Specification
- **Timezone**: Strictly `Asia/Kolkata` (IST) everywhere.
- Dates rendered as `DD MMM YYYY, hh:mm A IST`.

---

## 4. Dedicated Queues
- `/queue/overdue`: RED badge, sorted by Priority Score DESC, IST dates.
- `/queue/stale`: YELLOW badge for 7–14 days, RED badge for $>14$ days.
- `/queue/duplicates`: Grouped cluster view by matched emails/phones.
- `/queue/today`: Deals with follow-ups scheduled for today in IST.
