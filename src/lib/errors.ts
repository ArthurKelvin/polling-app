/**
 * Centralized error handling system for the polling application
 * 
 * This module provides a consistent way to handle and categorize errors
 * across the application, making debugging and user experience better.
 */

/**
 * Base error class for all application errors
 * 
 * Provides common functionality for all custom errors including
 * error codes, user-friendly messages, and logging capabilities.
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly shouldLog: boolean;
  abstract readonly redirectPath?: string;
  public readonly userMessage: string;

  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = message;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Log the error with context information
   * 
   * This method provides structured logging for better debugging
   * and monitoring capabilities.
   */
  log(): void {
    if (this.shouldLog) {
      console.error(`[${this.code}] ${this.name}:`, {
        message: this.message,
        userMessage: this.userMessage,
        context: this.context,
        stack: this.stack
      });
    }
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly shouldLog = false;
  readonly redirectPath?: string;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any,
    redirectPath?: string
  ) {
    super(message, { field, value });
    this.redirectPath = redirectPath;
  }
}

/**
 * Rate limiting error for when users exceed rate limits
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly shouldLog = true;
  readonly redirectPath?: string;

  constructor(
    message: string,
    public readonly action: string,
    public readonly retryAfter?: number,
    redirectPath?: string
  ) {
    super(message, { action, retryAfter });
    this.redirectPath = redirectPath;
  }
}

/**
 * Database operation error for database-related failures
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly shouldLog = true;
  readonly redirectPath?: string;
  readonly userMessage = 'A database error occurred. Please try again.';

  constructor(
    message: string,
    public readonly operation: string,
    public readonly table?: string,
    redirectPath?: string
  ) {
    super(message, { operation, table });
    this.redirectPath = redirectPath;
  }
}

/**
 * Poll-specific error for poll-related operations
 */
export class PollError extends AppError {
  readonly code = 'POLL_ERROR';
  readonly shouldLog = true;
  readonly redirectPath?: string;

  constructor(
    message: string,
    public readonly pollId?: string,
    public readonly operation?: string,
    redirectPath?: string
  ) {
    super(message, { pollId, operation });
    this.redirectPath = redirectPath;
  }
}

/**
 * Vote-specific error for voting operations
 */
export class VoteError extends AppError {
  readonly code = 'VOTE_ERROR';
  readonly shouldLog = true;
  readonly redirectPath?: string;

  constructor(
    message: string,
    public readonly pollId: string,
    public readonly optionId?: string,
    redirectPath?: string
  ) {
    super(message, { pollId, optionId });
    this.redirectPath = redirectPath;
  }
}

/**
 * Authentication error for auth-related failures
 */
export class AuthError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly shouldLog = true;
  readonly redirectPath = '/auth/login';

  constructor(
    message: string,
    public readonly authType?: 'login' | 'session' | 'permission'
  ) {
    super(message, { authType });
  }
}

/**
 * CSRF error for CSRF token validation failures
 */
export class CSRFError extends AppError {
  readonly code = 'CSRF_ERROR';
  readonly shouldLog = true;
  readonly redirectPath?: string;
  readonly userMessage = 'Security validation failed. Please try again.';

  constructor(
    message: string = 'Invalid CSRF token',
    redirectPath?: string
  ) {
    super(message);
    this.redirectPath = redirectPath;
  }
}

/**
 * Error handler utility for consistent error processing
 * 
 * This function provides a centralized way to handle errors,
 * including logging, user message generation, and redirect decisions.
 */
export class ErrorHandler {
  /**
   * Handle an error and determine the appropriate response
   * 
   * @param error - The error to handle
   * @param context - Additional context for error handling
   * @returns Object containing user message and redirect path
   */
  static handle(error: unknown, context?: Record<string, any>): {
    userMessage: string;
    redirectPath?: string;
    shouldLog: boolean;
  } {
    // Log the error with context
    if (error instanceof AppError) {
      error.log();
      return {
        userMessage: error.userMessage,
        redirectPath: error.redirectPath,
        shouldLog: error.shouldLog
      };
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error, context);
    return {
      userMessage: 'An unexpected error occurred. Please try again.',
      redirectPath: '/polls',
      shouldLog: true
    };
  }

  /**
   * Create a user-friendly error message from a Zod validation error
   * 
   * @param zodError - Zod validation error
   * @returns User-friendly error message
   */
  static formatZodError(zodError: any): string {
    if (zodError.errors && zodError.errors.length > 0) {
      const firstError = zodError.errors[0];
      return `${firstError.path.join('.')}: ${firstError.message}`;
    }
    return 'Invalid input provided';
  }

  /**
   * Create a user-friendly error message from a Supabase error
   * 
   * @param supabaseError - Supabase error object
   * @returns User-friendly error message
   */
  static formatSupabaseError(supabaseError: any): string {
    // Map common Supabase error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      '23505': 'This item already exists',
      '23503': 'Referenced item not found',
      '42501': 'You don\'t have permission to perform this action',
      'PGRST116': 'The requested resource was not found',
      'PGRST301': 'Invalid request parameters'
    };

    return errorMessages[supabaseError.code] || 
           supabaseError.message || 
           'A database error occurred';
  }
}
