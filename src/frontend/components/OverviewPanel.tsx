'use client'

import { useEffect, useState } from "react";
import {
  getPlants,
  getDataRange,
  getDatasources,
  getDailyReadings,
  getPlantDailyEnergy,
  getDatasourceDailyAvg,
  Plant,
  Datasource,
  PlantDailyEnergy,
} from "@/lib/api";
import ComparisonChart, { ChartSeries } from "@/components/ComparisonChart";
import DatePicker from "@/components/DatePicker";

const PLANT_COLORS = ["#f59e0b", "#0ea5e9", "#14b8a6", "#fb923c", "#a78bfa"];

type MetricDatasources = {
  irradianceId?: string;
  insolationId?: string;
  powerId?: string;
  temperatureId?: string;
};

type Props = { token: string };

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function formatCommissionDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
}

function findDatasourceId(datasources: Datasource[], unit: string): string | undefined {
  return datasources.find((ds) => ds.units === unit)?.id;
}

export default function OverviewPanel({ token }: Props) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [metricMap, setMetricMap] = useState<Record<string, MetricDatasources>>({});
  const [loading, setLoading] = useState(false);

  const [energySeries, setEnergySeries] = useState<ChartSeries[]>([]);
  const [irradianceSeries, setIrradianceSeries] = useState<ChartSeries[]>([]);
  const [insolationSeries, setInsolationSeries] = useState<ChartSeries[]>([]);
  const [powerSeries, setPowerSeries] = useState<ChartSeries[]>([]);
  const [temperatureSeries, setTemperatureSeries] = useState<ChartSeries[]>([]);

  // Step 1: load plants
  useEffect(() => {
    getPlants(token).then(setPlants).catch(console.error);
  }, [token]);

  // Step 2: once plants are loaded, fetch data range + all datasources
  useEffect(() => {
    if (plants.length === 0) return;

    Promise.all([
      getDataRange(token, plants[0].id),
      ...plants.map((p) => getDatasources(token, p.id).then((ds) => ({ plantId: p.id, ds }))),
    ]).then(([range, ...dsResults]) => {
      if (range.min_date && range.max_date) {
        const min = toDateInput(range.min_date);
        const max = toDateInput(range.max_date);
        setMinDate(min);
        setMaxDate(max);
        setStartDate(min);
        setEndDate(max);
      }

      const map: Record<string, MetricDatasources> = {};
      for (const { plantId, ds } of dsResults as { plantId: string; ds: Datasource[] }[]) {
        map[plantId] = {
          irradianceId: findDatasourceId(ds, "W/m2"),
          insolationId: findDatasourceId(ds, "kWh/m2"),
          powerId: findDatasourceId(ds, "kW"),
          temperatureId: findDatasourceId(ds, "C"),
        };
      }
      setMetricMap(map);
    }).catch(console.error);
  }, [plants, token]);

  // Step 3: fetch chart data whenever dates or metric map are ready
  useEffect(() => {
    if (plants.length === 0 || !startDate || !endDate || Object.keys(metricMap).length === 0) return;

    setLoading(true);
    const start = `${startDate}T00:00:00Z`;
    const end = `${endDate}T23:59:59Z`;

    const plantFetches = plants.map((plant, idx) => {
      const color = PLANT_COLORS[idx % PLANT_COLORS.length];
      const metrics = metricMap[plant.id] ?? {};

      const energyFetch = getPlantDailyEnergy(token, plant.id, start, end).then((rows) => ({
        name: plant.name,
        color,
        data: rows.map((r) => ({ date: r.date, value: r.total_kwh })),
      }));

      const mkAvgFetch = (id?: string) =>
        id
          ? getDatasourceDailyAvg(token, id, start, end).then((rows) => ({
              name: plant.name, color,
              data: rows.map((r) => ({ date: r.date, value: r.total_value })),
            }))
          : Promise.resolve({ name: plant.name, color, data: [] as { date: string; value: number }[] });

      const mkSumFetch = (id?: string) =>
        id
          ? getDailyReadings(token, id, start, end).then((rows) => ({
              name: plant.name, color,
              data: rows.map((r) => ({ date: r.date, value: r.total_value })),
            }))
          : Promise.resolve({ name: plant.name, color, data: [] as { date: string; value: number }[] });

      return Promise.all([
        energyFetch,
        mkAvgFetch(metrics.irradianceId),
        mkAvgFetch(metrics.insolationId),
        mkSumFetch(metrics.powerId),
        mkAvgFetch(metrics.temperatureId),
      ]);
    });

    Promise.all(plantFetches)
      .then((results) => {
        setEnergySeries(results.map(([e]) => e));
        setIrradianceSeries(results.map(([, i]) => i));
        setInsolationSeries(results.map(([, , ins]) => ins));
        setPowerSeries(results.map(([, , , p]) => p));
        setTemperatureSeries(results.map(([, , , , t]) => t));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [plants, startDate, endDate, metricMap, token]);

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-5 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-t50 tracking-tight">Plant Overview</h1>
          <p className="text-base text-t400 mt-1.5">Compare all plants across key operational metrics</p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center bg-card border border-th rounded-xl transition-colors">
          <div className="flex items-center gap-2.5 px-4 py-3 border-r border-th">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-t500 shrink-0" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <DatePicker label="From" value={startDate} onChange={setStartDate} min={minDate} max={endDate} />
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <DatePicker label="To" value={endDate} onChange={setEndDate} min={startDate} max={maxDate} align="right" />
          </div>
        </div>
      </div>

      {/* Plant info cards */}
      {plants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {plants.map((plant, idx) => {
            const color = PLANT_COLORS[idx % PLANT_COLORS.length];
            const commissioned = formatCommissionDate(plant.commissioning_date);
            return (
              <div
                key={plant.id}
                className="bg-card border border-th rounded-xl p-4"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,.2)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <h2 className="text-sm font-semibold text-t50 truncate">{plant.name}</h2>
                </div>
                <dl className="space-y-1.5">
                  {plant.nominal_power != null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-xs text-t500">Nominal power</dt>
                      <dd className="text-xs text-t200 font-medium tabular-nums">{plant.nominal_power} kW</dd>
                    </div>
                  )}
                  {plant.region && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-xs text-t500">Region</dt>
                      <dd className="text-xs text-t200 font-medium truncate">{plant.region}</dd>
                    </div>
                  )}
                  {commissioned && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-xs text-t500">Commissioned</dt>
                      <dd className="text-xs text-t200 font-medium">{commissioned}</dd>
                    </div>
                  )}
                </dl>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="flex items-center gap-2.5 text-t500 py-8">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-sm">Loading data…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ComparisonChart title="Energy Produced" unit="kWh" series={energySeries} />
          <ComparisonChart title="Irradiance" unit="W/m2" series={irradianceSeries} />
          <ComparisonChart title="Insolation" unit="kWh/m2" series={insolationSeries} />
          <ComparisonChart title="Power Output" unit="kW" series={powerSeries} />
          <ComparisonChart title="Module Temperature" unit="°C" series={temperatureSeries} />
        </div>
      )}
    </div>
  );
}
