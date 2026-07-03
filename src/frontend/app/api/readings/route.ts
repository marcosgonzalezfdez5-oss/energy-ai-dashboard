import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getServiceSupabase } from "@/lib/supabase-server";

export const GET = withAuth(async (req, profile) => {
  const { searchParams } = new URL(req.url);
  const datasourceId = searchParams.get("datasource_id");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!datasourceId || !start || !end) {
    return NextResponse.json({ error: "Missing datasource_id, start, or end" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("readings")
    .select("ts, value")
    .eq("datasource_id", datasourceId)
    .eq("company_id", profile.company_id)
    .gte("ts", start)
    .lte("ts", end)
    .order("ts");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
