import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'ADMIN' | 'OWNER' | 'MEMBER' | 'VIEWER';

export interface AuthSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
}

// In-memory / mockable session extractor for API routes and automated testing
export function getAuthSession(req: NextRequest): AuthSession | null {
  // 1. Check custom headers (used in tests and internal API calls)
  const headerUserId = req.headers.get('x-user-id');
  const headerUserRole = req.headers.get('x-user-role') as UserRole | null;
  const headerWorkspaceId = req.headers.get('x-workspace-id');
  const headerEmail = req.headers.get('x-user-email');

  if (headerUserId && headerUserRole && headerWorkspaceId) {
    return {
      userId: headerUserId,
      email: headerEmail || 'user@test.com',
      name: headerUserRole === 'ADMIN' ? 'Admin User' : headerUserRole === 'OWNER' ? 'Account Owner' : headerUserRole === 'MEMBER' ? 'Team Member' : 'Viewer User',
      role: headerUserRole,
      workspaceId: headerWorkspaceId,
    };
  }

  // 2. Check Cookie / Session header fallback
  const sessionCookie = req.cookies.get('clientflow_session')?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed.userId && parsed.workspaceId && parsed.role) {
        return parsed;
      }
    } catch {
      // ignore malformed cookie
    }
  }

  return null;
}

/**
 * Authoritative RBAC check helper for Next.js API route handlers.
 * Enforces rule:
 * - VIEWER: GET only. POST/PUT/DELETE rejected with 403 Forbidden!
 * - OWNER/ADMIN: Mutations allowed within their workspace.
 */
export function enforceRBAC(req: NextRequest, session: AuthSession | null): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Session missing or invalid' }, { status: 401 });
  }

  const method = req.method.toUpperCase();

  if (session.role === 'VIEWER' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return NextResponse.json(
      { error: 'Forbidden: Viewer role has read-only access and cannot perform mutations' },
      { status: 403 }
    );
  }

  return null; // OK
}
