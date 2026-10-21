import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, enforceRBAC } from '@/lib/auth';
import { formatISTDateTime, isTodayIST } from '@/lib/timezone';
import { calculatePriorityScore } from '@/lib/priority';

export async function GET(req: NextRequest) {
  const session = getAuthSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all pending follow-ups for workspace
  const followUps = await prisma.followUp.findMany({
    where: {
      workspaceId: session.workspaceId,
      status: 'PENDING',
    },
    include: {
      deal: {
        include: {
          contact: true,
        },
      },
    },
  });

  // Filter for today in IST
  const todayItems = followUps.filter((f) => isTodayIST(f.dueAt));

  const formatted = todayItems.map((f) => ({
    id: f.id,
    action: f.action,
    dueAt: f.dueAt.toISOString(),
    dueAtIST: formatISTDateTime(f.dueAt),
    priorityScore: calculatePriorityScore({
      value: f.deal.value,
      stage: f.deal.stage,
      dueAt: f.dueAt,
      lastActivityAt: f.deal.lastActivityAt,
    }),
    deal: {
      id: f.deal.id,
      title: f.deal.title,
      value: f.deal.value,
      stage: f.deal.stage,
      contactName: f.deal.contact?.name || 'Unassigned',
    },
  }));

  return NextResponse.json({
    dueToday: formatted,
    count: formatted.length,
    timezone: 'Asia/Kolkata',
  });
}

export async function POST(req: NextRequest) {
  const session = getAuthSession(req);
  const rbacError = enforceRBAC(req, session);
  if (rbacError) return rbacError;

  try {
    const { dealId, action, dueAt } = await req.json();

    if (!dealId || !dueAt) {
      return NextResponse.json({ error: 'dealId and dueAt are required' }, { status: 400 });
    }

    const newFollowUp = await prisma.followUp.create({
      data: {
        dealId,
        action: action ? action.trim() : 'Touchpoint scheduled',
        dueAt: new Date(dueAt),
        status: 'PENDING',
        workspaceId: session!.workspaceId,
      },
    });

    // Refresh lastActivityAt on deal
    await prisma.deal.update({
      where: { id: dealId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ followUp: newFollowUp }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
