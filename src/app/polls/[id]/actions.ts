"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";

export async function voteAction(pollId: string, optionId: string) {
  const supabase = getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Use the cast_vote function from our database schema
    const { error } = await supabase.rpc('cast_vote', {
      p_poll_id: pollId,
      p_option_id: optionId
    });

    if (error) {
      console.error('Vote error:', error);
      // Redirect back with error message
      redirect(`/polls/${pollId}?error=${encodeURIComponent(error.message)}`);
    }

    // Success - redirect with voted=1 to show thank you message
    redirect(`/polls/${pollId}?voted=1`);
  } catch (error) {
    console.error('Vote submission error:', error);
    redirect(`/polls/${pollId}?error=Failed to submit vote`);
  }
}
