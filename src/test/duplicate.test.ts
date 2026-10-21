import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createContact } from '../app/api/contacts/route';
import { GET as getDuplicates } from '../app/api/contacts/duplicates/route';

describe('Case-Insensitive Deduplication Tests (HTTP 409 Conflict)', () => {
  const adminHeaders = {
    'x-user-id': 'user-admin-1',
    'x-user-role': 'ADMIN',
    'x-workspace-id': 'ws-primary-1',
  };

  it('DEDUP-01: Submitting an existing email in the same workspace triggers HTTP 409 Conflict', async () => {
    // sophia@aurarobotics.synthetic is seeded in ws-primary-1
    const req = new NextRequest('http://localhost:3000/api/contacts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Sophia Twin',
        email: 'sophia@aurarobotics.synthetic',
        phone: '+91 99999 00000',
      }),
      headers: adminHeaders,
    });

    const res = await createContact(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already exists in this workspace');
  });

  it('DEDUP-02: Submitting uppercase TEST@MAIL.COM against lowercase test@mail.com returns 409', async () => {
    // Seeded with lowercase: liam@cloudwave.synthetic
    const req = new NextRequest('http://localhost:3000/api/contacts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Liam Clone',
        email: 'LIAM@CLOUDWAVE.SYNTHETIC', // UPPERCASE
        phone: '+91 99999 11111',
      }),
      headers: adminHeaders,
    });

    const res = await createContact(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already exists in this workspace');
  });

  it('DEDUP-03: Submitting email with surrounding whitespace is normalized and returns 409', async () => {
    const req = new NextRequest('http://localhost:3000/api/contacts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Aris Duplicate',
        email: '   aris@meridian.synthetic   ', // with whitespace
        phone: '+91 99999 22222',
      }),
      headers: adminHeaders,
    });

    const res = await createContact(req);
    expect(res.status).toBe(409);
  });

  it('DEDUP-04: GET /api/contacts/duplicates scans and clusters workspace records', async () => {
    const req = new NextRequest('http://localhost:3000/api/contacts/duplicates', {
      method: 'GET',
      headers: adminHeaders,
    });

    const res = await getDuplicates(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('duplicates');
    expect(body).toHaveProperty('totalDuplicateClusters');
  });
});
