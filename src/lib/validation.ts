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

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_VOTES_PER_WINDOW = 5;
const MAX_POLLS_PER_WINDOW = 3;

export function checkRateLimit(userId: string, action: 'vote' | 'create_poll'): boolean {
  const now = Date.now();
  const key = `${userId}:${action}`;
  const limit = action === 'vote' ? MAX_VOTES_PER_WINDOW : MAX_POLLS_PER_WINDOW;
  
  const userLimit = rateLimitMap.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count++;
  return true;
}
