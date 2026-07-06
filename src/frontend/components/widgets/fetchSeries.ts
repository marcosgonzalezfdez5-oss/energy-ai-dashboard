import {
  getPlantDailyEnergy,
  getDailyReadings,
  getDatasourceDailyAvg,
  getReadings,
  getDailyMarketPrices,
} from "@/lib/api";
import { ChartPoint } from "@/lib/movingAverage";
import { MetricSource } from "@/lib/widget-config";

// Shared by KpiCard and LineChartWidget: both are backed by the same
// MetricSource (plant-level energy, a specific datasource, or plant
// revenue), differing only in whether the series is reduced to one number or
// drawn as a line.
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

  if (source.kind === "plant_revenue") {
    // Daily energy (kWh) x daily avg price (EUR/MWh) / 1000, joined by date.
    // A day missing from either series can't produce a revenue figure, so
    // it's skipped rather than treated as zero.
    const [energyRows, priceRows] = await Promise.all([
      getPlantDailyEnergy(token, source.plant_id, range.start, range.end),
      getDailyMarketPrices(token, source.zone, range.start, range.end),
    ]);
    const priceByDate = new Map(priceRows.map((p) => [p.date, p.avg_eur_per_mwh]));
    return energyRows
      .filter((e) => priceByDate.has(e.date))
      .map((e) => ({ ts: e.date, value: (e.total_kwh * priceByDate.get(e.date)!) / 1000 }));
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
