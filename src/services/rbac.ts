import { User, UserRole } from '../types';

export class AuthorizationError extends Error {
  public code: string;
  public userRole: UserRole;
  public action: string;

  constructor(message: string, userRole: UserRole, action: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'UNAUTHORIZED_ACTION';
    this.userRole = userRole;
    this.action = action;
  }
}

export type ActionType = 
  | 'contact:create'
  | 'contact:read'
  | 'contact:update'
  | 'contact:delete'
  | 'deal:create'
  | 'deal:read'
  | 'deal:update'
  | 'deal:stage_move'
  | 'deal:delete'
  | 'activity:create'
  | 'activity:read'
  | 'settings:manage';

interface ResourceContext {
  ownerId?: string;
  sharedWithUserIds?: string[];
  workspaceId?: string;
}

export function checkPermission(user: User, action: ActionType, resource?: ResourceContext): void {
  const role = user.role;

  if (role === 'viewer') {
    if (action.endsWith(':read')) return;
    throw new AuthorizationError(
      `Access Denied: Viewers have read-only access and cannot perform "${action}".`,
      role,
      action
    );
  }

  if (role === 'admin') return;

  if (action === 'settings:manage') {
    throw new AuthorizationError(
      `Access Denied: Only Workspace Admins can perform "${action}".`,
      role,
      action
    );
  }

  if (role === 'sales_owner') {
    if (action.endsWith(':create') || action.endsWith(':read')) return;
    if (resource && resource.ownerId && resource.ownerId !== user.id) {
      throw new AuthorizationError(
        `Access Denied: Sales Owners cannot modify records owned by other team members.`,
        role,
        action
      );
    }
    return;
  }

  if (role === 'team_member') {
    if (action.endsWith(':delete')) {
      throw new AuthorizationError(
        `Access Denied: Team Members are not permitted to delete records.`,
        role,
        action
      );
    }
    if (action.endsWith(':create')) return;
    if (action.endsWith(':read')) {
      if (resource && resource.ownerId && resource.ownerId !== user.id) {
        const isShared = resource.sharedWithUserIds?.includes(user.id);
        if (!isShared) {
          throw new AuthorizationError(
            `Access Denied: Team Members can only access records explicitly assigned or shared.`,
            role,
            action
          );
        }
      }
      return;
    }
    if (resource && resource.ownerId && resource.ownerId !== user.id) {
      throw new AuthorizationError(
        `Access Denied: Team Members cannot edit unassigned records.`,
        role,
        action
      );
    }
    return;
  }

  throw new AuthorizationError(`Unknown role "${role}" denied access.`, role, action);
}

export function canUser(user: User, action: ActionType, resource?: ResourceContext): boolean {
  try {
    checkPermission(user, action, resource);
    return true;
  } catch {
    return false;
  }
}
