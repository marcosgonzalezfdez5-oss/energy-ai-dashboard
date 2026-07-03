import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getServiceSupabase } from "@/lib/supabase-server";

export const GET = withAuth<{ plantId: string }>(async (req, profile, { plantId }) => {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "Missing start or end" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc("daily_energy_by_plant", {
    p_plant_id: plantId,
    p_company_id: profile.company_id,
    p_start: start,
    p_end: end,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
