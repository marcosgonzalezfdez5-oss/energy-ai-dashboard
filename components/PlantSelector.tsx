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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-xl bg-white text-left flex items-center justify-between hover:bg-[#FFFBF5] focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-100 transition-all text-[#111111]"
      >
        <span className="font-500">
          {selectedPlant?.name || 'Select a plant...'}
        </span>
        <svg className={`w-5 h-5 text-[#6B7280] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-10 overflow-hidden">
          {plants.map((plant) => (
            <button
              key={plant.id}
              onClick={() => {
                onSelectPlant(plant);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-[#F9F7F3] transition-colors border-b border-[#E5E7EB] last:border-b-0 ${
                selectedPlant?.id === plant.id ? 'bg-[#FFFBF5] border-l-4 border-l-[#F59E0B]' : ''
              }`}
            >
              <p className="font-600 text-[#111111]">{plant.name}</p>
              <p className="text-sm text-[#6B7280] mt-1">{plant.location} • {plant.capacity_kw} kW</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
