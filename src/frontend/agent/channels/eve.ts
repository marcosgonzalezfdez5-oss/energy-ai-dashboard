import { eveChannel } from "eve/channels/eve";
import { jwtHmac, localDev } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Open on localhost for local development (ignored in production).
    localDev(),
    // Verify Supabase JWTs (HS256 signed with the project JWT secret).
    jwtHmac({
      algorithm: "HS256",
      audiences: ["authenticated"],
      issuer: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`,
      secret: process.env.SUPABASE_JWT_SECRET!,
    }),
  ],
  // Allow browser requests from the same origin.
  cors: { origin: "*", credentials: false },
});
