import { getPlantDailyEnergy, getDailyReadings, getDatasourceDailyAvg, getReadings } from "@/lib/api";
import { ChartPoint } from "@/lib/movingAverage";
import { MetricSource } from "@/lib/widget-config";

// Shared by KpiCard and LineChartWidget: both are backed by the same
// MetricSource (plant-level energy or a specific datasource), differing only
// in whether the series is reduced to one number or drawn as a line.
export async function fetchMetricSeries(
  token: string,
  source: MetricSource,
  aggregation: "sum" | "average",
  range: { start: string; end: string },
  granularity: "hourly" | "daily" = "daily"
): Promise<ChartPoint[]> {
  if (source.kind === "plant_energy") {
    const rows = await getPlantDailyEnergy(token, source.plant_id, range.start, range.end);
    return rows.map((r) => ({ ts: r.date, value: r.total_kwh }));
  }

  if (granularity === "hourly") {
    const rows = await getReadings(token, source.datasource_id, range.start, range.end);
    return rows.map((r) => ({ ts: r.ts, value: r.value }));
  }

  const rows =
    aggregation === "average"
      ? await getDatasourceDailyAvg(token, source.datasource_id, range.start, range.end)
      : await getDailyReadings(token, source.datasource_id, range.start, range.end);
  return rows.map((r) => ({ ts: r.date, value: r.total_value }));
}
