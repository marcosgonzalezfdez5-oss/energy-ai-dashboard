import { defineTool } from "eve/tools";
import { z } from "zod";
import { getUserScopedSupabase } from "../../lib/supabase-server";
import { WidgetConfigSchema, describeRange } from "../../lib/widget-config";

export default defineTool({
  description:
    "List the current user's dashboard widgets (id, type, title, and a short summary). " +
    "Call this before update_widget or delete_widget to find the right widget_id — " +
    "if more than one widget could match what the user is referring to, ask them to " +
    "disambiguate by title rather than guessing.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const supabase = getUserScopedSupabase(userId);
    const { data, error } = await supabase
      .from("widgets")
      .select("id, widget_type, title, config")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => {
      const parsed = WidgetConfigSchema.safeParse(row.config);
      return {
        id: row.id,
        widget_type: row.widget_type,
        title: row.title,
        summary: parsed.success ? describeRange(parsed.data.range) : "invalid config",
      };
    });
  },
});
