'use client';

import { useEffect, useState } from 'react';
import { getUserContext } from '@/lib/auth';
import { supabaseClient, getPlantsByCompany, getHourlyMetrics, aggregateMetrics } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Plant {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  commissioned_date: string;
}

interface PlantComparison {
  name: string;
  totalEnergy: number;
  avgPower: number;
  capacity: number;
}

export default function ComparisonPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [comparisons, setComparisons] = useState<PlantComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userContext = await getUserContext();
        if (userContext) {
          const companyPlants = await getPlantsByCompany(userContext.companyId);
          setPlants(companyPlants);

          // Load metrics for all plants
          const comparisonsData: PlantComparison[] = [];
          for (const plant of companyPlants) {
            const metrics = await getHourlyMetrics(plant.id, startDate, endDate);
            const aggregated = aggregateMetrics(metrics);
            comparisonsData.push({
              name: plant.name,
              totalEnergy: aggregated.totalEnergy,
              avgPower: aggregated.totalPower / (metrics.length || 1),
              capacity: plant.capacity_kw,
            });
          }
          setComparisons(comparisonsData);
        }
      } catch (error) {
        console.error('[v0] Error loading comparison data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2">Plant Comparison</h1>
        <p className="text-gray-600">Compare performance across all your plants</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Energy comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Total Energy Produced</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisons}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                <Bar dataKey="totalEnergy" fill="#FFA500" name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Power comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-black mb-4">Average Power Output</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisons}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                <Bar dataKey="avgPower" fill="#FFD700" name="Power (kW)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed comparison table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Plant Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Energy (kWh)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Avg Power (kW)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Capacity (kW)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comp, idx) => {
              const efficiency = ((comp.totalEnergy / comp.capacity) * 100).toFixed(1);
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900">{comp.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{comp.totalEnergy.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{comp.avgPower.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{comp.capacity.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary">{efficiency}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
