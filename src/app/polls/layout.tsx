import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";

export default async function PollsLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}


