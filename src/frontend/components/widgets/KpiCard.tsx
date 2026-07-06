'use client'

import { useEffect, useState } from "react";
import { WidgetConfig } from "@/lib/widget-config";
import { resolveRelativeRange } from "@/lib/relative-range";
import { fetchMetricSeries } from "./fetchSeries";

type Props = {
  title: string;
  config: Extract<WidgetConfig, { type: "kpi" }>;
  token: string;
};

export default function KpiCard({ title, config, token }: Props) {
  const [value, setValue] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const range = resolveRelativeRange(config.range);

    fetchMetricSeries(token, config.source, config.aggregation, range)
      .then((points) => {
        if (cancelled) return;
        setCount(points.length);
        if (points.length === 0) {
          setValue(null);
          return;
        }
        const sum = points.reduce((s, p) => s + p.value, 0);
        setValue(config.aggregation === "average" ? sum / points.length : sum);
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

  return (
    <div
      className="bg-card rounded-2xl p-6 border border-th hover:-translate-y-0.5 transition-transform duration-200"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold text-t50">{title}</h3>
        <span className="text-t500 text-sm font-normal">({config.units})</span>
      </div>

      {loading ? (
        <p className="text-t500 text-sm py-6">Loading…</p>
      ) : error ? (
        <p className="text-red-400 text-sm py-6">{error}</p>
      ) : value === null ? (
        <p className="text-t500 text-sm py-6">No data yet for this period</p>
      ) : (
        <>
          <p className="text-3xl font-bold text-t50 tabular-nums tracking-tight">
            {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-t500 mt-1">
            {config.units} {config.aggregation === "average" ? "avg" : "total"} · {count} data points
          </p>
        </>
      )}
    </div>
  );
}
