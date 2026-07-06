import { defineTool } from "eve/tools";
import { z } from "zod";
import { getUserScopedSupabase } from "../../lib/supabase-server";

export default defineTool({
  description:
    "Remove one of the user's dashboard widgets (soft delete — the dashboard shows an Undo option for a few seconds). " +
    "Call list_my_widgets first if you don't already have the widget_id.",
  inputSchema: z.object({ widget_id: z.string() }),
  async execute({ widget_id }, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const supabase = getUserScopedSupabase(userId);

    const { data: row, error: fetchErr } = await supabase
      .from("widgets")
      .select("id, title, deleted_at")
      .eq("id", widget_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) throw new Error(`Widget ${widget_id} not found — call list_my_widgets for valid widget ids.`);
    if (row.deleted_at) return { id: widget_id, title: row.title, already_removed: true };

    const { error } = await supabase
      .from("widgets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", widget_id);
    if (error) throw error;

    return { id: widget_id, title: row.title, already_removed: false };
  },
});
