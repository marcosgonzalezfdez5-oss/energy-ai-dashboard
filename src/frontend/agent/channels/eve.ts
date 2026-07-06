import { eveChannel } from "eve/channels/eve";
import { oidc, localDev } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Verify Supabase-issued JWTs via its OIDC discovery document + JWKS.
    // Supabase signs user session tokens with rotating asymmetric keys
    // (ES256 + kid) via GoTrue, not the legacy static HS256 project secret —
    // oidc() fetches the current signing keys dynamically instead of
    // requiring a single static secret/public key.
    oidc({
      audiences: ["authenticated"],
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
    }),
    // Fallback for unauthenticated local tooling (ignored in production).
    localDev(),
  ],
  // Allow browser requests from the same origin.
  cors: { origin: "*", credentials: false },
});
