import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, enforceRBAC } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getAuthSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deals = await prisma.deal.findMany({
    where: {
      workspaceId: session.workspaceId,
    },
    include: {
      contact: true,
      followUps: true,
      notes: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({ deals });
}

export async function POST(req: NextRequest) {
  const session = getAuthSession(req);
  const rbacError = enforceRBAC(req, session);
  if (rbacError) return rbacError;

  try {
    const { title, value, stage, contactId, nextAction, dueDate, notes, temperature } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Deal title is required' }, { status: 400 });
    }

    const dealValue = Number(value) || 0;
    if (dealValue < 0) {
      return NextResponse.json({ error: 'Deal value cannot be negative' }, { status: 400 });
    }

    const validStages = ['LEAD', 'QUALIFIED', 'WON', 'LOST'];
    const assignedStage = (stage || 'LEAD').toUpperCase();
    if (!validStages.includes(assignedStage)) {
      return NextResponse.json({ error: `Invalid stage: ${stage}` }, { status: 400 });
    }

    // Clean deal title
    const finalTitle = title.trim();

    const newDeal = await prisma.deal.create({
      data: {
        title: finalTitle,
        value: dealValue,
        stage: assignedStage,
        contactId: contactId && contactId.trim() ? contactId.trim() : null,
        workspaceId: session!.workspaceId,
        lastActivityAt: new Date(),
      },
    });

    // Create Initial Follow-up if action or due date is specified
    if (nextAction && nextAction.trim()) {
      const parsedDueAt = dueDate ? new Date(dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      await prisma.followUp.create({
        data: {
          action: nextAction.trim(),
          dueAt: isNaN(parsedDueAt.getTime()) ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : parsedDueAt,
          status: 'PENDING',
          dealId: newDeal.id,
          workspaceId: session!.workspaceId,
        },
      });
    }

    // Create Initial Note if provided
    if (notes && notes.trim()) {
      await prisma.note.create({
        data: {
          content: notes.trim(),
          dealId: newDeal.id,
          workspaceId: session!.workspaceId,
        },
      });
    }

    const completeDeal = await prisma.deal.findUnique({
      where: { id: newDeal.id },
      include: {
        contact: true,
        followUps: true,
        notes: true,
      },
    });

    return NextResponse.json({ deal: completeDeal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create deal' }, { status: 500 });
  }
}
