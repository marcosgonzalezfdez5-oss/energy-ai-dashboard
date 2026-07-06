import type { SupabaseClient } from "@supabase/supabase-js";
import { WidgetConfig, COMPARISON_METRIC_INFO } from "./widget-config";
import { elementIdsForPlants } from "./datasource-lookup";

// Server-side data-existence gate for create_widget/update_widget: a widget
// whose range contains zero readings (e.g. a "today" preset against a
// historical dataset) must fail at the tool with an actionable error —
// telling the model what span IS available — instead of persisting a
// permanently empty chart. Render-time empty states in components/widgets/*
// remain as the fallback for data that goes stale later; this gate only
// guarantees the widget is non-empty at creation time.

type Range = { start: string; end: string }; // ISO instants, end exclusive

/** Company-wide min/max reading timestamps (same query shape as
 *  /api/plants/[plantId]/data-range, minus the per-plant scoping). */
export async function getCompanyDataSpan(
  supabase: SupabaseClient,
  companyId: string
): Promise<{ min: string | null; max: string | null }> {
  const [{ data: first }, { data: last }] = await Promise.all([
    supabase
      .from("readings")
      .select("ts")
      .eq("company_id", companyId)
      .order("ts", { ascending: true })
      .limit(1),
    supabase
      .from("readings")
      .select("ts")
      .eq("company_id", companyId)
      .order("ts", { ascending: false })
      .limit(1),
  ]);
  return { min: first?.[0]?.ts ?? null, max: last?.[0]?.ts ?? null };
}

async function hasReadingsForDatasources(
  supabase: SupabaseClient,
  companyId: string,
  datasourceIds: string[],
  range: Range
): Promise<boolean> {
  if (datasourceIds.length === 0) return false;
  const { data, error } = await supabase
    .from("readings")
    .select("ts")
    .eq("company_id", companyId)
    .in("datasource_id", datasourceIds)
    .gte("ts", range.start)
    .lt("ts", range.end)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** True if the widget's resolved range contains at least one reading. */
export async function widgetHasData(
  supabase: SupabaseClient,
  companyId: string,
  config: WidgetConfig,
  range: Range
): Promise<boolean> {
  if (config.type === "kpi" || config.type === "line_chart") {
    if (config.source.kind === "datasource") {
      return hasReadingsForDatasources(supabase, companyId, [config.source.datasource_id], range);
    }

    if (config.source.kind === "plant_revenue") {
      // Non-empty only if energy and price data actually overlap on at least
      // one date — each individually being non-empty isn't sufficient, since
      // fetchMetricSeries joins them by date.
      const [{ data: energyRows, error: energyErr }, { data: priceRows, error: priceErr }] = await Promise.all([
        supabase.rpc("daily_energy_by_plant", {
          p_plant_id: config.source.plant_id,
          p_company_id: companyId,
          p_start: range.start,
          p_end: range.end,
        }),
        supabase.rpc("daily_market_prices", {
          p_company_id: companyId,
          p_zone: config.source.zone,
          p_start: range.start,
          p_end: range.end,
        }),
      ]);
      if (energyErr) throw energyErr;
      if (priceErr) throw priceErr;
      const priceDates = new Set(((priceRows ?? []) as { date: string }[]).map((r) => r.date));
      return ((energyRows ?? []) as { date: string }[]).some((r) => priceDates.has(r.date));
    }

    // Plant-level energy — same aggregation path the dashboard renders with.
    const { data, error } = await supabase.rpc("daily_energy_by_plant", {
      p_plant_id: config.source.plant_id,
      p_company_id: companyId,
      p_start: range.start,
      p_end: range.end,
    });
    if (error) throw error;
    return (data ?? []).length > 0;
  }

  // comparison_chart — non-empty if at least one compared plant has data.
  const info = COMPARISON_METRIC_INFO[config.metric];

  if (info.datasourceUnit === null) {
    const { data, error } = await supabase.rpc("compare_plants_daily_energy", {
      p_company_id: companyId,
      p_start: range.start,
      p_end: range.end,
    });
    if (error) throw error;
    type Row = { plant_id: string; reading_count: number };
    return ((data ?? []) as Row[]).some(
      (r) => (config.plant_ids === null || config.plant_ids.includes(r.plant_id)) && r.reading_count > 0
    );
  }

  const elementIds = await elementIdsForPlants(supabase, companyId, config.plant_ids);
  if (elementIds.length === 0) return false;

  const { data: datasources, error } = await supabase
    .from("datasources")
    .select("id")
    .eq("company_id", companyId)
    .eq("units", info.datasourceUnit)
    .in("element_id", elementIds);
  if (error) throw error;

  return hasReadingsForDatasources(
    supabase,
    companyId,
    (datasources ?? []).map((d) => d.id),
    range
  );
}

/** Throws (with the available data span in the message, so the model can
 *  self-correct or ask the user) when the widget would render empty. */
export async function assertWidgetHasData(
  supabase: SupabaseClient,
  companyId: string,
  config: WidgetConfig,
  range: Range
): Promise<void> {
  if (await widgetHasData(supabase, companyId, config, range)) return;

  const span = await getCompanyDataSpan(supabase, companyId);
  const spanMsg =
    span.min && span.max
      ? `Data is available from ${span.min.slice(0, 10)} to ${span.max.slice(0, 10)}. ` +
        "Use an absolute range within that span, or ask the user which period they want."
      : "No readings exist for this company at all.";

  throw new Error(
    `No data exists for the selected range ` +
      `(${range.start.slice(0, 10)} to ${range.end.slice(0, 10)}, end exclusive) — widget not saved. ${spanMsg}`
  );
}
