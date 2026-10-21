import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, enforceRBAC } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getAuthSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deal = await prisma.deal.findFirst({
    where: {
      id: params.id,
      workspaceId: session.workspaceId,
    },
    include: {
      contact: true,
      followUps: true,
      notes: true,
    },
  });

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found in this workspace' }, { status: 404 });
  }

  return NextResponse.json({ deal });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getAuthSession(req);
  const rbacError = enforceRBAC(req, session);
  if (rbacError) return rbacError;

  // Enforce role restriction: Team Members cannot delete records
  if (session?.role === 'MEMBER') {
    return NextResponse.json(
      { error: 'Forbidden (403): Team Members are not permitted to delete deals.' },
      { status: 403 }
    );
  }

  try {
    const existing = await prisma.deal.findFirst({
      where: {
        id: params.id,
        workspaceId: session!.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Deal not found in this workspace' }, { status: 404 });
    }

    await prisma.deal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete deal', details: error.message },
      { status: 500 }
    );
  }
}
