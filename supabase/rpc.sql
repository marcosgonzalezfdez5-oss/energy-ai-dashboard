-- Supabase RPC functions required by the Next.js API routes and Eve agent tools.
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- All functions:
--   - Are SECURITY DEFINER so they bypass RLS (security is enforced via the
--     p_company_id parameter, which API routes and Eve tools always derive from
--     the authenticated user's profile — never from user input).
--   - Use SET search_path = public to prevent schema-injection attacks.
--   - Mirror the exact SQL from the Python backend's queries.py.


-- ---------------------------------------------------------------------------
-- 1. daily_energy_by_plant
--    Daily kWh totals for a plant (kWh datasources only, exclusive end date).
--    Called by: /api/plants/[plantId]/daily-energy, Eve tool get_daily_energy
--    Returns:   { date: date, total_kwh: float }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION daily_energy_by_plant(
  p_plant_id   uuid,
  p_company_id uuid,
  p_start      text,
  p_end        text
)
RETURNS TABLE (date date, total_kwh float8)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', r.ts)::date AS date,
    sum(r.value)::float8          AS total_kwh
  FROM readings r
  JOIN datasources d ON d.id = r.datasource_id
  JOIN elements    e ON e.id = d.element_id
  WHERE e.plant_id   = p_plant_id
    AND r.company_id = p_company_id
    AND d.units      = 'kWh'
    AND r.ts >= p_start::timestamptz
    AND r.ts <  p_end::timestamptz
  GROUP BY 1
  ORDER BY 1;
$$;


-- ---------------------------------------------------------------------------
-- 2. daily_energy_by_datasource
--    Daily sum of readings for a single datasource.
--    Called by: /api/datasources/[id]/daily-energy, Eve tool get_daily_energy
--    Returns:   { date: date, total_value: float }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION daily_energy_by_datasource(
  p_datasource_id uuid,
  p_company_id    uuid,
  p_start         text,
  p_end           text
)
RETURNS TABLE (date date, total_value float8)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', ts)::date AS date,
    sum(value)::float8          AS total_value
  FROM readings
  WHERE datasource_id = p_datasource_id
    AND company_id    = p_company_id
    AND ts >= p_start::timestamptz
    AND ts <  p_end::timestamptz
  GROUP BY 1
  ORDER BY 1;
$$;


-- ---------------------------------------------------------------------------
-- 3. daily_avg_by_datasource
--    Daily average of readings for a single datasource (temperature, irradiance, etc.).
--    Called by: /api/datasources/[id]/daily-avg
--    Returns:   { date: date, total_value: float }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION daily_avg_by_datasource(
  p_datasource_id uuid,
  p_company_id    uuid,
  p_start         text,
  p_end           text
)
RETURNS TABLE (date date, total_value float8)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('day', ts)::date AS date,
    avg(value)::float8          AS total_value
  FROM readings
  WHERE datasource_id = p_datasource_id
    AND company_id    = p_company_id
    AND ts >= p_start::timestamptz
    AND ts <  p_end::timestamptz
  GROUP BY 1
  ORDER BY 1;
$$;


-- ---------------------------------------------------------------------------
-- 4. daily_market_prices
--    Daily average market price per zone. Admin-only route guards access
--    before this function is called.
--    Called by: /api/market-prices/daily, Eve tool get_market_prices
--    Returns:   { zone: text, date: date, avg_eur_per_mwh: float }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION daily_market_prices(
  p_company_id uuid,
  p_zone       text,
  p_start      text,
  p_end        text
)
RETURNS TABLE (zone text, date date, avg_eur_per_mwh float8)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    zone,
    date_trunc('day', ts)::date                  AS date,
    round(avg(eur_per_mwh)::numeric, 4)::float8  AS avg_eur_per_mwh
  FROM market_prices
  WHERE company_id = p_company_id
    AND zone       = p_zone
    AND ts >= p_start::timestamptz
    AND ts <  p_end::timestamptz
  GROUP BY zone, date_trunc('day', ts)::date
  ORDER BY date;
$$;


-- ---------------------------------------------------------------------------
-- 5. compare_plants_daily_energy
--    Total kWh per plant for a date range, sorted by production descending.
--    Called by: Eve tool compare_plants
--    Returns:   { plant_id, external_id, name, region, total_kwh, reading_count }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compare_plants_daily_energy(
  p_company_id uuid,
  p_start      text,
  p_end        text
)
RETURNS TABLE (
  plant_id      uuid,
  external_id   int,
  name          text,
  region        text,
  total_kwh     float8,
  reading_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                               AS plant_id,
    p.external_id,
    p.name,
    p.region,
    coalesce(sum(r.value), 0)::float8  AS total_kwh,
    count(r.value)                     AS reading_count
  FROM plants p
  LEFT JOIN elements    e ON e.plant_id   = p.id
  LEFT JOIN datasources d ON d.element_id = e.id AND d.units = 'kWh'
  LEFT JOIN readings    r
    ON  r.datasource_id = d.id
    AND r.company_id    = p_company_id
    AND r.ts >= p_start::timestamptz
    AND r.ts <  p_end::timestamptz
  WHERE p.company_id = p_company_id
  GROUP BY p.id, p.external_id, p.name, p.region
  ORDER BY total_kwh DESC;
$$;
