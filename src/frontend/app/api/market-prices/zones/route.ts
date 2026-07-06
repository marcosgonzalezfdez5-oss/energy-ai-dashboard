import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-handler";

export const GET = withAdminAuth(async (_req, profile, _params, supabase) => {
  const { data, error } = await supabase
    .from("market_prices")
    .select("zone")
    .eq("company_id", profile.company_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const zones = [...new Set((data ?? []).map(r => r.zone))].sort();
  return NextResponse.json(zones);
});
