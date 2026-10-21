import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { formatISTDateTime, getDaysDifferenceIST } from '@/lib/timezone';
import { calculatePriorityScore } from '@/lib/priority';

export async function GET(req: NextRequest) {
  const session = getAuthSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Stale deals are active (not WON or LOST) and lastActivityAt < 7 days ago
  const staleDeals = await prisma.deal.findMany({
    where: {
      workspaceId: session.workspaceId,
      stage: {
        in: ['LEAD', 'QUALIFIED'],
      },
      lastActivityAt: {
        lt: sevenDaysAgo,
      },
    },
    include: {
      contact: true,
      followUps: {
        where: { status: 'PENDING' },
        orderBy: { dueAt: 'asc' },
        take: 1,
      },
    },
  });

  const formatted = staleDeals.map((deal) => {
    const daysInactive = getDaysDifferenceIST(deal.lastActivityAt);
    const staleLevel = daysInactive > 14 ? 'RED' : 'YELLOW';
    const nextFollowUp = deal.followUps[0] || null;

    const priorityScore = calculatePriorityScore({
      value: deal.value,
      stage: deal.stage,
      dueAt: nextFollowUp ? nextFollowUp.dueAt : null,
      lastActivityAt: deal.lastActivityAt,
    });

    return {
      id: deal.id,
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      daysInactive,
      staleLevel, // 'YELLOW' (7-14d) or 'RED' (>14d)
      lastActivityAtIST: formatISTDateTime(deal.lastActivityAt),
      contactName: deal.contact?.name || 'Unassigned',
      priorityScore,
      nextAction: nextFollowUp ? nextFollowUp.action : 'No follow-up set',
      nextDueAtIST: nextFollowUp ? formatISTDateTime(nextFollowUp.dueAt) : null,
    };
  });

  formatted.sort((a, b) => b.daysInactive - a.daysInactive);

  return NextResponse.json({
    staleDeals: formatted,
    count: formatted.length,
    timezone: 'Asia/Kolkata',
  });
}
