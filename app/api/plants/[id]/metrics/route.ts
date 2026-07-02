import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth';
import { getPlant, getHourlyMetrics, aggregateMetrics } from '@/lib/supabase';
import { canAccessField } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userContext = await getUserContext();

    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plant = await getPlant(id);

    if (!plant || plant.company_id !== userContext.companyId) {
      return NextResponse.json(
        { error: 'Plant not found or access denied' },
        { status: 404 }
      );
    }

    // Get date range from query params
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    const metrics = await getHourlyMetrics(id, startDate, endDate);
    const aggregated = aggregateMetrics(metrics);

    return NextResponse.json({
      plant,
      metrics,
      aggregated,
      period: { startDate, endDate },
    });
  } catch (error) {
    console.error('[v0] Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
