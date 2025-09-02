"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";

export async function createPollAction(formData: FormData) {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const question = String(formData.get("title") || "").trim();
  const rawOptions = [
    String(formData.get("option1") || "").trim(),
    String(formData.get("option2") || "").trim(),
    String(formData.get("option3") || "").trim(),
    String(formData.get("option4") || "").trim(),
  ].filter(Boolean);

  if (!question) {
    throw new Error("Poll title is required");
  }
  if (rawOptions.length < 2) {
    throw new Error("At least two options are required");
  }

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

  const optionsPayload = rawOptions.map((label, idx) => ({
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
}


