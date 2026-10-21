import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = 'MEMBER' } = await req.json();

    // 1. Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please enter your full name (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid work email address.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Check for duplicate account
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // 3. Resolve default workspace
    let workspace = await prisma.workspace.findUnique({
      where: { id: 'ws-primary-1' },
    });

    if (!workspace) {
      workspace = await prisma.workspace.findFirst();
    }

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          id: 'ws-primary-1',
          name: 'Acme Primary Workspace',
        },
      });
    }

    // 4. Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: role.toUpperCase(),
        workspaceId: workspace.id,
      },
      include: {
        workspace: true,
      },
    });

    // 5. Establish authenticated session
    const sessionData = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      workspaceId: newUser.workspaceId,
      workspaceName: newUser.workspace.name,
    };

    const response = NextResponse.json({ success: true, user: sessionData });
    response.cookies.set('clientflow_session', encodeURIComponent(JSON.stringify(sessionData)), {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating your account. Please try again.' },
      { status: 500 }
    );
  }
}
