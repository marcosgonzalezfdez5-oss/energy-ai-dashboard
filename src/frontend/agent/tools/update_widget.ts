import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId, requireAdmin } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";
import {
  ComparisonMetricSchema,
  COMPARISON_METRIC_INFO,
  WidgetConfigSchema,
  WidgetConfig,
  MetricSource,
  WidgetType,
  toRelativeRange,
} from "../../lib/widget-config";
import { resolveRelativeRange } from "../../lib/relative-range";
import { assertWidgetHasData } from "../../lib/widget-data-check";
import { elementIdsForPlant } from "../../lib/datasource-lookup";
import { resolveZone } from "../../lib/market-zones";

// Flat fields (no nested discriminated unions) inside `changes` — same
// reasoning as create_widget.ts: OpenAI's function schema converter needs a
// plain object tree throughout the tool's input schema.
export default defineTool({
  description:
    "Modify an existing dashboard widget in place (e.g. change its date range, chart type, or which plant/datasource it shows). " +
    "Call list_my_widgets first to find the widget_id — if more than one widget could match what the user means, ask them to " +
    "disambiguate by title instead of guessing. Only pass the fields that are changing inside `changes`; anything omitted keeps " +
    "its current value.",
  inputSchema: z.object({
    widget_id: z.string(),
    title: z.string().optional().describe("New title, if the user asked to rename it."),
    widget_type: z.enum(["kpi", "line_chart", "comparison_chart"]).optional().describe(
      "Only set this if switching between the 3 supported widget types. Anything else (bar/pie/table/etc.) isn't supported — decline instead of calling this."
    ),
    changes: z
      .object({
        range_mode: z.enum(["relative", "absolute"]).optional().describe("Set together with range_preset or range_start/range_end to change the date range."),
        range_preset: z
          .enum(["today", "yesterday", "last_7_days", "last_30_days", "month_to_date", "last_month"])
          .optional()
          .describe("Required when range_mode is 'relative'."),
        range_start: z.string().optional().describe("YYYY-MM-DD, inclusive. Required when range_mode is 'absolute'."),
        range_end: z.string().optional().describe("YYYY-MM-DD, inclusive. Required when range_mode is 'absolute'."),
        plant_id: z.string().optional(),
        datasource_id: z.string().nullable().optional().describe("Set to null to switch to plant-level total energy."),
        aggregation: z.enum(["sum", "average"]).optional(),
        granularity: z.enum(["hourly", "daily"]).optional(),
        revenue: z.boolean().optional().describe(
          "For 'kpi'/'line_chart': set true to switch to revenue (EUR), false to switch back to a raw reading. Admin only."
        ),
        zone: z.string().optional().describe("Market zone for revenue widgets — omit to keep/auto-resolve the current one."),
        metric: ComparisonMetricSchema.optional(),
        plant_ids: z.array(z.string()).nullable().optional().describe("Set to null to compare all plants."),
      })
      .default({}),
  }),
  async execute({ widget_id, title, widget_type, changes }, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getUserScopedSupabase(userId);

    const { data: row, error: fetchErr } = await supabase
      .from("widgets")
      .select("id, widget_type, config")
      .eq("id", widget_id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!row) throw new Error(`Widget ${widget_id} not found — call list_my_widgets for valid widget ids.`);

    const parsedExisting = WidgetConfigSchema.safeParse(row.config);
    const existing = parsedExisting.success ? parsedExisting.data : null;
    const resultType: WidgetType = widget_type ?? (row.widget_type as WidgetType);

    const range = changes.range_mode
      ? toRelativeRange({
          range_mode: changes.range_mode,
          range_preset: changes.range_preset,
          range_start: changes.range_start,
          range_end: changes.range_end,
        })
      : existing?.range;
    if (!range) throw new Error("range is required — this widget's existing config could not be read.");

    async function requirePlant(plantId: string) {
      const { data, error } = await supabase
        .from("plants")
        .select("id")
        .eq("id", plantId)
        .eq("company_id", profile.company_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`Plant ${plantId} not found — call get_plants for valid plant ids.`);
    }

    async function requireDatasource(plantId: string, datasourceId: string) {
      const elementIds = await elementIdsForPlant(supabase, profile.company_id, plantId);
      const { data, error } = elementIds.length
        ? await supabase
            .from("datasources")
            .select("id, units, default_aggregation")
            .eq("id", datasourceId)
            .eq("company_id", profile.company_id)
            .in("element_id", elementIds)
            .maybeSingle()
        : { data: null, error: null };
      if (error) throw error;
      if (!data) {
        throw new Error(`Datasource ${datasourceId} not found on plant ${plantId} — call get_datasources for valid ids.`);
      }
      return data as { id: string; units: string | null; default_aggregation: string | null };
    }

    let config: WidgetConfig;

    if (resultType === "kpi" || resultType === "line_chart") {
      const existingSource: MetricSource | undefined =
        existing?.type === "kpi" || existing?.type === "line_chart" ? existing.source : undefined;

      const plantId = changes.plant_id ?? existingSource?.plant_id;
      if (!plantId) throw new Error("plant_id is required to build this widget.");
      await requirePlant(plantId);

      const granularity =
        resultType === "line_chart"
          ? changes.granularity ?? (existing?.type === "line_chart" ? existing.granularity : "daily")
          : undefined;

      const wantsRevenue = changes.revenue ?? existingSource?.kind === "plant_revenue";

      let source: MetricSource;
      let units: string;
      let aggregation: "sum" | "average";

      if (wantsRevenue) {
        requireAdmin(profile);
        if (changes.datasource_id) {
          throw new Error("datasource_id cannot be combined with revenue — revenue is computed from total plant energy, not a single datasource.");
        }
        if (granularity === "hourly") {
          throw new Error("Revenue widgets only support daily granularity.");
        }
        const requestedZone = changes.zone ?? (existingSource?.kind === "plant_revenue" ? existingSource.zone : undefined);
        const zone = await resolveZone(supabase, profile.company_id, requestedZone);
        source = { kind: "plant_revenue", plant_id: plantId, zone };
        units = "€";
        aggregation = "sum";
      } else {
        const datasourceId =
          changes.datasource_id === null
            ? undefined
            : changes.datasource_id ?? (existingSource?.kind === "datasource" ? existingSource.datasource_id : undefined);

        if (resultType === "line_chart" && granularity === "hourly" && !datasourceId) {
          throw new Error("datasource_id is required when granularity is 'hourly'.");
        }

        const existingAggregation =
          existing?.type === "kpi" || existing?.type === "line_chart" ? existing.aggregation : undefined;

        units = "kWh";
        aggregation = changes.aggregation ?? existingAggregation ?? "sum";

        if (datasourceId) {
          const ds = await requireDatasource(plantId, datasourceId);
          units = ds.units ?? "";
          aggregation = changes.aggregation ?? (ds.default_aggregation as "sum" | "average" | null) ?? aggregation;
          source = { kind: "datasource", plant_id: plantId, datasource_id: datasourceId };
        } else {
          source = { kind: "plant_energy", plant_id: plantId };
        }
      }

      config =
        resultType === "kpi"
          ? { type: "kpi", source, aggregation, units, range }
          : { type: "line_chart", source, aggregation, granularity: granularity!, units, range };
    } else {
      const metric = changes.metric ?? (existing?.type === "comparison_chart" ? existing.metric : undefined);
      if (!metric) throw new Error("metric is required to build this widget.");

      let plantIds: string[] | null;
      if (changes.plant_ids !== undefined) {
        if (changes.plant_ids === null) {
          plantIds = null;
        } else {
          const { data, error } = await supabase
            .from("plants")
            .select("id")
            .eq("company_id", profile.company_id)
            .in("id", changes.plant_ids);
          if (error) throw error;
          if (!data || data.length !== changes.plant_ids.length) {
            throw new Error("One or more plant_ids are invalid — call get_plants for valid plant ids.");
          }
          plantIds = changes.plant_ids;
        }
      } else {
        plantIds = existing?.type === "comparison_chart" ? existing.plant_ids : null;
      }

      config = {
        type: "comparison_chart",
        metric,
        plant_ids: plantIds,
        unit: COMPARISON_METRIC_INFO[metric].displayUnit,
        range,
      };
    }

    // Same data-existence gate as create_widget: don't save an edit that
    // would leave the widget permanently empty.
    await assertWidgetHasData(supabase, profile.company_id, config, resolveRelativeRange(range));

    const update: Record<string, unknown> = {
      config,
      widget_type: resultType,
      updated_at: new Date().toISOString(),
    };
    if (title) update.title = title;

    const { data: updated, error } = await supabase
      .from("widgets")
      .update(update)
      .eq("id", widget_id)
      .select("id, title, widget_type")
      .single();

    if (error) throw error;
    return updated;
  },
});
