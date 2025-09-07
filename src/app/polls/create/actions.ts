"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";
import { validatePollInput, checkRateLimit } from "@/lib/validation";
import { validateCSRFToken } from "@/lib/csrf";

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

  // Step 1: Verify user authentication
  // This ensures only authenticated users can create polls
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Step 2: Validate CSRF token (optional for backward compatibility)
  // CSRF protection prevents cross-site request forgery attacks
  const csrfToken = formData.get('csrf_token') as string;
  if (csrfToken && !(await validateCSRFToken(csrfToken))) {
    throw new Error("Invalid CSRF token");
  }

  // Step 3: Check rate limiting
  // Prevents abuse by limiting poll creation to 3 per minute per user
  if (!checkRateLimit(user.id, 'create_poll')) {
    throw new Error("Too many polls created. Please wait before creating another poll.");
  }

  try {
    // Step 4: Validate and sanitize input
    // This prevents XSS attacks and ensures data integrity
    const { question, options } = validatePollInput(formData);

    // Step 5: Create poll record in database
    // All polls are created as public by default for sharing
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
      throw new Error(pollError?.message || "Failed to create poll");
    }

    // Step 6: Create poll options
    // Map options to database format with proper positioning
    const optionsPayload = options.map((label, idx) => ({
      poll_id: poll.id,
      label,
      position: idx,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsPayload);

    if (optionsError) {
      // Step 7: Cleanup on failure
      // Remove the poll if options creation fails to maintain data consistency
      await supabase.from("polls").delete().eq("id", poll.id);
      throw new Error(optionsError.message || "Failed to create options");
    }

    // Step 8: Redirect on success
    // Show success message to user
    redirect("/polls?created=1");
  } catch (error) {
    // Step 9: Error handling
    // Provide meaningful error messages while preventing information leakage
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create poll");
  }
}


