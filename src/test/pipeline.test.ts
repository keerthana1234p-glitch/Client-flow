import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT as updateDealStage } from '../app/api/deals/[id]/stage/route';

describe('Pipeline Kanban & Stage Transition Tests', () => {
  const adminHeaders = {
    'x-user-id': 'user-admin-1',
    'x-user-role': 'ADMIN',
    'x-workspace-id': 'ws-primary-1',
  };

  it('PIPE-01: Drag-drop PUT /api/deals/:id/stage updates stage to QUALIFIED, WON, or LOST', async () => {
    const req = new NextRequest('http://localhost:3000/api/deals/d-1/stage', {
      method: 'PUT',
      body: JSON.stringify({ stage: 'WON' }),
      headers: adminHeaders,
    });

    const res = await updateDealStage(req, { params: { id: 'd-1' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deal.stage).toBe('WON');
  });

  it('PIPE-02: Stage update automatically refreshes lastActivityAt timestamp', async () => {
    const beforeUpdate = new Date().getTime();

    const req = new NextRequest('http://localhost:3000/api/deals/d-2/stage', {
      method: 'PUT',
      body: JSON.stringify({ stage: 'QUALIFIED' }),
      headers: adminHeaders,
    });

    const res = await updateDealStage(req, { params: { id: 'd-2' } });
    expect(res.status).toBe(200);
    const body = await res.json();

    const activityTime = new Date(body.deal.lastActivityAt).getTime();
    expect(activityTime).toBeGreaterThanOrEqual(beforeUpdate - 2000);
  });

  it('PIPE-03: Invalid stage name returns HTTP 400 Bad Request', async () => {
    const req = new NextRequest('http://localhost:3000/api/deals/d-1/stage', {
      method: 'PUT',
      body: JSON.stringify({ stage: 'NON_EXISTENT_STAGE' }),
      headers: adminHeaders,
    });

    const res = await updateDealStage(req, { params: { id: 'd-1' } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid stage');
  });
});
