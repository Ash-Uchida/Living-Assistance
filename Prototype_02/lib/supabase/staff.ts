import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "../types";
import type { Database } from "./database.types";

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** The signed-in person's job from the staff list. Null means no job (the Unassigned box) or not listed. */
export async function staffRoleFor(supabase: SupabaseClient<Database>, email: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from("staff_accounts")
    .select("role")
    .eq("email", email.trim().toLowerCase())
    .limit(1);
  if (error) throw error;
  return data[0]?.role ?? null;
}
