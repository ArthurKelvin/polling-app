'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/lib/auth/logout-button';
import { useAuth } from '@/lib/auth/provider';
import { useRoles } from '@/lib/auth/use-roles';
import { Menu, X, Home, BarChart3, MessageCircle, Settings, Users } from 'lucide-react';

/**
 * Navigation Component
 * 
 * Provides the main navigation bar for the application with:
 * - Mobile-responsive design with hamburger menu
 * - Dynamic content based on authentication state
 * - Loading states for better UX
 * - Proper routing for authenticated and unauthenticated users
 * - Logout functionality for authenticated users
 * - Accessibility features (ARIA labels, keyboard navigation)
 * 
 * Handles three states:
 * 1. Loading - Shows skeleton while checking auth status
 * 2. Unauthenticated - Shows login/register buttons
 * 3. Authenticated - Shows user info and logout button
 */
export function Navigation() {
  const { user, loading } = useAuth();
  const { isAdmin } = useRoles();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Loading state - show skeleton while checking authentication
  if (loading) {
    return (
      <nav className="border-b bg-white shadow-sm" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/polls" className="text-xl font-bold text-gray-900">
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
      <nav className="border-b bg-white shadow-sm" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              aria-label="Polling App - Home"
            >
              Polling App
            </Link>
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button 
                  variant="outline" 
                  className="hidden sm:inline-flex"
                  aria-label="Sign in to your account"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button 
                  className="hidden sm:inline-flex"
                  aria-label="Create a new account"
                >
                  Sign Up
                </Button>
              </Link>
              {/* Mobile menu button for unauthenticated users */}
              <Button
                variant="ghost"
                size="sm"
                className="sm:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Mobile menu for unauthenticated users */}
          {isMobileMenuOpen && (
            <div className="sm:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full justify-start">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="w-full justify-start">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Authenticated state - show user info and logout button
  return (
    <nav className="border-b bg-white shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/polls" 
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            aria-label="Polling App - Home"
          >
            Polling App
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex gap-2">
              <Link href="/polls">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Polls
                </Button>
              </Link>
              <Link href="/dashboard/real-time">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              {isAdmin() && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>
            
            {/* User info and logout */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-600 max-w-32 truncate" title={user.email}>
                {user.email}
              </span>
              <LogoutButton />
            </div>
          </div>

          {/* Mobile menu button for authenticated users */}
          <div className="md:hidden flex items-center gap-2">
            <span className="text-sm text-gray-600 max-w-24 truncate" title={user.email}>
              {user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu for authenticated users */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/polls">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <Home className="h-4 w-4 mr-2" />
                  Polls
                </Button>
              </Link>
              <Link href="/dashboard/real-time">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              {isAdmin() && (
                <Link href="/admin">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setIsMobileMenuOpen(false)}>
                    <Users className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <div className="pt-2 border-t border-gray-200">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
