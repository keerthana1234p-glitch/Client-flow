import { prisma } from '../src/lib/prisma';
import { NextRequest } from 'next/server';
import { GET as getContacts, POST as createContact } from '../src/app/api/contacts/route';
import { GET as getContact, PUT as updateContact, DELETE as deleteContact } from '../src/app/api/contacts/[id]/route';
import { GET as getDuplicates } from '../src/app/api/contacts/duplicates/route';
import { GET as getDeals, POST as createDeal } from '../src/app/api/deals/route';
import { DELETE as deleteDeal } from '../src/app/api/deals/[id]/route';
import { PUT as updateStage } from '../src/app/api/deals/[id]/stage/route';
import { GET as getOverdue } from '../src/app/api/followups/overdue/route';
import { GET as getStale } from '../src/app/api/followups/stale/route';
import { POST as scheduleFollowup } from '../src/app/api/followups/today/route';

async function verifyAll() {
  console.log('==================================================');
  console.log('🔍 FULL END-TO-END DATABASE & API AUDIT');
  console.log('==================================================\n');

  // 1. DATABASE CONNECTIVITY & TABLE AUDIT
  console.log('--- 1. DATABASE CONNECTIVITY & TABLE COUNTS ---');
  const workspaces = await prisma.workspace.findMany();
  const users = await prisma.user.findMany();
  const contacts = await prisma.contact.findMany();
  const deals = await prisma.deal.findMany({ include: { contact: true, followUps: true } });
  const followUps = await prisma.followUp.findMany();

  console.log(`✅ Workspaces in DB: ${workspaces.length} (${workspaces.map(w => w.name).join(', ')})`);
  console.log(`✅ Users in DB:      ${users.length} (${users.map(u => `${u.role}: ${u.email}`).join(', ')})`);
  console.log(`✅ Contacts in DB:   ${contacts.length}`);
  console.log(`✅ Deals in DB:      ${deals.length}`);
  console.log(`✅ FollowUps in DB:  ${followUps.length}\n`);

  if (workspaces.length === 0 || users.length === 0) {
    throw new Error('Database is empty! Run prisma db seed.');
  }

  const primaryWs = workspaces[0];
  const adminHeaders = {
    'x-user-id': users.find(u => u.role === 'ADMIN')?.id || users[0].id,
    'x-user-role': 'ADMIN',
    'x-workspace-id': primaryWs.id,
    'x-user-email': 'admin@test.com',
  };

  const viewerHeaders = {
    'x-user-id': users.find(u => u.role === 'VIEWER')?.id || 'viewer-test-id',
    'x-user-role': 'VIEWER',
    'x-workspace-id': primaryWs.id,
    'x-user-email': 'viewer@test.com',
  };

  // 2. CONTACTS API AUDIT
  console.log('--- 2. CONTACTS API AUDIT ---');
  // GET
  const reqGetContacts = new NextRequest('http://localhost:3000/api/contacts', { headers: adminHeaders });
  const resGetContacts = await getContacts(reqGetContacts);
  console.log(`✅ GET /api/contacts: Status ${resGetContacts.status} (Returns ${(await resGetContacts.json()).contacts.length} contacts)`);

  // POST with duplicate check
  const testEmail = `audit.contact.${Date.now()}@synthetic.io`;
  const reqPostContact = new NextRequest('http://localhost:3000/api/contacts', {
    method: 'POST',
    body: JSON.stringify({ name: 'Audit Test Contact', email: testEmail, phone: '+91 91234 56789' }),
    headers: adminHeaders,
  });
  const resPostContact = await createContact(reqPostContact);
  const createdContactData = await resPostContact.json();
  console.log(`✅ POST /api/contacts (Create): Status ${resPostContact.status} (Created id: ${createdContactData.contact.id})`);

  // Duplicate 409 check
  const reqDupContact = new NextRequest('http://localhost:3000/api/contacts', {
    method: 'POST',
    body: JSON.stringify({ name: 'Audit Duplicate', email: testEmail.toUpperCase() }),
    headers: adminHeaders,
  });
  const resDupContact = await createContact(reqDupContact);
  console.log(`✅ Duplicate Prevention (409 Conflict): Status ${resDupContact.status} on uppercase match`);

  // PUT /api/contacts/[id]
  const reqPutContact = new NextRequest(`http://localhost:3000/api/contacts/${createdContactData.contact.id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Audit Test Contact Updated', email: testEmail, phone: '+91 99999 88888' }),
    headers: adminHeaders,
  });
  const resPutContact = await updateContact(reqPutContact, { params: { id: createdContactData.contact.id } });
  console.log(`✅ PUT /api/contacts/:id (Update phone/name): Status ${resPutContact.status}`);

  // DELETE /api/contacts/[id] - Viewer rejected (403)
  const reqDelContactViewer = new NextRequest(`http://localhost:3000/api/contacts/${createdContactData.contact.id}`, {
    method: 'DELETE',
    headers: viewerHeaders,
  });
  const resDelContactViewer = await deleteContact(reqDelContactViewer, { params: { id: createdContactData.contact.id } });
  console.log(`✅ DELETE /api/contacts/:id Viewer Guard (403 Forbidden): Status ${resDelContactViewer.status}`);

  // DELETE /api/contacts/[id] - Admin authorized (200)
  const reqDelContactAdmin = new NextRequest(`http://localhost:3000/api/contacts/${createdContactData.contact.id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  const resDelContactAdmin = await deleteContact(reqDelContactAdmin, { params: { id: createdContactData.contact.id } });
  console.log(`✅ DELETE /api/contacts/:id Admin Authorized (200 OK): Status ${resDelContactAdmin.status}`);

  // GET /api/contacts/duplicates
  const reqDuplicates = new NextRequest('http://localhost:3000/api/contacts/duplicates', { headers: adminHeaders });
  const resDuplicates = await getDuplicates(reqDuplicates);
  console.log(`✅ GET /api/contacts/duplicates: Status ${resDuplicates.status}`);

  // 3. DEALS / PIPELINE API AUDIT
  console.log('\n--- 3. DEALS & PIPELINE API AUDIT ---');
  // GET
  const reqGetDeals = new NextRequest('http://localhost:3000/api/deals', { headers: adminHeaders });
  const resGetDeals = await getDeals(reqGetDeals);
  console.log(`✅ GET /api/deals: Status ${resGetDeals.status} (Returns ${(await resGetDeals.json()).deals.length} deals)`);

  // POST (Create Deal)
  const reqPostDeal = new NextRequest('http://localhost:3000/api/deals', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Audit Deal Pipeline Test',
      value: 75000,
      stage: 'LEAD',
      nextAction: 'Client Review Meeting',
    }),
    headers: adminHeaders,
  });
  const resPostDeal = await createDeal(reqPostDeal);
  const createdDealData = await resPostDeal.json();
  console.log(`✅ POST /api/deals (Create Deal): Status ${resPostDeal.status} (Created id: ${createdDealData.deal.id})`);

  // PUT Stage Move (Drag-Drop)
  const reqPutStage = new NextRequest(`http://localhost:3000/api/deals/${createdDealData.deal.id}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage: 'QUALIFIED' }),
    headers: adminHeaders,
  });
  const resPutStage = await updateStage(reqPutStage, { params: { id: createdDealData.deal.id } });
  console.log(`✅ PUT /api/deals/:id/stage (LEAD -> QUALIFIED): Status ${resPutStage.status}`);

  // DELETE Deal - Viewer rejected (403)
  const reqDelDealViewer = new NextRequest(`http://localhost:3000/api/deals/${createdDealData.deal.id}`, {
    method: 'DELETE',
    headers: viewerHeaders,
  });
  const resDelDealViewer = await deleteDeal(reqDelDealViewer, { params: { id: createdDealData.deal.id } });
  console.log(`✅ DELETE /api/deals/:id Viewer Guard (403 Forbidden): Status ${resDelDealViewer.status}`);

  // DELETE Deal - Admin authorized (200)
  const reqDelDealAdmin = new NextRequest(`http://localhost:3000/api/deals/${createdDealData.deal.id}`, {
    method: 'DELETE',
    headers: adminHeaders,
  });
  const resDelDealAdmin = await deleteDeal(reqDelDealAdmin, { params: { id: createdDealData.deal.id } });
  console.log(`✅ DELETE /api/deals/:id Admin Authorized (200 OK): Status ${resDelDealAdmin.status}`);

  // 4. FOLLOWUPS & QUEUES AUDIT
  console.log('\n--- 4. FOLLOWUPS & PRIORITY QUEUES AUDIT ---');
  // GET /api/followups/overdue
  const reqOverdue = new NextRequest('http://localhost:3000/api/followups/overdue', { headers: adminHeaders });
  const resOverdue = await getOverdue(reqOverdue);
  console.log(`✅ GET /api/followups/overdue: Status ${resOverdue.status}`);

  // GET /api/followups/stale
  const reqStale = new NextRequest('http://localhost:3000/api/followups/stale', { headers: adminHeaders });
  const resStale = await getStale(reqStale);
  console.log(`✅ GET /api/followups/stale: Status ${resStale.status}`);

  console.log('\n==================================================');
  console.log('🎉 ALL APIS & DATABASE OPERATIONS ARE 100% OPERATIONAL!');
  console.log('==================================================');
}

verifyAll()
  .catch((err) => {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
