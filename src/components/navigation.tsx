'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/lib/auth/logout-button';
import { useAuth } from '@/lib/auth/provider';

/**
 * Navigation Component
 * 
 * Provides the main navigation bar for the application with:
 * - Dynamic content based on authentication state
 * - Loading states for better UX
 * - Proper routing for authenticated and unauthenticated users
 * - Logout functionality for authenticated users
 * 
 * Handles three states:
 * 1. Loading - Shows skeleton while checking auth status
 * 2. Unauthenticated - Shows login/register buttons
 * 3. Authenticated - Shows user info and logout button
 */
export function Navigation() {
  const { user, loading } = useAuth();

  // Loading state - show skeleton while checking authentication
  if (loading) {
    return (
      <nav className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/polls" className="text-xl font-bold">
              Polling App
            </Link>
            {/* Skeleton loader for auth state */}
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

  // Unauthenticated state - show login/register buttons
  if (!user) {
    return (
      <nav className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Polling App
            </Link>
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated state - show user info and logout button
  return (
    <nav className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/polls" className="text-xl font-bold">
            Polling App
          </Link>
          <div className="flex items-center gap-4">
            {/* Navigation links */}
            <div className="flex gap-2">
              <Link href="/polls">
                <Button variant="ghost" size="sm">Polls</Button>
              </Link>
              <Link href="/dashboard/real-time">
                <Button variant="ghost" size="sm">Real-time Dashboard</Button>
              </Link>
            </div>
            {/* Display user email for context */}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user.email}
            </span>
            {/* Logout button with proper redirect handling */}
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
