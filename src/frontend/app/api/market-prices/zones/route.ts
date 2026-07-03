import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-handler";
import { getServiceSupabase } from "@/lib/supabase-server";

export const GET = withAdminAuth(async (_req, profile) => {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("market_prices")
    .select("zone")
    .eq("company_id", profile.company_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const zones = [...new Set((data ?? []).map(r => r.zone))].sort();
  return NextResponse.json(zones);
});
