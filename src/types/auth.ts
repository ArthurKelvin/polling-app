/**
 * Authentication and authorization types for the polling app
 */

export type UserRole = 'admin' | 'moderator' | 'user';

export type Permission = 
  | 'create_poll'
  | 'vote_poll'
  | 'view_poll'
  | 'share_poll'
  | 'moderate_poll'
  | 'delete_comment'
  | 'manage_users'
  | 'delete_poll'
  | 'view_analytics'
  | 'manage_roles';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission: Permission;
  created_at: string;
}

export interface UserPermissions {
  permissions: Permission[];
  role: UserRole;
  isAdmin?: boolean;
  isModerator?: boolean;
  canCreatePoll?: boolean;
  canVote?: boolean;
  canViewPolls?: boolean;
  canSharePolls?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface RoleAssignment {
  user_id: string;
  role: UserRole;
}

export interface PermissionCheck {
  hasPermission: boolean;
  userRole: UserRole;
  requiredPermission: Permission;
}
