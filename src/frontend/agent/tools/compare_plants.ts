import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getServiceSupabase } from "../../lib/supabase-server";

export default defineTool({
  description: "Compare daily energy production across all plants in a date range.",
  inputSchema: z.object({
    start: z.string().describe("Start date in YYYY-MM-DD format."),
    end: z.string().describe("End date in YYYY-MM-DD format."),
  }),
  async execute({ start, end }, ctx) {
    const userId = ctx.session.auth.current?.principalId;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase.rpc("compare_plants_daily_energy", {
      p_company_id: profile.company_id,
      p_start: start,
      p_end: end,
    });

    if (error) throw error;
    return data ?? [];
  },
});
