import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-handler";

export const GET = withAdminAuth(async (req, profile, _params, supabase) => {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month) {
    return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("monthly_costs")
    .select("plant_id, year, month, category, amount_eur, notes")
    .eq("company_id", profile.company_id)
    .eq("year", year)
    .eq("month", month)
    .order("plant_id")
    .order("category");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
