"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";
import { validatePollInput, checkRateLimit } from "@/lib/validation";
import { validateCSRFToken } from "@/lib/csrf";
import { ensureAuthenticated } from "@/lib/auth/actions";
import { PollError, CSRFError, RateLimitError, ErrorHandler } from "@/lib/errors";

/**
 * Server Action: Create a new poll
 * 
 * Handles poll creation with comprehensive security measures:
 * - User authentication verification
 * - CSRF token validation (optional for backward compatibility)
 * - Rate limiting to prevent abuse
 * - Input validation and sanitization
 * - Database transaction with cleanup on failure
 * 
 * @param formData - Form data containing poll question and options
 * @throws Error if validation fails, user not authenticated, or database error
 * @redirects to /polls?created=1 on success, /auth/login on authentication failure
 */
export async function createPollAction(formData: FormData) {
  const supabase = await getSupabaseServerClient();

  try {
    // Step 1: Verify user authentication using centralized utility
    const { user } = await ensureAuthenticated(supabase);

    // Step 2: Validate CSRF token (optional for backward compatibility)
    const csrfToken = formData.get('csrf_token') as string;
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      throw new CSRFError("Invalid CSRF token", "/polls/create");
    }

    // Step 3: Check rate limiting with enhanced system
    const rateLimitResult = checkRateLimit(user.id, 'create_poll');
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        `Too many polls created. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before creating another poll.`,
        'create_poll',
        Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        "/polls/create"
      );
    }

    // Step 4: Validate and sanitize input
    const { question, options } = validatePollInput(formData);

    // Step 5: Create poll record in database
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        owner_id: user.id,
        question,
        is_public: true,
      })
      .select("id")
      .single();

    if (pollError || !poll) {
      throw new PollError(
        ErrorHandler.formatSupabaseError(pollError),
        undefined,
        'create_poll',
        "/polls/create"
      );
    }

    // Step 6: Create poll options
    const optionsPayload = options.map((label, idx) => ({
      poll_id: poll.id,
      label,
      position: idx,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsPayload);

    if (optionsError) {
      // Cleanup on failure
      await supabase.from("polls").delete().eq("id", poll.id);
      throw new PollError(
        ErrorHandler.formatSupabaseError(optionsError),
        poll.id,
        'create_options',
        "/polls/create"
      );
    }

    // Step 7: Redirect on success
    redirect("/polls?created=1");
    
  } catch (error) {
    // Handle different error types appropriately
    if (error instanceof PollError || error instanceof CSRFError || error instanceof RateLimitError) {
      error.log();
      redirect(error.redirectPath || "/polls/create");
    }
    
    // Handle unexpected errors
    const errorInfo = ErrorHandler.handle(error, { action: 'create_poll' });
    console.error('Unexpected poll creation error:', error);
    redirect("/polls/create?error=" + encodeURIComponent(errorInfo.userMessage));
  }
}


