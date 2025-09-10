import { z } from 'zod';

// Input validation schemas
export const pollQuestionSchema = z
  .string()
  .min(3, 'Question must be at least 3 characters')
  .max(500, 'Question must be less than 500 characters')
  .regex(/^[a-zA-Z0-9\s\?\!\.\,\-\'\"\:\;\(\)]+$/, 'Question contains invalid characters');

export const pollOptionSchema = z
  .string()
  .min(1, 'Option cannot be empty')
  .max(200, 'Option must be less than 200 characters')
  .regex(/^[a-zA-Z0-9\s\?\!\.\,\-\'\"\:\;\(\)]+$/, 'Option contains invalid characters');

export const createPollSchema = z.object({
  question: pollQuestionSchema,
  options: z
    .array(pollOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed'),
  is_public: z.boolean().optional().default(true),
});

export const voteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionId: z.string().uuid('Invalid option ID'),
});

// Sanitization functions
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function validatePollInput(formData: FormData) {
  const question = sanitizeText(String(formData.get('title') || ''));
  const rawOptions = [
    String(formData.get('option1') || '').trim(),
    String(formData.get('option2') || '').trim(),
    String(formData.get('option3') || '').trim(),
    String(formData.get('option4') || '').trim(),
  ]
    .filter(Boolean)
    .map(sanitizeText);

  return createPollSchema.parse({
    question,
    options: rawOptions,
  });
}

export function validateVoteInput(pollId: string, optionId: string) {
  return voteSchema.parse({ pollId, optionId });
}

// Enhanced rate limiting system
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Rate limit configurations for different actions
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  vote: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  create_poll: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  delete_poll: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },
  view_poll: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  }
};

/**
 * Enhanced rate limiting function with better tracking and configuration
 * 
 * @param userId - User ID for rate limiting
 * @param action - Action being performed
 * @param success - Whether the action was successful (for conditional counting)
 * @returns Object with rate limit status and remaining requests
 */
export function checkRateLimit(
  userId: string, 
  action: 'vote' | 'create_poll' | 'delete_poll' | 'view_poll',
  success: boolean = true
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const config = RATE_LIMIT_CONFIGS[action];
  
  if (!config) {
    // If no config found, allow the request
    return { allowed: true, remaining: Infinity, resetTime: now + 60000 };
  }
  
  const userLimit = rateLimitMap.get(key);
  
  // Initialize or reset if window has expired
  if (!userLimit || now > userLimit.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 0,
      resetTime: now + config.windowMs,
      firstRequest: now
    };
    rateLimitMap.set(key, newEntry);
  }
  
  const currentEntry = rateLimitMap.get(key)!;
  
  // Check if we should skip counting this request
  if (config.skipSuccessfulRequests && success) {
    return { 
      allowed: true, 
      remaining: config.maxRequests - currentEntry.count,
      resetTime: currentEntry.resetTime
    };
  }
  
  if (config.skipFailedRequests && !success) {
    return { 
      allowed: true, 
      remaining: config.maxRequests - currentEntry.count,
      resetTime: currentEntry.resetTime
    };
  }
  
  // Check if limit exceeded
  if (currentEntry.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: currentEntry.resetTime
    };
  }
  
  // Increment counter
  currentEntry.count++;
  
  return { 
    allowed: true, 
    remaining: config.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime
  };
}

/**
 * Get rate limit status without consuming a request
 * 
 * @param userId - User ID to check
 * @param action - Action to check
 * @returns Rate limit status information
 */
export function getRateLimitStatus(
  userId: string, 
  action: 'vote' | 'create_poll' | 'delete_poll' | 'view_poll'
): { remaining: number; resetTime: number; isLimited: boolean } {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const config = RATE_LIMIT_CONFIGS[action];
  
  if (!config) {
    return { remaining: Infinity, resetTime: now + 60000, isLimited: false };
  }
  
  const userLimit = rateLimitMap.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    return { 
      remaining: config.maxRequests, 
      resetTime: now + config.windowMs, 
      isLimited: false 
    };
  }
  
  return {
    remaining: Math.max(0, config.maxRequests - userLimit.count),
    resetTime: userLimit.resetTime,
    isLimited: userLimit.count >= config.maxRequests
  };
}

/**
 * Clear rate limit for a specific user and action
 * 
 * @param userId - User ID to clear limits for
 * @param action - Action to clear limits for (optional, clears all if not provided)
 */
export function clearRateLimit(
  userId: string, 
  action?: 'vote' | 'create_poll' | 'delete_poll' | 'view_poll'
): void {
  if (action) {
    rateLimitMap.delete(`${userId}:${action}`);
  } else {
    // Clear all rate limits for this user
    for (const [key] of rateLimitMap) {
      if (key.startsWith(`${userId}:`)) {
        rateLimitMap.delete(key);
      }
    }
  }
}

/**
 * Clean up expired rate limit entries
 * 
 * This function should be called periodically to prevent memory leaks
 * in long-running applications.
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}
