'use client'

import { useEffect, useState } from "react";
import {
  getDatasources, getDataRange, getDailyReadings, getDatasourceDailyAvg,
  Datasource, Plant, UserProfile,
} from "@/lib/api";
import { attachMovingAverage, ChartPoint } from "@/lib/movingAverage";
import ReadingChart from "@/components/ReadingChart";
import FinancialPanel from "@/components/FinancialPanel";
import DatePicker from "@/components/DatePicker";

type Props = { plant: Plant; token: string; profile: UserProfile };

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export default function PlantPanel({ plant, token, profile }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [datasources, setDatasources] = useState<Datasource[]>([]);
  const [chartData, setChartData] = useState<Record<string, ChartPoint[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDatasources([]);
    setChartData({});
    Promise.all([
      getDataRange(token, plant.id),
      getDatasources(token, plant.id),
    ]).then(([range, ds]) => {
      if (range.min_date && range.max_date) {
        const min = toDateInput(range.min_date);
        const max = toDateInput(range.max_date);
        setMinDate(min);
        setMaxDate(max);
        setStartDate(min);
        setEndDate(max);
      }
      setDatasources(ds);
    }).catch(console.error);
  }, [plant, token]);

  useEffect(() => {
    if (datasources.length === 0 || !startDate || !endDate) return;
    setLoading(true);
    const start = `${startDate}T00:00:00Z`;
    const end = `${endDate}T23:59:59Z`;
    const AVG_UNITS = new Set(["W/m2", "kWh/m2", "C"]);
    Promise.all(
      datasources.map((ds) => {
        const fetch = AVG_UNITS.has(ds.units ?? "")
          ? getDatasourceDailyAvg(token, ds.id, start, end)
          : getDailyReadings(token, ds.id, start, end);
        return fetch.then((rows) => {
          const points: ChartPoint[] = rows.map((r) => ({ ts: r.date, value: r.total_value }));
          return [ds.id, attachMovingAverage(points)] as const;
        });
      })
    )
      .then((entries) => setChartData(Object.fromEntries(entries)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [datasources, startDate, endDate, token]);

  const hasFinancial = profile.access_scope === "energy+financial";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-t50 tracking-tight">{plant.name}</h1>
          <p className="text-base text-t400 mt-1.5">
            {[plant.region, plant.nominal_power ? `${plant.nominal_power} kW` : null, plant.commissioning_date ? `Commissioned ${plant.commissioning_date}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center bg-card border border-th rounded-xl transition-colors">
          <div className="flex items-center gap-2.5 px-4 py-3 border-r border-th">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-t500 shrink-0" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <DatePicker label="From" value={startDate} onChange={setStartDate} min={minDate} max={endDate} />
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <DatePicker label="To" value={endDate} onChange={setEndDate} min={startDate} max={maxDate} align="right" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2.5 text-t500 py-8">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-sm">Loading readings…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {datasources.map((ds) => (
            <ReadingChart
              key={ds.id}
              title={ds.name}
              units={ds.units ?? ""}
              data={chartData[ds.id] ?? []}
              mode="daily"
              aggregation={["W/m2", "kWh/m2", "C"].includes(ds.units ?? "") ? "average" : "sum"}
            />
          ))}
        </div>
      )}

      {hasFinancial && (
        <FinancialPanel
          token={token}
          startDate={startDate}
          endDate={endDate}
          plantId={plant.id}
          mode="daily"
        />
      )}
    </div>
  );
}
