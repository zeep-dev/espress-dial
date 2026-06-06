import { supabase } from "./supabase";

// Collection keys (used as the row's "id" together with the user's id).
export const HISTORY_KEY = "espresso-dial-history";
export const BAGS_KEY = "espresso-dial-bags";

// Table holding each collection as a single JSON array row per user.
// Columns: id (text), user_id (uuid), data (jsonb)
const TABLE = "collections";

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function loadCollection<T>(key: string): Promise<T[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("user_id", userId)
    .eq("id", key)
    .maybeSingle();
  if (error) {
    console.error("[v0] loadCollection error:", error.message);
    return [];
  }
  return (data?.data as T[]) ?? [];
}

export async function saveCollection<T>(key: string, value: T[]): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { id: key, user_id: userId, data: value },
      { onConflict: "user_id,id" }
    );
  if (error) {
    console.error("[v0] saveCollection error:", error.message);
  }
}
