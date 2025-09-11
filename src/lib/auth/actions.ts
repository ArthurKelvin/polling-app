"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "./server";

/**
 * Custom error class for authentication-related errors
 * 
 * Provides structured error handling with specific error codes
 * for better error categorization and user experience
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'AUTH_REQUIRED' | 'AUTH_FAILED' | 'INVALID_SESSION' | 'UNKNOWN_ERROR',
    public readonly redirectPath: string = '/auth/login'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

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
        'AUTH_FAILED',
        customRedirectPath || '/auth/login'
      );
    }
    
    if (!user || !session) {
      throw new AuthError(
        'Authentication required',
        'AUTH_REQUIRED',
        customRedirectPath || '/auth/login'
      );
    }
    
    return { user, session };
  } catch (error) {
    if (error instanceof AuthError) {
      if (redirectOnFailure) {
        redirect(error.redirectPath);
      }
      throw error;
    }
    
    // Handle unexpected errors
    console.error('Unexpected authentication error:', error);
    const authError = new AuthError(
      'An unexpected authentication error occurred',
      'UNKNOWN_ERROR',
      customRedirectPath || '/auth/login'
    );
    
    if (redirectOnFailure) {
      redirect(authError.redirectPath);
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

/**
 * Validate user ownership of a resource
 * 
 * This utility helps ensure users can only access resources they own,
 * providing an additional security layer beyond RLS policies.
 * 
 * @param userId - ID of the user to validate
 * @param resourceOwnerId - ID of the resource owner
 * @param resourceType - Type of resource for better error messages
 * @throws AuthError if user doesn't own the resource
 */
export function validateResourceOwnership(
  userId: string,
  resourceOwnerId: string,
  resourceType: string = 'resource'
): void {
  if (userId !== resourceOwnerId) {
    throw new AuthError(
      `You don't have permission to access this ${resourceType}`,
      'AUTH_REQUIRED',
      '/polls'
    );
  }
}
