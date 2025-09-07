"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";
import { validatePollInput, checkRateLimit } from "@/lib/validation";
import { validateCSRFToken } from "@/lib/csrf";

export async function createPollAction(formData: FormData) {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Validate CSRF token (optional for backward compatibility)
  const csrfToken = formData.get('csrf_token') as string;
  if (csrfToken && !(await validateCSRFToken(csrfToken))) {
    throw new Error("Invalid CSRF token");
  }

  // Check rate limiting
  if (!checkRateLimit(user.id, 'create_poll')) {
    throw new Error("Too many polls created. Please wait before creating another poll.");
  }

  try {
    // Validate and sanitize input
    const { question, options } = validatePollInput(formData);

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

    const optionsPayload = options.map((label, idx) => ({
      poll_id: poll.id,
      label,
      position: idx,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsPayload);

    if (optionsError) {
      // best-effort cleanup
      await supabase.from("polls").delete().eq("id", poll.id);
      throw new Error(optionsError.message || "Failed to create options");
    }

    redirect("/polls?created=1");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create poll");
  }
}


