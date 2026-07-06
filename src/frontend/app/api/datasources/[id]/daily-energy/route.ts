import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth<{ id: string }>(async (req, profile, { id }, supabase) => {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "Missing start or end" }, { status: 400 });

  const { data, error } = await supabase.rpc("daily_energy_by_datasource", {
    p_datasource_id: id,
    p_company_id: profile.company_id,
    p_start: start,
    p_end: end,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
