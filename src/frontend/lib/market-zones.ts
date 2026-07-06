import type { SupabaseClient } from "@supabase/supabase-js";

// market_prices has no link to plants anywhere in the schema — plants.region
// ("North"/"South"/...) and market_prices.zone ("zone_1") are unrelated
// vocabularies. Revenue widgets need the caller to pick a zone; these helpers
// let create_widget/update_widget auto-resolve it when there's only one
// (true for every company today) and fail with the real options otherwise,
// rather than silently guessing.

export async function listZones(supabase: SupabaseClient, companyId: string): Promise<string[]> {
  const { data, error } = await supabase.from("market_prices").select("zone").eq("company_id", companyId);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.zone as string))];
}

export async function resolveZone(
  supabase: SupabaseClient,
  companyId: string,
  requested: string | undefined
): Promise<string> {
  const zones = await listZones(supabase, companyId);
  if (zones.length === 0) {
    throw new Error("No market price data exists for this company — revenue widgets aren't available.");
  }
  if (requested) {
    if (!zones.includes(requested)) {
      throw new Error(`Zone '${requested}' not found. Available zones: ${zones.join(", ")}.`);
    }
    return requested;
  }
  if (zones.length === 1) return zones[0];
  throw new Error(`Multiple market zones exist (${zones.join(", ")}) — specify which zone to use for revenue.`);
}
