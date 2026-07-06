import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";
import { toExclusiveEnd } from "../../lib/date-range";

export default defineTool({
  description: "Compare daily energy production across all plants in a date range.",
  inputSchema: z.object({
    start: z.string().describe("Start date in YYYY-MM-DD format, inclusive."),
    end: z.string().describe("End date in YYYY-MM-DD format, inclusive (e.g. for the month of March use start=2024-03-01, end=2024-03-31)."),
  }),
  async execute({ start, end }, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getUserScopedSupabase(userId);

    const { data, error } = await supabase.rpc("compare_plants_daily_energy", {
      p_company_id: profile.company_id,
      p_start: start,
      p_end: toExclusiveEnd(end),
    });

    if (error) throw error;
    return data ?? [];
  },
});
