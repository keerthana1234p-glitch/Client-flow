import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for OJIX ClientFlow...');

  // Clear existing records
  await prisma.note.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  // 1. Create Workspace 1 (Primary Test Workspace)
  const ws1 = await prisma.workspace.create({
    data: {
      id: 'ws-primary-1',
      name: 'Acme Primary Workspace',
    },
  });

  // 2. Create Workspace 2 (Isolated Secondary Workspace for Multi-tenant Tests)
  const ws2 = await prisma.workspace.create({
    data: {
      id: 'ws-secondary-2',
      name: 'Beta Global Isolation Workspace',
    },
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Create Seed Users in Workspace 1 with role-specific passwords
  const adminUser = await prisma.user.create({
    data: {
      id: 'user-admin-1',
      email: 'admin@test.com',
      password: await bcrypt.hash('123456', 10),
      name: 'Admin',
      role: 'ADMIN',
      workspaceId: ws1.id,
    },
  });

  const ownerUser = await prisma.user.create({
    data: {
      id: 'user-owner-1',
      email: 'owner@test.com',
      password: await bcrypt.hash('12345', 10),
      name: 'Sales Owner',
      role: 'OWNER',
      workspaceId: ws1.id,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      id: 'user-viewer-1',
      email: 'viewer@test.com',
      password: await bcrypt.hash('123', 10),
      name: 'Viewer',
      role: 'VIEWER',
      workspaceId: ws1.id,
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      id: 'user-member-1',
      email: 'member@test.com',
      password: await bcrypt.hash('1234', 10),
      name: 'Team Member',
      role: 'MEMBER',
      workspaceId: ws1.id,
    },
  });

  // Create an Isolation User in Workspace 2
  await prisma.user.create({
    data: {
      id: 'user-iso-2',
      email: 'isolation@beta.test',
      password: hashedPassword,
      name: 'Elena Beta',
      role: 'OWNER',
      workspaceId: ws2.id,
    },
  });

  // 4. Create Contacts in Workspace 1
  const contact1 = await prisma.contact.create({
    data: {
      id: 'c-1',
      name: 'Sophia Sterling',
      email: 'sophia@aurarobotics.synthetic',
      phone: '+91 98765 43210',
      workspaceId: ws1.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      id: 'c-2',
      name: 'Liam Gallagher',
      email: 'liam@cloudwave.synthetic',
      phone: '+91 98765 43211',
      workspaceId: ws1.id,
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      id: 'c-3',
      name: 'Dr. Aris Thorne',
      email: 'aris@meridian.synthetic',
      phone: '+91 98765 43212',
      workspaceId: ws1.id,
    },
  });

  // Contact in Workspace 2 (Same email as contact1 to verify multi-tenant isolation!)
  await prisma.contact.create({
    data: {
      id: 'c-ws2-1',
      name: 'Sophia Other Org',
      email: 'sophia@aurarobotics.synthetic', // Same email, different workspace -> ALLOWED
      phone: '+91 99999 88888',
      workspaceId: ws2.id,
    },
  });

  // 5. Create Deals in Workspace 1
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysAhead = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Deal 1: High value (>100k), QUALIFIED, Overdue follow-up (high priority score candidate)
  const deal1 = await prisma.deal.create({
    data: {
      id: 'd-1',
      title: 'Autonomous Fleet Telemetry Suite',
      value: 125000, // > 100k (+5)
      stage: 'QUALIFIED', // (+3)
      temperature: 'HOT',
      contactId: contact1.id,
      workspaceId: ws1.id,
      lastActivityAt: daysAgo(2),
    },
  });

  // Deal 2: Stale (>14 days), LEAD, Overdue follow-up
  const deal2 = await prisma.deal.create({
    data: {
      id: 'd-2',
      title: 'Kubernetes Multi-Region Cluster',
      value: 45000,
      stage: 'LEAD',
      temperature: 'WARM',
      contactId: contact2.id,
      workspaceId: ws1.id,
      lastActivityAt: daysAgo(16), // > 14 days stale (+10)
    },
  });

  // Deal 3: Stale (7-14 days), QUALIFIED, Today follow-up
  const deal3 = await prisma.deal.create({
    data: {
      id: 'd-3',
      title: 'AI Diagnostic Radiology Portal',
      value: 80000,
      stage: 'QUALIFIED', // (+3)
      temperature: 'HOT',
      contactId: contact3.id,
      workspaceId: ws1.id,
      lastActivityAt: daysAgo(9), // 7-14 days stale (+7)
    },
  });

  // Deal 4: Closed Won
  const deal4 = await prisma.deal.create({
    data: {
      id: 'd-4',
      title: 'Enterprise Single Sign-On Module',
      value: 35000,
      stage: 'WON',
      temperature: 'NORMAL',
      contactId: contact1.id,
      workspaceId: ws1.id,
      lastActivityAt: daysAgo(1),
    },
  });
  // Deal 5 in Workspace 2 (Isolated)
  await prisma.deal.create({
    data: {
      id: 'd-ws2-1',
      title: 'Confidential Workspace 2 Secret Contract',
      value: 500000,
      stage: 'LEAD',
      temperature: 'NORMAL',
      workspaceId: ws2.id,
      lastActivityAt: now,
    },
  });

  // 6. Create FollowUps
  // Overdue follow-up (due 3 days ago in IST)
  await prisma.followUp.create({
    data: {
      id: 'f-1',
      dueAt: daysAgo(3),
      status: 'PENDING',
      action: 'Finalize Master Service Agreement SLA terms',
      dealId: deal1.id,
      workspaceId: ws1.id,
    },
  });

  // Overdue follow-up (due 1 day ago)
  await prisma.followUp.create({
    data: {
      id: 'f-2',
      dueAt: daysAgo(1),
      status: 'PENDING',
      action: 'Check in on technical RFP sign-off',
      dealId: deal2.id,
      workspaceId: ws1.id,
    },
  });

  // Due today follow-up
  await prisma.followUp.create({
    data: {
      id: 'f-3',
      dueAt: now,
      status: 'PENDING',
      action: 'Executive alignment demonstration call',
      dealId: deal3.id,
      workspaceId: ws1.id,
    },
  });

  // Upcoming follow-up (in 4 days)
  await prisma.followUp.create({
    data: {
      id: 'f-4',
      dueAt: daysAhead(4),
      status: 'PENDING',
      action: 'Kickoff onboarding sprint review',
      dealId: deal4.id,
      workspaceId: ws1.id,
    },
  });

  // 7. Create Notes
  await prisma.note.create({
    data: {
      id: 'n-1',
      content: 'Customer confirmed budget clearance for Q4 rollout.',
      dealId: deal1.id,
      workspaceId: ws1.id,
    },
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
