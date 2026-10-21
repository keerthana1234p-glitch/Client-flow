import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getAuthSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Workspace Isolation
  const contacts = await prisma.contact.findMany({
    where: {
      workspaceId: session.workspaceId,
    },
    include: {
      deals: true,
    },
  });

  // Group by normalized email
  const emailMap = new Map<string, typeof contacts>();
  const phoneMap = new Map<string, typeof contacts>();

  for (const c of contacts) {
    const normEmail = c.email.trim().toLowerCase();
    const emailList = emailMap.get(normEmail) || [];
    emailList.push(c);
    emailMap.set(normEmail, emailList);

    if (c.phone) {
      const cleanPhone = c.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 7) {
        const phoneList = phoneMap.get(cleanPhone) || [];
        phoneList.push(c);
        phoneMap.set(cleanPhone, phoneList);
      }
    }
  }

  const emailDuplicates = Array.from(emailMap.entries())
    .filter(([_, list]) => list.length > 1)
    .map(([email, matches]) => ({
      type: 'email_match',
      identifier: email,
      count: matches.length,
      contacts: matches,
    }));

  const phoneDuplicates = Array.from(phoneMap.entries())
    .filter(([_, list]) => list.length > 1)
    .map(([phone, matches]) => ({
      type: 'phone_match',
      identifier: phone,
      count: matches.length,
      contacts: matches,
    }));

  return NextResponse.json({
    duplicates: [...emailDuplicates, ...phoneDuplicates],
    totalDuplicateClusters: emailDuplicates.length + phoneDuplicates.length,
  });
}
