import type { SupabaseClient } from "@supabase/supabase-js";

// PostgREST embed syntax (datasources.select("...elements!inner(plant_id)"))
// does NOT work against this schema — there's no FK relationship registered
// between `datasources` and `elements`, so it errors with PGRST200. Every
// working query in this codebase (see app/api/plants/[plantId]/datasources
// and .../data-range) instead resolves the plant → element ids first, then
// filters datasources by element_id. These helpers centralize that two-step
// so tools and the data-existence check share one proven pattern.

export async function elementIdsForPlant(
  supabase: SupabaseClient,
  companyId: string,
  plantId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("elements")
    .select("id")
    .eq("company_id", companyId)
    .eq("plant_id", plantId);
  if (error) throw error;
  return (data ?? []).map((e) => e.id as string);
}

export async function elementIdsForPlants(
  supabase: SupabaseClient,
  companyId: string,
  plantIds: string[] | null
): Promise<string[]> {
  let query = supabase.from("elements").select("id").eq("company_id", companyId);
  if (plantIds !== null) query = query.in("plant_id", plantIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((e) => e.id as string);
}
