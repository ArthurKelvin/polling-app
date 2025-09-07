"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

/**
 * Authentication context value interface
 * Provides user authentication state and methods throughout the application
 */
type AuthContextValue = {
  /** Current authenticated user object or null if not logged in */
  user: User | null;
  /** Current session object containing authentication details */
  session: Session | null;
  /** Loading state for authentication operations */
  loading: boolean;
  /** Sign in with email and password */
  signInWithPassword: (params: { email: string; password: string }) => Promise<{ error?: Error | null }>;
  /** Register new user with email and password */
  signUpWithPassword: (params: { email: string; password: string }) => Promise<{ error?: Error | null }>;
  /** Sign out current user and clear session */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Manages global authentication state using Supabase Auth
 * Provides authentication context to all child components
 * 
 * @param children - React children components that need access to auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session on component mount
    // This handles page refreshes and direct URL access
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return; // Prevent state updates if component unmounted
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for authentication state changes
    // This handles login, logout, and token refresh events
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // Cleanup subscription on component unmount
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign in user with email and password
   * 
   * @param params - Object containing email and password
   * @returns Promise resolving to error object if authentication fails
   */
  const signInWithPassword = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, [supabase]);

  /**
   * Register new user with email and password
   * 
   * @param params - Object containing email and password
   * @returns Promise resolving to error object if registration fails
   */
  const signUpWithPassword = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, [supabase]);

  /**
   * Sign out current user and clear session
   * 
   * @returns Promise that resolves when sign out is complete
   */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(() => ({ user, session, loading, signInWithPassword, signUpWithPassword, signOut }), [user, session, loading, signInWithPassword, signUpWithPassword, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication context
 * 
 * @returns Authentication context value with user, session, and auth methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


