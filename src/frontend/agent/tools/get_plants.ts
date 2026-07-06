import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";

export default defineTool({
  description: "List all solar plants accessible to the current user's company.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getUserScopedSupabase(userId);

    const { data, error } = await supabase
      .from("plants")
      .select("id, name, nominal_power, region, commissioning_date")
      .eq("company_id", profile.company_id)
      .order("name");

    if (error) throw error;
    return data ?? [];
  },
});
