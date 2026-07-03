import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getServiceSupabase } from "../../lib/supabase-server";

export default defineTool({
  description: "List the sensors and meters (datasources) for a given plant.",
  inputSchema: z.object({
    plant_id: z.string().describe("The plant UUID from get_plants."),
  }),
  async execute({ plant_id }, ctx) {
    const userId = ctx.session.auth.current?.principalId;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("datasources")
      .select("id, name, units, default_aggregation, elements!inner(plant_id)")
      .eq("company_id", profile.company_id)
      .eq("elements.plant_id", plant_id)
      .order("name");

    if (error) throw error;
    return (data ?? []).map(({ elements: _el, ...ds }) => ds);
  },
});
