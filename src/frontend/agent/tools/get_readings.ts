import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";

export default defineTool({
  description: "Fetch hourly energy readings for a datasource within a date range. Returns at most 1000 rows — use get_daily_energy for longer periods.",
  inputSchema: z.object({
    datasource_id: z.string().describe("The datasource UUID from get_datasources."),
    start: z.string().describe("Start datetime in ISO 8601 format (e.g. 2024-01-01T00:00:00Z)."),
    end: z.string().describe("End datetime in ISO 8601 format (e.g. 2024-01-31T23:59:59Z)."),
  }),
  async execute({ datasource_id, start, end }, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getUserScopedSupabase(userId);

    const { data, error } = await supabase
      .from("readings")
      .select("ts, value")
      .eq("datasource_id", datasource_id)
      .eq("company_id", profile.company_id)
      .gte("ts", start)
      .lte("ts", end)
      .order("ts")
      .limit(1000);

    if (error) throw error;
    return data ?? [];
  },
});
