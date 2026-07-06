import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId, requireAdmin } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";

export default defineTool({
  description: "Fetch electricity market prices (EUR/MWh) for a zone and date range. Admin access only.",
  inputSchema: z.object({
    zone: z.string().describe("Market zone identifier (e.g. 'ES', 'FR')."),
    start: z.string().describe("Start datetime in ISO 8601 format."),
    end: z.string().describe("End datetime in ISO 8601 format."),
    daily: z.boolean().optional().describe("Return daily averages instead of hourly prices."),
  }),
  async execute({ zone, start, end, daily }, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    requireAdmin(profile);

    const supabase = getUserScopedSupabase(userId);

    if (daily) {
      const { data, error } = await supabase.rpc("daily_market_prices", {
        p_company_id: profile.company_id,
        p_zone: zone,
        p_start: start,
        p_end: end,
      });
      if (error) throw error;
      return data ?? [];
    }

    const { data, error } = await supabase
      .from("market_prices")
      .select("zone, ts, eur_per_mwh")
      .eq("company_id", profile.company_id)
      .eq("zone", zone)
      .gte("ts", start)
      .lte("ts", end)
      .order("ts")
      .limit(1000);

    if (error) throw error;
    return data ?? [];
  },
});
