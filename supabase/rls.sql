-- Enables Postgres Row Level Security so DB access can be enforced by the
-- authenticated caller's identity, not only by application-level filters.
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
--
-- IMPORTANT ORDERING: only code that queries via the ANON key + a user JWT
-- (lib/supabase-server.ts's getUserSupabase / getUserScopedSupabase) is
-- affected by these policies. getServiceSupabase() (service-role key) always
-- bypasses RLS by design and is unaffected — so this file is safe to apply
-- before any application code changes ship. Conversely, do not switch any
-- caller from getServiceSupabase() to getUserSupabase()/getUserScopedSupabase()
-- until this file has been applied and verified — an anon-key client against
-- a table that has GRANT SELECT but no RLS policy yet would see ALL rows with
-- no company filtering at all, which would be worse than today.

-- ---------------------------------------------------------------------------
-- Helper functions. SECURITY DEFINER lets them read `profiles` without
-- recursing into the RLS policy currently being evaluated ON `profiles`.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE auth_user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION auth_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_role()       TO authenticated;

-- ---------------------------------------------------------------------------
-- profiles — a user may read only their own row.
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON profiles TO authenticated;

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- plants / elements / datasources / readings — company_id is a direct column
-- on every one of these, so no joins are needed inside any policy.
-- ---------------------------------------------------------------------------
ALTER TABLE plants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasources ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings    ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON plants, elements, datasources, readings TO authenticated;

DROP POLICY IF EXISTS plants_select_company ON plants;
CREATE POLICY plants_select_company ON plants
  FOR SELECT TO authenticated USING (company_id = auth_company_id());

DROP POLICY IF EXISTS elements_select_company ON elements;
CREATE POLICY elements_select_company ON elements
  FOR SELECT TO authenticated USING (company_id = auth_company_id());

DROP POLICY IF EXISTS datasources_select_company ON datasources;
CREATE POLICY datasources_select_company ON datasources
  FOR SELECT TO authenticated USING (company_id = auth_company_id());

DROP POLICY IF EXISTS readings_select_company ON readings;
CREATE POLICY readings_select_company ON readings
  FOR SELECT TO authenticated USING (company_id = auth_company_id());

-- ---------------------------------------------------------------------------
-- market_prices / monthly_costs — company-scoped AND admin-only, mirroring
-- the app-level requireAdmin() gate at the DB layer.
-- ---------------------------------------------------------------------------
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_costs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON market_prices, monthly_costs TO authenticated;

DROP POLICY IF EXISTS market_prices_select_admin ON market_prices;
CREATE POLICY market_prices_select_admin ON market_prices
  FOR SELECT TO authenticated
  USING (company_id = auth_company_id() AND auth_role() = 'admin');

DROP POLICY IF EXISTS monthly_costs_select_admin ON monthly_costs;
CREATE POLICY monthly_costs_select_admin ON monthly_costs
  FOR SELECT TO authenticated
  USING (company_id = auth_company_id() AND auth_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Rollback (if anything misbehaves, this instantly reverts to today's
-- app-level-only enforcement without touching any application code):
--
-- ALTER TABLE plants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE elements DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE datasources DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE readings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE market_prices DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE monthly_costs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ---------------------------------------------------------------------------

