'use client';

import { useEffect, useState } from 'react';

interface Plant {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  commissioned_date: string;
}

interface PlantSelectorProps {
  plants: Plant[];
  selectedPlant: Plant | null;
  onSelectPlant: (plant: Plant) => void;
}

export default function PlantSelector({ plants, selectedPlant, onSelectPlant }: PlantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Select Plant</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <span className="text-gray-900">
          {selectedPlant?.name || 'Select a plant...'}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {plants.map((plant) => (
            <button
              key={plant.id}
              onClick={() => {
                onSelectPlant(plant);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-yellow-50 transition ${
                selectedPlant?.id === plant.id ? 'bg-yellow-100' : ''
              }`}
            >
              <p className="font-medium text-gray-900">{plant.name}</p>
              <p className="text-sm text-gray-600">{plant.location} • {plant.capacity_kw} kW</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
