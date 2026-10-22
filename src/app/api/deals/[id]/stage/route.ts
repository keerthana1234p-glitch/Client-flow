import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, enforceRBAC } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getAuthSession(req);
  const rbacError = enforceRBAC(req, session);
  if (rbacError) return rbacError;

  const dealId = params.id;
  const { stage } = await req.json();

  const validStages = ['LEAD', 'QUALIFIED', 'WON', 'LOST'];
  const newStage = (stage || '').toUpperCase();

  if (!validStages.includes(newStage)) {
    return NextResponse.json(
      { error: `Invalid stage: ${stage}. Valid stages are: LEAD, QUALIFIED, WON, LOST` },
      { status: 400 }
    );
  }

  // Verify deal exists and belongs to current workspace
  const existing = await prisma.deal.findFirst({
    where: {
      id: dealId,
      workspaceId: session!.workspaceId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Deal not found in this workspace' }, { status: 404 });
  }

  // If deal is closed (WON or LOST), auto-complete all pending follow-up touchpoints
  if (newStage === 'WON' || newStage === 'LOST') {
    await prisma.followUp.updateMany({
      where: {
        dealId: dealId,
        status: 'PENDING',
      },
      data: {
        status: 'DONE',
      },
    });

    // Automatically log integration sync for Closed Won deals
    if (newStage === 'WON') {
      try {
        await prisma.note.create({
          data: {
            content: `Deal marked Closed Won. Delivery project data synchronized.`,
            dealId: dealId,
            workspaceId: session!.workspaceId,
          },
        });

        // If an external TeamFlow webhook URL is configured, trigger it asynchronously
        const webhookUrl = process.env.TEAMFLOW_WEBHOOK_URL;
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.TEAMFLOW_API_KEY || 'ojix-teamflow-sync-2026',
            },
            body: JSON.stringify({
              event: 'deal.won',
              dealId: existing.id,
              title: existing.title,
              value: existing.value,
              syncedAt: new Date().toISOString(),
            }),
          }).catch((e) => console.error('TeamFlow webhook dispatch notice:', e.message));
        }
      } catch (err) {
        console.error('Note creation error on deal won:', err);
      }
    }
  }

  // Update stage and refresh lastActivityAt
  const updatedDeal = await prisma.deal.update({
    where: {
      id: dealId,
    },
    data: {
      stage: newStage,
      lastActivityAt: new Date(),
    },
    include: {
      contact: true,
      followUps: true,
    },
  });

  return NextResponse.json({ deal: updatedDeal });
}
