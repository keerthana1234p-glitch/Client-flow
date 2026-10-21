import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { enforceRBAC, AuthSession } from '../lib/auth';
import { POST as createContact } from '../app/api/contacts/route';
import { POST as createDeal } from '../app/api/deals/route';
import { PUT as updateStage } from '../app/api/deals/[id]/stage/route';
import { POST as scheduleFollowup } from '../app/api/followups/today/route';

describe('RBAC Security Tests — Viewer Mutation Restrictions (403 Forbidden)', () => {
  const viewerSession: AuthSession = {
    userId: 'user-viewer-1',
    email: 'viewer@test.com',
    name: 'Viewer',
    role: 'VIEWER',
    workspaceId: 'ws-primary-1',
  };

  const adminSession: AuthSession = {
    userId: 'user-admin-1',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'ADMIN',
    workspaceId: 'ws-primary-1',
  };

  it('RBAC-01: Viewer is rejected with 403 on POST /api/contacts', async () => {
    const req = new NextRequest('http://localhost:3000/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacker', email: 'hacker@test.synthetic' }),
      headers: {
        'x-user-id': viewerSession.userId,
        'x-user-role': viewerSession.role,
        'x-workspace-id': viewerSession.workspaceId,
      },
    });

    const res = await createContact(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Viewer role has read-only access');
  });

  it('RBAC-02: Viewer is rejected with 403 on POST /api/deals', async () => {
    const req = new NextRequest('http://localhost:3000/api/deals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Illegal Deal', value: 50000, stage: 'LEAD' }),
      headers: {
        'x-user-id': viewerSession.userId,
        'x-user-role': viewerSession.role,
        'x-workspace-id': viewerSession.workspaceId,
      },
    });

    const res = await createDeal(req);
    expect(res.status).toBe(403);
  });

  it('RBAC-03: Viewer is rejected with 403 on PUT /api/deals/:id/stage (drag-drop)', async () => {
    const req = new NextRequest('http://localhost:3000/api/deals/d-1/stage', {
      method: 'PUT',
      body: JSON.stringify({ stage: 'WON' }),
      headers: {
        'x-user-id': viewerSession.userId,
        'x-user-role': viewerSession.role,
        'x-workspace-id': viewerSession.workspaceId,
      },
    });

    const res = await updateStage(req, { params: { id: 'd-1' } });
    expect(res.status).toBe(403);
  });

  it('RBAC-04: Viewer is rejected with 403 on POST /api/followups/today', async () => {
    const req = new NextRequest('http://localhost:3000/api/followups/today', {
      method: 'POST',
      body: JSON.stringify({ dealId: 'd-1', action: 'Illegal Followup', dueAt: new Date().toISOString() }),
      headers: {
        'x-user-id': viewerSession.userId,
        'x-user-role': viewerSession.role,
        'x-workspace-id': viewerSession.workspaceId,
      },
    });

    const res = await scheduleFollowup(req);
    expect(res.status).toBe(403);
  });

  it('RBAC-05: Viewer is granted read-only access on GET requests', () => {
    const getReq = new NextRequest('http://localhost:3000/api/deals', { method: 'GET' });
    const check = enforceRBAC(getReq, viewerSession);
    expect(check).toBeNull(); // Allowed!
  });
});
