import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getServiceSupabase } from "@/lib/supabase-server";

export const GET = withAuth<{ plantId: string }>(async (_req, profile, { plantId }) => {
  const supabase = getServiceSupabase();

  const { data: elements, error: elErr } = await supabase
    .from("elements")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("plant_id", plantId);

  if (elErr) return NextResponse.json({ error: elErr.message }, { status: 500 });

  const elementIds = (elements ?? []).map((e) => e.id);
  if (elementIds.length === 0) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("datasources")
    .select("id, external_id, name, units, default_aggregation")
    .eq("company_id", profile.company_id)
    .in("element_id", elementIds)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
