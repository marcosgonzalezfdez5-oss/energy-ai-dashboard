import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid errors during build
let supabaseClientInstance: any = null;
let supabaseAdminInstance: any = null;

function getSupabaseClient() {
  if (supabaseClientInstance) return supabaseClientInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key are required');
  }
  
  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClientInstance;
}

function getSupabaseAdmin() {
  if (supabaseAdminInstance) return supabaseAdminInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL is required');
  }
  
  if (supabaseServiceKey) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  
  return supabaseAdminInstance;
}

// Client-side Supabase client (anonymous key)
export const supabaseClient = {
  auth: {
    getSession: () => getSupabaseClient().auth.getSession(),
    getUser: () => getSupabaseClient().auth.getUser(),
    signInWithPassword: (credentials: any) => getSupabaseClient().auth.signInWithPassword(credentials),
    signUp: (options: any) => getSupabaseClient().auth.signUp(options),
    signOut: () => getSupabaseClient().auth.signOut(),
  },
  from: (table: string) => getSupabaseClient().from(table),
};

// Server-side Supabase client (service key - use for admin operations)
export function getAdmin() {
  return getSupabaseAdmin();
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  capacity_kw: number;
  commissioned_date: string;
  company_id: string;
  created_at: string;
}

export interface HourlyMetric {
  id: string;
  plant_id: string;
  timestamp: string;
  energy_produced_kwh: number;
  power_output_kw: number;
  insolation_kwh_m2: number;
  irradiance_w_m2: number;
  temperature_celsius: number;
}

export interface MonthlyCost {
  id: string;
  plant_id: string;
  month: string;
  cost_amount: number;
  energy_price: number;
  created_at: string;
}

/**
 * Get all plants for a specific company
 */
export async function getPlantsByCompany(companyId: string): Promise<Plant[]> {
  const { data, error } = await supabaseClient
    .from('plants')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) {
    console.error('[v0] Error fetching plants:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a specific plant
 */
export async function getPlant(plantId: string): Promise<Plant | null> {
  const { data, error } = await supabaseClient
    .from('plants')
    .select('*')
    .eq('id', plantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[v0] Error fetching plant:', error);
  }

  return data || null;
}

/**
 * Get hourly metrics for a plant within a date range
 */
export async function getHourlyMetrics(
  plantId: string,
  startDate: string,
  endDate: string,
): Promise<HourlyMetric[]> {
  const { data, error } = await supabaseClient
    .from('hourly_metrics')
    .select('*')
    .eq('plant_id', plantId)
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('[v0] Error fetching hourly metrics:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get monthly cost data for a plant
 * ADMIN ONLY - use role check before calling
 */
export async function getMonthlyCosts(plantId: string): Promise<MonthlyCost[]> {
  const { data, error } = await supabaseClient
    .from('monthly_costs')
    .select('*')
    .eq('plant_id', plantId)
    .order('month', { ascending: false });

  if (error) {
    console.error('[v0] Error fetching monthly costs:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get monthly cost data for a specific month
 * ADMIN ONLY
 */
export async function getMonthlyCostByMonth(
  plantId: string,
  month: string,
): Promise<MonthlyCost | null> {
  const { data, error } = await supabaseClient
    .from('monthly_costs')
    .select('*')
    .eq('plant_id', plantId)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[v0] Error fetching monthly cost:', error);
  }

  return data || null;
}

/**
 * Calculate aggregated metrics from hourly data
 */
export function aggregateMetrics(metrics: HourlyMetric[]) {
  if (metrics.length === 0) {
    return {
      totalEnergy: 0,
      totalPower: 0,
      avgIrradiance: 0,
      avgInsolation: 0,
      avgTemperature: 0,
    };
  }

  const totalEnergy = metrics.reduce((sum, m) => sum + m.energy_produced_kwh, 0);
  const totalPower = metrics.reduce((sum, m) => sum + m.power_output_kw, 0);
  const avgIrradiance =
    metrics.reduce((sum, m) => sum + m.irradiance_w_m2, 0) / metrics.length;
  const avgInsolation =
    metrics.reduce((sum, m) => sum + m.insolation_kwh_m2, 0) / metrics.length;
  const avgTemperature =
    metrics.reduce((sum, m) => sum + m.temperature_celsius, 0) / metrics.length;

  return {
    totalEnergy: Math.round(totalEnergy * 100) / 100,
    totalPower: Math.round(totalPower * 100) / 100,
    avgIrradiance: Math.round(avgIrradiance * 100) / 100,
    avgInsolation: Math.round(avgInsolation * 1000) / 1000,
    avgTemperature: Math.round(avgTemperature * 100) / 100,
  };
}

/**
 * Calculate 7-day moving average for a metric
 */
export function calculateMovingAverage(values: number[], windowSize: number = 7) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
    const avg = values.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
    result.push(Math.round(avg * 100) / 100);
  }
  return result;
}
