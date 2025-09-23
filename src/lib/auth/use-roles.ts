"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './provider';
import type { UserRole, Permission, UserPermissions } from '@/types/auth';

/**
 * Custom hook for managing user roles and permissions on the client side
 */
export function useRoles() {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user permissions
  const fetchUserPermissions = useCallback(async () => {
    if (!user?.id) {
      setUserPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/permissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If permissions API fails, return default permissions
        console.warn('Failed to fetch user permissions, using defaults');
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

      const data = await response.json();
      setUserPermissions(data);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!userPermissions) return false;
    return userPermissions.permissions.includes(permission);
  }, [userPermissions]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!userPermissions) return false;
    return permissions.some(permission => userPermissions.permissions.includes(permission));
  }, [userPermissions]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!userPermissions) return false;
    return permissions.every(permission => userPermissions.permissions.includes(permission));
  }, [userPermissions]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return userPermissions?.role === 'admin';
  }, [userPermissions]);

  // Check if user is moderator or admin
  const isModerator = useCallback((): boolean => {
    return userPermissions?.role === 'moderator' || userPermissions?.role === 'admin';
  }, [userPermissions]);

  // Check if user can manage a specific resource
  const canManage = useCallback((resourceOwnerId: string): boolean => {
    if (!userPermissions) return false;
    
    // Admin can manage everything
    if (userPermissions.role === 'admin') return true;
    
    // Users can manage their own resources
    return user?.id === resourceOwnerId;
  }, [userPermissions, user?.id]);

  // Refresh permissions
  const refreshPermissions = useCallback(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  return {
    userPermissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isModerator,
    canManage,
    refreshPermissions,
  };
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: Permission,
  fallback?: React.ComponentType<P>
) {
  return function PermissionWrappedComponent(props: P) {
    const { hasPermission } = useRoles();
    
    if (hasPermission(requiredPermission)) {
      return React.createElement(Component as React.ComponentType<P>, props);
    }

    if (fallback) {
      return React.createElement(fallback as React.ComponentType<P>, props);
    }
    
    return null;
  };
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleBasedRender() {
  const { hasPermission, isAdmin, isModerator } = useRoles();

  return {
    // Render if user has specific permission
    withPermission: (permission: Permission) => hasPermission(permission),
    
    // Render if user is admin
    adminOnly: () => isAdmin(),
    
    // Render if user is moderator or admin
    moderatorOnly: () => isModerator(),
    
    // Render if user has any of the permissions
    withAnyPermission: (permissions: Permission[]) => 
      permissions.some(permission => hasPermission(permission)),
    
    // Render if user has all permissions
    withAllPermissions: (permissions: Permission[]) => 
      permissions.every(permission => hasPermission(permission)),
  };
}
