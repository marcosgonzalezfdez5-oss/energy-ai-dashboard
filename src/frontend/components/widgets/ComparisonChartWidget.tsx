'use client'

import { useEffect, useState } from "react";
import {
  getPlants,
  getDatasources,
  getPlantDailyEnergy,
  getDailyReadings,
  getDatasourceDailyAvg,
} from "@/lib/api";
import ComparisonChart, { ChartSeries } from "@/components/ComparisonChart";
import { WidgetConfig, COMPARISON_METRIC_INFO } from "@/lib/widget-config";
import { resolveRelativeRange } from "@/lib/relative-range";

const PLANT_COLORS = ["#f59e0b", "#0ea5e9", "#14b8a6", "#fb923c", "#a78bfa"];

type Props = {
  title: string;
  config: Extract<WidgetConfig, { type: "comparison_chart" }>;
  token: string;
};

export default function ComparisonChartWidget({ title, config, token }: Props) {
  const [series, setSeries] = useState<ChartSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const range = resolveRelativeRange(config.range);
    const info = COMPARISON_METRIC_INFO[config.metric];

    getPlants(token)
      .then(async (allPlants) => {
        // plant_ids: null means "all plants" — re-resolved fresh every render
        // so newly added plants automatically appear (decision 6).
        const plants = config.plant_ids
          ? allPlants.filter((p) => config.plant_ids!.includes(p.id))
          : allPlants;

        const results = await Promise.all(
          plants.map(async (plant, idx): Promise<ChartSeries> => {
            const color = PLANT_COLORS[idx % PLANT_COLORS.length];

            if (info.datasourceUnit === null) {
              const rows = await getPlantDailyEnergy(token, plant.id, range.start, range.end);
              return { name: plant.name, color, data: rows.map((r) => ({ date: r.date, value: r.total_kwh })) };
            }

            const datasources = await getDatasources(token, plant.id);
            const ds = datasources.find((d) => d.units === info.datasourceUnit);
            if (!ds) return { name: plant.name, color, data: [] };

            const rows =
              info.aggregation === "average"
                ? await getDatasourceDailyAvg(token, ds.id, range.start, range.end)
                : await getDailyReadings(token, ds.id, range.start, range.end);
            return { name: plant.name, color, data: rows.map((r) => ({ date: r.date, value: r.total_value })) };
          })
        );

        if (!cancelled) setSeries(results);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config, token]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-th">
        <h3 className="text-base font-semibold text-t50 mb-3">{title}</h3>
        <p className="text-t500 text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-th">
        <h3 className="text-base font-semibold text-t50 mb-3">{title}</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return <ComparisonChart title={title} unit={config.unit} series={series} />;
}
