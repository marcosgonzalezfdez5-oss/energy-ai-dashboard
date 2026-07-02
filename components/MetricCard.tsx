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
      <div className="bg-white rounded-2xl p-8 flex items-center justify-center border-2 border-dashed border-[#E5E7EB] shadow-sm">
        <div className="text-center">
          <svg className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-[#6B7280] font-600 mt-2">{title}</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Restricted access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#171717] rounded-2xl p-7 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white text-sm font-600">
              {title} <span className="text-gray-500 font-400">({unit})</span>
            </h3>
          </div>
        </div>
        <p className="text-4xl font-bold text-white mt-3">{value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        <p className="text-gray-500 text-xs mt-2">{subtitle}</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="date"
              stroke="#4B5563"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
              axisLine={false}
            />
            <YAxis
              stroke="#4B5563"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #4B5563',
                borderRadius: '10px',
                color: '#fff',
              }}
              formatter={(value: number) => [value.toFixed(2), '']}
              labelStyle={{ color: '#9CA3AF' }}
              cursor={{ stroke: '#F59E0B', strokeWidth: 1, opacity: 0.3 }}
            />
            {data[0]?.moving !== undefined && <Legend wrapperStyle={{ paddingTop: '16px' }} />}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#F59E0B"
              dot={false}
              strokeWidth={2.5}
              name="Actual"
              isAnimationActive={true}
              animationDuration={1000}
            />
            {data[0]?.moving !== undefined && (
              <Line
                type="monotone"
                dataKey="moving"
                stroke="#60A5FA"
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Moving Avg (7d)"
                isAnimationActive={true}
                animationDuration={1000}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
