'use client'

import { useEffect, useState } from "react";
import ReadingChart from "@/components/ReadingChart";
import { attachMovingAverage, ChartPoint } from "@/lib/movingAverage";
import { WidgetConfig } from "@/lib/widget-config";
import { resolveRelativeRange } from "@/lib/relative-range";
import { fetchMetricSeries } from "./fetchSeries";

type Props = {
  title: string;
  config: Extract<WidgetConfig, { type: "line_chart" }>;
  token: string;
};

export default function LineChartWidget({ title, config, token }: Props) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const range = resolveRelativeRange(config.range);

    fetchMetricSeries(token, config.source, config.aggregation, range, config.granularity)
      .then((points) => {
        if (cancelled) return;
        setData(config.granularity === "daily" ? attachMovingAverage(points) : points);
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

  return (
    <ReadingChart
      title={title}
      units={config.units}
      data={data}
      mode={config.granularity}
      aggregation={config.aggregation}
    />
  );
}
