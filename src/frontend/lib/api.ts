// Base URL is empty — all paths are relative to the Next.js origin (/api/...).
const API = "";

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export type UserProfile = {
  profile_id: string;
  company_id: string;
  email: string;
  role: string;
  access_scope: string;
};

export type Plant = {
  id: string;
  external_id: number;
  name: string;
  nominal_power: number | null;
  region: string | null;
  commissioning_date: string | null;
};

export type Datasource = {
  id: string;
  external_id: number;
  name: string;
  units: string | null;
  default_aggregation: string | null;
};

export type Reading = { ts: string; value: number };
export type DailyReading = { date: string; total_value: number };
export type PlantDailyEnergy = { date: string; total_kwh: number };

export type MarketPrice = { zone: string; ts: string; eur_per_mwh: number };
export type DailyMarketPrice = { zone: string; date: string; avg_eur_per_mwh: number };
export type MonthlyCost = {
  plant_id: string;
  year: number;
  month: number;
  category: string;
  amount_eur: number;
  notes: string | null;
};

export type DataRange = { min_date: string | null; max_date: string | null };

export const getMe = (token: string): Promise<UserProfile> =>
  apiFetch("/api/me", token);

export const getPlants = (token: string): Promise<Plant[]> =>
  apiFetch("/api/plants", token);

export const getDataRange = (token: string, plantId: string): Promise<DataRange> =>
  apiFetch(`/api/plants/${plantId}/data-range`, token);

export const getDatasources = (token: string, plantId: string): Promise<Datasource[]> =>
  apiFetch(`/api/plants/${plantId}/datasources`, token);

export const getReadings = (
  token: string,
  datasourceId: string,
  start: string,
  end: string
): Promise<Reading[]> =>
  apiFetch(`/api/readings?datasource_id=${datasourceId}&start=${start}&end=${end}`, token);

export const getDailyReadings = (
  token: string,
  datasourceId: string,
  start: string,
  end: string
): Promise<DailyReading[]> =>
  apiFetch(`/api/datasources/${datasourceId}/daily-energy?start=${start}&end=${end}`, token);

export const getPlantDailyEnergy = (
  token: string,
  plantId: string,
  start: string,
  end: string
): Promise<PlantDailyEnergy[]> =>
  apiFetch(`/api/plants/${plantId}/daily-energy?start=${start}&end=${end}`, token);

export const getDatasourceDailyAvg = (
  token: string,
  datasourceId: string,
  start: string,
  end: string
): Promise<DailyReading[]> =>
  apiFetch(`/api/datasources/${datasourceId}/daily-avg?start=${start}&end=${end}`, token);

export const getMarketPriceZones = (token: string): Promise<string[]> =>
  apiFetch("/api/market-prices/zones", token);

export const getDailyMarketPrices = (
  token: string,
  zone: string,
  start: string,
  end: string
): Promise<DailyMarketPrice[]> =>
  apiFetch(`/api/market-prices/daily?zone=${zone}&start=${start}&end=${end}`, token);

export const getMarketPrices = (
  token: string,
  zone: string,
  start: string,
  end: string
): Promise<MarketPrice[]> =>
  apiFetch(`/api/market-prices?zone=${zone}&start=${start}&end=${end}`, token);

export const getMonthlyCosts = (
  token: string,
  year: number,
  month: number
): Promise<MonthlyCost[]> =>
  apiFetch(`/api/monthly-costs?year=${year}&month=${month}`, token);
