import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, profile, _params, supabase) => {
  const { data, error } = await supabase
    .from("plants")
    .select("id, external_id, name, nominal_power, region, commissioning_date")
    .eq("company_id", profile.company_id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
});
