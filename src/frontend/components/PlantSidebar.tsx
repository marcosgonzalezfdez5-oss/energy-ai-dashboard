'use client'

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plant } from "@/lib/api";

type Props = {
  plants: Plant[];
  selectedPlantId: string | null;
};

export default function PlantSidebar({ plants, selectedPlantId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("solar-expanded-plants");
      const parsed: string[] = saved ? JSON.parse(saved) : [];
      if (selectedPlantId && !parsed.includes(selectedPlantId)) {
        parsed.push(selectedPlantId);
      }
      return new Set(parsed);
    } catch {
      return new Set(selectedPlantId ? [selectedPlantId] : []);
    }
  });

  useEffect(() => {
    if (!selectedPlantId) return;
    setExpanded((prev) => {
      if (prev.has(selectedPlantId)) return prev;
      const next = new Set(prev);
      next.add(selectedPlantId);
      return next;
    });
  }, [selectedPlantId]);

  useEffect(() => {
    try {
      localStorage.setItem("solar-expanded-plants", JSON.stringify([...expanded]));
    } catch {}
  }, [expanded]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const isOverview = pathname === "/overview";

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      {/* Overview — company-wide comparison */}
      <div className="mb-3 pb-3 border-b border-th">
        <button
          onClick={() => router.push("/overview")}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
            isOverview
              ? "bg-amber-500/10 text-amber-400"
              : "text-t400 hover:bg-surface-60 hover:text-t200"
          }`}
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-[15px] font-semibold">Overview</span>
        </button>
      </div>

      {plants.length === 0 && (
        <p className="text-xs text-t600 px-3 py-4 text-center">Loading plants…</p>
      )}
      {plants.map((p) => {
        const isExpanded = expanded.has(p.id);
        const isActive = selectedPlantId === p.id;
        const isDashboard = isActive && pathname === "/dashboard";
        const isDaily = isActive && pathname === "/daily";

        return (
          <div key={p.id} className="mb-0.5">
            <button
              onClick={() => toggle(p.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left min-h-[44px] transition-colors ${
                isActive
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-t400 hover:bg-surface-60 hover:text-t200"
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold truncate">{p.name}</span>
                {p.region && (
                  <span className={`block text-[11px] mt-0.5 font-normal truncate ${isActive ? "text-amber-500/60" : "text-t600"}`}>
                    {p.region}
                  </span>
                )}
              </div>
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""} ${isActive ? "text-amber-500/50" : "text-t600"}`}
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div
              className={`grid transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <div className="pl-3 pt-0.5 pb-1 flex flex-col gap-0.5">
                  <button
                    onClick={() => router.push(`/dashboard?plant=${p.id}`)}
                    className={`w-full text-left pl-4 pr-3 py-2 rounded-lg text-[14px] transition-colors ${
                      isDashboard
                        ? "text-amber-500 bg-surface-60 font-medium"
                        : "text-t500 hover:text-t300 hover:bg-surface-40"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push(`/daily?plant=${p.id}`)}
                    className={`w-full text-left pl-4 pr-3 py-2 rounded-lg text-[14px] transition-colors ${
                      isDaily
                        ? "text-amber-500 bg-surface-60 font-medium"
                        : "text-t500 hover:text-t300 hover:bg-surface-40"
                    }`}
                  >
                    Daily Detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
