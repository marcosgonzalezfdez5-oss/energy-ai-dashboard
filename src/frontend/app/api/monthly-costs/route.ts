import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-handler";
import { getServiceSupabase } from "@/lib/supabase-server";

export const GET = withAdminAuth(async (req, profile) => {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month) {
    return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("monthly-costs")
    .select("plant_id, year, month, category, amount_eur, notes")
    .eq("company_id", profile.company_id)
    .eq("year", year)
    .eq("month", month)
    .order("plant_id")
    .order("category");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
