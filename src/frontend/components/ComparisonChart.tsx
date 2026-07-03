'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export type ChartSeries = {
  name: string;
  color: string;
  data: { date: string; value: number }[];
};

type Props = {
  title: string;
  unit: string;
  series: ChartSeries[];
};

function formatDate(d: string) {
  const [, m, day] = d.split("-");
  return `${parseInt(m)}/${parseInt(day)}`;
}

type MergedPoint = Record<string, string | number>;

function mergeSeriesData(series: ChartSeries[]): MergedPoint[] {
  const map = new Map<string, MergedPoint>();
  for (const s of series) {
    for (const { date, value } of s.data) {
      if (!map.has(date)) map.set(date, { date });
      map.get(date)![s.name] = value;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
}

export default function ComparisonChart({ title, unit, series }: Props) {
  const chartData = mergeSeriesData(series);
  const hasData = series.some((s) => s.data.length > 0);

  return (
    <div
      className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800/60 hover:-translate-y-0.5 transition-transform duration-200"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,.25)" }}
    >
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <span className="text-zinc-600 text-sm font-normal">({unit})</span>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <span
                className="inline-block w-5 h-0.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-zinc-400">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="text-zinc-600 text-sm py-10 text-center">No data for this period</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "#71717a", fontSize: 12 }}
              minTickGap={40}
            />
            <YAxis tick={{ fill: "#71717a", fontSize: 12 }} width={52} />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 10,
              }}
              labelStyle={{ color: "#a1a1aa", fontSize: 12 }}
              itemStyle={{ fontSize: 13 }}
              labelFormatter={(label) => formatDate(String(label))}
              formatter={(v: unknown, name: unknown) => [
                `${typeof v === "number" ? v.toFixed(2) : v} ${unit}`,
                String(name),
              ]}
            />
            {series.map((s) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
