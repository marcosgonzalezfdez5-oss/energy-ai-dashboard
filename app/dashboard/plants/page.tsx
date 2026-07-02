'use client';

import { useEffect, useState } from 'react';
import { getUserContext } from '@/lib/auth';
import { supabaseClient, getPlantsByCompany, getHourlyMetrics, aggregateMetrics, calculateMovingAverage } from '@/lib/supabase';
import PlantDashboard from '@/components/PlantDashboard';
import PlantSelector from '@/components/PlantSelector';
import FloatingChatButton from '@/components/FloatingChatButton';

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
    <div className="p-8 bg-[#FAF8F4] min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-[#111111] mb-3">Plant Dashboard</h1>
        <p className="text-lg text-[#6B7280]">Monitor your solar plant performance in real-time</p>
      </div>

      {plants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-sm">
          <svg className="w-16 h-16 text-[#D1D5DB] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#6B7280]">No plants found for your company.</p>
        </div>
      ) : (
        <>
          {/* Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12 items-end">
            <div>
              <label className="block text-sm font-600 text-[#111111] mb-2">Plant</label>
              <PlantSelector
                plants={plants}
                selectedPlant={selectedPlant}
                onSelectPlant={setSelectedPlant}
              />
            </div>
            
            <div>
              <label className="block text-sm font-600 text-[#111111] mb-2">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl bg-white text-[#111111] focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-600 text-[#111111] mb-2">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl bg-white text-[#111111] focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>

            <button
              className="w-full bg-[#F59E0B] hover:bg-[#EA9200] text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              Apply Filters
            </button>
          </div>

          {/* Dashboard content */}
          {selectedPlant && (
            <PlantDashboard 
              plant={selectedPlant} 
              startDate={startDate}
              endDate={endDate}
              userRole={userRole}
            />
          )}

          {/* Floating chat button */}
          <FloatingChatButton />
        </>
      )}
    </div>
  );
}
