import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";
import { elementIdsForPlant } from "../../lib/datasource-lookup";

export default defineTool({
  description: "List the sensors and meters (datasources) for a given plant.",
  inputSchema: z.object({
    plant_id: z.string().describe("The plant UUID from get_plants."),
  }),
  async execute({ plant_id }, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getUserScopedSupabase(userId);

    const elementIds = await elementIdsForPlant(supabase, profile.company_id, plant_id);
    if (elementIds.length === 0) return [];

    const { data, error } = await supabase
      .from("datasources")
      .select("id, name, units, default_aggregation")
      .eq("company_id", profile.company_id)
      .in("element_id", elementIds)
      .order("name");

    if (error) throw error;
    return data ?? [];
  },
});
