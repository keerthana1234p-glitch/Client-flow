import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession, enforceRBAC } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getAuthSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Workspace Isolation: ALWAYS filter by session.workspaceId
  const contacts = await prisma.contact.findMany({
    where: {
      workspaceId: session.workspaceId,
    },
    include: {
      deals: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const session = getAuthSession(req);
  const rbacError = enforceRBAC(req, session);
  if (rbacError) return rbacError;

  try {
    const { name, email, phone } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Case-insensitive duplicate check in the SAME workspace
    // Uses findFirst with lower comparison
    const existingInWorkspace = await prisma.contact.findFirst({
      where: {
        workspaceId: session!.workspaceId,
        email: {
          equals: normalizedEmail,
        },
      },
    });

    if (existingInWorkspace) {
      return NextResponse.json(
        {
          error: `Conflict: Contact with email "${email}" already exists in this workspace (${existingInWorkspace.name})`,
          existingContactId: existingInWorkspace.id,
        },
        { status: 409 }
      );
    }

    // Create contact scoped to this workspace
    const newContact = await prisma.contact.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        workspaceId: session!.workspaceId,
      },
    });

    return NextResponse.json({ contact: newContact }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 500 });
  }
}
