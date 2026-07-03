import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-handler";
import { getServiceSupabase } from "@/lib/supabase-server";

export const GET = withAdminAuth(async (req, profile) => {
  const { searchParams } = new URL(req.url);
  const zone = searchParams.get("zone");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!zone || !start || !end) {
    return NextResponse.json({ error: "Missing zone, start, or end" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("market_prices")
    .select("zone, ts, eur_per_mwh")
    .eq("company_id", profile.company_id)
    .eq("zone", zone)
    .gte("ts", start)
    .lte("ts", end)
    .order("ts");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
