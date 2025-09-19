"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "./server";
import { AuthError } from "@/lib/errors";

/**
 * Centralized authentication utility for server actions
 * 
 * This function provides a consistent way to verify user authentication
 * across all server actions, reducing code duplication and ensuring
 * consistent error handling.
 * 
 * @param supabase - Supabase client instance
 * @param options - Optional configuration for authentication behavior
 * @returns Promise resolving to authenticated user object
 * @throws AuthError with specific error codes for different failure scenarios
 */
export async function ensureAuthenticated(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  options: {
    redirectOnFailure?: boolean;
    customRedirectPath?: string;
  } = {}
): Promise<{ user: any; session: any }> {
  const { redirectOnFailure = true, customRedirectPath } = options;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Authentication error:', error);
      throw new AuthError(
        'Authentication check failed',
        'login'
      );
    }
    
    if (!user || !session) {
      throw new AuthError(
        'Authentication required',
        'session'
      );
    }
    
    return { user, session };
  } catch (error) {
    if (error instanceof AuthError) {
      if (redirectOnFailure) {
        redirect(customRedirectPath || error.redirectPath || '/auth/login');
      }
      throw error;
    }
    
    // Handle unexpected errors
    console.error('Unexpected authentication error:', error);
    const authError = new AuthError(
      'An unexpected authentication error occurred',
      'login'
    );
    
    if (redirectOnFailure) {
      redirect(customRedirectPath || authError.redirectPath || '/auth/login');
    }
    throw authError;
  }
}

/**
 * Get current user without throwing errors
 * 
 * This is useful for optional authentication checks where you want
 * to handle the case where the user is not authenticated gracefully.
 * 
 * @param supabase - Supabase client instance
 * @returns Promise resolving to user data or null if not authenticated
 */
export async function getCurrentUser(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>
): Promise<{ user: any; session: any } | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (error || !user || !session) {
      return null;
    }
    
    return { user, session };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}