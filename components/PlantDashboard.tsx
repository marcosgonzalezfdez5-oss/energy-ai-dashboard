'use client';

import { useEffect, useState } from 'react';
import { getHourlyMetrics, aggregateMetrics, calculateMovingAverage, HourlyMetric } from '@/lib/supabase';
import { canAccessField } from '@/lib/rbac';
import MetricCard from './MetricCard';

interface Plant {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  commissioned_date: string;
}

interface PlantDashboardProps {
  plant: Plant;
  startDate: string;
  endDate: string;
  userRole: string;
}

export default function PlantDashboard({ plant, startDate, endDate, userRole }: PlantDashboardProps) {
  const [metrics, setMetrics] = useState<HourlyMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const data = await getHourlyMetrics(plant.id, startDate, endDate);
        setMetrics(data);
      } catch (err) {
        console.error('[v0] Error loading metrics:', err);
        setError('Failed to load metrics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [plant.id, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-2 text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  const aggregated = aggregateMetrics(metrics);

  // Prepare data for charts
  const chartData = metrics.map((m) => ({
    timestamp: new Date(m.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
    energy: m.energy_produced_kwh,
    power: m.power_output_kw,
    irradiance: m.irradiance_w_m2,
    insolation: m.insolation_kwh_m2,
    temperature: m.temperature_celsius,
  }));

  const movingAvgEnergy = calculateMovingAverage(metrics.map((m) => m.energy_produced_kwh));
  const movingAvgPower = calculateMovingAverage(metrics.map((m) => m.power_output_kw));

  return (
    <div className="space-y-8">
      {/* Plant info header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-black mb-2">{plant.name}</h2>
        <p className="text-gray-600">
          {plant.location} • {plant.capacity_kw} kW • Commissioned {new Date(plant.commissioned_date).toLocaleDateString()}
        </p>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard
          title="Total meter energy"
          unit="kWh"
          value={aggregated.totalEnergy}
          subtitle={`kWh total • ${metrics.length} data points`}
          data={chartData.map((d, i) => ({ date: d.timestamp, value: d.energy, moving: movingAvgEnergy[i] }))}
          userRole={userRole}
          fieldName="energy_produced"
        />

        <MetricCard
          title="Power"
          unit="kW"
          value={aggregated.totalPower}
          subtitle={`kW total • ${metrics.length} data points`}
          data={chartData.map((d, i) => ({ date: d.timestamp, value: d.power, moving: movingAvgPower[i] }))}
          userRole={userRole}
          fieldName="power_output"
        />

        <MetricCard
          title="Average irradiance"
          unit="W/m2"
          value={aggregated.avgIrradiance}
          subtitle={`W/m2 avg • ${metrics.length} data points`}
          data={chartData.map((d) => ({ date: d.timestamp, value: d.irradiance }))}
          userRole={userRole}
          fieldName="irradiance"
        />

        <MetricCard
          title="Average insolation"
          unit="kWh/m2"
          value={aggregated.avgInsolation}
          subtitle={`kWh/m2 avg • ${metrics.length} data points`}
          data={chartData.map((d) => ({ date: d.timestamp, value: d.insolation }))}
          userRole={userRole}
          fieldName="insolation"
        />
      </div>

      {/* Temperature info card */}
      <div className="bg-dark-card dark-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Temperature</h3>
        <div className="text-4xl font-bold text-primary">{aggregated.avgTemperature}°C</div>
        <p className="text-gray-400 text-sm mt-2">Average temperature • {metrics.length} data points</p>
      </div>
    </div>
  );
}
