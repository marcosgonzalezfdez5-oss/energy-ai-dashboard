import { NextResponse } from "next/server";
import { extractBearer, getProfileFromJwt, requireAdmin, type Profile } from "./auth-server";

type RouteHandler<TParams extends Record<string, string> = Record<string, never>> = (
  req: Request,
  profile: Profile,
  params: TParams
) => Promise<Response>;

type NextContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

/** Wraps a Next.js App Router handler with auth, profile resolution, and error handling. */
export function withAuth<TParams extends Record<string, string> = Record<string, never>>(
  handler: RouteHandler<TParams>
) {
  return async (req: Request, context?: NextContext<TParams>): Promise<Response> => {
    try {
      const jwt = extractBearer(req.headers.get("Authorization"));
      if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const profile = await getProfileFromJwt(jwt);
      const params = context ? await context.params : ({} as TParams);
      return await handler(req, profile, params);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status ?? 500;
      const message = err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: message }, { status });
    }
  };
}

/** Wraps a route handler that requires admin access. */
export function withAdminAuth<TParams extends Record<string, string> = Record<string, never>>(
  handler: RouteHandler<TParams>
) {
  return withAuth<TParams>(async (req, profile, params) => {
    requireAdmin(profile);
    return handler(req, profile, params);
  });
}
