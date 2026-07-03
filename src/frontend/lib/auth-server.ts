import { getServiceSupabase } from "./supabase-server";

export interface Profile {
  id: string;
  company_id: string;
  email: string;
  role: string;
  access_scope: string;
  auth_user_id: string;
}

/** Resolve the authenticated user's profile from a Supabase JWT. */
export async function getProfileFromJwt(jwt: string): Promise<Profile> {
  const supabase = getServiceSupabase();
  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !user) throw new Error("Invalid or expired token");

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, company_id, email, role, access_scope, auth_user_id")
    .eq("auth_user_id", user.id)
    .single();

  if (profileErr || !profile) throw new Error("Profile not found");
  return profile as Profile;
}

/** Resolve the authenticated user's profile from an Eve tool context principal ID. */
export async function getProfileFromUserId(userId: string): Promise<Profile> {
  const supabase = getServiceSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, company_id, email, role, access_scope, auth_user_id")
    .eq("auth_user_id", userId)
    .single();

  if (error || !profile) throw new Error("Profile not found");
  return profile as Profile;
}

/** Extract the bearer token from an Authorization header. Returns null if missing. */
export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/** Throw a 403-shaped error if the profile role is not admin. */
export function requireAdmin(profile: Profile): void {
  if (profile.role !== "admin") {
    throw Object.assign(new Error("Forbidden: admin access required"), { status: 403 });
  }
}
