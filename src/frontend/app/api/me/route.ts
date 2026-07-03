import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, profile) => {
  return NextResponse.json({
    profile_id: profile.id,
    company_id: profile.company_id,
    email: profile.email,
    role: profile.role,
    access_scope: profile.access_scope,
  });
});
