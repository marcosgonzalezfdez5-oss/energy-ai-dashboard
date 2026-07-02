import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth';
import { getPlant, getMonthlyCosts } from '@/lib/supabase';

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

    // Only admins can access financial data
    if (userContext.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const plant = await getPlant(id);

    if (!plant || plant.company_id !== userContext.companyId) {
      return NextResponse.json(
        { error: 'Plant not found or access denied' },
        { status: 404 }
      );
    }

    const costs = await getMonthlyCosts(id);

    return NextResponse.json({
      plant,
      costs,
    });
  } catch (error) {
    console.error('[v0] Error fetching monthly costs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
