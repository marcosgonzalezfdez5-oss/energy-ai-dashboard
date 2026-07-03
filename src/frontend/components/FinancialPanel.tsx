'use client'

import { useEffect, useState } from "react";
import {
  getMarketPriceZones, getMarketPrices, getDailyMarketPrices, getMonthlyCosts,
  MarketPrice, DailyMarketPrice, MonthlyCost,
} from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

type Props = {
  token: string;
  startDate: string;
  endDate: string;
  plantId: string;
  mode?: "hourly" | "daily";
};

const ZONE_COLORS: Record<string, string> = {
  zone_1: "#f59e0b",
  zone_2: "#0ea5e9",
  zone_3: "#fb923c",
  zone_4: "#14b8a6",
};

function formatHourlyTs(ts: string) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
}

function formatDailyTs(date: string) {
  const [, m, d] = date.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function FinancialPanel({ token, startDate, endDate, plantId, mode = "daily" }: Props) {
  const [zones, setZones] = useState<string[]>([]);
  const [mergedPrices, setMergedPrices] = useState<Array<Record<string, unknown>>>([]);
  const [costs, setCosts] = useState<MonthlyCost[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [costsLoading, setCostsLoading] = useState(false);

  const isDaily = mode === "daily";

  useEffect(() => {
    getMarketPriceZones(token).then(setZones).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!startDate || !endDate || zones.length === 0) {
      setMergedPrices([]);
      return;
    }
    setPricesLoading(true);
    const start = `${startDate}T00:00:00Z`;
    const end = `${endDate}T23:59:59Z`;

    const priceFetcher = isDaily
      ? (z: string) => getDailyMarketPrices(token, z, start, end)
      : (z: string) => getMarketPrices(token, z, start, end);

    Promise.all(zones.map((z) => priceFetcher(z).then((rows) => [z, rows] as const)))
      .then((priceEntries) => {
        const map = new Map<string, Record<string, unknown>>();
        priceEntries.forEach(([z, rows]) => {
          rows.forEach((row) => {
            const key = isDaily
              ? (row as DailyMarketPrice).date
              : (row as MarketPrice).ts;
            const val = isDaily
              ? (row as DailyMarketPrice).avg_eur_per_mwh
              : (row as MarketPrice).eur_per_mwh;
            if (!map.has(key)) map.set(key, { _key: key });
            map.get(key)![z] = val;
          });
        });
        const merged = Array.from(map.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, vals]) => vals);

        setMergedPrices(merged);
      })
      .catch(console.error)
      .finally(() => setPricesLoading(false));
  }, [zones, startDate, endDate, token, isDaily]);

  useEffect(() => {
    if (!startDate || !endDate) {
      setCosts([]);
      return;
    }
    const startYear = parseInt(startDate.slice(0, 4));
    const startMonth = parseInt(startDate.slice(5, 7));
    const endYear = parseInt(endDate.slice(0, 4));
    const endMonth = parseInt(endDate.slice(5, 7));
    const monthKeys: Array<{ year: number; month: number }> = [];
    for (let y = startYear; y <= endYear; y++) {
      const mStart = y === startYear ? startMonth : 1;
      const mEnd = y === endYear ? endMonth : 12;
      for (let m = mStart; m <= mEnd; m++) monthKeys.push({ year: y, month: m });
    }

    setCostsLoading(true);
    Promise.all(monthKeys.map(({ year, month }) => getMonthlyCosts(token, year, month)))
      .then((costArrays) => setCosts(costArrays.flat()))
      .catch(console.error)
      .finally(() => setCostsLoading(false));
  }, [startDate, endDate, token]);

  const loading = pricesLoading || costsLoading;

  const costByCategory = (() => {
    const map = new Map<string, number>();
    costs.forEach(({ category, amount_eur }) => {
      map.set(category, (map.get(category) ?? 0) + Number(amount_eur));
    });
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
  })();

  const formatX = isDaily ? formatDailyTs : formatHourlyTs;
  const priceLabel = isDaily ? "Avg €/MWh" : "€/MWh";

  return (
    <div className="mt-12 pt-10 border-t border-th">
      <h2 className="text-2xl font-semibold text-t50 mb-8">Financial</h2>

      {loading ? (
        <div className="flex items-center gap-2.5 text-t500 py-8">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-sm">Loading financial data…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Market prices — always dark */}
          <div
            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800/60"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-semibold text-zinc-100">Market Prices</h3>
              <span className="text-zinc-600 text-sm font-normal">({priceLabel})</span>
            </div>
            {mergedPrices.length === 0 ? (
              <p className="text-zinc-600 text-sm py-10 text-center">No data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mergedPrices} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="_key"
                    tickFormatter={formatX}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                    minTickGap={60}
                  />
                  <YAxis tick={{ fill: "#71717a", fontSize: 12 }} width={52} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10 }}
                    labelStyle={{ color: "#a1a1aa", fontSize: 12 }}
                    itemStyle={{ fontSize: 13 }}
                    labelFormatter={(l: unknown) => formatX(String(l))}
                  />
                  <Legend wrapperStyle={{ fontSize: 13, color: "#a1a1aa" }} />
                  {zones.map((z) => (
                    <Line
                      key={z}
                      type="monotone"
                      dataKey={z}
                      name={z.replace("_", " ")}
                      stroke={ZONE_COLORS[z] ?? "#a78bfa"}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly costs — always dark */}
          <div
            className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800/60"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <h3 className="text-base font-semibold text-zinc-100">Monthly Costs</h3>
              <span className="text-zinc-600 text-sm font-normal">(€ — all months in range)</span>
            </div>
            {costByCategory.length === 0 ? (
              <p className="text-zinc-600 text-sm py-10 text-center">No data for this period</p>
            ) : (
              <div className="flex flex-col gap-3">
                {costByCategory.map(({ category, total }) => {
                  const max = costByCategory[0].total;
                  const pct = max > 0 ? (total / max) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center gap-4">
                      <span className="w-32 text-sm text-zinc-400 capitalize shrink-0">{category.replace("_", " ")}</span>
                      <div className="flex-1 bg-zinc-800 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-zinc-300 w-28 text-right shrink-0 tabular-nums">
                        €{total.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
