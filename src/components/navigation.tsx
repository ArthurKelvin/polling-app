'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/lib/auth/logout-button';
import { useAuth } from '@/lib/auth/provider';

export function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <nav className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/polls" className="text-xl font-bold">
              Polling App
            </Link>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

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

  return (
    <nav className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/polls" className="text-xl font-bold">
            Polling App
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
