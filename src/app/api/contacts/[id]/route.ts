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

  const contact = await prisma.contact.findUnique({
    where: { id: params.id },
    include: { deals: true },
  });

  if (!contact || contact.workspaceId !== session.workspaceId) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }

  return NextResponse.json({ contact });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(req, params.id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(req, params.id);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getAuthSession(req);
  const rbacError = enforceRBAC(req, session);
  if (rbacError) return rbacError;

  // Enforce role restriction: Team Members and Viewers cannot delete records
  if (session?.role === 'MEMBER') {
    return NextResponse.json(
      { error: 'Forbidden (403): Team Members are not permitted to delete contacts.' },
      { status: 403 }
    );
  }

  try {
    const existing = await prisma.contact.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.workspaceId !== session!.workspaceId) {
      return NextResponse.json({ error: 'Contact not found in this workspace' }, { status: 404 });
    }

    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete contact', details: error.message },
      { status: 500 }
    );
  }
}

async function handleUpdate(req: NextRequest, contactId: string) {
  const session = getAuthSession(req);
  const rbacError = enforceRBAC(req, session);
  if (rbacError) return rbacError;

  try {
    const existing = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!existing || existing.workspaceId !== session!.workspaceId) {
      return NextResponse.json({ error: 'Contact not found in this workspace' }, { status: 404 });
    }

    const { name, email, phone } = await req.json();

    let normalizedEmail = existing.email;
    if (email) {
      normalizedEmail = email.trim().toLowerCase();

      // If email changed, check for duplicate collision in this workspace
      if (normalizedEmail !== existing.email.toLowerCase()) {
        const conflict = await prisma.contact.findFirst({
          where: {
            workspaceId: session!.workspaceId,
            email: { equals: normalizedEmail },
            id: { not: existing.id },
          },
        });

        if (conflict) {
          return NextResponse.json(
            { error: `Conflict: Email "${email}" is already used by another contact (${conflict.name})` },
            { status: 409 }
          );
        }
      }
    }

    const updated = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        name: name ? name.trim() : existing.name,
        email: normalizedEmail,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
      },
      include: {
        deals: true,
      },
    });

    return NextResponse.json({ contact: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update contact', details: error.message },
      { status: 500 }
    );
  }
}
