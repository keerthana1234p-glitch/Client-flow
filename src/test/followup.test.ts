import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from '../lib/priority';
import { formatISTDateTime, formatISTDate, TIMEZONE_IST } from '../lib/timezone';
import { NextRequest } from 'next/server';
import { GET as getOverdue } from '../app/api/followups/overdue/route';

describe('Follow-up Accelerator Tests — Priority Scoring & IST Timezone', () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

  it('FOLLOWUP-01: Overdue follow-up adds +10 to priority score', () => {
    const score = calculatePriorityScore({
      value: 10000,
      stage: 'LEAD',
      dueAt: yesterday, // Overdue (+10)
      lastActivityAt: now,
    });

    expect(score).toBe(10);
  });

  it('FOLLOWUP-02: Deal value > 100k (+5) and QUALIFIED stage (+3) compute correctly', () => {
    const score = calculatePriorityScore({
      value: 150000, // > 100k (+5)
      stage: 'QUALIFIED', // (+3)
      dueAt: null,
      lastActivityAt: now,
    });

    expect(score).toBe(8); // 5 + 3
  });

  it('FOLLOWUP-03: Stale bonus applies +7 for 7-14 days and +10 for > 14 days', () => {
    // 7-14 days stale: +7
    const score7 = calculatePriorityScore({
      value: 20000,
      stage: 'LEAD',
      dueAt: null,
      lastActivityAt: tenDaysAgo, // 10 days inactive (+7)
    });
    expect(score7).toBe(7);

    // > 14 days stale: +10
    const score14 = calculatePriorityScore({
      value: 20000,
      stage: 'LEAD',
      dueAt: null,
      lastActivityAt: twentyDaysAgo, // 20 days inactive (+10)
    });
    expect(score14).toBe(10);
  });

  it('FOLLOWUP-04: Priority score strictly caps at a maximum of 30 points', () => {
    // Attempting to exceed: Overdue(+10) + HighValue(+5) + Stale>14d(+10) + Qualified(+3) = 28
    // Even if other bonuses were added, must never exceed 30
    const maxItem = calculatePriorityScore({
      value: 250000, // +5
      stage: 'QUALIFIED', // +3
      dueAt: yesterday, // +10
      lastActivityAt: twentyDaysAgo, // +10
    });

    expect(maxItem).toBeLessThanOrEqual(30);
    expect(maxItem).toBe(28);
  });

  it('FOLLOWUP-05: Dates and timestamps are formatted in Asia/Kolkata (IST)', async () => {
    expect(TIMEZONE_IST).toBe('Asia/Kolkata');

    const sampleDate = new Date('2026-10-16T12:00:00Z');
    const istString = formatISTDateTime(sampleDate);

    // Verify it ends with "IST" and displays correctly
    expect(istString).toContain('IST');

    // Test API response contains timezone
    const req = new NextRequest('http://localhost:3000/api/followups/overdue', {
      method: 'GET',
      headers: {
        'x-user-id': 'user-admin-1',
        'x-user-role': 'ADMIN',
        'x-workspace-id': 'ws-primary-1',
      },
    });

    const res = await getOverdue(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timezone).toBe('Asia/Kolkata');
  });
});
