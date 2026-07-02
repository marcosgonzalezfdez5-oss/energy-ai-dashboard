'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { canAccessField } from '@/lib/rbac';

interface MetricData {
  date: string;
  value: number;
  moving?: number;
}

interface MetricCardProps {
  title: string;
  unit: string;
  value: number;
  subtitle: string;
  data: MetricData[];
  userRole: string;
  fieldName: string;
}

export default function MetricCard({
  title,
  unit,
  value,
  subtitle,
  data,
  userRole,
  fieldName,
}: MetricCardProps) {
  const isAccessible = canAccessField(fieldName, userRole as any);

  if (!isAccessible) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-gray-600 font-semibold">{title}</p>
          <p className="text-sm text-gray-500">Restricted for operators</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dark-card rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-white text-sm opacity-80">
          {title} <span className="text-gray-400">({unit})</span>
        </h3>
        <p className="text-4xl font-bold text-white mt-2">{value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
      </div>

      <div className="h-64 w-full -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="date"
              stroke="#666"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <YAxis
              stroke="#666"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#999' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
              }}
              formatter={(value: number) => [value.toFixed(2), '']}
              labelStyle={{ color: '#999' }}
            />
            {data[0]?.moving !== undefined && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#FFA500"
              dot={false}
              strokeWidth={2}
              name="Actual"
              isAnimationActive={false}
            />
            {data[0]?.moving !== undefined && (
              <Line
                type="monotone"
                dataKey="moving"
                stroke="#64748b"
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Moving Avg (7d)"
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
