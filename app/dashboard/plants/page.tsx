'use client';

import { useEffect, useState } from 'react';
import { getUserContext } from '@/lib/auth';
import { supabaseClient, getPlantsByCompany, getHourlyMetrics, aggregateMetrics, calculateMovingAverage } from '@/lib/supabase';
import PlantDashboard from '@/components/PlantDashboard';
import PlantSelector from '@/components/PlantSelector';

interface Plant {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  commissioned_date: string;
}

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const userContext = await getUserContext();
        if (userContext) {
          setUserRole(userContext.role);
          const companyPlants = await getPlantsByCompany(userContext.companyId);
          setPlants(companyPlants);
          if (companyPlants.length > 0) {
            setSelectedPlant(companyPlants[0]);
          }
        }
      } catch (error) {
        console.error('[v0] Error loading plants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlants();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2">Plant Dashboard</h1>
        <p className="text-gray-600">Monitor your solar plant performance in real-time</p>
      </div>

      {plants.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No plants found for your company.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
            <PlantSelector
              plants={plants}
              selectedPlant={selectedPlant}
              onSelectPlant={setSelectedPlant}
            />
            
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

            <div className="flex items-end">
              <button
                className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {selectedPlant && (
            <PlantDashboard 
              plant={selectedPlant} 
              startDate={startDate}
              endDate={endDate}
              userRole={userRole}
            />
          )}
        </>
      )}
    </div>
  );
}
