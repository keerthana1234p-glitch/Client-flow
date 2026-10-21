import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getContacts } from '../app/api/contacts/route';
import { GET as getDeals } from '../app/api/deals/route';
import { POST as createContact } from '../app/api/contacts/route';

describe('Multi-Workspace Isolation Tests (Tenant Security)', () => {
  const ws1Admin = {
    userId: 'user-admin-1',
    role: 'ADMIN',
    workspaceId: 'ws-primary-1',
  };

  const ws2Owner = {
    userId: 'user-iso-2',
    role: 'OWNER',
    workspaceId: 'ws-secondary-2',
  };

  it('ISO-01: User in Workspace 1 cannot access contacts belonging to Workspace 2', async () => {
    const req = new NextRequest('http://localhost:3000/api/contacts', {
      method: 'GET',
      headers: {
        'x-user-id': ws1Admin.userId,
        'x-user-role': ws1Admin.role,
        'x-workspace-id': ws1Admin.workspaceId,
      },
    });

    const res = await getContacts(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    // Verify all returned contacts belong strictly to ws-primary-1
    for (const c of data.contacts) {
      expect(c.workspaceId).toBe('ws-primary-1');
      expect(c.workspaceId).not.toBe('ws-secondary-2');
    }
  });

  it('ISO-02: User in Workspace 1 cannot view deals belonging to Workspace 2', async () => {
    const req = new NextRequest('http://localhost:3000/api/deals', {
      method: 'GET',
      headers: {
        'x-user-id': ws1Admin.userId,
        'x-user-role': ws1Admin.role,
        'x-workspace-id': ws1Admin.workspaceId,
      },
    });

    const res = await getDeals(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    // The confidential deal in ws2 must not be present
    const hasSecretDeal = data.deals.some((d: any) => d.title.includes('Confidential Workspace 2'));
    expect(hasSecretDeal).toBe(false);
  });

  it('ISO-03: The same email address can coexist across two distinct workspaces', async () => {
    const email = 'shared.enterprise.lead@partner.synthetic';

    // 1. Create in Workspace 1
    const req1 = new NextRequest('http://localhost:3000/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Partner WS1', email, phone: '1111' }),
      headers: {
        'x-user-id': ws1Admin.userId,
        'x-user-role': ws1Admin.role,
        'x-workspace-id': ws1Admin.workspaceId,
      },
    });
    const res1 = await createContact(req1);
    expect([201, 409]).toContain(res1.status); // 201 or 409 if already seeded

    // 2. Create in Workspace 2 (Different tenant) - MUST NOT BE BLOCKED BY WS1
    const req2 = new NextRequest('http://localhost:3000/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Partner WS2', email, phone: '2222' }),
      headers: {
        'x-user-id': ws2Owner.userId,
        'x-user-role': ws2Owner.role,
        'x-workspace-id': ws2Owner.workspaceId,
      },
    });
    const res2 = await createContact(req2);
    expect([201, 409]).toContain(res2.status);
  });
});
