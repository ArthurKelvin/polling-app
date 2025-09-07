"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/auth/server";

export async function deletePollAction(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  const pollId = String(formData.get("poll_id") || "");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (!pollId) return;

  await supabase
    .from("polls")
    .delete()
    .eq("id", pollId);

  revalidatePath("/polls/list");
}


