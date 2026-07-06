import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

/** Service-role client for server-side use in API routes and Eve tools. Never expose to browser. */
export function getServiceSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Anon-key client initialized with a user JWT — enforces Supabase RLS. */
export function getUserSupabase(jwt: string) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(SUPABASE_URL, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });
}

function base64url(input: string | Buffer): string {
  return (typeof input === "string" ? Buffer.from(input) : input).toString("base64url");
}

/**
 * Mint a short-lived Supabase-compatible HS256 JWT for an already-verified user id,
 * so Postgres RLS sees `auth.uid()` as `userId`. Exists because Eve tool contexts only
 * expose decoded auth claims (`ctx.session.auth.current.subject`), never the caller's
 * original raw bearer token, so there is no raw JWT to forward.
 *
 * SECURITY: `userId` MUST already be verified (e.g. eve's `jwtHmac()`-decoded
 * `subject` claim) — never pass unverified/caller-supplied input.
 */
export function mintUserJwt(userId: string, ttlSeconds = 60): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: `${SUPABASE_URL}/auth/v1`,
    aud: "authenticated",
    sub: userId,
    role: "authenticated",
    iat: now,
    exp: now + ttlSeconds,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = createHmac("sha256", SUPABASE_JWT_SECRET).update(signingInput).digest();
  return `${signingInput}.${base64url(signature)}`;
}

/** User-scoped Supabase client for a verified Eve tool caller — Postgres RLS
 *  policies see this session as `auth.uid() = userId`. */
export function getUserScopedSupabase(userId: string) {
  return getUserSupabase(mintUserJwt(userId));
}
