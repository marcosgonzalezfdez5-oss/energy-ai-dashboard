import { supabase } from "@/lib/supabase";
import { WidgetRow } from "@/lib/widget-config";

// Mirrors lib/chat-history.ts: same anon-key browser client, RLS (user_id =
// auth.uid()) is the only thing enforcing per-user isolation. Single shared
// implementation for both the dashboard UI and the chat inline-undo button.

export async function listWidgets(): Promise<WidgetRow[]> {
  const { data, error } = await supabase
    .from("widgets")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function renameWidget(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("widgets")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function softDeleteWidget(id: string): Promise<void> {
  const { error } = await supabase
    .from("widgets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreWidget(id: string): Promise<void> {
  const { error } = await supabase.from("widgets").update({ deleted_at: null }).eq("id", id);
  if (error) throw error;
}

export async function reorderWidgets(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) => supabase.from("widgets").update({ sort_order: index }).eq("id", id))
  );
}
