"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/provider';
import { useRoles } from '@/lib/auth/use-roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, UserCheck, AlertCircle } from 'lucide-react';
import type { UserRole } from '@/types/auth';

interface UserWithRole {
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  auth_users: {
    id: string;
    email: string;
    created_at: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, hasPermission } = useRoles();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Check if user has admin permissions
  if (!isAdmin()) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch users with roles
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdating(userId);
      setError(null);

      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.user_id === userId ? { ...u, role: newRole, updated_at: new Date().toISOString() } : u
        )
      );
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'moderator':
        return <UserCheck className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage user roles and permissions</p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user roles and permissions. Click on a role to change it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((userWithRole) => (
                <div
                  key={userWithRole.user_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userWithRole.role)}
                      <div>
                        <p className="font-medium">{userWithRole.auth_users.email}</p>
                        <p className="text-sm text-gray-500">
                          Joined: {new Date(userWithRole.auth_users.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={getRoleBadgeColor(userWithRole.role)}>
                      {userWithRole.role}
                    </Badge>
                    
                    <Select
                      value={userWithRole.role}
                      onValueChange={(newRole: UserRole) => 
                        updateUserRole(userWithRole.user_id, newRole)
                      }
                      disabled={updating === userWithRole.user_id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {updating === userWithRole.user_id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>
              Overview of what each role can do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create polls</li>
                  <li>• Vote on polls</li>
                  <li>• View polls</li>
                  <li>• Share polls</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Moderator
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All user permissions</li>
                  <li>• Moderate polls</li>
                  <li>• Delete comments</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All moderator permissions</li>
                  <li>• Manage users</li>
                  <li>• Delete polls</li>
                  <li>• View analytics</li>
                  <li>• Manage roles</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
