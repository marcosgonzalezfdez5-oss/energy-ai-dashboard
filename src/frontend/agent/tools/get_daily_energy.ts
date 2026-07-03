import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getServiceSupabase } from "../../lib/supabase-server";

export default defineTool({
  description: "Fetch daily energy totals (kWh) for a plant or a specific datasource. Provide either plant_id or datasource_id.",
  inputSchema: z.object({
    plant_id: z.string().optional().describe("Plant UUID — aggregates all datasources for the plant."),
    datasource_id: z.string().optional().describe("Datasource UUID — single sensor/meter totals."),
    start: z.string().describe("Start date in YYYY-MM-DD format."),
    end: z.string().describe("End date in YYYY-MM-DD format."),
  }),
  async execute({ plant_id, datasource_id, start, end }, ctx) {
    if (!plant_id && !datasource_id) throw new Error("Provide plant_id or datasource_id.");

    const userId = ctx.session.auth.current?.principalId;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getServiceSupabase();

    if (datasource_id) {
      // Single datasource — aggregate hourly readings by calendar date.
      const { data, error } = await supabase.rpc("daily_energy_by_datasource", {
        p_datasource_id: datasource_id,
        p_company_id: profile.company_id,
        p_start: start,
        p_end: end,
      });
      if (error) throw error;
      return data ?? [];
    }

    // Plant-level — sum across all datasources.
    const { data, error } = await supabase.rpc("daily_energy_by_plant", {
      p_plant_id: plant_id,
      p_company_id: profile.company_id,
      p_start: start,
      p_end: end,
    });
    if (error) throw error;
    return data ?? [];
  },
});
