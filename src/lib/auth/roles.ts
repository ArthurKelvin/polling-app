"use server";

import { getSupabaseServerClient } from "./server";
import type { UserRole, Permission, UserPermissions, RoleAssignment } from "@/types/auth";

/**
 * Role management service for handling user roles and permissions
 */

/**
 * Get user role by user ID
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await (await supabase)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If table doesn't exist, return default user role
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('User roles table not found, using default role');
        return 'user';
      }
      console.error('Error getting user role:', error);
      return 'user'; // Default to user role on error
    }

    return data?.role || 'user';
  } catch (error) {
    console.error('Unexpected error getting user role:', error);
    return 'user'; // Default to user role on error
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await (await supabase)
      .rpc('has_permission', {
        user_uuid: userId,
        permission_name: permission
      });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Unexpected error checking permission:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get user role
    const role = await getUserRole(userId);
    if (!role) {
      // Return default permissions if role can't be determined
      return {
        role: 'user',
        permissions: ['create_poll', 'vote_poll', 'view_poll', 'share_poll'],
        isAdmin: false,
        isModerator: false,
        canCreatePoll: true,
        canVote: true,
        canViewPolls: true,
        canSharePolls: true
      };
    }

    // Try to get permissions from database, fallback to default if table doesn't exist
    try {
      const { data, error } = await (await supabase)
        .rpc('get_user_permissions', {
          user_uuid: userId
        });
      
      if (error) {
        console.warn('Error getting user permissions from database, using defaults:', error);
        // Return default permissions based on role
        return getDefaultPermissions(role);
      }

      return {
        role,
        permissions: data || getDefaultPermissions(role).permissions,
        isAdmin: role === 'admin',
        isModerator: role === 'moderator' || role === 'admin',
        canCreatePoll: true,
        canVote: true,
        canViewPolls: true,
        canSharePolls: true
      };
    } catch (dbError) {
      console.warn('Database error getting permissions, using defaults:', dbError);
      return getDefaultPermissions(role);
    }
  } catch (error) {
    console.error('Unexpected error getting user permissions:', error);
    // Return basic user permissions as fallback
    return {
      role: 'user',
      permissions: ['create_poll', 'vote_poll', 'view_poll', 'share_poll'],
      isAdmin: false,
      isModerator: false,
      canCreatePoll: true,
      canVote: true,
      canViewPolls: true,
      canSharePolls: true
    };
  }
}

/**
 * Get default permissions based on role
 */
function getDefaultPermissions(role: UserRole): UserPermissions {
  const basePermissions: Permission[] = ['create_poll', 'vote_poll', 'view_poll', 'share_poll'];
  
  switch (role) {
    case 'admin':
      return {
        role,
        permissions: [...basePermissions, 'manage_users', 'delete_poll', 'moderate_poll', 'view_analytics'] as Permission[],
        isAdmin: true,
        isModerator: true,
        canCreatePoll: true,
        canVote: true,
        canViewPolls: true,
        canSharePolls: true
      };
    case 'moderator':
      return {
        role,
        permissions: [...basePermissions, 'moderate_poll', 'delete_comment'] as Permission[],
        isAdmin: false,
        isModerator: true,
        canCreatePoll: true,
        canVote: true,
        canViewPolls: true,
        canSharePolls: true
      };
    default:
      return {
        role,
        permissions: basePermissions as Permission[],
        isAdmin: false,
        isModerator: false,
        canCreatePoll: true,
        canVote: true,
        canViewPolls: true,
        canSharePolls: true
      };
  }
}

/**
 * Assign role to user (admin only)
 */
export async function assignUserRole(assignerId: string, userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if assigner is admin
    const hasAdminPermission = await hasPermission(assignerId, 'manage_roles');
    if (!hasAdminPermission) {
      return { success: false, error: 'Insufficient permissions to assign roles' };
    }

    const supabase = getSupabaseServerClient();

    const { error } = await (await supabase)
      .rpc('assign_user_role', {
        user_uuid: userId,
        role_name: role
      });

    if (error) {
      console.error('Error assigning user role:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error assigning user role:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check if user can perform action on resource
 */
export async function canPerformAction(
  userId: string, 
  action: Permission, 
  resourceOwnerId?: string
): Promise<boolean> {
  try {
    // Check if user has the required permission
    const hasRequiredPermission = await hasPermission(userId, action);
    if (!hasRequiredPermission) {
      return false;
    }

    // If resource has an owner, check if user is the owner or has admin privileges
    if (resourceOwnerId) {
      const isOwner = userId === resourceOwnerId;
      const isAdmin = await hasPermission(userId, 'manage_users');
      
      return isOwner || isAdmin;
    }

    return true;
  } catch (error) {
    console.error('Error checking action permission:', error);
    return false;
  }
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsersWithRoles(requesterId: string): Promise<{ success: boolean; users?: any[]; error?: string }> {
  try {
    // Check if requester is admin
    const hasAdminPermission = await hasPermission(requesterId, 'manage_users');
    if (!hasAdminPermission) {
      return { success: false, error: 'Insufficient permissions to view users' };
    }

    const supabase = getSupabaseServerClient();

    // Ensure supabase is awaited if getSupabaseServerClient is async
    const supabaseClient = await supabase;

    const { data, error } = await supabaseClient
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at,
        updated_at,
        auth.users!inner(
          id,
          email,
          created_at
        )
      `);

    if (error) {
      console.error('Error getting users with roles:', error);
      return { success: false, error: error.message };
    }

    return { success: true, users: data };
  } catch (error) {
    console.error('Unexpected error getting users with roles:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Middleware function to check permissions
 */
export async function requirePermission(userId: string, permission: Permission): Promise<{ allowed: boolean; error?: string }> {
  try {
    const hasRequiredPermission = await hasPermission(userId, permission);
    
    if (!hasRequiredPermission) {
      return { 
        allowed: false, 
        error: `Insufficient permissions. Required: ${permission}` 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error in permission middleware:', error);
    return { 
      allowed: false, 
      error: 'An error occurred while checking permissions' 
    };
  }
}
