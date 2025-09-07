"use client";

import { createBrowserClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (typeof document === "undefined") return undefined;
        const match = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`));
        return match ? decodeURIComponent(match.split("=")[1]) : undefined;
      },
      set(name: string, value: string, options: Record<string, unknown> = {}) {
        if (typeof document === "undefined") return;
        const {
          path = "/",
          domain,
          maxAge,
          expires,
          sameSite,
          secure,
        } = options || {};
        let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}`;
        if (domain) cookie += `; Domain=${domain}`;
        if (typeof maxAge === "number") cookie += `; Max-Age=${maxAge}`;
        if (expires) {
          const exp = typeof expires === "string" ? expires : (expires as Date).toUTCString?.();
          if (exp) cookie += `; Expires=${exp}`;
        }
        if (sameSite) cookie += `; SameSite=${sameSite}`;
        if (secure) cookie += `; Secure`;
        document.cookie = cookie;
      },
      remove(name: string, options: Record<string, unknown> = {}) {
        if (typeof document === "undefined") return;
        const { path = "/", domain } = options || {};
        let cookie = `${name}=; Path=${path}; Max-Age=0`;
        if (domain) cookie += `; Domain=${domain}`;
        document.cookie = cookie;
      },
    },
  });

  return browserClient;
}


