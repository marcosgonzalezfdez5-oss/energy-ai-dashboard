import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId, requireAdmin } from "../../lib/auth-server";
import { getServiceSupabase } from "../../lib/supabase-server";

export default defineTool({
  description: "Fetch monthly cost breakdown (EUR) per plant category. Admin access only.",
  inputSchema: z.object({
    year: z.number().int().describe("Calendar year (e.g. 2024)."),
    month: z.number().int().min(1).max(12).describe("Calendar month (1–12)."),
    plant_id: z.string().optional().describe("Restrict to one plant UUID. Omit for all plants."),
  }),
  async execute({ year, month, plant_id }, ctx) {
    const userId = ctx.session.auth.current?.principalId;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    requireAdmin(profile);

    const supabase = getServiceSupabase();

    let query = supabase
      .from("monthly_costs")
      .select("plant_id, year, month, category, amount_eur, notes")
      .eq("company_id", profile.company_id)
      .eq("year", year)
      .eq("month", month);

    if (plant_id) query = query.eq("plant_id", plant_id);

    const { data, error } = await query.order("plant_id").order("category");
    if (error) throw error;
    return data ?? [];
  },
});
