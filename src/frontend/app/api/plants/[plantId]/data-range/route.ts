import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getServiceSupabase } from "@/lib/supabase-server";

export const GET = withAuth<{ plantId: string }>(async (_req, profile, { plantId }) => {
  const supabase = getServiceSupabase();

  // Get min/max timestamps from readings for all datasources under this plant.
  const { data: elements, error: elErr } = await supabase
    .from("elements")
    .select("id")
    .eq("company_id", profile.company_id)
    .eq("plant_id", plantId);

  if (elErr) return NextResponse.json({ error: elErr.message }, { status: 500 });

  const elementIds = (elements ?? []).map((e) => e.id);
  if (elementIds.length === 0) return NextResponse.json({ min_date: null, max_date: null });

  const { data: dsData, error: dsErr } = await supabase
    .from("datasources")
    .select("id")
    .eq("company_id", profile.company_id)
    .in("element_id", elementIds);

  if (dsErr) return NextResponse.json({ error: dsErr.message }, { status: 500 });

  const ids = (dsData ?? []).map(d => d.id);
  if (ids.length === 0) return NextResponse.json({ min_date: null, max_date: null });

  const { data, error } = await supabase
    .from("readings")
    .select("ts")
    .in("datasource_id", ids)
    .eq("company_id", profile.company_id)
    .order("ts", { ascending: true })
    .limit(1);

  const { data: lastData, error: lastErr } = await supabase
    .from("readings")
    .select("ts")
    .in("datasource_id", ids)
    .eq("company_id", profile.company_id)
    .order("ts", { ascending: false })
    .limit(1);

  if (error || lastErr) {
    return NextResponse.json({ error: (error ?? lastErr)?.message }, { status: 500 });
  }

  return NextResponse.json({
    min_date: data?.[0]?.ts ?? null,
    max_date: lastData?.[0]?.ts ?? null,
  });
});
