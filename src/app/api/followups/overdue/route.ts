import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { formatISTDateTime, isOverdueIST } from '@/lib/timezone';
import { calculatePriorityScore } from '@/lib/priority';

export async function GET(req: NextRequest) {
  const session = getAuthSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find all pending follow-ups in this workspace where dueAt < now and deal is still active (not WON/LOST)
  const overdueFollowUps = await prisma.followUp.findMany({
    where: {
      workspaceId: session.workspaceId,
      status: 'PENDING',
      dueAt: {
        lt: now,
      },
      deal: {
        stage: {
          notIn: ['WON', 'LOST'],
        },
      },
    },
    include: {
      deal: {
        include: {
          contact: true,
        },
      },
    },
  });

  // Calculate priority score for each overdue item
  const formattedItems = overdueFollowUps.map((f) => {
    const priorityScore = calculatePriorityScore({
      value: f.deal.value,
      stage: f.deal.stage,
      dueAt: f.dueAt,
      lastActivityAt: f.deal.lastActivityAt,
    });

    return {
      id: f.id,
      action: f.action || 'Follow-up Required',
      dueAt: f.dueAt.toISOString(),
      dueAtIST: formatISTDateTime(f.dueAt),
      status: f.status,
      badge: 'RED_OVERDUE',
      priorityScore,
      deal: {
        id: f.deal.id,
        title: f.deal.title,
        value: f.deal.value,
        stage: f.deal.stage,
        contactName: f.deal.contact?.name || 'Unassigned',
        contactEmail: f.deal.contact?.email || '',
        lastActivityAtIST: formatISTDateTime(f.deal.lastActivityAt),
      },
    };
  });

  // Sort by priorityScore DESC as mandated by checklist
  formattedItems.sort((a, b) => b.priorityScore - a.priorityScore);

  return NextResponse.json({
    overdue: formattedItems,
    count: formattedItems.length,
    timezone: 'Asia/Kolkata',
  });
}
