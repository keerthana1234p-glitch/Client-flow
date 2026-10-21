import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const identifier = email.trim().toLowerCase();
    
    // Resolve username aliases to account emails
    let resolvedEmail = identifier;
    if (identifier === 'admin' || identifier === 'admin@ojix.com') resolvedEmail = 'admin@test.com';
    else if (identifier === 'owner' || identifier === 'sales owner' || identifier === 'owner@ojix.com') resolvedEmail = 'owner@test.com';
    else if (identifier === 'member' || identifier === 'team member' || identifier === 'member@ojix.com') resolvedEmail = 'member@test.com';
    else if (identifier === 'viewer' || identifier === 'viewer@ojix.com') resolvedEmail = 'viewer@test.com';

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: resolvedEmail } },
          { email: { equals: identifier } },
        ],
      },
      include: {
        workspace: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Strict role-specific passwords requested by user
    const ROLE_PASSWORDS: Record<string, string> = {
      ADMIN: '123456',
      OWNER: '12345',
      MEMBER: '1234',
      VIEWER: '123',
    };

    const userRoleKey = user.role.toUpperCase();
    const expectedPassword = ROLE_PASSWORDS[userRoleKey];

    const isDirectMatch = expectedPassword && password === expectedPassword;
    const isBcryptMatch = await bcrypt.compare(password, user.password).catch(() => false);

    if (!isDirectMatch && !isBcryptMatch) {
      return NextResponse.json(
        { error: `Wrong password for ${user.name}. Please enter the correct password.` },
        { status: 401 }
      );
    }

    // Return safe user profile without password
    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
      workspaceName: user.workspace.name,
    };

    const response = NextResponse.json({ success: true, user: sessionData });
    response.cookies.set('clientflow_session', encodeURIComponent(JSON.stringify(sessionData)), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
