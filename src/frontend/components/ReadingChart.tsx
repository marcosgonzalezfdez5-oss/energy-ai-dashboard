'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChartPoint } from "@/lib/movingAverage";

type Props = {
  title: string;
  units: string;
  data: ChartPoint[];
  mode?: "hourly" | "daily";
  aggregation?: "sum" | "average";
};

function formatHourly(ts: string) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
}

function formatDaily(ts: string) {
  const [, m, d] = ts.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function ReadingChart({ title, units, data, mode = "hourly", aggregation = "sum" }: Props) {
  const isDaily = mode === "daily";
  const formatTs = isDaily ? formatDaily : formatHourly;
  const isAvg = aggregation === "average";

  const rawSum = data.reduce((s, d) => s + (d.value ?? 0), 0);
  const displayValue = isAvg && data.length > 0 ? rawSum / data.length : rawSum;
  const totalFormatted = displayValue.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div
      className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800/60 hover:-translate-y-0.5 transition-transform duration-200"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}
    >
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <span className="text-zinc-600 text-sm font-normal">({units})</span>
        </div>
        {data.length > 0 && (
          <>
            <p className="text-2xl font-bold text-zinc-50 tabular-nums tracking-tight">
              {totalFormatted}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">{units} {isAvg ? "avg" : "total"} · {data.length} data points</p>
          </>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-zinc-600 text-sm py-10 text-center">No data for this period</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="ts"
              tickFormatter={formatTs}
              tick={{ fill: "#71717a", fontSize: 12 }}
              minTickGap={40}
            />
            <YAxis tick={{ fill: "#71717a", fontSize: 12 }} width={52} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10 }}
              labelStyle={{ color: "#a1a1aa", fontSize: 12 }}
              itemStyle={{ fontSize: 13 }}
              labelFormatter={(label: unknown) => formatTs(String(label))}
              formatter={(v: unknown, name: unknown) => [
                `${typeof v === "number" ? v.toFixed(2) : v} ${units}`,
                name === "ma" ? "Moving Avg" : title,
              ]}
            />
            {isDaily && (
              <Legend
                formatter={(value) => (
                  <span style={{ color: "#a1a1aa", fontSize: 12 }}>
                    {value === "ma" ? "Moving Avg (7d)" : "Actual"}
                  </span>
                )}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
            />
            {isDaily && (
              <Line
                type="monotone"
                dataKey="ma"
                name="ma"
                stroke="#0ea5e9"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
