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
  const { data, error } = await supabase.rpc("daily_market_prices", {
    p_company_id: profile.company_id,
    p_zone: zone,
    p_start: start,
    p_end: end,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
