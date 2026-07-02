'use client';

import { useEffect, useState } from 'react';
import { getUserContext } from '@/lib/auth';
import { supabaseClient, getPlantsByCompany } from '@/lib/supabase';

interface Plant {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  commissioned_date: string;
}

export default function DashboardPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const userContext = await getUserContext();
        if (userContext) {
          setUserRole(userContext.role);
          const companyPlants = await getPlantsByCompany(userContext.companyId);
          setPlants(companyPlants);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading plants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome! You are logged in as <span className="font-semibold">{userRole}</span>
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-4">Your Plants</h2>
        
        {plants.length === 0 ? (
          <p className="text-gray-600">No plants found for your company.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map((plant) => (
              <div key={plant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-black mb-2">{plant.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Location: {plant.location}</p>
                  <p>Capacity: {plant.capacity_kw} kW</p>
                  <p>Commissioned: {new Date(plant.commissioned_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">RBAC Status</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>✓ You are authenticated</p>
          <p>✓ Your role: <span className="font-semibold">{userRole}</span></p>
          <p>
            {userRole === 'admin' 
              ? '✓ You have access to all data including financial information'
              : '✓ You have access to operational metrics (temperature, insolation, irradiance, energy, power)'}
          </p>
          {userRole === 'operator' && (
            <p className="text-orange-700 font-semibold">⚠ Financial data (costs, prices) is restricted</p>
          )}
        </div>
      </div>
    </div>
  );
}
