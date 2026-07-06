import { defineTool } from "eve/tools";
import { z } from "zod";
import { getProfileFromUserId } from "../../lib/auth-server";
import { getUserScopedSupabase } from "../../lib/supabase-server";
import {
  ComparisonMetricSchema,
  COMPARISON_METRIC_INFO,
  FlatRangeInputSchema,
  toRelativeRange,
  WidgetConfig,
  MetricSource,
} from "../../lib/widget-config";
import { resolveRelativeRange } from "../../lib/relative-range";
import { assertWidgetHasData } from "../../lib/widget-data-check";
import { elementIdsForPlant } from "../../lib/datasource-lookup";

// Flat input schema (no nested discriminated unions) — OpenAI's function
// schema converter requires the tool's root schema to be a plain `type:
// "object"` throughout, which a z.discriminatedUnion root/branch violates.
// Same flat-optional-fields + manual validation style as get_daily_energy.ts's
// "provide plant_id or datasource_id" pattern, just extended to 3 widget types.
export default defineTool({
  description:
    "Create a persistent widget on the user's dashboard (KPI card, line chart, or comparison chart). " +
    "Resolve plant/datasource names to ids via get_plants/get_datasources first.",
  inputSchema: z.object({
    widget_type: z.enum(["kpi", "line_chart", "comparison_chart"]),
    title: z.string().describe(
      "A short, human-readable title for the widget, e.g. 'Solar Farm Alpha — Today's Production'. Include the plant/metric/range so it's identifiable later."
    ),
    ...FlatRangeInputSchema.shape,

    // kpi / line_chart
    plant_id: z.string().optional().describe("Plant UUID from get_plants. Required for widget_type 'kpi' and 'line_chart'."),
    datasource_id: z.string().optional().describe(
      "Datasource UUID from get_datasources. For 'kpi'/'line_chart': omit for total plant-level energy (kWh). Required if granularity is 'hourly'."
    ),
    aggregation: z.enum(["sum", "average"]).optional().describe(
      "For 'kpi'/'line_chart'. Omit to use the datasource's own default aggregation."
    ),
    granularity: z.enum(["hourly", "daily"]).optional().describe("For 'line_chart' only. Defaults to 'daily'."),

    // comparison_chart
    metric: ComparisonMetricSchema.optional().describe("Required for widget_type 'comparison_chart'."),
    plant_ids: z.array(z.string()).optional().describe(
      "For 'comparison_chart'. Plant UUIDs to compare — omit to compare all of the user's plants (auto-updates as plants are added)."
    ),
  }),
  async execute(input, ctx) {
    const userId = ctx.session.auth.current?.subject;
    if (!userId) throw new Error("Unauthenticated");

    const profile = await getProfileFromUserId(userId);
    const supabase = getUserScopedSupabase(userId);
    const range = toRelativeRange(input);

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
        throw new Error(
          `Datasource ${datasourceId} not found on plant ${plantId} — call get_datasources for valid ids.`
        );
      }
      return data as { id: string; units: string | null; default_aggregation: string | null };
    }

    let config: WidgetConfig;

    if (input.widget_type === "kpi" || input.widget_type === "line_chart") {
      if (!input.plant_id) throw new Error("plant_id is required for widget_type 'kpi'/'line_chart'.");
      await requirePlant(input.plant_id);

      const granularity = input.widget_type === "line_chart" ? input.granularity ?? "daily" : undefined;
      if (input.widget_type === "line_chart" && granularity === "hourly" && !input.datasource_id) {
        throw new Error("datasource_id is required when granularity is 'hourly'.");
      }

      let units = "kWh";
      let aggregation: "sum" | "average" = input.aggregation ?? "sum";

      if (input.datasource_id) {
        const ds = await requireDatasource(input.plant_id, input.datasource_id);
        units = ds.units ?? "";
        aggregation = input.aggregation ?? (ds.default_aggregation as "sum" | "average" | null) ?? "sum";
      }

      const source: MetricSource = input.datasource_id
        ? { kind: "datasource", plant_id: input.plant_id, datasource_id: input.datasource_id }
        : { kind: "plant_energy", plant_id: input.plant_id };

      config =
        input.widget_type === "kpi"
          ? { type: "kpi", source, aggregation, units, range }
          : { type: "line_chart", source, aggregation, granularity: granularity!, units, range };
    } else {
      if (!input.metric) throw new Error("metric is required for widget_type 'comparison_chart'.");

      let plantIds: string[] | null = null;
      if (input.plant_ids) {
        const { data, error } = await supabase
          .from("plants")
          .select("id")
          .eq("company_id", profile.company_id)
          .in("id", input.plant_ids);
        if (error) throw error;
        if (!data || data.length !== input.plant_ids.length) {
          throw new Error("One or more plant_ids are invalid — call get_plants for valid plant ids.");
        }
        plantIds = input.plant_ids;
      }

      config = {
        type: "comparison_chart",
        metric: input.metric,
        plant_ids: plantIds,
        unit: COMPARISON_METRIC_INFO[input.metric].displayUnit,
        range,
      };
    }

    // Reject widgets that would render permanently empty (e.g. a relative
    // preset pointing past the dataset's last reading) — the error names the
    // available data span so the model can pick a valid range or ask the user.
    await assertWidgetHasData(supabase, profile.company_id, config, resolveRelativeRange(range));

    const { data: last, error: lastErr } = await supabase
      .from("widgets")
      .select("sort_order")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastErr) throw lastErr;
    const sortOrder = (last?.sort_order ?? -1) + 1;

    const { data: widget, error } = await supabase
      .from("widgets")
      .insert({
        user_id: userId,
        widget_type: input.widget_type,
        title: input.title,
        config,
        sort_order: sortOrder,
      })
      .select("id, title, widget_type")
      .single();

    if (error) throw error;
    return widget;
  },
});
