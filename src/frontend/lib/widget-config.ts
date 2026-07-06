import { z } from "zod";

// Shared between the Eve agent tools (agent/tools/*_widget.ts) and the
// dashboard renderers (components/widgets/*) — pure zod/TS, safe to import
// from both server and client code. Widget rows are browser-writable (see
// supabase/widgets.sql), so renderers must always re-validate `config`
// against this schema rather than trusting its shape.

export const RelativeRangeSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("relative"),
    preset: z.enum([
      "today",
      "yesterday",
      "last_7_days",
      "last_30_days",
      "month_to_date",
      "last_month",
    ]),
  }),
  z.object({
    mode: z.literal("absolute"),
    start: z.string().describe("Start date, YYYY-MM-DD, inclusive."),
    end: z.string().describe("End date, YYYY-MM-DD, inclusive."),
  }),
]);
export type RelativeRange = z.infer<typeof RelativeRangeSchema>;

const RANGE_LABELS: Record<Extract<RelativeRange, { mode: "relative" }>["preset"], string> = {
  today: "today",
  yesterday: "yesterday",
  last_7_days: "last 7 days",
  last_30_days: "last 30 days",
  month_to_date: "month to date",
  last_month: "last month",
};

export function describeRange(range: RelativeRange): string {
  return range.mode === "relative" ? RANGE_LABELS[range.preset] : `${range.start} to ${range.end}`;
}

// Flat, non-discriminated-union shape for tool *input* schemas only. OpenAI's
// function-calling schema converter rejects a z.discriminatedUnion used as
// (or nested under) a tool's root inputSchema — it needs a plain `type:
// "object"` throughout. RelativeRangeSchema/WidgetConfigSchema above stay as
// discriminated unions for internal storage/render validation, which never
// go through that converter.
export const FlatRangeInputSchema = z.object({
  range_mode: z.enum(["relative", "absolute"]),
  range_preset: z
    .enum(["today", "yesterday", "last_7_days", "last_30_days", "month_to_date", "last_month"])
    .optional()
    .describe("Required when range_mode is 'relative'."),
  range_start: z.string().optional().describe("YYYY-MM-DD, inclusive. Required when range_mode is 'absolute'."),
  range_end: z.string().optional().describe("YYYY-MM-DD, inclusive. Required when range_mode is 'absolute'."),
});
export type FlatRangeInput = z.infer<typeof FlatRangeInputSchema>;

export function toRelativeRange(input: FlatRangeInput): RelativeRange {
  if (input.range_mode === "absolute") {
    if (!input.range_start || !input.range_end) {
      throw new Error("range_start and range_end are required when range_mode is 'absolute'.");
    }
    return { mode: "absolute", start: input.range_start, end: input.range_end };
  }
  if (!input.range_preset) {
    throw new Error("range_preset is required when range_mode is 'relative'.");
  }
  return { mode: "relative", preset: input.range_preset };
}

export const MetricSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plant_energy"), plant_id: z.string() }),
  z.object({ kind: z.literal("datasource"), plant_id: z.string(), datasource_id: z.string() }),
  // Revenue = daily plant energy (kWh) x daily avg market price (EUR/MWh) for
  // `zone`, joined by date. Admin-only (financial data, same gate as
  // get_market_prices/get_monthly_costs). Always daily granularity/"sum"
  // aggregation — there's no meaningful hourly or averaged revenue here.
  z.object({ kind: z.literal("plant_revenue"), plant_id: z.string(), zone: z.string() }),
]);
export type MetricSource = z.infer<typeof MetricSourceSchema>;

export const ComparisonMetricSchema = z.enum([
  "energy",
  "irradiance",
  "insolation",
  "power",
  "temperature",
]);
export type ComparisonMetric = z.infer<typeof ComparisonMetricSchema>;

// Mirrors OverviewPanel.tsx's findDatasourceId(ds, unit) + AVG_UNITS lookup —
// the single source of truth for "which datasource unit backs this metric,
// and is it summed or averaged" so create_widget and ComparisonChartWidget
// never redefine this mapping separately.
export const COMPARISON_METRIC_INFO: Record<
  ComparisonMetric,
  { label: string; datasourceUnit: string | null; displayUnit: string; aggregation: "sum" | "average" }
> = {
  energy: { label: "Energy Produced", datasourceUnit: null, displayUnit: "kWh", aggregation: "sum" },
  irradiance: { label: "Irradiance", datasourceUnit: "W/m2", displayUnit: "W/m2", aggregation: "average" },
  insolation: { label: "Insolation", datasourceUnit: "kWh/m2", displayUnit: "kWh/m2", aggregation: "average" },
  power: { label: "Power Output", datasourceUnit: "kW", displayUnit: "kW", aggregation: "sum" },
  temperature: { label: "Module Temperature", datasourceUnit: "C", displayUnit: "°C", aggregation: "average" },
};

export const WidgetConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("kpi"),
    source: MetricSourceSchema,
    aggregation: z.enum(["sum", "average"]),
    units: z.string(),
    range: RelativeRangeSchema,
  }),
  z.object({
    type: z.literal("line_chart"),
    source: MetricSourceSchema,
    aggregation: z.enum(["sum", "average"]),
    granularity: z.enum(["hourly", "daily"]),
    units: z.string(),
    range: RelativeRangeSchema,
  }),
  z.object({
    type: z.literal("comparison_chart"),
    metric: ComparisonMetricSchema,
    plant_ids: z.array(z.string()).nullable(),
    unit: z.string(),
    range: RelativeRangeSchema,
  }),
]);
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

export const WIDGET_TYPES = ["kpi", "line_chart", "comparison_chart"] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

export interface WidgetRow {
  id: string;
  user_id: string;
  widget_type: WidgetType;
  title: string;
  config: unknown;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
